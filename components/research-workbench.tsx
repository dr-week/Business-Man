"use client";

import { useState } from "react";
import { ExternalLink, Scale, ShieldAlert } from "lucide-react";
import type { Opportunity } from "@/app/page";

export function ResearchWorkbench({ opportunity }: { opportunity: Opportunity }) {
  const [view, setView] = useState<"Evidence" | "Risks">("Evidence");
  const rows = view === "Evidence" ? opportunity.evidence : opportunity.evidence.filter((item) => item.risk);

  return <div className="mt-6 border-t border-[rgb(194_166_99/.14)] pt-5">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm font-medium text-[#e5d5aa]"><Scale size={16}/>Research</div>
      <div className="segmented">{(["Evidence", "Risks"] as const).map((item) => <button key={item} onClick={() => setView(item)} className={view === item ? "segment-active" : ""}>{item}</button>)}</div>
    </div>
    <div className="mt-3 overflow-hidden rounded-lg border border-[rgb(194_166_99/.13)]">{rows.map((item) => <div key={item.claim} className="evidence-row">
      <div className="min-w-0"><p>{item.claim}</p>{item.url === "#" ? <span>{item.source}</span> : <a href={item.url} target="_blank" rel="noreferrer">{item.source}<ExternalLink size={11}/></a>}</div>
      {item.risk ? <ShieldAlert size={16} className="shrink-0 text-[#b87757]"/> : <span className="verified"/>}
    </div>)}</div>
  </div>;
}
