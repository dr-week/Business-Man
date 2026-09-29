import { afterEach, expect, it, vi } from "vitest";
import { collectBraveWebResults } from "./brave-search";

afterEach(() => vi.unstubAllGlobals());

it("skips network when web search is not configured", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  expect(await collectBraveWebResults("metal fabrication", "Goa, India")).toEqual([]);
  expect(fetchMock).not.toHaveBeenCalled();
});

it("requests local leads and keeps only bounded HTTPS links", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ web: { results: [
    { title: "  Supplier  ", url: "https://example.org/supply", description: " Market   listing " },
    { title: "Insecure", url: "http://example.org/unsafe" },
    { title: "Credentials", url: "https://user:pass@example.org/private" },
  ] } }));
  vi.stubGlobal("fetch", fetchMock);
  const results = await collectBraveWebResults("metal fabrication", "Goa, India", "test-key");
  const [url, options] = fetchMock.mock.calls[0] as [URL, RequestInit];
  expect(url.searchParams.get("country")).toBe("IN");
  expect(url.searchParams.get("count")).toBe("8");
  expect(options.redirect).toBe("manual");
  expect(results).toEqual([{ title: "Supplier", url: "https://example.org/supply", snippet: "Market listing" }]);
});

it("rejects oversized provider responses at the shared stream limit", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ web: { results: [
    { title: "Supplier", url: "https://example.org/" + "x".repeat(512_000), description: "" },
  ] } }))));
  await expect(collectBraveWebResults("metal fabrication", "Goa, India", "test-key")).rejects.toThrow("Response too large");
});
