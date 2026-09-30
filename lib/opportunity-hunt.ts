import type { Economics } from "./economics";

export const LANES = [
  "Workflow failure",
  "New platform",
  "Import gap",
  "Industrial process",
  "Material redesign",
  "Crop systems",
  "Field automation",
  "Supply shock",
  "Vertical operations",
  "Rule change",
  "Market transfer",
] as const;

export type Lane = (typeof LANES)[number];
export type Gate = "Signal" | "Buyer" | "Alternatives" | "Economics" | "Pilot";

export type Lead = {
  id: string;
  title: string;
  lane: Lane;
  failure: string;
  buyer: string;
  trigger: string;
  source: string;
  alternatives: string;
  payment: string;
  nextTest: string;
  createdAt: string;
  economics?: Economics | null;
  decision?: "Investigate" | "Watch" | "Reject";
  validationStatus?: "unverified" | "need_confirmed" | "pilot_offered" | "paid_pilot" | "repeat_purchase" | "stopped";
  validationNote?: string;
  validationSourceUrl?: string;
  validationObservedAt?: string;
  validationPaymentAmount?: number | null;
  validationPaymentCurrency?: string;
};

export type HuntEvidence = {
  id: string;
  leadId: string;
  claim: string;
  sourceTitle: string;
  sourceUrl: string;
  kind: "official" | "buyer" | "field" | "supplier" | "other";
  direction: "supports" | "contradicts" | "context";
  observedAt: string;
};

export function nextGate(lead: Lead): Gate {
  if (!lead.source.trim() || !lead.failure.trim() || lead.source.startsWith("Founder-supplied")) return "Signal";
  if (!lead.buyer.trim()) return "Buyer";
  if (!lead.alternatives.trim() || /unknown|audit needed|map locally|patent clearance needed/i.test(lead.alternatives)) return "Alternatives";
  if (!lead.payment.trim() || lead.payment.trim().toLowerCase() === "unverified") return "Economics";
  return "Pilot";
}

export function missingProof(lead: Lead): string {
  switch (nextGate(lead)) {
    case "Signal": return "Add a traceable signal and the exact failure.";
    case "Buyer": return "Name the person who feels this failure repeatedly.";
    case "Alternatives": return "List what buyers use now, including manual work.";
    case "Economics": return "Record a price test or buyer budget evidence.";
    case "Pilot": return "Run the smallest paid or time-bound pilot.";
  }
}

