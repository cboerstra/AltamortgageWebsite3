// MISMO v3.4 (ULAD/URLA) export for submitted mortgage applications.
//
//   generateMismoDocument()  form data  -> XML string      (pure)
//   writeMismoFile()         XML string -> file on disk    (I/O)
//
// Kept separate so the XML can be built for an email attachment or a test
// without touching the filesystem.

import type { ApplicationFormData } from "@/lib/schemas";
import { buildMismoXml } from "./build";
import { mapToDeal, type MapOptions } from "./map";

export { buildMismoXml } from "./build";
export { mapToDeal, ssnLast4, type MismoDeal } from "./map";
export {
  buildRelativePath,
  resolveStorageRoot,
  writeMismoFile,
  type StoredMismoFile,
} from "./store";

/** Build the MISMO document for a validated application. Pure. */
export function generateMismoDocument(
  app: ApplicationFormData,
  options: MapOptions
): string {
  return buildMismoXml(mapToDeal(app, options));
}
