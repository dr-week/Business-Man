import { describe, expect, it, vi } from "vitest";

vi.mock("cloudflare:workers", () => ({ env: {} }));
vi.mock("@/lib/hunt-api", () => ({ ownerId: vi.fn(async () => "test-owner"), isCrossOrigin: vi.fn(() => false) }));
vi.mock("@/lib/discovery", () => ({
  collectSignals: vi.fn(async () => [{ id: "1", provider: "Ask HN", title: "How to track restaurant inventory?", excerpt: "Inventory is lost every week.", url: "https://news.ycombinator.com/item?id=1", publishedAt: "2026-01-01T00:00:00.000Z", retrievedAt: "2026-09-27T00:00:00.000Z", comments: 2 }]),
  collectStackOverflow: vi.fn(async () => [{ id: "so:2", provider: "Stack Overflow", title: "How to track restaurant inventory?", excerpt: "", url: "https://stackoverflow.com/questions/2", publishedAt: "2026-02-01T00:00:00.000Z", retrievedAt: "2026-09-27T00:00:00.000Z", comments: 1 }]),
}));
import { POST } from "./route";

describe("research route", () => {
  it("returns one grouped finding with both sources and no fabricated score or profit", async () => {
    const request = new Request("http://localhost/api/hunt/research", { method: "POST", body: JSON.stringify({ topic: "inventory", geography: "Goa, India", budget: 100000 }) });
    const response = await POST(request);
    const data = await response.json() as { opportunities: { sources: unknown[]; strength: number | null; financials: unknown }[] };
    expect(response.status).toBe(200);
    expect(data.opportunities).toHaveLength(1);
    expect(data.opportunities[0].sources).toHaveLength(2);
    expect(data.opportunities[0].strength).toBeNull();
    expect(data.opportunities[0].financials).toBeNull();
  });
});
