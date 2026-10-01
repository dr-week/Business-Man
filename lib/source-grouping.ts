import type { SourceSignal } from "./discovery";

const noise = new Set("about after again anyone best business can could does error errors find for from have help how into issue issues looking manage managed management managing need problem problems should solve solving solution solutions that the there these this track tracked tracking what when where which with would your".split(" "));
const singular = (word: string) => word.length > 4 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word;
function terms(title: string): Set<string> {
  return new Set((title.toLowerCase().replace(/^(?:ask hn|show hn)[:?\s-]*/i, "").match(/[a-z0-9]{4,}/g) ?? [])
    .map(singular).filter((word) => !noise.has(word)));
}
function sameProblem(a: Set<string>, b: Set<string>): boolean {
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
  const groupTerms: Set<string>[] = [];
  const groupsByTerm = new Map<string, number[]>();
  for (const source of unique.values()) {
    const sourceTerms = terms(source.title);
    const candidates = new Set<number>();
    for (const term of sourceTerms) for (const index of groupsByTerm.get(term) ?? []) candidates.add(index);
    let match = -1;
    for (const index of [...candidates].sort((a, b) => a - b)) {
      if (sameProblem(groupTerms[index], sourceTerms)) { match = index; break; }
    }
    if (match >= 0) groups[match].push(source);
    else {
      const index = groups.length;
      groups.push([source]);
      groupTerms.push(sourceTerms);
      for (const term of sourceTerms) {
        const posting = groupsByTerm.get(term);
        if (posting) posting.push(index); else groupsByTerm.set(term, [index]);
      }
    }
  }
  return groups;
}
