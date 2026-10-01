import { expect, it, vi } from "vitest";

vi.mock("cloudflare:workers", () => ({ env: { GOOGLE_PLACES_API_KEY: "test-key" } }));
vi.mock("@/lib/hunt-api", () => ({ ownerId: vi.fn(async () => "test-owner"), isCrossOrigin: vi.fn(() => false) }));
vi.mock("@/lib/collectors/places", () => ({ collectLocalCompetitors: vi.fn(async () => [{ id: "place-1", name: "Supplier" }]) }));
vi.mock("@/lib/collectors/census-market", () => ({ collectCensusMarket: vi.fn(async () => ({ status: "unsupported_geography" })) }));

import { collectLocalCompetitors } from "@/lib/collectors/places";
import { POST } from "./route";

it("looks up only the selected business when Market is requested", async () => {
  const response = await POST(new Request("http://localhost/api/hunt/market", { method: "POST", body: JSON.stringify({ topic: "Coconut shell products", geography: "Goa, India", industry: "Manufacturing" }) }));
  expect(response.status).toBe(200);
  expect(collectLocalCompetitors).toHaveBeenCalledWith({ topic: "Coconut shell products", geography: "Goa, India", key: "test-key" }, expect.any(AbortSignal));
  const result = await response.json() as { competitors: unknown[]; checkedAt: string };
  expect(result.competitors).toHaveLength(1);
  expect(Number.isNaN(Date.parse(result.checkedAt))).toBe(false);
});

it("rejects oversized or invalid market requests before fetching", async () => {
  vi.mocked(collectLocalCompetitors).mockClear();
  const response = await POST(new Request("http://localhost/api/hunt/market", { method: "POST", body: JSON.stringify({ topic: "x", geography: "Goa, India", industry: "Manufacturing" }) }));
  expect(response.status).toBe(400);
  expect(collectLocalCompetitors).not.toHaveBeenCalled();
});
