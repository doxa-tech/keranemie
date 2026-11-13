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

// (Re)starts a flash challenge at `startsAt`, for its configured duration,
// and makes it visible. A start that is already due is announced right away
// rather than by the next run of the scheduled job. The caller checks that
// the user is an admin of the party.
export async function launchFlash(
  partyId: string,
  challengeId: string,
  startsAt: Date,
) {
  const [launched] = await db
    .update(challenges)
    .set({ flashStartsAt: startsAt, startNotifiedAt: null, hidden: false })
    .where(
      and(
        eq(challenges.id, challengeId),
        eq(challenges.partyId, partyId),
        eq(challenges.kind, "flash"),
      ),
    )
    .returning({ id: challenges.id });
  if (!launched) return false;
  await announceFlashChallenge(challengeId);
  return true;
}

// Announces one flash challenge right away, if its start is due.
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
