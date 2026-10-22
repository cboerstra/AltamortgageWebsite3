// Client-safe definitions for the document vault: slots, limits, allowed
// types, and the record shape. No Node imports — this file is bundled into
// the browser. Server-only logic lives in documents.ts.

// ---- Slots ------------------------------------------------------------------

export const SLOT_IDS = ["bank_statement", "w2", "paystub", "tax_return", "other"] as const;
export type SlotId = (typeof SLOT_IDS)[number];

export interface SlotSpec {
  id: SlotId;
  label: string;
  required: number;
  hint: string;
}

export const SLOTS: readonly SlotSpec[] = [
  { id: "bank_statement", label: "Bank statements", required: 2, hint: "The last two months, every page — including blank ones." },
  { id: "w2", label: "W-2 forms", required: 2, hint: "The last two years." },
  { id: "paystub", label: "Pay stubs", required: 2, hint: "Covering the most recent 30 days." },
  { id: "tax_return", label: "Tax returns", required: 2, hint: "The last two years, all pages and schedules." },
  { id: "other", label: "Other documents", required: 0, hint: "Anything else your loan specialist has asked for." },
];

// ---- Tailoring --------------------------------------------------------------

export type EmploymentStatus = "employed" | "self-employed" | "retired" | "other";

/** One applicant, as far as the document list cares. */
export interface PlanApplicant {
  firstName?: string;
  employmentStatus?: EmploymentStatus;
}

/** What each way of earning has to prove, mirroring the emailed checklist. */
const BY_EMPLOYMENT: Record<EmploymentStatus, { slots: Partial<Record<SlotId, number>>; otherIncome?: string }> = {
  employed: { slots: { paystub: 2, w2: 2 } },
  "self-employed": {
    slots: { tax_return: 2, other: 1 },
    otherIncome: "1099 forms for the last two years and a year-to-date profit and loss statement",
  },
  retired: {
    slots: { other: 1 },
    otherIncome: "an award letter (Social Security, pension or annuity) and 1099-R forms for the last two years",
  },
  other: { slots: { tax_return: 2, other: 1 }, otherIncome: "documentation of your income source" },
};

const BASE_HINT: Record<SlotId, string> = Object.fromEntries(SLOTS.map((s) => [s.id, s.hint])) as Record<SlotId, string>;

/**
 * The document list for one application: each applicant adds what their kind
 * of income needs, so a retiree is never asked for pay stubs and a couple who
 * are both employed are asked for both sets. With no application to go on, the
 * general list stands.
 *
 * Every slot is returned; one with nothing required and nothing uploaded is
 * hidden by documentProgress, except "other", which always stays open.
 */
