import { afterEach, expect, it, vi } from "vitest";
import { collectLocalCompetitors } from "./places";

afterEach(() => vi.unstubAllGlobals());

it("returns business status and price-level signals from Google Places", async () => {
  let requestHeaders = new Headers();
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    requestHeaders = new Headers(init?.headers);
    return Response.json({ places: [
      {
        id: "place-1", displayName: { text: "Cafe One" }, formattedAddress: "Panaji, Goa",
        businessStatus: "OPERATIONAL", priceLevel: "PRICE_LEVEL_MODERATE", rating: 4.4, userRatingCount: 81,
      },
      { id: "place-2", displayName: { text: "Cafe Two" }, businessStatus: "BUSINESS_STATUS_UNSPECIFIED", priceLevel: "PRICE_LEVEL_UNSPECIFIED" },
    ] });
  });
  vi.stubGlobal("fetch", fetchMock);

  const results = await collectLocalCompetitors({ topic: "Cafe", geography: "Goa", key: "test-key" });

  expect(requestHeaders.get("X-Goog-FieldMask")).toContain("places.priceLevel");
  expect(requestHeaders.get("X-Goog-FieldMask")).toContain("places.businessStatus");
  expect(results[0]).toMatchObject({ businessStatus: "OPERATIONAL", priceLevel: "PRICE_LEVEL_MODERATE" });
  expect(results[1]).toMatchObject({ businessStatus: null, priceLevel: null });
});
