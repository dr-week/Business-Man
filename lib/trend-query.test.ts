import { describe, expect, it } from "vitest";
import { trendQueryTerms } from "./trend-query";

describe("trend query terms", () => {
  it("compares common maxxing spellings, including likely voice transcription", () => {
    expect(trendQueryTerms("business maxxxig")).toEqual(["business maxxing", "business maxing"]);
    expect(trendQueryTerms("business maxxing")).toEqual(["business maxxing", "business maxing"]);
  });

  it("preserves ordinary topics as a single bounded term", () => {
    expect(trendQueryTerms("local cold storage")).toEqual(["local cold storage"]);
    expect(trendQueryTerms("x".repeat(120))[0]).toHaveLength(100);
  });
});
