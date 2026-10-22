// What a signed-in borrower sees at the top of the portal: their submitted
// applications and, if they stopped partway, the way back into the wizard.

import { getApplicationByRef, listApplicationsByEmail, type ApplicationListItem } from "@/lib/db";
import { findOpenDraftByEmail, resumeTokenFor } from "@/lib/drafts/store";
import type { Borrower } from "./identity";
import { applicantsFromPayload, documentSlots, type SlotSpec } from "./document-types";

export interface OpenDraft {
  furthestStep: number;
  lastActivityAt: string;
  /** Null when DRAFT_LINK_KEY is unset or has changed since the draft began. */
  resumeUrl: string | null;
}

export interface BorrowerOverview {
  applications: ApplicationListItem[];
  draft: OpenDraft | null;
}

export async function getBorrowerOverview(borrower: Borrower): Promise<BorrowerOverview> {
  const [applications, draft] = await Promise.all([
    listApplicationsByEmail(borrower.email),
    findOpenDraftByEmail(borrower.email),
  ]);

  let openDraft: OpenDraft | null = null;
  if (draft && !draft.optedOut) {
    const token = resumeTokenFor(draft);
    openDraft = {
      furthestStep: draft.furthestStep,
      lastActivityAt: draft.updatedAt.toISOString(),
      resumeUrl: token ? `/apply?resume=${encodeURIComponent(token)}` : null,
    };
  }

  return { applications, draft: openDraft };
}

/**
 * The document list for this borrower, tailored to their latest submitted
 * application, or to an unfinished one when that is all there is.
 */
export async function getDocumentPlan(email: string): Promise<SlotSpec[]> {
  const [latest] = await listApplicationsByEmail(email);
  if (latest) {
    const app = await getApplicationByRef(latest.refNumber);
    const applicants = applicantsFromPayload(app?.rawPayload);
    if (applicants.length > 0) return documentSlots(applicants);
  }
  const draft = await findOpenDraftByEmail(email);
  return documentSlots(applicantsFromPayload(draft?.data));
}
