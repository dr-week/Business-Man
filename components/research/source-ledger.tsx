"use client";

import { useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import type { ResearchOpportunity } from "@/lib/research-engine";
import { sourceAgeLabel } from "@/lib/source-freshness";
import styles from "./source-ledger.module.scss";

const filters = ["all", "buyer", "official", "supplier", "discussion", "other"] as const;
type SourceFilter = (typeof filters)[number];
const labels: Record<SourceFilter, string> = { all: "All", buyer: "Buyer", official: "Official", supplier: "Supplier", discussion: "Discussion", other: "Other" };

export function SourceLedger({ opportunities }: { opportunities: ResearchOpportunity[] }) {
  const sources = [...new Map(opportunities.flatMap((item) => item.sources).map((source) => [source.url, source])).values()]
    .filter((source) => /^https?:\/\//i.test(source.url))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const [filter, setFilter] = useState<SourceFilter>("all");
  const [query, setQuery] = useState("");
  if (!sources.length) return <p className="research-empty">Search to collect sources.</p>;

  const counts = Object.fromEntries(filters.map((kind) => [kind, kind === "all" ? sources.length : sources.filter((source) => kind === "other" ? !source.kind : source.kind === kind).length])) as Record<SourceFilter, number>;
  const normalizedQuery = query.trim().toLowerCase();
  const visible = sources.filter((source) => {
    const matchesKind = filter === "all" || (filter === "other" ? !source.kind : source.kind === filter);
    const matchesQuery = !normalizedQuery || `${source.title} ${source.provider} ${source.url}`.toLowerCase().includes(normalizedQuery);
    return matchesKind && matchesQuery;
  });

  return <section className={styles.ledger} aria-label="Research sources">
    <header className={styles.header}><div><h2>Source library</h2><p>Separate buyer proof from secondary signals. Discussion is not purchase evidence.</p></div><strong>{sources.length} links</strong></header>
    <label className={styles.search}><Search size={15} aria-hidden="true" /><span className="sr-only">Search sources</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, provider, or domain" /></label>
    <div className={styles.filters} role="group" aria-label="Filter sources by evidence type">{filters.map((kind) => <button type="button" key={kind} aria-pressed={filter === kind} onClick={() => setFilter(kind)}>{labels[kind]} <span>{counts[kind]}</span></button>)}</div>
    {visible.length ? <ul>{visible.map((source) => <li key={source.url}>
      <a href={source.url} target="_blank" rel="noopener noreferrer" title="Open source"><span>{source.title || source.provider}</span><ExternalLink size={15} aria-hidden="true" /></a>
      <small>{source.provider} · {labels[source.kind as SourceFilter] ?? "Other"} · Published {source.publishedAt?.slice(0, 10) || "date unknown"} · {sourceAgeLabel(source.publishedAt)} · Collected {source.retrievedAt?.slice(0, 10) || "date unknown"}</small>
    </li>)}</ul> : <p className={styles.empty}>No sources match these filters.</p>}
  </section>;
}
