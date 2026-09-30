import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(), ownerId: vi.fn(), apiError: vi.fn(), getResearchRun: vi.fn(),
  parseResearchBackup: vi.fn(), saveResearchRun: vi.fn(),
}));

vi.mock("@/db", () => ({ getDb: mocks.getDb }));
vi.mock("@/lib/hunt-api", () => ({ apiError: mocks.apiError, isCrossOrigin: vi.fn(() => false), ownerId: mocks.ownerId }));
vi.mock("@/lib/research-run-store", () => ({
  getLatestResearchRun: vi.fn(), getResearchRun: mocks.getResearchRun, listResearchRuns: vi.fn(),
  parseResearchBackup: mocks.parseResearchBackup, saveResearchRun: mocks.saveResearchRun,
  RESEARCH_RUN_SCHEMA_VERSION: 1,
}));

import { POST } from "./route";

describe("saved research backup import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ownerId.mockResolvedValue("owner-1");
    mocks.getDb.mockReturnValue({ database: true });
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
    expect(await response.json()).toEqual({ id: "new-run" });
    expect(mocks.parseResearchBackup).toHaveBeenCalledWith(backup, "owner-1");
    expect(mocks.saveResearchRun).toHaveBeenCalledWith({ database: true }, imported);
  });
});
