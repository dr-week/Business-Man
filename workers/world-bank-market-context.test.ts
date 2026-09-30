import { afterEach, expect, it, vi } from "vitest";
import { collectIndiaMarketContext } from "./world-bank-market-context";

afterEach(() => vi.unstubAllGlobals());

it("includes the latest available FDI observation with source provenance", async () => {
  let requestedUrl = "";
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    requestedUrl = String(input);
    return Response.json([
    { page: 1 },
    [
      { date: "2024", value: 42_000_000_000, indicator: { id: "BX.KLT.DINV.CD.WD", value: "FDI" } },
      { date: "2023", value: 28_000_000_000, indicator: { id: "BX.KLT.DINV.CD.WD", value: "FDI" } },
      { date: "2024", value: 3_000_000_000_000, indicator: { id: "NY.GDP.MKTP.CD", value: "GDP" } },
      { date: "2024", value: 55, indicator: { id: "IT.NET.USER.ZS", value: "Internet users" } },
    ],
    ]);
  });
  vi.stubGlobal("fetch", fetchMock);

  const result = await collectIndiaMarketContext();

  expect(fetchMock).toHaveBeenCalledOnce();
  expect(requestedUrl).toContain("BX.KLT.DINV.CD.WD");
  expect(result.metrics.fdiNetInflowsUsd).toMatchObject({ value: 42_000_000_000, year: 2024 });
  expect(result.metrics.fdiNetInflowsUsd.sourceUrl).toContain("BX.KLT.DINV.CD.WD");
});
