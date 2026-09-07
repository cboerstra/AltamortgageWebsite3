"use client";

import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ApplicationFormData } from "@/lib/schemas";

function YesNoRadio({
  name,
  label,
  value,
  onChange,
  note,
}: {
  name: string;
  label: string;
  value: boolean | undefined;
  onChange: (val: boolean) => void;
  note?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <RadioGroup
        onValueChange={(v: string) => onChange(v === "yes")}
        value={value === true ? "yes" : value === false ? "no" : ""}
        className="flex gap-4 mt-1"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="yes" id={`${name}-yes`} />
          <Label htmlFor={`${name}-yes`}>Yes</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="no" id={`${name}-no`} />
          <Label htmlFor={`${name}-no`}>No</Label>
        </div>
      </RadioGroup>
      {note && <p className="text-xs text-emerald mt-1">{note}</p>}
    </div>
  );
}

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

  const veteran = watch("veteran");
  const firstTimeBuyer = watch("firstTimeBuyer");

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
        <YesNoRadio
          name="bankruptcy"
          label="Have you declared bankruptcy in the past 7 years?"
          value={watch("bankruptcy")}
          onChange={(v) => setValue("bankruptcy", v)}
        />
        {errors.bankruptcy && (
          <p className="text-xs text-error mt-1">{errors.bankruptcy.message}</p>
        )}

        <YesNoRadio
          name="foreclosure"
          label="Have you had a property foreclosed in the past 7 years?"
          value={watch("foreclosure")}
          onChange={(v) => setValue("foreclosure", v)}
        />
        {errors.foreclosure && (
          <p className="text-xs text-error mt-1">
            {errors.foreclosure.message}
          </p>
        )}

        <YesNoRadio
          name="outstandingJudgments"
          label="Do you have any outstanding judgments against you?"
          value={watch("outstandingJudgments")}
          onChange={(v) => setValue("outstandingJudgments", v)}
        />
        {errors.outstandingJudgments && (
          <p className="text-xs text-error mt-1">
            {errors.outstandingJudgments.message}
          </p>
        )}

        <YesNoRadio
          name="downPaymentBorrowed"
          label="Is any part of the down payment borrowed?"
          value={watch("downPaymentBorrowed")}
          onChange={(v) => setValue("downPaymentBorrowed", v)}
        />
        {errors.downPaymentBorrowed && (
          <p className="text-xs text-error mt-1">
            {errors.downPaymentBorrowed.message}
          </p>
        )}

        <YesNoRadio
          name="primaryResidence"
          label="Will you occupy the property as your primary residence?"
          value={watch("primaryResidence")}
          onChange={(v) => setValue("primaryResidence", v)}
        />
        {errors.primaryResidence && (
          <p className="text-xs text-error mt-1">
            {errors.primaryResidence.message}
          </p>
        )}

        <YesNoRadio
          name="veteran"
          label="Are you a veteran or active-duty military?"
          value={veteran}
          onChange={(v) => setValue("veteran", v)}
          note={
            veteran === true
              ? "You may be eligible for VA loan benefits with zero down payment."
              : undefined
          }
        />
        {errors.veteran && (
          <p className="text-xs text-error mt-1">{errors.veteran.message}</p>
        )}

        <YesNoRadio
          name="firstTimeBuyer"
          label="Are you a first-time homebuyer?"
          value={firstTimeBuyer}
          onChange={(v) => setValue("firstTimeBuyer", v)}
          note={
            firstTimeBuyer === true
              ? "You may qualify for first-time homebuyer programs and down payment assistance."
              : undefined
          }
        />
        {errors.firstTimeBuyer && (
          <p className="text-xs text-error mt-1">
            {errors.firstTimeBuyer.message}
          </p>
        )}
      </div>
    </div>
  );
}
