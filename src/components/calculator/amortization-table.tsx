"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { AmortizationRow } from "@/lib/calculator-utils";
import { Icons } from "@/lib/icons";

export function AmortizationTable({ schedule }: { schedule: AmortizationRow[] }) {
  const [expanded, setExpanded] = useState(false);
  const [showMonthly, setShowMonthly] = useState(false);

  const yearlyData = schedule.filter((_, i) => (i + 1) % 12 === 0 || i === schedule.length - 1);
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
              <th className="text-right p-3 font-medium text-text-muted">Payment</th>
              <th className="text-right p-3 font-medium text-text-muted">Principal</th>
              <th className="text-right p-3 font-medium text-text-muted">Interest</th>
              <th className="text-right p-3 font-medium text-text-muted">Balance</th>
            </tr>
          </thead>
          <tbody>
            {visibleData.map((row) => (
              <tr key={row.month} className="border-t border-border">
                <td className="p-3 text-text">{showMonthly ? row.month : Math.ceil(row.month / 12)}</td>
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
