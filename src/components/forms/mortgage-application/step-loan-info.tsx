"use client";

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ApplicationFormData } from "@/lib/schemas";
import { YesNoQuestion, blankToUndefined } from "./shared-fields";

const selectClass =
  "mt-1 h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

export function StepLoanInfo({
  form,
}: {
  form: UseFormReturn<ApplicationFormData>;
}) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const loanPurpose = watch("loanPurpose");

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-text">Loan Information</h2>

      <div>
        <Label>Loan Purpose</Label>
        <select {...register("loanPurpose")} className={selectClass} defaultValue="">
          <option value="" disabled>
            Select purpose
          </option>
          <option value="purchase">Purchase a Home</option>
          <option value="refinance">Refinance</option>
          <option value="home-equity">Home Equity</option>
        </select>
        {errors.loanPurpose && (
          <p className="text-xs text-error mt-1">{errors.loanPurpose.message}</p>
        )}
      </div>

      <div>
        <Label>Property Type</Label>
        <select {...register("propertyType")} className={selectClass} defaultValue="">
          <option value="" disabled>
            Select property type
          </option>
          <option value="single-family">Single Family</option>
          <option value="condo">Condo</option>
          <option value="townhome">Townhome</option>
          <option value="multi-family">Multi-Family</option>
          <option value="manufactured">Manufactured</option>
        </select>
        {errors.propertyType && (
          <p className="text-xs text-error mt-1">{errors.propertyType.message}</p>
        )}
      </div>

      <div>
        <Label>Property Use</Label>
        <RadioGroup
          onValueChange={(v: string) =>
            setValue("propertyUse", v as ApplicationFormData["propertyUse"])
          }
          value={watch("propertyUse") || ""}
          className="flex gap-4 mt-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="primary" id="use-primary" />
            <Label htmlFor="use-primary">Primary Residence</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="secondary" id="use-secondary" />
            <Label htmlFor="use-secondary">Secondary Home</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="investment" id="use-investment" />
            <Label htmlFor="use-investment">Investment</Label>
          </div>
        </RadioGroup>
        {errors.propertyUse && (
          <p className="text-xs text-error mt-1">{errors.propertyUse.message}</p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>
            {loanPurpose === "purchase"
              ? "Purchase Price ($)"
              : "Estimated Property Value ($)"}
          </Label>
          <Input
            {...register("purchasePrice", { valueAsNumber: true })}
            type="number"
            className="mt-1"
            placeholder="350000"
          />
          {errors.purchasePrice && (
            <p className="text-xs text-error mt-1">{errors.purchasePrice.message}</p>
          )}
        </div>
        <div>
          <Label>Loan Amount ($)</Label>
          <Input
            {...register("loanAmount", { valueAsNumber: true })}
            type="number"
            className="mt-1"
            placeholder="280000"
          />
          {errors.loanAmount && (
            <p className="text-xs text-error mt-1">{errors.loanAmount.message}</p>
          )}
        </div>
      </div>

      {loanPurpose === "purchase" && (
        <div>
          <Label>Down Payment ($)</Label>
          <Input
            {...register("downPayment", { valueAsNumber: true })}
            type="number"
            className="mt-1"
            placeholder="70000"
          />
          {errors.downPayment && (
            <p className="text-xs text-error mt-1">{errors.downPayment.message}</p>
          )}
        </div>
      )}

      {(loanPurpose === "refinance" || loanPurpose === "home-equity") && (
        <div>
          <Label>Current Mortgage Balance ($)</Label>
          <Input
            {...register("currentBalance", { valueAsNumber: true })}
            type="number"
            className="mt-1"
            placeholder="200000"
          />
          <p className="text-xs text-text-muted mt-1">Leave blank if the home is paid off.</p>
          {errors.currentBalance && (
            <p className="text-xs text-error mt-1">
              {errors.currentBalance.message}
            </p>
          )}
        </div>
      )}

      {loanPurpose === "refinance" && (
        <YesNoQuestion form={form} name="cashOut" label="Do you want to take cash out with this refinance?" />
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <Label>Loan Program</Label>
          <select {...register("loanProgram", { setValueAs: blankToUndefined })} className={selectClass} defaultValue="">
            <option value="" disabled>
              Select program
            </option>
            <option value="conventional">Conventional</option>
            <option value="fha">FHA</option>
            <option value="va">VA</option>
            <option value="usda">USDA</option>
            <option value="not-sure">Not sure</option>
          </select>
        </div>
        <div>
          <Label>Loan Term</Label>
          <select {...register("loanTermYears", { setValueAs: blankToUndefined })} className={selectClass} defaultValue="">
            <option value="" disabled>
              Select term
            </option>
            <option value="30">30 years</option>
            <option value="25">25 years</option>
            <option value="20">20 years</option>
            <option value="15">15 years</option>
            <option value="10">10 years</option>
          </select>
        </div>
        <div>
          <Label>Rate Type</Label>
          <select {...register("amortizationType", { setValueAs: blankToUndefined })} className={selectClass} defaultValue="">
            <option value="" disabled>
              Select rate type
            </option>
            <option value="fixed">Fixed</option>
            <option value="arm">Adjustable (ARM)</option>
          </select>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-text">Property Address</legend>
        <p className="text-xs text-text-muted">
          {loanPurpose === "purchase"
            ? "If you have a home under contract or picked out. Leave blank if you're still looking."
            : "Leave blank if it's the home you live in now."}
        </p>
        <div>
          <Label>Street Address</Label>
          <Input {...register("propertyAddress.street")} className="mt-1" />
        </div>
        <div className="grid sm:grid-cols-4 gap-4">
          <div>
            <Label>City</Label>
            <Input {...register("propertyAddress.city")} className="mt-1" />
          </div>
          <div>
            <Label>State</Label>
            <Input {...register("propertyAddress.state")} className="mt-1" placeholder="UT" maxLength={2} />
          </div>
          <div>
            <Label>ZIP Code</Label>
            <Input {...register("propertyAddress.zip")} className="mt-1" placeholder="84401" maxLength={5} />
          </div>
          <div>
            <Label>County</Label>
            <Input {...register("propertyAddress.county")} className="mt-1" placeholder="Weber" />
          </div>
        </div>
      </fieldset>
    </div>
  );
}
