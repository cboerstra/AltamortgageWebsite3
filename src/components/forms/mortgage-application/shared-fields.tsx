"use client";

// Questions every borrower answers for themselves. Rendered once for the
// primary borrower (prefix "") and once for a co-borrower ("coBorrower."), so
// both see the same wording and the answers land in matching fields.

import { get, type Path, type UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ETHNICITY_ORIGINS,
  RACES,
  type ApplicationFormData,
} from "@/lib/schemas";

type Form = UseFormReturn<ApplicationFormData>;
export type Prefix = "" | "coBorrower.";

/** For optional selects: an untouched "" is no answer, not an invalid one. */
export const blankToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

/** A field path under the given borrower. */
export function at(prefix: Prefix, name: string): Path<ApplicationFormData> {
  return `${prefix}${name}` as Path<ApplicationFormData>;
}

export function FieldError({ form, name }: { form: Form; name: Path<ApplicationFormData> }) {
  const error = get(form.formState.errors, name);
  return error?.message ? <p className="text-xs text-error mt-1">{String(error.message)}</p> : null;
}

export function YesNoQuestion({
  form,
  name,
  label,
  note,
}: {
  form: Form;
  name: Path<ApplicationFormData>;
  label: string;
  note?: (value: boolean | undefined) => string | undefined;
}) {
  const value = form.watch(name) as boolean | undefined;
  const id = name.replace(/\./g, "-");
  const noteText = note?.(value);
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <RadioGroup
        onValueChange={(v: string) =>
          form.setValue(name, (v === "yes") as never, { shouldValidate: true })
        }
        value={value === true ? "yes" : value === false ? "no" : ""}
        className="flex gap-4 mt-1"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="yes" id={`${id}-yes`} />
          <Label htmlFor={`${id}-yes`}>Yes</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="no" id={`${id}-no`} />
          <Label htmlFor={`${id}-no`}>No</Label>
        </div>
      </RadioGroup>
      {noteText && <p className="text-xs text-emerald mt-1">{noteText}</p>}
      <FieldError form={form} name={name} />
    </div>
  );
}

/** The URLA 5a/5b questions added to match what the LOS expects. Field names as in schemas.ts. */
export const URLA_DECLARATION_FIELDS = [
  "sellerRelationship",
  "undisclosedMortgageApplication",
  "undisclosedCreditApplication",
  "cleanEnergyLien",
  "coSignerOnUndisclosedDebt",
  "delinquentFederalDebt",
  "partyToLawsuit",
  "deedInLieu",
  "shortSale",
] as const;

export function UrlaDeclarations({
  form,
  prefix,
  isPurchase,
  you = "you",
}: {
  form: Form;
  prefix: Prefix;
  isPurchase: boolean;
  /** "you" for the borrower; the co-borrower's step reads the same. */
  you?: string;
}) {
  const q = (name: string, label: string) => <YesNoQuestion key={name} form={form} name={at(prefix, name)} label={label} />;
  return (
    <div className="space-y-4">
      {isPurchase &&
        q(
          "sellerRelationship",
          `Do ${you} have a family relationship or business affiliation with the seller of the property?`
        )}
      {q(
        "undisclosedMortgageApplication",
        `Have ${you} applied, or will ${you} apply, for a mortgage on another property before closing this loan?`
      )}
      {q(
        "undisclosedCreditApplication",
        `Have ${you} applied, or will ${you} apply, for any new credit (a car loan, credit card, etc.) before closing this loan?`
      )}
      {q(
        "cleanEnergyLien",
        "Will this property be subject to a lien that could take priority over this mortgage, such as a clean energy (PACE) loan?"
      )}
      {q(
        "coSignerOnUndisclosedDebt",
        `Are ${you} a co-signer or guarantor on any debt or loan that is not listed on this application?`
      )}
      {q("delinquentFederalDebt", `Are ${you} currently delinquent or in default on a federal debt?`)}
      {q("partyToLawsuit", `Are ${you} a party to a lawsuit in which ${you} could be held financially responsible?`)}
      {q("deedInLieu", `Have ${you} given title or a deed to a property in lieu of foreclosure in the past 7 years?`)}
      {q(
        "shortSale",
        `Have ${you} completed a pre-foreclosure sale or short sale in the past 7 years?`
      )}
    </div>
  );
}

const ETHNICITY_OPTIONS = [
  { value: "hispanic", label: "Hispanic or Latino" },
  { value: "not-hispanic", label: "Not Hispanic or Latino" },
  { value: "decline", label: "I do not wish to provide this information" },
] as const;

const ORIGIN_LABEL: Record<(typeof ETHNICITY_ORIGINS)[number], string> = {
  mexican: "Mexican",
  "puerto-rican": "Puerto Rican",
  cuban: "Cuban",
  "other-hispanic": "Other Hispanic or Latino",
};

