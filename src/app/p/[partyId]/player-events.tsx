"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { usePartyEvents } from "@/lib/realtime/use-party-events";

// Keeps every player page up to date, and tells the player when one of
// their submissions is reviewed.
export function PlayerEvents({
  partyId,
  playerId,
}: {
  partyId: string;
  playerId: string;
}) {
  const t = useTranslations("PlayerEvents");

  usePartyEvents(
    partyId,
    [
      "party.updated",
      "team.updated",
      "player.joined",
      "player.updated",
      "challenge.updated",
      "challenge.started",
      "submission.created",
      "submission.reviewed",
      "score.updated",
    ],
    (event) => {
      if (event.type === "submission.reviewed" && event.playerId === playerId) {
        if (event.status === "approved") toast.success(t("approved"));
        else toast.error(t("rejected"));
      }
      if (event.type === "challenge.started") toast(t("flashStarted"));
    },
  );

  return null;
}
