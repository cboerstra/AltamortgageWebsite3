import { describe, expect, it } from "vitest";
import { el, escapeAttr, escapeText, leaf, render, required } from "./xml";

describe("escapeText", () => {
  it("escapes the three text-critical characters", () => {
    expect(escapeText("Smith & Sons <Holdings>")).toBe(
      "Smith &amp; Sons &lt;Holdings&gt;"
    );
  });

  it("escapes ampersands before the entities it introduces", () => {
    expect(escapeText("<&>")).toBe("&lt;&amp;&gt;");
  });

  it("strips control characters that XML 1.0 forbids", () => {
    const input = `A${String.fromCharCode(0)}B${String.fromCharCode(7)}C${String.fromCharCode(
      31
    )}D${String.fromCharCode(127)}`;
    expect(escapeText(input)).toBe("ABCD");
  });

  it("keeps tab, newline and carriage return", () => {
    expect(escapeText("a\tb\nc\rd")).toBe("a\tb\nc\rd");
  });

  it("leaves quotes alone in text position", () => {
    expect(escapeText(`He said "hi" — it's fine`)).toBe(`He said "hi" — it's fine`);
  });
});

describe("escapeAttr", () => {
  it("escapes both quote characters on top of the text rules", () => {
    expect(escapeAttr(`a"b'c&d`)).toBe("a&quot;b&apos;c&amp;d");
  });
});

describe("leaf", () => {
  it("omits undefined, null and blank values", () => {
    expect(leaf("X", undefined)).toBeNull();
    expect(leaf("X", null)).toBeNull();
    expect(leaf("X", "")).toBeNull();
    expect(leaf("X", "   ")).toBeNull();
  });

  it("keeps zero and false, which are answers rather than absences", () => {
    expect(leaf("X", 0)?.text).toBe("0");
    expect(leaf("X", false)?.text).toBe("false");
  });

  it("trims surrounding whitespace", () => {
    expect(leaf("X", "  hello  ")?.text).toBe("hello");
  });
});

describe("el", () => {
  it("prunes a container whose children all vanish", () => {
    expect(el("EMPTY", undefined, [leaf("A", undefined), leaf("B", "")])).toBeNull();
  });

  it("keeps a container that has attributes but no children", () => {
    expect(el("ARC", { "xlink:from": "Party1" })).not.toBeNull();
  });

  it("keeps a container with at least one surviving child", () => {
    const node = el("WRAP", undefined, [leaf("A", undefined), leaf("B", "value")]);
    expect(node?.children).toHaveLength(1);
  });

  it("prunes recursively through several levels", () => {
    const node = el("OUTER", undefined, [
      el("MIDDLE", undefined, [el("INNER", undefined, [leaf("A", undefined)])]),
    ]);
    expect(node).toBeNull();
  });
});

describe("render", () => {
  it("emits a declaration and indents nested elements", () => {
    const doc = required("ROOT", { version: "1" }, [
      el("CHILD", undefined, [leaf("NAME", "Dana")]),
    ]);
    expect(render(doc)).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<ROOT version="1">\n' +
        "  <CHILD>\n" +
        "    <NAME>Dana</NAME>\n" +
        "  </CHILD>\n" +
        "</ROOT>\n"
    );
  });

  it("self-closes an element that has attributes and no content", () => {
    expect(render(required("ROOT", { a: "1" }))).toContain('<ROOT a="1" />');
  });

  it("escapes values in both text and attribute position", () => {
    const doc = required("ROOT", { note: `a"b` }, [leaf("V", "x & y")]);
    const out = render(doc);
    expect(out).toContain('note="a&quot;b"');
    expect(out).toContain("<V>x &amp; y</V>");
  });

  it("drops attributes with empty values rather than emitting them blank", () => {
    expect(render(required("ROOT", { a: "1", b: "" }))).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<ROOT a="1" />\n'
    );
  });
});
