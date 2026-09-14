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
      <div className="bg-navy-deeper text-white/85 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-10">
          <div className="flex items-center gap-4">
            <a
              href={`tel:${COMPANY.phone.replace(/\D/g, "")}`}
              className="flex items-center gap-1.5 hover:text-gold-light transition-colors"
            >
              <Icons.phone className="w-3.5 h-3.5" />
              <span>{COMPANY.phone}</span>
            </a>
            <span className="hidden sm:flex items-center gap-1.5 text-white/60">
              <Icons.hours className="w-3.5 h-3.5" />
              <span>Mon-Fri {COMPANY.hours.weekdays}</span>
            </span>
          </div>
          <Link href="/portal/login" className="hover:text-gold-light transition-colors">
            Your application
          </Link>
        </div>
      </div>

      {/* Main Nav — dark green anchor */}
      <header className="sticky top-0 z-50 bg-navy-dark border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-24">
          <Logo height={80} />
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-semibold whitespace-nowrap text-white/85 hover:text-white transition-colors rounded-full hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/apply"
              className="hidden xl:inline-flex items-center justify-center whitespace-nowrap rounded-full border border-white/70 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Apply Now
            </Link>
            <Link
              href="/contact"
              className="hidden sm:inline-flex items-center justify-center whitespace-nowrap rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy-deeper hover:bg-gold-light transition-colors"
            >
              Get Pre-Approved
            </Link>
            <button
              className="lg:hidden p-2 text-white/85 hover:text-white"
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
