import { afterEach, describe, expect, it, vi } from "vitest";
import { censusStateCode, censusZipCode, collectCensusMarket } from "./census-market";

afterEach(() => vi.unstubAllGlobals());

describe("Census market footprint", () => {
  it("recognizes full state names inside a city geography", () => {
    expect(censusStateCode("Austin, Texas, USA")).toBe("48");
    expect(censusStateCode("Goa, India")).toBeNull();
    expect(censusZipCode("Beverly Hills, CA 90210-1234")).toBe("90210");
    expect(censusZipCode("Goa, India")).toBeNull();
  });
  it("leaves missing keys and unsupported regions unavailable without network calls", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    expect((await collectCensusMarket({ geography: "Austin, Texas", industry: "Food" })).status).toBe("not_configured");
    expect((await collectCensusMarket({ geography: "Goa, India", industry: "Food", key: "test" })).status).toBe("unsupported_geography");
    expect((await collectCensusMarket({ geography: "Goa, India", industry: "Food" })).status).toBe("unsupported_geography");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("returns an attributed employer count with dataset year and broad sector label", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL) => Response.json([["ESTAB", "NAICS2017_LABEL", "NAME"], ["1234", "Accommodation and food services", "Texas"]]));
    vi.stubGlobal("fetch", fetcher);
    const result = await collectCensusMarket({ geography: "Austin, Texas", industry: "Food", key: "test" });
    expect(result).toMatchObject({ status: "available", establishments: 1234, geography: "Texas", year: 2023 });
    expect(new URL(String(fetcher.mock.calls[0]?.[0])).searchParams.get("NAICS2017")).toBe("72");
    expect(result.sourceUrl).toContain("census.gov");
  });
  it("requests ZIP totals as all-industry context, not as a sector match", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL) => Response.json([["ESTAB", "NAICS2017_LABEL", "NAME"], ["2536", "All sectors", "Beverly Hills, CA 90210"]]));
    vi.stubGlobal("fetch", fetcher);
    const result = await collectCensusMarket({ geography: "Beverly Hills, CA 90210", industry: "Food", key: "test" });
    expect(result).toMatchObject({
      status: "available", establishments: 2536, geographyLevel: "zip", naicsCode: "00",
      industry: "All industries (NAICS 00)", year: 2023,
    });
    const query = new URL(String(fetcher.mock.calls[0]?.[0])).searchParams;
    expect(query.get("for")).toBe("zip code:90210");
    expect(query.get("NAICS2017")).toBe("00");
  });
  it("preserves null counts instead of coercing disclosure markers to zero", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json([["ESTAB", "NAICS2017_LABEL", "NAME"], ["-", "Retail trade", "Texas"]])));
    const result = await collectCensusMarket({ geography: "Texas", industry: "Retail", key: "test" });
    expect(result).toMatchObject({ status: "available", establishments: null });
  });
});
