import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { playerScores, teamScores } from "@/db/schema";

export async function getPlayerScore(playerId: string) {
  const [row] = await db
    .select({ score: playerScores.score })
    .from(playerScores)
    .where(eq(playerScores.playerId, playerId));
  return row?.score ?? 0;
}

export async function getTeamScore(teamId: string) {
  const [row] = await db
    .select({ score: teamScores.score })
    .from(teamScores)
    .where(eq(teamScores.teamId, teamId));
  return row?.score ?? 0;
}
