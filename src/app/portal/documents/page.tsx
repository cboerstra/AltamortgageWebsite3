import type { Metadata } from "next";
import Link from "next/link";
import { requireBorrowerPage } from "@/lib/portal/session";
import { listBorrowerDocuments } from "@/lib/portal/documents";
import { documentProgress } from "@/lib/portal/document-types";
import { Icons } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Your documents",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * The page after the upload checklist: what has arrived and what is still
 * outstanding, read fresh from the server so it reflects what was actually
 * stored, not what the browser believes it sent.
 */
export default async function PortalDocumentsPage() {
  const borrower = await requireBorrowerPage();
  const progress = documentProgress(await listBorrowerDocuments(borrower.id));
  const outstanding = progress.slots.filter((s) => s.remaining > 0);
  const received = progress.slots.filter((s) => s.documents.length > 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/portal" className="inline-flex items-center gap-1 text-sm text-navy hover:underline">
        <Icons.prev className="h-4 w-4" /> Back to your application
      </Link>

      {progress.allRequiredReceived ? (
        <div className="mt-6 rounded-xl border border-emerald/40 bg-emerald/5 p-6 text-center">
          <Icons.success className="mx-auto h-14 w-14 text-emerald" aria-hidden />
          <h1 className="mt-3 text-2xl font-bold text-navy">All required documents received</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
            Thank you. Your loan specialist can see everything below and will contact you if
            anything else is needed.
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-gold/40 bg-surface-warm p-6">
          <h1 className="text-2xl font-bold text-navy">
            {progress.received} of {progress.required} required documents uploaded
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            {progress.required - progress.received} still needed. Everything you have uploaded is
            saved — you can come back and finish any time.
          </p>
          <div
            className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={progress.required}
            aria-valuenow={progress.received}
            aria-label="Required documents uploaded"
          >
            <div
              className="h-full rounded-full bg-navy"
              style={{ width: `${Math.round((progress.received / progress.required) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {outstanding.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-navy">Still needed</h2>
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-white">
            {outstanding.map(({ slot, counted, remaining }) => (
              <li key={slot.id} className="flex items-start gap-3 p-4">
                <Icons.warning className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
                <div>
                  <div className="font-medium text-text">
                    {slot.label}{" "}
                    <span className="font-normal text-text-muted">
                      — {remaining} more needed ({counted} of {slot.required} uploaded)
                    </span>
                  </div>
                  <div className="text-sm text-text-muted">{slot.hint}</div>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/portal#documents"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light"
          >
            <Icons.upload className="h-4 w-4" /> Upload the rest
          </Link>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-navy">Received</h2>
        {received.length === 0 ? (
          <p className="mt-3 rounded-xl border border-border bg-white p-4 text-sm text-text-muted">
            Nothing uploaded yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-white">
            {received.map(({ slot, documents, complete }) => (
              <li key={slot.id} className="p-4">
                <div className="flex items-center gap-2 font-medium text-text">
                  {complete || slot.required === 0 ? (
                    <Icons.check className="h-5 w-5 text-emerald" aria-hidden />
                  ) : (
                    <Icons.document className="h-5 w-5 text-text-muted" aria-hidden />
                  )}
                  {slot.label}
                  {slot.required > 0 && (
                    <span className="text-sm font-normal text-text-muted">
                      {Math.min(documents.length, slot.required)} of {slot.required}
                    </span>
                  )}
                </div>
                <ul className="mt-2 space-y-1 pl-7 text-sm">
                  {documents.map((doc) => (
                    <li key={doc.id} className="flex flex-wrap justify-between gap-x-3">
                      <span className="truncate text-text">{doc.filename}</span>
                      <span className="text-text-muted">{when(doc.completedAt ?? doc.uploadedAt)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      {progress.allRequiredReceived && (
        <p className="mt-6 text-sm text-text-muted">
          Need to send something else?{" "}
          <Link href="/portal#documents" className="text-navy underline underline-offset-2">
            Upload more documents
          </Link>
          .
        </p>
      )}
    </div>
  );
}
