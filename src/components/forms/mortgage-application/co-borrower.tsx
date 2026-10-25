"use client";

// The co-borrower's questions, one section per wizard step. They live inside
// the existing steps rather than in a step of their own, so step numbers saved
// in drafts and resume links keep their meaning.

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ApplicationFormData, CoBorrowerData } from "@/lib/schemas";
import { YesNoRadio } from "./yes-no-radio";
import { DemographicsFields, UrlaDeclarations, YesNoQuestion } from "./shared-fields";

type Form = UseFormReturn<ApplicationFormData>;

const selectClass =
  "mt-1 h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-error mt-1">{message}</p> : null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5 rounded-lg border border-border-brand bg-surface-warm p-4 sm:p-5">
      <h3 className="text-base font-semibold text-navy">{title}</h3>
      {children}
    </div>
  );
}

/** The co-borrower's first name for headings, or a neutral fallback. */
function coName(cb: Partial<CoBorrowerData> | undefined): string {
  return cb?.firstName?.trim() || "Co-borrower";
}

/** Step 2: the switch, then who they are and where they live. */
export function CoBorrowerPersonal({ form }: { form: Form }) {
  const {
    register,
    setValue,
    unregister,
    watch,
    formState: { errors },
  } = form;
  const cb = watch("coBorrower");
  const e = errors.coBorrower;

  const toggle = (on: boolean) => {
    if (on) {
      // An empty demographics answer, so each unanswered part gets its own
      // message rather than one error on the whole section.
      setValue("coBorrower", { sameAddress: true, demographics: { races: [] } } as unknown as CoBorrowerData, {
        shouldDirty: true,
      });
    } else {
      // Drop every answer, not just hide them: a removed co-borrower must not
      // be submitted.
      unregister("coBorrower");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg border border-border-brand px-4 py-3">
        <Checkbox
          id="has-co-borrower"
          checked={cb != null}
          onCheckedChange={(checked: boolean) => toggle(checked === true)}
        />
        <Label htmlFor="has-co-borrower" className="text-sm leading-relaxed">
          Someone is applying with me (add a co-borrower)
        </Label>
      </div>

      {cb != null && (
        <Section title="Co-Borrower">
          <div>
            <Label>Relationship to you</Label>
            <select {...register("coBorrower.relationship")} className={selectClass} defaultValue="">
              <option value="" disabled>
                Select relationship
              </option>
              <option value="spouse">Spouse</option>
              <option value="domestic-partner">Domestic partner</option>
              <option value="family">Family member</option>
              <option value="other">Other</option>
            </select>
            <FieldError message={e?.relationship?.message} />
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <Label>First Name</Label>
              <Input {...register("coBorrower.firstName")} className="mt-1" />
              <FieldError message={e?.firstName?.message} />
            </div>
            <div>
              <Label>Middle Name</Label>
              <Input {...register("coBorrower.middleName")} className="mt-1" />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input {...register("coBorrower.lastName")} className="mt-1" />
              <FieldError message={e?.lastName?.message} />
            </div>
            <div>
              <Label>Suffix</Label>
              <Input {...register("coBorrower.suffix")} className="mt-1" placeholder="Jr., Sr., III" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Date of Birth</Label>
              <Input {...register("coBorrower.dateOfBirth")} type="date" className="mt-1" />
              <FieldError message={e?.dateOfBirth?.message} />
            </div>
            <div>
              <Label>Marital Status</Label>
              <select {...register("coBorrower.maritalStatus")} className={selectClass} defaultValue="">
                <option value="" disabled>
                  Select status
                </option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="separated">Separated</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
              <FieldError message={e?.maritalStatus?.message} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Phone (optional)</Label>
              <Input {...register("coBorrower.phone")} type="tel" className="mt-1" />
            </div>
            <div>
              <Label>Email (optional)</Label>
              <Input {...register("coBorrower.email")} type="email" className="mt-1" />
              <FieldError message={e?.email?.message} />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="co-same-address"
              checked={cb.sameAddress !== false}
              onCheckedChange={(checked: boolean) =>
                setValue("coBorrower.sameAddress", checked === true, { shouldValidate: true })
              }
            />
            <Label htmlFor="co-same-address" className="text-sm">
              Lives at the same address as me
            </Label>
          </div>

          {cb.sameAddress === false && (
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-text">Co-Borrower&apos;s Current Address</legend>
              <div>
                <Label>Street Address</Label>
                <Input {...register("coBorrower.currentAddress.street")} className="mt-1" />
                <FieldError message={e?.currentAddress?.street?.message} />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label>City</Label>
                  <Input {...register("coBorrower.currentAddress.city")} className="mt-1" />
                  <FieldError message={e?.currentAddress?.city?.message} />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    {...register("coBorrower.currentAddress.state")}
                    className="mt-1"
                    placeholder="UT"
                    maxLength={2}
                  />
                  <FieldError message={e?.currentAddress?.state?.message} />
                </div>
                <div>
                  <Label>ZIP Code</Label>
                  <Input
                    {...register("coBorrower.currentAddress.zip")}
                    className="mt-1"
                    placeholder="84401"
                    maxLength={5}
                  />
                  <FieldError message={e?.currentAddress?.zip?.message} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Years at This Address</Label>
                  <Input
                    {...register("coBorrower.yearsAtAddress", { valueAsNumber: true })}
                    type="number"
                    className="mt-1"
                    min={0}
                  />
                </div>
                <div>
                  <Label>Housing Status</Label>
                  <RadioGroup
                    onValueChange={(v: string) =>
                      setValue("coBorrower.housingStatus", v as CoBorrowerData["housingStatus"], {
                        shouldValidate: true,
                      })
                    }
                    value={cb.housingStatus || ""}
                    className="flex gap-4 mt-2"
                  >
                    {(["own", "rent", "other"] as const).map((v) => (
                      <div key={v} className="flex items-center gap-2">
                        <RadioGroupItem value={v} id={`co-housing-${v}`} />
                        <Label htmlFor={`co-housing-${v}`}>{v === "own" ? "Own" : v === "rent" ? "Rent" : "Other"}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <FieldError message={e?.housingStatus?.message} />
                </div>
              </div>
            </fieldset>
          )}
        </Section>
      )}
    </div>
  );
}

/** Step 3: how the co-borrower earns. */
export function CoBorrowerEmployment({ form }: { form: Form }) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  const cb = watch("coBorrower");
  if (cb == null) return null;
  const e = errors.coBorrower;
  const status = cb.employmentStatus;
  const showEmployer = status === "employed" || status === "self-employed";

  return (
    <Section title={`${coName(cb)}'s Employment & Income`}>
      <div>
        <Label>Employment Status</Label>
        <select {...register("coBorrower.employmentStatus")} className={selectClass} defaultValue="">
          <option value="" disabled>
            Select status
          </option>
          <option value="employed">Employed</option>
          <option value="self-employed">Self-Employed</option>
          <option value="retired">Retired</option>
          <option value="other">Other</option>
        </select>
        <FieldError message={e?.employmentStatus?.message} />
      </div>

      {showEmployer && (
        <div>
          <Label>{status === "self-employed" ? "Business Name" : "Employer Name"}</Label>
          <Input {...register("coBorrower.employerName")} className="mt-1" />
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Job Title</Label>
          <Input {...register("coBorrower.jobTitle")} className="mt-1" />
        </div>
        <div>
          <Label>Years at Current Job</Label>
          <Input
            {...register("coBorrower.yearsAtJob", { valueAsNumber: true })}
            type="number"
            className="mt-1"
            min={0}
          />
        </div>
      </div>

      {showEmployer && (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>{status === "self-employed" ? "Business Phone" : "Employer Phone"}</Label>
              <Input {...register("coBorrower.employerPhone")} type="tel" className="mt-1" />
            </div>
            <div>
              <Label>Start Date</Label>
              <Input {...register("coBorrower.employmentStartDate")} type="date" className="mt-1" />
            </div>
            <div>
              <Label>Years in This Line of Work</Label>
              <Input
                {...register("coBorrower.yearsInLineOfWork", { valueAsNumber: true })}
                type="number"
                className="mt-1"
                min={0}
              />
            </div>
          </div>
          <YesNoQuestion
            form={form}
            name="coBorrower.employedByPartyToTransaction"
            label={`Is ${coName(cb)} employed by a family member, the property seller, a real estate agent, or another party to this transaction?`}
          />
        </>
      )}

      <div>
        <Label>Monthly Gross Income ($)</Label>
        <Input
          {...register("coBorrower.monthlyIncome", { valueAsNumber: true })}
          type="number"
          className="mt-1"
          placeholder="5000"
        />
        <FieldError message={e?.monthlyIncome?.message} />
      </div>
    </Section>
  );
}

/** Step 5: the co-borrower's own declarations. */
export function CoBorrowerDeclarations({ form }: { form: Form }) {
  const {
    setValue,
    watch,
    formState: { errors },
  } = form;
  const cb = watch("coBorrower");
  const isPurchase = watch("loanPurpose") === "purchase";
  if (cb == null) return null;
  const e = errors.coBorrower;
  const name = coName(cb);
  const set = (field: "bankruptcy" | "foreclosure" | "outstandingJudgments" | "veteran") => (v: boolean) =>
    setValue(`coBorrower.${field}`, v, { shouldValidate: true });

  return (
    <Section title={`${name}'s Declarations`}>
      <div>
        <Label>U.S. Citizenship Status</Label>
        <RadioGroup
          onValueChange={(v: string) =>
            setValue("coBorrower.usCitizen", v as CoBorrowerData["usCitizen"], { shouldValidate: true })
          }
          value={cb.usCitizen || ""}
          className="flex flex-wrap gap-4 mt-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="co-citizen-yes" />
            <Label htmlFor="co-citizen-yes">U.S. Citizen</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="permanent-resident" id="co-citizen-pr" />
            <Label htmlFor="co-citizen-pr">Permanent Resident</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="other" id="co-citizen-other" />
            <Label htmlFor="co-citizen-other">Other</Label>
          </div>
        </RadioGroup>
        <FieldError message={e?.usCitizen?.message} />
      </div>

      <div className="space-y-4">
        <YesNoRadio
          name="co-bankruptcy"
          label={`Has ${name} declared bankruptcy in the past 7 years?`}
          value={cb.bankruptcy}
          onChange={set("bankruptcy")}
        />
        <FieldError message={e?.bankruptcy?.message} />

        <YesNoRadio
          name="co-foreclosure"
          label={`Has ${name} had a property foreclosed in the past 7 years?`}
          value={cb.foreclosure}
          onChange={set("foreclosure")}
        />
        <FieldError message={e?.foreclosure?.message} />

        <YesNoRadio
          name="co-judgments"
          label={`Does ${name} have any outstanding judgments?`}
          value={cb.outstandingJudgments}
          onChange={set("outstandingJudgments")}
        />
        <FieldError message={e?.outstandingJudgments?.message} />

        <YesNoRadio
          name="co-veteran"
          label={`Is ${name} a veteran or active-duty military?`}
          value={cb.veteran}
          onChange={set("veteran")}
        />
        <FieldError message={e?.veteran?.message} />

        <YesNoQuestion
          form={form}
          name="coBorrower.primaryResidence"
          label={`Will ${name} occupy the property as their primary residence?`}
        />
        <YesNoQuestion
          form={form}
          name="coBorrower.ownedHomePastThreeYears"
          label={`Has ${name} had an ownership interest in a home in the past three years?`}
        />
        <YesNoQuestion
          form={form}
          name="coBorrower.downPaymentBorrowed"
          label={`Is ${name} borrowing any money for this transaction, or receiving money from another party, that is not disclosed on this application?`}
        />
        <UrlaDeclarations form={form} prefix="coBorrower." isPurchase={isPurchase} you="they" />
      </div>

      <h4 className="text-sm font-semibold text-navy pt-2">Demographic Information for {name}</h4>
      <DemographicsFields form={form} prefix="coBorrower." />
    </Section>
  );
}

/** Step 6: the co-borrower signs the same authorization. */
export function CoBorrowerSignature({ form }: { form: Form }) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  const cb = watch("coBorrower");
  if (cb == null) return null;
  return (
    <div>
      <Label>Co-Borrower&apos;s Electronic Signature (Full Legal Name)</Label>
      <Input
        {...register("coBorrower.eSignatureName")}
        className="mt-1"
        placeholder="Co-borrower types their full legal name"
      />
      <FieldError message={errors.coBorrower?.eSignatureName?.message} />
    </div>
  );
}
