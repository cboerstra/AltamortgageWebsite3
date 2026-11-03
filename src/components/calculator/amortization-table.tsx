"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { AmortizationRow } from "@/lib/calculator-utils";
import { Icons } from "@/lib/icons";

export function AmortizationTable({ schedule }: { schedule: AmortizationRow[] }) {
  const [expanded, setExpanded] = useState(false);
  const [showMonthly, setShowMonthly] = useState(false);

  // One row per year: what was paid over those 12 months, and the balance left
  // at the end of the year.
  const yearlyData = schedule.reduce<AmortizationRow[]>((years, row) => {
    const year = Math.ceil(row.month / 12);
    const current = years[year - 1];
    if (!current) {
      years.push({ ...row, month: year });
    } else {
      current.payment += row.payment;
      current.principal += row.principal;
      current.interest += row.interest;
      current.balance = row.balance;
    }
    return years;
  }, []);
  const displayData = showMonthly ? schedule : yearlyData;
  const visibleData = expanded ? displayData : displayData.slice(0, 5);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text">Amortization Schedule</h3>
        <div className="flex gap-2">
          <Button
            variant={showMonthly ? "outline" : "default"}
            size="sm"
            onClick={() => setShowMonthly(false)}
            className={!showMonthly ? "bg-navy text-white" : ""}
          >
            Yearly
          </Button>
          <Button
            variant={showMonthly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowMonthly(true)}
            className={showMonthly ? "bg-navy text-white" : ""}
          >
            Monthly
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface">
              <th className="text-left p-3 font-medium text-text-muted">{showMonthly ? "Month" : "Year"}</th>
              <th className="text-right p-3 font-medium text-text-muted">{showMonthly ? "Payment" : "Paid this year"}</th>
              <th className="text-right p-3 font-medium text-text-muted">Principal</th>
              <th className="text-right p-3 font-medium text-text-muted">Interest</th>
              <th className="text-right p-3 font-medium text-text-muted">{showMonthly ? "Balance" : "Balance at year end"}</th>
            </tr>
          </thead>
          <tbody>
            {visibleData.map((row) => (
              <tr key={row.month} className="border-t border-border">
                <td className="p-3 text-text">{row.month}</td>
                <td className="p-3 text-right text-text">{formatCurrency(row.payment)}</td>
                <td className="p-3 text-right text-emerald">{formatCurrency(row.principal)}</td>
                <td className="p-3 text-right text-text-muted">{formatCurrency(row.interest)}</td>
                <td className="p-3 text-right text-text font-medium">{formatCurrency(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {displayData.length > 5 && (
        <Button
          variant="ghost"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 w-full text-text-muted"
        >
          {expanded ? (
            <>Show Less <Icons.collapse className="w-4 h-4 ml-1" /></>
          ) : (
            <>Show Full Schedule <Icons.expand className="w-4 h-4 ml-1" /></>
          )}
        </Button>
      )}
    </div>
  );
}
