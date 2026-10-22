import { describe, expect, it } from "vitest";
import {
  applicantsFromPayload,
  documentProgress,
  documentSlots,
  SLOTS,
  type BorrowerDocument,
  type SlotId,
} from "./document-types";

let nextId = 1;
function doc(slot: SlotId, status: BorrowerDocument["status"] = "available", uploadedAt = "2026-10-01T00:00:00Z"): BorrowerDocument {
  return {
    id: nextId++,
    borrowerId: 1,
    slot,
    filename: `${slot}-${nextId}.pdf`,
    mimeType: "application/pdf",
    byteSize: 1000,
    sha256: null,
    partCount: 1,
    status,
    uploadedAt,
    completedAt: uploadedAt,
  };
}

const REQUIRED = SLOTS.reduce((n, s) => n + s.required, 0);
const slot = (p: ReturnType<typeof documentProgress>, id: SlotId) => p.slots.find((s) => s.slot.id === id)!;

describe("documentProgress", () => {
  it("starts with everything outstanding", () => {
    const p = documentProgress([]);
    expect(p.received).toBe(0);
    expect(p.required).toBe(REQUIRED);
    expect(p.allRequiredReceived).toBe(false);
    expect(slot(p, "w2").remaining).toBe(2);
  });

  it("counts one upload as 1 of 2", () => {
    const p = documentProgress([doc("bank_statement")]);
    const bank = slot(p, "bank_statement");
    expect([bank.counted, bank.remaining, bank.complete]).toEqual([1, 1, false]);
    expect(p.received).toBe(1);
  });

  it("does not let extra files in one slot cover a missing one elsewhere", () => {
    const p = documentProgress([doc("bank_statement"), doc("bank_statement"), doc("bank_statement")]);
    expect(slot(p, "bank_statement").counted).toBe(2);
    expect(slot(p, "bank_statement").documents).toHaveLength(3);
    expect(p.received).toBe(2);
    expect(slot(p, "w2").remaining).toBe(2);
  });

  it("ignores uploads that never finished, and deleted ones", () => {
    const p = documentProgress([doc("paystub", "uploading"), doc("paystub", "deleted")]);
    expect(slot(p, "paystub").counted).toBe(0);
    expect(slot(p, "paystub").documents).toHaveLength(0);
  });

  it("never marks the optional slot complete or outstanding", () => {
    const p = documentProgress([doc("other")]);
    const other = slot(p, "other");
    expect([other.remaining, other.complete, other.documents.length]).toEqual([0, false, 1]);
    expect(p.received).toBe(0);
  });

  it("is complete once every required slot is full", () => {
    const docs = SLOTS.flatMap((s) => Array.from({ length: s.required }, () => doc(s.id)));
    const p = documentProgress(docs);
    expect(p.received).toBe(REQUIRED);
    expect(p.allRequiredReceived).toBe(true);
    expect(p.slots.filter((s) => s.remaining > 0)).toHaveLength(0);
  });

  it("lists files oldest first", () => {
    const later = doc("w2", "available", "2026-10-05T00:00:00Z");
    const earlier = doc("w2", "available", "2026-10-02T00:00:00Z");
    expect(slot(documentProgress([later, earlier]), "w2").documents.map((d) => d.id)).toEqual([earlier.id, later.id]);
  });
});

const need = (plan: ReturnType<typeof documentSlots>) =>
  Object.fromEntries(plan.map((s) => [s.id, s.required])) as Record<SlotId, number>;

