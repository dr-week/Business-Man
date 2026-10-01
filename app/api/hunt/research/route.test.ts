import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ saveResearchRun: vi.fn(async () => undefined) }));
vi.mock("cloudflare:workers", () => ({ env: { BRAVE_SEARCH_API_KEY: "test-key" } }));
vi.mock("@/lib/hunt-api", () => ({ ownerId: vi.fn(async () => "test-owner"), isCrossOrigin: vi.fn(() => false) }));
vi.mock("@/db", () => ({ getDb: vi.fn(() => ({ database: true })) }));
vi.mock("@/lib/research-run-store", () => ({ RESEARCH_RUN_SCHEMA_VERSION: 1, saveResearchRun: mocks.saveResearchRun }));
vi.mock("@/lib/discovery", () => ({
  collectSignals: vi.fn(async () => [{ id: "1", provider: "Ask HN", title: "How to track restaurant inventory?", excerpt: "Inventory is lost every week.", url: "https://news.ycombinator.com/item?id=1", publishedAt: "2026-01-01T00:00:00.000Z", retrievedAt: "2026-09-27T00:00:00.000Z", comments: 2 }]),
  collectStackOverflow: vi.fn(async () => [{ id: "so:2", provider: "Stack Overflow", title: "How to track restaurant inventory?", excerpt: "", url: "https://stackoverflow.com/questions/2", publishedAt: "2026-02-01T00:00:00.000Z", retrievedAt: "2026-09-27T00:00:00.000Z", comments: 1 }]),
}));
vi.mock("@/lib/collectors/brave-search", () => ({ collectBraveWebResults: vi.fn(async () => [{ title: "Market result", url: "https://example.com/market", snippet: "Candidate result" }]) }));
vi.mock("@/lib/collectors/openalex", () => ({ collectOpenAlexWorks: vi.fn(async () => [{ title: "Inventory research paper", url: "https://doi.org/10.1234/paper", year: 2024, citedByCount: 3 }]) }));
import { collectSignals } from "@/lib/discovery";
import { collectBraveWebResults } from "@/lib/collectors/brave-search";
import { collectOpenAlexWorks } from "@/lib/collectors/openalex";
import { saveResearchRun } from "@/lib/research-run-store";
import { POST } from "./route";

describe("research route", () => {
  it("returns one grouped finding with both sources and no fabricated score or profit", async () => {
    const request = new Request("http://localhost/api/hunt/research", { method: "POST", body: JSON.stringify({ topic: "inventory", geography: "Goa, India", budget: 100000 }) });
    const response = await POST(request);
    const data = await response.json() as { opportunities: { sources: unknown[]; strength: number | null; financials: unknown }[]; webResearch: { title: string; url: string; snippet: string; kind?: string }[] };
    expect(response.status).toBe(200);
    expect(data.opportunities).toHaveLength(1);
    expect(data.opportunities[0].sources).toHaveLength(2);
    expect(data.opportunities[0].strength).toBeNull();
    expect(data.opportunities[0].financials).toBeNull();
    expect(data.webResearch).toEqual([
      { title: "Inventory research paper", url: "https://doi.org/10.1234/paper", kind: "academic", snippet: "Academic literature · 2024 · 3 citations" },
      { title: "Market result", url: "https://example.com/market", snippet: "Candidate result" },
    ]);
    expect(saveResearchRun).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      result: expect.objectContaining({
        webResearch: data.webResearch,
        webSearchConfigured: true,
      }),
    }));
    const cachedResponse = await POST(new Request("http://localhost/api/hunt/research", { method: "POST", body: JSON.stringify({ topic: "inventory", geography: "Goa, India", budget: 100000 }) }));
    const cachedData = await cachedResponse.json() as { cached: boolean };
    expect(cachedData.cached).toBe(true);
    expect(collectBraveWebResults).toHaveBeenCalledTimes(1);
  });

  it("does not qualify generic question words or location-only matches as topic evidence", async () => {
    vi.mocked(collectSignals).mockResolvedValueOnce([
      { id: "3", provider: "Ask HN", kind: "discussion", title: "How to sell my startup?", excerpt: "A post about selling a startup.", url: "https://news.ycombinator.com/item?id=3", publishedAt: "2026-01-01T00:00:00.000Z", retrievedAt: "2026-09-27T00:00:00.000Z" },
      { id: "4", provider: "Ask HN", kind: "discussion", title: "Small business ideas in Goa", excerpt: "A general local discussion.", url: "https://news.ycombinator.com/item?id=4", publishedAt: "2026-01-01T00:00:00.000Z", retrievedAt: "2026-09-27T00:00:00.000Z" },
      { id: "5", provider: "Ask HN", kind: "discussion", title: "Hotel laundry service problems", excerpt: "A buyer describes a recurring hotel laundry issue.", url: "https://news.ycombinator.com/item?id=5", publishedAt: "2026-01-01T00:00:00.000Z", retrievedAt: "2026-09-27T00:00:00.000Z" },
    ]);
    const response = await POST(new Request("http://localhost/api/hunt/research", {
      method: "POST",
      body: JSON.stringify({ topic: "What can I sell to hotels in Goa?", geography: "Goa, India", budget: 100000 }),
    }));
    const data = await response.json() as { opportunities: { name: string }[] };
    expect(response.status).toBe(200);
    expect(data.opportunities.map((item) => item.name)).toEqual(["Hotel laundry service problems"]);
  });
});
