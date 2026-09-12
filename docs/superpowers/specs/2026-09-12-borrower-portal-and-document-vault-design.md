# Borrower Portal + Document Vault

Date: 2026-09-12
Status: Approved (decisions carried from the 2026-09-11 design discussion; hosting adapted to Vercel)

## Problem

Applicants are asked, by email, to reply with bank statements, W-2s, pay
stubs and tax returns. Plain email is an unencrypted channel and the files
then sit in two mailboxes indefinitely. There is also no place an applicant
can return to: the only "resume" is a link in a reminder email.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Sign-in | Emailed 6-digit one-time code, no password | Nothing to breach or reset; they already proved email ownership by applying |
| Who may sign in | Anyone with a submitted application or a draft for that email | No separate registration; login page never reveals whether an email is known |
| Session | 7 days, sliding; HttpOnly, Secure, SameSite=Lax cookie; token stored hashed | Convenience for a multi-day process; revocable |
| Slots | Bank statements ×2, W-2s ×2, pay stubs ×2, tax returns ×2, Other (any) | As specified |
| Slot UI | Green check + "Uploaded" per file; drop zone resets after each upload | As specified |
| Deletion | Borrower may delete their own uploads; logged | As specified |
| Storage | Private Vercel Blob, AES-256-GCM under `DOCUMENT_ENCRYPTION_KEY` | Vercel has no persistent disk; own-key encryption means a leaked store yields nothing |
| Upload transport | Chunked, 3 MB chunks, each chunk encrypted independently | Vercel caps a single function request at 4.5 MB; tax returns exceed it |
| Types | PDF, JPEG, PNG by magic bytes; 25 MB per file; 150 MB per borrower | Phone photos and scanned statements; nothing executable |
| Scanning | None. Status shown as "unscanned" to staff | No scanner on Vercel; third-party scanning of financial documents is a worse trade |

## Data

```
borrowers                 id, email UNIQUE, first_name, last_name, created_at, last_login_at
borrower_login_codes      id, borrower_id, code_hash, expires_at, consumed_at, attempts, created_at
borrower_sessions         id, borrower_id, token_hash UNIQUE, expires_at, last_seen_at, revoked_at, created_at
borrower_documents        id, borrower_id, slot, original_filename, mime_type, byte_size, sha256,
                          part_count, status (uploading|available|deleted), created_at, completed_at, deleted_at
borrower_document_parts   document_id, part_index, blob_pathname, cipher_bytes  PK(document_id, part_index)
```

Applications and drafts are matched to a borrower by lowercased email. A
borrower row is created on first successful login.

## Flows

**Login.** `POST /api/portal/login {email}` always answers 200. If the email
has an application or draft, a code is generated, its SHA-256 stored with a
10-minute expiry, and the code emailed. At most 3 codes per email per 15
minutes. `POST /api/portal/verify {email, code}` compares in constant time,
allows 5 attempts per code, consumes it, creates a session and sets the
cookie. `POST /api/portal/logout` revokes.

**Upload.** `POST /api/portal/documents/start {slot, filename, mimeType,
byteSize}` validates and creates a row in `uploading`. `PUT
/api/portal/documents/{id}/parts/{n}` takes raw bytes; part 0 is checked
against the declared type by magic bytes; every part is encrypted with a
fresh IV and AAD of `documentId:partIndex` (so parts cannot be swapped) and
written to `documents/{borrowerId}/{documentId}/{n}.enc`. `POST
/api/portal/documents/{id}/complete` checks part count and byte total, records
the plaintext SHA-256 computed server-side across parts, and marks
`available`. Rows left in `uploading` for more than a day are purged with
their blobs by the existing cron job.

**Download.** `GET /api/portal/documents/{id}` (own documents) and `GET
/api/staff/documents/{id}` (CRM) stream the parts decrypted in order, as an
attachment, `nosniff`.

**Delete.** `DELETE /api/portal/documents/{id}` soft-deletes and removes the
blobs.

## Pages

- `/portal/login` — email, then code.
- `/portal` — application status (submitted: reference and date; draft:
  **Continue application** using the draft's resume token), then the five
  slots with drag-and-drop and a real file input.

## Staff

`GET /api/staff/applications/{ref}/documents` lists a borrower's documents by
the application's email; the CRM application page shows them with download
buttons routed through the CRM server.

## Email

"Documents needed" now sends applicants to the portal instead of asking for
attachments. A new "Your sign-in code" email carries the code.

## Not in scope

Malware scanning; document retention/purge policy (hook only); staff
upload on behalf of a borrower.
