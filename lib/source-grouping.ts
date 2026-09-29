import type { SourceSignal } from "./discovery";

const noise = new Set("about after again anyone best business can could does error errors find for from have help how into issue issues looking manage managed management managing need problem problems should solve solving solution solutions that the there these this track tracked tracking what when where which with would your".split(" "));
const singular = (word: string) => word.length > 4 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word;
function terms(title: string): Set<string> {
  return new Set((title.toLowerCase().replace(/^(?:ask hn|show hn)[:?\s-]*/i, "").match(/[a-z0-9]{4,}/g) ?? [])
    .map(singular).filter((word) => !noise.has(word)));
}
function sameProblem(left: SourceSignal, right: SourceSignal): boolean {
  const a = terms(left.title), b = terms(right.title);
  if (a.size < 2 || b.size < 2) return false;
  const shared = [...a].filter((word) => b.has(word)).length;
  return shared >= 2 && shared / Math.max(a.size, b.size) >= 0.6;
}
function canonicalUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) return null;
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) if (/^utm_.+|^(ref|source|fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
    url.searchParams.sort();
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

const MAX_SOURCES = 500;

/** Merge repeated problem descriptions while retaining every independent source. */
export function groupSources(sources: SourceSignal[]): SourceSignal[][] {
  const unique = new Map<string, SourceSignal>();
  for (const source of sources.slice(0, MAX_SOURCES)) {
    const key = canonicalUrl(source.url) ?? `invalid:${source.provider}:${source.id}`;
    if (!unique.has(key)) unique.set(key, source);
  }
  const groups: SourceSignal[][] = [];
  for (const source of unique.values()) {
    const group = groups.find((items) => sameProblem(items[0], source));
    if (group) group.push(source); else groups.push([source]);
  }
  return groups;
}
