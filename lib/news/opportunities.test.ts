import { describe, it, expect } from "vitest";
import {
  qualifyPersonalizedNews,
  type UserPreferences,
} from "./opportunities";
import type { NewsItem } from "./feed";

describe("Personalized News Opportunities Engine", () => {
  const mockNews: NewsItem[] = [
    {
      title: "Solar panel recycling mandates expand across coastal ports",
      url: "https://www.theguardian.com/business/2026/sep/27/solar-recycling",
      source: "The Guardian",
      publishedAt: "2026-09-27T10:00:00Z",
      summary: "Coastal ports introduce circular processing rules.",
    },
    {
      title: "Cold chain logistics operators report refrigerated trailer shortages",
      url: "https://www.bbc.co.uk/news/business-refrigeration-shortage",
      source: "BBC Business",
      publishedAt: "2026-09-27T09:00:00Z",
      summary: "Perishables transport demand surges ahead of festive season.",
    },
  ];

  it("enforces mutual exclusivity: no opportunity appears in more than one section", () => {
    const preferences: UserPreferences = {
      geography: "Goa, India",
      currency: "INR",
      budget: 500000,
      minimumInvestment: 0,
    };

    const qualified = qualifyPersonalizedNews(mockNews, preferences);
    const allIds: string[] = [];

    if (qualified.forYou) allIds.push(qualified.forYou.id);
    for (const item of qualified.demandNow) allIds.push(item.id);
    for (const item of qualified.everydayBusiness) allIds.push(item.id);

    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  it("does not claim affordability from headlines without investment figures", () => {
    const preferences: UserPreferences = {
      geography: "Goa, India",
      currency: "INR",
      budget: 150000,
      minimumInvestment: 0,
    };

    const qualified = qualifyPersonalizedNews(mockNews, preferences);
    expect(qualified.forYou).toBeNull();
    expect(qualified.requiresBudgetPrompt).toBe(false);
  });

  it("does not prompt for budget when source costs are unknown", () => {
    const preferences: UserPreferences = {
      geography: "Goa, India",
      currency: "INR",
      budget: null,
      minimumInvestment: 0,
    };

    const qualified = qualifyPersonalizedNews(mockNews, preferences);
    expect(qualified.requiresBudgetPrompt).toBe(false);
    expect(qualified.forYou).toBeNull();
  });

  it("preserves null for unknown costs and labels inferred news opportunities", () => {
    const preferences: UserPreferences = {
      geography: "Goa, India",
      currency: "INR",
      budget: 200000,
    };

    const qualified = qualifyPersonalizedNews(mockNews, preferences);
    const inferred = qualified.everydayBusiness.find((item) => item.isInferred);
    expect(inferred).toBeDefined();
    expect(inferred?.setupCost).toBeNull();
    expect(inferred?.workingCapital).toBeNull();
    expect(inferred?.totalInvestment).toBeNull();
    expect(inferred?.metric1.value).toBe("Unknown");
    expect(inferred?.evidence.some((item) => item.claim.includes("unverified"))).toBe(true);
  });

  it("leaves Demand Now empty without a sourced buyer request", () => {
    const preferences: UserPreferences = {
      geography: "Goa, India",
      currency: "INR",
      budget: 100000,
    };

    const qualified = qualifyPersonalizedNews([], preferences);
    expect(qualified.demandNow).toEqual([]);
    expect(qualified.everydayBusiness).toEqual([]);
  });
});
