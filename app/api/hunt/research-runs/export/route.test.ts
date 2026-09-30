import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  ownerId: vi.fn(),
  apiError: vi.fn(),
  getResearchRun: vi.fn(),
}));

vi.mock("@/db", () => ({ getDb: mocks.getDb }));
vi.mock("@/lib/hunt-api", () => ({ apiError: mocks.apiError, ownerId: mocks.ownerId }));
vi.mock("@/lib/research-run-store", () => ({ getResearchRun: mocks.getResearchRun, RESEARCH_RUN_SCHEMA_VERSION: 1 }));

import { GET } from "./route";

const run = {
  id: "11111111-1111-4111-8111-111111111111",
  ownerId: "owner-1",
  schemaVersion: 1,
  topic: "Cold storage",
  geography: "Goa, India",
  currency: "INR",
  createdAt: "2026-09-20T10:00:00.000Z",
  input: { topic: "Cold storage" },
  result: { opportunities: [{ name: "Local cold chain" }] },
};

describe("saved research backup endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ownerId.mockResolvedValue("owner-1");
    mocks.getDb.mockReturnValue({ database: true });
  });

  it("requires authentication before looking up a saved run", async () => {
    mocks.ownerId.mockResolvedValue(null);
    const response = await GET(new Request(`https://app.test/api/hunt/research-runs/export?id=${run.id}`));

    expect(response.status).toBe(401);
    expect(mocks.getResearchRun).not.toHaveBeenCalled();
  });

  it("validates the id before querying the owner-scoped store", async () => {
    const response = await GET(new Request("https://app.test/api/hunt/research-runs/export?id=invalid"));

    expect(response.status).toBe(400);
    expect(mocks.getResearchRun).not.toHaveBeenCalled();
  });

  it("downloads one supported snapshot without exposing its owner id", async () => {
    mocks.getResearchRun.mockResolvedValue([run]);
    const response = await GET(new Request(`https://app.test/api/hunt/research-runs/export?id=${run.id}`));
    const body = await response.json();

    expect(mocks.getResearchRun).toHaveBeenCalledWith({ database: true }, "owner-1", run.id);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-disposition")).toBe(`attachment; filename="businessman-research-${run.id}.json"`);
    expect(body).toMatchObject({ format: "businessman-research-run", formatVersion: 1, run: { id: run.id, topic: run.topic, input: run.input, result: run.result } });
    expect(body.run).not.toHaveProperty("ownerId");
  });

  it("returns not found when id does not belong to the signed-in owner", async () => {
    mocks.getResearchRun.mockResolvedValue([]);
    const response = await GET(new Request(`https://app.test/api/hunt/research-runs/export?id=${run.id}`));

    expect(response.status).toBe(404);
  });

  it("refuses snapshots from unsupported schema versions", async () => {
    mocks.getResearchRun.mockResolvedValue([{ ...run, schemaVersion: 2 }]);
    const response = await GET(new Request(`https://app.test/api/hunt/research-runs/export?id=${run.id}`));

    expect(response.status).toBe(409);
  });
});
