"use client";

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ApplicationFormData } from "@/lib/schemas";

const selectClass =
  "mt-1 h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

export function StepPersonalInfo({
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

  const yearsAtAddress = watch("yearsAtAddress");

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-text">Personal Information</h2>

      <div className="grid sm:grid-cols-4 gap-4">
        <div className="sm:col-span-1">
          <Label>First Name</Label>
          <Input {...register("firstName")} className="mt-1" />
          {errors.firstName && (
            <p className="text-xs text-error mt-1">{errors.firstName.message}</p>
          )}
        </div>
        <div className="sm:col-span-1">
          <Label>Middle Name</Label>
          <Input {...register("middleName")} className="mt-1" />
        </div>
        <div className="sm:col-span-1">
          <Label>Last Name</Label>
          <Input {...register("lastName")} className="mt-1" />
          {errors.lastName && (
            <p className="text-xs text-error mt-1">{errors.lastName.message}</p>
          )}
        </div>
        <div className="sm:col-span-1">
          <Label>Suffix</Label>
          <Input {...register("suffix")} className="mt-1" placeholder="Jr., Sr., III" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Date of Birth</Label>
          <Input {...register("dateOfBirth")} type="date" className="mt-1" />
          {errors.dateOfBirth && (
            <p className="text-xs text-error mt-1">{errors.dateOfBirth.message}</p>
          )}
        </div>
        <div>
          <Label>Social Security Number</Label>
          <Input
            {...register("ssn")}
            type="password"
            className="mt-1"
            placeholder="XXX-XX-XXXX"
          />
        </div>
      </div>

      <div>
        <Label>Marital Status</Label>
        <select {...register("maritalStatus")} className={selectClass} defaultValue="">
          <option value="" disabled>
            Select status
          </option>
          <option value="single">Single</option>
          <option value="married">Married</option>
          <option value="separated">Separated</option>
          <option value="divorced">Divorced</option>
          <option value="widowed">Widowed</option>
        </select>
        {errors.maritalStatus && (
          <p className="text-xs text-error mt-1">{errors.maritalStatus.message}</p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Phone</Label>
          <Input {...register("phone")} type="tel" className="mt-1" />
          {errors.phone && (
            <p className="text-xs text-error mt-1">{errors.phone.message}</p>
          )}
        </div>
        <div>
          <Label>Email</Label>
          <Input {...register("email")} type="email" className="mt-1" />
          {errors.email && (
            <p className="text-xs text-error mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-text">Current Address</legend>
        <div>
          <Label>Street Address</Label>
          <Input {...register("currentAddress.street")} className="mt-1" />
          {errors.currentAddress?.street && (
            <p className="text-xs text-error mt-1">
              {errors.currentAddress.street.message}
            </p>
          )}
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label>City</Label>
            <Input {...register("currentAddress.city")} className="mt-1" />
            {errors.currentAddress?.city && (
              <p className="text-xs text-error mt-1">
                {errors.currentAddress.city.message}
              </p>
            )}
          </div>
          <div>
            <Label>State</Label>
            <Input
              {...register("currentAddress.state")}
              className="mt-1"
              placeholder="UT"
              maxLength={2}
            />
            {errors.currentAddress?.state && (
              <p className="text-xs text-error mt-1">
                {errors.currentAddress.state.message}
              </p>
            )}
          </div>
          <div>
            <Label>ZIP Code</Label>
            <Input
              {...register("currentAddress.zip")}
              className="mt-1"
              placeholder="84401"
              maxLength={5}
            />
            {errors.currentAddress?.zip && (
              <p className="text-xs text-error mt-1">
                {errors.currentAddress.zip.message}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      <div>
        <Label>Years at Current Address</Label>
        <Input
          {...register("yearsAtAddress", { valueAsNumber: true })}
          type="number"
          className="mt-1"
          min={0}
        />
        {errors.yearsAtAddress && (
          <p className="text-xs text-error mt-1">{errors.yearsAtAddress.message}</p>
        )}
      </div>

      {typeof yearsAtAddress === "number" && yearsAtAddress < 2 && (
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-text">Previous Address</legend>
          <div>
            <Label>Street Address</Label>
            <Input {...register("previousAddress.street")} className="mt-1" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>City</Label>
              <Input {...register("previousAddress.city")} className="mt-1" />
            </div>
            <div>
              <Label>State</Label>
              <Input
                {...register("previousAddress.state")}
                className="mt-1"
                placeholder="UT"
                maxLength={2}
              />
            </div>
            <div>
              <Label>ZIP Code</Label>
              <Input
                {...register("previousAddress.zip")}
                className="mt-1"
                placeholder="84401"
                maxLength={5}
              />
            </div>
          </div>
        </fieldset>
      )}

      <div>
        <Label>Housing Status</Label>
        <RadioGroup
          onValueChange={(v: string) =>
            setValue("housingStatus", v as ApplicationFormData["housingStatus"])
          }
          value={watch("housingStatus") || ""}
          className="flex gap-4 mt-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="own" id="housing-own" />
            <Label htmlFor="housing-own">Own</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="rent" id="housing-rent" />
            <Label htmlFor="housing-rent">Rent</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="other" id="housing-other" />
            <Label htmlFor="housing-other">Other</Label>
          </div>
        </RadioGroup>
        {errors.housingStatus && (
          <p className="text-xs text-error mt-1">{errors.housingStatus.message}</p>
        )}
      </div>

      <div>
        <Label>Monthly Housing Payment ($)</Label>
        <Input
          {...register("monthlyHousingPayment", { valueAsNumber: true })}
          type="number"
          className="mt-1"
          min={0}
        />
        {errors.monthlyHousingPayment && (
          <p className="text-xs text-error mt-1">
            {errors.monthlyHousingPayment.message}
          </p>
        )}
      </div>
    </div>
  );
}
