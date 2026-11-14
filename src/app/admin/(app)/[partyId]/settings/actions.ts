"use server";

import { randomBytes } from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { adminInvitations, parties, partyAdmins } from "@/db/schema";
import { requireOwner, requirePartyAdmin } from "@/lib/auth";
import { partyStatus, plannedDurationMin } from "@/lib/game/party";
import {
  parsePartyForm,
  partyFormError,
  submittedValues,
  type PartyFormState,
} from "@/lib/party-form";
import { getParty } from "@/lib/parties";
import { broadcast } from "@/lib/realtime/server";

const INVITATION_DAYS = 7;

export async function updateParty(
  partyId: string,
  _prev: PartyFormState,
  formData: FormData,
): Promise<PartyFormState> {
  await requirePartyAdmin(partyId);
  const parsed = parsePartyForm(formData);
  if (!parsed.success) {
    return {
      error: partyFormError(parsed.error),
      values: submittedValues(formData),
    };
  }
  const { name, description, startsAt, endsAt, durationMin } = parsed.data;
  await db
    .update(parties)
    .set({
      name,
      description: description || null,
      startsAt,
      endsAt,
      durationMin,
    })
    .where(eq(parties.id, partyId));
  await broadcast(partyId, { type: "party.updated" });
  return { saved: true };
}

// Lifecycle: each step sets one timestamp to now (see partyStatus).
export async function openParty(partyId: string) {
  await requirePartyAdmin(partyId);
  await db
    .update(parties)
    .set({ openedAt: new Date() })
    .where(and(eq(parties.id, partyId), isNull(parties.openedAt)));
  await afterLifecycleChange(partyId);
}

export async function startPartyNow(partyId: string) {
  await requirePartyAdmin(partyId);
  const party = await getParty(partyId);
  const now = new Date();
  if (!party || partyStatus(party, now) !== "open") return;
  // The planned duration counts from now; without one, the party runs
  // until "End now".
  const durationMin = plannedDurationMin(party);
  await db
    .update(parties)
    .set({
      startsAt: now,
      endsAt: durationMin ? new Date(now.getTime() + durationMin * 60_000) : null,
      durationMin,
    })
    .where(eq(parties.id, partyId));
  await afterLifecycleChange(partyId);
}

export async function endPartyNow(partyId: string) {
  await requirePartyAdmin(partyId);
  const party = await getParty(partyId);
  const now = new Date();
  if (!party || partyStatus(party, now) !== "live") return;
  await db.update(parties).set({ endsAt: now }).where(eq(parties.id, partyId));
  await afterLifecycleChange(partyId);
}

async function afterLifecycleChange(partyId: string) {
  await broadcast(partyId, { type: "party.updated" });
  refresh();
}

export async function deleteParty(partyId: string) {
  await requireOwner(partyId);
  await db.delete(parties).where(eq(parties.id, partyId));
  redirect("/admin");
}

export type InviteState = {
  error?: "invalid" | "alreadyAdmin";
  invited?: string;
};

export async function inviteAdmin(
  partyId: string,
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const owner = await requireOwner(partyId);
  const parsed = z.email().safeParse(
    String(formData.get("email") ?? "").trim().toLowerCase(),
  );
  if (!parsed.success) return { error: "invalid" };
  const email = parsed.data;

  const [existing] = await db
    .select({ userId: partyAdmins.userId })
    .from(partyAdmins)
    .innerJoin(authUsers, eq(authUsers.id, partyAdmins.userId))
    .where(
      and(
        eq(partyAdmins.partyId, partyId),
        sql`lower(${authUsers.email}) = ${email}`,
      ),
    );
  if (existing) return { error: "alreadyAdmin" };

  const expiresAt = new Date(Date.now() + INVITATION_DAYS * 86400_000);
  const [pending] = await db
    .select({ id: adminInvitations.id })
    .from(adminInvitations)
    .where(
      and(
        eq(adminInvitations.partyId, partyId),
        eq(adminInvitations.email, email),
        isNull(adminInvitations.acceptedAt),
        gt(adminInvitations.expiresAt, new Date()),
      ),
    );
  if (pending) {
    await db
      .update(adminInvitations)
      .set({ expiresAt })
      .where(eq(adminInvitations.id, pending.id));
  } else {
    await db.insert(adminInvitations).values({
      partyId,
      email,
      token: randomBytes(24).toString("base64url"),
      invitedBy: owner.user.id,
      expiresAt,
    });
  }
  refresh();
  return { invited: email };
}

export async function revokeInvitation(partyId: string, invitationId: string) {
  await requireOwner(partyId);
  await db
    .delete(adminInvitations)
    .where(
      and(
        eq(adminInvitations.id, invitationId),
        eq(adminInvitations.partyId, partyId),
      ),
    );
  refresh();
}

export async function removeAdmin(partyId: string, userId: string) {
  await requireOwner(partyId);
  // The owner can't be removed.
  await db
    .delete(partyAdmins)
    .where(
      and(
        eq(partyAdmins.partyId, partyId),
        eq(partyAdmins.userId, userId),
        eq(partyAdmins.role, "admin"),
      ),
    );
  refresh();
}
