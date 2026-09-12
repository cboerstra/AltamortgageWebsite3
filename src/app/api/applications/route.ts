// Receives the six-step mortgage application.
//
// Ordering is deliberate and is the whole point of this handler:
//
//   1. DURABLE     — write the MISMO document to disk, insert the MySQL row.
//   2. BEST EFFORT — forward to the CRM, email the loan officer.
//   3. Report success ONLY if step 1 (or, failing that, the CRM) actually
//      landed the data somewhere.
//
// The previous version did step 2 alone and always answered `success: true`,
// so an unconfigured CRM meant the applicant saw "Application Submitted!" and
// the application ceased to exist. Never report success for data that was not
// stored.

import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { applicationSchema, type ApplicationFormData } from "@/lib/schemas";
import { buildApplicationSummary, summaryToText } from "@/lib/application-summary";
import { forwardToCRM, LOAN_TYPE_LABELS } from "@/lib/crm";
import {
  insertApplication,
  refNumberExists,
  updateDeliveryStatus,
  type MismoStatus,
} from "@/lib/db";
import {
  sendApplicantDocumentRequest,
  sendApplicationNotification,
  type EmailAttachment,
} from "@/lib/email";
import { buildDocumentChecklist } from "@/lib/document-checklist";
import { markDraftSubmitted } from "@/lib/drafts/store";
import { isTokenShaped } from "@/lib/drafts/token";
import { generateMismoDocument, ssnLast4, writeMismoFile, type StoredMismoFile } from "@/lib/mismo";
import { siteOrigin } from "@/lib/portal/site-url";
import { generateRefNumber } from "@/lib/utils";

// Writes files and opens MySQL connections, so it cannot run on the edge.
export const runtime = "nodejs";

const REF_NUMBER_ATTEMPTS = 5;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Reference numbers are 5 characters from a 32-character alphabet, and
 * `applications.ref_number` is UNIQUE. A collision used to throw inside
 * insertApplication, which swallowed the error and returned null — losing the
 * application silently. Check first, and fall through after a few tries rather
 * than blocking the submission on it.
 */
async function allocateRefNumber(): Promise<string> {
  let candidate = generateRefNumber();
  for (let attempt = 1; attempt <= REF_NUMBER_ATTEMPTS; attempt++) {
    if (!(await refNumberExists(candidate))) return candidate;
    candidate = generateRefNumber();
  }
  console.warn("Could not find an unused reference number; using the last candidate");
  return candidate;
}

/** Everything the applicant sent, minus the SSN, for the raw_payload column. */
function payloadWithoutSsn(app: ApplicationFormData): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ssn: _ssn, ...safe } = app;
  return safe;
}

export async function POST(request: NextRequest) {
  let referenceNumber = "";

  try {
    const body = await request.json();
    const result = applicationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const app = result.data;
    const submittedAt = new Date().toISOString();
    const sourcePage = typeof body?.source === "string" ? body.source : undefined;
    // Present when the wizard had a server-side draft. Closing it stops the
    // abandonment reminders; it is not otherwise trusted for anything.
    const draftToken = isTokenShaped(body?.draftToken) ? body.draftToken : null;
    referenceNumber = await allocateRefNumber();

    // ---- Durable phase 1: the MISMO document -------------------------------
    let xml: string | null = null;
    let stored: StoredMismoFile | null = null;
    let mismoStatus: MismoStatus = "pending";
    let mismoError: string | undefined;

    try {
      xml = generateMismoDocument(app, { referenceNumber, submittedAt, sourcePage });
      stored = await writeMismoFile(xml, { referenceNumber, submittedAt });
      mismoStatus = "written";
    } catch (err) {
      mismoStatus = "failed";
      mismoError = errorMessage(err);
      console.error(`[${referenceNumber}] MISMO generation failed:`, mismoError);
    }

    const mismoFilename = stored ? path.basename(stored.relativePath) : undefined;
    const summary = buildApplicationSummary(app, {
      referenceNumber,
      submittedAt,
      sourcePage,
      mismoFilename,
    });

    // ---- Durable phase 2: the database row ---------------------------------
    const applicationId = await insertApplication({
      refNumber: referenceNumber,
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
      ssnLast4: ssnLast4(app.ssn),
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
      rawPayload: payloadWithoutSsn(app),
      mismoPath: stored?.relativePath,
      mismoSha256: stored?.sha256,
      mismoStatus,
      mismoError,
    });

    const persisted = stored !== null || applicationId !== null;

    // ---- Best-effort phase: CRM + loan officer email + applicant email -----
    const attachments: EmailAttachment[] | undefined =
      xml && mismoFilename
        ? [{ filename: mismoFilename, content: xml, contentType: "application/xml" }]
        : undefined;

    const [crmResult, emailResult, applicantEmailResult] = await Promise.all([
      forwardToCRM({
        firstName: app.firstName,
        lastName: app.lastName,
        email: app.email,
        phone: app.phone,
        source: "apply_form",
        message: summaryToText(summary, `FULL MORTGAGE APPLICATION — Ref ${referenceNumber}`),
        // The wizard collects no SMS consent, so false is the correct value.
        smsConsent: false,
        loanType: LOAN_TYPE_LABELS[app.loanPurpose] || app.loanPurpose,
      }),
      sendApplicationNotification({
        sections: summary,
        referenceNumber,
        applicantName: `${app.firstName} ${app.lastName}`,
        attachments,
      }),
      // The site has no document upload, so this is how the applicant learns
      // what to send us and where. Best effort: a bounced confirmation must
      // never fail a submission that is already stored.
      sendApplicantDocumentRequest({
        to: app.email,
        firstName: app.firstName,
        referenceNumber,
        checklist: buildDocumentChecklist(app),
        portalUrl: `${siteOrigin(request)}/portal/login`,
      }),
    ]);

    if (applicationId !== null) {
      await updateDeliveryStatus(
        "applications",
        applicationId,
        { status: crmResult.status, response: crmResult.response },
        { status: emailResult.status, error: emailResult.error },
        {
          status: mismoStatus,
          path: stored?.relativePath,
          sha256: stored?.sha256,
          error: mismoError,
        }
      );
    }

    // ---- Report honestly ---------------------------------------------------
    const dbState = applicationId === null ? "skipped" : "ok";

    if (!persisted && crmResult.status !== "sent") {
      console.error(
        `[${referenceNumber}] Application not persisted anywhere ` +
          `(mismo=${mismoStatus}, db=${dbState}, crm=${crmResult.status})`
      );
      return NextResponse.json(
        {
          error:
            "We could not save your application. Nothing was submitted — please call us and we will take it over the phone.",
        },
        { status: 502 }
      );
    }

    if (draftToken) await markDraftSubmitted(draftToken, referenceNumber);

    console.log(
      `[${referenceNumber}] Application received ` +
        `(mismo=${mismoStatus}, db=${dbState}, crm=${crmResult.status}, ` +
        `email=${emailResult.status}, applicantEmail=${applicantEmailResult.status})`
    );

    return NextResponse.json({
      success: true,
      referenceNumber,
      stored: persisted,
      forwarded: crmResult.status === "sent",
    });
  } catch (err) {
    // Never log the request body — it carries the SSN.
    console.error(
      `/api/applications error${referenceNumber ? ` [${referenceNumber}]` : ""}:`,
      errorMessage(err)
    );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
