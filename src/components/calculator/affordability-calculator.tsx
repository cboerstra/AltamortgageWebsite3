"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { calculateAffordability } from "@/lib/calculator-utils";
import { formatCurrency } from "@/lib/utils";

export function AffordabilityCalculator() {
  const [income, setIncome] = useState(85000);
  const [debts, setDebts] = useState(500);
  const [downPayment, setDownPayment] = useState(60000);
  const [rate, setRate] = useState(6.625);
  const [term, setTerm] = useState(30);

  const result = calculateAffordability(income, debts, downPayment, rate, term);

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-6">
        <div>
          <Label className="text-sm font-medium text-text">Annual Household Income: {formatCurrency(income)}</Label>
          <Slider value={[income]} onValueChange={(v) => setIncome(Array.isArray(v) ? v[0] : v)} min={20000} max={500000} step={5000} className="mt-2" />
          <Input type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))} className="mt-2" />
        </div>
        <div>
          <Label className="text-sm font-medium text-text">Monthly Debt Payments: {formatCurrency(debts)}</Label>
          <Slider value={[debts]} onValueChange={(v) => setDebts(Array.isArray(v) ? v[0] : v)} min={0} max={5000} step={50} className="mt-2" />
          <Input type="number" value={debts} onChange={(e) => setDebts(Number(e.target.value))} className="mt-2" />
        </div>
        <div>
          <Label className="text-sm font-medium text-text">Down Payment Available: {formatCurrency(downPayment)}</Label>
          <Slider value={[downPayment]} onValueChange={(v) => setDownPayment(Array.isArray(v) ? v[0] : v)} min={0} max={500000} step={5000} className="mt-2" />
        </div>
        <div>
          <Label className="text-sm font-medium text-text">Interest Rate (%)</Label>
          <Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} step={0.125} className="mt-2" />
        </div>
        <div>
          <Label className="text-sm font-medium text-text">Loan Term</Label>
          <div className="flex gap-2 mt-2">
            {[15, 20, 30].map((t) => (
              <button key={t} onClick={() => setTerm(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${term === t ? "bg-navy text-white" : "bg-surface text-text-muted hover:bg-border"}`}>
                {t} years
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-surface-warm rounded-xl p-8 text-center">
          <p className="text-sm text-text-muted">You can afford a home up to</p>
          <p className="text-5xl font-bold font-display text-navy mt-2">{formatCurrency(Math.round(result.maxHomePrice))}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-text-muted">Max Monthly Payment</p>
            <p className="text-2xl font-bold font-display text-emerald mt-1">{formatCurrency(Math.round(result.maxMonthlyPayment))}</p>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-text-muted">Debt-to-Income Ratio</p>
            <p className="text-2xl font-bold font-display text-navy mt-1">{result.dti.toFixed(1)}%</p>
            <p className="text-xs text-text-muted mt-1">{result.dti <= 36 ? "Excellent" : result.dti <= 43 ? "Acceptable" : "High"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
