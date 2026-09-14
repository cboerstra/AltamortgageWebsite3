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
  /** The emblem with the NMLS plate, transparent background. Header, footer, mobile nav. */
  logoFull: "/images/logo-800.png",
  /** Smaller copy of the same emblem for tight spots (mobile nav, structured data). */
  logoSmall: "/images/logo-400.png",
  /** Original vector of the previous wordmark; kept for print use. */
  logoMark: "/images/logo.svg",
  /** Family on their new doorstep with the Wasatch behind. Home page hero. */
  heroFamily: "/images/hero-family.jpg",
  /** Scott Boerstra, Broker/Manager. About page. */
  brokerPortrait: "/images/scott-boerstra.jpg",
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
