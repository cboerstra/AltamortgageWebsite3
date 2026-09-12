"use client";

// The document checklist: one slot per document type, each with its
// uploaded files and a drop zone that resets after every upload.
//
// Uploads are chunked (start → parts → complete) because a single request
// to Vercel cannot exceed 4.5 MB. The SHA-256 is computed in the browser and
// sent with `complete` so the server can prove the bytes arrived intact.
//
// Drag-and-drop is a convenience layered over a real <input type="file">,
// which is what keyboard and screen-reader users get.

import { useCallback, useRef, useState } from "react";
import { Icons } from "@/lib/icons";
import {
  ALLOWED_TYPES,
  MAX_FILE_BYTES,
  SLOTS,
  type BorrowerDocument,
  type SlotId,
} from "@/lib/portal/document-types";

type UploadPhase = "uploading" | "verifying";

interface PendingUpload {
  key: string;
  slot: SlotId;
  filename: string;
  progress: number; // 0..1
  phase: UploadPhase;
}

interface SlotError {
  slot: SlotId;
  message: string;
}

const ACCEPT = Object.entries(ALLOWED_TYPES)
  .flatMap(([mime, spec]) => [mime, ...spec.extensions])
  .join(",");

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function sha256Hex(file: File): Promise<string | undefined> {
  try {
    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return undefined; // Older browser; the server hashes anyway.
  }
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: unknown };
    return typeof body?.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

/** Some browsers report an empty type for PDFs; fall back to the extension. */
function inferMime(file: File): string {
  if (file.type && ALLOWED_TYPES[file.type]) return file.type;
  const ext = file.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";
  for (const [mime, spec] of Object.entries(ALLOWED_TYPES)) {
    if (spec.extensions.includes(ext)) return mime;
  }
  return file.type || "application/octet-stream";
}

