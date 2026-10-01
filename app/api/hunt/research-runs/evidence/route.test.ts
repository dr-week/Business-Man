import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), ownerId: vi.fn(), apiError: vi.fn(), getResearchRun: vi.fn() }));
vi.mock("@/db", () => ({ getDb: mocks.getDb }));
vi.mock("@/lib/hunt-api", () => ({ apiError: mocks.apiError, ownerId: mocks.ownerId }));
vi.mock("@/lib/research-run-store", () => ({ getResearchRun: mocks.getResearchRun, RESEARCH_RUN_SCHEMA_VERSION: 1 }));

import { GET } from "./route";

const id = "11111111-1111-4111-8111-111111111111";
const run = {
  id, schemaVersion: 1, topic: "Cafe demand", geography: "Pune, India", currency: "INR", createdAt: "2026-09-20T10:00:00.000Z",
  result: { opportunities: [{
    id: "cafe", name: "Office lunch subscriptions", category: "Food", geography: "Pune, India", buyer: null, problem: "Lunch delays",
    offering: null, alternatives: [], gap: null, risks: [], confidence: "Medium", strength: 62, financials: null,
    claims: [{ direction: "supports", text: "Offices report recurring delays.", sourceIds: ["source-1"] }],
    sources: [{ id: "source-1", provider: "Field note", title: "Buyer interview", excerpt: "A buyer described the delays.", url: "https://example.org/interview", publishedAt: "2026-09-01", retrievedAt: "2026-09-20" }],
    missing: [],
  }] },
};

describe("saved evidence CSV stream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ownerId.mockResolvedValue("owner-1");
    mocks.getDb.mockReturnValue({ db: true });
    mocks.getResearchRun.mockResolvedValue([run]);
  });

  it("streams an owner-scoped attachment in small CSV chunks", async () => {
    const response = await GET(new Request(`https://app.test/api/hunt/research-runs/evidence?id=${id}`));
    const reader = response.body!.getReader();
    const decoder = new TextDecoder("utf-8", { ignoreBOM: true });
    const chunks: string[] = [];
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      chunks.push(decoder.decode(next.value));
    }
    const csv = chunks.join("");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toContain("evidence-cafe-demand-2026-09-20.csv");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.getResearchRun).toHaveBeenCalledWith({ db: true }, "owner-1", id);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toBe("\uFEFF");
    expect(csv).toContain('"supports","Offices report recurring delays.","source-1"');
    expect(csv).toContain('"https://example.org/interview"');
  });

  it("requires an owner before reading saved data", async () => {
    mocks.ownerId.mockResolvedValue(null);
    const response = await GET(new Request(`https://app.test/api/hunt/research-runs/evidence?id=${id}`));
    expect(response.status).toBe(401);
    expect(mocks.getResearchRun).not.toHaveBeenCalled();
  });

  it("rejects ids that are not UUIDs before querying the database", async () => {
    const response = await GET(new Request("https://app.test/api/hunt/research-runs/evidence?id=invalid"));
    expect(response.status).toBe(400);
    expect(mocks.getResearchRun).not.toHaveBeenCalled();
  });
});
