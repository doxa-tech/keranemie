"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteTeam } from "./actions";

export function DeleteTeamButton({
  partyId,
  teamId,
  teamName,
}: {
  partyId: string;
  teamId: string;
  teamName: string;
}) {
  const t = useTranslations("Teams");

  return (
    <ConfirmButton
      label={t("delete")}
      title={t("deleteTitle", { name: teamName })}
      variant="ghost"
      size="sm"
      action={async () => {
        const result = await deleteTeam(partyId, teamId);
        if (result.error) toast.error(t(`errors.${result.error}`));
      }}
    />
  );
}
