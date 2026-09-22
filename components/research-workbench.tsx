"use client";

import { Link2, ShieldAlert } from "lucide-react";

type Props = { view: "evidence" | "risks"; setView: (view: "evidence" | "risks") => void };

const evidence = [
  { source: "OEM partnership announcement", claim: "Three device integrations released this quarter", state: "Supporting", risk: false },
  { source: "Community discussion sample", claim: "Teams still rely on manual visual inspection", state: "Supporting", risk: false },
  { source: "Negative research query", claim: "Buyer budget and integration cycles are still unverified", state: "Open risk", risk: true },
];

export function ResearchWorkbench({ view, setView }: Props) {
  const rows = view === "evidence" ? evidence : evidence.filter((item) => item.risk);
  return <section className="mt-5 rounded-xl border border-white/8 bg-[#0a1929] p-5">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-medium text-cyan-300">RESEARCH WORKBENCH</p><h2 className="mt-1 text-lg font-semibold">Evidence before conviction</h2><p className="mt-1 text-sm text-slate-400">Every promising signal needs a source; every source needs a challenge.</p></div><div className="flex rounded-lg border border-white/10 p-1 text-xs">{(["evidence", "risks"] as const).map((tab) => <button key={tab} onClick={() => setView(tab)} className={`rounded-md px-3 py-1.5 capitalize ${view === tab ? "bg-white/10 text-white" : "text-slate-500"}`}>{tab === "risks" ? "Open risks" : "Evidence"}</button>)}</div></div>
    <div className="mt-5 grid gap-3 lg:grid-cols-[1.4fr_.6fr]"><div className="overflow-hidden rounded-lg border border-white/8"><div className="grid grid-cols-[minmax(0,1fr)_auto] border-b border-white/8 px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-slate-500"><span>Claim & source</span><span>Research state</span></div>{rows.map((item) => <div key={item.source} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-white/6 px-4 py-4 last:border-0"><div><p className="text-sm text-slate-200">{item.claim}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Link2 size={12}/>{item.source}</p></div><span className={`h-fit rounded px-2 py-1 text-[11px] ${item.risk ? "bg-amber-300/10 text-amber-200" : "bg-emerald-300/10 text-emerald-200"}`}>{item.state}</span></div>)}</div>
    <div className="rounded-lg border border-amber-300/15 bg-amber-300/[.045] p-4"><ShieldAlert className="text-amber-200" size={19}/><h3 className="mt-3 text-sm font-semibold">Disproof queue</h3><p className="mt-1 text-xs leading-5 text-slate-400">Before elevating this lead, verify buyer budgets, pilot timelines, and incumbent retention.</p><button className="mt-4 rounded-md border border-amber-300/25 px-3 py-2 text-xs text-amber-100">Run negative research</button></div></div>
  </section>;
}
