"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { applicationSchema, type ApplicationFormData } from "@/lib/schemas";
import { StepLoanInfo } from "./step-loan-info";
import { StepPersonalInfo } from "./step-personal-info";
import { StepEmployment } from "./step-employment";
import { StepAssets } from "./step-assets";
import { StepDeclarations } from "./step-declarations";
import { StepReview } from "./step-review";
import { Icons } from "@/lib/icons";
import {
  clearDraft,
  hasDraft,
  hasDraftOnServer,
  readDraft,
  readDraftToken,
  subscribeDraft,
  writeDraft,
  writeDraftToken,
} from "./draft-storage";
import { loadServerDraft, syncServerDraft } from "./server-draft";

/**
 * Reaching this step means step 1 (personal info, with the email) has been
 * validated, so there is an address to file a server-side draft under.
 */
const FIRST_SERVER_SYNC_STEP = 2;

const STEP_LABELS = [
  "Loan Information",
  "Personal Information",
  "Employment & Income",
  "Assets & Liabilities",
  "Declarations",
  "Review & Submit",
];

const TOTAL_STEPS = STEP_LABELS.length;

const STEP_FIELDS: (keyof ApplicationFormData)[][] = [
  // Step 0: Loan Info
  [
    "loanPurpose",
    "propertyType",
    "propertyUse",
    "purchasePrice",
    "loanAmount",
    "downPayment",
    "currentBalance",
  ],
  // Step 1: Personal
  [
    "firstName",
    "lastName",
    "dateOfBirth",
    "maritalStatus",
    "phone",
    "email",
    "currentAddress",
    "yearsAtAddress",
    "housingStatus",
    "monthlyHousingPayment",
  ],
  // Step 2: Employment
  ["employmentStatus", "monthlyIncome"],
  // Step 3: Assets
  [
    "monthlyAutoLoan",
    "monthlyStudentLoan",
    "monthlyCreditCards",
    "monthlyChildSupport",
    "monthlyOtherDebt",
    "creditScoreRange",
  ],
  // Step 4: Declarations
  [
    "usCitizen",
    "bankruptcy",
    "foreclosure",
    "outstandingJudgments",
    "downPaymentBorrowed",
    "primaryResidence",
    "veteran",
    "firstTimeBuyer",
  ],
  // Step 5: Review & Consent
  ["consentAuthorization", "eSignatureName", "eSignatureDate"],
];

