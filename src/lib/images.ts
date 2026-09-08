import { COMPANY } from "./constants";

/**
 * Every graphic in the site lives under `public/images/` and is served from
 * `/images/...` on whatever host is running the app (localhost, staging, or
 * https://altamortgagegroup.net in production).
 *
 * Reference images through this registry rather than typing paths inline, so
 * renaming or re-organizing a file is a one-line change here.
 */
export const IMAGES = {
  /** Full horizontal wordmark. Used in the header, footer, and mobile nav. */
  logoFull: "/images/logo.jpg",
  /** Vector version of the wordmark. */
  logoMark: "/images/logo.svg",
} as const;

export type ImageKey = keyof typeof IMAGES;

/**
 * Turns a site-relative image path into a fully qualified URL.
 *
 * Structured data (schema.org) and Open Graph tags are consumed by crawlers off
 * our pages, so they need an absolute URL rather than `/images/logo.jpg`.
 */
export function absoluteImageUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || `https://${COMPANY.domain}`;
  return new URL(path, base).toString();
}
