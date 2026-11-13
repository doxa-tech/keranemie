import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
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

// Everyone in a team (the player included), in the order they joined.
export async function listTeammates(partyId: string, teamId: string) {
  return db
    .select({ id: players.id, displayName: players.displayName })
    .from(players)
    .where(and(eq(players.partyId, partyId), eq(players.teamId, teamId)))
    .orderBy(asc(players.createdAt), asc(players.id));
}
