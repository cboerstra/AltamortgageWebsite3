"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { preApprovalSchema, type PreApprovalFormData } from "@/lib/schemas";
import { Icons } from "@/lib/icons";

export function PreApprovalForm() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const totalSteps = 4;

  const form = useForm<PreApprovalFormData>({
    resolver: zodResolver(preApprovalSchema),
    mode: "onTouched",
  });

  const { register, handleSubmit, setValue, formState: { errors } } = form;

  const onSubmit = async (data: PreApprovalFormData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          loanPurpose: data.loanPurpose,
          estimatedAmount: data.estimatedAmount,
          propertyType: data.propertyType,
          propertyZip: data.propertyZip,
          firstTimeBuyer: data.firstTimeBuyer,
          timeline: data.timeline,
          source: window.location.pathname,
          timestamp: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setStep(totalSteps);
      }
    } catch {
      // Stay on current step for retry
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <Icons.success className="w-16 h-16 text-emerald mx-auto" />
        <h2 className="text-2xl font-bold text-navy mt-4">You&apos;re Pre-Approved!</h2>
        <p className="text-text-muted mt-2 max-w-md mx-auto">
          Thank you for your submission. A loan specialist will contact you within 24 hours to discuss your options and next steps.
        </p>
      </div>
    );
  }

  const selectClass = "mt-1 h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

  return (
    <div>
      <Progress value={(step / totalSteps) * 100} className="mb-8" />
      <p className="text-sm text-text-muted mb-6">Step {step} of {totalSteps - 1}</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-text">Personal Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input {...register("firstName")} className="mt-1" />
                {errors.firstName && <p className="text-xs text-error mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <Label>Last Name</Label>
                <Input {...register("lastName")} className="mt-1" />
                {errors.lastName && <p className="text-xs text-error mt-1">{errors.lastName.message}</p>}
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input {...register("email")} type="email" className="mt-1" />
              {errors.email && <p className="text-xs text-error mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label>Phone</Label>
              <Input {...register("phone")} type="tel" className="mt-1" />
              {errors.phone && <p className="text-xs text-error mt-1">{errors.phone.message}</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-text">Loan Details</h2>
            <div>
              <Label>Loan Purpose</Label>
              <select {...register("loanPurpose")} className={selectClass} defaultValue="">
                <option value="" disabled>Select purpose</option>
                <option value="purchase">Purchase a Home</option>
                <option value="refinance">Refinance</option>
                <option value="home-equity">Home Equity</option>
              </select>
            </div>
            <div>
              <Label>Estimated Loan Amount</Label>
              <select {...register("estimatedAmount")} className={selectClass} defaultValue="">
                <option value="" disabled>Select range</option>
                <option value="under-200k">Under $200,000</option>
                <option value="200k-400k">$200,000 - $400,000</option>
                <option value="400k-600k">$400,000 - $600,000</option>
                <option value="600k-800k">$600,000 - $800,000</option>
                <option value="over-800k">Over $800,000</option>
              </select>
            </div>
            <div>
              <Label>Timeline</Label>
              <select {...register("timeline")} className={selectClass} defaultValue="">
                <option value="" disabled>When do you need financing?</option>
                <option value="asap">As soon as possible</option>
                <option value="1-3months">1-3 months</option>
                <option value="3-6months">3-6 months</option>
                <option value="6-12months">6-12 months</option>
                <option value="justLooking">Just looking</option>
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-text">Property Information</h2>
            <div>
              <Label>Property Type</Label>
              <select {...register("propertyType")} className={selectClass} defaultValue="">
                <option value="" disabled>Select type</option>
                <option value="single-family">Single Family</option>
                <option value="condo">Condo</option>
                <option value="townhome">Townhome</option>
                <option value="multi-family">Multi-Family</option>
                <option value="manufactured">Manufactured</option>
              </select>
            </div>
            <div>
              <Label>Property ZIP Code</Label>
              <Input {...register("propertyZip")} maxLength={5} className="mt-1" placeholder="84401" />
              {errors.propertyZip && <p className="text-xs text-error mt-1">{errors.propertyZip.message}</p>}
            </div>
            <div>
              <Label>First-Time Homebuyer?</Label>
              <RadioGroup onValueChange={(v: string) => setValue("firstTimeBuyer", v as "yes" | "no")} className="flex gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="yes" id="ftb-yes" />
                  <Label htmlFor="ftb-yes">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="no" id="ftb-no" />
                  <Label htmlFor="ftb-no">No</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
              <Icons.prev className="w-4 h-4 mr-2" /> Back
            </Button>
          )}
          {step < 3 ? (
            <Button type="button" onClick={() => setStep(step + 1)} className="ml-auto bg-navy hover:bg-navy-light text-white">
              Next <Icons.next className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" disabled={submitting} className="ml-auto bg-emerald hover:bg-emerald-light text-white px-8">
              {submitting ? <Icons.loading className="w-4 h-4 animate-spin" /> : "Submit Pre-Approval Request"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
