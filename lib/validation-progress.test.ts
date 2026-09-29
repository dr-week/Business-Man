import { describe, expect, it } from "vitest";
import { hasValidationProof, parseValidationProgress, updateValidationStep } from "./validation-progress";

describe("validation progress", () => {
  it("requires an interview note and a credential-free HTTPS source", () => {
    expect(hasValidationProof({ done: false, note: "Buyer described weekly spoilage.", sourceUrl: "https://example.com/report" })).toBe(true);
    expect(hasValidationProof({ done: false, note: "Buyer interview", sourceUrl: "http://example.com" })).toBe(false);
    expect(hasValidationProof({ done: false, note: "   ", sourceUrl: "https://example.com" })).toBe(false);
    expect(hasValidationProof({ done: false, note: "Note", sourceUrl: "https://user:pass@example.com" })).toBe(false);
  });

  it("rejects oversized and malformed storage", () => {
    expect(parseValidationProgress("x".repeat(256_001), null, 4)).toEqual({});
    expect(parseValidationProgress("{", null, 4)).toEqual({});
  });

  it("bounds retained opportunities and trims stored fields", () => {
    const rows = Object.fromEntries(Array.from({ length: 105 }, (_, i) => [`opp-${i}`, [{ done: false, note: "n".repeat(100), sourceUrl: "https://example.com" }]]));
    const parsed = parseValidationProgress(JSON.stringify(rows), null, 1);
    expect(Object.keys(parsed)).toHaveLength(100);
    expect(parsed["opp-0"]).toBeUndefined();
    expect(parsed["opp-104"][0].note).toHaveLength(100);
  });

  it("trims oversized notes and links per record", () => {
    const rows = { opp: [{ done: false, note: "n".repeat(1200), sourceUrl: `https://${"u".repeat(2100)}.com` }] };
    const parsed = parseValidationProgress(JSON.stringify(rows), null, 1);
    expect(parsed.opp[0].note).toHaveLength(1000);
    expect(parsed.opp[0].sourceUrl).toHaveLength(2000);
  });

  it("migrates legacy boolean progress as incomplete until proof is added", () => {
    const parsed = parseValidationProgress(null, JSON.stringify({ opp: [true, false] }), 2);
    expect(parsed.opp[0]).toEqual({ done: false, note: "", sourceUrl: "" });
    expect(hasValidationProof(parsed.opp[0])).toBe(false);
  });

  it("downgrades stored completion without factual notes and a valid proof link", () => {
    const parsed = parseValidationProgress(JSON.stringify({
      opp: [
        { done: true, note: "", sourceUrl: "https://example.com" },
        { done: true, note: "Buyer confirmed need.", sourceUrl: "http://example.com" },
      ],
    }), null, 2);
    expect(parsed.opp.map((step) => step.done)).toEqual([false, false]);
  });

  it("requires evidence before completion and clears completion when proof is removed", () => {
    const initial = { opp: [{ done: false, note: "Buyer confirms weekly loss.", sourceUrl: "https://example.com" }] };
    expect(updateValidationStep(initial, "opp", 0, 1, { done: true })?.opp[0].done).toBe(true);
    expect(updateValidationStep(initial, "opp", 0, 1, { done: true, sourceUrl: "http://example.com" })).toBeNull();
    expect(updateValidationStep({ opp: [{ ...initial.opp[0], done: true }] }, "opp", 0, 1, { note: "" })?.opp[0].done).toBe(false);
  });

  it("caps saved opportunities and per-step text", () => {
    const initial = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`opp-${i}`, [{ done: false, note: "", sourceUrl: "" }]]));
    const next = updateValidationStep(initial, "new-opportunity", 0, 1, { note: "x".repeat(1500) });
    expect(Object.keys(next ?? {})).toHaveLength(100);
    expect(next?.["new-opportunity"][0].note).toHaveLength(1000);
  });

  it("refuses writes that would exceed the storage payload cap", () => {
    const fullRecord = { done: false, note: "n".repeat(1000), sourceUrl: `https://${"a".repeat(1900)}.com` };
    const progress = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`opp-${i}`, Array.from({ length: 4 }, () => fullRecord)]));
    expect(updateValidationStep(progress, "new", 0, 4, { note: "more" })).toBeNull();
  });
});
