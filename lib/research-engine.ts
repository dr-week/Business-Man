import { z } from "zod";
import type { SourceSignal } from "./discovery";
import { classifyIndustry, matchesIndustry } from "./industry-classifier";
import { investmentRisks } from "./investment-risks";
import type { CandidateAlternative } from "./collectors/github-alternatives";
import { extractClaims } from "./claim-extraction";
import { groupSources } from "./source-grouping";
import { independentClaimCount, independentSourceCount } from "./evidence-lineage";
export { groupSources } from "./source-grouping";

export const researchInput = z.object({
  topic: z.string().trim().min(2).max(1000),
  useOriginalQuery: z.boolean().optional(),
  sourceUrls: z.array(z.string().url().max(2000).refine((url) => new URL(url).protocol === "https:")).max(3).optional(),
  geography: z.string().trim().min(2).max(100),
  budget: z.number().finite().nonnegative().max(1_000_000_000).nullable(),
  minimumInvestment: z.number().finite().nonnegative().max(1_000_000_000).optional(),
  currency: z.string().regex(/^[A-Z]{3}$/).default("INR"),
  industry: z.string().trim().max(80).optional(),
  businessModel: z.string().trim().max(80).optional(),
  customer: z.string().trim().max(80).optional(),
  driver: z.string().trim().max(80).optional(),
}).strict().refine((value) => value.budget == null || (value.minimumInvestment ?? 0) <= value.budget, { message: "Minimum investment exceeds maximum budget", path: ["budget"] });
export type ResearchInput = z.infer<typeof researchInput>;
export type Provenance = "Sourced" | "Estimated" | "User-entered" | "Missing";
export type Claim = { id: string; text: string; direction: "supports" | "contradicts" | "context"; factor?: FactorName; basis?: string; sourceIds: string[]; publishedAt: string | null };
export type Assumption = { value: number | null; unit: string; provenance: Provenance; sourceIds: string[]; date: string | null; geography: string; note: string };
export const factorWeights = { "Paid demand": 25, "Severity and frequency": 20, "Alternative gap": 20, "Financial viability": 20, "Budget and location": 15 } as const;
export type FactorName = keyof typeof factorWeights;
export type Factor = { name: FactorName; weight: number; score: number | null; evidenceIds: string[]; rule: string };
export type FinancialAssumptions = {
  unit: string; currency: string; geography: string;
  price: Assumption; variableCost: Assumption; fixedCost: Assumption;
  setupCost: Assumption; equipmentCost: Assumption; openingInventory: Assumption; reserve: Assumption;
  lowVolume: Assumption; baseVolume: Assumption; highVolume: Assumption;
};
export type Scenario = { name: "Low" | "Base" | "High"; units: number; revenue: number; variableCosts: number; fixedCosts: number; profit: number; margin: number | null };
export type FinancialResult = { contribution: number; funding: number; breakEven: number | null; paybackMonth: number | null; scenarios: Scenario[]; cashFlow: { month: number; cumulative: number }[] };
export type ResearchOpportunity = {
  id: string; name: string; category: string; geography: string; buyer: string | null; problem: string;
  offering: string | null; alternatives: string[]; gap: string | null; risks: string[];
  candidateAlternatives?: CandidateAlternative[];
  sources: SourceSignal[]; claims: Claim[]; assumptions: FinancialAssumptions;
  factors: Factor[]; strength: number | null; confidence: "Low" | "Medium" | "High";
  financials: FinancialResult | null; missing: string[];
};

