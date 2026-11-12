import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { challenges, parties, players, submissions } from "@/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";
import {
  flashEndsAt,
  isChallengeAvailable,
  validateSubmission,
} from "@/lib/game/challenge";
import { broadcast } from "@/lib/realtime/server";

type Challenge = typeof challenges.$inferSelect;
type Submission = typeof submissions.$inferSelect;
type Party = typeof parties.$inferSelect;
type Player = typeof players.$inferSelect;

export type PlayerChallenge = {
  challenge: Challenge;
  // The pending or approved submission, if any.
  active: Submission | null;
  // The most recent submission, whatever its status.
  latest: Submission | null;
  available: boolean;
  endsAt: Date | null;
};

// The visible challenges of a party, with the player's submissions.
export async function listPlayerChallenges(
  party: Party,
  player: Player,
  now = new Date(),
): Promise<PlayerChallenge[]> {
  const [challengeRows, submissionRows] = await Promise.all([
    db
      .select()
      .from(challenges)
      .where(and(eq(challenges.partyId, party.id), eq(challenges.hidden, false)))
      .orderBy(asc(challenges.position), asc(challenges.createdAt)),
    db
      .select()
      .from(submissions)
      .where(eq(submissions.playerId, player.id))
      .orderBy(desc(submissions.createdAt)),
  ]);

  return challengeRows.map((challenge) => {
    const mine = submissionRows.filter((s) => s.challengeId === challenge.id);
    return {
      challenge,
      active: mine.find((s) => s.status !== "rejected") ?? null,
      latest: mine[0] ?? null,
      available: isChallengeAvailable(challenge, party, now),
      endsAt: flashEndsAt(challenge),
    };
  });
}

export async function getPlayerChallenge(
  party: Party,
  player: Player,
  challengeId: string,
) {
  const list = await listPlayerChallenges(party, player);
  return list.find((c) => c.challenge.id === challengeId) ?? null;
}

export type SubmitResult =
  | { status: "approved" | "pending" | "rejected" }
  | { error: "unavailable" | "alreadyDone" };

// Records a submission and applies automatic validation.
export async function submit(
  party: Party,
  player: Player,
  challengeId: string,
  content: { textAnswer: string } | { photoPath: string; caption: string },
): Promise<SubmitResult> {
  const item = await getPlayerChallenge(party, player, challengeId);
  if (!item || !item.available) return { error: "unavailable" };
  if (item.active) return { error: "alreadyDone" };
  const { challenge } = item;

  const textAnswer = "textAnswer" in content ? content.textAnswer : null;
  if ((challenge.type === "text") !== (textAnswer !== null)) {
    return { error: "unavailable" };
  }
  const outcome = validateSubmission(challenge, textAnswer);

  try {
    await db.insert(submissions).values({
      partyId: party.id,
      challengeId,
      playerId: player.id,
      status: outcome.status,
      textAnswer,
      photoPath: "photoPath" in content ? content.photoPath : null,
      caption: "caption" in content ? content.caption || null : null,
      pointsAwarded: outcome.status === "approved" ? outcome.points : null,
      reviewMessage: null,
      reviewedAt: outcome.status === "pending" ? null : new Date(),
    });
  } catch (error) {
    // Two submissions at once: the unique index keeps only one.
    if (isUniqueViolation(error, "submissions_challenge_id_player_id_key")) {
      return { error: "alreadyDone" };
    }
    throw error;
  }

  await broadcast(party.id, { type: "submission.created" });
  return { status: outcome.status };
}
