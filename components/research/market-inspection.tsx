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
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    setError("");
    fetch("/api/hunt/market", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
      body: JSON.stringify({ topic: opportunity.name, geography: opportunity.geography, industry: opportunity.category }),
    }).then(async (response) => {
      const data = await response.json().catch(() => null) as (MarketResult & { error?: string }) | null;
      if (!data) throw new Error("Market lookup returned an invalid response.");
      if (!response.ok) throw new Error(data.error || "Market lookup unavailable.");
      if (!controller.signal.aborted) { setResult(data); setError(data.error ?? ""); }
    }).catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Market lookup failed. Retry later."); });
    return () => controller.abort();
  }, [opportunity.id, opportunity.name, opportunity.geography, opportunity.category, attempt]);

  if (!result) return <div className="research-empty" role="status">
    {error ? <><p>{error}</p><button className="research-submit" type="button" onClick={() => setAttempt((value) => value + 1)}>Retry market check</button></> : "Checking local market…"}
  </div>;
  return <>{error && <p role="status">{error}</p>}<MarketPanel opportunity={opportunity} competitors={result.competitors} placesConfigured={result.placesConfigured} footprint={result.footprint} /></>;
}
