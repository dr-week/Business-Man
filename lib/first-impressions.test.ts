import { describe, expect, it } from "vitest";
import { parseFirstImpressions, recordFirstImpression } from "./first-impressions";

describe("first impressions", () => {
  it("ignores malformed data and invalid decisions", () => {
    expect(parseFirstImpressions(null)).toEqual({});
    expect(parseFirstImpressions({ ok: "watch", bad: "buy", "": "pass" })).toEqual({ ok: "watch" });
  });

  it("keeps only the latest 200 browser decisions", () => {
    const decisions = Object.fromEntries(Array.from({ length: 205 }, (_, i) => [`lead-${i}`, "watch"]));
    const parsed = parseFirstImpressions(decisions);
    expect(Object.keys(parsed)).toHaveLength(200);
    expect(parsed["lead-0"]).toBeUndefined();
    expect(parsed["lead-204"]).toBe("watch");
  });

  it("rejects oversized identifiers without changing current state", () => {
    const current = { lead: "investigate" as const };
    expect(recordFirstImpression(current, "x".repeat(161), "pass")).toBe(current);
  });

  it("keeps decision count bounded while updating an existing choice", () => {
    const current = Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`lead-${i}`, "watch" as const]));
    const next = recordFirstImpression(current, "lead-0", "pass");
    expect(Object.keys(next)).toHaveLength(200);
    expect(next["lead-0"]).toBe("pass");
    expect(Object.values(next)).not.toContain(undefined);
  });

  it("evicts the lexically oldest id when adding beyond the cap", () => {
    const current = Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`lead-${String(i).padStart(3, "0")}`, "watch" as const]));
    const next = recordFirstImpression(current, "lead-200", "pass");
    expect(Object.keys(next)).toHaveLength(200);
    expect(next["lead-000"]).toBeUndefined();
    expect(next["lead-200"]).toBe("pass");
  });
});
