import { z } from "zod";
import { readLimitedJson } from "@/lib/read-limited-json";

const source = "https://api.worldbank.org/v2/country/IN/indicator";
const indicators = {
  gdpCurrentUsd: { code: "NY.GDP.MKTP.CD", label: "GDP (current US$)" },
  internetUsersPercent: { code: "IT.NET.USER.ZS", label: "Individuals using the Internet (% of population)" },
} as const;

const observationSchema = z.object({
  date: z.string().regex(/^\d{4}$/),
  value: z.number().finite().nullable(),
  indicator: z.object({ id: z.string(), value: z.string() }),
}).passthrough();

async function latestObservations(codes: string[]) {
  const url = new URL(`${source}/${codes.join(";")}`);
  url.search = new URLSearchParams({ format: "json", mrv: "10", per_page: "50", source: "2" }).toString();
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    redirect: "manual",
    signal: AbortSignal.timeout(8_000),
  });
  if (response.status >= 300 && response.status < 400) throw new Error("World Bank returned an unexpected redirect.");
  if (!response.ok) throw new Error(`World Bank request failed (${response.status}).`);
  const payload = z.array(z.unknown()).parse(await readLimitedJson(response, 32_000));
  const rows = z.array(observationSchema).safeParse(payload[1]);
  if (!rows.success) throw new Error("World Bank returned an invalid indicator response.");
  const latest = new Map<string, { value: number; year: number }>();
  for (const row of rows.data) {
    if (row.value !== null && !latest.has(row.indicator.id)) {
      latest.set(row.indicator.id, { value: row.value, year: Number(row.date) });
    }
  }
  return latest;
}

export async function collectIndiaMarketContext() {
  const entries = Object.entries(indicators);
  const latest = await latestObservations(entries.map(([, indicator]) => indicator.code));
  const values = entries.map(([key, indicator]) => [key, {
    ...indicator,
    ...(latest.get(indicator.code) ?? { value: null, year: null }),
    sourceUrl: `${source}/${indicator.code}?format=json&mrv=10&source=2`,
  }] as const);

  return {
    market: "India",
    source: "World Bank Indicators API",
    retrievedAt: new Date().toISOString(),
    metrics: Object.fromEntries(values),
    caveat: "National GDP and internet-use rates are context only. They do not estimate this product’s addressable customers, willingness to pay, market demand, or revenue.",
  };
}
