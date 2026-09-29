export const sourceCategories = ["All", "Funding", "Buyers", "Challenges", "Markets", "Technical"] as const;
export type SourceCategory = (typeof sourceCategories)[number];

export const officialSources: {
  name: string;
  category: Exclude<SourceCategory, "All">;
  url: string;
  signal: string;
  limit: string;
}[] = [
  { name: "Startup India", category: "Funding", url: "https://www.startupindia.gov.in/content/sih/en/government-schemes.html", signal: "Schemes · eligibility", limit: "Verify with scheme owner" },
  { name: "myScheme", category: "Funding", url: "https://www.myscheme.gov.in/", signal: "Benefits · eligibility", limit: "Not proof of approval" },
  { name: "CPPP tenders", category: "Buyers", url: "https://eprocure.gov.in/eprocure/app", signal: "Public purchase notices", limit: "Tender ≠ awarded sale" },
  { name: "GeM", category: "Buyers", url: "https://gem.gov.in/", signal: "Government buying", limit: "Check seller requirements" },
  { name: "Startup India challenges", category: "Challenges", url: "https://www.startupindia.gov.in/content/sih/en/ams-application/application-listing.html", signal: "Problem · deadline · incentive", limit: "Prize ≠ paid demand" },
  { name: "Open Government Data", category: "Markets", url: "https://data.gov.in/", signal: "Official datasets · APIs", limit: "API availability and freshness vary by dataset" },
  { name: "India TradeStat", category: "Markets", url: "https://tradestat.commerce.gov.in/meidb/commodity_wise_all_countries_import", signal: "Imports · commodities", limit: "Import value ≠ local gap" },
  { name: "PMEGP models", category: "Technical", url: "https://www.kviconline.gov.in/pmegp/pmegpweb/docs/jsp/newprojectReports.jsp", signal: "Project profiles · costs", limit: "Estimates need local quotes" },
  { name: "ICAR–CCARI Goa", category: "Technical", url: "https://ccari.res.in/", signal: "Local agriculture research", limit: "Research ≠ market demand" },
  { name: "MNRE biogas", category: "Technical", url: "https://mnre.gov.in/en/bio-gas/", signal: "Technology · programmes", limit: "Check current policy" },
];

export function filterOfficialSources(category: SourceCategory, query: string) {
  const term = query.trim().toLowerCase();
  return officialSources.filter((source) =>
    (category === "All" || source.category === category) &&
    `${source.name} ${source.signal} ${source.limit}`.toLowerCase().includes(term));
}
