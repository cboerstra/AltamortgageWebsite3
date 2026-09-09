# Resumable Applications + Abandonment Reminders

Status: proposed
Date: 2026-09-09

## Problem

An applicant who starts the six-step wizard and stops has, today, a 24-hour
window on one browser to come back. `draft-storage.ts` writes to
`localStorage` under `alta-mortgage-app`: same device, same browser, expires
after `STORAGE_TTL_MS`, discarded on a `STORAGE_VERSION` bump, gone in private
browsing. Start on a phone during lunch, try to finish on a laptop that
evening, and the work is lost.

`hasDraftOnServer()` is not what its name suggests. It returns `false`
unconditionally — an SSR snapshot for `useSyncExternalStore`. There is no
server-side draft.

The consequence that matters commercially: **nothing is transmitted until
final submit.** `src/app/api/` exposes only `applications`, `leads` and
`version`; `db/schema.sql` has no drafts table. When someone abandons at step
3 there is no record they ever existed and no address to write to. Abandoned
applications are not merely un-recovered — they are invisible.

## Goals

- An applicant can resume on any device, from a link sent to their email.
- A draft survives server-side once we know who to send that link to.
- Up to three reminders nudge an abandoned application back to completion.
- Abandoned drafts are purged after 30 days.
- The existing submit path keeps working, unchanged, when none of this is
  configured.

## Non-goals

- User accounts, passwords, or any login. A token in a link is the whole auth
  story.
- Document upload. Separate feature; the confirmation email covers it for now.
- Editing or resuming an application after it has been submitted.
- Reminding leads (`/api/leads`). This is the wizard only.

## Decisions

1. **Drafts are keyed by an unguessable token, never by email.** Keying by
   email would make the endpoint an enumeration oracle: submit an address,
   learn whether that person has a mortgage application in progress.
2. **Only the SHA-256 of the token is stored.** The raw token exists in the
   email and the URL and nowhere else, so a database leak does not hand the
   reader every applicant's financial data. Same discipline as a password
   reset token.
3. **The full SSN is never persisted server-side.** This already holds for
   `applications` and for the localStorage draft; the rule does not bend here.
4. **A draft goes server-side only once step 1 validates.** Before that we
   have no email address, so there is nothing to send a link to and no reason
   to hold the data.
5. **localStorage stays.** It is the fast path for the common case — same
   device, same hour — and it works with no network. The server draft is the
   cross-device fallback, not a replacement.
6. **Reminders are sent by an externally-invoked route, not an in-process
   timer.** Passenger idles and restarts the app unpredictably; a `setInterval`
   would fire erratically or not at all.
7. **Consent is explicit and reversible.** A notice appears where the email is
   captured, and every reminder carries a one-click stop link.

## Architecture

### Schema

Additive, `IF NOT EXISTS`, same style as the existing tables.

```sql
CREATE TABLE IF NOT EXISTS application_drafts (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- SHA-256 of the resume token. The raw token is never stored.
  token_hash CHAR(64) NOT NULL UNIQUE,

  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),

  -- Partial ApplicationFormData. Never contains the SSN.
  data JSON NOT NULL,
  schema_version SMALLINT NOT NULL,
  furthest_step TINYINT NOT NULL DEFAULT 0,

  reminders_sent TINYINT NOT NULL DEFAULT 0,
  last_reminder_at TIMESTAMP NULL,
  opted_out TINYINT(1) NOT NULL DEFAULT 0,

  -- Set when the application is finally submitted. Stops all reminders.
  submitted_ref VARCHAR(20) NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_due (opted_out, submitted_ref, reminders_sent, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

`idx_due` is shaped for the one query the reminder job runs.

### Modules

| Path | Responsibility |
| --- | --- |
| `src/lib/drafts/token.ts` | Generate a 32-byte token, base64url-encode it, hash it. No I/O. |
| `src/lib/drafts/store.ts` | Upsert, load-by-token, mark submitted, opt out, select due, purge. Mirrors `mismo/store.ts`. |
| `src/lib/drafts/reminders.ts` | Which reminder is due for a draft, and the copy for each. Pure, so the schedule is testable without a database. |

### Routes

| Route | Purpose |
| --- | --- |
| `POST /api/drafts` | Upsert. First call returns the raw token once; later calls carry it. |
| `GET /api/drafts?token=…` | Load a draft for hydration. Wrong or purged token returns 404, never a hint. |
| `POST /api/drafts/reminders` | Send everything due. Requires `Authorization: Bearer $CRON_SECRET`. |
| `GET /api/drafts/opt-out?token=…` | Sets `opted_out`, renders a plain confirmation page. |

All are `runtime = "nodejs"` — they touch MySQL.

### Wizard changes

- Step 1 validates → `POST /api/drafts` → keep the returned token in
  `localStorage` beside the existing draft.
- Each subsequent step advance → `POST /api/drafts` with the token. Debounced;
  a step change, not a keystroke.
- Mount with `?resume=<token>` → `GET /api/drafts` → hydrate the form and jump
  to `furthest_step`. On failure, say the link expired and offer a fresh start
  rather than a blank form with no explanation.
- Submit succeeds → mark the draft submitted so reminders stop.

### Reminder schedule

Measured from `updated_at` — the last time they actually touched it.

| `reminders_sent` | Due after | Tone |
| --- | --- | --- |
| 0 | 1 hour | "You were nearly there" — catches the interrupted session. |
| 1 | 24 hours | "Your application is saved" — catches the meant-to-come-back case. |
| 2 | 7 days | Final. Says it is the last one, and that the draft expires. |
| 3 | — | Done. Never contacted again. |

Skipped entirely when `opted_out = 1` or `submitted_ref IS NOT NULL`.

### Claiming, so a double-invocation cannot double-send

The job must be safe to run concurrently — two cron ticks overlapping, or a
retry after a timeout. Each draft is claimed with a conditional update before
its email is sent:

```sql
UPDATE application_drafts
   SET reminders_sent = reminders_sent + 1,
       last_reminder_at = NOW()
 WHERE id = ? AND reminders_sent = ?
