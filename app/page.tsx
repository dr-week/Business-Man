"use client";

import { useMemo, useState } from "react";
import {
  Archive, Bookmark, Compass, Crown, Filter, FlaskConical, Globe2,
  Search, Shield, Sparkles, Telescope, X,
} from "lucide-react";
import { ResearchWorkbench } from "@/components/research-workbench";

export type Opportunity = {
  id: string;
  name: string;
  market: string;
  stage: "Signal" | "Watch" | "Validate";
  demand: number;
  supply: number;
  confidence: "Low" | "Medium";
  thesis: string;
  nextTest: string;
  evidence: { claim: string; source: string; url: string; risk?: boolean }[];
};

const opportunities: Opportunity[] = [
  {
    id: "agent-trust", name: "Agent trust registry", market: "Agent infrastructure",
    stage: "Validate", demand: 81, supply: 28, confidence: "Medium",
    thesis: "Teams need to find and approve safe agent capabilities.",
    nextTest: "Interview 10 internal-agent teams.",
    evidence: [
      { claim: "ARD standardizes capability discovery and verification.", source: "Google · Jun 2026", url: "https://developers.googleblog.com/announcing-the-agentic-resource-discovery-specification/" },
      { claim: "Budget ownership is unknown.", source: "Open question", url: "#", risk: true },
    ],
  },
  {
    id: "agent-commerce", name: "Agent commerce onboarding", market: "Commerce protocols",
    stage: "Validate", demand: 78, supply: 34, confidence: "Medium",
    thesis: "Merchants need agent-readable catalogs and checkout flows.",
    nextTest: "Audit 20 Indian merchant catalogs.",
    evidence: [
      { claim: "UCP defines a shared commerce lifecycle.", source: "Google · Jan 2026", url: "https://developers.googleblog.com/developers-guide-to-ai-agent-protocols/" },
      { claim: "Merchant urgency is unverified.", source: "Open question", url: "#", risk: true },
    ],
  },
  {
    id: "agent-audit", name: "Agent audit trails", market: "Regulated AI",
    stage: "Watch", demand: 87, supply: 49, confidence: "Medium",
    thesis: "Long-running agents need approvals, replay and evidence.",
    nextTest: "Map one regulated workflow.",
    evidence: [
      { claim: "Agents now run across tools, files and sandboxes.", source: "OpenAI · Sep 2026", url: "https://openai.com/index/introducing-the-agents-api/" },
      { claim: "Existing observability coverage may be sufficient.", source: "Open question", url: "#", risk: true },
    ],
  },
  {
    id: "aikosh-data", name: "AIKosh data readiness", market: "India AI",
    stage: "Signal", demand: 68, supply: 22, confidence: "Low",
    thesis: "Public datasets need cleaning, provenance and evaluation.",
    nextTest: "Inspect 20 datasets for repeat gaps.",
    evidence: [
      { claim: "AIKosh hosts datasets, models and toolkits.", source: "IndiaAI · 2026", url: "https://aikosh.indiaai.gov.in/home/about-us/" },
      { claim: "Commercial reuse terms need review.", source: "Open question", url: "#", risk: true },
    ],
  },
  {
    id: "india-adapters", name: "India protocol adapters", market: "Cross-border tools",
    stage: "Signal", demand: 63, supply: 18, confidence: "Low",
    thesis: "Indian workflows need bridges to global agent protocols.",
    nextTest: "Test one export workflow manually.",
    evidence: [
      { claim: "Agent protocols now cover tools, agents and commerce.", source: "Google · Mar 2026", url: "https://developers.googleblog.com/developers-guide-to-ai-agent-protocols/" },
      { claim: "Payment and logistics access may block entry.", source: "Open question", url: "#", risk: true },
    ],
  },
];

const nav = [
  [Compass, "Find"], [Bookmark, "Watch"], [Telescope, "Research"],
  [Archive, "Sources"], [Shield, "Rejected"],
] as const;