export const SEED_LEADS: Lead[] = [
  {
    id: "character-continuity",
    title: "Character continuity",
    lane: "Workflow failure",
    failure: "Image prompts lose approved character traits across sessions.",
    buyer: "Creators producing recurring characters",
    trigger: "Repeated context drift in image-generation workflows",
    source: "Founder-observed problem · Prompting Buddha example",
    alternatives: "Manual character sheets and copied prompt blocks; competitor audit needed",
    payment: "Unverified",
    nextTest: "Watch 5 creators repeat the task; ask for a paid pilot.",
    createdAt: "2026-09-23",
  },
  {
    id: "tender-preflight",
    title: "Tender packet preflight",
    lane: "Rule change",
    failure: "Bid files may fail practical upload and packet checks late in submission.",
    buyer: "Frequent Indian government bidders",
    trigger: "eProcurement document-upload guidance",
    source: "https://etenders.gov.in/eprocure/app?component=%24DirectLink&page=FAQFrontEnd&service=direct&sp=S98BwsXvmPN8feTR67SgZyg%3D%3D",
    alternatives: "Tender consultants, PDF tools, manual checklists; audit needed",
    payment: "Unverified",
    nextTest: "Observe 10 bid submissions and log avoidable rework.",
    createdAt: "2026-09-23",
  },
  {
    id: "electronics-fixture",
    title: "Electronics line fixture",
    lane: "Import gap",
    failure: "A specific inspection or calibration step may rely on slow imported equipment.",
    buyer: "Indian electronics component plants",
    trigger: "ECMS capital-equipment segment remains open",
    source: "https://ecms.meity.gov.in/",
    alternatives: "Unknown: collect plant RFQs and supplier quotes",
    payment: "Unverified",
    nextTest: "Interview 5 production engineers; identify one precise part and import quote.",
    createdAt: "2026-09-23",
  },
  {
    id: "tpu-riser",
    title: "Printed suspension riser",
    lane: "Material redesign",
    failure: "A conventional molded part may constrain geometry and vehicle-specific fit.",
    buyer: "Off-road vehicle builders and parts distributors",
    trigger: "Founder-supplied TPU riser case study",
    source: "Founder-supplied case study; design and performance claims unverified",
    alternatives: "Molded plastic, rubber, and metal risers; supplier and patent audit needed",
    payment: "Unverified",
    nextTest: "Obtain the part spec; commission load, fatigue, heat, and fit tests before any vehicle use.",
    createdAt: "2026-09-23",
  },
  {
    id: "goa-mushroom-bottleneck",
    title: "Goa mushroom bottleneck",
    lane: "Crop systems",
    failure: "The real constraint may be reliable spawn, contamination control, or fast local delivery—not cultivation itself.",
    buyer: "Small oyster-mushroom growers in Goa",
    trigger: "Local ICAR cultivation and marketing training",
    source: "https://ccari.res.in/mushroom230126.html",
    alternatives: "Existing spawn suppliers and grower practices; map locally",
    payment: "Unverified",
    nextTest: "Visit 8 growers; measure losses and rank their actual bottlenecks.",
    createdAt: "2026-09-23",
  },
  {
    id: "goa-exotic-fruit",
    title: "Goa exotic-fruit system",
    lane: "Crop systems",
    failure: "A high-value fruit plan may fail on crop-site fit, planting material, seasonality, or routes to buyers.",
    buyer: "Goa growers and premium produce buyers",
    trigger: "Founder-supplied lychee, avocado, and dragon-fruit case study",
    source: "Founder-supplied local observation; crop suitability and demand unverified",
    alternatives: "Existing orchards, nurseries, distributors, and imported fruit; audit needed",
    payment: "Unverified",
    nextTest: "Check site conditions with ICAR-CCARI; quote seedlings and obtain buyer orders per crop.",
    createdAt: "2026-09-23",
  },
  {
    id: "neera-after-tapping",
    title: "Neera collection gap",
    lane: "Field automation",
    failure: "Automating tapping may leave collection hygiene, cooling, monitoring, or servicing unresolved.",
    buyer: "Coconut sap producers and collection cooperatives",
    trigger: "Patented automated tapping systems now exist",
    source: "https://navainnovation.com/",
    alternatives: "Nava SAPER, manual tapping, and existing sap chillers; patent clearance needed",
    payment: "Unverified",
    nextTest: "Interview 5 operators about post-tapping losses and review patent scope before design.",
    createdAt: "2026-09-23",
  },
  {
    id: "trap-replenishment",
    title: "Crop-specific trap service",
    lane: "Field automation",
    failure: "Growers may struggle to choose, place, replace, and interpret pest traps on time.",
    buyer: "Fruit and vegetable growers",
    trigger: "ICAR uses lure traps in integrated pest management",
    source: "https://www.icar.gov.in/en/node/3040",
    alternatives: "Existing trap brands, agronomists, and manual monitoring; audit needed",
    payment: "Unverified",
    nextTest: "Compare one crop's existing trap options; ask 10 growers about replenishment and loss.",
    createdAt: "2026-09-23",
  },
  {
    id: "biogas-maintenance",
    title: "Small biogas upkeep",
    lane: "Supply shock",
    failure: "A biogas installation needs dependable feedstock, safe commissioning, and ongoing maintenance to displace cooking fuel.",
    buyer: "Food-waste generators and small commercial kitchens",
    trigger: "Founder-observed LPG disruption; government biogas programme exists",
    source: "https://mnre.gov.in/en/bio-gas/",
    alternatives: "LPG, approved biogas installers, electric cooking, and solid fuel; compare total cost and safety",
    payment: "Unverified",
    nextTest: "Measure daily feedstock and fuel use at 5 sites; consult qualified installers on safe models.",
    createdAt: "2026-09-23",
  },
  {
    id: "food-outlet-operations",
    title: "Food-outlet exception desk",
    lane: "Vertical operations",
    failure: "A small outlet may track fuel, ingredient cost, stockouts, and margin changes by memory or paper.",
    buyer: "Independent food-outlet owners",
    trigger: "Founder-observed shawarma shop fuel switch",
    source: "Founder-observed local workflow; wider buyer demand unverified",
    alternatives: "Generic CRMs, POS tools, spreadsheets, notebooks; map exact coverage",
    payment: "Unverified",
    nextTest: "Shadow 5 shops; find one costly decision their current POS or CRM does not support.",
    createdAt: "2026-09-23",
  },
];
