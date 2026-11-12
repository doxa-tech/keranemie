"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "sent" | "error"; email?: string };

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = z.email().safeParse(formData.get("email"));
  if (!parsed.success) return { status: "error" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${process.env.APP_URL}/auth/confirm` },
  });
  if (error) {
    console.error("Magic link failed", error.message);
    return { status: "error", email: parsed.data };
  }
  return { status: "sent", email: parsed.data };
}
