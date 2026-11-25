// Analytics must never run where borrowers enter or review loan information:
// the application (whose emailed links carry a resume token) and the portal.
const PRIVATE_PATH = /^\/(apply|portal)(\/|$)/i;

export function isPrivatePath(path: string): boolean {
  return PRIVATE_PATH.test(path);
}

/**
 * Google checks window["ga-disable-<id>"] before it sends anything. A getter,
 * rather than a fixed value, keeps it true to the current address: moving from
 * a marketing page into /apply does not reload the page, so GA is still there.
 */
export function gaBootstrapScript(id: string): string {
  return `Object.defineProperty(window, "ga-disable-${id}", { configurable: true, get: function () { return ${PRIVATE_PATH}.test(window.location.pathname); } });
window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag("js", new Date());
gtag("config", "${id}");`;
}
