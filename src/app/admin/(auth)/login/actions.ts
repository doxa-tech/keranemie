"use server";

import { z } from "zod";
import { prepareAdminSignIn } from "@/lib/admin-access";
import { safePath } from "@/lib/safe-path";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  status: "idle" | "sent" | "error" | "password";
  email?: string;
  wrongPassword?: boolean;
};

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = z.email().safeParse(formData.get("email"));
  if (!parsed.success) return { status: "error" };
  const email = parsed.data.toLowerCase();

  // A new admin account needs the admin password: asked for only then.
  const access = await prepareAdminSignIn(
    email,
    String(formData.get("password") ?? ""),
  );
  if (access !== "ok") {
    return {
      status: "password",
      email,
      wrongPassword: access === "wrongPassword",
    };
  }

  // Always with a query string: the email template appends the token to it.
  const redirectTo = new URL("/auth/confirm", process.env.APP_URL);
  redirectTo.searchParams.set(
    "next",
    safePath(formData.get("next")) ?? "/admin",
  );

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo.toString(),
      // Accounts are created by prepareAdminSignIn only.
      shouldCreateUser: false,
    },
  });
  if (error) {
    console.error("Magic link failed", error.message);
    return { status: "error", email };
  }
  return { status: "sent", email };
}
