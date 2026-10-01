import { describe, expect, it } from "vitest";
import { portfolioSummarySchema } from "@/lib/investment/portfolio-contract";
import { POST } from "./route";

const sampleCsv = `// Example file includes descriptive comment rows.
// Values are user-entered, with no currency or price date in the file.
sector,security,purchase_price,current_price,quantity
Technology,AlphaTech,120,150,100
Healthcare,HealthPlus,45,55,200
Finance,FinBank,78,80,150
Energy,PowerCo,30,28,300
Consumer,ShopNow,22,35,250`;

describe("investment analysis CSV workflow", () => {
  it("aggregates the supplied portfolio sample with explicit provenance", async () => {
    const response = await POST(new Request("http://localhost/api/investment-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: sampleCsv, currency: "INR", valuedAt: "2026-10-01", sourceName: "Broker export" }),
    }));
    const result = portfolioSummarySchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(result).toMatchObject({
      currency: "INR",
      valuedAt: "2026-10-01",
      source: { name: "Broker export", url: null },
      verification: "user_provided_unverified",
      positionCount: 5,
      costBasis: 47_200,
      marketValue: 55_150,
      unrealizedGain: 7_950,
      sectorSummary: expect.arrayContaining([{ sector: "Energy", positions: 1, costBasis: 9_000, marketValue: 8_400, unrealizedGain: -600, returnPercent: expect.any(Number) }]),
    });
    expect(result.caveat).toContain("user-provided and unverified");
  });

  it("rejects invalid rows instead of reporting them as zero-value positions", async () => {
    const response = await POST(new Request("http://localhost/api/investment-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        csv: "sector,security,purchase_price,current_price,quantity\nTechnology,Test,broken,25,2",
        currency: "INR", valuedAt: "2026-10-01", sourceName: "Broker export",
      }),
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Check these portfolio columns: purchase_price." });
  });
});
