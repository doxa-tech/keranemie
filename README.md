# Keranemie

Challenges (a scavenger hunt) for a group during an event. See [specifications/](specifications/).

## Stack

Next.js (App Router, TypeScript, Tailwind, shadcn/ui) + Supabase (Postgres, Auth, Storage, Realtime), with Drizzle for the schema and queries, next-intl for French and English, Vitest and Playwright for tests.

## Getting started

Requirements: Node.js 22+, Docker, the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).

```bash
npm install
npm run supabase:start        # local Supabase in Docker, applies migrations
cp .env.example .env.local    # then fill the empty values (see comments in the file)
npm run dev
```

Local Supabase uses the 553xx ports (not the default 543xx), so it can run next to other Supabase projects. Edge Functions are disabled: the app doesn't use them.

- App: http://localhost:3000
- Supabase Studio: http://127.0.0.1:55323
- Emails (magic links): http://127.0.0.1:55324

## Database

The schema lives in `src/db/schema.ts`. To change it:

```bash
# edit src/db/schema.ts
npm run db:generate -- --name <change>   # writes supabase/migrations/<timestamp>_<change>.sql
npm run db:reset                         # recreates the local database from all migrations
```

## Code layout

| Path | Content |
|---|---|
| `src/lib/game/` | Game rules as pure functions (status, availability, scoring, team assignment), unit-tested |
| `src/lib/auth.ts` | Auth guards for Server Components and Server Actions |
| `src/lib/realtime/` | Party events: broadcast from the server, `usePartyEvents` on the client |
| `src/lib/supabase/` | Supabase clients (browser, server, secret-key admin, session proxy) |
| `src/db/` | Drizzle schema and connection |
| `messages/` | Translations (`en.json`, `fr.json`): every string goes in both |
| `e2e/` | Playwright tests |

## Scripts

| Script | Description |
|---|---|
| `dev` | Start the dev server |
| `build` | Production build |
| `lint` | ESLint |
| `typecheck` | Generate route types, then run TypeScript |
| `test` / `test:watch` | Unit tests (Vitest) |
| `e2e` | End-to-end tests (Playwright); needs local Supabase running |
| `supabase:start` / `supabase:stop` | Start / stop the local Supabase stack |
| `db:generate` | Generate a migration from the Drizzle schema |
| `db:reset` | Reset the local database and apply all migrations |
