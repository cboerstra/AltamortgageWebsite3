import { Hero } from "@/components/home/hero";
import { ProductCards } from "@/components/home/product-cards";
import { RateTeaser } from "@/components/home/rate-teaser";
import { LocalExpertise } from "@/components/home/local-expertise";
import { ToolsGrid } from "@/components/home/tools-grid";
import { Testimonials } from "@/components/home/testimonials";
import { WhyAlta } from "@/components/home/why-alta";
import { CTASection } from "@/components/home/cta-section";
import { generateOrganizationSchema, generateLocalBusinessSchema } from "@/lib/seo";

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateOrganizationSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateLocalBusinessSchema()) }}
      />
      <Hero />
      <ProductCards />
      <RateTeaser />
      <LocalExpertise />
      <ToolsGrid />
      <Testimonials />
      <WhyAlta />
      <CTASection />
    </>
  );
}
