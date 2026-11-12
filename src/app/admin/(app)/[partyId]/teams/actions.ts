"use server";

import { and, asc, count, eq, max } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { players, teams } from "@/db/schema";
import { requirePartyAdmin } from "@/lib/auth";
import { isUniqueViolation } from "@/lib/db-errors";
import { moveInList } from "@/lib/ordering";
import { broadcast } from "@/lib/realtime/server";
import { isTeamColor } from "@/lib/teams";

const teamInput = z.object({
  name: z.string().trim().min(1).max(40),
  color: z.string().refine(isTeamColor),
  emoji: z.string().trim().max(8),
});

export type TeamFormState = {
  error?: "invalid" | "duplicateName";
  saved?: number;
};

function parseTeamForm(formData: FormData) {
  return teamInput.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
    emoji: formData.get("emoji") ?? "",
  });
}

export async function createTeam(
  partyId: string,
  _prev: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  await requirePartyAdmin(partyId);
  const parsed = parseTeamForm(formData);
  if (!parsed.success) return { error: "invalid" };
  try {
    const [{ last }] = await db
      .select({ last: max(teams.position) })
      .from(teams)
      .where(eq(teams.partyId, partyId));
    await db.insert(teams).values({
      partyId,
      name: parsed.data.name,
      color: parsed.data.color,
      emoji: parsed.data.emoji || null,
      position: (last ?? -1) + 1,
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "duplicateName" };
    throw error;
  }
  await afterTeamsChange(partyId);
  return { saved: Date.now() };
}

export async function updateTeam(
  partyId: string,
  teamId: string,
  _prev: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  await requirePartyAdmin(partyId);
  const parsed = parseTeamForm(formData);
  if (!parsed.success) return { error: "invalid" };
  try {
    await db
      .update(teams)
      .set({
        name: parsed.data.name,
        color: parsed.data.color,
        emoji: parsed.data.emoji || null,
      })
      .where(and(eq(teams.id, teamId), eq(teams.partyId, partyId)));
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "duplicateName" };
    throw error;
  }
  await afterTeamsChange(partyId);
  return { saved: Date.now() };
}

export async function deleteTeam(
  partyId: string,
  teamId: string,
): Promise<{ error?: "hasPlayers" }> {
  await requirePartyAdmin(partyId);
  const [{ playerCount }] = await db
    .select({ playerCount: count() })
    .from(players)
    .where(eq(players.teamId, teamId));
  if (playerCount > 0) return { error: "hasPlayers" };
  await db
    .delete(teams)
    .where(and(eq(teams.id, teamId), eq(teams.partyId, partyId)));
  await afterTeamsChange(partyId);
  return {};
}

export async function moveTeam(
  partyId: string,
  teamId: string,
  direction: "up" | "down",
) {
  await requirePartyAdmin(partyId);
  await db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.partyId, partyId))
      .orderBy(asc(teams.position), asc(teams.name));
    const ids = moveInList(
      rows.map((r) => r.id),
      teamId,
      direction,
    );
    for (const [position, id] of ids.entries()) {
      await tx.update(teams).set({ position }).where(eq(teams.id, id));
    }
  });
  await afterTeamsChange(partyId);
}

async function afterTeamsChange(partyId: string) {
  await broadcast(partyId, { type: "team.updated" });
  refresh();
}
