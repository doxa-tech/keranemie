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

// Refreshes the current page when one of the given events is broadcast.
// `onEvent` runs first, e.g. to show a toast.
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
    const supabase = createClient();
    const channel = supabase
      .channel(partyChannel(partyId))
      .on("broadcast", { event: BROADCAST_EVENT }, ({ payload }) => {
        const event = payload as PartyEvent;
        if (!wanted.has(event.type)) return;
        onEventRef.current?.(event);
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partyId, typesKey, router]);
}
