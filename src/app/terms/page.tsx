import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${COMPANY.name}. Please review these terms before using our website and mortgage lending services.`,
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Terms of Service" }]} />

      <h1 className="mt-6 text-4xl font-bold text-navy">Terms of Service</h1>
      <p className="mt-2 text-sm text-text-muted">Last updated: May 2025</p>

      <div className="mt-8 space-y-8">
        <p className="text-text-muted leading-relaxed">
          Welcome to the {COMPANY.name} website. By accessing or using our
          website and services, you agree to be bound by these Terms of Service.
          Please read them carefully.
        </p>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            Acceptance of Terms
          </h2>
          <p className="text-text-muted leading-relaxed">
            By accessing or using our website at {COMPANY.domain}, you agree to
            comply with and be bound by these Terms of Service and our Privacy
            Policy. If you do not agree to these terms, please do not use our
            website or services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">Use of Website</h2>
          <p className="text-text-muted leading-relaxed">
            This website is provided for informational purposes only. The
            content on this site does not constitute a commitment to lend,
            pre-approval, or a guarantee of any specific loan terms. All loan
            programs are subject to underwriting guidelines, credit approval, and
            property appraisal. {COMPANY.name} reserves the right to modify or
            discontinue any aspect of the website at any time without notice.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            Rate and Product Disclaimers
          </h2>
          <p className="text-text-muted leading-relaxed">
            Interest rates, annual percentage rates (APRs), and loan programs
            displayed on this website are for informational purposes only and are
            subject to change without notice. Rates shown may include discount
            points and are based on specific assumptions that may not apply to
            your situation. Your actual rate, payment, and costs may differ based
            on your credit profile, loan amount, property type, occupancy, and
            other factors. A rate quote is not a guarantee or commitment to lend
            at a specific rate.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            User Accounts and Applications
          </h2>
          <p className="text-text-muted leading-relaxed">
            When you submit a mortgage application or inquiry through our
            website, you agree to provide accurate, current, and complete
            information. You understand that providing false, misleading, or
            incomplete information may result in denial of your application and
            may constitute fraud under federal and state law. You are responsible
            for maintaining the confidentiality of any account credentials
            associated with our services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            Intellectual Property
          </h2>
          <p className="text-text-muted leading-relaxed">
            All content on this website, including text, graphics, logos, images,
            and software, is the property of {COMPANY.name} or its content
            suppliers and is protected by United States and international
            copyright, trademark, and other intellectual property laws. You may
            not reproduce, distribute, modify, or create derivative works from
            any content on this website without our prior written consent.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            Limitation of Liability
          </h2>
          <p className="text-text-muted leading-relaxed">
            To the fullest extent permitted by law, {COMPANY.name} shall not be
            liable for any indirect, incidental, special, consequential, or
            punitive damages arising from your use of or inability to use our
            website or services. This includes, without limitation, damages for
            loss of profits, data, or other intangibles, even if we have been
            advised of the possibility of such damages. Our total liability for
            any claim arising from these terms shall not exceed the amount you
            paid to us, if any, during the twelve months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            Third-Party Links
          </h2>
          <p className="text-text-muted leading-relaxed">
            Our website may contain links to third-party websites or services
            that are not owned or controlled by {COMPANY.name}. We have no
            control over and assume no responsibility for the content, privacy
            policies, or practices of any third-party sites or services.
            Accessing third-party links is at your own risk, and we encourage you
            to review the terms and privacy policies of any site you visit.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">Governing Law</h2>
          <p className="text-text-muted leading-relaxed">
            These Terms of Service shall be governed by and construed in
            accordance with the laws of the State of Utah, without regard to its
            conflict of law principles. Any disputes arising under or in
            connection with these terms shall be subject to the exclusive
            jurisdiction of the state and federal courts located in Weber County,
            Utah.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            Contact Information
          </h2>
          <p className="text-text-muted leading-relaxed">
            If you have questions about these Terms of Service, please contact
            us:
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
