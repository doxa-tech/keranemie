"use server";

import { getLocale } from "next-intl/server";
import { z } from "zod";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { requirePlayer } from "@/lib/auth";

const subscriptionInput = z.object({
  endpoint: z.url().max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(100),
  }),
});

export async function savePushSubscription(partyId: string, input: unknown) {
  const player = await requirePlayer(partyId);
  const parsed = subscriptionInput.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { endpoint, keys } = parsed.data;
  const locale = await getLocale();

  // One row per device: a device that joins another party moves its
  // subscription to the new player.
  await db
    .insert(pushSubscriptions)
    .values({ playerId: player.id, endpoint, ...keys, locale })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { playerId: player.id, ...keys, locale },
    });
  return { ok: true };
}
