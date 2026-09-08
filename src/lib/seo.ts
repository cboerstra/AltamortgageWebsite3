import { COMPANY, SERVICE_AREAS } from "./constants";
import { IMAGES, absoluteImageUrl } from "./images";

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY.name,
    url: `https://${COMPANY.domain}`,
    logo: absoluteImageUrl(IMAGES.logoFull),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: COMPANY.phone,
      contactType: "customer service",
      areaServed: "US",
      availableLanguage: "English",
    },
    sameAs: Object.values(COMPANY.social),
  };
}

export function generateLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "MortgageBroker",
    name: COMPANY.name,
    url: `https://${COMPANY.domain}`,
    telephone: COMPANY.phone,
    email: COMPANY.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.address.street,
      addressLocality: COMPANY.address.city,
      addressRegion: COMPANY.address.state,
      postalCode: COMPANY.address.zip,
      addressCountry: "US",
    },
    areaServed: SERVICE_AREAS.counties.map((county) => ({
      "@type": "AdministrativeArea",
      name: `${county.name}, ${SERVICE_AREAS.state}`,
    })),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "10:00",
        closes: "14:00",
      },
    ],
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateReviewSchema(reviews: { author: string; rating: number; body: string }[]) {
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: COMPANY.name,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avgRating.toFixed(1),
      reviewCount: reviews.length,
      bestRating: "5",
      worstRating: "1",
    },
    review: reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewRating: { "@type": "Rating", ratingValue: r.rating },
      reviewBody: r.body,
    })),
  };
}
