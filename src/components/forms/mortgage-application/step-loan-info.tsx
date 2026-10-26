"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  applyAmountEdit,
  type AmountEditState,
  type AmountField,
} from "@/lib/loan-amounts";
import type { ApplicationFormData } from "@/lib/schemas";
import { YesNoQuestion, blankToUndefined } from "./shared-fields";

const selectClass =
  "mt-1 h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

const CALCULATED_FROM: Record<AmountField, string> = {
  purchasePrice: "Calculated from the loan amount plus down payment. You can change it.",
  loanAmount: "Calculated from the purchase price minus down payment. You can change it.",
  downPayment: "Calculated from the purchase price minus loan amount. You can change it.",
};

function CalculatedNote({ field, calculated }: { field: AmountField; calculated: AmountField | null }) {
  if (field !== calculated) return null;
  return <p className="text-xs text-text-muted mt-1">{CALCULATED_FROM[field]}</p>;
}

export function StepLoanInfo({
  form,
}: {
  form: UseFormReturn<ApplicationFormData>;
}) {
  const {
    register,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = form;

  const loanPurpose = watch("loanPurpose");

  const [editState, setEditState] = useState<AmountEditState>({ calculated: null, typed: [] });
  const { calculated } = editState;

  // Down payment only exists for a purchase, so only a purchase fills in amounts.
  const onAmountEdit = (edited: AmountField) => {
    if (getValues("loanPurpose") !== "purchase") return;
    const [purchasePrice, loanAmount, downPayment] = getValues([
      "purchasePrice",
      "loanAmount",
      "downPayment",
    ]);
    const { update, state } = applyAmountEdit(
      edited,
      { purchasePrice, loanAmount, downPayment },
      editState,
    );
    setEditState(state);
    if (update) {
      setValue(update.field, update.value ?? NaN, {
        shouldDirty: true,
        shouldValidate: Boolean(errors[update.field]),
      });
    }
  };

  const amountField = (field: AmountField) =>
    register(field, { valueAsNumber: true, onChange: () => onAmountEdit(field) });

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
            {...amountField("purchasePrice")}
            type="number"
            className="mt-1"
            placeholder="350000"
          />
          <CalculatedNote field="purchasePrice" calculated={calculated} />
          {errors.purchasePrice && (
            <p className="text-xs text-error mt-1">{errors.purchasePrice.message}</p>
          )}
        </div>
        <div>
          <Label>Loan Amount ($)</Label>
          <Input
            {...amountField("loanAmount")}
            type="number"
            className="mt-1"
            placeholder="280000"
          />
          <CalculatedNote field="loanAmount" calculated={calculated} />
          {errors.loanAmount && (
            <p className="text-xs text-error mt-1">{errors.loanAmount.message}</p>
          )}
        </div>
      </div>

      {loanPurpose === "purchase" && (
        <div>
          <Label>Down Payment ($)</Label>
          <Input
            {...amountField("downPayment")}
            type="number"
            className="mt-1"
            placeholder="70000"
          />
          <CalculatedNote field="downPayment" calculated={calculated} />
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
