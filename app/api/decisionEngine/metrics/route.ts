import { z } from "zod";
import { ownerId, isCrossOrigin } from "@/lib/hunt-api";
import { readLimitedJson } from "@/lib/read-limited-json";
import { evaluateSystem1Heuristics } from "@/lib/system1-decision-engine";

const opportunitySchema = z.object({
  id: z.string().min(1).max(120),
  buyer: z.string().max(500).nullable().default(null),
  gap: z.string().max(2000).nullable().default(null),
  financials: z.object({
    contribution: z.number().finite(),
    paybackMonth: z.number().finite().nullable(),
    scenarios: z.array(z.object({ margin: z.number().finite().nullable() })).max(3),
  }).nullable().default(null),
  claims: z.array(z.object({
    direction: z.enum(["supports", "contradicts", "context"]),
    factor: z.string().max(100).optional(),
    sourceIds: z.array(z.string().max(120)).max(100),
  })).max(500).default([]),
  sources: z.array(z.object({
    id: z.string().min(1).max(120),
    provider: z.string().max(120).default("Unknown"),
    title: z.string().max(500).default(""),
    excerpt: z.string().max(2000).default(""),
    url: z.string().max(2000).default(""),
    publishedAt: z.string().max(100).default(""),
    retrievedAt: z.string().max(100).default(""),
  })).max(500).default([]),
}).strict();

const requestSchema = z.object({ opportunities: z.array(opportunitySchema).min(1).max(50) }).strict();

export async function POST(request: Request) {
  if (isCrossOrigin(request)) return Response.json({ error: "Cross-origin request denied." }, { status: 403 });
  if (!await ownerId()) return Response.json({ error: "Sign in to evaluate opportunities." }, { status: 401 });

  let body: unknown;
  try { body = await readLimitedJson(request, 1_000_000); }
  catch { return Response.json({ error: "Invalid or oversized decision request." }, { status: 400 }); }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Provide 1–50 valid opportunities." }, { status: 400 });

  const evaluations = parsed.data.opportunities.map((opportunity) =>
    evaluateSystem1Heuristics(opportunity),
  );
  return Response.json({ evaluations }, { headers: { "Cache-Control": "no-store" } });
}
