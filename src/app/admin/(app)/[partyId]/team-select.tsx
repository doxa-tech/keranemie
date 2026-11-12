"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { NativeSelect } from "@/components/native-select";
import { movePlayer } from "./actions";

export function TeamSelect({
  partyId,
  playerId,
  playerName,
  teamId,
  teams,
}: {
  partyId: string;
  playerId: string;
  playerName: string;
  teamId: string;
  teams: { id: string; name: string }[];
}) {
  const t = useTranslations("Dashboard");
  const [pending, startTransition] = useTransition();

  return (
    <NativeSelect
      aria-label={t("moveTo", { name: playerName })}
      value={teamId}
      disabled={pending}
      className="h-7 w-auto text-xs"
      onChange={(e) => {
        const next = e.target.value;
        startTransition(() => movePlayer(partyId, playerId, next));
      }}
    >
      {teams.map((team) => (
        <option key={team.id} value={team.id}>
          {team.name}
        </option>
      ))}
    </NativeSelect>
  );
}
