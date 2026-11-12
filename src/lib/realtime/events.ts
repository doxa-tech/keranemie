// Events broadcast on the `party:{id}` channel after each write. They only
// signal that something changed; clients refetch what they display.
export type PartyEvent =
  | { type: "party.updated" }
  | { type: "team.updated" }
  | { type: "player.joined" }
  | { type: "player.updated" }
  | { type: "challenge.updated" }
  | { type: "challenge.started" }
  | { type: "submission.created" }
  | { type: "submission.reviewed"; playerId: string }
  | { type: "score.updated" };

export type PartyEventType = PartyEvent["type"];

export const BROADCAST_EVENT = "event";

export function partyChannel(partyId: string) {
  return `party:${partyId}`;
}
