import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(), ownerId: vi.fn(), apiError: vi.fn(), getResearchRun: vi.fn(), listResearchRuns: vi.fn(), findDuplicateResearchRun: vi.fn(),
  parseResearchBackup: vi.fn(), saveResearchRun: vi.fn(),
}));

vi.mock("@/db", () => ({ getDb: mocks.getDb }));
vi.mock("@/lib/hunt-api", () => ({ apiError: mocks.apiError, isCrossOrigin: vi.fn(() => false), ownerId: mocks.ownerId }));
vi.mock("@/lib/research-run-store", () => ({
  findDuplicateResearchRun: mocks.findDuplicateResearchRun, getLatestResearchRun: vi.fn(), getResearchRun: mocks.getResearchRun, listResearchRuns: mocks.listResearchRuns,
  parseResearchBackup: mocks.parseResearchBackup, saveResearchRun: mocks.saveResearchRun,
  RESEARCH_RUN_SCHEMA_VERSION: 1,
}));

import { POST } from "./route";

describe("saved research backup import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ownerId.mockResolvedValue("owner-1");
    mocks.getDb.mockReturnValue({ database: true });
    mocks.findDuplicateResearchRun.mockResolvedValue([]);
    mocks.listResearchRuns.mockResolvedValue([{ id: "new-run", schemaVersion: 1, topic: "Cafe demand", geography: "Goa, India", currency: "INR", createdAt: "2026-09-30T10:00:00.000Z" }]);
  });

  it("requires sign-in before parsing an uploaded backup", async () => {
    mocks.ownerId.mockResolvedValue(null);
    const response = await POST(new Request("https://app.test/api/hunt/research-runs", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ format: "businessman-research-run" }),
    }));
    expect(response.status).toBe(401);
    expect(mocks.parseResearchBackup).not.toHaveBeenCalled();
  });

  it("stores a validated backup under its newly assigned archive id", async () => {
    const imported = { id: "new-run", ownerId: "owner-1", topic: "Cafe demand" };
    mocks.parseResearchBackup.mockReturnValue(imported);
    const backup = { format: "businessman-research-run", formatVersion: 1 };
    const response = await POST(new Request("https://app.test/api/hunt/research-runs", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(backup),
    }));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: "new-run", runs: [{ id: "new-run", schemaVersion: 1, topic: "Cafe demand", geography: "Goa, India", currency: "INR", createdAt: "2026-09-30T10:00:00.000Z" }] });
    expect(mocks.parseResearchBackup).toHaveBeenCalledWith(backup, "owner-1");
    expect(mocks.findDuplicateResearchRun).toHaveBeenCalledWith({ database: true }, imported);
    expect(mocks.saveResearchRun).toHaveBeenCalledWith({ database: true }, imported);
    expect(mocks.listResearchRuns).toHaveBeenCalledWith({ database: true }, "owner-1");
  });

  it("reuses an existing archive id for an exact repeat import", async () => {
    mocks.parseResearchBackup.mockReturnValue({ id: "new-run", ownerId: "owner-1", topic: "Cafe demand" });
    mocks.findDuplicateResearchRun.mockResolvedValue([{ id: "existing-run" }]);
    const response = await POST(new Request("https://app.test/api/hunt/research-runs", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ format: "businessman-research-run", formatVersion: 1 }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: "existing-run", runs: [{ id: "new-run", schemaVersion: 1, topic: "Cafe demand", geography: "Goa, India", currency: "INR", createdAt: "2026-09-30T10:00:00.000Z" }] });
    expect(mocks.saveResearchRun).not.toHaveBeenCalled();
    expect(mocks.listResearchRuns).toHaveBeenCalledOnce();
  });
});
