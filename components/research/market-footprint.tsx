import { ArrowUpRight, Building2 } from "lucide-react";
import type { CensusMarketSignal } from "@/lib/collectors/census-market";

export function MarketFootprint({ value }: { value: CensusMarketSignal }) {
  const indiaContext = /\bindia\b/i.test(value.geography);
  const indiaSourceUrl = "https://dashboard.msme.gov.in/Udyam_Statewise.aspx";
  const unavailable = {
    not_configured: "U.S. Census key not set",
    unsupported_geography: indiaContext ? "India data not integrated" : "U.S. Census data only",
    unclassified_industry: "Industry not mapped",
    unavailable: "Dataset unavailable",
  } as const;

  return <aside className="market-footprint" aria-label="Business establishment count">
    <header><span><Building2 size={15} /> Business footprint</span><a href={indiaContext && value.status === "unsupported_geography" ? indiaSourceUrl : value.sourceUrl} target="_blank" rel="noreferrer" aria-label={indiaContext && value.status === "unsupported_geography" ? "Open Ministry of MSME Udyam dashboard" : "Open Census source"}><ArrowUpRight size={14} /></a></header>
    {value.status === "available" ? <><strong>{value.establishments == null ? "Not reported" : new Intl.NumberFormat("en-US").format(value.establishments)}</strong><span className="market-footprint-label">employer establishments</span><small>{value.year} · {value.geography} · {value.industry}</small></> : <><strong className="market-footprint-status">{unavailable[value.status]}</strong><small>{value.geography} · {value.industry}</small></>}
    <small className="market-footprint-caveat">{indiaContext && value.status === "unsupported_geography" ? <>Manual source, not an app data feed: <a href={indiaSourceUrl} target="_blank" rel="noreferrer">open the official statewise Udyam dashboard</a>. Registrations (including UAP) show business presence, not market demand.</> : <>U.S. employer locations; {value.geographyLevel === "zip" ? "ZIP counts cover all industries, " : ""}not demand.</>}</small>
  </aside>;
}
