"use server";

import { and, asc, eq, max } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { challenges } from "@/db/schema";
import { requirePartyAdmin } from "@/lib/auth";
import {
  challengeFormError,
  parseChallengeForm,
  type ChallengeFormState,
} from "@/lib/challenge-form";
import { launchFlash } from "@/lib/flash-notifications";
import { moveInList } from "@/lib/ordering";
import { broadcast } from "@/lib/realtime/server";

export async function createChallenge(
  partyId: string,
  _prev: ChallengeFormState,
  formData: FormData,
): Promise<ChallengeFormState> {
  await requirePartyAdmin(partyId);
  const parsed = parseChallengeForm(formData);
  if (!parsed.success) return challengeFormError(formData, parsed.error);

  const [{ last }] = await db
    .select({ last: max(challenges.position) })
    .from(challenges)
    .where(eq(challenges.partyId, partyId));
  await db
    .insert(challenges)
    .values({ ...parsed.data, partyId, position: (last ?? -1) + 1 });
  await broadcast(partyId, { type: "challenge.updated" });
  redirect(`/admin/${partyId}/challenges`);
}

export async function updateChallenge(
  partyId: string,
  challengeId: string,
  _prev: ChallengeFormState,
  formData: FormData,
): Promise<ChallengeFormState> {
  await requirePartyAdmin(partyId);
  const parsed = parseChallengeForm(formData);
  if (!parsed.success) return challengeFormError(formData, parsed.error);

  const [current] = await db
    .select({ flashStartsAt: challenges.flashStartsAt })
    .from(challenges)
    .where(and(eq(challenges.id, challengeId), eq(challenges.partyId, partyId)));
  if (!current) redirect(`/admin/${partyId}/challenges`);

  // A new start time means a new start notification. Points already given
  // to submissions are not changed.
  const startChanged =
    current.flashStartsAt?.getTime() !== parsed.data.flashStartsAt?.getTime();
  await db
    .update(challenges)
    .set({
      ...parsed.data,
      ...(startChanged && { startNotifiedAt: null }),
    })
    .where(eq(challenges.id, challengeId));
  await broadcast(partyId, { type: "challenge.updated" });
  redirect(`/admin/${partyId}/challenges`);
}

export async function setChallengeHidden(
  partyId: string,
  challengeId: string,
  hidden: boolean,
) {
  await requirePartyAdmin(partyId);
  await db
    .update(challenges)
    .set({ hidden })
    .where(and(eq(challenges.id, challengeId), eq(challenges.partyId, partyId)));
  await afterChallengesChange(partyId);
}

// Starts a flash challenge now, for its configured duration.
export async function launchFlashNow(partyId: string, challengeId: string) {
  await requirePartyAdmin(partyId);
  await launchFlash(partyId, challengeId, new Date());
  await afterChallengesChange(partyId);
}

export async function deleteChallenge(partyId: string, challengeId: string) {
  await requirePartyAdmin(partyId);
  await db
    .delete(challenges)
    .where(and(eq(challenges.id, challengeId), eq(challenges.partyId, partyId)));
  await afterChallengesChange(partyId);
}

export async function moveChallenge(
  partyId: string,
  challengeId: string,
  direction: "up" | "down",
) {
  await requirePartyAdmin(partyId);
  await db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: challenges.id })
      .from(challenges)
      .where(eq(challenges.partyId, partyId))
      .orderBy(asc(challenges.position), asc(challenges.createdAt));
    const ids = moveInList(
      rows.map((r) => r.id),
      challengeId,
      direction,
    );
    for (const [position, id] of ids.entries()) {
      await tx.update(challenges).set({ position }).where(eq(challenges.id, id));
    }
  });
  await afterChallengesChange(partyId);
}

async function afterChallengesChange(partyId: string) {
  await broadcast(partyId, { type: "challenge.updated" });
  refresh();
}
