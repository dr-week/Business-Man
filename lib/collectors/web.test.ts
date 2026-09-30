import { describe, expect, it } from "vitest";
import { parseCollectorResults } from "./web";

const signal = {
  id: "page-1", provider: "Web page", title: "Buyer pain", excerpt: "A recurring delay costs staff time.",
  url: "https://example.com/report", publishedAt: "2026-09-01", retrievedAt: "2026-09-29T00:00:00.000Z", engagement: { metric: "comments" as const, count: 0 },
};

describe("web collector response", () => {
  it("keeps valid pages when a sibling result is malformed", () => {
    const parsed = parseCollectorResults({ results: [
      { url: signal.url, status: "ok", signal },
      { url: "not a URL", status: "failed", reason: "bad source" },
    ] });
    expect(parsed.sources).toEqual([signal]);
    expect(parsed.errors).toEqual(["Supplied URL: Invalid collector result"]);
  });

  it("keeps an ordinary failed page scoped to that page", () => {
    const parsed = parseCollectorResults({ results: [
      { url: signal.url, status: "ok", signal },
      { url: "https://blocked.example/page", status: "blocked", reason: "robots policy" },
    ] });
    expect(parsed.sources).toHaveLength(1);
    expect(parsed.errors).toEqual(["blocked.example: robots policy"]);
  });

  it("rejects envelopes beyond the request limit", () => {
    expect(() => parseCollectorResults({ results: Array(4).fill({}) })).toThrow();
  });
});
