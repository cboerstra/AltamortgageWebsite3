import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Licensing Information",
  description: `${COMPANY.name} licensing and regulatory information. NMLS registration, Utah state licensing, and Equal Housing Opportunity details.`,
};

export default function LicensingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Licensing" }]} />

      <h1 className="mt-6 text-4xl font-bold text-navy">
        Licensing Information
      </h1>
      <p className="mt-2 text-sm text-text-muted">Last updated: May 2025</p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            NMLS Registration
          </h2>
          <p className="text-text-muted leading-relaxed">
            {COMPANY.name} is registered with the Nationwide Multistate
            Licensing System &amp; Registry (NMLS).
          </p>
          <p className="mt-3 text-text-muted leading-relaxed">
            <strong className="text-text">NMLS ID:</strong> {COMPANY.nmlsId}
          </p>
          <p className="mt-1 text-text-muted leading-relaxed">
            <strong className="text-text">Utah State License:</strong>{" "}
            {COMPANY.stateLicenseId}
          </p>
          <p className="mt-3 text-text-muted leading-relaxed">
            The NMLS is a system created by the Conference of State Bank
            Supervisors (CSBS) and the American Association of Residential
            Mortgage Regulators (AARMR) to manage licensing for mortgage
            companies and loan originators across the United States. Consumers
            can verify the licensing status of any mortgage company or loan
            officer through NMLS Consumer Access.
          </p>
          <p className="mt-3">
            <a
              href="https://www.nmlsconsumeraccess.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-navy font-medium hover:underline"
            >
              Verify our license on NMLS Consumer Access &rarr;
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            Utah State Licensing
          </h2>
          <p className="text-text-muted leading-relaxed">
            {COMPANY.name} is licensed by the Utah Division of Real Estate to
            conduct mortgage lending activities within the State of Utah. Our
            operations are subject to oversight and regulation by the Utah
            Department of Commerce, Division of Real Estate.
          </p>
          <p className="mt-3 text-text-muted leading-relaxed">
            For questions regarding our state license or to file a complaint, you
            may contact the Utah Division of Real Estate at{" "}
            <a
              href="https://realestate.utah.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-navy font-medium hover:underline"
            >
              realestate.utah.gov
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            Equal Housing Opportunity
          </h2>
          <p className="text-text-muted leading-relaxed">
            {COMPANY.name} is an Equal Housing Opportunity lender. We are
            committed to providing equal access to housing and mortgage services
            regardless of race, color, religion, national origin, sex, familial
            status, or disability, in accordance with the Fair Housing Act.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-text rounded flex items-center justify-center text-xs font-bold text-text leading-none text-center">
              EQUAL
              <br />
              HOUSING
            </div>
            <span className="text-sm text-text-muted">
              Equal Housing Opportunity
            </span>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            Equal Credit Opportunity Act
          </h2>
          <p className="text-text-muted leading-relaxed">
            In compliance with the Equal Credit Opportunity Act (ECOA),{" "}
            {COMPANY.name} does not discriminate against credit applicants on the
            basis of race, color, religion, national origin, sex, marital
            status, age (provided the applicant has the capacity to enter into a
            binding contract), because all or part of the applicant&apos;s income
            derives from a public assistance program, or because the applicant
            has in good faith exercised any right under the Consumer Credit
            Protection Act.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            Contact Information
          </h2>
          <p className="text-text-muted leading-relaxed">
            For questions about our licensing or regulatory compliance, please
            contact us:
          </p>
          <address className="mt-3 text-text-muted leading-relaxed not-italic">
            <p className="font-semibold text-text">{COMPANY.name}</p>
            <p>
              {COMPANY.address.street}, {COMPANY.address.city},{" "}
              {COMPANY.address.state} {COMPANY.address.zip}
            </p>
            <p>
              Phone:{" "}
              <a
                href={`tel:${COMPANY.phone.replace(/\D/g, "")}`}
                className="text-navy hover:underline"
              >
                {COMPANY.phone}
              </a>
            </p>
            <p>
              Email:{" "}
              <a
                href={`mailto:${COMPANY.email}`}
                className="text-navy hover:underline"
              >
                {COMPANY.email}
              </a>
            </p>
          </address>
        </section>
      </div>
    </div>
  );
}
