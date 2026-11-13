import { getFormatter, getTranslations } from "next-intl/server";
import { Countdown } from "@/components/countdown";
import { TeamBadge } from "@/components/team-badge";
import { requirePlayer } from "@/lib/auth";
import { RefreshAt } from "@/components/refresh-at";
import { nextScheduledChange } from "@/lib/game/challenge";
import { partyStatus } from "@/lib/game/party";
import { getParty } from "@/lib/parties";
import { getPlayerTeam, listTeammates } from "@/lib/players";
import { getPlayerScore, getTeamScore } from "@/lib/scores";
import { listPlayerChallenges } from "@/lib/submissions";
import { ChallengeList } from "./challenge-list";
import { PushPrompt } from "./push-prompt";
import { ScoreCard } from "./score-card";
import { Teammates } from "./teammates";

export default async function PlayerHome({
  params,
}: PageProps<"/p/[partyId]">) {
  const { partyId } = await params;
  const player = await requirePlayer(partyId);
  const party = (await getParty(partyId))!;
  const [team, teammates] = await Promise.all([
    getPlayerTeam(player.teamId),
    listTeammates(partyId, player.teamId),
  ]);
  const t = await getTranslations("Player");
  const format = await getFormatter();
  const status = partyStatus(party, new Date());

  if (status === "open" || status === "draft") {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <PushPrompt partyId={partyId} />
        <div className="space-y-2">
          <p className="text-muted-foreground">{t("yourTeam")}</p>
          {team && <TeamBadge team={team} className="px-4 py-1.5 text-lg" />}
          <Teammates
            players={teammates}
            playerId={player.id}
            className="justify-center pt-2"
          />
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

  const [items, playerScore, teamScore] = await Promise.all([
    listPlayerChallenges(party, player),
    getPlayerScore(player.id),
    getTeamScore(player.teamId),
  ]);

  const nextChange = nextScheduledChange(
    items.map((i) => i.challenge),
    party.endsAt,
    new Date(),
  );

  return (
    <div className="space-y-6">
      <RefreshAt at={nextChange?.toISOString() ?? null} />
      {status !== "ended" && <PushPrompt partyId={partyId} />}
      {status === "ended" ? (
        <p className="rounded-xl border p-3 text-center">{t("ended")}</p>
      ) : (
        <p className="text-muted-foreground text-center text-sm">
          {t("endsIn")} <Countdown to={party.endsAt.toISOString()} />
        </p>
      )}
      <ScoreCard
        playerScore={playerScore}
        teamScore={teamScore}
        teamName={team?.name ?? ""}
      />
      <ChallengeList partyId={partyId} items={items} />
      <section className="space-y-2">
        <h2 className="font-semibold">{t("teammates")}</h2>
        <Teammates players={teammates} playerId={player.id} />
      </section>
    </div>
  );
}