export default function Home() {
  const [activeId, setActiveId] = useState(opportunities[0].id);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [stage, setStage] = useState<"All" | Opportunity["stage"]>("All");
  const [watched, setWatched] = useState<string[]>([opportunities[0].id]);

  const visible = useMemo(() => opportunities.filter((item) => {
    const matchesStage = stage === "All" || item.stage === stage;
    const text = `${item.name} ${item.market}`.toLowerCase();
    return matchesStage && text.includes(query.toLowerCase());
  }), [query, stage]);
  const active = opportunities.find((item) => item.id === activeId) ?? opportunities[0];

  return <main className="min-h-screen">
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 border-r p-4 lg:flex lg:flex-col">
      <div className="flex items-center gap-3 px-2 py-3">
        <span className="royal-mark"><Crown size={17}/></span>
        <span className="brand">BUSINESSMAN</span>
      </div>
      <nav className="mt-8 space-y-1">{nav.map(([Icon, label], index) => <button key={label} className={`nav-item ${index === 0 ? "nav-active" : ""}`}><Icon size={17}/><span>{label}</span></button>)}</nav>
      <div className="mt-auto border-t border-[rgb(194_166_99/.15)] px-2 pt-4 text-xs text-stone-500">5 markets · 8 sources</div>
    </aside>

    <section className="lg:ml-56">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b px-5 backdrop-blur-xl sm:px-8">
        <span className="brand lg:hidden">BUSINESSMAN</span>
        <div className="hidden items-center gap-2 text-xs text-stone-500 lg:flex"><Sparkles size={14} className="text-[#c2a663]"/>Opportunity intelligence</div>
        <button className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(194_166_99/.25)] text-sm text-[#e5d5aa]" aria-label="Account">D</button>
      </header>

      <div className="mx-auto max-w-[1400px] p-5 sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div><p className="eyebrow">FIND</p><h1 className="text-3xl font-medium">Opportunity desk</h1></div>
          <span className="hidden rounded-full border border-[rgb(194_166_99/.18)] px-3 py-1.5 text-xs text-stone-500 sm:block">Q4 · 2026</span>
        </div>

        <div className="mb-4 flex gap-2">
          <label className="search-box"><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search markets" aria-label="Search markets"/></label>
          <button onClick={() => setShowFilters((value) => !value)} className={`icon-button ${showFilters ? "is-active" : ""}`} aria-label="Filters">{showFilters ? <X size={17}/> : <Filter size={17}/>}</button>
        </div>

        {showFilters && <div className="mb-4 flex gap-2">{(["All", "Signal", "Watch", "Validate"] as const).map((value) => <button key={value} onClick={() => setStage(value)} className={`filter-chip ${stage === value ? "filter-active" : ""}`}>{value}</button>)}</div>}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,.92fr)_minmax(420px,1.08fr)]">
          <section className="panel overflow-hidden">
            <div className="panel-title"><span>Markets</span><span>{visible.length}</span></div>
            <div>{visible.map((item) => <button key={item.id} onClick={() => setActiveId(item.id)} className={`market-row ${active.id === item.id ? "market-active" : ""}`}>
              <div className="min-w-0"><div className="mb-1.5 flex items-center gap-2"><span className={`stage stage-${item.stage.toLowerCase()}`}>{item.stage}</span><span className="truncate text-xs text-stone-500">{item.market}</span></div><h2 className="truncate text-base font-medium">{item.name}</h2></div>
              <div className="score"><strong>{item.demand - item.supply}</strong><span>gap</span></div>
            </button>)}</div>
            {!visible.length && <div className="p-8 text-center text-sm text-stone-500">No matches</div>}
          </section>

          <section className="panel p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><span className={`stage stage-${active.stage.toLowerCase()}`}>{active.stage}</span><h2 className="mt-3 text-2xl font-medium">{active.name}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-stone-400">{active.thesis}</p></div>
              <button onClick={() => setWatched((items) => items.includes(active.id) ? items.filter((id) => id !== active.id) : [...items, active.id])} className={`icon-button shrink-0 ${watched.includes(active.id) ? "is-active" : ""}`} aria-label="Watch"><Bookmark size={17} fill={watched.includes(active.id) ? "currentColor" : "none"}/></button>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
              <Stat label="Demand" value={active.demand}/><Stat label="Supply" value={active.supply}/><Stat label="Confidence" value={active.confidence}/>
            </div>
            <div className="next-test"><FlaskConical size={17}/><div><span>Next test</span><strong>{active.nextTest}</strong></div></div>
            <ResearchWorkbench opportunity={active}/>
          </section>
        </div>
      </div>
    </section>
  </main>;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;
}
