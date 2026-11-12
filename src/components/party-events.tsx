"use client";

import type { PartyEventType } from "@/lib/realtime/events";
import { usePartyEvents } from "@/lib/realtime/use-party-events";

// Refreshes the page when one of `types` is broadcast for the party.
export function PartyEvents({
  partyId,
  types,
}: {
  partyId: string;
  types: PartyEventType[];
}) {
  usePartyEvents(partyId, types);
  return null;
}
