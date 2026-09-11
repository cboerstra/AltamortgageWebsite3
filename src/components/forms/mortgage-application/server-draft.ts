// Client side of /api/drafts.
//
// Everything here is best effort and silent on failure. The server draft is
// the cross-device fallback; the localStorage draft is the one the applicant
// is actually working from. A network blip must never interrupt the wizard.

import type { ApplicationFormData } from "@/lib/schemas";
import { STORAGE_VERSION, readDraftToken, writeDraftToken } from "./draft-storage";

export interface ServerDraft {
  data: Partial<ApplicationFormData>;
  furthestStep: number;
  schemaVersion: number;
}

/**
 * Push the current answers to the server. Creates a draft on the first call
 * and keeps its token; updates it on later calls.
 */
export async function syncServerDraft(
  values: ApplicationFormData,
  furthestStep: number
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ssn: _ssn, ...data } = values;
  const token = readDraftToken();

  try {
    const res = await fetch("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(token ? { token } : {}),
        data,
        furthestStep,
        schemaVersion: STORAGE_VERSION,
      }),
      keepalive: true,
    });
    if (!res.ok) return;

    const body = (await res.json()) as { token?: string };
    if (!token && typeof body.token === "string") writeDraftToken(body.token);
  } catch {
    // Offline or the endpoint is down. The local draft is unaffected.
  }
}

export type ResumeResult =
  | { status: "ok"; draft: ServerDraft }
  | { status: "expired" }
  | { status: "unavailable" };

/** Fetch a draft by the token from a resume link. */
export async function loadServerDraft(token: string): Promise<ResumeResult> {
  try {
    const res = await fetch(`/api/drafts?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
    if (res.status === 404) return { status: "expired" };
    if (!res.ok) return { status: "unavailable" };

    const draft = (await res.json()) as ServerDraft;
    // A draft from an older form is not restored; the fields may not line up.
    if (draft.schemaVersion !== STORAGE_VERSION) return { status: "expired" };
    return { status: "ok", draft };
  } catch {
    return { status: "unavailable" };
  }
}
