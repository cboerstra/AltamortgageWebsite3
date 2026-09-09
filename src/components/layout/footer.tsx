import Link from "next/link";
import { Logo } from "./logo";
import { COMPANY } from "@/lib/constants";
import { Icons } from "@/lib/icons";

const footerLinks = {
  products: {
    title: "Products",
    links: [
      { label: "Home Purchase", href: "/purchase" },
      { label: "Refinance", href: "/refinance" },
      { label: "Home Equity", href: "/home-equity" },
      { label: "Loan Options", href: "/loan-options" },
      { label: "Mortgage Rates", href: "/rates" },
      { label: "Mortgage Calculator", href: "/mortgage-calculator" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "First-Time Homebuyer", href: "/first-time-homebuyer" },
      { label: "Learning Center", href: "/learning-center" },
      { label: "Utah Mortgages", href: "/utah" },
      { label: "Weber County", href: "/utah/weber-county" },
      { label: "Davis County", href: "/utah/davis-county" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Apply Now", href: "/apply" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Licensing", href: "/licensing" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
};

export function Footer() {
  return (
    <footer className="bg-navy-dark text-white" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60 mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/80 hover:text-emerald-light transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="text-xs text-white/50 max-w-md">
                {COMPANY.name} NMLS# {COMPANY.nmlsId}. Licensed by the Utah Division of Real Estate.
                Equal Housing Opportunity. All rights reserved.
              </p>
              <p className="text-xs text-white/50">
                {COMPANY.address.street}, {COMPANY.address.city}, {COMPANY.address.state}{" "}
                {COMPANY.address.zip} | {COMPANY.phone}
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-4">
              <div className="flex items-center gap-4">
                <a
                  href={COMPANY.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <Icons.facebook className="w-5 h-5" />
                </a>
                <a
                  href={COMPANY.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <Icons.instagram className="w-5 h-5" />
                </a>
                <a
                  href={COMPANY.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <Icons.linkedin className="w-5 h-5" />
                </a>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span className="border border-white/20 px-2 py-1 rounded text-[10px]">
                  EQUAL HOUSING OPPORTUNITY
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-white/30 mt-8">
          &copy; {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
