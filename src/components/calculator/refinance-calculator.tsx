"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateRefinanceSavings } from "@/lib/calculator-utils";
import { formatCurrency } from "@/lib/utils";

export function RefinanceCalculator() {
  const [balance, setBalance] = useState(300000);
  const [currentRate, setCurrentRate] = useState(7.5);
  const [currentPayment, setCurrentPayment] = useState(2098);
  const [newRate, setNewRate] = useState(6.625);
  const [newTerm, setNewTerm] = useState(30);
  const [closingCosts, setClosingCosts] = useState(6000);

  const result = calculateRefinanceSavings(balance, currentRate, currentPayment, newRate, newTerm, closingCosts);

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-6">
        <div>
          <Label className="text-sm font-medium text-text">Current Loan Balance</Label>
          <Input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} className="mt-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-text">Current Rate (%)</Label>
            <Input type="number" value={currentRate} onChange={(e) => setCurrentRate(Number(e.target.value))} step={0.125} className="mt-2" />
          </div>
          <div>
            <Label className="text-sm font-medium text-text">Current Payment</Label>
            <Input type="number" value={currentPayment} onChange={(e) => setCurrentPayment(Number(e.target.value))} className="mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-text">New Rate (%)</Label>
            <Input type="number" value={newRate} onChange={(e) => setNewRate(Number(e.target.value))} step={0.125} className="mt-2" />
          </div>
          <div>
            <Label className="text-sm font-medium text-text">New Term (years)</Label>
            <div className="flex gap-2 mt-2">
              {[15, 20, 30].map((t) => (
                <button key={t} onClick={() => setNewTerm(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${newTerm === t ? "bg-navy text-white" : "bg-surface text-text-muted hover:bg-border"}`}>
                  {t}yr
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-text">Estimated Closing Costs</Label>
          <Input type="number" value={closingCosts} onChange={(e) => setClosingCosts(Number(e.target.value))} className="mt-2" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-surface-warm rounded-xl p-6 text-center">
          <p className="text-sm text-text-muted">New Monthly Payment</p>
          <p className="text-4xl font-bold font-display text-navy mt-1">{formatCurrency(Math.round(result.newMonthlyPayment))}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-text-muted">Monthly Savings</p>
            <p className={`text-xl font-bold font-display mt-1 ${result.monthlySavings > 0 ? "text-emerald" : "text-error"}`}>
              {result.monthlySavings > 0 ? "+" : ""}{formatCurrency(Math.round(result.monthlySavings))}
            </p>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-text-muted">Total Savings</p>
            <p className={`text-xl font-bold font-display mt-1 ${result.totalSavings > 0 ? "text-emerald" : "text-error"}`}>
              {formatCurrency(Math.round(result.totalSavings))}
            </p>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-text-muted">Break Even</p>
            <p className="text-xl font-bold font-display text-navy mt-1">
              {result.breakEvenMonths === Infinity ? "N/A" : `${result.breakEvenMonths} mo`}
            </p>
          </div>
        </div>
        {result.monthlySavings > 0 && (
          <p className="text-sm text-text-muted text-center mt-4">
            You&apos;ll recoup closing costs in {result.breakEvenMonths} months and save {formatCurrency(Math.round(result.totalSavings))} over the life of the loan.
          </p>
        )}
      </div>
    </div>
  );
}
