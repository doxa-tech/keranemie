import "server-only";
import { createClient } from "@supabase/supabase-js";

// Supabase client with the secret key, for server-only work that needs
// elevated rights: signed storage URLs and realtime broadcasts.
// Never use it to act on behalf of a user without checking their rights first.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
