// Stop reminders for one draft.
//
//   GET  ?token=…   a page with a single "Stop reminders" button
//   POST token=…    performs the opt-out and confirms
//
// The spec asked for one click. It is one click — but the click is the
// button, not the link. Mail scanners (Outlook Safe Links, corporate
// gateways) fetch every URL in a message before the recipient sees it; a GET
// that opted out on arrival would silently unsubscribe those applicants
// before they had read a word. The GET here only renders.

import { NextRequest, NextResponse } from "next/server";
import { optOutDraft } from "@/lib/drafts/store";
import { isTokenShaped } from "@/lib/drafts/token";
import { COMPANY } from "@/lib/constants";
import { escapeHtml } from "@/lib/html";

export const runtime = "nodejs";

function page(title: string, body: string): NextResponse {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>${escapeHtml(title)} — ${escapeHtml(COMPANY.name)}</title>
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background: #F8F7F4; color: #1f2937; }
    main { max-width: 480px; margin: 10vh auto; background: #fff; padding: 32px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    h1 { color: #003087; font-size: 22px; margin: 0 0 12px; }
    p { line-height: 1.5; margin: 0 0 16px; }
    button { background: #003087; color: #fff; border: 0; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; }
    a { color: #003087; }
    .muted { color: #4b5563; font-size: 14px; }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    ${body}
    <p class="muted">${escapeHtml(COMPANY.name)} — NMLS #${escapeHtml(COMPANY.nmlsId)} · <a href="tel:${escapeHtml(COMPANY.phone)}">${escapeHtml(COMPANY.phone)}</a></p>
  </main>
</body>
</html>`;
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

// A Response body can be read once, so this must be built per request, not
// shared as a module constant.
const invalid = () =>
  page(
    "This link isn't valid",
    `<p>The stop-reminders link is incomplete or has expired. If you are still receiving reminders you don't want, reply to any of them and we'll stop them by hand.</p>`
  );

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!isTokenShaped(token)) return invalid();

  return page(
    "Stop application reminders?",
    `<p>You'll receive no more emails about this unfinished application. Your saved answers stay available from your original resume link for 30 days, so you can still come back and finish.</p>
     <form method="post">
       <input type="hidden" name="token" value="${escapeHtml(token)}" />
       <button type="submit">Stop reminders</button>
     </form>`
  );
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const token = form?.get("token");
  if (!isTokenShaped(token)) return invalid();

  // Unknown tokens confirm too. Telling the difference would let the page be
  // used to test whether a token is live.
  await optOutDraft(token);

  return page(
    "Reminders stopped",
    `<p>Done — we won't email you again about this application.</p>
     <p>If you change your mind, your original resume link keeps working for 30 days, and you're always welcome to <a href="/apply">start fresh</a>.</p>`
  );
}
