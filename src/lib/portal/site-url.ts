// The public origin for links in emails. Prefers the configured site URL and
// tolerates the one typo that has already happened once (a missing scheme).

export function siteOrigin(request?: Request & { nextUrl?: URL }): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    const host = configured.replace(/^[a-z]*:?\/*/i, "");
    const withScheme = /^https?:\/\//i.test(configured) ? configured : `https://${host}`;
    return withScheme.replace(/\/+$/, "");
  }
  if (request) {
    try {
      return (request.nextUrl ?? new URL(request.url)).origin;
    } catch {
      // Fall through to the default.
    }
  }
  return "https://altamortgagegroup.net";
}
