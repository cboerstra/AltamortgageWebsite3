import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Accessibility Statement",
  description: `${COMPANY.name} is committed to ensuring digital accessibility for all users. Learn about our WCAG 2.1 AA compliance efforts.`,
};

export default function AccessibilityPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Accessibility" }]} />

      <h1 className="mt-6 text-4xl font-bold text-navy">
        Accessibility Statement
      </h1>
      <p className="mt-2 text-sm text-text-muted">Last updated: May 2025</p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-text mb-4">Our Commitment</h2>
          <p className="text-text-muted leading-relaxed">
            {COMPANY.name} is committed to ensuring that our website is
            accessible to all users, including people with disabilities. We
            strive to conform to the Web Content Accessibility Guidelines (WCAG)
            2.1 at the AA level, which defines requirements for web content to
            be perceivable, operable, understandable, and robust for all users.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            Accessibility Features
          </h2>
          <p className="text-text-muted leading-relaxed mb-3">
            We have implemented the following accessibility features throughout
            our website:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-text-muted leading-relaxed">
            <li>
              <strong className="text-text">Keyboard Navigation:</strong> All
              interactive elements are accessible via keyboard, allowing users to
              navigate without a mouse.
            </li>
            <li>
              <strong className="text-text">Skip Links:</strong> Skip navigation
              links are provided to allow users to bypass repetitive content and
              jump directly to main content.
            </li>
            <li>
              <strong className="text-text">Semantic HTML:</strong> We use proper
              heading hierarchy, landmarks, and semantic elements to ensure
              screen readers and assistive technologies can interpret page
              structure.
            </li>
            <li>
              <strong className="text-text">ARIA Labels:</strong> Accessible
              Rich Internet Applications (ARIA) attributes are used where needed
              to provide additional context for assistive technologies.
            </li>
            <li>
              <strong className="text-text">Color Contrast:</strong> Text and
              interactive elements meet WCAG 2.1 AA minimum contrast ratio
              requirements.
            </li>
            <li>
              <strong className="text-text">Responsive Design:</strong> Our
              website is designed to work across a range of devices and screen
              sizes, including support for text resizing up to 200%.
            </li>
            <li>
              <strong className="text-text">Form Labels:</strong> All form
              inputs include associated labels and clear error messages to assist
              users in completing forms accurately.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            Reporting Accessibility Issues
          </h2>
          <p className="text-text-muted leading-relaxed">
            We welcome feedback on the accessibility of our website. If you
            encounter any barriers or have suggestions for improvement, please
            contact us:
          </p>
          <address className="mt-3 text-text-muted leading-relaxed not-italic">
            <p>
              Email:{" "}
              <a
                href={`mailto:${COMPANY.email}`}
                className="text-navy hover:underline"
              >
                {COMPANY.email}
              </a>
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
          </address>
          <p className="mt-3 text-text-muted leading-relaxed">
            When reporting an issue, please include the page URL, a description
            of the problem, and the assistive technology you were using (if
            applicable). We will do our best to respond within two business days.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            Third-Party Content
          </h2>
          <p className="text-text-muted leading-relaxed">
            Our website may include content or links to third-party services that
            are outside our control. While we strive to work with partners who
            share our commitment to accessibility, we cannot guarantee the
            accessibility of third-party content. If you experience difficulties
            with any linked service, we encourage you to contact that provider
            directly.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text mb-4">
            Ongoing Improvements
          </h2>
          <p className="text-text-muted leading-relaxed">
            Accessibility is an ongoing effort at {COMPANY.name}. We regularly
            review our website and work to identify and address accessibility
            gaps. Our team conducts periodic audits, and we incorporate
            accessibility best practices into our design and development
            processes. We are committed to continually improving the experience
            for all users.
          </p>
        </section>
      </div>
    </div>
  );
}
