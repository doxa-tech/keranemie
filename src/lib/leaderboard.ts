import "server-only";
import { and, asc, count, desc, eq, inArray, ne, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  challenges,
  players,
  playerScores,
  submissions,
  teams,
  teamScores,
} from "@/db/schema";

export async function teamLeaderboard(partyId: string) {
  return db
    .select({
      id: teams.id,
      name: teams.name,
      color: teams.color,
      emoji: teams.emoji,
      score: teamScores.score,
      playerCount: count(players.id),
    })
    .from(teams)
    .innerJoin(teamScores, eq(teamScores.teamId, teams.id))
    .leftJoin(players, eq(players.teamId, teams.id))
    .where(eq(teams.partyId, partyId))
    .groupBy(teams.id, teamScores.score)
    .orderBy(desc(teamScores.score), asc(teams.position));
}

export async function playerLeaderboard(partyId: string) {
  return db
    .select({
      id: players.id,
      displayName: players.displayName,
      score: playerScores.score,
      team: {
        id: teams.id,
        name: teams.name,
        color: teams.color,
        emoji: teams.emoji,
      },
    })
    .from(players)
    .innerJoin(playerScores, eq(playerScores.playerId, players.id))
    .innerJoin(teams, eq(teams.id, players.teamId))
    .where(eq(players.partyId, partyId))
    .orderBy(desc(playerScores.score), asc(players.displayName));
}

// Submissions with their player, team and challenge, newest first unless
// `oldestFirst`.
export async function listSubmissions(
  partyId: string,
  {
    status,
    excludeRejected,
    type,
    teamId,
    challengeId,
    limit = 50,
    oldestFirst = false,
  }: {
    status?: "pending" | "approved" | "rejected" | ("approved" | "rejected")[];
    excludeRejected?: boolean;
    type?: "photo" | "text";
    teamId?: string;
    challengeId?: string;
    limit?: number;
    oldestFirst?: boolean;
  } = {},
) {
  const filters: SQL[] = [eq(submissions.partyId, partyId)];
  if (typeof status === "string") filters.push(eq(submissions.status, status));
  if (Array.isArray(status)) filters.push(inArray(submissions.status, status));
  if (excludeRejected) filters.push(ne(submissions.status, "rejected"));
  if (type) filters.push(eq(challenges.type, type));
  if (teamId) filters.push(eq(players.teamId, teamId));
  if (challengeId) filters.push(eq(submissions.challengeId, challengeId));

  return db
    .select({
      submission: submissions,
      player: { id: players.id, displayName: players.displayName },
      team: {
        id: teams.id,
        name: teams.name,
        color: teams.color,
        emoji: teams.emoji,
      },
      challenge: {
        id: challenges.id,
        title: challenges.title,
        type: challenges.type,
        points: challenges.points,
      },
    })
    .from(submissions)
    .innerJoin(players, eq(players.id, submissions.playerId))
    .innerJoin(teams, eq(teams.id, players.teamId))
    .innerJoin(challenges, eq(challenges.id, submissions.challengeId))
    .where(and(...filters))
    .orderBy(
      oldestFirst ? asc(submissions.createdAt) : desc(submissions.createdAt),
    )
    .limit(limit);
}

export type SubmissionRow = Awaited<ReturnType<typeof listSubmissions>>[number];

export async function submissionCounts(partyId: string) {
  const rows = await db
    .select({ status: submissions.status, total: count() })
    .from(submissions)
    .where(eq(submissions.partyId, partyId))
    .groupBy(submissions.status);
  const byStatus = (status: string) =>
    rows.find((r) => r.status === status)?.total ?? 0;
  return { pending: byStatus("pending"), approved: byStatus("approved") };
}
