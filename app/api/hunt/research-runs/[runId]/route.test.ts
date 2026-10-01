import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), ownerId: vi.fn(), apiError: vi.fn(), deleteResearchRun: vi.fn(), isCrossOrigin: vi.fn(() => false) }));
vi.mock("@/db", () => ({ getDb: mocks.getDb }));
vi.mock("@/lib/hunt-api", () => ({ apiError: mocks.apiError, isCrossOrigin: mocks.isCrossOrigin, ownerId: mocks.ownerId }));
vi.mock("@/lib/research-run-store", () => ({ deleteResearchRun: mocks.deleteResearchRun }));

import { DELETE } from "./route";

const params = { params: Promise.resolve({ runId: "123e4567-e89b-42d3-a456-426614174000" }) };

describe("saved research deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ownerId.mockResolvedValue("owner-1");
    mocks.getDb.mockReturnValue({ database: true });
  });

  it("rejects unauthenticated requests before touching the database", async () => {
    mocks.ownerId.mockResolvedValue(null);
    const response = await DELETE(new Request("https://app.test", { method: "DELETE" }), params);
    expect(response.status).toBe(401);
    expect(mocks.deleteResearchRun).not.toHaveBeenCalled();
  });

  it("validates ids before deleting", async () => {
    const response = await DELETE(new Request("https://app.test", { method: "DELETE" }), { params: Promise.resolve({ runId: "bad-id" }) });
    expect(response.status).toBe(400);
    expect(mocks.deleteResearchRun).not.toHaveBeenCalled();
  });

  it("deletes by the authenticated owner and returns an empty 204", async () => {
    const response = await DELETE(new Request("https://app.test", { method: "DELETE" }), params);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(mocks.deleteResearchRun).toHaveBeenCalledWith({ database: true }, "owner-1", "123e4567-e89b-42d3-a456-426614174000");
  });

  it("rejects cross-origin requests", async () => {
    mocks.isCrossOrigin.mockReturnValue(true);
    const response = await DELETE(new Request("https://app.test", { method: "DELETE" }), params);
    expect(response.status).toBe(403);
    expect(mocks.ownerId).not.toHaveBeenCalled();
  });
});
