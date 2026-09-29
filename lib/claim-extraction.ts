import type { SourceSignal } from "./discovery";
import type { Claim, FactorName } from "./research-engine";

/** Conservative rules: a reported transaction is stronger than stated willingness to pay. */
export function extractClaims(source: SourceSignal): Claim[] {
  const base = { sourceIds: [source.id], publishedAt: source.publishedAt };
  const claims: Claim[] = [{ ...base, id: `context:${source.id}`, text: source.excerpt || source.title, direction: "context", basis: "Source context" }];
  const sentences = source.excerpt.match(/[^.!?]+[.!?]?/g)?.slice(0, 15) ?? [];
  for (const [index, raw] of sentences.entries()) {
    const text = raw.trim();
    if (!/\b(i|we|our|my|us)\b/i.test(text)) continue;
    if (/\b(?:not a problem|no longer a problem|already solved|works fine|do not have this problem|don't have this problem)\b/i.test(text)) {
      claims.push({ ...base, id: `contradiction:${source.id}:${index}`, text, direction: "contradicts", basis: "Self-reported counterexample" });
      continue;
    }
    const factors: [FactorName, boolean, string][] = [
      ["Paid demand", source.kind !== "supplier" && source.kind !== "official" &&
        /\b(?:paid|paying|pay)\s+(?:\$|₹|€|£|\d|for\b)|\b(?:bought|purchased|contracted|subscribed\s+to)\b/i.test(text) &&
        !/\b(?:would|could|might|willing to|intend to|plan to|not|never|can't|cannot|didn't|don't|do not)\s+(?:\w+\s+){0,2}(?:pay|paid|paying|buy|bought|purchase|purchased|subscribe|subscribed)\b/i.test(text), "Self-reported purchase"],
      ["Severity and frequency", /\b(?:daily|weekly|monthly|every day|every week|every month|repeatedly|recurring)\b/i.test(text), "Self-reported recurrence"],
      ["Alternative gap", /\b(?:currently use|tried|alternative|competitor|spreadsheet|manual)\b/i.test(text) && /\b(?:but|however|fails|too expensive|doesn't|cannot)\b/i.test(text), "Self-reported alternative friction"],
    ];
    for (const [factor, matches, basis] of factors) if (matches) claims.push({ ...base, id: `support:${source.id}:${index}:${factor}`, text, direction: "supports", factor, basis });
  }
  return claims;
}
