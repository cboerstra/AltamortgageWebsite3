"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icons } from "@/lib/icons";

const miniLeadSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Valid phone required"),
  loanPurpose: z.enum(["purchase", "refinance", "home-equity", "cash-out"]),
});

type MiniLeadData = z.infer<typeof miniLeadSchema>;

export function MiniLeadForm({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<MiniLeadData>({
    resolver: zodResolver(miniLeadSchema),
  });

  const onSubmit = async (data: MiniLeadData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          source: window.location.pathname,
          utm: Object.fromEntries(new URLSearchParams(window.location.search)),
          timestamp: new Date().toISOString(),
        }),
      });
      if (res.ok) setSubmitted(true);
    } catch {
      // Silently fail — form stays visible for retry
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-3 py-4">
        <Icons.success className={`w-6 h-6 ${variant === "dark" ? "text-emerald-light" : "text-emerald"}`} />
        <p className={variant === "dark" ? "text-white" : "text-text"}>
          Thank you! A loan specialist will contact you within 24 hours.
        </p>
      </div>
    );
  }

  const inputClass = variant === "dark"
    ? "bg-white/10 border-white/20 text-white placeholder:text-white/50"
    : "bg-white border-border text-text";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <Input {...register("name")} placeholder="Full Name" className={inputClass} aria-label="Full Name" />
        {errors.name && <p className="text-xs text-error mt-1">{errors.name.message}</p>}
      </div>
      <div className="flex-1">
        <Input {...register("email")} type="email" placeholder="Email" className={inputClass} aria-label="Email" />
        {errors.email && <p className="text-xs text-error mt-1">{errors.email.message}</p>}
      </div>
      <div className="flex-1">
        <Input {...register("phone")} type="tel" placeholder="Phone" className={inputClass} aria-label="Phone" />
        {errors.phone && <p className="text-xs text-error mt-1">{errors.phone.message}</p>}
      </div>
      <div className="flex-1">
        <select
          {...register("loanPurpose")}
          className={`h-8 w-full rounded-lg border px-2.5 text-sm ${inputClass}`}
          aria-label="Loan Purpose"
          defaultValue=""
        >
          <option value="" disabled>Loan Purpose</option>
          <option value="purchase">Purchase</option>
          <option value="refinance">Refinance</option>
          <option value="home-equity">Home Equity</option>
          <option value="cash-out">Cash-Out Refi</option>
        </select>
      </div>
      <Button type="submit" disabled={submitting} className="bg-emerald hover:bg-emerald-light text-white px-8 whitespace-nowrap">
        {submitting ? <Icons.loading className="w-4 h-4 animate-spin" /> : "Get Started"}
      </Button>
    </form>
  );
}
