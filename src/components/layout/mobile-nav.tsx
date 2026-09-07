"use client";

import Link from "next/link";
import { X, Phone } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Logo } from "./logo";
import { COMPANY, NAV_LINKS } from "@/lib/constants";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0" showCloseButton={false}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Logo />
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="p-2 text-text-muted hover:text-navy"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex flex-col p-4 gap-1" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="px-4 py-3 text-base font-medium text-text hover:bg-surface rounded-lg transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 mt-auto border-t border-border space-y-3">
          <Link
            href="/contact"
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-lg bg-emerald px-4 py-2 text-sm font-medium text-white hover:bg-emerald-light transition-colors"
          >
            Get Pre-Approved
          </Link>
          <Link
            href="/apply"
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-lg border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-navy hover:text-white transition-colors"
          >
            Apply Now
          </Link>
          <a
            href={`tel:${COMPANY.phone.replace(/\D/g, "")}`}
            className="flex items-center justify-center gap-2 text-sm text-text-muted"
          >
            <Phone className="w-4 h-4" />
            {COMPANY.phone}
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
