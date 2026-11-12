"use server";

import { z } from "zod";
import { safePath } from "@/lib/safe-path";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "sent" | "error"; email?: string };

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = z.email().safeParse(formData.get("email"));
  if (!parsed.success) return { status: "error" };

  const redirectTo = new URL("/auth/confirm", process.env.APP_URL);
  const next = safePath(formData.get("next"));
  if (next) redirectTo.searchParams.set("next", next);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: redirectTo.toString() },
  });
  if (error) {
    console.error("Magic link failed", error.message);
    return { status: "error", email: parsed.data };
  }
  return { status: "sent", email: parsed.data };
}