export function ApplicationWizard() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [furthestStep, setFurthestStep] = useState(0);
  const [resumeNotice, setResumeNotice] = useState<"expired" | "unavailable" | null>(null);

  const hasSavedProgress = useSyncExternalStore(
    subscribeDraft,
    hasDraft,
    hasDraftOnServer
  );

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema) as Resolver<ApplicationFormData>,
    mode: "onTouched",
    defaultValues: {
      monthlyAutoLoan: 0,
      monthlyStudentLoan: 0,
      monthlyCreditCards: 0,
      monthlyChildSupport: 0,
      monthlyOtherDebt: 0,
      eSignatureDate: new Date().toISOString().split("T")[0],
    },
  });

  const { handleSubmit, trigger, getValues, reset } = form;

  // Restore on mount. A resume link wins over the local draft — it is the
  // more deliberate signal — and its token is moved out of the address bar
  // immediately so a bearer credential does not sit in browser history.
  // Otherwise readDraft() handles the version and age checks and deletes
  // anything it rejects.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resumeToken = params.get("resume");

    if (!resumeToken) {
      const draft = readDraft();
      if (draft) reset(draft);
      return;
    }

    params.delete("resume");
    const rest = params.toString();
    const cleanUrl = window.location.pathname + (rest ? `?${rest}` : "") + window.location.hash;
    window.history.replaceState(null, "", cleanUrl);

    let cancelled = false;
    loadServerDraft(resumeToken).then((result) => {
      if (cancelled) return;
      if (result.status !== "ok") {
        setResumeNotice(result.status);
        const local = readDraft();
        if (local) reset(local);
        return;
      }
      reset(result.draft.data);
      writeDraft(getValues());
      writeDraftToken(resumeToken);
      setFurthestStep(result.draft.furthestStep);
      setStep(result.draft.furthestStep);
    });
    return () => {
      cancelled = true;
    };
  }, [reset, getValues]);

  // Local save on every navigation; server save once there is an email to
  // file it under. The server call is fire-and-forget — navigation must not
  // wait on the network.
  const saveProgress = useCallback(
    (reached: number) => {
      const values = getValues();
      writeDraft(values);
      const furthest = Math.max(furthestStep, reached);
      setFurthestStep(furthest);
      if (furthest >= FIRST_SERVER_SYNC_STEP) void syncServerDraft(values, furthest);
    },
    [getValues, furthestStep]
  );

  const goNext = async () => {
    const fields = STEP_FIELDS[step];
    const valid = await trigger(fields);
    if (!valid) return;

    const next = Math.min(step + 1, TOTAL_STEPS - 1);
    saveProgress(next);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    saveProgress(step);
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToStep = (target: number) => {
    saveProgress(step);
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (data: ApplicationFormData) => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          source: window.location.pathname,
          timestamp: new Date().toISOString(),
          // Lets the server close the draft so reminders stop.
          draftToken: readDraftToken() ?? undefined,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setRefNumber(result.referenceNumber || "");
        setSubmitted(true);
        // The application is stored server-side; the local draft is now stale.
        clearDraft();
      } else {
        // A 502 means the server could not store the application anywhere and
        // says so in words meant for the applicant. Every other status carries
        // developer-facing text ("Validation failed"), which stays internal.
        const detail =
          res.status === 502
            ? await res
                .json()
                .then((body) => (typeof body?.error === "string" ? body.error : ""))
                .catch(() => "")
            : "";
        setSubmitError(
          detail ||
            "We couldn't submit your application. Please review your answers and try again, or call us and we'll take it over the phone."
        );
      }
    } catch {
      setSubmitError(
        "We couldn't reach the server. Please check your connection and try again — your progress has been saved."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <Icons.success className="w-16 h-16 text-emerald mx-auto" />
        <h2 className="text-2xl font-bold text-navy mt-4">
          Application Submitted!
        </h2>
        {refNumber && (
          <p className="text-lg text-text mt-2">
            Reference Number:{" "}
            <span className="font-mono font-bold">{refNumber}</span>
          </p>
        )}
        <p className="text-text-muted mt-2 max-w-md mx-auto">
          Thank you for your mortgage application. A loan specialist will
          contact you within 1 business day to discuss next steps. Please save
          your reference number for your records.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <Progress value={((step + 1) / TOTAL_STEPS) * 100} className="mb-4" />
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-text-muted">
          Step {step + 1} of {TOTAL_STEPS}:{" "}
          <span className="font-medium text-text">{STEP_LABELS[step]}</span>
        </p>
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <Icons.secure className="w-3.5 h-3.5" /> Secure &amp; Encrypted
        </div>
      </div>

      {/*
        Progress is kept in this browser so an applicant can finish later. On a
        shared or public computer they need a way to remove it without
        submitting, so say it is there and offer to erase it.
      */}
      {resumeNotice && (
        <div
          role="status"
          className="mb-6 rounded-lg border border-gold/40 bg-gold/5 px-4 py-3 text-sm text-text"
        >
          {resumeNotice === "expired"
            ? "That resume link has expired or was already used. You can start a fresh application below — it only takes a few minutes."
            : "We couldn't load your saved application right now. You can start below, and your answers will be saved as you go."}
        </div>
      )}

      {hasSavedProgress && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-xs text-text-muted">
          <span>
            Your progress is saved on this device for 24 hours
            {furthestStep >= FIRST_SERVER_SYNC_STEP
              ? ". If you leave, we'll email you a link to finish on any device."
              : "."}{" "}
            Your SSN is never saved.
          </span>
          <button
            type="button"
            onClick={() => {
              clearDraft();
              reset();
              setStep(0);
            }}
            className="font-medium text-navy underline underline-offset-2 hover:no-underline"
          >
            Clear saved progress
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 0 && <StepLoanInfo form={form} />}
        {step === 1 && <StepPersonalInfo form={form} />}
        {step === 2 && <StepEmployment form={form} />}
        {step === 3 && <StepAssets form={form} />}
        {step === 4 && <StepDeclarations form={form} />}
        {step === 5 && <StepReview form={form} onEditStep={goToStep} />}

        {/* Navigation */}
        {submitError && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error"
          >
            {submitError}
          </div>
        )}
        <div className="flex justify-between mt-8 pt-6 border-t border-border-brand">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={goBack}>
              <Icons.prev className="w-4 h-4 mr-2" /> Back
            </Button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS - 1 ? (
            <Button
              type="button"
              onClick={goNext}
              className="bg-navy hover:bg-navy-light text-white"
            >
              Next <Icons.next className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={submitting}
              className="bg-emerald hover:bg-emerald-light text-white px-8"
            >
              {submitting ? (
                <Icons.loading className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {submitting ? "Submitting..." : "Submit Application"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
