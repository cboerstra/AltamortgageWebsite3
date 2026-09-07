import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://altamortgagegroup.net";
  const now = new Date().toISOString();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/purchase`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/refinance`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/home-equity`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/loan-options`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/mortgage-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/rates`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/apply`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/utah`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/utah/weber-county`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/utah/davis-county`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/first-time-homebuyer`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/learning-center`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/licensing`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/accessibility`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
