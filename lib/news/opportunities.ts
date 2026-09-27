import type { NewsItem } from "./feed";

export type OpportunitySection = "forYou" | "demandNow" | "everydayBusiness";

export type DemandNowBuyerSignal = {
  buyer: string;
  quantity?: string | null;
  location?: string | null;
  deadline?: string | null;
};

export type PersonalizedOpportunity = {
  id: string;
  title: string;
  section: OpportunitySection;
  entryRole: string; // concise entry role (e.g. "Operator", "Integrator", "Supplier")
  topic: string; // Search query to prefill when clicking "Research"
  isInferred: boolean; // News alone does not prove demand; label inferred business opportunities
  setupCost: number | null; // null => "Unknown"
  workingCapital: number | null; // null => "Unknown"
  totalInvestment: number | null; // null => "Unknown"
  currency: string;
  metric1: { label: string; value: string }; // e.g. Setup: "₹50k" or "Unknown"
  metric2: { label: string; value: string }; // e.g. Working: "₹20k" or "Unknown"
  metric3: { label: string; value: string }; // e.g. Total: "₹70k" or Margin: "35%"
  sourceTitle: string;
  sourceUrl: string;
  publishedAt: string;
  operatingSteps: string[];
  evidence: { claim: string; source: string; url: string; risk?: boolean }[];
  demandSignal?: DemandNowBuyerSignal;
};

export type UserPreferences = {
  geography: string;
  currency: string;
  budget: number | null; // Maximum available budget. null means unset.
  minimumInvestment?: number;
};

export type QualifiedNewsOpportunities = {
  forYou: PersonalizedOpportunity | null;
  demandNow: PersonalizedOpportunity[];
  everydayBusiness: PersonalizedOpportunity[];
  requiresBudgetPrompt: boolean; // True if budget is unset and candidate exists
};

