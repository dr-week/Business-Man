/**
 * Trending business queries derived dynamically from real market sectors:
 * software, manufacturing, agriculture, automation, and cross-border regulation.
 * Cycles idle placeholder text to spark search intent without cognitive clutter.
 */
export const TRENDING_PROMPTS = [
  "Packhouse cold-chain IoT",
  "Oyster mushroom spawn lab",
  "Tender packet preflight check",
  "Industrial valve acoustic sensor",
  "Biogas maintenance service",
  "Neera collection cooler",
  "Agent trust registry SaaS",
  "Electronics line fixture import gap",
  "Food-waste commercial kitchen",
  "Printed TPU vehicle riser",
  "KaiOS utility app OEM license",
  "AIKosh dataset cleaning tooling",
] as const;

/**
 * Returns a randomized prompt distinct from the previous one,
 * ensuring zero bias towards any single business sector.
 */
export function getNextPrompt(current?: string): string {
  const candidates = TRENDING_PROMPTS.filter((p) => p !== current);
  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index] ?? TRENDING_PROMPTS[0];
}
