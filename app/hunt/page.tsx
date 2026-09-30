"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
const NewsFeedPanel = dynamic(() => import("@/components/news-feed").then((module) => module.NewsFeedPanel));
import { Archive, Calculator, ChartColumn, Crown, DollarSign, Files, MapPinned, Search, Star, Settings, UserCircle, Newspaper, X, ClipboardList } from "lucide-react";
import { SourceDiscovery } from "@/components/source-discovery";
const OfficialSourceLibrary = dynamic(() => import("@/components/research/official-source-library").then((module) => module.OfficialSourceLibrary));
const RevenueSystemWorkbench = dynamic(() => import("@/components/research/revenue-system-workbench").then((module) => module.RevenueSystemWorkbench));
const ValidationReport = dynamic(() => import("@/components/reporting/validation-report").then((module) => module.ValidationReport));
import "./hunt.scss";

export default function HuntPage() {
  const drawer = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<"research" | "analysis" | "economics" | "market" | "sources" | "starred" | "settings" | "profile" | "news" | "revenue" | "reporting">("research");
  const [researchTopic, setResearchTopic] = useState("");
  const [error, setError] = useState("");
  const [showOfficial, setShowOfficial] = useState(false);
  return <main className="hunt-page">
    <header className="hunt-app-header">
      <div className="hunt-brand"><button className="hunt-icon-action" title="Open navigation" aria-label="Open navigation" aria-haspopup="dialog" onClick={() => drawer.current?.showModal()}><Crown size={20} /></button><strong>Businessman</strong></div>
    </header>
    <dialog ref={drawer} className="hunt-drawer" aria-label="Navigation" onClick={(event) => { if (event.target === event.currentTarget) drawer.current?.close(); }}>
      <header><button className="hunt-icon-action" title="Close navigation" aria-label="Close navigation" onClick={() => drawer.current?.close()}><Crown size={20} /></button><strong>Businessman</strong><button className="hunt-icon-action" title="Close" aria-label="Close" onClick={() => drawer.current?.close()}><X size={16} /></button></header>
      <nav>{([{ id: "research", label: "Research", icon: Search }, { id: "analysis", label: "Analyse", icon: ChartColumn }, { id: "economics", label: "Economics", icon: Calculator }, { id: "market", label: "Market", icon: MapPinned }, { id: "revenue", label: "Revenue", icon: DollarSign }, { id: "reporting", label: "Validation report", icon: ClipboardList }, { id: "sources", label: "Sources", icon: Files }, { id: "starred", label: "Starred", icon: Star }, { id: "news", label: "News", icon: Newspaper }] as const).map(({ id, label, icon: Icon }) => <button key={id} aria-current={view === id ? "page" : undefined} onClick={() => { setView(id); drawer.current?.close(); }}><Icon size={18} />{label}</button>)}<Link href="/hunt/legacy"><Archive size={18} />Saved dossiers</Link></nav>
      <footer className="hunt-drawer-footer"><button className="hunt-icon-action" title="Settings" aria-label="Settings" onClick={() => { setView("settings"); drawer.current?.close(); }}><Settings size={20} /></button><button className="hunt-icon-action hunt-profile-button" title="Personalisation" aria-label="Personalisation" onClick={() => { setView("profile"); drawer.current?.close(); }}><UserCircle size={24} /></button></footer>
    </dialog>
    <div className="hunt-main">
      <div className="hunt-heading"><h1>{view === "news" ? "News" : view === "revenue" ? "Revenue System" : view === "reporting" ? "Validation report" : view === "sources" ? "Sources" : view === "market" ? "Market" : view === "economics" ? "Economics" : view === "analysis" ? "Analyse" : view === "starred" ? "Saved opportunities" : view === "settings" ? "Research settings" : view === "profile" ? "Your business profile" : "Find a business opportunity"}</h1></div>
      {view !== "news" && view !== "revenue" && view !== "reporting" && error && <div className="hunt-status" role="alert">{error}{error.includes("Sign in") && <> <Link href="/signin-with-chatgpt?return_to=%2Fhunt">Sign in</Link></>}</div>}
      <div hidden={view === "news" || view === "revenue" || view === "reporting"}><SourceDiscovery view={view === "news" || view === "revenue" || view === "reporting" ? "research" : view} initialTopic={researchTopic} onSaved={() => {}} onError={setError} onOpenAnalysis={() => setView("analysis")} onOpenResearch={() => setView("research")} /></div>
      {view === "revenue" && <RevenueSystemWorkbench currency="INR" />}
      {view === "reporting" && <ValidationReport />}
      {view === "sources" && <details className="research-source-library" onToggle={(event) => setShowOfficial(event.currentTarget.open)}><summary>Official source directory</summary>{showOfficial && <OfficialSourceLibrary />}</details>}
      {view === "news" && <NewsFeedPanel onResearch={(topic) => { setResearchTopic(topic); setView("research"); }} onNavigateProfile={() => setView("profile")} />}
    </div>
  </main>;
}
