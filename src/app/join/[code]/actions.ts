"use server";

import { and, count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { parties, players, teams } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { isUniqueViolation } from "@/lib/db-errors";
import { canJoin, normalizeJoinCode, partyStatus } from "@/lib/game/party";
import { pickTeam } from "@/lib/game/team";
import { broadcast } from "@/lib/realtime/server";
import { createClient } from "@/lib/supabase/server";

export type JoinState = {
  error?: "invalid" | "duplicateName" | "closed" | "noTeams" | "failed";
  name?: string;
};

export async function joinParty(
  code: string,
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const rawName = String(formData.get("name") ?? "");
  const parsed = z.string().trim().min(1).max(30).safeParse(rawName);
  if (!parsed.success) return { error: "invalid", name: rawName };
  const displayName = parsed.data.replace(/\s+/g, " ");

  // Players don't have accounts: an anonymous session identifies the device.
  let user = await getUser();
  if (!user) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) {
      console.error("Anonymous sign-in failed", error?.message);
      return { error: "failed", name: rawName };
    }
    user = {
      id: data.user.id,
      email: null,
      isAnonymous: true,
      approvedAdmin: false,
    };
  }
  const userId = user.id;

  let result: JoinState | { partyId: string };
  try {
    result = await db.transaction(async (tx) => {
      // Lock the party so concurrent joins see each other's team counts.
      const [party] = await tx
        .select()
        .from(parties)
        .where(eq(parties.joinCode, normalizeJoinCode(code)))
        .for("update");
      if (!party || !canJoin(partyStatus(party, new Date()))) {
        return { error: "closed" as const };
      }

      const [existing] = await tx
        .select({ id: players.id })
        .from(players)
        .where(and(eq(players.partyId, party.id), eq(players.userId, userId)));
      if (existing) return { partyId: party.id };

      const teamCounts = await tx
        .select({ id: teams.id, playerCount: count(players.id) })
        .from(teams)
        .leftJoin(players, eq(players.teamId, teams.id))
        .where(eq(teams.partyId, party.id))
        .groupBy(teams.id);
      const team = pickTeam(teamCounts);
      if (!team) return { error: "noTeams" as const };

      await tx
        .insert(players)
        .values({ partyId: party.id, teamId: team.id, userId, displayName });
      return { partyId: party.id };
    });
  } catch (error) {
    if (isUniqueViolation(error, "players_party_id_display_name_key")) {
      return { error: "duplicateName", name: rawName };
    }
    throw error;
  }

  if (!("partyId" in result)) return { ...result, name: rawName };
  await broadcast(result.partyId, { type: "player.joined" });
  redirect(`/p/${result.partyId}`);
}
