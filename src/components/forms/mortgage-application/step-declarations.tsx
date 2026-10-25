"use client";

import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import type { ApplicationFormData } from "@/lib/schemas";
import { CoBorrowerDeclarations } from "./co-borrower";
import { DemographicsFields, UrlaDeclarations, YesNoQuestion } from "./shared-fields";

export function StepDeclarations({
  form,
}: {
  form: UseFormReturn<ApplicationFormData>;
}) {
  const {
    setValue,
    watch,
    formState: { errors },
  } = form;

  const isPurchase = watch("loanPurpose") === "purchase";

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-text">Declarations</h2>
      <p className="text-sm text-text-muted">
        Please answer the following questions honestly. These are required by
        federal lending regulations.
      </p>

      <div>
        <Label>U.S. Citizenship Status</Label>
        <RadioGroup
          onValueChange={(v: string) =>
            setValue("usCitizen", v as ApplicationFormData["usCitizen"])
          }
          value={watch("usCitizen") || ""}
          className="flex flex-wrap gap-4 mt-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="citizen-yes" />
            <Label htmlFor="citizen-yes">U.S. Citizen</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="permanent-resident" id="citizen-pr" />
            <Label htmlFor="citizen-pr">Permanent Resident</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="other" id="citizen-other" />
            <Label htmlFor="citizen-other">Other</Label>
          </div>
        </RadioGroup>
        {errors.usCitizen && (
          <p className="text-xs text-error mt-1">{errors.usCitizen.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <YesNoQuestion
          form={form}
          name="primaryResidence"
          label="Will you occupy the property as your primary residence?"
        />
        <YesNoQuestion
          form={form}
          name="firstTimeBuyer"
          label="Are you a first-time homebuyer (no ownership interest in a home in the past three years)?"
          note={(v) =>
            v === true
              ? "You may qualify for first-time homebuyer programs and down payment assistance."
              : undefined
          }
        />
        <YesNoQuestion
          form={form}
          name="downPaymentBorrowed"
          label="Are you borrowing any money for this transaction (for example, for your down payment or closing costs), or receiving money from another party, that is not disclosed on this application?"
        />
        <YesNoQuestion
          form={form}
          name="outstandingJudgments"
          label="Are there any outstanding judgments against you?"
        />
        <YesNoQuestion
          form={form}
          name="foreclosure"
          label="Have you had a property foreclosed upon in the past 7 years?"
        />
        <YesNoQuestion
          form={form}
          name="bankruptcy"
          label="Have you declared bankruptcy in the past 7 years?"
        />
        <YesNoQuestion
          form={form}
          name="veteran"
          label="Are you a veteran or active-duty military?"
          note={(v) =>
            v === true
              ? "You may be eligible for VA loan benefits with zero down payment."
              : undefined
          }
        />
        <UrlaDeclarations form={form} prefix="" isPurchase={isPurchase} />
      </div>

      <Separator />

      <h3 className="text-base font-semibold text-text">Demographic Information</h3>
      <DemographicsFields form={form} prefix="" />

      <CoBorrowerDeclarations form={form} />
    </div>
  );
}
