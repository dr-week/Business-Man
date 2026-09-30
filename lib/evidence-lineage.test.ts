import { describe, expect, it } from "vitest";
import { independentClaimCount, independentSourceCount } from "./evidence-lineage";
import type { SourceSignal } from "./discovery";
import type { Claim } from "./research-engine";

const source = (id: string, provider: string, excerpt: string): SourceSignal => ({
  id, provider, title: "Restaurant stock shortages", excerpt, url: `https://example.com/${id}`,
  publishedAt: "2026-01-01", retrievedAt: "2026-09-29", comments: 0,
});
const claim = (id: string, text: string): Claim => ({ id, text, sourceIds: [id], publishedAt: "2026-01-01", direction: "supports", factor: "Paid demand" });

describe("evidence lineage", () => {
  it("counts copied text across providers once", () => {
    const sources = [source("1", "Forum", "We pay for inventory service every month."), source("2", "News", "We pay for inventory service every month.")];
    expect(independentSourceCount(sources)).toBe(1);
    expect(independentClaimCount([claim("1", sources[0].excerpt), claim("2", sources[1].excerpt)], sources)).toBe(1);
  });
  it("keeps distinct accounts independent", () => {
    expect(independentSourceCount([source("1", "Forum", "We pay for inventory service every month."), source("2", "Forum", "Our team bought a stock tracking subscription last year.")])).toBe(2);
  });
  it("does not inflate a factor score with several claims from one source", () => {
    const one = source("1", "Forum", "We pay for inventory service every month and rely on it for all locations.");
    expect(independentClaimCount([
      claim("1", "We pay for inventory service every month."),
      { ...claim("1", "Our team relies on the paid inventory service across locations."), id: "claim-2" },
    ], [one])).toBe(1);
  });
  it("does not count tracking-link variants of one short source twice", () => {
    const first = source("1", "Web", "Inventory service");
    const second = { ...source("2", "Web", "Inventory service"), url: "https://www.example.com/1?utm_source=mail#pricing" };
    first.url = "https://example.com/1";
    expect(independentSourceCount([first, second])).toBe(1);
  });
  it("keeps distinct reports independent when their subjects overlap", () => {
    expect(independentSourceCount([
      source("1", "Web", "A detailed report says local farms lose money when cold storage fails during summer harvest.") ,
      source("2", "Web", "A separate analysis says local farms lose revenue when refrigerated storage breaks during the harvest season.") ,
    ])).toBe(2);
  });
});
