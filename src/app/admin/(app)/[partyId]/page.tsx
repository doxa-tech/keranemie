import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getFormatter, getTranslations } from "next-intl/server";
import { Countdown } from "@/components/countdown";
import { PartyEvents } from "@/components/party-events";
import { RefreshAt } from "@/components/refresh-at";
import { SubmissionStatus } from "@/components/submission-status";
import { TeamBadge } from "@/components/team-badge";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/db";
import { challenges } from "@/db/schema";
import {
  flashEndsAt,
  flashState,
  nextScheduledChange,
} from "@/lib/game/challenge";
import { partyStatus } from "@/lib/game/party";
import {
  listSubmissions,
  playerLeaderboard,
  submissionCounts,
  teamLeaderboard,
} from "@/lib/leaderboard";
import { getParty } from "@/lib/parties";
import { BonusDialog } from "./bonus-dialog";
import { TeamSelect } from "./team-select";

export default async function Dashboard({
  params,
}: PageProps<"/admin/[partyId]">) {
  const { partyId } = await params;
  const party = (await getParty(partyId))!;
  const t = await getTranslations("Dashboard");
  const format = await getFormatter();
  const now = new Date();
  const status = partyStatus(party, now);

  const [teams, players, activity, counts, challengeRows] = await Promise.all([
    teamLeaderboard(partyId),
    playerLeaderboard(partyId),
    listSubmissions(partyId, { limit: 15 }),
    submissionCounts(partyId),
    db
      .select()
      .from(challenges)
      .where(eq(challenges.partyId, partyId))
      .orderBy(asc(challenges.flashStartsAt)),
  ]);
  const flashes = challengeRows
    .filter((c) => c.kind === "flash" && !c.hidden)
    .map((c) => ({ ...c, state: flashState(c, now), endsAt: flashEndsAt(c) }))
    .filter((c) => c.state !== "over");
  const nextChange = nextScheduledChange(challengeRows, party.endsAt, now);
  const teamOptions = teams.map(({ id, name }) => ({ id, name }));
  const { pending, approved } = counts;

  return (
    <div className="space-y-6">
      <PartyEvents
        partyId={partyId}
        types={[
          "submission.created",
          "submission.reviewed",
          "player.joined",
          "player.updated",
          "score.updated",
        ]}
      />
      <RefreshAt
        at={(status === "open" ? party.startsAt : nextChange)?.toISOString() ?? null}
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span>
          {t("joinCode")}{" "}
          <span className="font-mono font-semibold">{party.joinCode}</span>
        </span>
        {status === "open" && (
          <span>
            {t("startsIn")} <Countdown to={party.startsAt.toISOString()} />
          </span>
        )}
        {status === "live" && (
          <span>
            {t("endsIn")} <Countdown to={party.endsAt.toISOString()} />
          </span>
        )}
        {status === "draft" && (
          <Link
            href={`/admin/${partyId}/settings`}
            className="underline underline-offset-4"
          >
            {t("draftHint")}
          </Link>
        )}
        <span className="ml-auto">
          <BonusDialog
            partyId={partyId}
            teams={teamOptions}
            players={players.map(({ id, displayName }) => ({ id, displayName }))}
          />
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label={t("players")} value={players.length} />
        <Stat
          label={t("toReview")}
          value={pending}
          href={`/admin/${partyId}/review`}
          testId="pending-count"
        />
        <Stat label={t("approved")} value={approved} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-2">
          <h2 className="font-semibold">{t("teamRanking")}</h2>
          {teams.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noTeams")}</p>
          ) : (
            <ol className="divide-y rounded-xl border" aria-label={t("teamRanking")}>
              {teams.map((team, index) => (
                <li key={team.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="text-muted-foreground w-5 text-right text-sm tabular-nums">
                    {index + 1}
                  </span>
                  <TeamBadge team={team} />
                  <span className="text-muted-foreground text-xs">
                    {t("playerCount", { count: team.playerCount })}
                  </span>
                  <span className="ml-auto font-semibold tabular-nums">
                    {team.score}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">{t("flashChallenges")}</h2>
          {flashes.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noFlash")}</p>
          ) : (
            <ul className="divide-y rounded-xl border">
              {flashes.map((c) => (
                <li key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{c.title}</span>
                  <span className="text-muted-foreground">
                    {c.state === "running" ? t("flashEndsIn") : t("flashStartsIn")}{" "}
                    <Countdown
                      to={(c.state === "running" ? c.endsAt! : c.flashStartsAt!).toISOString()}
                      refreshAtEnd={false}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">{t("playerRanking")}</h2>
          {players.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noPlayers")}</p>
          ) : (
            <ol
              className="max-h-[28rem] divide-y overflow-y-auto rounded-xl border"
              aria-label={t("playerRanking")}
            >
              {players.map((player, index) => (
                <li key={player.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="text-muted-foreground w-5 text-right text-sm tabular-nums">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {player.displayName}
                  </span>
                  <TeamSelect
                    partyId={partyId}
                    playerId={player.id}
                    playerName={player.displayName}
                    teamId={player.team.id}
                    teams={teamOptions}
                  />
                  <span className="w-10 text-right font-semibold tabular-nums">
                    {player.score}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">{t("activity")}</h2>
          {activity.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noActivity")}</p>
          ) : (
            <ul className="divide-y rounded-xl border" aria-label={t("activity")}>
              {activity.map(({ submission, player, team, challenge }) => (
                <li key={submission.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{player.displayName}</span>{" "}
                    <TeamBadge team={team} className="mx-1 align-middle" />
                    <span className="text-muted-foreground">{challenge.title}</span>
                  </span>
                  <span className="text-muted-foreground hidden text-xs sm:inline">
                    {format.relativeTime(submission.createdAt, now)}
                  </span>
                  <SubmissionStatus submission={submission} />
                </li>
              ))}
            </ul>
          )}
          {pending > 0 && (
            <Link
              href={`/admin/${partyId}/review`}
              className={buttonVariants({ size: "sm" })}
            >
              {t("reviewNow", { count: pending })}
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  testId,
}: {
  label: string;
  value: number;
  href?: string;
  testId?: string;
}) {
  const content = (
    <>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-2xl font-semibold tabular-nums" data-testid={testId}>
        {value}
      </p>
    </>
  );
  return href ? (
    <Link href={href} className="hover:bg-muted/50 rounded-xl border p-3">
      {content}
    </Link>
  ) : (
    <div className="rounded-xl border p-3">{content}</div>
  );
}
