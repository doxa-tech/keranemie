"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { bonuses, players, teams } from "@/db/schema";
import { requirePartyAdmin } from "@/lib/auth";
import { parseFlashLaunch } from "@/lib/flash-launch";
import { launchFlash } from "@/lib/flash-notifications";
import { broadcast } from "@/lib/realtime/server";

// Points follow the player: team scores add up current players' scores.
export async function movePlayer(
  partyId: string,
  playerId: string,
  teamId: string,
) {
  await requirePartyAdmin(partyId);
  const [team] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.partyId, partyId)));
  if (!team) return;
  await db
    .update(players)
    .set({ teamId })
    .where(and(eq(players.id, playerId), eq(players.partyId, partyId)));
  await broadcast(partyId, { type: "player.updated" });
  refresh();
}

const bonusInput = z.object({
  // "team:{id}" or "player:{id}"
  target: z.string().regex(/^(team|player):[0-9a-f-]{36}$/),
  points: z.coerce
    .number()
    .int()
    .min(-10_000)
    .max(10_000)
    .refine((p) => p !== 0),
  reason: z.string().trim().min(1).max(200),
});

export type BonusState = { error?: "invalid"; saved?: number };

export async function grantBonus(
  partyId: string,
  _prev: BonusState,
  formData: FormData,
): Promise<BonusState> {
  const { user } = await requirePartyAdmin(partyId);
  const parsed = bonusInput.safeParse({
    target: formData.get("target"),
    points: formData.get("points"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { error: "invalid" };
  const [kind, id] = parsed.data.target.split(":");

  const table = kind === "team" ? teams : players;
  const [target] = await db
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.id, id), eq(table.partyId, partyId)));
  if (!target) return { error: "invalid" };

  await db.insert(bonuses).values({
    partyId,
    teamId: kind === "team" ? id : null,
    playerId: kind === "player" ? id : null,
    points: parsed.data.points,
    reason: parsed.data.reason,
    createdBy: user.id,
  });
  await broadcast(partyId, { type: "score.updated" });
  refresh();
  return { saved: Date.now() };
}

export type LaunchFlashState = {
  error?: "invalid" | "past";
  saved?: number;
  started?: boolean;
};

// Starts a flash challenge now, after a timer or at a given time.
export async function scheduleFlash(
  partyId: string,
  challengeId: string,
  _prev: LaunchFlashState,
  formData: FormData,
): Promise<LaunchFlashState> {
  await requirePartyAdmin(partyId);
  const now = new Date();
  const launch = parseFlashLaunch(formData, now);
  if ("error" in launch) return { error: launch.error };
  if (!(await launchFlash(partyId, challengeId, launch.startsAt))) {
    return { error: "invalid" };
  }
  await broadcast(partyId, { type: "challenge.updated" });
  refresh();
  return { saved: Date.now(), started: launch.startsAt <= now };
}
