"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { CalculatorPieChart } from "./calculator-chart";
import { AmortizationTable } from "./amortization-table";
import { calculatePaymentBreakdown, generateAmortizationSchedule } from "@/lib/calculator-utils";
import { formatCurrency } from "@/lib/utils";

export function PaymentCalculator() {
  const [homePrice, setHomePrice] = useState(400000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [rate, setRate] = useState(6.625);
  const [term, setTerm] = useState(30);
  const [annualTax, setAnnualTax] = useState(3200);
  const [annualInsurance, setAnnualInsurance] = useState(1800);
  const [monthlyHOA, setMonthlyHOA] = useState(0);

  const downPayment = homePrice * (downPaymentPct / 100);
  const principal = homePrice - downPayment;

  const breakdown = calculatePaymentBreakdown(
    homePrice, downPayment, rate, term, annualTax, annualInsurance, monthlyHOA
  );

  const schedule = generateAmortizationSchedule(principal, rate, term);

  const chartData = [
    { name: "Principal & Interest", value: Math.round(breakdown.monthlyPrincipalInterest), color: "#003087" },
    { name: "Property Tax", value: Math.round(breakdown.monthlyTax), color: "#00A86B" },
    { name: "Insurance", value: Math.round(breakdown.monthlyInsurance), color: "#1a4a9e" },
    { name: "HOA", value: Math.round(breakdown.monthlyHOA), color: "#6B7280" },
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-6">
        <div>
          <Label className="text-sm font-medium text-text">Home Price: {formatCurrency(homePrice)}</Label>
          <Slider
            value={[homePrice]}
            onValueChange={(v) => setHomePrice(Array.isArray(v) ? v[0] : v)}
            min={50000} max={2000000} step={5000}
            className="mt-2"
          />
          <Input
            type="number"
            value={homePrice}
            onChange={(e) => setHomePrice(Number(e.target.value))}
            className="mt-2"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-text">Down Payment: {downPaymentPct}% ({formatCurrency(downPayment)})</Label>
          <Slider
            value={[downPaymentPct]}
            onValueChange={(v) => setDownPaymentPct(Array.isArray(v) ? v[0] : v)}
            min={0} max={50} step={1}
            className="mt-2"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-text">Loan Term</Label>
          <div className="flex gap-2 mt-2">
            {[15, 20, 30].map((t) => (
              <button
                key={t}
                onClick={() => setTerm(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  term === t ? "bg-navy text-white" : "bg-surface text-text-muted hover:bg-border"
                }`}
              >
                {t} years
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-text">Interest Rate (%)</Label>
          <Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} step={0.125} className="mt-2" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-text-muted">Annual Tax</Label>
            <Input type="number" value={annualTax} onChange={(e) => setAnnualTax(Number(e.target.value))} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-text-muted">Annual Insurance</Label>
            <Input type="number" value={annualInsurance} onChange={(e) => setAnnualInsurance(Number(e.target.value))} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-text-muted">Monthly HOA</Label>
            <Input type="number" value={monthlyHOA} onChange={(e) => setMonthlyHOA(Number(e.target.value))} className="mt-1" />
          </div>
        </div>
      </div>

      <div>
        <div className="text-center mb-6">
          <p className="text-sm text-text-muted">Estimated Monthly Payment</p>
          <p className="text-5xl font-bold font-display text-navy mt-2">
            {formatCurrency(Math.round(breakdown.totalMonthly))}
          </p>
        </div>
        <CalculatorPieChart data={chartData} />
      </div>

      <div className="lg:col-span-2">
        <AmortizationTable schedule={schedule} />
      </div>
    </div>
  );
}
