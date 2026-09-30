import { z } from "zod";
import { classifyIndustry } from "@/lib/industry-classifier";
import { readLimitedJson } from "@/lib/read-limited-json";

const states: Record<string, string> = {
  Alabama:"01", Alaska:"02", Arizona:"04", Arkansas:"05", California:"06", Colorado:"08", Connecticut:"09", Delaware:"10", Florida:"12", Georgia:"13", Hawaii:"15", Idaho:"16", Illinois:"17", Indiana:"18", Iowa:"19", Kansas:"20", Kentucky:"21", Louisiana:"22", Maine:"23", Maryland:"24", Massachusetts:"25", Michigan:"26", Minnesota:"27", Mississippi:"28", Missouri:"29", Montana:"30", Nebraska:"31", Nevada:"32", "New Hampshire":"33", "New Jersey":"34", "New Mexico":"35", "New York":"36", "North Carolina":"37", "North Dakota":"38", Ohio:"39", Oklahoma:"40", Oregon:"41", Pennsylvania:"42", "Rhode Island":"44", "South Carolina":"45", "South Dakota":"46", Tennessee:"47", Texas:"48", Utah:"49", Vermont:"50", Virginia:"51", Washington:"53", "West Virginia":"54", Wisconsin:"55", Wyoming:"56", "District of Columbia":"11",
};
const sectors: Record<string, { naics: string; label: string }> = {
  Agriculture: { naics: "11", label: "Agriculture, forestry, fishing and hunting" },
  Healthcare: { naics: "62", label: "Health care and social assistance" },
  Manufacturing: { naics: "31-33", label: "Manufacturing" },
  Food: { naics: "72", label: "Accommodation and food services" },
  Travel: { naics: "72", label: "Accommodation and food services" },
  Retail: { naics: "44-45", label: "Retail trade" },
  Logistics: { naics: "48-49", label: "Transportation and warehousing" },
  Software: { naics: "51", label: "Information (broad software industry proxy)" },
};
const apiRows = z.array(z.array(z.string().max(160)).max(10)).max(20);
export type CensusMarketSignal = {
  status: "available" | "not_configured" | "unsupported_geography" | "unclassified_industry" | "unavailable";
  establishments: number | null; industry: string; geography: string; year: number;
  retrievedAt: string; sourceUrl: string; geographyLevel: "state" | "zip" | null; naicsCode: string | null;
};
const sourceUrl = "https://www.census.gov/data/developers/data-sets/cbp-zbp/cbp-api.html";

export function censusZipCode(geography: string): string | null {
  return geography.match(/\b(\d{5})(?:-\d{4})?\b/)?.[1] ?? null;
}

export function censusStateCode(geography: string): string | null {
  const parts = geography.split(/[,;]+/).map((part) => part.trim().toLowerCase());
  const found = Object.entries(states).find(([name]) => parts.includes(name.toLowerCase()));
  return found?.[1] ?? null;
}

export async function collectCensusMarket(input: { geography: string; industry: string; key?: string }, signal?: AbortSignal): Promise<CensusMarketSignal> {
  const zip = censusZipCode(input.geography);
  const state = zip ? null : censusStateCode(input.geography);
  const industry = input.industry in sectors ? input.industry : classifyIndustry(input.industry);
  const sector = sectors[industry];
  const naicsCode = zip ? "00" : sector?.naics ?? null;
  const result = (status: CensusMarketSignal["status"], establishments: number | null = null, label = input.industry, geography = input.geography): CensusMarketSignal => ({
    status, establishments, industry: label, geography, year: 2023, retrievedAt: new Date().toISOString(), sourceUrl,
    geographyLevel: zip ? "zip" : state ? "state" : null, naicsCode,
  });
  if (!zip && !state) return result("unsupported_geography");
  if (!input.key) return result("not_configured");
  if (!zip && !sector) return result("unclassified_industry");
  const url = new URL("https://api.census.gov/data/2023/cbp");
  url.search = new URLSearchParams({
    get: "ESTAB,NAICS2017_LABEL,NAME", for: zip ? `zip code:${zip}` : `state:${state}`, NAICS2017: naicsCode!,
    LFO: "001", EMPSZES: "001", key: input.key,
  }).toString();
  try {
    const response = await fetch(url, { signal: AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(8000)]), redirect: "error", headers: { Accept: "application/json" } });
    if (!response.ok) return result("unavailable", null, sector.label);
    const rows = apiRows.parse(await readLimitedJson(response, 64_000));
    if (rows.length < 2 || rows[0].indexOf("ESTAB") < 0) return result("unavailable", null, sector.label);
    const value = rows[1][rows[0].indexOf("ESTAB")];
    const label = zip ? "All industries (NAICS 00)" : rows[1][rows[0].indexOf("NAICS2017_LABEL")] || sector!.label;
    return result("available", /^\d+$/.test(value) ? Number(value) : null, label, rows[1][rows[0].indexOf("NAME")] || input.geography);
  } catch {
    return result("unavailable", null, sector.label);
  }
}
