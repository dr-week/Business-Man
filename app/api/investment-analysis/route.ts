import { NextResponse } from "next/server";
import { readLimitedJson } from "@/lib/read-limited-json";
import { analyzePortfolioCsv } from "@/lib/investment/portfolio-import";
import { portfolioImportInput } from "@/lib/investment/portfolio-contract";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await readLimitedJson(request, 512_000);
  } catch {
    return NextResponse.json({ error: "Invalid or oversized portfolio request." }, { status: 400 });
  }

  const parsed = portfolioImportInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Provide a CSV, currency, valuation date, and source name." }, { status: 400 });

  try {
    return NextResponse.json(analyzePortfolioCsv(parsed.data));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not analyze this portfolio." }, { status: 400 });
  }
}
