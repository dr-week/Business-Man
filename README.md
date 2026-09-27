# Businessman

On-demand business research: sources, opportunities, scenario economics.

## Run

```sh
npm install
npm run db:local:apply
npx wrangler d1 execute DB --local --config wrangler.local.jsonc --file drizzle/0001_busy_wrecker.sql --persist-to .wrangler/state
npm run dev -- --hostname 0.0.0.0
```

Local sign-in is mocked. Production requires real authentication, D1 binding `DB`, and both migrations; local database ID is a placeholder.

## Docs

[Developer documentation](docs/README.md): read only relevant module.

Stack: React/TypeScript, vinext, Cloudflare Workers/D1, Drizzle, Zod.

