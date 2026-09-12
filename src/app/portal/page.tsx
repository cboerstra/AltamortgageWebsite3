import type { Metadata } from "next";
import Link from "next/link";
import { SignOutButton } from "@/components/portal/sign-out-button";
import { DocumentVault } from "@/components/portal/document-vault";
import { requireBorrowerPage } from "@/lib/portal/session";
import { getBorrowerOverview } from "@/lib/portal/overview";
import { listBorrowerDocuments } from "@/lib/portal/documents";
import { Icons } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Your application",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STEP_LABELS = [
  "Loan information",
  "Personal information",
  "Employment & income",
  "Assets & liabilities",
  "Declarations",
  "Review & submit",
];

const PURPOSE: Record<string, string> = {
  purchase: "Purchase",
  refinance: "Refinance",
  "home-equity": "Home equity",
};

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function PortalPage() {
  const borrower = await requireBorrowerPage();
  const [overview, documents] = await Promise.all([
    getBorrowerOverview(borrower),
    listBorrowerDocuments(borrower.id),
  ]);

  const greeting = borrower.firstName ? `Welcome back, ${borrower.firstName}` : "Welcome back";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy">{greeting}</h1>
          <p className="mt-1 text-sm text-text-muted">{borrower.email}</p>
        </div>
        <SignOutButton />
      </div>

      {/* ---- Application status ---- */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-navy">Your application</h2>

        {overview.draft && (
          <div className="mt-3 rounded-xl border border-gold/40 bg-surface-warm p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-medium text-text">Application in progress</div>
                <div className="mt-1 text-sm text-text-muted">
                  You reached step {Math.min(overview.draft.furthestStep + 1, STEP_LABELS.length)} of{" "}
                  {STEP_LABELS.length} ({STEP_LABELS[Math.min(overview.draft.furthestStep, STEP_LABELS.length - 1)]}).
                  Last saved {when(overview.draft.lastActivityAt)}.
                </div>
              </div>
              {overview.draft.resumeUrl ? (
                <Link
                  href={overview.draft.resumeUrl}
                  className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light"
                >
                  Continue application <Icons.next className="h-4 w-4" />
                </Link>
              ) : (
                <Link href="/apply" className="text-sm text-navy underline underline-offset-2">
                  Open the application
                </Link>
              )}
            </div>
          </div>
        )}

        {overview.applications.length > 0 && (
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-white">
            {overview.applications.map((app) => (
              <li key={app.refNumber} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Icons.success className="h-6 w-6 text-emerald" />
                  <div>
                    <div className="font-medium text-text">
                      {PURPOSE[app.loanPurpose] ?? app.loanPurpose} application submitted
                    </div>
                    <div className="text-sm text-text-muted">
                      Reference <span className="font-mono font-semibold">{app.refNumber}</span> · {when(app.createdAt)}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-text-muted">A loan specialist will contact you within one business day.</span>
              </li>
            ))}
          </ul>
        )}

        {!overview.draft && overview.applications.length === 0 && (
          <div className="mt-3 rounded-xl border border-border bg-white p-5 text-sm text-text-muted">
            We could not find an application for this email.{" "}
            <Link href="/apply" className="text-navy underline underline-offset-2">Start one</Link>.
          </div>
        )}
      </section>

      {/* ---- Documents ---- */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-navy">Your documents</h2>
        <p className="mt-1 text-sm text-text-muted">
          Upload the items below so we can move your application forward. Files are encrypted
          when stored and are only visible to you and your loan specialist. PDF, JPG or PNG,
          up to 25 MB each. Clear phone photos are fine as long as the whole page is visible.
        </p>
        <div className="mt-5">
          <DocumentVault initialDocuments={documents} />
        </div>
      </section>
    </div>
  );
}
