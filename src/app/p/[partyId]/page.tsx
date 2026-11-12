import { getFormatter, getTranslations } from "next-intl/server";
import { Countdown } from "@/components/countdown";
import { TeamBadge } from "@/components/team-badge";
import { requirePlayer } from "@/lib/auth";
import { partyStatus } from "@/lib/game/party";
import { getParty } from "@/lib/parties";
import { getPlayerTeam } from "@/lib/players";

export default async function PlayerHome({
  params,
}: PageProps<"/p/[partyId]">) {
  const { partyId } = await params;
  const player = await requirePlayer(partyId);
  const party = (await getParty(partyId))!;
  const team = await getPlayerTeam(player.teamId);
  const t = await getTranslations("Player");
  const format = await getFormatter();
  const status = partyStatus(party, new Date());

  if (status === "open" || status === "draft") {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div className="space-y-2">
          <p className="text-muted-foreground">{t("yourTeam")}</p>
          {team && <TeamBadge team={team} className="px-4 py-1.5 text-lg" />}
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground">{t("startsIn")}</p>
          <p className="text-4xl font-semibold">
            <Countdown to={party.startsAt.toISOString()} />
          </p>
          <p className="text-muted-foreground text-sm">
            {format.dateTime(party.startsAt, {
              weekday: "long",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <p className="text-muted-foreground max-w-xs text-sm">
          {t("waitingHint")}
        </p>
      </div>
    );
  }

  if (status === "ended") {
    return <p className="py-8 text-center">{t("ended")}</p>;
  }

  // Live: challenges come in phase 4.
  return <p className="py-8 text-center">{t("live")}</p>;
}
