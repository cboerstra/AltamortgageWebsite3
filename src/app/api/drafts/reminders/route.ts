// Sends every reminder that is due, then purges stale drafts.
//
// Invoked from outside — a cPanel cron job, an uptime monitor, anything that
// can make an authenticated POST every fifteen minutes. Deliberately not an
// in-process timer: Passenger idles and restarts the app on its own schedule,
// and a setInterval inside it would fire erratically or not at all.
//
// Safe to run concurrently. Each draft is claimed with a conditional update
// before its email is sent, so two overlapping runs produce one email, not
// two.

import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { sendDraftReminder } from "@/lib/email";
import { reminderDue, reminderMessage } from "@/lib/drafts/reminders";
import {
  claimReminder,
  purgeStaleDrafts,
  resumeTokenFor,
  selectReminderCandidates,
} from "@/lib/drafts/store";
import { linkKey } from "@/lib/drafts/token";

export const runtime = "nodejs";

const TOTAL_STEPS = 6;

function secretMatches(header: string | null, secret: string): boolean {
  const prefix = "Bearer ";
  if (!header || !header.startsWith(prefix)) return false;
  const supplied = Buffer.from(header.slice(prefix.length), "utf8");
  const expected = Buffer.from(secret, "utf8");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function siteOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (configured || request.nextUrl.origin).replace(/\/+$/, "");
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Unconfigured is not an auth failure; say so distinctly.
    return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 503 });
  }
  if (!secretMatches(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!linkKey()) {
    // Drafts are being saved, but no link can be rebuilt for an email.
    return NextResponse.json({ error: "DRAFT_LINK_KEY not set" }, { status: 503 });
  }

  const now = new Date();
  const origin = siteOrigin(request);
  const candidates = await selectReminderCandidates();

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let unlinkable = 0;

  for (const draft of candidates) {
    const stage = reminderDue(draft, now);
    if (stage === null) {
      skipped += 1;
      continue;
    }

    // Decide whether a link is even possible before claiming the stage, so a
    // draft created without a link key is not burned through its reminders
    // with nothing sent.
    const token = resumeTokenFor(draft);
    if (!token) {
      unlinkable += 1;
      continue;
    }

    // Claim first. Losing the race means another run has it.
    const claimed = await claimReminder(draft.id, draft.remindersSent);
    if (!claimed) {
      skipped += 1;
      continue;
    }

    const result = await sendDraftReminder({
      to: draft.email,
      message: reminderMessage(stage, {
        firstName: draft.firstName ?? "",
        resumeUrl: `${origin}/apply?resume=${encodeURIComponent(token)}`,
        optOutUrl: `${origin}/api/drafts/opt-out?token=${encodeURIComponent(token)}`,
        furthestStep: draft.furthestStep,
        totalSteps: TOTAL_STEPS,
      }),
    });

    if (result.status === "sent") {
      sent += 1;
    } else {
      failed += 1;
      console.error(
        `Draft ${draft.id} reminder stage ${stage} ${result.status}: ${result.error ?? ""}`
      );
    }
  }

  const purged = await purgeStaleDrafts();

  if (unlinkable > 0) {
    console.warn(
      `${unlinkable} draft(s) have no recoverable resume token — created before DRAFT_LINK_KEY was set, or the key changed.`
    );
  }
  console.log(
    `Draft reminders: sent=${sent} failed=${failed} skipped=${skipped} unlinkable=${unlinkable} purged=${purged}`
  );
  return NextResponse.json({ sent, failed, skipped, unlinkable, purged });
}
