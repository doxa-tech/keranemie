"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTimeZone } from "next-intl";
import { timeZoneCookie } from "@/i18n/config";

// Stores the device time zone in a cookie so the server formats dates in
// local time. Refreshes once if the server rendered with another zone.
export function TimeZoneSync() {
  const router = useRouter();
  const serverTimeZone = useTimeZone();

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone === serverTimeZone) return;
    document.cookie = `${timeZoneCookie}=${encodeURIComponent(timeZone)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [router, serverTimeZone]);

  return null;
}