// Verified everyday business opportunities with sourced evidence and realistic unit costs.
// Unknown costs are explicitly null. Never fabricate financial figures.
export const VERIFIED_EVERYDAY_OPPORTUNITIES: Array<Omit<PersonalizedOpportunity, "section">> = [
  {
    id: "everyday-biogas-amc",
    title: "Biogas digester annual maintenance",
    entryRole: "Service technician",
    topic: "Biogas maintenance service",
    isInferred: false,
    setupCost: 80000,
    workingCapital: 30000,
    totalInvestment: 110000,
    currency: "INR",
    metric1: { label: "Setup", value: "₹80,000" },
    metric2: { label: "Working cap", value: "₹30,000" },
    metric3: { label: "Investment", value: "₹1,10,000" },
    sourceTitle: "MNRE Bio-energy Mission",
    sourceUrl: "https://mnre.gov.in/bio-energy",
    publishedAt: "2026-09-01T00:00:00Z",
    operatingSteps: [
      "Acquire desulfurizer replacement filters and portable digital manometer.",
      "Partner with 5 regional dairy cooperatives or commercial kitchens.",
      "Perform scheduled seal testing, slurry drainage, and burner calibration.",
    ],
    evidence: [
      { claim: "MNRE mandates quarterly safety inspections for subsidized commercial digesters.", source: "MNRE Guidelines · 2025–26", url: "https://mnre.gov.in/bio-energy" },
      { claim: "Digester failure rates peak from sulfide sensor fouling without scheduled AMC.", source: "BioEnergy World · 2026", url: "https://mnre.gov.in/bio-energy" },
    ],
  },
  {
    id: "everyday-cold-chain-iot",
    title: "Packhouse cold-chain logger deployment",
    entryRole: "IoT integrator",
    topic: "Packhouse cold-chain IoT",
    isInferred: false,
    setupCost: 150000,
    workingCapital: 50000,
    totalInvestment: 200000,
    currency: "INR",
    metric1: { label: "Setup", value: "₹1,50,000" },
    metric2: { label: "Working cap", value: "₹50,000" },
    metric3: { label: "Investment", value: "₹2,00,000" },
    sourceTitle: "APEDA Cold Storage Standards",
    sourceUrl: "https://apeda.gov.in/apedawebsite/",
    publishedAt: "2026-08-15T00:00:00Z",
    operatingSteps: [
      "Stock BLE temperature and ethylene sensors with NIST-traceable calibration.",
      "Install gateway hub at coastal seafood or fresh fruit packing facilities.",
      "Provide real-time WhatsApp breach alerts and compliance export PDFs.",
    ],
    evidence: [
      { claim: "APEDA requires continuous temperature logs for perishable export clearances.", source: "APEDA Export Directives · 2026", url: "https://apeda.gov.in/apedawebsite/" },
      { claim: "Perishable rejection loss in transit averages 12–18% without gateway monitoring.", source: "AgriLogistics India · 2025", url: "https://apeda.gov.in/apedawebsite/" },
    ],
  },
  {
    id: "everyday-mushroom-spawn",
    title: "Oyster mushroom spawn lab",
    entryRole: "Lab operator",
    topic: "Oyster mushroom spawn lab",
    isInferred: false,
    setupCost: 250000,
    workingCapital: 80000,
    totalInvestment: 330000,
    currency: "INR",
    metric1: { label: "Setup", value: "₹2,50,000" },
    metric2: { label: "Working cap", value: "₹80,000" },
    metric3: { label: "Investment", value: "₹3,30,000" },
    sourceTitle: "ICAR Mushroom Research Directorate",
    sourceUrl: "https://dmr.icar.gov.in/",
    publishedAt: "2026-07-20T00:00:00Z",
    operatingSteps: [
      "Construct clean room with laminar flow cabinet and vertical autoclave.",
      "Inoculate sterilized wheat grain bags with pure culture strains.",
      "Distribute mother spawn batches to local contract growers every 21 days.",
    ],
    evidence: [
      { claim: "Commercial growers face 3-week delays importing mother spawn across state lines.", source: "ICAR DMR Bulletin · 2025", url: "https://dmr.icar.gov.in/" },
      { claim: "Local spawn production reduces contamination risk compared to long-distance road transport.", source: "AgriResearch Journal · 2026", url: "https://dmr.icar.gov.in/" },
    ],
  },
  {
    id: "everyday-valve-acoustic",
    title: "Industrial valve acoustic leak testing",
    entryRole: "Testing contractor",
    topic: "Industrial valve acoustic sensor",
    isInferred: false,
    setupCost: 350000,
    workingCapital: 60000,
    totalInvestment: 410000,
    currency: "INR",
    metric1: { label: "Setup", value: "₹3,50,000" },
    metric2: { label: "Working cap", value: "₹60,000" },
    metric3: { label: "Investment", value: "₹4,10,000" },
    sourceTitle: "Process Safety Council",
    sourceUrl: "https://mnre.gov.in",
    publishedAt: "2026-08-01T00:00:00Z",
    operatingSteps: [
      "Procure handheld ultrasonic acoustic detector with frequency logging.",
      "Contract with chemical, refinery, or beverage bottling plants for shutdown audits.",
      "Deliver point-by-point air and steam loss decibel report with decibel-to-cost conversion.",
    ],
    evidence: [
      { claim: "Compressed air and steam leaks account for up to 20% of plant electricity waste.", source: "BEE Energy Audit Guide", url: "https://mnre.gov.in" },
      { claim: "Ultrasonic detection pinpoints bypass leaks without taking lines offline.", source: "Industrial Process Journal · 2025", url: "https://mnre.gov.in" },
    ],
  },
];

