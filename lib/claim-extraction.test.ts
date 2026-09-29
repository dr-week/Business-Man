import { describe, expect, it } from "vitest";
import { extractClaims } from "./claim-extraction";
import type { SourceSignal } from "./discovery";

const source = (excerpt: string, kind: SourceSignal["kind"] = "discussion"): SourceSignal => ({
  id: "1", provider: "Ask HN", kind, title: "Inventory", excerpt,
  url: "https://news.ycombinator.com/item?id=1", publishedAt: "2026-01-01", retrievedAt: "2026-09-29", comments: 0,
});

describe("claim qualification", () => {
  it("separates reported purchases from willingness to pay", () => {
    expect(extractClaims(source("We would pay for this every month.")).some((claim) => claim.factor === "Paid demand")).toBe(false);
    expect(extractClaims(source("We pay for the service every month.")).some((claim) => claim.factor === "Paid demand")).toBe(true);
    expect(extractClaims(source("We pay attention to inventory.")).some((claim) => claim.factor === "Paid demand")).toBe(false);
  });
  it("does not treat supplier copy as buyer payment evidence", () => {
    expect(extractClaims(source("We sold this service monthly.", "supplier")).some((claim) => claim.factor === "Paid demand")).toBe(false);
  });
  it("retains recurrence and counterexamples separately", () => {
    const claims = extractClaims(source("We lose stock every week. Our existing tool works fine."));
    expect(claims.some((claim) => claim.factor === "Severity and frequency")).toBe(true);
    expect(claims.some((claim) => claim.direction === "contradicts")).toBe(true);
  });
});
