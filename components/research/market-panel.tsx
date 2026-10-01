import type { ResearchOpportunity } from "@/lib/research-engine";
import type { LocalCompetitor } from "@/lib/collectors/places";
import type { CensusMarketSignal } from "@/lib/collectors/census-market";
import { MarketFootprint } from "./market-footprint";
import { IndiaMarketContext } from "./india-market-context";
import { MarketSoftwareComparison } from "./market-software-comparison";

const priceLabels = {
  PRICE_LEVEL_UNSPECIFIED: "Price unavailable",
  PRICE_LEVEL_FREE: "Free",
  PRICE_LEVEL_INEXPENSIVE: "Inexpensive",
  PRICE_LEVEL_MODERATE: "Moderate",
  PRICE_LEVEL_EXPENSIVE: "Expensive",
  PRICE_LEVEL_VERY_EXPENSIVE: "Very expensive",
} as const;
const statusLabels = {
  BUSINESS_STATUS_UNSPECIFIED: "Status unavailable",
  OPERATIONAL: "Operational",
  CLOSED_TEMPORARILY: "Temporarily closed",
  CLOSED_PERMANENTLY: "Permanently closed",
  FUTURE_OPENING: "Future opening",
} as const;

export function MarketPanel({ opportunity, competitors, placesConfigured, footprint }: {
  opportunity: ResearchOpportunity;
  competitors: LocalCompetitor[];
  placesConfigured: boolean;
  footprint: CensusMarketSignal | null;
}) {
  return <div className="research-detail-modules">
    <section className="research-detail-card research-local-competition" aria-label="Local competitors">
      <h3>{competitors.length} place candidates</h3>
      {competitors.length ? <><ul>{competitors.map((place) => <li key={place.id}>
        <div><strong>{place.name}</strong><small>{place.category} · {place.address}</small>{place.priceLevel && <small>Google price level · {priceLabels[place.priceLevel]}</small>}</div>
        <span>{place.businessStatus ? statusLabels[place.businessStatus] : "Status unavailable"} · {place.rating == null ? "No rating" : `${place.rating.toFixed(1)} ★ (${place.ratingCount ?? 0})`}</span>
        {place.mapUrl && <a href={place.mapUrl} target="_blank" rel="noopener noreferrer" title={`Open ${place.name} on Google Maps`}>Map</a>}
      </li>)}</ul><small translate="no">Google Maps · candidate listings, not a market census</small></> :
        <p>{placesConfigured ? "No matching listings returned." : "Google Places is not configured."}</p>}
      {footprint && <MarketFootprint value={footprint} />}
    </section>
    {/\bindia\b/i.test(opportunity.geography) && <IndiaMarketContext />}
    <MarketSoftwareComparison />
    <section className="research-detail-card"><h3>Alternatives</h3><dl>
      <dt>Current</dt><dd>{opportunity.alternatives.length ? opportunity.alternatives.join(", ") : "Unknown"}</dd>
      <dt>Gap</dt><dd>{opportunity.gap ?? "Unknown"}</dd>
      <dt>Possible software alternatives (GitHub)</dt><dd>{opportunity.candidateAlternatives?.length ? <ul>{opportunity.candidateAlternatives.map((candidate) => <li key={candidate.url}>
        <a href={candidate.url} target="_blank" rel="noopener noreferrer">{candidate.name}</a> · {candidate.stars.toLocaleString()} stars · {candidate.license ?? "License not detected"}<br />
        <small>{candidate.matchedTerms?.length ? `Matched: ${candidate.matchedTerms.join(", ")} · ${candidate.relevance}% text overlap · ` : ""}Last code push {candidate.pushedAt.slice(0, 10)}</small>
      </li>)}</ul> : "No candidates found"}</dd>
    </dl><small>Listings and stars do not measure buyer demand.</small></section>
  </div>;
}
