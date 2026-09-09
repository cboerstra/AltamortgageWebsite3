"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
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

const STEP_LABELS = [
  "Loan Information",
  "Personal Information",
  "Employment & Income",
  "Assets & Liabilities",
  "Declarations",
  "Review & Submit",
];

const TOTAL_STEPS = STEP_LABELS.length;

const STORAGE_KEY = "alta-mortgage-app";

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema) as any,
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

  // Load saved data from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Remove SSN from restored data (never persisted, but guard anyway)
        delete parsed.ssn;
        reset(parsed);
      }
    } catch {
      // Ignore parse errors
    }
  }, [reset]);

  // Save to localStorage on step change (exclude SSN)
  const saveProgress = useCallback(() => {
    try {
      const values = getValues();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ssn: _ssn, ...safe } = values;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    } catch {
      // Storage might be full or unavailable
    }
  }, [getValues]);

  const goNext = async () => {
    const fields = STEP_FIELDS[step];
    const valid = await trigger(fields);
    if (!valid) return;

    saveProgress();
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    saveProgress();
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToStep = (target: number) => {
    saveProgress();
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
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setRefNumber(result.referenceNumber || "");
        setSubmitted(true);
        // Clear saved progress
        localStorage.removeItem(STORAGE_KEY);
      } else {
        setSubmitError(
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
