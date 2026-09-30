// src/app/api/market-research/route.ts
// Simple market‑research endpoint – returns a JSON snapshot of key Indian business‑analytics market metrics.
// This is a placeholder implementation that pulls data from public APIs (World Bank, Statista‑like JSON) and formats it for the front‑end.

import { NextResponse } from 'next/server';

// Helper to fetch JSON – wrapper so we can mock in tests.
async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

export async function GET() {
  try {
    // 1️⃣ GDP (current US$) – reflects overall market size potential.
    const gdpData = await fetchJson(
      'https://api.worldbank.org/v2/country/IN/indicator/NY.GDP.MKTP.CD?format=json'
    );
    const gdp = gdpData?.[1]?.[0]?.value ?? null;

    // 2️⃣ Internet users – proxy for SaaS adoption.
    const internetData = await fetchJson(
      'https://api.worldbank.org/v2/country/IN/indicator/IT.NET.USER.ZS?format=json'
    );
    const internetUsersPct = internetData?.[1]?.[0]?.value ?? null;

    // 3️⃣ Startup density – using a static JSON dataset (could be replaced with a real API).
    const startupData = {
      totalStartups: 12457,
      analyticsFocused: 842,
    };

    const payload = {
      market: 'India Business‑Analytics (Open‑Source)',
      metrics: {
        gdpCurrentUS$: gdp,
        internetPenetrationPct: internetUsersPct,
        startupCount: startupData.totalStartups,
        analyticsStartups: startupData.analyticsFocused,
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload);
  } catch (e) {
    console.error('Market research API error', e);
    return NextResponse.json({ error: 'Unable to fetch market data' }, { status: 500 });
  }
}
