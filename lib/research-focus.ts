export const researchFocus = {
  buyers: { label: "Customer demand", action: "Talk to buyers and confirm frequency, urgency, and willingness to pay." },
  competitors: { label: "Competitors and alternatives", action: "Map direct and indirect alternatives, current prices, and gaps." },
  location: { label: "Local market fit", action: "Check local customer reach, nearby providers, and operating constraints." },
  economics: { label: "Costs and pricing", action: "Collect supplier quotes, customer price points, and monthly operating costs." },
  franchise: { label: "Franchise due diligence", action: "Review current disclosure documents, fees, unit exits, territory, and franchisee feedback." },
  general: { label: "Broad research", action: "Start with customer demand, local competition, pricing, and key risks." },
} as const;

export type ResearchFocus = keyof typeof researchFocus;
export type ResearchFocusSource = "rules" | "Laya (provisional)";

export const researchFocusCriteria: Record<ResearchFocus, string> = Object.fromEntries(
  Object.entries(researchFocus).map(([key, value]) => [key, value.label]),
) as Record<ResearchFocus, string>;

export function inferResearchFocus(text: string): ResearchFocus {
  const value = text.toLowerCase();
  if (/franchise|franchis|fdd|franchisee/.test(value)) return "franchise";
  if (/competitor|competition|alternative|market gap|compare/.test(value)) return "competitors";
  if (/price|pricing|cost|budget|investment|profit|margin|quote/.test(value)) return "economics";
  if (/location|local|near me|city|district|region|in [a-z]+,? india/.test(value)) return "location";
  if (/buyer|customer|demand|sell|pay|problem|need/.test(value)) return "buyers";
  return "general";
}
