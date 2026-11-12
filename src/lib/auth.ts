import "server-only";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { partyAdmins, players } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string | null;
  isAnonymous: boolean;
};

// The signed-in user for this request, or null. Cached per request.
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return {
    id: claims.sub,
    email: claims.email ?? null,
    isAnonymous: claims.is_anonymous ?? false,
  };
});

// Admins are users signed in with their email (players are anonymous).
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getUser();
  if (!user || user.isAnonymous) redirect("/admin/login");
  return user;
}

export const getPartyAdmin = cache(async (partyId: string) => {
  const user = await getUser();
  if (!user || user.isAnonymous) return null;
  const [row] = await db
    .select()
    .from(partyAdmins)
    .where(
      and(eq(partyAdmins.partyId, partyId), eq(partyAdmins.userId, user.id)),
    );
  return row ? { user, role: row.role } : null;
});

export async function requirePartyAdmin(partyId: string) {
  const admin = await getPartyAdmin(partyId);
  if (!admin) {
    await requireAdmin();
    redirect("/admin");
  }
  return admin;
}

export async function requireOwner(partyId: string) {
  const admin = await requirePartyAdmin(partyId);
  if (admin.role !== "owner") redirect(`/admin/${partyId}`);
  return admin;
}

export const getPlayer = cache(async (partyId: string) => {
  const user = await getUser();
  if (!user) return null;
  const [player] = await db
    .select()
    .from(players)
    .where(and(eq(players.partyId, partyId), eq(players.userId, user.id)));
  return player ?? null;
});

export async function requirePlayer(partyId: string) {
  const player = await getPlayer(partyId);
  if (!player) redirect("/");
  return player;
}
