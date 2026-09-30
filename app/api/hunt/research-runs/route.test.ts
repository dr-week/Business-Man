import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ownerId: vi.fn(),
  listResearchRuns: vi.fn(),
  listResearchRunSummaries: vi.fn(),
  getResearchRun: vi.fn(),
}));

vi.mock("@/db", () => ({ getDb: () => ({}) }));
vi.mock("@/lib/hunt-api", () => ({ ownerId: mocks.ownerId, apiError: () => Response.json({ error: "Research request failed." }, { status: 500 }) }));
vi.mock("@/lib/research-run-store", () => ({
  getResearchRun: mocks.getResearchRun,
  listResearchRunSummaries: mocks.listResearchRunSummaries,
  listResearchRuns: mocks.listResearchRuns,
}));

import { GET } from "./route";

describe("saved research route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ownerId.mockResolvedValue("owner-1");
    mocks.listResearchRuns.mockResolvedValue([]);
    mocks.listResearchRunSummaries.mockResolvedValue([]);
    mocks.getResearchRun.mockResolvedValue([]);
  });

  it("returns the latest snapshot and lightweight history", async () => {
    const latest = { id: "run-1", input: {}, result: {} };
    const history = [{ id: "run-1", topic: "cafes", geography: "Goa", createdAt: "2026-10-01" }];
    mocks.listResearchRuns.mockResolvedValue([latest]);
    mocks.listResearchRunSummaries.mockResolvedValue(history);

    const response = await GET(new Request("https://app.test/api/hunt/research-runs"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ runs: [latest], history });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("opens an owner-scoped run by ID", async () => {
    const id = "ec4f1a14-7d30-432e-81ad-3b66fd578580";
    const run = { id, input: {}, result: {} };
    mocks.getResearchRun.mockResolvedValue([run]);

    const response = await GET(new Request(`https://app.test/api/hunt/research-runs?id=${id}`));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ run });
    expect(mocks.getResearchRun).toHaveBeenCalledWith({}, "owner-1", id);
  });

  it("rejects malformed run IDs and unauthenticated requests", async () => {
    expect((await GET(new Request("https://app.test/api/hunt/research-runs?id=bad"))).status).toBe(404);
    expect(mocks.getResearchRun).not.toHaveBeenCalled();

    mocks.ownerId.mockResolvedValue(null);
    expect((await GET(new Request("https://app.test/api/hunt/research-runs"))).status).toBe(401);
  });
});
