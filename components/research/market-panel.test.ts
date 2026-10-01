import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import type { ResearchOpportunity } from "@/lib/research-engine";
import { MarketPanel } from "./market-panel";

const opportunity = {
  id: "local-workshop",
  name: "Local repair workshop",
  category: "Services",
  geography: "Goa",
  buyer: null,
  problem: "Unknown",
  offering: null,
  alternatives: ["Independent repair shops"],
  gap: "Unknown",
  risks: [],
  candidateAlternatives: [{ name: "example/repair-tool", url: "https://github.com/example/repair-tool", description: "Tool", stars: 12, pushedAt: "2026-01-01T00:00:00Z", license: "MIT" }],
  sources: [],
  claims: [],
  assumptions: {},
  factors: [],
  strength: null,
  confidence: "Low",
  financials: null,
  missing: [],
} as ResearchOpportunity;

it("keeps local candidates visible and collapses secondary alternatives by default", () => {
  const markup = renderToStaticMarkup(createElement(MarketPanel, {
    opportunity,
    competitors: [],
    placesConfigured: false,
    footprint: null,
    checkedAt: "2026-10-01T00:00:00Z",
    refreshing: false,
    onRefresh: () => {},
  }));
  const alternativesIndex = markup.indexOf("<summary>Alternatives</summary>");
  const detailsIndex = markup.lastIndexOf("<details", alternativesIndex);
  const detailsEnd = markup.indexOf(">", detailsIndex);

  expect(alternativesIndex).toBeGreaterThan(-1);
  expect(markup.slice(detailsIndex, detailsEnd)).not.toContain("open");
  expect(markup).toContain("Local competitors");
  expect(markup).toContain("Independent repair shops");
  expect(markup).toContain("example/repair-tool");
});
