"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Database, Factory, Landmark, Search, Trophy, Truck } from "lucide-react";
import { filterOfficialSources, sourceCategories, type SourceCategory } from "@/lib/official-sources";
const icons = { Funding: Landmark, Buyers: Factory, Challenges: Trophy, Markets: Truck, Technical: Database } as const;

export function OfficialSourceLibrary() {
  const [category, setCategory] = useState<SourceCategory>("All");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => filterOfficialSources(category, query), [category, query]);

  return <section className="hunt-source-page" aria-label="Official research sources">
    <div className="source-library-controls">
      <label className="hunt-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a source" aria-label="Find a source" /></label>
      <div className="source-library-filters" aria-label="Source category">
        {sourceCategories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
      </div>
      <span className="hunt-result-count">{visible.length}</span>
    </div>
    <div className="hunt-source-grid">
      {visible.map((item) => {
        const Icon = icons[item.category];
        return <a key={item.url} href={item.url} target="_blank" rel="noreferrer">
          <span className="source-library-type"><Icon size={14} />{item.category}</span>
          <strong>{item.name}<ArrowUpRight size={14} /></strong>
          <span>{item.signal}</span>
          <small>{item.limit}</small>
        </a>;
      })}
      {visible.length === 0 && <p className="source-library-empty">No sources</p>}
    </div>
  </section>;
}
