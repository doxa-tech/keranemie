import "server-only";
import { and, eq, isNull, lte } from "drizzle-orm";
import { db } from "@/db";
import { challenges, parties } from "@/db/schema";
import { isFlashStartDue } from "@/lib/game/challenge";
import { pushToParty } from "@/lib/push";
import { broadcast } from "@/lib/realtime/server";

// Announces every flash challenge that has started and wasn't announced
// yet. Safe to run concurrently or twice: each challenge is claimed by
// setting start_notified_at before anything is sent.
export async function announceStartedFlashChallenges(now = new Date()) {
  const candidates = await db
    .select({ challenge: challenges, party: parties })
    .from(challenges)
    .innerJoin(parties, eq(parties.id, challenges.partyId))
    .where(
      and(
        eq(challenges.kind, "flash"),
        eq(challenges.hidden, false),
        isNull(challenges.startNotifiedAt),
        lte(challenges.flashStartsAt, now),
      ),
    );

  let announced = 0;
  for (const { challenge, party } of candidates) {
    if (!isFlashStartDue(challenge, party, now)) continue;
    if (await announce(challenge.id, party.id, challenge.title, now)) {
      announced++;
    }
  }
  return announced;
}

// Announces one flash challenge right away (used by "Launch now").
export async function announceFlashChallenge(challengeId: string) {
  const now = new Date();
  const [row] = await db
    .select({ challenge: challenges, party: parties })
    .from(challenges)
    .innerJoin(parties, eq(parties.id, challenges.partyId))
    .where(eq(challenges.id, challengeId));
  if (!row || !isFlashStartDue(row.challenge, row.party, now)) return false;
  return announce(challengeId, row.party.id, row.challenge.title, now);
}

async function announce(
  challengeId: string,
  partyId: string,
  title: string,
  now: Date,
) {
  const [claimed] = await db
    .update(challenges)
    .set({ startNotifiedAt: now })
    .where(
      and(eq(challenges.id, challengeId), isNull(challenges.startNotifiedAt)),
    )
    .returning({ id: challenges.id });
  if (!claimed) return false;

  await broadcast(partyId, { type: "challenge.started" });
  await pushToParty(partyId, {
    titleKey: "flashTitle",
    bodyKey: "flashBody",
    values: { title },
    url: `/p/${partyId}/challenges/${challengeId}`,
  });
  return true;
}
