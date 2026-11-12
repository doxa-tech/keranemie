"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { NativeSelect } from "@/components/native-select";
import { Label } from "@/components/ui/label";

type Option = { id: string; name: string };

export function GalleryFilters({
  teams,
  challenges,
  teamId,
  challengeId,
}: {
  teams: Option[];
  challenges: Option[];
  teamId?: string;
  challengeId?: string;
}) {
  const t = useTranslations("Gallery");
  const router = useRouter();
  const pathname = usePathname();

  function update(key: "team" | "challenge", value: string) {
    const params = new URLSearchParams();
    const next = { team: teamId, challenge: challengeId, [key]: value };
    if (next.team) params.set("team", next.team);
    if (next.challenge) params.set("challenge", next.challenge);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-wrap gap-4">
      <div className="space-y-1">
        <Label htmlFor="filter-team" className="text-xs">
          {t("team")}
        </Label>
        <NativeSelect
          id="filter-team"
          value={teamId ?? ""}
          onChange={(e) => update("team", e.target.value)}
          className="w-48"
        >
          <option value="">{t("allTeams")}</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1">
        <Label htmlFor="filter-challenge" className="text-xs">
          {t("challenge")}
        </Label>
        <NativeSelect
          id="filter-challenge"
          value={challengeId ?? ""}
          onChange={(e) => update("challenge", e.target.value)}
          className="w-56"
        >
          <option value="">{t("allChallenges")}</option>
          {challenges.map((challenge) => (
            <option key={challenge.id} value={challenge.id}>
              {challenge.name}
            </option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}
