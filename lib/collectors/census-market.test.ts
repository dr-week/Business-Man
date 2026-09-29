import { afterEach, describe, expect, it, vi } from "vitest";
import { censusStateCode, collectCensusMarket } from "./census-market";

afterEach(() => vi.unstubAllGlobals());

describe("Census market footprint", () => {
  it("recognizes full state names inside a city geography", () => {
    expect(censusStateCode("Austin, Texas, USA")).toBe("48");
    expect(censusStateCode("Goa, India")).toBeNull();
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
  it("preserves null counts instead of coercing disclosure markers to zero", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json([["ESTAB", "NAICS2017_LABEL", "NAME"], ["-", "Retail trade", "Texas"]])));
    const result = await collectCensusMarket({ geography: "Texas", industry: "Retail", key: "test" });
    expect(result).toMatchObject({ status: "available", establishments: null });
  });
});
