"use client";

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import type { ApplicationFormData } from "@/lib/schemas";

function fmt(n: number | undefined): string {
  if (n == null || isNaN(n)) return "$0";
  return "$" + n.toLocaleString("en-US");
}

function SectionHeader({
  title,
  stepIndex,
  onEdit,
}: {
  title: string;
  stepIndex: number;
  onEdit: (step: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-base font-semibold text-navy">{title}</h3>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onEdit(stepIndex)}
      >
        <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-text-muted">{label}</span>
      <span className="text-text font-medium text-right">{value || "---"}</span>
    </div>
  );
}

export function StepReview({
  form,
  onEditStep,
}: {
  form: UseFormReturn<ApplicationFormData>;
  onEditStep: (step: number) => void;
}) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const data = watch();

  const maskedSSN = data.ssn
    ? `***-**-${data.ssn.slice(-4)}`
    : "Not provided";

  const boolLabel = (v: boolean | undefined) =>
    v === true ? "Yes" : v === false ? "No" : "---";

  const citizenLabel: Record<string, string> = {
    yes: "U.S. Citizen",
    "permanent-resident": "Permanent Resident",
    other: "Other",
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-text">Review &amp; Submit</h2>
      <p className="text-sm text-text-muted">
        Please review all information below before submitting your application.
      </p>

      {/* Loan Info */}
      <div className="space-y-1">
        <SectionHeader title="Loan Information" stepIndex={0} onEdit={onEditStep} />
        <Row label="Loan Purpose" value={data.loanPurpose} />
        <Row label="Property Type" value={data.propertyType} />
        <Row label="Property Use" value={data.propertyUse} />
        <Row label="Purchase Price" value={fmt(data.purchasePrice)} />
        <Row label="Loan Amount" value={fmt(data.loanAmount)} />
        {data.downPayment != null && (
          <Row label="Down Payment" value={fmt(data.downPayment)} />
        )}
        {data.currentBalance != null && (
          <Row label="Current Balance" value={fmt(data.currentBalance)} />
        )}
      </div>

      <Separator />

      {/* Personal */}
      <div className="space-y-1">
        <SectionHeader
          title="Personal Information"
          stepIndex={1}
          onEdit={onEditStep}
        />
        <Row
          label="Name"
          value={[data.firstName, data.middleName, data.lastName, data.suffix]
            .filter(Boolean)
            .join(" ")}
        />
        <Row label="Date of Birth" value={data.dateOfBirth} />
        <Row label="SSN" value={maskedSSN} />
        <Row label="Marital Status" value={data.maritalStatus} />
        <Row label="Phone" value={data.phone} />
        <Row label="Email" value={data.email} />
        <Row
          label="Current Address"
          value={
            data.currentAddress
              ? `${data.currentAddress.street}, ${data.currentAddress.city}, ${data.currentAddress.state} ${data.currentAddress.zip}`
              : "---"
          }
        />
        <Row label="Years at Address" value={data.yearsAtAddress} />
        <Row label="Housing Status" value={data.housingStatus} />
        <Row
          label="Monthly Housing Payment"
          value={fmt(data.monthlyHousingPayment)}
        />
      </div>

      <Separator />

      {/* Employment */}
      <div className="space-y-1">
        <SectionHeader
          title="Employment & Income"
          stepIndex={2}
          onEdit={onEditStep}
        />
        <Row label="Employment Status" value={data.employmentStatus} />
        {data.employerName && (
          <Row label="Employer" value={data.employerName} />
        )}
        {data.jobTitle && <Row label="Job Title" value={data.jobTitle} />}
        {data.yearsAtJob != null && (
          <Row label="Years at Job" value={data.yearsAtJob} />
        )}
        <Row label="Monthly Income" value={fmt(data.monthlyIncome)} />
        {data.otherIncome && data.otherIncome.length > 0 && (
          <div className="text-sm py-1">
            <span className="text-text-muted">Other Income:</span>
            <ul className="mt-1 ml-4 list-disc text-text">
              {data.otherIncome.map((inc, i) => (
                <li key={i}>
                  {inc.type}: {fmt(inc.amount)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Separator />

      {/* Assets */}
      <div className="space-y-1">
        <SectionHeader
          title="Assets & Liabilities"
          stepIndex={3}
          onEdit={onEditStep}
        />
        {data.bankAccounts && data.bankAccounts.length > 0 && (
          <div className="text-sm py-1">
            <span className="text-text-muted">Bank Accounts:</span>
            <ul className="mt-1 ml-4 list-disc text-text">
              {data.bankAccounts.map((acc, i) => (
                <li key={i}>
                  {acc.institution} ({acc.type}): {fmt(acc.balance)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Row label="Auto Loan" value={fmt(data.monthlyAutoLoan)} />
        <Row label="Student Loan" value={fmt(data.monthlyStudentLoan)} />
        <Row label="Credit Cards" value={fmt(data.monthlyCreditCards)} />
        <Row label="Child Support" value={fmt(data.monthlyChildSupport)} />
        <Row label="Other Debt" value={fmt(data.monthlyOtherDebt)} />
        <Row label="Credit Score Range" value={data.creditScoreRange} />
      </div>

      <Separator />

      {/* Declarations */}
      <div className="space-y-1">
        <SectionHeader
          title="Declarations"
          stepIndex={4}
          onEdit={onEditStep}
        />
        <Row
          label="U.S. Citizenship"
          value={citizenLabel[data.usCitizen] || "---"}
        />
        <Row label="Bankruptcy" value={boolLabel(data.bankruptcy)} />
        <Row label="Foreclosure" value={boolLabel(data.foreclosure)} />
        <Row
          label="Outstanding Judgments"
          value={boolLabel(data.outstandingJudgments)}
        />
        <Row
          label="Down Payment Borrowed"
          value={boolLabel(data.downPaymentBorrowed)}
        />
        <Row
          label="Primary Residence"
          value={boolLabel(data.primaryResidence)}
        />
        <Row label="Veteran" value={boolLabel(data.veteran)} />
        <Row label="First-Time Buyer" value={boolLabel(data.firstTimeBuyer)} />
      </div>

      <Separator />

      {/* Consent & Signature */}
      <div className="space-y-4 bg-surface-warm rounded-lg p-4 border border-border-brand">
        <h3 className="text-base font-semibold text-navy">
          Authorization &amp; Consent
        </h3>
        <p className="text-sm text-text-muted leading-relaxed">
          By signing below, I authorize Alta Mortgage Group to verify the
          information provided in this application, including but not limited to
          obtaining credit reports, employment verification, and asset
          verification. I certify that all information is true, complete, and
          correct to the best of my knowledge. I understand that false
          information may result in the denial of my application.
        </p>

        <div className="flex items-start gap-3">
          <Checkbox
            checked={watch("consentAuthorization") === true}
            onCheckedChange={(checked: boolean) =>
              setValue("consentAuthorization", checked, { shouldValidate: true })
            }
            id="consent-auth"
          />
          <Label htmlFor="consent-auth" className="text-sm leading-relaxed">
            I have read, understand, and agree to the above authorization.
          </Label>
        </div>
        {errors.consentAuthorization && (
          <p className="text-xs text-error">
            {errors.consentAuthorization.message}
          </p>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Electronic Signature (Full Legal Name)</Label>
            <Input
              {...register("eSignatureName")}
              className="mt-1"
              placeholder="Type your full legal name"
            />
            {errors.eSignatureName && (
              <p className="text-xs text-error mt-1">
                {errors.eSignatureName.message}
              </p>
            )}
          </div>
          <div>
            <Label>Date</Label>
            <Input
              {...register("eSignatureDate")}
              type="date"
              className="mt-1"
              defaultValue={today}
            />
            {errors.eSignatureDate && (
              <p className="text-xs text-error mt-1">
                {errors.eSignatureDate.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