describe("documentSlots — tailored to the application", () => {
  it("keeps the general list when there is no application to go on", () => {
    expect(documentSlots(null)).toEqual(SLOTS);
    expect(documentSlots([{ firstName: "Jane" }])).toEqual(SLOTS);
  });

  it("asks an employed borrower for pay stubs and W-2s, not tax returns", () => {
    expect(need(documentSlots([{ employmentStatus: "employed" }]))).toEqual({
      bank_statement: 2, w2: 2, paystub: 2, tax_return: 0, other: 0,
    });
  });

  it("never asks a retiree for pay stubs or W-2s", () => {
    const plan = documentSlots([{ employmentStatus: "retired" }]);
    expect(need(plan)).toEqual({ bank_statement: 2, w2: 0, paystub: 0, tax_return: 0, other: 1 });
    const other = plan.find((s) => s.id === "other")!;
    expect(other.label).toBe("Income documents");
    expect(other.hint).toContain("award letter");
  });

  it("asks a self-employed borrower for tax returns and their 1099s / P&L", () => {
    const plan = documentSlots([{ employmentStatus: "self-employed" }]);
    expect(need(plan)).toEqual({ bank_statement: 2, w2: 0, paystub: 0, tax_return: 2, other: 1 });
    expect(plan.find((s) => s.id === "other")!.hint).toContain("profit and loss");
  });

  it("adds a co-borrower's documents, and says whose they are", () => {
    const both = documentSlots([
      { firstName: "Jane", employmentStatus: "employed" },
      { firstName: "Robin", employmentStatus: "employed" },
    ]);
    expect(need(both)).toEqual({ bank_statement: 2, w2: 4, paystub: 4, tax_return: 0, other: 0 });
    expect(both.find((s) => s.id === "paystub")!.hint).toContain("for you and Robin");

    const mixed = documentSlots([
      { firstName: "Jane", employmentStatus: "employed" },
      { firstName: "Robin", employmentStatus: "retired" },
    ]);
    expect(need(mixed)).toEqual({ bank_statement: 2, w2: 2, paystub: 2, tax_return: 0, other: 1 });
    expect(mixed.find((s) => s.id === "other")!.hint).toContain("For Robin: an award letter");
    expect(mixed.find((s) => s.id === "paystub")!.hint).toMatch(/For you\.$/);
  });

  it("bank statements are household-wide: two, not two each", () => {
    const plan = documentSlots([{ employmentStatus: "employed" }, { employmentStatus: "employed" }]);
    expect(need(plan).bank_statement).toBe(2);
  });
});

describe("documentProgress — with a tailored list", () => {
  it("hides slots nobody needs, keeping Other open", () => {
    const plan = documentSlots([{ employmentStatus: "retired" }]);
    const ids = documentProgress([], plan).slots.map((s) => s.slot.id);
    expect(ids).toEqual(["bank_statement", "other"]);
  });

  it("still shows a hidden slot that has uploads in it", () => {
    const plan = documentSlots([{ employmentStatus: "retired" }]);
    const ids = documentProgress([doc("w2")], plan).slots.map((s) => s.slot.id);
    expect(ids).toContain("w2");
  });

  it("counts against the tailored total", () => {
    const plan = documentSlots([{ employmentStatus: "retired" }]);
    const p = documentProgress([doc("bank_statement"), doc("bank_statement"), doc("other")], plan);
    expect([p.received, p.required, p.allRequiredReceived]).toEqual([3, 3, true]);
  });
});

describe("applicantsFromPayload", () => {
  it("reads the applicant and co-borrower from a stored application", () => {
    expect(
      applicantsFromPayload({
        firstName: "Jane",
        employmentStatus: "employed",
        coBorrower: { firstName: "Robin", employmentStatus: "retired" },
      })
    ).toEqual([
      { firstName: "Jane", employmentStatus: "employed" },
      { firstName: "Robin", employmentStatus: "retired" },
    ]);
  });

  it("returns nothing it cannot trust", () => {
    expect(applicantsFromPayload(null)).toEqual([]);
    expect(applicantsFromPayload({ firstName: "Jane" })).toEqual([]);
    expect(applicantsFromPayload({ employmentStatus: "astronaut" })).toEqual([]);
    expect(applicantsFromPayload({ employmentStatus: "employed", coBorrower: { firstName: "R" } })).toHaveLength(1);
  });
});
