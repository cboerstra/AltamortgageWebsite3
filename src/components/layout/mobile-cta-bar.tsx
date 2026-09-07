"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { COMPANY } from "@/lib/constants";

export function MobileCTABar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border p-3 flex gap-2 lg:hidden">
      <Link
        href="/contact"
        className="flex-1 bg-emerald hover:bg-emerald-light text-white text-center py-3 rounded-lg font-medium text-sm transition-colors"
      >
        Get Pre-Approved
      </Link>
      <a
        href={`tel:${COMPANY.phone.replace(/\D/g, "")}`}
        className="flex items-center justify-center gap-2 bg-navy hover:bg-navy-light text-white px-4 py-3 rounded-lg font-medium text-sm transition-colors"
      >
        <Phone className="w-4 h-4" />
        Call
      </a>
    </div>
  );
}
