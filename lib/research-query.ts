import { correctQuery } from "./query-spelling";

export const intentLabels = {
  asset: "Use materials, premises or equipment already owned",
  manufacturing: "Manufacture or fabricate products",
  service: "Provide services or rent equipment",
  explore: "Explore businesses; intent unclear",
} as const;
export function prepareResearchQuery(raw: string, options: { geography?: string; original?: boolean } = {}) {
  const original = raw.trim();
  const spelling = options.original ? { corrected: original, edits: [], suggestions: [] } : correctQuery(original, [options.geography ?? ""]);
  const normalized = spelling.corrected.normalize("NFC").replace(/\s+/g, " ");
  const intent = /\bi (?:have|own)\b/i.test(normalized) ? "asset"
    : /\bmanufactur\w*|fabrication\b/i.test(normalized) ? "manufacturing"
    : /\bservice\w*|trekking|repair|rental|rent|cleaning|grooming|installation|laundry\b/i.test(normalized) ? "service" : "explore";
  const subject = normalized
    .replace(/\b(?:what can i do with (?:it|them)|how can i|i have|i own|a lot of|can you|please|start a|related|business opportunities|business|opportunities)\b/gi, " ")
    .replace(/\b(?:a|an|the|it)\b/gi, " ").replace(/[?!]+/g, " ").replace(/\s+/g, " ").trim();
  const searchTerms = options.original ? original : subject || normalized;
  const constraints = {
    quantities: normalized.match(/\b\d[\d,.]*\s*(?:kg|tonnes?|tons?|litres?|liters?|workers?|sq\s*ft|acres?|units?)\b/gi) ?? [],
    budgets: normalized.match(/(?:[₹$€£]|\b(?:INR|USD|EUR|GBP))\s*\d[\d,.]*(?:\s*(?:lakh|crore|million|thousand|k))?\b|\b(?:budget|under|maximum|minimum)\s+\d[\d,.]*(?:\s*(?:lakh|crore|million|thousand|k))?\b/gi) ?? [],
    exclusions: normalized.match(/\b(?:no|not|without|excluding)\s+[^,.;!?]+/gi) ?? [],
    locations: normalized.match(/\b(?:in|near|at)\s+[^,.;!?]+/gi) ?? [],
  };
  return { original, corrected: normalized, brief: `${intentLabels[intent]}: ${normalized}`, searchTerms,
    intent, classifier: "rules" as string, assets: intent === "asset" ? [subject] : [], constraints,
    edits: spelling.edits, suggestions: spelling.suggestions };
}
export type PreparedQuery = ReturnType<typeof prepareResearchQuery>;
