"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { ApplicationFormData } from "@/lib/schemas";

const selectClass =
  "mt-1 h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

export function StepAssets({
  form,
}: {
  form: UseFormReturn<ApplicationFormData>;
}) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "bankAccounts",
  });

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-text">Assets &amp; Liabilities</h2>

      {/* Bank Accounts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Bank Accounts</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ institution: "", type: "", balance: 0 })}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Account
          </Button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-3 items-end">
            <div className="flex-1">
              <Label>Institution</Label>
              <Input
                {...register(`bankAccounts.${index}.institution`)}
                className="mt-1"
                placeholder="Bank name"
              />
            </div>
            <div className="w-36">
              <Label>Type</Label>
              <select
                {...register(`bankAccounts.${index}.type`)}
                className={selectClass}
                defaultValue=""
              >
                <option value="" disabled>
                  Select
                </option>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="investment">Investment</option>
              </select>
            </div>
            <div className="w-36">
              <Label>Balance ($)</Label>
              <Input
                {...register(`bankAccounts.${index}.balance`, {
                  valueAsNumber: true,
                })}
                type="number"
                className="mt-1"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
            >
              <Trash2 className="w-4 h-4 text-error" />
            </Button>
          </div>
        ))}
        {fields.length === 0 && (
          <p className="text-sm text-text-muted">No accounts added yet.</p>
        )}
      </div>

      {/* Monthly Debts */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-text">
          Monthly Debt Payments
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Auto Loan ($)</Label>
            <Input
              {...register("monthlyAutoLoan", { valueAsNumber: true })}
              type="number"
              className="mt-1"
              min={0}
            />
            {errors.monthlyAutoLoan && (
              <p className="text-xs text-error mt-1">
                {errors.monthlyAutoLoan.message}
              </p>
            )}
          </div>
          <div>
            <Label>Student Loan ($)</Label>
            <Input
              {...register("monthlyStudentLoan", { valueAsNumber: true })}
              type="number"
              className="mt-1"
              min={0}
            />
            {errors.monthlyStudentLoan && (
              <p className="text-xs text-error mt-1">
                {errors.monthlyStudentLoan.message}
              </p>
            )}
          </div>
          <div>
            <Label>Credit Cards ($)</Label>
            <Input
              {...register("monthlyCreditCards", { valueAsNumber: true })}
              type="number"
              className="mt-1"
              min={0}
            />
            {errors.monthlyCreditCards && (
              <p className="text-xs text-error mt-1">
                {errors.monthlyCreditCards.message}
              </p>
            )}
          </div>
          <div>
            <Label>Child Support ($)</Label>
            <Input
              {...register("monthlyChildSupport", { valueAsNumber: true })}
              type="number"
              className="mt-1"
              min={0}
            />
            {errors.monthlyChildSupport && (
              <p className="text-xs text-error mt-1">
                {errors.monthlyChildSupport.message}
              </p>
            )}
          </div>
          <div>
            <Label>Other Debts ($)</Label>
            <Input
              {...register("monthlyOtherDebt", { valueAsNumber: true })}
              type="number"
              className="mt-1"
              min={0}
            />
            {errors.monthlyOtherDebt && (
              <p className="text-xs text-error mt-1">
                {errors.monthlyOtherDebt.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Credit Score */}
      <div>
        <Label>Estimated Credit Score Range</Label>
        <select
          {...register("creditScoreRange")}
          className={selectClass}
          defaultValue=""
        >
          <option value="" disabled>
            Select range
          </option>
          <option value="excellent">Excellent (740+)</option>
          <option value="good">Good (670-739)</option>
          <option value="fair">Fair (580-669)</option>
          <option value="below-fair">Below Fair (below 580)</option>
          <option value="not-sure">Not Sure</option>
        </select>
        {errors.creditScoreRange && (
          <p className="text-xs text-error mt-1">
            {errors.creditScoreRange.message}
          </p>
        )}
      </div>
    </div>
  );
}
