"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Refreshes the page at a given time, e.g. when a flash challenge starts
// or ends. Browsers cap timers, so long waits are re-armed.
export function RefreshAt({ at }: { at: string | null }) {
  const router = useRouter();

  useEffect(() => {
    if (!at) return;
    const MAX_DELAY = 2 ** 31 - 1;
    const delay = new Date(at).getTime() - Date.now() + 500;
    if (delay <= 0) return;
    const timer = setTimeout(
      () => router.refresh(),
      Math.min(delay, MAX_DELAY),
    );
    return () => clearTimeout(timer);
  }, [at, router]);

  return null;
}