const missing = (unit: string, geography: string): Assumption => ({ value: null, unit, provenance: "Missing", sourceIds: [], date: null, geography, note: "" });
export function blankFinancials(input: ResearchInput): FinancialAssumptions {
  const amount = input.currency;
  return {
    unit: "customer", currency: input.currency, geography: input.geography,
    price: missing(amount + " / customer", input.geography), variableCost: missing(amount + " / customer", input.geography),
    fixedCost: missing(amount + " / month", input.geography), setupCost: missing(amount, input.geography), equipmentCost: missing(amount, input.geography),
    openingInventory: missing(amount, input.geography), reserve: missing(amount, input.geography),
    lowVolume: missing("customers / month", input.geography), baseVolume: missing("customers / month", input.geography), highVolume: missing("customers / month", input.geography),
  };
}
export function calculateFinancials(a: FinancialAssumptions): FinancialResult | null {
  const keys = ["price", "variableCost", "fixedCost", "setupCost", "equipmentCost", "openingInventory", "reserve", "lowVolume", "baseVolume", "highVolume"] as const;
  if (keys.some((key) => a[key].value === null)) return null;
  if (keys.some((key) => !a[key].date || a[key].provenance === "Missing")) return null;
  if (keys.some((key) => a[key].provenance === "Estimated" && !a[key].note.trim())) return null;
  if (keys.some((key) => a[key].provenance === "Sourced" && !a[key].sourceIds.length)) return null;
  const n = (key: typeof keys[number]) => a[key].value as number;
  if (keys.some((key) => !Number.isFinite(n(key)) || n(key) < 0)) return null;
  if (["lowVolume", "baseVolume", "highVolume"].some((key) => !Number.isInteger(n(key as typeof keys[number])))) return null;
  if (n("lowVolume") > n("baseVolume") || n("baseVolume") > n("highVolume")) return null;
  const contribution = n("price") - n("variableCost");
  const funding = n("setupCost") + n("equipmentCost") + n("openingInventory") + n("reserve");
  const scenarios = (["Low", "Base", "High"] as const).map((name, i) => {
    const units = n((["lowVolume", "baseVolume", "highVolume"] as const)[i]);
    const revenue = n("price") * units, variableCosts = n("variableCost") * units, fixedCosts = n("fixedCost");
    const profit = revenue - variableCosts - fixedCosts;
    return { name, units, revenue, variableCosts, fixedCosts, profit, margin: revenue ? 100 * profit / revenue : null };
  });
  const paybackMonth = scenarios[1].profit > 0 ? Math.max(1, Math.ceil(funding / scenarios[1].profit)) : null;
  const cashFlow = [{ month: 0, cumulative: -funding }];
  for (let month = 1; month <= Math.max(12, Math.min(paybackMonth ?? 36, 60)); month++) cashFlow.push({ month, cumulative: -funding + month * scenarios[1].profit });
  return { contribution, funding, breakEven: contribution > 0 ? Math.ceil(n("fixedCost") / contribution) : null, paybackMonth, scenarios, cashFlow };
}

