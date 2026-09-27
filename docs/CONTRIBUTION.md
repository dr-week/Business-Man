# Contribution

- TypeScript: app/components/lib. Python: isolated collector.
- Validate external input; keep secrets server-side and ignored.
- Preserve owner-scoped database access; use migrations for schema changes.
- No background fetching or dependencies without requirement.
- Separate missing, zero, estimate, and sourced values.
- Checks when requested: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- Update relevant contract doc; record remaining failures.
