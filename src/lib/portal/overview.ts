// What a signed-in borrower sees at the top of the portal: their submitted
// applications and, if they stopped partway, the way back into the wizard.

import { listApplicationsByEmail, type ApplicationListItem } from "@/lib/db";
import { findOpenDraftByEmail, resumeTokenFor } from "@/lib/drafts/store";
import type { Borrower } from "./identity";

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
