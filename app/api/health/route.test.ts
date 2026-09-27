import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("Project Health Route", () => {
  it("returns 200 with unique project identification", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json() as { app: string; projectId: string; status: string };
    expect(data.status).toBe("ok");
    expect(data.app).toBe("businessman");
    expect(data.projectId).toBe("businessman-desk");
  });
});
