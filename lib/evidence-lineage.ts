import type { SourceSignal } from "./discovery";
import type { Claim } from "./research-engine";

const normalize = (text: string) => text.toLowerCase().replace(/https?:\/\/\S+/g, " ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");

function canonicalUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    for (const key of [...url.searchParams.keys()]) if (/^(utm_.+|ref|source|fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
    url.searchParams.sort();
    return url.toString().replace(/\/$/, "");
  } catch { return value.trim().toLowerCase(); }
}

/** Reposted text has one evidentiary origin even when carried by several providers. */
export function sourceLineageKey(source: SourceSignal): string {
  const body = normalize(source.excerpt);
  return body.length >= 30 ? body : normalize(source.title);
}

export function independentSourceCount(sources: SourceSignal[]): number {
  const unique = new Set<string>();
  for (const source of sources) {
    const canonical = canonicalUrl(source.url);
    const lineage = sourceLineageKey(source);
    // Exact normalized text catches syndicated copies without collapsing merely similar reports.
    unique.add(lineage.length >= 30 ? `text:${lineage}` : `url:${canonical}`);
  }
  return unique.size;
}

export function independentClaimCount(claims: Claim[], sources: SourceSignal[]): number {
  const byId = new Map(sources.map((source) => [source.id, source]));
  const origins = new Set<string>();
  for (const claim of claims) {
    const linked = claim.sourceIds.map((id) => byId.get(id)).filter((source): source is SourceSignal => Boolean(source));
    if (linked.length) for (const source of linked) origins.add(sourceLineageKey(source));
    else origins.add(`claim:${claim.id}`);
  }
  return origins.size;
}
