import Link from "next/link";
import { Fragment } from "react";

// Plain copy (FAQ answers, step text) that mentions a page by name. The
// strings stay plain because they also feed the FAQ structured data; the
// links are added only when the text is rendered.
const PAGE_LINKS: Record<string, string> = {
  "our rates page": "/rates",
  "our mortgage calculator": "/mortgage-calculator",
};

const PATTERN = new RegExp(`(${Object.keys(PAGE_LINKS).join("|")})`, "gi");

export function LinkedText({ text }: { text: string }) {
  return (
    <>
      {text.split(PATTERN).map((part, i) => {
        const href = PAGE_LINKS[part.toLowerCase()];
        return href ? (
          <Link key={i} href={href} className="text-navy underline underline-offset-2">
            {part}
          </Link>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        );
      })}
    </>
  );
}
