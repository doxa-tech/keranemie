import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { BROADCAST_EVENT, partyChannel, type PartyEvent } from "./events";

// Tells every open page of the party that something changed. Failures are
// logged, never thrown: the write already succeeded and pages still show
// fresh data on the next load.
export async function broadcast(partyId: string, event: PartyEvent) {
  const supabase = createAdminClient();
  const channel = supabase.channel(partyChannel(partyId));
  try {
    const result = await channel.httpSend(BROADCAST_EVENT, event);
    if (!result.success) {
      console.error("Broadcast failed", event.type, result.error);
    }
  } catch (error) {
    console.error("Broadcast failed", event.type, error);
  } finally {
    await supabase.removeChannel(channel);
  }
}
