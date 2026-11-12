import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  // Migrations go to the Supabase folder, named the way the Supabase CLI expects,
  // so `supabase db reset` applies them.
  out: "./supabase/migrations",
  migrations: { prefix: "supabase" },
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: { url: process.env.DATABASE_URL! },
});
