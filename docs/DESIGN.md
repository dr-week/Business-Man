# Design rules

Target: quiet, Japanese-inspired minimalism; whitespace, restrained colour, clear hierarchy.

- One primary action per screen; no duplicate headings.
- Prefer icons with accessible names and hover/focus tooltips.
- Short labels; one-line summaries where practical. Never clip essential values/errors.
- Research: search + results. Analyse: business case + evidence. Economics: assumptions + charts. Market: competitor candidates + alternatives. Revenue: product monetization tiers, payer assumptions, and break-even simulator. Sources: searchable evidence links + transient web leads. Drawer: Research, Analyse, Economics, Market, Revenue, Sources, Starred, News; fixed footer: Settings + Profile.
- Profile: editable Goa/India, INR, minimum 0, maximum unset; validate min <= max.
- Mobile: compact result cards. Desktop: table. Each result: star.
- News: publisher headlines appear under News to investigate. For You requires sourced investment; Demand Now requires a dated buyer request. Hide empty sections. Unknown values stay Unknown.
- Hide empty tables/export; one short empty state.
- Numbers first; details on demand; charts only with supporting inputs.
- Idle prompts: dynamic cycling across diverse sectors, pause during input, respect reduced motion; call trends current only with dated evidence.
- No polling, decorative animation loops, or model downloads for UI.

## Components and competitor comparison

- Reuse `components/ui/` (Radix/shadcn), Sass modules, and existing chart components. Write new feature styling in `.module.scss`; shared shadcn wrappers still use Tailwind classes and should be migrated when their styling is next changed. Do not describe the whole UI as SCSS-based yet.
- Do not add a second component suite for the same controls. Stitches is marked not actively maintained; Mantine recommends CSS Modules and does not require Sass. Reconsider only for a concrete component gap and scoped migration.
- Competitor comparison stays a compact table for up to four opportunities, with charts as a separate view. Research comparing list, matrix, and network layouts found decision performance depends on task and data complexity; avoid adding a network view without a demonstrated task need ([study](https://doi.org/10.1016/j.eswa.2016.08.041)).

## Files

- `app/hunt/page.tsx`: drawer, view selection.
- `app/hunt/hunt.scss`: layout/styles.
- `components/source-discovery.tsx`: search/results/preferences.
- `components/news-feed.tsx`: news.
- `lib/news/opportunities.ts`: personalized news and demand signal qualification.
- `components/research-charts.tsx`: research charts.
- `components/research/revenue-system-workbench.tsx`: product revenue model, tier assumptions, and break-even explorer.
- `components/research/source-ledger.tsx`, `source-ledger.module.scss`: source search and evidence-type filters.
- `components/research/market-panel.tsx`: competitor and alternative view.
- `components/research/validation-checklist.tsx`, `.module.scss`: collapsed field-work log; completion requires a note and HTTPS evidence link. Browser-local, user-reported progress.
