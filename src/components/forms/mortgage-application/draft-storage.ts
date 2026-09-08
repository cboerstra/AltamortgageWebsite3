// Saved-progress storage for the application wizard.
//
// A draft is a convenience, not a record: it holds the applicant's financial
// details in plain text on a device that may be shared, so it expires, it is
// versioned against the form schema, and it never contains an SSN.
//
// Exposed as a subscribable store so the wizard can read it during render via
// useSyncExternalStore instead of syncing it into state from an effect.

import type { ApplicationFormData } from "@/lib/schemas";

export const STORAGE_KEY = "alta-mortgage-app";

/** Bump when ApplicationFormData changes shape. Older drafts are discarded. */
export const STORAGE_VERSION = 2;

export const STORAGE_TTL_MS = 24 * 60 * 60 * 1000;

interface SavedProgress {
  version: number;
  savedAt: number;
  data: Partial<ApplicationFormData>;
}

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeDraft(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Whether a draft is present. Storage can throw, so every access is guarded. */
export function hasDraft(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/** There is no draft during server rendering. */
export function hasDraftOnServer(): boolean {
  return false;
}

/**
 * Read a draft that is still usable. A draft from an older schema version or
 * one older than the TTL is deleted rather than restored — reviving it would
 * mean pushing stale answers into a form that has moved on.
 */
export function readDraft(): Partial<ApplicationFormData> | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as Partial<SavedProgress>;
    const isCurrent =
      parsed?.version === STORAGE_VERSION &&
      typeof parsed.savedAt === "number" &&
      Date.now() - parsed.savedAt < STORAGE_TTL_MS &&
      parsed.data !== null &&
      typeof parsed.data === "object";

    if (!isCurrent) {
      clearDraft();
      return null;
    }

    // Never persisted in the first place, but guard anyway.
    const restored = { ...(parsed.data as Partial<ApplicationFormData>) };
    delete restored.ssn;
    return restored;
  } catch {
    // Unreadable draft, private mode, or storage disabled — start fresh.
    return null;
  }
}

export function writeDraft(values: ApplicationFormData): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ssn: _ssn, ...safe } = values;
    const payload: SavedProgress = {
      version: STORAGE_VERSION,
      savedAt: Date.now(),
      data: safe,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    emit();
  } catch {
    // Storage might be full or unavailable.
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
  emit();
}
