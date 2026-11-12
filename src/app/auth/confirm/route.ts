import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { acceptPendingInvitations } from "@/lib/invitations";
import { safePath } from "@/lib/safe-path";
import { createClient } from "@/lib/supabase/server";

// Landing URL of the magic link. Supabase sends either a PKCE `code` or a
// `token_hash`, depending on the email template.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safePath(searchParams.get("next")) ?? "/admin";
  const supabase = await createClient();

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("Missing code") };

  if (error) {
    return NextResponse.redirect(new URL("/admin/login?error=link", origin));
  }
  const user = await getUser();
  if (user) await acceptPendingInvitations(user);
  return NextResponse.redirect(new URL(next, origin));
}
