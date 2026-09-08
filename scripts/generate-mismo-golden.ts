// Regenerates the golden MISMO document used by build.test.ts.
//
//   npx vite-node scripts/generate-mismo-golden.ts
//
// Run this deliberately after a mapping change, then READ THE DIFF before
// committing. The golden file is only worth having if a human looks at it.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { buildMismoXml } from "../src/lib/mismo/build";
import { mapToDeal } from "../src/lib/mismo/map";
import {
  completeApplication,
  FIXTURE_OPTIONS,
} from "../src/lib/mismo/__fixtures__/application";

const target = path.join(
  process.cwd(),
  "src",
  "lib",
  "mismo",
  "__fixtures__",
  "complete.golden.xml"
);

const xml = buildMismoXml(mapToDeal(completeApplication, FIXTURE_OPTIONS));
writeFileSync(target, xml, "utf8");

console.log(`Wrote ${target} (${Buffer.byteLength(xml, "utf8")} bytes)`);