```

Zero affected rows means another run took it; skip. The mail goes out only
after the claim succeeds, so the failure mode is a missed reminder rather than
a duplicate — the right way round.

### Purge

The same job deletes `updated_at < NOW() - INTERVAL 30 DAY`. A draft holds
income, employer, and address for someone who never completed anything and
never agreed to a thing; holding it indefinitely is a liability, not an asset.

### Scheduling

Primary — cPanel → Advanced → **Cron Jobs**, every 15 minutes:

```
*/15 * * * * curl -fsS -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://altamortgagegroup.net/api/drafts/reminders
```

To check availability: cPanel search box → "Cron". Most shared plans include
it; a few of the cheapest tiers do not.

Fallback, if cron is unavailable — the route is a plain authenticated POST, so
any external scheduler works with **no code change**: a free uptime monitor
(UptimeRobot, Cronitor) pointed at the URL, or a GitHub Actions workflow on a
`schedule:` trigger holding the secret in repository secrets.

Timing is forgiving by design: a 15-minute tick against a 1-hour first
reminder means lateness is invisible to the applicant.

### Environment

| Variable | Purpose |
| --- | --- |
| `CRON_SECRET` | Bearer token for the reminder route. Absent → route returns 503 and sends nothing. |
| `NEXT_PUBLIC_SITE_URL` | Already used by `metadataBase`; builds absolute resume links. |

Absent configuration degrades the way the rest of the app already does: the
wizard works, drafts stay local-only, no reminders are attempted.

## Privacy and consent

- A notice sits where the email is captured: we will email a link to finish,
  plus up to three reminders, and they can stop them at any time.
- Every reminder carries a one-click stop link. Opting out is honoured
  permanently for that draft.
- Purge at 30 days, enforced by the job rather than by intention.
- Full SSN never stored server-side.
- Resume links use `rel="noreferrer"`, and the token is single-purpose: it
  grants read and write to one draft and nothing else.

**Residual risk worth stating plainly.** A resume link in an inbox is a bearer
credential. Anyone with access to that mailbox can open the draft. That is the
same trade every "finish your application" link on the internet makes, and it
is tolerable only because the draft holds no SSN and no full account numbers —
but it is a real widening of exposure compared with today, where the data
never leaves the applicant's own browser.

## Abuse surface

`POST /api/drafts` is unauthenticated by necessity — the applicant has no
identity yet. Without limits it is a free way to fill the database. It needs:

- a request body size cap,
- a per-IP rate limit on draft creation,
- validation that the payload parses as a partial `ApplicationFormData`, with
  anything unrecognised dropped rather than stored.

## Testing

Hermetic, in the style of `route.test.ts` — with `DB_*` and `SMTP_*` unset,
everything short-circuits to "skipped" without touching the network.

- **token** — hashes are stable, the raw token never appears in what the store
  writes, tokens are long enough to resist guessing.
- **store** — upsert then load round-trips; an unknown token returns null; a
  submitted draft stops appearing as due.
- **reminders** — the 1h / 24h / 7d boundaries select correctly; opted-out and
  submitted drafts are skipped; nothing is sent after the third.
- **claiming** — two concurrent runs over the same draft produce exactly one
  send.
- **purge** — deletes past 30 days, keeps everything inside it.
- **wizard** — a `?resume=` token hydrates the form to the right step; a bad
  token shows the expired-link message instead of a blank form.

## Rollout

1. Run the `CREATE TABLE` in phpMyAdmin. Additive; existing tables untouched.
2. Deploy with `CRON_SECRET` set.
3. Add the cron entry; confirm one manual `curl` returns 200 and sends nothing
   against an empty table.
4. Watch the first day of logs before trusting the 7-day reminder to behave.

## Open questions

- Should the loan officer see a list of abandoned drafts, or is the reminder
  loop enough? A read-only view is cheap once the table exists.
- Does the 7-day reminder need different copy for someone who reached step 5
  versus someone who stopped at step 2? Probably, but that is a copy decision,
  not an architectural one.
