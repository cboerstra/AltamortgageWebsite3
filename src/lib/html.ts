/**
 * Escape a value for interpolation into HTML text or a double-quoted
 * attribute. Applicant-supplied strings reach email bodies and the opt-out
 * page, so nothing goes in unescaped.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
