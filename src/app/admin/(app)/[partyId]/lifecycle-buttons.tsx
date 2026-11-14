import { getTranslations } from "next-intl/server";
import { ConfirmButton } from "@/components/confirm-button";
import type { PartyStatus } from "@/lib/game/party";
import { endPartyNow, openParty, startPartyNow } from "./settings/actions";

// The next lifecycle step of a party (open, start now, end now), shown in
// the settings and on the dashboard. Each step has its own key: otherwise
// React keeps the same dialog, still open, when the status changes.
export async function LifecycleButtons({
  partyId,
  status,
  size,
}: {
  partyId: string;
  status: PartyStatus;
  size?: "default" | "sm";
}) {
  const t = await getTranslations("Settings.lifecycle");
  if (status === "draft") {
    return (
      <ConfirmButton
        key="open"
        label={t("open")}
        title={t("openTitle")}
        description={t("openDescription")}
        action={openParty.bind(null, partyId)}
        size={size}
      />
    );
  }
  if (status === "open") {
    return (
      <ConfirmButton
        key="startNow"
        label={t("startNow")}
        title={t("startNowTitle")}
        description={t("startNowDescription")}
        action={startPartyNow.bind(null, partyId)}
        size={size}
      />
    );
  }
  if (status === "live") {
    return (
      <ConfirmButton
        key="endNow"
        label={t("endNow")}
        title={t("endNowTitle")}
        description={t("endNowDescription")}
        action={endPartyNow.bind(null, partyId)}
        variant="destructive"
        size={size}
      />
    );
  }
  return null;
}
