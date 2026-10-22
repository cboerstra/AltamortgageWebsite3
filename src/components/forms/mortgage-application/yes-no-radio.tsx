"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function YesNoRadio({
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
