import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Direct Postgres connection used by Server Actions and Route Handlers.
// It bypasses RLS: authorization is checked in the server code.
// In development, hot reloads re-run this module: the pool is kept on
// globalThis, otherwise each reload would open (and leak) a new one.
const globalForDb = globalThis as { pgClient?: ReturnType<typeof postgres> };
const client =
  globalForDb.pgClient ?? postgres(process.env.DATABASE_URL!, { prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
