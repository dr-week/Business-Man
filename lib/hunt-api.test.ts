import { describe, it, expect } from "vitest";
import { isCrossOrigin, apiError } from "@/lib/hunt-api";

describe("Hunt API Utilities", () => {
  describe("isCrossOrigin", () => {
    it("returns false when no origin header is provided", () => {
      const req = new Request("http://localhost:3000/api/hunt/leads");
      expect(isCrossOrigin(req)).toBe(false);
    });

    it("returns false when origin matches request URL origin", () => {
      const req = new Request("http://localhost:3000/api/hunt/leads", {
        headers: { origin: "http://localhost:3000" },
      });
      expect(isCrossOrigin(req)).toBe(false);
    });

    it("returns true when origin does not match request URL origin", () => {
      const req = new Request("http://localhost:3000/api/hunt/leads", {
        headers: { origin: "https://malicious-site.com" },
      });
      expect(isCrossOrigin(req)).toBe(true);
    });

    it("handles malformed origin gracefully by returning true", () => {
      const req = new Request("http://localhost:3000/api/hunt/leads", {
        headers: { origin: ":::invalid-url" },
      });
      expect(isCrossOrigin(req)).toBe(true);
    });
  });

  describe("apiError", () => {
    it("returns 503 when error indicates missing table or D1 binding", async () => {
      const error = new Error("no such table: hunt_leads");
      const res = apiError(error);
      expect(res.status).toBe(503);
      const data = await res.json() as { error: string };
      expect(data.error).toContain("Apply the D1 migration");
    });

    it("returns 500 on unexpected database errors", async () => {
      const error = new Error("Connection timed out");
      const res = apiError(error);
      expect(res.status).toBe(500);
      const data = await res.json() as { error: string };
      expect(data.error).toBe("Research request failed.");
    });
  });
});
