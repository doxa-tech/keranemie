import "server-only";
import { desc, eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { parties, partyAdmins } from "@/db/schema";

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
