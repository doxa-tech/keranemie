import "server-only";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { adminInvitations, partyAdmins } from "@/db/schema";
import { passwordMatches } from "@/lib/password";
import { createAdminClient } from "@/lib/supabase/admin";

// Who may use the admin area: users approved with the admin password
// (`app_metadata.admin`, which only the server can set) and admins of a
// party (invited ones). Accounts created directly through Supabase with
// the public key are neither, so they can't create parties.

export type AdminSignIn = "ok" | "passwordRequired" | "wrongPassword";

// Checks a sign-in request before the magic link is sent. A new admin
// needs ADMIN_SIGNUP_PASSWORD, unless an invitation is waiting for them;
// the account is then created (or approved) here, so the link itself never
// creates a user.
export async function prepareAdminSignIn(
  email: string,
  password: string,
): Promise<AdminSignIn> {
  const [user] = await db.execute<{ id: string; admin: boolean | null }>(sql`
    select id, (raw_app_meta_data ->> 'admin')::boolean as admin
    from auth.users
    where lower(email) = ${email} and not is_anonymous
    limit 1`);
  if (user && (user.admin || (await isAnyPartyAdmin(user.id)))) return "ok";

  const invited = await hasPendingInvitation(email);
  if (!invited) {
    if (!password) return "passwordRequired";
    if (!passwordMatches(password, process.env.ADMIN_SIGNUP_PASSWORD)) {
      return "wrongPassword";
    }
  }

  const auth = createAdminClient().auth.admin;
  // Invited users are approved when they accept the invitation.
  const appMetadata = invited ? undefined : { admin: true };
  const { error } = user
    ? appMetadata
      ? await auth.updateUserById(user.id, { app_metadata: appMetadata })
      : { error: null }
    : await auth.createUser({
        email,
        email_confirm: true,
        app_metadata: appMetadata,
      });
  if (error) throw error;
  return "ok";
}

export async function isAnyPartyAdmin(userId: string) {
  const [row] = await db
    .select({ userId: partyAdmins.userId })
    .from(partyAdmins)
    .where(eq(partyAdmins.userId, userId))
    .limit(1);
  return Boolean(row);
}

async function hasPendingInvitation(email: string) {
  const [row] = await db
    .select({ id: adminInvitations.id })
    .from(adminInvitations)
    .where(
      and(
        eq(adminInvitations.email, email),
        isNull(adminInvitations.acceptedAt),
        gt(adminInvitations.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return Boolean(row);
}