async function uploadFile(
  slot: SlotId,
  file: File,
  onProgress: (fraction: number, phase: UploadPhase) => void
): Promise<BorrowerDocument> {
  const mimeType = inferMime(file);
  const [start, digest] = await Promise.all([
    fetch("/api/portal/documents/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot, filename: file.name, mimeType, byteSize: file.size }),
    }),
    sha256Hex(file),
  ]);
  if (!start.ok) throw new Error(await readError(start, "Could not start the upload."));
  const { documentId, partCount, chunkBytes } = (await start.json()) as {
    documentId: number;
    partCount: number;
    chunkBytes: number;
  };

  for (let index = 0; index < partCount; index++) {
    const chunk = file.slice(index * chunkBytes, Math.min((index + 1) * chunkBytes, file.size));
    let lastError = "Could not upload part of the file.";
    let ok = false;
    // One retry per part covers the transient failures that actually happen.
    for (let attempt = 0; attempt < 2 && !ok; attempt++) {
      const res = await fetch(`/api/portal/documents/${documentId}/parts/${index}`, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: chunk,
      });
      if (res.ok) ok = true;
      else {
        lastError = await readError(res, lastError);
        if (res.status < 500) break; // A 4xx will not improve on retry.
      }
    }
    if (!ok) throw new Error(lastError);
    onProgress((index + 1) / partCount, index + 1 === partCount ? "verifying" : "uploading");
  }

  const complete = await fetch(`/api/portal/documents/${documentId}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(digest ? { sha256: digest } : {}),
  });
  if (!complete.ok) throw new Error(await readError(complete, "Could not finish the upload."));
  return ((await complete.json()) as { document: BorrowerDocument }).document;
}

export function DocumentVault({ initialDocuments }: { initialDocuments: BorrowerDocument[] }) {
  const [documents, setDocuments] = useState<BorrowerDocument[]>(initialDocuments);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [errors, setErrors] = useState<SlotError[]>([]);
  const [dragOver, setDragOver] = useState<SlotId | null>(null);
  const inputs = useRef<Partial<Record<SlotId, HTMLInputElement | null>>>({});

  const setError = useCallback((slot: SlotId, message: string | null) => {
    setErrors((prev) => {
      const rest = prev.filter((e) => e.slot !== slot);
      return message ? [...rest, { slot, message }] : rest;
    });
  }, []);

  const handleFiles = useCallback(
    async (slot: SlotId, files: FileList | File[]) => {
      setError(slot, null);
      const list = Array.from(files);
      for (const file of list) {
        if (file.size > MAX_FILE_BYTES) {
          setError(slot, `${file.name} is over ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB.`);
          continue;
        }
        const key = `${slot}:${file.name}:${file.size}:${Date.now()}:${Math.random()}`;
        setPending((prev) => [...prev, { key, slot, filename: file.name, progress: 0, phase: "uploading" }]);
        try {
          const doc = await uploadFile(slot, file, (progress, phase) =>
            setPending((prev) => prev.map((p) => (p.key === key ? { ...p, progress, phase } : p)))
          );
          setDocuments((prev) => [...prev, doc]);
        } catch (err) {
          setError(slot, err instanceof Error ? err.message : "Upload failed.");
        } finally {
          setPending((prev) => prev.filter((p) => p.key !== key));
        }
      }
    },
    [setError]
  );

  const remove = useCallback(
    async (doc: BorrowerDocument) => {
      if (!window.confirm(`Remove ${doc.filename}?`)) return;
      const res = await fetch(`/api/portal/documents/${doc.id}`, { method: "DELETE" });
      if (res.ok) setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      else setError(doc.slot, await readError(res, "Could not remove that file."));
    },
    [setError]
  );

  return (
    <div className="space-y-5">
      {SLOTS.map((slot) => {
        const uploaded = documents.filter((d) => d.slot === slot.id);
        const inFlight = pending.filter((p) => p.slot === slot.id);
        const error = errors.find((e) => e.slot === slot.id)?.message;
        const complete = slot.required > 0 && uploaded.length >= slot.required;
        const isOver = dragOver === slot.id;

        return (
          <section
            key={slot.id}
            aria-labelledby={`slot-${slot.id}-title`}
            className={`rounded-xl border bg-white p-5 shadow-sm ${complete ? "border-emerald/40" : "border-border"}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 id={`slot-${slot.id}-title`} className="flex items-center gap-2 font-semibold text-text">
                  {complete && <Icons.check className="h-5 w-5 text-emerald" aria-hidden />}
                  {slot.label}
                  {slot.required > 0 && (
                    <span className="text-sm font-normal text-text-muted">
                      {Math.min(uploaded.length, slot.required)} of {slot.required}
                    </span>
                  )}
                </h3>
                <p className="mt-0.5 text-sm text-text-muted">{slot.hint}</p>
              </div>
            </div>

            {(uploaded.length > 0 || inFlight.length > 0) && (
              <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
                {uploaded.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <div className="flex min-w-0 items-center gap-3">
                      <Icons.check className="h-5 w-5 shrink-0 text-emerald" aria-hidden />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-text">{doc.filename}</div>
                        <div className="text-xs text-emerald">
                          Uploaded <span className="text-text-muted">· {humanSize(doc.byteSize)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(doc)}
                      className="inline-flex shrink-0 items-center gap-1 text-xs text-text-muted hover:text-error"
                      aria-label={`Remove ${doc.filename}`}
                    >
                      <Icons.remove className="h-4 w-4" /> Remove
                    </button>
                  </li>
                ))}
                {inFlight.map((p) => (
                  <li key={p.key} className="px-3 py-2.5 text-sm">
                    <div className="flex items-center gap-3">
                      <Icons.loading className="h-5 w-5 shrink-0 animate-spin text-navy" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-text">{p.filename}</div>
                        <div className="text-xs text-text-muted">
                          {p.phase === "verifying" ? "Verifying…" : `Uploading… ${Math.round(p.progress * 100)}%`}
                        </div>
                        <div className="mt-1 h-1 w-full overflow-hidden rounded bg-surface">
                          <div className="h-full bg-navy transition-all" style={{ width: `${Math.round(p.progress * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* The drop zone. Always present and always empty: it resets after
                each upload so the next file goes in the same way. */}
            <div
              role="button"
              tabIndex={0}
              aria-label={`Upload ${slot.label.toLowerCase()}`}
              onClick={() => inputs.current[slot.id]?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  inputs.current[slot.id]?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(slot.id);
              }}
              onDragLeave={() => setDragOver((s) => (s === slot.id ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                if (e.dataTransfer.files.length > 0) handleFiles(slot.id, e.dataTransfer.files);
              }}
              className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy ${
                isOver ? "border-navy bg-navy/5" : "border-border hover:border-navy/50 hover:bg-surface"
              }`}
            >
              <Icons.upload className="h-7 w-7 text-navy" aria-hidden />
              <div className="mt-2 text-sm font-medium text-text">
                {isOver ? "Drop to upload" : "Drag a file here, or click to choose"}
              </div>
              <div className="mt-0.5 text-xs text-text-muted">PDF, JPG or PNG · up to 25 MB</div>
              <input
                ref={(el) => {
                  inputs.current[slot.id] = el;
                }}
                type="file"
                accept={ACCEPT}
                multiple
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files?.length) handleFiles(slot.id, e.target.files);
                  e.target.value = ""; // so the same file can be chosen again
                }}
              />
            </div>

            {error && (
              <p role="alert" className="mt-3 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
                {error}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
