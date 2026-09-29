import type { NewsItem } from "./feed";

export type OpportunitySection = "forYou" | "demandNow" | "everydayBusiness";
export type PersonalizedOpportunity = {
  id: string; title: string; section: OpportunitySection; entryRole: string; topic: string;
  isInferred: boolean; setupCost: number | null; workingCapital: number | null;
  totalInvestment: number | null; currency: string;
  metric1: { label: string; value: string }; metric2: { label: string; value: string };
  metric3: { label: string; value: string }; sourceTitle: string; sourceUrl: string;
  publishedAt: string; operatingSteps: string[];
  evidence: { claim: string; source: string; url: string; risk?: boolean }[];
  demandSignal?: { buyer: string; quantity?: string | null; location?: string | null; deadline?: string | null };
};
export type UserPreferences = { geography: string; currency: string; budget: number | null; minimumInvestment?: number };
export type QualifiedNewsOpportunities = {
  forYou: PersonalizedOpportunity | null;
  demandNow: PersonalizedOpportunity[];
  everydayBusiness: PersonalizedOpportunity[];
  requiresBudgetPrompt: boolean;
};

/** Publisher headlines are leads for research, never verified business opportunities. */
export function inferOpportunitiesFromNews(newsItems: NewsItem[], currency = "INR"): PersonalizedOpportunity[] {
  return newsItems.slice(0, 30).map((item) => ({
    id: item.url,
    title: item.title,
    section: "everydayBusiness" as const,
    entryRole: "News",
    topic: item.title,
    isInferred: true,
    setupCost: null,
    workingCapital: null,
    totalInvestment: null,
    currency,
    metric1: { label: "Buyer", value: "Unknown" },
    metric2: { label: "Setup", value: "Unknown" },
    metric3: { label: "Demand", value: "Unknown" },
    sourceTitle: item.source,
    sourceUrl: item.url,
    publishedAt: item.publishedAt,
    operatingSteps: [],
    evidence: [{ claim: item.summary || item.title, source: item.source, url: item.url },
      { claim: "Buyer demand and investment are unverified.", source: item.source, url: item.url, risk: true }],
  }));
}

/** Sections stay empty until a dated buyer notice or sourced cost model exists. */
export function qualifyPersonalizedNews(newsItems: NewsItem[], preferences: UserPreferences): QualifiedNewsOpportunities {
  return {
    forYou: null,
    demandNow: [],
    everydayBusiness: inferOpportunitiesFromNews(newsItems, preferences.currency),
    requiresBudgetPrompt: false,
  };
}
