"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
const NewsFeedPanel = dynamic(() => import("@/components/news-feed").then((module) => module.NewsFeedPanel));
import { Archive, Crown, Search, Star, Settings, UserCircle, Newspaper, X } from "lucide-react";
import { SourceDiscovery } from "@/components/source-discovery";
import "./hunt.css";

export default function HuntPage() {
  const drawer = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<"research" | "starred" | "settings" | "profile" | "news">("research");
  const [researchTopic, setResearchTopic] = useState("");
  const [error, setError] = useState("");
  return <main className="hunt-page">
    <header className="hunt-app-header">
      <div className="hunt-brand"><button className="hunt-icon-action" title="Open navigation" aria-label="Open navigation" aria-haspopup="dialog" onClick={() => drawer.current?.showModal()}><Crown size={20} /></button><strong>Businessman</strong></div>
    </header>
    <dialog ref={drawer} className="hunt-drawer" aria-label="Navigation" onClick={(event) => { if (event.target === event.currentTarget) drawer.current?.close(); }}>
      <header><button className="hunt-icon-action" title="Close navigation" aria-label="Close navigation" onClick={() => drawer.current?.close()}><Crown size={20} /></button><strong>Businessman</strong><button className="hunt-icon-action" title="Close" aria-label="Close" onClick={() => drawer.current?.close()}><X size={16} /></button></header>
      <nav>{([{ id: "research", label: "Research", icon: Search }, { id: "starred", label: "Starred", icon: Star }, { id: "news", label: "News", icon: Newspaper }] as const).map(({ id, label, icon: Icon }) => <button key={id} aria-current={view === id ? "page" : undefined} onClick={() => { setView(id); drawer.current?.close(); }}><Icon size={18} />{label}</button>)}<Link href="/hunt/legacy"><Archive size={18} />Saved dossiers</Link></nav>
      <footer className="hunt-drawer-footer"><button className="hunt-icon-action" title="Settings" aria-label="Settings" onClick={() => { setView("settings"); drawer.current?.close(); }}><Settings size={20} /></button><button className="hunt-icon-action hunt-profile-button" title="Personalisation" aria-label="Personalisation" onClick={() => { setView("profile"); drawer.current?.close(); }}><UserCircle size={24} /></button></footer>
    </dialog>
    <div className="hunt-main">
      <div className="hunt-heading"><h1>{view === "news" ? "News" : view === "starred" ? "Starred" : view === "settings" ? "Settings" : view === "profile" ? "Personalisation" : "Research"}</h1></div>
      {view !== "news" && error && <div className="hunt-status" role="alert">{error}{error.includes("Sign in") && <> <Link href="/signin-with-chatgpt?return_to=%2Fhunt">Sign in</Link></>}</div>}
      <div hidden={view === "news"}><SourceDiscovery view={view === "news" ? "research" : view} initialTopic={researchTopic} onSaved={() => {}} onError={setError} /></div>
      {view === "news" && <NewsFeedPanel onResearch={(topic) => { setResearchTopic(topic); setView("research"); }} onNavigateProfile={() => setView("profile")} />}
    </div>
  </main>;
}
