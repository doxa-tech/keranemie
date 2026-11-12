"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BROADCAST_EVENT,
  partyChannel,
  type PartyEvent,
  type PartyEventType,
} from "./events";

const REFRESH_DELAY_MS = 300;

// Refreshes the current page when one of the given events is broadcast.
// `onEvent` runs first, e.g. to show a toast. Refreshes are grouped: a burst
// of events causes one refresh, not one per event.
export function usePartyEvents(
  partyId: string,
  types: PartyEventType[],
  onEvent?: (event: PartyEvent) => void,
) {
  const router = useRouter();
  const onEventRef = useRef(onEvent);
  const typesKey = types.join(",");

  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    const wanted = new Set(typesKey.split(","));
    let timer: ReturnType<typeof setTimeout> | undefined;
    const scheduleRefresh = () => {
      timer ??= setTimeout(() => {
        timer = undefined;
        router.refresh();
      }, REFRESH_DELAY_MS);
    };
    const supabase = createClient();
    const channel = supabase
      .channel(partyChannel(partyId))
      .on("broadcast", { event: BROADCAST_EVENT }, ({ payload }) => {
        const event = payload as PartyEvent;
        if (!wanted.has(event.type)) return;
        onEventRef.current?.(event);
        scheduleRefresh();
      })
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [partyId, typesKey, router]);
}
