// Minimal, deterministic XML writer.
//
// Hand-rolled rather than pulled from a library because the output shape is
// fixed, small, and asserted byte-for-byte by a golden-file test. Two rules
// drive everything here:
//
//   1. Empty values are omitted, not emitted as empty tags. MISMO consumers
//      treat <BorrowerBirthDate/> as a present-but-blank date, which is worse
//      than an absent element.
//   2. Containers whose children all vanish also vanish. Without this, a
//      borrower with no liabilities emits an empty <LIABILITIES/> block.

export type XmlAttrs = Record<string, string | number | boolean | undefined | null>;

export interface XmlElement {
  name: string;
  attrs: Record<string, string>;
  children: XmlElement[];
  text?: string;
}

// XML 1.0 forbids the C0 control characters outright, except tab (0x09),
// line feed (0x0A) and carriage return (0x0D). DEL (0x7F) is legal in XML 1.0
// but is stripped here too: it has no business in a 1003 and survives round
// trips badly. Built as a code-point set rather than a regex literal so this
// source file never has to contain a raw control byte.
const FORBIDDEN_CODE_POINTS: ReadonlySet<number> = (() => {
  const codes = new Set<number>();
  for (let c = 0x00; c <= 0x08; c++) codes.add(c);
  codes.add(0x0b);
  codes.add(0x0c);
  for (let c = 0x0e; c <= 0x1f; c++) codes.add(c);
  codes.add(0x7f);
  return codes;
})();

function stripControlChars(value: string): string {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0);
    if (code !== undefined && FORBIDDEN_CODE_POINTS.has(code)) continue;
    out += ch;
  }
  return out;
}

export function escapeText(value: string): string {
  return stripControlChars(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function normalizeAttrs(attrs?: XmlAttrs): Record<string, string> {
  const out: Record<string, string> = {};
  if (!attrs) return out;
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === "") continue;
    out[key] = String(value);
  }
  return out;
}

/**
 * A container element. Returns null when it would be empty — no attributes,
 * no text, and every child pruned — so callers can nest freely without
 * guarding each level.
 */
export function el(
  name: string,
  attrs?: XmlAttrs,
  children?: (XmlElement | null | undefined)[]
): XmlElement | null {
  const kids = (children ?? []).filter((c): c is XmlElement => Boolean(c));
  const normalized = normalizeAttrs(attrs);
  if (kids.length === 0 && Object.keys(normalized).length === 0) return null;
  return { name, attrs: normalized, children: kids };
}

/**
 * A leaf element holding a value. Returns null for absent values so optional
 * MISMO fields disappear rather than emitting blanks.
 */
export function leaf(
  name: string,
  value: string | number | boolean | undefined | null,
  attrs?: XmlAttrs
): XmlElement | null {
  if (value === undefined || value === null) return null;
  const text = typeof value === "boolean" ? String(value) : String(value).trim();
  if (text === "") return null;
  return { name, attrs: normalizeAttrs(attrs), children: [], text };
}

/**
 * A container that is emitted even when empty. Needed for the handful of MISMO
 * elements whose presence is itself meaningful.
 */
export function required(
  name: string,
  attrs?: XmlAttrs,
  children?: (XmlElement | null | undefined)[]
): XmlElement {
  return {
    name,
    attrs: normalizeAttrs(attrs),
    children: (children ?? []).filter((c): c is XmlElement => Boolean(c)),
  };
}

function renderAttrs(attrs: Record<string, string>): string {
  const keys = Object.keys(attrs);
  if (keys.length === 0) return "";
  return keys.map((k) => ` ${k}="${escapeAttr(attrs[k])}"`).join("");
}

function renderElement(node: XmlElement, depth: number, indent: string): string {
  const pad = indent.repeat(depth);
  const open = `${pad}<${node.name}${renderAttrs(node.attrs)}`;

  if (node.text !== undefined) {
    return `${open}>${escapeText(node.text)}</${node.name}>`;
  }
  if (node.children.length === 0) {
    return `${open} />`;
  }

  const inner = node.children
    .map((child) => renderElement(child, depth + 1, indent))
    .join("\n");
  return `${open}>\n${inner}\n${pad}</${node.name}>`;
}

/** Serialize a document, including the XML declaration. */
export function render(root: XmlElement, indent = "  "): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${renderElement(root, 0, indent)}\n`;
}
