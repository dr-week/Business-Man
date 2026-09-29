const DAY_MS = 24 * 60 * 60 * 1000;

/** Age band for source triage only; age does not measure evidence quality. */
export function sourceAgeLabel(value: string | undefined, now = Date.now()): string {
  const timestamp = value ? Date.parse(value) : NaN;
  if (!Number.isFinite(timestamp)) return "Date unknown";
  if (timestamp > now) return "Future date";
  const ageDays = Math.floor((now - timestamp) / DAY_MS);
  if (ageDays <= 90) return "Published within 90 days";
  if (ageDays <= 365) return "Published 91–365 days ago";
  return "Published over 365 days ago";
}
