// Validation for a partially completed application.
//
// A draft arrives from an unauthenticated endpoint, half filled in, with
// whatever react-hook-form had at the moment the step advanced: empty
// strings, NaN from untouched number inputs, fields the applicant has not
// reached yet. The rule from the spec is "anything unrecognised is dropped
// rather than stored" — so each field is validated on its own, and a field
// that fails is discarded while the rest of the draft survives. A single bad
// value must not throw away everything the applicant has typed.

import { z } from "zod";
import { applicationSchema, type ApplicationFormData } from "@/lib/schemas";

export type DraftData = Partial<Omit<ApplicationFormData, "ssn">>;

/** Every field optional, and every invalid field replaced by undefined. */
const lenientDraftSchema = z.object(
  Object.fromEntries(
    Object.entries(applicationSchema.shape).map(([key, schema]) => [
      key,
      (schema as z.ZodTypeAny).optional().catch(undefined),
    ])
  )
);

/** Drop undefined values so the stored JSON holds only what was actually kept. */
function compact<T extends Record<string, unknown>>(value: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    if (v !== undefined) out[key] = v;
  }
  return out as T;
}

/**
 * Sanitize an incoming draft. Never throws on bad field values; returns null
 * only when the input is not an object at all.
 *
 * The SSN is removed unconditionally. The wizard never sends it, but the
 * endpoint is public and the rule does not depend on the caller behaving.
 */
export function sanitizeDraft(input: unknown): DraftData | null {
  if (input === null || typeof input !== "object" || Array.isArray(input)) return null;

  const parsed = lenientDraftSchema.safeParse(input);
  if (!parsed.success) return null;

  const data = compact(parsed.data as Record<string, unknown>);
  delete data.ssn;
  return data as DraftData;
}

/** The identity a draft is filed under. Present only once step 1 is valid. */
export interface DraftIdentity {
  email: string;
  firstName?: string;
  lastName?: string;
}

const identitySchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

/** A blank name is "not given", not "invalid" — it must not block the draft. */
function optionalName(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function draftIdentity(data: DraftData): DraftIdentity | null {
  const parsed = identitySchema.safeParse({
    email: data.email,
    firstName: optionalName(data.firstName),
    lastName: optionalName(data.lastName),
  });
  return parsed.success ? parsed.data : null;
}
