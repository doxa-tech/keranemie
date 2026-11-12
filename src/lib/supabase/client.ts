import { createBrowserClient } from "@supabase/ssr";

// Supabase client for Client Components (auth, storage uploads, realtime).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
