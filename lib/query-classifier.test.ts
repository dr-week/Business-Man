import { afterEach, expect, it, vi } from "vitest";
import { classifyQuery } from "./query-classifier";
import { prepareResearchQuery } from "./research-query";
afterEach(() => vi.unstubAllGlobals());
it("does not contact a model unless configured", async () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  await classifyQuery(prepareResearchQuery("novel products"), {}, new AbortController().signal);
  expect(fetcher).not.toHaveBeenCalled();
});
it("accepts only a typed label and preserves original search constraints", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ answers: { intent: { choice: "manufacturing" }, focus: { choice: "economics" } } })));
  const query = prepareResearchQuery("novel products under INR 50000 without imports");
  const result = await classifyQuery(query, { url: "http://127.0.0.1:8000/v1/systemone" }, new AbortController().signal);
  expect(result.intent).toBe("manufacturing");
  expect(result.researchFocus).toBe("economics");
  expect(result.searchTerms).toBe(query.searchTerms);
  expect(result.constraints).toEqual(query.constraints);
});
it("falls back on invalid model output", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ answers: { intent: { choice: "invented" } } })));
  const result = await classifyQuery(prepareResearchQuery("new products"), { url: "https://example.com/v1/systemone" }, new AbortController().signal);
  expect(result.intent).toBe("explore");
  expect(result.classifier).toContain("unavailable");
});
it("bounds model responses and cancels oversized streams", async () => {
  const cancel = vi.fn();
  const body = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new Uint8Array(16_001)); },
    cancel,
  });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body)));
  const result = await classifyQuery(prepareResearchQuery("new products"), { url: "https://example.com/v1/systemone" }, new AbortController().signal);
  expect(result.classifier).toBe("rules: model unavailable");
  expect(cancel).toHaveBeenCalled();
});
