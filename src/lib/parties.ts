import "server-only";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";
import { cache } from "react";
import { db } from "@/db";
import { adminInvitations, parties, partyAdmins } from "@/db/schema";

export const getParty = cache(async (partyId: string) => {
  const [party] = await db
    .select()
    .from(parties)
    .where(eq(parties.id, partyId));
  return party ?? null;
});

export async function getPartyByCode(joinCode: string) {
  const [party] = await db
    .select()
    .from(parties)
    .where(eq(parties.joinCode, joinCode));
  return party ?? null;
}

export async function listAdminParties(userId: string) {
  return db
    .select({ party: parties, role: partyAdmins.role })
    .from(partyAdmins)
    .innerJoin(parties, eq(parties.id, partyAdmins.partyId))
    .where(eq(partyAdmins.userId, userId))
    .orderBy(desc(parties.startsAt));
}

export function joinUrl(joinCode: string) {
  return `${process.env.APP_URL}/join/${joinCode}`;
}

export async function listPartyAdmins(partyId: string) {
  return db
    .select({
      userId: partyAdmins.userId,
      role: partyAdmins.role,
      email: authUsers.email,
    })
    .from(partyAdmins)
    .innerJoin(authUsers, eq(authUsers.id, partyAdmins.userId))
    .where(eq(partyAdmins.partyId, partyId))
    .orderBy(partyAdmins.createdAt);
}

export async function listPendingInvitations(partyId: string) {
  return db
    .select()
    .from(adminInvitations)
    .where(
      and(
        eq(adminInvitations.partyId, partyId),
        isNull(adminInvitations.acceptedAt),
        gt(adminInvitations.expiresAt, new Date()),
      ),
    )
    .orderBy(adminInvitations.email);
}

export function inviteUrl(token: string) {
  return `${process.env.APP_URL}/invite/${token}`;
}
