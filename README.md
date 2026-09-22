# Businessman

Businessman is a research-first market inefficiency detector. The MVP focuses on discovery, opportunity scoring, evidence-driven research reports, and a personal watchlist.

## MVP architecture

- **UI:** Next.js / React with TypeScript and Tailwind CSS
- **Research model:** primary-source evidence is stored independently from AI summaries so a claim can be audited.
- **Persistence path:** PostgreSQL-compatible Drizzle schema in `db/schema.ts`; use Supabase/Postgres for production and attach a web-search/RSS/GitHub ingest service.

## Research guardrails

1. Every score is an estimate, not a fact.
2. Important claims require a source URL, published date, accessed date, and confidence.
3. A low competitor count is never positive without demand evidence.
4. Negative research should be recorded beside supporting research before an opportunity is promoted.

## Recommended open-source building blocks

- Drizzle ORM for typed SQL and migrations
- Zod for validating research-agent structured output
- Octokit for GitHub ecosystem signals
- Recharts for fuller trend history / radar views
- Playwright for end-to-end regression checks
