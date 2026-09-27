import { afterEach, expect, it, vi } from "vitest";
import { classifyQuery } from "./query-classifier";
import { prepareResearchQuery } from "./research-query";
afterEach(() => vi.unstubAllGlobals());
it("does not contact a model unless configured and needed", async () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  await classifyQuery(prepareResearchQuery("novel products"), {}, new AbortController().signal);
  await classifyQuery(prepareResearchQuery("repair service"), { url: "https://example.com/v1/systemone" }, new AbortController().signal);
  expect(fetcher).not.toHaveBeenCalled();
});
it("accepts only a typed label and preserves original search constraints", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ answers: { intent: { choice: "manufacturing" } } })));
  const query = prepareResearchQuery("novel products under INR 50000 without imports");
  const result = await classifyQuery(query, { url: "http://127.0.0.1:8000/v1/systemone" }, new AbortController().signal);
  expect(result.intent).toBe("manufacturing");
  expect(result.searchTerms).toBe(query.searchTerms);
  expect(result.constraints).toEqual(query.constraints);
});
it("falls back on invalid model output", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ answers: { intent: { choice: "invented" } } })));
  const result = await classifyQuery(prepareResearchQuery("new products"), { url: "https://example.com/v1/systemone" }, new AbortController().signal);
  expect(result.intent).toBe("explore");
  expect(result.classifier).toContain("unavailable");
});