export function documentSlots(applicants: readonly PlanApplicant[] | null): SlotSpec[] {
  const known = (applicants ?? []).filter((a) => a.employmentStatus);
  if (known.length === 0) return [...SLOTS];

  const required: Record<SlotId, number> = { bank_statement: 2, w2: 0, paystub: 0, tax_return: 0, other: 0 };
  const whoNeeds: Record<SlotId, string[]> = { bank_statement: [], w2: [], paystub: [], tax_return: [], other: [] };
  const otherIncome: string[] = [];

  known.forEach((a, index) => {
    const who = index === 0 ? "you" : a.firstName?.trim() || "your co-borrower";
    const rule = BY_EMPLOYMENT[a.employmentStatus!];
    for (const [slot, count] of Object.entries(rule.slots) as [SlotId, number][]) {
      required[slot] += count;
      whoNeeds[slot].push(who);
    }
    if (rule.otherIncome) otherIncome.push(known.length > 1 ? `For ${who}: ${rule.otherIncome}.` : `${capitalize(rule.otherIncome)}.`);
  });

  return SLOTS.map((slot) => {
    if (slot.id === "other" && required.other > 0) {
      return {
        ...slot,
        label: "Income documents",
        required: required.other,
        hint: `${otherIncome.join(" ")} Anything else your loan specialist asks for can go here too.`,
      };
    }
    // With two applicants, say whose these are.
    const names = whoNeeds[slot.id];
    const hint =
      names.length > 1
        ? `${BASE_HINT[slot.id]} Two each, for ${names.join(" and ")}.`
        : names.length === 1 && known.length > 1
          ? `${BASE_HINT[slot.id]} For ${names[0]}.`
          : BASE_HINT[slot.id];
    return { ...slot, required: required[slot.id], hint };
  });
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The applicants in a stored application or draft payload, read defensively. */
export function applicantsFromPayload(payload: unknown): PlanApplicant[] {
  if (!payload || typeof payload !== "object") return [];
  const read = (value: unknown): PlanApplicant | null => {
    if (!value || typeof value !== "object") return null;
    const v = value as Record<string, unknown>;
    const status = v.employmentStatus;
    if (typeof status !== "string" || !(status in BY_EMPLOYMENT)) return null;
    return {
      firstName: typeof v.firstName === "string" ? v.firstName : undefined,
      employmentStatus: status as EmploymentStatus,
    };
  };
  const main = read(payload);
  if (!main) return [];
  const co = read((payload as Record<string, unknown>).coBorrower);
  return co ? [main, co] : [main];
}

export function isSlotId(value: unknown): value is SlotId {
  return typeof value === "string" && (SLOT_IDS as readonly string[]).includes(value);
}

// ---- Limits and types -------------------------------------------------------

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 150 * 1024 * 1024;
/** Under Vercel's 4.5 MB request cap with room for the encryption header. */
export const CHUNK_BYTES = 3 * 1024 * 1024;
export const MAX_PARTS = Math.ceil(MAX_FILE_BYTES / CHUNK_BYTES);
export const MAX_FILENAME_CHARS = 255;

export const ALLOWED_TYPES: Record<string, { extensions: string[]; label: string }> = {
  "application/pdf": { extensions: [".pdf"], label: "PDF" },
  "image/jpeg": { extensions: [".jpg", ".jpeg"], label: "JPEG" },
  "image/png": { extensions: [".png"], label: "PNG" },
};

export type DocumentStatus = "uploading" | "available" | "deleted";

export interface BorrowerDocument {
  id: number;
  borrowerId: number;
  slot: SlotId;
  filename: string;
  mimeType: string;
  byteSize: number;
  sha256: string | null;
  partCount: number;
  status: DocumentStatus;
  uploadedAt: string;
  completedAt: string | null;
}


// ---- Progress ---------------------------------------------------------------

export interface SlotProgress {
  slot: SlotSpec;
  /** Files in this slot, oldest first. */
  documents: BorrowerDocument[];
  /** Uploaded files that count toward the requirement (never above it). */
  counted: number;
  /** How many more are needed; 0 for optional slots and finished ones. */
  remaining: number;
  complete: boolean;
}

export interface DocumentProgress {
  slots: SlotProgress[];
  /** Required files received, counting at most `required` per slot. */
  received: number;
  required: number;
  allRequiredReceived: boolean;
}

/**
 * Where a borrower stands, slot by slot. Only finished uploads count, and an
 * extra file in one slot never makes up for a missing one in another: three
 * bank statements and no W-2s is still two W-2s short.
 */
export function documentProgress(
  documents: readonly BorrowerDocument[],
  plan: readonly SlotSpec[] = SLOTS
): DocumentProgress {
  const slots = plan.map((slot) => {
    const inSlot = documents
      .filter((d) => d.slot === slot.id && d.status === "available")
      .sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt));
    const counted = Math.min(inSlot.length, slot.required);
    return {
      slot,
      documents: inSlot,
      counted,
      remaining: slot.required - counted,
      complete: slot.required > 0 && counted >= slot.required,
    };
  });
  // A slot nobody needs is hidden, unless something was uploaded to it (say,
  // before the application said what was needed). "Other" always stays open.
  const shown = slots.filter((s) => s.slot.required > 0 || s.slot.id === "other" || s.documents.length > 0);
  const required = plan.reduce((sum, s) => sum + s.required, 0);
  const received = shown.reduce((sum, s) => sum + s.counted, 0);
  return { slots: shown, received, required, allRequiredReceived: received >= required };
}
