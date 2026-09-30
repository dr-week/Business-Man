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

async function latestObservation(code: string) {
  const url = new URL(`${source}/${code}`);
  url.search = new URLSearchParams({ format: "json", mrv: "10" }).toString();
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
  const row = rows.data.find((item) => item.value !== null);
  return { value: row?.value ?? null, year: row ? Number(row.date) : null };
}

export async function collectIndiaMarketContext() {
  const entries = Object.entries(indicators);
  const values = await Promise.all(entries.map(async ([key, indicator]) => [key, {
    ...indicator,
    ...(await latestObservation(indicator.code)),
    sourceUrl: `${source}/${indicator.code}?format=json&mrv=10`,
  }] as const));

  return {
    market: "India",
    source: "World Bank Indicators API",
    retrievedAt: new Date().toISOString(),
    metrics: Object.fromEntries(values),
    caveat: "National GDP and internet-use rates are context only. They do not estimate this product’s addressable customers, willingness to pay, market demand, or revenue.",
  };
}
