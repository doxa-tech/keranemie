"use client";

import { BellIcon, XIcon } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { savePushSubscription } from "./push-actions";

const DISMISSED_KEY = "push-prompt-dismissed";

type Support = "unsupported" | "ios-browser" | "ready" | "subscribed";

// Registers the service worker and offers to turn on notifications. On an
// iPhone, web push only works once the app is added to the home screen.
export function PushPrompt({ partyId }: { partyId: string }) {
  const t = useTranslations("PushPrompt");
  const [support, setSupport] = useState<Support>("unsupported");
  const [dismissed, setDismissed] = useState(false);
  const [pending, setPending] = useState(false);
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    let cancelled = false;
    detectSupport().then(({ support, existing }) => {
      // Keeps the device's subscription attached to this player and their
      // current language.
      if (existing) savePushSubscription(partyId, existing.toJSON());
      if (!cancelled) setSupport(support);
    });
    return () => {
      cancelled = true;
    };
  }, [partyId]);

  if (!mounted || dismissed || readDismissed()) return null;
  if (support === "unsupported" || support === "subscribed") return null;

  async function enable() {
    setPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error(t("denied"));
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      const result = await savePushSubscription(partyId, subscription.toJSON());
      if (!result.ok) throw new Error("Subscription not saved");
      setSupport("subscribed");
      toast.success(t("enabled"));
    } catch (error) {
      console.error(error);
      toast.error(t("failed"));
    } finally {
      setPending(false);
    }
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Private browsing: the prompt comes back next time, that's fine.
    }
    setDismissed(true);
  }

  return (
    <div className="bg-muted/50 relative flex gap-3 rounded-xl border p-3 pr-9 text-sm">
      <BellIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="space-y-2">
        <p>{support === "ios-browser" ? t("iosHint") : t("description")}</p>
        {support === "ready" && (
          <Button size="sm" onClick={enable} disabled={pending}>
            {t("enable")}
          </Button>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        className="absolute top-2 right-2"
        aria-label={t("dismiss")}
        onClick={dismiss}
      >
        <XIcon />
      </Button>
    </div>
  );
}

async function detectSupport(): Promise<{
  support: Support;
  existing?: PushSubscription;
}> {
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  if (!("serviceWorker" in navigator)) return { support: "unsupported" };
  const registration = await navigator.serviceWorker.register("/sw.js");
  if (!("PushManager" in window) || !("Notification" in window)) {
    return { support: isIos && !standalone ? "ios-browser" : "unsupported" };
  }
  if (Notification.permission === "denied") return { support: "unsupported" };
  const existing = await registration.pushManager.getSubscription();
  if (existing && Notification.permission === "granted") {
    return { support: "subscribed", existing };
  }
  return { support: "ready" };
}

function readDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function noopSubscribe() {
  return () => {};
}
