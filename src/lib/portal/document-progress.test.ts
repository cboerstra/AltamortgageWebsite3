import { describe, expect, it } from "vitest";
import { documentProgress, SLOTS, type BorrowerDocument, type SlotId } from "./document-types";

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
