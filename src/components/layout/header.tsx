"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { COMPANY, NAV_LINKS } from "@/lib/constants";
import { Icons } from "@/lib/icons";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Utility Bar */}
      <div className="bg-navy text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-10">
          <div className="flex items-center gap-4">
            <a
              href={`tel:${COMPANY.phone.replace(/\D/g, "")}`}
              className="flex items-center gap-1.5 hover:text-emerald-light transition-colors"
            >
              <Icons.phone className="w-3.5 h-3.5" />
              <span>{COMPANY.phone}</span>
            </a>
            <span className="hidden sm:flex items-center gap-1.5 text-white/70">
              <Icons.hours className="w-3.5 h-3.5" />
              <span>Mon-Fri {COMPANY.hours.weekdays}</span>
            </span>
          </div>
          <Link href="/apply" className="font-medium hover:text-emerald-light transition-colors">
            Apply Now
          </Link>
        </div>
      </div>

      {/* Main Nav */}
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-24">
          <Logo />
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-text-muted hover:text-navy transition-colors rounded-md hover:bg-surface"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="hidden sm:inline-flex items-center justify-center rounded-lg bg-emerald px-4 py-2 text-sm font-medium text-white hover:bg-emerald-light transition-colors"
            >
              Get Pre-Approved
            </Link>
            <button
              className="lg:hidden p-2 text-text-muted hover:text-navy"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Icons.menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
