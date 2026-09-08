import Link from "next/link";
import { IMAGES } from "@/lib/images";

interface LogoProps {
  /** Tailwind classes applied to the outer link */
  className?: string;
  /**
   * Visual variant:
   * - "default" — original brand colors (use on light backgrounds)
   * - "white"   — inverted to pure white via CSS filter (use on dark backgrounds)
   */
  variant?: "default" | "white";
  /** Pixel height of the logo image. Width scales proportionally. */
  height?: number;
}

export function Logo({
  className = "",
  variant = "default",
  height = 80,
}: LogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center ${className}`}
      aria-label="Alta Mortgage Group Home"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={IMAGES.logoFull}
        alt="Alta Mortgage Group"
        height={height}
        className={variant === "white" ? "brightness-0 invert" : ""}
        style={{ height: `${height}px`, width: "auto" }}
      />
    </Link>
  );
}
