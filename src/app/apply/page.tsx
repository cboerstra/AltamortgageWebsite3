import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ApplicationWizard } from "@/components/forms/mortgage-application/application-wizard";

export const metadata: Metadata = {
  title: "Apply for a Mortgage",
  description:
    "Apply for a mortgage online with Alta Mortgage Group. Complete our secure application for home purchase, refinance, or home equity loans in Utah.",
};

export default function ApplyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Apply" }]} />
      <h1 className="mt-6 text-4xl font-bold text-navy">
        Mortgage Application
      </h1>
      <p className="mt-2 text-text-muted">
        Complete the application below. Your information is secure and
        encrypted. You can save your progress and return later.
      </p>
      <div className="mt-8">
        <ApplicationWizard />
      </div>
    </div>
  );
}