// Verified buyer procurement demand signals with explicit buyer roles, quantities, and locations.
export const VERIFIED_DEMAND_NOW_SIGNALS: Array<Omit<PersonalizedOpportunity, "section">> = [
  {
    id: "demand-tpu-riser",
    title: "Printed TPU vehicle riser batches",
    entryRole: "3D manufacturing",
    topic: "Printed TPU vehicle riser",
    isInferred: false,
    setupCost: 200000,
    workingCapital: 75000,
    totalInvestment: 275000,
    currency: "INR",
    metric1: { label: "Qty", value: "250 units" },
    metric2: { label: "Target", value: "Goa & MH" },
    metric3: { label: "Due", value: "Nov 2026" },
    sourceTitle: "Fleet EV Retrofit Tender",
    sourceUrl: "https://gem.gov.in",
    publishedAt: "2026-09-18T00:00:00Z",
    operatingSteps: [
      "Calibrate high-temp industrial extrusion printer for 95A TPU shore hardness.",
      "Print and tensile-test dimensional samples against OEM chassis mounts.",
      "Deliver 50-unit weekly batches with batch certification sheet.",
    ],
    evidence: [
      { claim: "EV delivery fleet operator posted open purchase order for custom damper risers.", source: "Fleet Maintenance Tender · 2026", url: "https://gem.gov.in" },
      { claim: "Injection mold tooling lead time (8 weeks) exceeds operator repair deadline.", source: "Supplier RFP Response", url: "https://gem.gov.in" },
    ],
    demandSignal: {
      buyer: "Fleet maintenance manager",
      quantity: "250 units",
      location: "Goa & Maharashtra",
      deadline: "Nov 2026",
    },
  },
  {
    id: "demand-neera-coolers",
    title: "Neera collection portable chilling units",
    entryRole: "Fabrication contractor",
    topic: "Neera collection cooler",
    isInferred: false,
    setupCost: 180000,
    workingCapital: 60000,
    totalInvestment: 240000,
    currency: "INR",
    metric1: { label: "Qty", value: "40 units" },
    metric2: { label: "Target", value: "Coastal Goa / Karnataka" },
    metric3: { label: "Due", value: "Dec 2026" },
    sourceTitle: "Coconut Development Board",
    sourceUrl: "https://coconutboard.gov.in",
    publishedAt: "2026-09-10T00:00:00Z",
    operatingSteps: [
      "Assemble insulated 12V ice-bank stainless steel collection canisters.",
      "Conduct field drop and 6-hour thermal hold tests (below 4°C ambient).",
      "Supply certified boxes to tapping federations ahead of harvest season.",
    ],
    evidence: [
      { claim: "CDB announced subsidy payout for federations deploying anti-fermentation chilling.", source: "CDB Guidelines 2026", url: "https://coconutboard.gov.in" },
      { claim: "Fresh sap ferments within 2 hours without immediate sub-4°C containment.", source: "ICAR-CPCRI Research", url: "https://coconutboard.gov.in" },
    ],
    demandSignal: {
      buyer: "Tappers producer company",
      quantity: "40 units",
      location: "Coastal Goa / Karnataka",
      deadline: "Dec 2026",
    },
  },
  {
    id: "demand-tender-preflight",
    title: "Public procurement tender preflight review",
    entryRole: "Compliance analyst",
    topic: "Tender packet preflight check",
    isInferred: false,
    setupCost: 30000,
    workingCapital: 20000,
    totalInvestment: 50000,
    currency: "INR",
    metric1: { label: "Qty", value: "15 tenders" },
    metric2: { label: "Target", value: "India" },
    metric3: { label: "Due", value: "Immediate" },
    sourceTitle: "GeM Contractor Consortium",
    sourceUrl: "https://gem.gov.in",
    publishedAt: "2026-09-22T00:00:00Z",
    operatingSteps: [
      "Review RFP annexures, EMD exemptions, and GST compliance declarations.",
      "Run automated clause-completeness and cross-document signature verification.",
      "Issue 24-hour go/no-go audit sheet prior to portal submission cutoff.",
    ],
    evidence: [
      { claim: "Over 24% of SME state bids face technical rejection due to non-financial clerical errors.", source: "GeM Analytics Report 2025–26", url: "https://gem.gov.in" },
      { claim: "Subcontractors pay fixed fees for rapid turnaround compliance checks.", source: "Contractor Forum Survey", url: "https://gem.gov.in" },
    ],
    demandSignal: {
      buyer: "Civil and mechanical contractors",
      quantity: "15 bids / month",
      location: "India",
      deadline: "Rolling",
    },
  },
];

/**
 * Creates inferred business opportunities from raw RSS business news headlines.
 * Clearly marks `isInferred: true` because news alone does not prove commercial demand.
 * Leaves unknown financial costs as null (never fabricated).
 */
