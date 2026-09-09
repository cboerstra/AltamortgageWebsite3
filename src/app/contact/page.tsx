import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PreApprovalForm } from "@/components/forms/pre-approval-form";
import { COMPANY } from "@/lib/constants";
import { Icons } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Get Pre-Approved",
  description: "Get pre-approved for a mortgage in minutes. Contact Alta Mortgage Group for a free consultation on home purchase, refinance, or home equity loans in Utah.",
};

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Get Pre-Approved" }]} />

      <div className="mt-6 grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <h1 className="text-4xl font-bold text-navy">Get Pre-Approved</h1>
          <p className="mt-2 text-text-muted text-lg">
            Fill out the form below and a mortgage specialist will reach out within 24 hours.
          </p>
          <div className="mt-8 bg-white border border-border rounded-xl p-6 lg:p-8">
            <PreApprovalForm />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-xl p-6">
            <h2 className="font-semibold text-text mb-4">Contact Information</h2>
            <div className="space-y-4">
              <a href={`tel:${COMPANY.phone.replace(/\D/g, "")}`} className="flex items-center gap-3 text-sm text-text-muted hover:text-navy transition-colors">
                <Icons.phone className="w-4 h-4 text-emerald" />
                {COMPANY.phone}
              </a>
              <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-3 text-sm text-text-muted hover:text-navy transition-colors">
                <Icons.email className="w-4 h-4 text-emerald" />
                {COMPANY.email}
              </a>
              <div className="flex items-start gap-3 text-sm text-text-muted">
                <Icons.location className="w-4 h-4 text-emerald mt-0.5" />
                <span>{COMPANY.address.street}<br />{COMPANY.address.city}, {COMPANY.address.state} {COMPANY.address.zip}</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-text-muted">
                <Icons.hours className="w-4 h-4 text-emerald mt-0.5" />
                <div>
                  <p>Mon-Fri: {COMPANY.hours.weekdays}</p>
                  <p>Saturday: {COMPANY.hours.saturday}</p>
                  <p>Sunday: {COMPANY.hours.sunday}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-navy rounded-xl p-6 text-white">
            <h2 className="font-semibold mb-2">What Happens Next?</h2>
            <ol className="space-y-3 text-sm text-white/80">
              <li className="flex gap-3"><span className="font-bold text-emerald-light">1.</span> We review your information</li>
              <li className="flex gap-3"><span className="font-bold text-emerald-light">2.</span> A specialist contacts you within 24 hours</li>
              <li className="flex gap-3"><span className="font-bold text-emerald-light">3.</span> We discuss options and next steps</li>
              <li className="flex gap-3"><span className="font-bold text-emerald-light">4.</span> You receive your pre-approval letter</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
