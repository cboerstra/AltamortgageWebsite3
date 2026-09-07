import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Learn how ${COMPANY.name} collects, uses, and protects your personal information. Our commitment to your privacy and data security.`,
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Privacy Policy" }]} />

      <h1 className="mt-6 text-4xl font-bold text-navy">Privacy Policy</h1>
      <p className="mt-2 text-sm text-text-muted">Last updated: May 2025</p>

      <div className="mt-8 space-y-8">
        <p className="text-text-muted leading-relaxed">
          {COMPANY.name} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
          is committed to protecting your privacy. This Privacy Policy explains
          how we collect, use, disclose, and safeguard your information when you
          visit our website or use our mortgage lending services.
        </p>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            Information We Collect
          </h2>
          <p className="text-text-muted leading-relaxed mb-3">
            We may collect the following types of information when you use our
            website or apply for a mortgage:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-text-muted leading-relaxed">
            <li>
              <strong className="text-text">Personal Information:</strong> Name,
              email address, phone number, mailing address, date of birth, and
              Social Security number.
            </li>
            <li>
              <strong className="text-text">Financial Information:</strong>{" "}
              Income, employment history, assets, debts, credit history, and
              bank account details.
            </li>
            <li>
              <strong className="text-text">Property Information:</strong>{" "}
              Property address, estimated value, property type, and intended use.
            </li>
            <li>
              <strong className="text-text">Website Usage Data:</strong> IP
              address, browser type, pages visited, time spent on pages, cookies,
              and similar tracking technologies.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            How We Use Your Information
          </h2>
          <p className="text-text-muted leading-relaxed mb-3">
            We use the information we collect for the following purposes:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-text-muted leading-relaxed">
            <li>Process and evaluate your mortgage application</li>
            <li>
              Communicate with you about your application, account, or our
              services
            </li>
            <li>Improve our website, products, and customer experience</li>
            <li>
              Comply with federal and state regulatory requirements, including
              RESPA, TILA, ECOA, and HMDA
            </li>
            <li>Prevent fraud and ensure the security of our systems</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            Information Sharing
          </h2>
          <p className="text-text-muted leading-relaxed mb-3">
            We do not sell your personal information. We may share your
            information with the following parties as necessary to provide our
            services:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-text-muted leading-relaxed">
            <li>
              <strong className="text-text">Lenders and Investors:</strong> To
              process, underwrite, and fund your mortgage loan.
            </li>
            <li>
              <strong className="text-text">Credit Bureaus:</strong> To verify
              your credit history and report loan activity.
            </li>
            <li>
              <strong className="text-text">Government Agencies:</strong> As
              required by law, including for regulatory compliance and reporting.
            </li>
            <li>
              <strong className="text-text">Service Providers:</strong> Third
              parties who assist with appraisals, title services, insurance, and
              technology — all bound by confidentiality agreements.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">Data Security</h2>
          <p className="text-text-muted leading-relaxed">
            We implement industry-standard security measures to protect your
            personal information, including encryption of data in transit and at
            rest, secure storage systems, role-based access controls, and regular
            security audits. While no method of transmission over the internet is
            100% secure, we strive to use commercially acceptable means to
            protect your data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">Your Rights</h2>
          <p className="text-text-muted leading-relaxed mb-3">
            Depending on your jurisdiction, you may have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-text-muted leading-relaxed">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>
              Request deletion of your personal information, subject to legal
              retention requirements
            </li>
            <li>Opt out of marketing communications</li>
          </ul>
          <p className="text-text-muted leading-relaxed mt-3">
            To exercise any of these rights, please contact us using the
            information below.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            Cookies and Tracking
          </h2>
          <p className="text-text-muted leading-relaxed">
            Our website uses cookies and similar technologies to enhance your
            browsing experience, analyze site traffic, and understand where our
            visitors come from. You can manage cookie preferences through your
            browser settings. Disabling cookies may limit certain functionality
            of our website.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            Changes to This Policy
          </h2>
          <p className="text-text-muted leading-relaxed">
            We may update this Privacy Policy from time to time. When we make
            changes, we will update the &quot;Last updated&quot; date at the top
            of this page. We encourage you to review this policy periodically to
            stay informed about how we protect your information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">Contact Us</h2>
          <p className="text-text-muted leading-relaxed">
            If you have questions about this Privacy Policy or our data
            practices, please contact us:
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
