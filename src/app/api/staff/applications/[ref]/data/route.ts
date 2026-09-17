// PUT /api/staff/applications/{ref}/data
//
// A loan officer's correction to what the borrower entered. The body is a
// partial application; it is merged over the stored payload and the whole
// thing must validate as a complete application, so a partial edit can
// never leave the record in a shape the form itself would refuse. The
// consent and e-signature fields are the borrower's and cannot be edited.
// On success the MISMO document is regenerated so downloads match.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApplicationByRef, isDbConfigured, updateApplicationData } from "@/lib/db";
import { regenerateMismo, StalePayloadError } from "@/lib/mismo/regenerate";
import { applicationSchema, type ApplicationFormData } from "@/lib/schemas";
import { requireStaffKey, STAFF_HEADERS } from "@/lib/staff-auth";

export const runtime = "nodejs";

const REF_PATTERN = /^ALT-[A-Z2-9]{5}$/;

const LOCKED = ["ssn", "consentAuthorization", "eSignatureName", "eSignatureDate"] as const;

// Every borrower-entered field, optional, for the merge. Validation of the
// merged result is applicationSchema's job, not this one's.
const editSchema = applicationSchema
  .omit({ ssn: true, consentAuthorization: true, eSignatureName: true, eSignatureDate: true })
  .partial()
  .extend({
    currentAddress: applicationSchema.shape.currentAddress.partial().optional(),
  })
  .strict();

function columnsFrom(app: ApplicationFormData) {
  const { ssn: _ssn, ...rawPayload } = app;
  void _ssn;
  return {
    loanPurpose: app.loanPurpose,
    propertyType: app.propertyType,
    propertyUse: app.propertyUse,
    purchasePrice: app.purchasePrice,
    loanAmount: app.loanAmount,
    downPayment: app.downPayment,
    currentBalance: app.currentBalance,
    firstName: app.firstName,
    middleName: app.middleName,
    lastName: app.lastName,
    suffix: app.suffix,
    dateOfBirth: app.dateOfBirth,
    maritalStatus: app.maritalStatus,
    phone: app.phone,
    email: app.email,
    currentStreet: app.currentAddress.street,
    currentCity: app.currentAddress.city,
    currentState: app.currentAddress.state,
    currentZip: app.currentAddress.zip,
    yearsAtAddress: app.yearsAtAddress,
    housingStatus: app.housingStatus,
    monthlyHousingPayment: app.monthlyHousingPayment,
    employmentStatus: app.employmentStatus,
    employerName: app.employerName,
    jobTitle: app.jobTitle,
    yearsAtJob: app.yearsAtJob,
    monthlyIncome: app.monthlyIncome,
    creditScoreRange: app.creditScoreRange,
    usCitizen: app.usCitizen,
    veteran: app.veteran,
    firstTimeBuyer: app.firstTimeBuyer,
    rawPayload,
  };
}

export async function PUT(request: NextRequest, ctx: { params: Promise<{ ref: string }> }) {
  const denied = requireStaffKey(request);
  if (denied) return denied;

  const { ref } = await ctx.params;
  const refNumber = ref.toUpperCase();
  if (!REF_PATTERN.test(refNumber)) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: STAFF_HEADERS });
  }
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "Website database is not configured or unreachable." },
      { status: 503, headers: STAFF_HEADERS }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const edit = editSchema.safeParse(body);
  if (!edit.success) {
    const locked = LOCKED.filter((k) => body && typeof body === "object" && k in (body as object));
    return NextResponse.json(
      {
        error: locked.length ? `These fields cannot be edited: ${locked.join(", ")}` : "Invalid edit",
        details: edit.error.flatten(),
      },
      { status: 400, headers: STAFF_HEADERS }
    );
  }

  const app = await getApplicationByRef(refNumber);
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404, headers: STAFF_HEADERS });

  const stored = app.rawPayload as Record<string, unknown>;
  const merged = {
    ...stored,
    ...edit.data,
    currentAddress: {
      ...(typeof stored.currentAddress === "object" && stored.currentAddress ? stored.currentAddress : {}),
      ...(edit.data.currentAddress ?? {}),
    },
  };
  const full = applicationSchema.safeParse(merged);
  if (!full.success) {
    return NextResponse.json(
      { error: "The edited application is not valid", details: full.error.flatten() },
      { status: 422, headers: STAFF_HEADERS }
    );
  }

  try {
    await updateApplicationData(refNumber, { ...columnsFrom(full.data), ssnLast4: app.ssnLast4 ?? undefined });
  } catch (err) {
    console.error(`[${refNumber}] application edit failed:`, err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not save the edit" }, { status: 500, headers: STAFF_HEADERS });
  }

  let mismo: { status: "written" | "failed"; filename?: string; error?: string };
  try {
    const result = await regenerateMismo(refNumber, full.data, { submittedAt: app.createdAt, previousPath: app.mismoPath });
    mismo = { status: "written", filename: result.filename };
  } catch (err) {
    const message = err instanceof StalePayloadError ? err.message : err instanceof Error ? err.message : String(err);
    console.error(`[${refNumber}] MISMO regeneration after edit failed:`, message);
    mismo = { status: "failed", error: message };
  }

  console.log(`[staff] edited application ${refNumber}: ${Object.keys(edit.data).join(", ")}`);
  return NextResponse.json({ updated: true, refNumber, fields: Object.keys(edit.data), mismo }, { headers: STAFF_HEADERS });
}
