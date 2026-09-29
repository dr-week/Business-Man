import { ExternalLink, Lightbulb } from "lucide-react";
import { researchFocus, type ResearchFocus, type ResearchFocusSource } from "@/lib/research-focus";
import styles from "./research-focus-card.module.scss";

const countryCodes: Record<string, string> = {
  australia: "AU", canada: "CA", india: "IN", "united kingdom": "GB", uk: "GB", "united states": "US", usa: "US",
};

function trendsUrl(topic: string, geography: string) {
  const country = geography.split(",").at(-1)?.trim().toLowerCase() ?? "";
  const url = new URL("https://trends.google.com/trends/explore");
  url.searchParams.set("q", topic.slice(0, 100));
  if (countryCodes[country]) url.searchParams.set("geo", countryCodes[country]);
  return url.href;
}

export function ResearchFocusCard({ focus, source, topic, geography }: { focus: ResearchFocus; source: ResearchFocusSource; topic: string; geography: string }) {
  const item = researchFocus[focus];
  return <aside className={styles.card} aria-label="Suggested research focus">
    <div className={styles.icon}><Lightbulb size={16} /></div>
    <div className={styles.content}>
      <div className={styles.heading}><strong>Start here: {item.label}</strong><small>{source === "rules" ? "Rule-based suggestion" : "LAYA suggestion · provisional"}</small></div>
      <p>{item.action}</p>
      <a href={trendsUrl(topic, geography)} target="_blank" rel="noreferrer">Check relative search interest in Google Trends <ExternalLink size={12} /></a>
      <small className={styles.limit}>Search interest is a lead only; it does not establish customer demand, sales, or market size.</small>
    </div>
  </aside>;
}
