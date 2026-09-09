"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ApplicationFormData } from "@/lib/schemas";
import { Icons } from "@/lib/icons";

const selectClass =
  "mt-1 h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

export function StepEmployment({
  form,
}: {
  form: UseFormReturn<ApplicationFormData>;
}) {
  const {
    register,
    watch,
    control,
    formState: { errors },
  } = form;

  const employmentStatus = watch("employmentStatus");
  const yearsAtJob = watch("yearsAtJob");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "otherIncome",
  });

  const showEmployer =
    employmentStatus === "employed" || employmentStatus === "self-employed";

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-text">Employment &amp; Income</h2>

      <div>
        <Label>Employment Status</Label>
        <select
          {...register("employmentStatus")}
          className={selectClass}
          defaultValue=""
        >
          <option value="" disabled>
            Select status
          </option>
          <option value="employed">Employed</option>
          <option value="self-employed">Self-Employed</option>
          <option value="retired">Retired</option>
          <option value="other">Other</option>
        </select>
        {errors.employmentStatus && (
          <p className="text-xs text-error mt-1">
            {errors.employmentStatus.message}
          </p>
        )}
      </div>

      {showEmployer && (
        <div>
          <Label>
            {employmentStatus === "self-employed"
              ? "Business Name"
              : "Employer Name"}
          </Label>
          <Input {...register("employerName")} className="mt-1" />
          {errors.employerName && (
            <p className="text-xs text-error mt-1">
              {errors.employerName.message}
            </p>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Job Title</Label>
          <Input {...register("jobTitle")} className="mt-1" />
        </div>
        <div>
          <Label>Years at Current Job</Label>
          <Input
            {...register("yearsAtJob", { valueAsNumber: true })}
            type="number"
            className="mt-1"
            min={0}
          />
        </div>
      </div>

      <div>
        <Label>Monthly Gross Income ($)</Label>
        <Input
          {...register("monthlyIncome", { valueAsNumber: true })}
          type="number"
          className="mt-1"
          placeholder="5000"
        />
        {errors.monthlyIncome && (
          <p className="text-xs text-error mt-1">{errors.monthlyIncome.message}</p>
        )}
      </div>

      {typeof yearsAtJob === "number" && yearsAtJob < 2 && (
        <div>
          <Label>Previous Employer</Label>
          <Input {...register("previousEmployer")} className="mt-1" />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Other Income Sources</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ type: "", amount: 0 })}
          >
            <Icons.add className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-3 items-end">
            <div className="flex-1">
              <Label>Type</Label>
              <Input
                {...register(`otherIncome.${index}.type`)}
                className="mt-1"
                placeholder="Rental income, alimony, etc."
              />
            </div>
            <div className="w-36">
              <Label>Amount ($)</Label>
              <Input
                {...register(`otherIncome.${index}.amount`, {
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
              <Icons.remove className="w-4 h-4 text-error" />
            </Button>
          </div>
        ))}
        {fields.length === 0 && (
          <p className="text-sm text-text-muted">
            No additional income sources added.
          </p>
        )}
      </div>
    </div>
  );
}