const RACE_LABEL: Record<(typeof RACES)[number], string> = {
  "american-indian": "American Indian or Alaska Native",
  asian: "Asian",
  black: "Black or African American",
  "pacific-islander": "Native Hawaiian or Other Pacific Islander",
  white: "White",
  decline: "I do not wish to provide this information",
};

const SEX_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "decline", label: "I do not wish to provide this information" },
] as const;

function CheckboxList<T extends string>({
  form,
  name,
  options,
  labels,
  exclusive,
}: {
  form: Form;
  name: Path<ApplicationFormData>;
  options: readonly T[];
  labels: Record<T, string>;
  /** An option that clears the others when chosen, and is cleared by them. */
  exclusive?: T;
}) {
  const selected = ((form.watch(name) as T[] | undefined) ?? []) as T[];
  const toggle = (option: T, checked: boolean) => {
    let next = checked ? [...selected.filter((s) => s !== option), option] : selected.filter((s) => s !== option);
    if (checked && exclusive) {
      next = option === exclusive ? [exclusive] : next.filter((s) => s !== exclusive);
    }
    form.setValue(name, next as never, { shouldValidate: true });
  };
  const id = name.replace(/\./g, "-");
  return (
    <div className="space-y-2 mt-2">
      {options.map((option) => (
        <div key={option} className="flex items-center gap-2">
          <Checkbox
            id={`${id}-${option}`}
            checked={selected.includes(option)}
            onCheckedChange={(checked: boolean) => toggle(option, checked)}
          />
          <Label htmlFor={`${id}-${option}`} className="font-normal">
            {labels[option]}
          </Label>
        </div>
      ))}
    </div>
  );
}

function Choice({
  form,
  name,
  options,
}: {
  form: Form;
  name: Path<ApplicationFormData>;
  options: readonly { value: string; label: string }[];
}) {
  const id = name.replace(/\./g, "-");
  return (
    <RadioGroup
      onValueChange={(v: string) => form.setValue(name, v as never, { shouldValidate: true })}
      value={(form.watch(name) as string | undefined) ?? ""}
      className="space-y-2 mt-2"
    >
      {options.map((o) => (
        <div key={o.value} className="flex items-center gap-2">
          <RadioGroupItem value={o.value} id={`${id}-${o.value}`} />
          <Label htmlFor={`${id}-${o.value}`} className="font-normal">
            {o.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

/** URLA Section 8. Required to be asked; every part can be declined. */
export function DemographicsFields({ form, prefix }: { form: Form; prefix: Prefix }) {
  const ethnicity = form.watch(at(prefix, "demographics.ethnicity")) as string | undefined;
  // With nothing chosen at all (a draft saved before this section existed),
  // the error is on the section, not on its parts.
  const sectionError = get(form.formState.errors, at(prefix, "demographics"));
  const unanswered = typeof sectionError?.message === "string" && !sectionError.ethnicity;
  return (
    <div className="space-y-5">
      {unanswered && (
        <p className="text-xs text-error">
          Please answer each question below, or choose that you do not wish to provide it.
        </p>
      )}
      <p className="text-sm text-text-muted">
        The purpose of collecting this information is to help ensure that all applicants are treated
        fairly and that the housing needs of communities and neighborhoods are being fulfilled. Federal
        law requires that we ask; you are not required to provide it, and it will not affect how your
        application is evaluated.
      </p>

      <div>
        <Label className="text-sm font-semibold">Ethnicity</Label>
        <Choice form={form} name={at(prefix, "demographics.ethnicity")} options={ETHNICITY_OPTIONS} />
        <FieldError form={form} name={at(prefix, "demographics.ethnicity")} />
        {ethnicity === "hispanic" && (
          <div className="ml-6">
            <p className="text-xs text-text-muted mt-2">Optional — check any that apply:</p>
            <CheckboxList
              form={form}
              name={at(prefix, "demographics.ethnicityOrigins")}
              options={ETHNICITY_ORIGINS}
              labels={ORIGIN_LABEL}
            />
          </div>
        )}
      </div>

      <div>
        <Label className="text-sm font-semibold">Race — check one or more</Label>
        <CheckboxList
          form={form}
          name={at(prefix, "demographics.races")}
          options={RACES}
          labels={RACE_LABEL}
          exclusive="decline"
        />
        <FieldError form={form} name={at(prefix, "demographics.races")} />
      </div>

      <div>
        <Label className="text-sm font-semibold">Sex</Label>
        <Choice form={form} name={at(prefix, "demographics.sex")} options={SEX_OPTIONS} />
        <FieldError form={form} name={at(prefix, "demographics.sex")} />
      </div>
    </div>
  );
}
