import { describe, expect, it } from "vitest";
import { readLimitedJson } from "./read-limited-json";

describe("readLimitedJson", () => {
  it("parses responses within the byte limit", async () => {
    await expect(readLimitedJson(new Response('{"ok":true}'), 11)).resolves.toEqual({ ok: true });
  });

  it("rejects oversized responses before parsing", async () => {
    await expect(readLimitedJson(new Response('{"ok":true}'), 10)).rejects.toThrow("Response too large");
  });

  it("rejects a response whose declared size exceeds the limit", async () => {
    const response = new Response("{}", { headers: { "Content-Length": "100" } });
    await expect(readLimitedJson(response, 10)).rejects.toThrow("Response too large");
  });

  it("accepts request streams through the same boundary", async () => {
    const request = new Request("https://example.test", { method: "POST", body: '{"ok":true}' });
    await expect(readLimitedJson(request, 11)).resolves.toEqual({ ok: true });
  });
});
