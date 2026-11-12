"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

// Ticks every second until `to`, then refreshes the page once so the
// server renders the new state (party started, flash challenge over...).
export function Countdown({
  to,
  refreshAtEnd = true,
}: {
  to: string;
  refreshAtEnd?: boolean;
}) {
  const t = useTranslations("Common");
  const router = useRouter();
  const target = new Date(to).getTime();
  const now = useSyncExternalStore(subscribeToClock, Date.now, () => null);
  const remaining = now === null ? null : Math.max(0, target - now);
  const refreshed = useRef(false);

  useEffect(() => {
    if (remaining === 0 && refreshAtEnd && !refreshed.current) {
      refreshed.current = true;
      router.refresh();
    }
  }, [remaining, refreshAtEnd, router]);

  return (
    <time dateTime={to} className="font-mono tabular-nums">
      {remaining === null ? "--:--" : formatDuration(remaining, t("daysShort"))}
    </time>
  );
}

let clockListeners: (() => void)[] = [];
let clockTimer: ReturnType<typeof setInterval> | undefined;

// One shared timer for every countdown on the page.
function subscribeToClock(onTick: () => void) {
  clockListeners.push(onTick);
  clockTimer ??= setInterval(() => clockListeners.forEach((l) => l()), 1000);
  return () => {
    clockListeners = clockListeners.filter((l) => l !== onTick);
    if (clockListeners.length === 0) {
      clearInterval(clockTimer);
      clockTimer = undefined;
    }
  };
}

// "05:09", "1:02:05", or with days ("3d 04:02:05") beyond 24 hours.
export function formatDuration(ms: number, daysUnit = "d"): string {
  const total = Math.ceil(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (days > 0) {
    return `${days}${daysUnit} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}
