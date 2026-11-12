import "server-only";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { adminInvitations, partyAdmins } from "@/db/schema";
import type { SessionUser } from "@/lib/auth";

type Invitation = typeof adminInvitations.$inferSelect;

export async function getInvitation(token: string) {
  const [invitation] = await db
    .select()
    .from(adminInvitations)
    .where(eq(adminInvitations.token, token));
  return invitation ?? null;
}

export type InvitationCheck = "ok" | "expired" | "accepted" | "wrongEmail";

export function checkInvitation(
  invitation: Pick<Invitation, "email" | "expiresAt" | "acceptedAt">,
  user: Pick<SessionUser, "email">,
  now: Date,
): InvitationCheck {
  if (invitation.acceptedAt) return "accepted";
  if (invitation.expiresAt <= now) return "expired";
  if (invitation.email !== user.email?.toLowerCase()) return "wrongEmail";
  return "ok";
}

export async function acceptInvitation(invitation: Invitation, userId: string) {
  await db.transaction(async (tx) => {
    await tx
      .insert(partyAdmins)
      .values({ partyId: invitation.partyId, userId, role: "admin" })
      .onConflictDoNothing();
    await tx
      .update(adminInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(adminInvitations.id, invitation.id));
  });
}

// At sign-in, accepts every valid invitation sent to the user's email.
export async function acceptPendingInvitations(user: SessionUser) {
  if (!user.email || user.isAnonymous) return;
  const pending = await db
    .select()
    .from(adminInvitations)
    .where(
      and(
        eq(adminInvitations.email, user.email.toLowerCase()),
        isNull(adminInvitations.acceptedAt),
        gt(adminInvitations.expiresAt, new Date()),
      ),
    );
  for (const invitation of pending) {
    await acceptInvitation(invitation, user.id);
  }
}
