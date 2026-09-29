"use client";

import { useEffect, useState } from "react";
import type { ResearchOpportunity } from "@/lib/research-engine";
import type { LocalCompetitor } from "@/lib/collectors/places";
import type { CensusMarketSignal } from "@/lib/collectors/census-market";
import { MarketPanel } from "./market-panel";

type MarketResult = { competitors: LocalCompetitor[]; placesConfigured: boolean; footprint: CensusMarketSignal | null; error: string | null };

export function MarketInspection({ opportunity }: { opportunity: ResearchOpportunity }) {
  const [result, setResult] = useState<MarketResult | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/hunt/market", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
      body: JSON.stringify({ topic: opportunity.name, geography: opportunity.geography, industry: opportunity.category }),
    }).then(async (response) => {
      const data = await response.json() as MarketResult & { error?: string };
      if (!response.ok) throw new Error(data.error || "Market lookup unavailable.");
      if (!controller.signal.aborted) { setResult(data); setError(data.error ?? ""); }
    }).catch((cause) => { if (!controller.signal.aborted) setError((cause as Error).message); });
    return () => controller.abort();
  }, [opportunity.id, opportunity.name, opportunity.geography, opportunity.category]);

  if (!result) return <p className="research-empty" role="status">{error || "Checking local market…"}</p>;
  return <>{error && <p role="status">{error}</p>}<MarketPanel opportunity={opportunity} competitors={result.competitors} placesConfigured={result.placesConfigured} footprint={result.footprint} /></>;
}
