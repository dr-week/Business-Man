# Design rules

Target: quiet, Japanese-inspired minimalism; whitespace, restrained colour, clear hierarchy.

- One primary action per screen; no duplicate headings.
- Prefer icons with accessible names and hover/focus tooltips.
- Short labels; one-line summaries where practical. Never clip essential values/errors.
- Main page: topic search. Drawer: tools/news; fixed footer: Settings + Profile.
- Profile: editable Goa/India, INR, minimum 0, maximum unset; validate min <= max.
- Mobile: compact result cards. Desktop: table. Each result: star.
- Hide empty tables/export; one short empty state.
- Numbers first; details on demand; charts only with supporting inputs.
- Idle prompts: dynamic cycling across diverse sectors, pause during input, respect reduced motion; call trends current only with dated evidence.
- No polling, decorative animation loops, or model downloads for UI.

## Files

- `app/hunt/page.tsx`: drawer, view selection.
- `app/hunt/hunt.css`: layout/styles.
- `components/source-discovery.tsx`: search/results/preferences.
- `components/news-feed.tsx`: news.
- `components/research-charts.tsx`: research charts.
