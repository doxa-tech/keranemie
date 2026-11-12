import "server-only";
import { eq, inArray } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { sendNotification, setVapidDetails } from "web-push";
import { db } from "@/db";
import { players, pushSubscriptions } from "@/db/schema";
import { isLocale, type Locale } from "@/i18n/config";

type Subscription = typeof pushSubscriptions.$inferSelect;

export type PushMessage = {
  // Keys in the "Push" translations, rendered in each device's language.
  titleKey: string;
  bodyKey: string;
  values?: Record<string, string | number>;
  url: string;
};

let configured = false;

function configure() {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@keranemie.local",
    publicKey,
    privateKey,
  );
  configured = true;
  return true;
}

export async function pushToPlayer(playerId: string, message: PushMessage) {
  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.playerId, playerId));
  await send(subscriptions, message);
}

export async function pushToParty(partyId: string, message: PushMessage) {
  const subscriptions = await db
    .select({ subscription: pushSubscriptions })
    .from(pushSubscriptions)
    .innerJoin(players, eq(players.id, pushSubscriptions.playerId))
    .where(eq(players.partyId, partyId));
  await send(
    subscriptions.map((s) => s.subscription),
    message,
  );
}

// Sends to every device, never throws. Subscriptions the push service
// reports as gone are deleted.
async function send(subscriptions: Subscription[], message: PushMessage) {
  if (subscriptions.length === 0 || !configure()) return;
  const payloads = new Map<Locale, string>();
  const gone: string[] = [];

  await Promise.all(
    subscriptions.map(async (subscription) => {
      const locale = isLocale(subscription.locale) ? subscription.locale : "en";
      if (!payloads.has(locale)) {
        const t = await getTranslations({ locale, namespace: "Push" });
        payloads.set(
          locale,
          JSON.stringify({
            title: t(message.titleKey, message.values),
            body: t(message.bodyKey, message.values),
            url: message.url,
          }),
        );
      }
      try {
        await sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payloads.get(locale)!,
          { TTL: 60 * 30, urgency: "high" },
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) gone.push(subscription.id);
        else console.error("Push failed", status ?? error);
      }
    }),
  );

  if (gone.length > 0) {
    await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, gone));
  }
}
