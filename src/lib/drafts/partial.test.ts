import { describe, expect, it } from "vitest";
import { completeApplication } from "@/lib/mismo/__fixtures__/application";
import { draftIdentity, sanitizeDraft } from "./partial";

describe("sanitizeDraft", () => {
  it("rejects non-objects outright", () => {
    expect(sanitizeDraft(null)).toBeNull();
    expect(sanitizeDraft("string")).toBeNull();
    expect(sanitizeDraft([1, 2])).toBeNull();
    expect(sanitizeDraft(42)).toBeNull();
  });

  it("keeps a complete application intact, minus the SSN", () => {
    const out = sanitizeDraft(completeApplication)!;
    expect(out).not.toBeNull();
    expect((out as Record<string, unknown>).ssn).toBeUndefined();
    expect(out.firstName).toBe(completeApplication.firstName);
    expect(out.currentAddress).toEqual(completeApplication.currentAddress);
    expect(out.monthlyIncome).toBe(completeApplication.monthlyIncome);
  });

  it("strips the SSN even when a caller sends it", () => {
    const out = sanitizeDraft({ firstName: "A", ssn: "123-45-6789" })!;
    expect((out as Record<string, unknown>).ssn).toBeUndefined();
    expect(JSON.stringify(out)).not.toContain("6789");
  });

  it("drops an invalid field without losing the rest", () => {
    const out = sanitizeDraft({
      firstName: "Dana",
      email: "dana@example.test",
      loanPurpose: "not-a-purpose",
      monthlyIncome: Number.NaN,
      currentAddress: { street: "", city: "", state: "", zip: "" },
    })!;
    expect(out.firstName).toBe("Dana");
    expect(out.email).toBe("dana@example.test");
    expect(out.loanPurpose).toBeUndefined();
    expect(out.monthlyIncome).toBeUndefined();
    expect(out.currentAddress).toBeUndefined();
  });

  it("drops unknown keys", () => {
    const out = sanitizeDraft({ firstName: "Dana", isAdmin: true, __proto__: { x: 1 } })!;
    expect(out).toEqual({ firstName: "Dana" });
  });

  it("does not persist undefined placeholders", () => {
    const out = sanitizeDraft({ firstName: "Dana" })!;
    expect(Object.keys(out)).toEqual(["firstName"]);
  });
});

describe("draftIdentity", () => {
  it("requires a valid email", () => {
    expect(draftIdentity({})).toBeNull();
    expect(draftIdentity({ email: "nope" })).toBeNull();
    expect(draftIdentity({ email: "d@example.test" })).toEqual({ email: "d@example.test" });
  });

  it("carries the name when present", () => {
    expect(
      draftIdentity({ email: "d@example.test", firstName: "Dana", lastName: "Lee" })
    ).toEqual({ email: "d@example.test", firstName: "Dana", lastName: "Lee" });
  });

  it("ignores an empty name rather than failing", () => {
    expect(draftIdentity({ email: "d@example.test", firstName: "" })).toEqual({
      email: "d@example.test",
    });
  });
});