function clean(value: string) { return value.replace(/^(ask hn|show hn|how do i|anyone else)[:?\s-]*/i, "").trim(); }
function confidence(sources: SourceSignal[], claims: Claim[]): "Low" | "Medium" | "High" {
  if (claims.some((claim) => claim.direction === "contradicts")) return "Low";
  const providers = new Set(sources.map((item) => item.provider));
  const recent = sources.some((item) => Date.now() - Date.parse(item.publishedAt) < 2 * 365 * 86400000);
  const independent = independentSourceCount(sources);
  if (independent >= 3 && recent && sources.some((item) => item.kind === "official") && sources.some((item) => item.kind === "buyer")) return "High";
  return providers.size >= 2 && independent >= 3 && recent ? "Medium" : "Low";
}
function factors(claims: Claim[], sources: SourceSignal[], financials: FinancialResult | null, budget: number | null, geography: string): Factor[] {
  const requestedPlace = geography.split(",")[0].trim().toLowerCase();
  return (Object.keys(factorWeights) as FactorName[]).map((name) => {
    const matching = claims.filter((claim) => claim.direction === "supports" && claim.factor === name);
    const local = sources.filter((source) => source.locality?.place.split(",")[0].trim().toLowerCase() === requestedPlace);
    const count = independentClaimCount(matching, sources);
    const score = name === "Financial viability" ? financials ? financials.scenarios[1].profit <= 0 ? 0 : financials.scenarios[0].profit > 0 ? 10 : 5 : null
      : name === "Budget and location" ? budget == null ? null : financials?.funding != null && financials.funding > budget ? 0 : financials && local.some((source) => source.locality?.basis === "verified" && (source.kind === "official" || source.kind === "buyer")) ? 10 : financials && local.length ? 5 : null
      : count ? Math.min(10, count * 5) : null;
    return { name, weight: factorWeights[name], score, evidenceIds: matching.map((claim) => claim.id),
      rule: name === "Financial viability" ? "0: base loss; 5: base profit; 10: low and base profit." : name === "Budget and location" ? "0: funding over budget; 5: source-stated locality plus funding in budget; 10 requires verified local buyer or official evidence." : "5: one explicit independent first-person source; 10: at least two. Missing evidence stays unknown." };
  });
}
export function recalculateOpportunity(item: ResearchOpportunity, budget: number | null): ResearchOpportunity {
  const financials = calculateFinancials(item.assumptions);
  const ranked = factors(item.claims, item.sources, financials, budget, item.geography);
  const strength = ranked.every((factor) => factor.score !== null) ? Math.round(ranked.reduce((sum, factor) => sum + factor.weight * (factor.score as number) / 10, 0)) : null;
  const score = (name: FactorName) => ranked.find((factor) => factor.name === name)?.score;
  const missing = [
    ...(!item.buyer ? ["Named buyer"] : []),
    ...(score("Paid demand") == null ? ["Paid demand"] : []),
    ...(score("Severity and frequency") == null ? ["Recurring failure"] : []),
    ...(score("Alternative gap") == null ? ["Alternative gap"] : []),
    ...(!item.alternatives.length ? ["Named competitor comparison"] : []),
    ...(score("Budget and location") == null ? ["Local feasibility"] : []),
    ...(!financials ? ["Pricing, costs, and scenario volumes"] : []),
  ];
  const risks = investmentRisks(financials, budget, item.assumptions.currency);
  if (item.claims.some((claim) => claim.direction === "contradicts")) risks.push("Contradicting source claim needs review");
  return { ...item, financials, factors: ranked, strength, missing, risks };
}
export function analyzeResearch(input: ResearchInput, sources: SourceSignal[]): ResearchOpportunity[] {
  return groupSources(sources).map((group) => {
    const first = group[0];
    const claims = group.flatMap(extractClaims);
    const buyer = group.map((source) => source.excerpt.match(/\b(?:as a|i am a|i'm a)\s+([a-z][a-z -]{2,35})\b/i)?.[1]?.split(/\b(?:and|but|we|who|that)\b|[,.;]/i)[0].trim()).find(Boolean) ?? null;
    const alternatives = [...new Set(group.flatMap((source) => source.excerpt.match(/\b(?:spreadsheet|manual process|existing tool|consultant|in-house system)\b/gi) ?? []))];
    const assumptions = blankFinancials(input);
    const item: ResearchOpportunity = {
      id: first.id, name: clean(first.title), category: classifyIndustry(group.map((source) => source.title + " " + source.excerpt).join(" ")), geography: input.geography,
      buyer, problem: first.excerpt || first.title,
      offering: "Hypothesis: " + (input.businessModel || "service") + " addressing " + clean(first.title).replace(/[?.!]+$/, "").toLowerCase(),
      alternatives, gap: claims.some((claim) => claim.factor === "Alternative gap") ? "A source reports friction with an existing alternative; compare specific products before qualification." : null,
      risks: ["Forum discussion may not represent paying buyers", "Geography and budget fit unverified"],
      sources: group, claims, assumptions, factors: [], strength: null, confidence: confidence(group, claims), financials: null,
      missing: ["Independent buyer confirmation", "Verified paid demand", "Named competitor comparison", "Local demand", "Pricing, costs, and scenario volumes"],
    };
    return recalculateOpportunity(item, input.budget);
  }).filter((item) => {
    const evidence = item.sources.map((source) => source.title + " " + source.excerpt).join(" ").toLowerCase();
    if (input.industry && !matchesIndustry(input.industry, item.category, evidence)) return false;
    if (input.businessModel && !evidence.includes(input.businessModel.toLowerCase())) return false;
    if (input.customer && !evidence.includes(input.customer.toLowerCase())) return false;
    if (input.driver && !evidence.includes(input.driver.toLowerCase())) return false;
    return true;
  }).sort((a, b) => (b.strength ?? -1) - (a.strength ?? -1) || b.sources.length - a.sources.length);
}
