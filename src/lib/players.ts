import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { parties, players, teams } from "@/db/schema";
import { partyStatus } from "@/lib/game/party";

// The party this device's user plays in and that isn't over, if any.
export async function findActivePlayerParty(userId: string) {
  const rows = await db
    .select({ party: parties })
    .from(players)
    .innerJoin(parties, eq(parties.id, players.partyId))
    .where(eq(players.userId, userId))
    .orderBy(desc(players.createdAt));
  const now = new Date();
  return rows.find(({ party }) => partyStatus(party, now) !== "ended")?.party;
}

export async function getPlayerTeam(teamId: string) {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  return team;
}
