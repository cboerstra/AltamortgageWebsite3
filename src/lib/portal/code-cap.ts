// The per-email sign-in code cap, as the borrower's browser sees it.
//
// The server sends at most CODES_PER_WINDOW codes per email per window and
// answers a request past the cap exactly like a successful one — it must, or
// the answer would reveal which emails have applications. So the login form
// keeps its own count of what it has asked for and stops the borrower walking
// into a silent wall. Pure and free of Node imports so the form can use it.

export interface CodeLimits {
  codesPerWindow: number;
  windowMinutes: number;
}

/**
 * The server's limits, used until its first answer says otherwise. Must match
 * CODES_PER_WINDOW and CODE_WINDOW_MS in identity.ts — a test holds them
 * together, since identity.ts cannot be imported into a client component.
 */
export const DEFAULT_CODE_LIMITS: CodeLimits = { codesPerWindow: 3, windowMinutes: 15 };

export interface CodeCapState {
  /** Requests made inside the current window. */
  recent: number;
  /** Whether another request now would be past the cap (and so send nothing). */
  capped: boolean;
  /** When the oldest request in the window expires and one more is allowed; null if not capped. */
  nextAllowedAt: number | null;
}

/** `requestTimes` are epoch milliseconds, oldest first, for one email. */
export function codeCapState(requestTimes: readonly number[], now: number, limits: CodeLimits): CodeCapState {
  const windowMs = limits.windowMinutes * 60_000;
  const inWindow = requestTimes.filter((t) => now - t < windowMs);
  const capped = inWindow.length >= limits.codesPerWindow;
  return {
    recent: inWindow.length,
    capped,
    // Oldest first, so the earliest one in the window is the next to expire.
    nextAllowedAt: capped ? inWindow[0] + windowMs : null,
  };
}
