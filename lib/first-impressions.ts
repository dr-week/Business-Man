export type FirstImpression = "investigate" | "watch" | "pass";

const MAX_DECISIONS = 200;

export function parseFirstImpressions(value: unknown): Record<string, FirstImpression> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([id, choice]) => id.length > 0 && id.length <= 160 && (choice === "investigate" || choice === "watch" || choice === "pass"))
    .slice(-MAX_DECISIONS));
}

export function recordFirstImpression(
  current: Record<string, FirstImpression>,
  id: string,
  choice: FirstImpression,
): Record<string, FirstImpression> {
  if (!id || id.length > 160) return current;
  const next = { ...current };
  delete next[id];
  next[id] = choice;
  const keys = Object.keys(next);
  if (keys.length <= MAX_DECISIONS) return next;
  delete next[keys[0]];
  return next;
}
