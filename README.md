# Keranemie

Challenges (a scavenger hunt) for a group during an event. See [specifications/](specifications/).

## Stack

Next.js (App Router, TypeScript, Tailwind) + Supabase (Postgres, Auth, Storage, Realtime), with Drizzle for the schema and queries.

## Getting started

Requirements: Node.js 22+, Docker, the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).

```bash
npm install
npm run supabase:start        # local Supabase in Docker, applies migrations
npx supabase status           # copy the publishable key
cp .env.example .env.local    # then fill NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

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

## Scripts

| Script | Description |
|---|---|
| `dev` | Start the dev server |
| `build` | Production build |
| `lint` | ESLint |
| `typecheck` | Generate route types, then run TypeScript |
| `supabase:start` / `supabase:stop` | Start / stop the local Supabase stack |
| `db:generate` | Generate a migration from the Drizzle schema |
| `db:reset` | Reset the local database and apply all migrations |
