import { describe, expect, it } from "vitest";
import type { SourceSignal } from "./discovery";
import type { Claim } from "./research-engine";
import { buildCounterEvidence } from "./counter-evidence";

const source: SourceSignal = {
  id: "buyer-1", provider: "Interview note", kind: "buyer", authorId: "buyer-1", title: "Buyer interview",
  excerpt: "We do not have this problem.", url: "https://example.com/interview", publishedAt: "2026-09-20",
  retrievedAt: "2026-09-29T00:00:00.000Z", comments: 0,
};
const claim = (direction: Claim["direction"], sourceIds: string[] = [source.id]): Claim => ({
  id: direction, text: "The buyer reports the problem is already solved.", direction,
  basis: "Self-reported counterexample", sourceIds, publishedAt: source.publishedAt,
});

describe("counter-evidence", () => {
  it("keeps contradiction, source type, date, and result distinct from checks", () => {
    const result = buildCounterEvidence([claim("contradicts")], [source], ["Paid demand"]);
    expect(result.claims).toEqual([{
      id: "contradicts", text: "The buyer reports the problem is already solved.",
      basis: "Self-reported counterexample", source: "Interview note · Buyer report",
      sourceUrl: source.url, publishedAt: source.publishedAt,
    }]);
    expect(result.checks[0].test).toBe("Look for a real buying commitment.");
  });

  it("does not label support or context as counter-evidence", () => {
    const result = buildCounterEvidence([claim("supports"), claim("context")], [source], []);
    expect(result.claims).toEqual([]);
    expect(result.checks).toEqual([]);
  });

  it("keeps contradictory claims visible but refuses unsafe or missing links", () => {
    const result = buildCounterEvidence([claim("contradicts", ["http", "absent"])], [
      { ...source, id: "http", url: "http://example.com/private" },
    ], []);
    expect(result.claims[0]).toMatchObject({ source: "Interview note · Buyer report", sourceUrl: null });
  });
});
