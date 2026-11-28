import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";

// Every page in the sitemap must name itself as the canonical URL, so search
// engines index one address per page. Reads the page source rather than
// importing it, because the pages pull in React components.
const paths = sitemap().map((entry) => new URL(entry.url).pathname.replace(/\/$/, "") || "/");

describe("canonical tags", () => {
  it.each(paths)("%s declares itself as canonical", (path) => {
    const file = join(process.cwd(), "src/app", path === "/" ? "" : path, "page.tsx");
    const source = readFileSync(file, "utf8");
    expect(source).toContain(`alternates: { canonical: "${path}" }`);
  });
});
