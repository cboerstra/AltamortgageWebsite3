// /api/staff/applications/{ref}
//
//   GET     one application, with the same curated summary the loan-officer
//           email carries, rebuilt from the stored payload
//   PATCH   the loan officer's review status and notes — nothing the
//           borrower entered can be changed here
//   DELETE  the application, its MISMO document, and — when it was the
//           borrower's last — their uploaded documents and drafts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildApplicationSummary, type SummarySection } from "@/lib/application-summary";
import {
  deleteApplication,
  getApplicationByRef,
  isDbConfigured,
  REVIEW_STATUSES,
  updateApplicationReview,
  type ApplicationDetail,
} from "@/lib/db";
import { deleteDraftsByEmail } from "@/lib/drafts/store";
import { deleteMismoFile } from "@/lib/mismo/store";
import { purgeBorrowerByEmail } from "@/lib/portal/documents";
import { applicationSchema } from "@/lib/schemas";
import { requireStaffKey, STAFF_HEADERS } from "@/lib/staff-auth";

export const runtime = "nodejs";

const REF_PATTERN = /^ALT-[A-Z2-9]{5}$/;

const reviewSchema = z
  .object({
    reviewStatus: z.enum(REVIEW_STATUSES).optional(),
    staffNotes: z.string().max(10_000).nullable().optional(),
  })
  .refine((v) => v.reviewStatus !== undefined || v.staffNotes !== undefined, {
    message: "Nothing to update",
  });

function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404, headers: STAFF_HEADERS });
}

function dbUnavailable() {
  return NextResponse.json(
    { error: "Website database is not configured or unreachable." },
    { status: 503, headers: STAFF_HEADERS }
  );
}

async function refFrom(ctx: { params: Promise<{ ref: string }> }): Promise<string | null> {
  const { ref } = await ctx.params;
  const refNumber = ref.toUpperCase();
  return REF_PATTERN.test(refNumber) ? refNumber : null;
}

function present(app: ApplicationDetail) {
  // raw_payload is the validated form minus the SSN. Re-validate rather than
  // trust it blindly: a row written by an older schema should degrade to
  // "summary unavailable", not crash the CRM page.
  let summary: SummarySection[] | null = null;
  const parsed = applicationSchema.safeParse({
    ...app.rawPayload,
    // ssnLast4() takes the last four digits of whatever it is given, so this
    // reconstructs the masked row without the real number ever existing here.
    ssn: app.ssnLast4 ? `XXX-XX-${app.ssnLast4}` : undefined,
  });
  if (parsed.success) {
    summary = buildApplicationSummary(parsed.data, {
      referenceNumber: app.refNumber,
      submittedAt: app.createdAt,
      mismoFilename: app.mismoPath ? app.mismoPath.split("/").pop() : undefined,
    });
  }

  const { rawPayload: _raw, ...rest } = app;
  void _raw;

  return NextResponse.json(
    {
      ...rest,
      summary,
      mismoFilename: app.mismoPath ? app.mismoPath.split("/").pop() : null,
      mismoAvailable: app.mismoStatus === "written" && Boolean(app.mismoPath),
    },
    { headers: STAFF_HEADERS }
  );
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ ref: string }> }) {
  const denied = requireStaffKey(request);
  if (denied) return denied;

  const refNumber = await refFrom(ctx);
  if (!refNumber) return notFound();

  const app = await getApplicationByRef(refNumber);
  if (!app) return notFound();
  return present(app);
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ ref: string }> }) {
  const denied = requireStaffKey(request);
  if (denied) return denied;

  const refNumber = await refFrom(ctx);
  if (!refNumber) return notFound();
  if (!isDbConfigured()) return dbUnavailable();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid review update", details: parsed.error.flatten() },
      { status: 400, headers: STAFF_HEADERS }
    );
  }

  try {
    const app = await updateApplicationReview(refNumber, parsed.data);
    if (!app) return notFound();
    return present(app);
  } catch (err) {
    console.error(`PATCH application ${refNumber} error:`, err);
    return dbUnavailable();
  }
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ ref: string }> }) {
  const denied = requireStaffKey(request);
  if (denied) return denied;

  const refNumber = await refFrom(ctx);
  if (!refNumber) return notFound();
  if (!isDbConfigured()) return dbUnavailable();

  let deleted;
  try {
    deleted = await deleteApplication(refNumber);
  } catch (err) {
    console.error(`DELETE application ${refNumber} error:`, err);
    return dbUnavailable();
  }
  if (!deleted) return notFound();

  // The row is gone; from here on, report what could not be cleaned rather
  // than fail, so the CRM never shows an application that no longer exists.
  const warnings: string[] = [];
  let documentsRemoved = 0;
  let draftsRemoved = 0;

  if (deleted.mismoPath) {
    try {
      await deleteMismoFile(deleted.mismoPath);
    } catch (err) {
      console.error(`DELETE ${refNumber}: MISMO file not removed:`, err);
      warnings.push("MISMO document could not be removed from storage");
    }
  }

  if (deleted.lastForEmail) {
    try {
      documentsRemoved = await purgeBorrowerByEmail(deleted.email);
    } catch (err) {
      console.error(`DELETE ${refNumber}: borrower documents not removed:`, err);
      warnings.push("Uploaded documents could not be removed");
    }
    try {
      draftsRemoved = await deleteDraftsByEmail(deleted.email);
    } catch (err) {
      console.error(`DELETE ${refNumber}: drafts not removed:`, err);
      warnings.push("Drafts could not be removed");
    }
  }

  console.log(
    `[staff] deleted application ${refNumber} (documents: ${documentsRemoved}, drafts: ${draftsRemoved}, borrower purged: ${deleted.lastForEmail})`
  );

  return NextResponse.json(
    {
      deleted: true,
      refNumber,
      documentsRemoved,
      draftsRemoved,
      borrowerPurged: deleted.lastForEmail,
      warnings,
    },
    { headers: STAFF_HEADERS }
  );
}
