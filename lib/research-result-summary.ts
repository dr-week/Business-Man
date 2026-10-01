import type { ResearchOpportunity } from "./research-engine";

export function researchResultSummary(opportunities: Pick<ResearchOpportunity, "strength">[], webCount = 0): string {
  if (opportunities.length) {
    const scored = opportunities.filter((item) => item.strength !== null).length;
    return `${opportunities.length} source lead${opportunities.length === 1 ? "" : "s"}; ${scored} with enough evidence to score`;
  }
  if (webCount) return `${webCount} web source${webCount === 1 ? "" : "s"} ready to review; no scored leads`;
  return "No relevant source leads; broaden the topic or check source availability";
}