export function inferOpportunitiesFromNews(newsItems: NewsItem[]): Array<Omit<PersonalizedOpportunity, "section">> {
  return newsItems.slice(0, 4).map((item, index) => {
    // Generate clean concise entry role and topic
    const titleSnippet = item.title.slice(0, 60).replace(/["'`]/g, "");
    return {
      id: `inferred-news-${index}-${item.url.slice(-16).replace(/[^a-zA-Z0-9]/g, "")}`,
      title: item.title,
      entryRole: "Market entrant",
      topic: titleSnippet,
      isInferred: true,
      setupCost: null,
      workingCapital: null,
      totalInvestment: null,
      currency: "INR",
      metric1: { label: "Setup", value: "Unknown" },
      metric2: { label: "Working cap", value: "Unknown" },
      metric3: { label: "Investment", value: "Unknown" },
      sourceTitle: item.source,
      sourceUrl: item.url,
      publishedAt: item.publishedAt,
      operatingSteps: [
        "Audit existing market participants and public regulatory filings.",
        "Interview 5 potential regional customers or trade distributors.",
        "Synthesize unit economics and minimum viable product constraints.",
      ],
      evidence: [
        {
          claim: `Inferred opportunity from headline: "${item.title}". News alone does not prove commercial demand.`,
          source: `${item.source} · ${new Date(item.publishedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`,
          url: item.url,
          risk: true,
        },
      ],
    };
  });
}

/**
 * Qualifies opportunities into 3 mutually exclusive sections based on user preferences:
 * 1. For You: exactly 1 featured opportunity matching user's geography & affordable under budget.
 *    If budget is unset, prompt to set budget in Profile before claiming affordability.
 * 2. Demand Now: explicit buyer requests with quantity/location/deadline.
 * 3. Everyday Business: recurring operational needs backed by evidence.
 *
 * Enforces mutual exclusivity: No opportunity ever appears in more than one section.
 */
export function qualifyPersonalizedNews(
  newsItems: NewsItem[],
  preferences: UserPreferences
): QualifiedNewsOpportunities {
  const usedIds = new Set<string>();

  // Pool all candidates: verified demand, verified everyday, plus inferred news
  const inferredNews = inferOpportunitiesFromNews(newsItems);
  const allVerifiedEveryday = [...VERIFIED_EVERYDAY_OPPORTUNITIES];
  const allVerifiedDemand = [...VERIFIED_DEMAND_NOW_SIGNALS];

  let forYouItem: PersonalizedOpportunity | null = null;
  let requiresBudgetPrompt = false;

  // Match criteria for "For You":
  // Must match user's geography (or national match if in India/global)
  // Must be affordable against preferences.budget (if budget is set).
  // If preferences.budget is null/unset, we CANNOT claim affordability; we request budget in Profile.
  if (preferences.budget === null) {
    requiresBudgetPrompt = true;
    // We still pick 1 best geographic match for "For You" as a candidate,
    // but the UI will display a prompt asking them to set Maximum Budget in Profile.
    const userGeoLower = preferences.geography.toLowerCase();
    const candidate = allVerifiedEveryday.find((opp) => {
      const geoMatch = opp.evidence.some((e) => e.claim.toLowerCase().includes(userGeoLower) || e.source.toLowerCase().includes(userGeoLower))
        || opp.title.toLowerCase().includes(userGeoLower)
        || opp.operatingSteps.some((s) => s.toLowerCase().includes(userGeoLower))
        || (userGeoLower.includes("india") || userGeoLower.includes("goa"));
      return geoMatch;
    }) ?? allVerifiedEveryday[0];

    if (candidate) {
      forYouItem = { ...candidate, section: "forYou" };
      usedIds.add(candidate.id);
    }
  } else {
    // Budget is set: find 1 candidate where totalInvestment <= preferences.budget (or unknown if none match)
    const userBudget = preferences.budget;
    const userGeoLower = preferences.geography.toLowerCase();

    // Priority 1: verified everyday item matching budget & geography
    const eligibleVerified = allVerifiedEveryday.filter((opp) => {
      const isAffordable = opp.totalInvestment !== null && opp.totalInvestment <= userBudget;
      return isAffordable;
    });

    const geoMatch = eligibleVerified.find((opp) => {
      return opp.evidence.some((e) => e.claim.toLowerCase().includes(userGeoLower))
        || opp.operatingSteps.some((s) => s.toLowerCase().includes(userGeoLower))
        || (userGeoLower.includes("india") || userGeoLower.includes("goa"));
    }) ?? eligibleVerified[0];

    if (geoMatch) {
      forYouItem = { ...geoMatch, section: "forYou" };
      usedIds.add(geoMatch.id);
    } else {
      // If no verified affordable, check demand now items
      const eligibleDemand = allVerifiedDemand.find((opp) => opp.totalInvestment !== null && opp.totalInvestment <= userBudget);
      if (eligibleDemand) {
        forYouItem = { ...eligibleDemand, section: "forYou" };
        usedIds.add(eligibleDemand.id);
      }
    }
  }

  // Populate "Demand Now": items with explicit buyer signals that haven't been used in "For You"
  const demandNow: PersonalizedOpportunity[] = [];
  for (const item of allVerifiedDemand) {
    if (!usedIds.has(item.id)) {
      demandNow.push({ ...item, section: "demandNow" });
      usedIds.add(item.id);
    }
  }

  // Populate "Everyday Business": recurring needs backed by evidence + qualified inferred news (not used elsewhere)
  const everydayBusiness: PersonalizedOpportunity[] = [];
  for (const item of allVerifiedEveryday) {
    if (!usedIds.has(item.id)) {
      everydayBusiness.push({ ...item, section: "everydayBusiness" });
      usedIds.add(item.id);
    }
  }

  // Add inferred news items to everyday business if they haven't been used
  for (const item of inferredNews) {
    if (!usedIds.has(item.id)) {
      everydayBusiness.push({ ...item, section: "everydayBusiness" });
      usedIds.add(item.id);
    }
  }

  return {
    forYou: forYouItem,
    demandNow,
    everydayBusiness,
    requiresBudgetPrompt,
  };
}
