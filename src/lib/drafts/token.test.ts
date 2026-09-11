import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  generateToken,
  hashToken,
  isTokenShaped,
  linkKey,
  openToken,
  resetLinkKeyWarning,
  sealToken,
} from "./token";

const savedKey = process.env.DRAFT_LINK_KEY;

beforeEach(() => {
  delete process.env.DRAFT_LINK_KEY;
  resetLinkKeyWarning();
});

afterEach(() => {
  if (savedKey === undefined) delete process.env.DRAFT_LINK_KEY;
  else process.env.DRAFT_LINK_KEY = savedKey;
});

describe("generateToken", () => {
  it("produces a token of the expected shape", () => {
    const token = generateToken();
    expect(isTokenShaped(token)).toBe(true);
    expect(token.length).toBe(43);
  });

  it("does not repeat", () => {
    const seen = new Set(Array.from({ length: 200 }, generateToken));
    expect(seen.size).toBe(200);
  });
});

describe("hashToken", () => {
  it("is stable and one-way", () => {
    const token = generateToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(token)).not.toContain(token);
  });
});

describe("isTokenShaped", () => {
  it("rejects anything that is not a generated token", () => {
    expect(isTokenShaped("")).toBe(false);
    expect(isTokenShaped("short")).toBe(false);
    expect(isTokenShaped("a".repeat(43) + "!")).toBe(false);
    expect(isTokenShaped("' OR 1=1 --".padEnd(43, "x"))).toBe(false);
    expect(isTokenShaped(null)).toBe(false);
    expect(isTokenShaped(42)).toBe(false);
  });
});

describe("link encryption", () => {
  it("is disabled when no key is configured", () => {
    expect(linkKey()).toBeNull();
    expect(sealToken(generateToken())).toBeNull();
    expect(openToken("anything")).toBeNull();
  });

  it("rejects a key of the wrong length", () => {
    process.env.DRAFT_LINK_KEY = randomBytes(16).toString("base64");
    expect(linkKey()).toBeNull();
  });

  it("round-trips a token under a valid key", () => {
    process.env.DRAFT_LINK_KEY = randomBytes(32).toString("base64");
    const token = generateToken();
    const sealed = sealToken(token);
    expect(sealed).not.toBeNull();
    expect(sealed).not.toContain(token);
    expect(openToken(sealed)).toBe(token);
  });

  it("uses a fresh IV per seal", () => {
    process.env.DRAFT_LINK_KEY = randomBytes(32).toString("base64");
    const token = generateToken();
    expect(sealToken(token)).not.toBe(sealToken(token));
  });

  it("fails closed under the wrong key", () => {
    const token = generateToken();
    const sealed = sealToken(token, randomBytes(32));
    expect(openToken(sealed, randomBytes(32))).toBeNull();
  });

  it("fails closed when the ciphertext is tampered with", () => {
    const key = randomBytes(32);
    const sealed = sealToken(generateToken(), key)!;
    const buf = Buffer.from(sealed, "base64url");
    buf[buf.length - 1] ^= 0x01;
    expect(openToken(buf.toString("base64url"), key)).toBeNull();
  });

  it("fails closed on garbage", () => {
    const key = randomBytes(32);
    expect(openToken("", key)).toBeNull();
    expect(openToken("not-base64!!", key)).toBeNull();
    expect(openToken(Buffer.from([1, 2, 3]).toString("base64url"), key)).toBeNull();
  });
});
