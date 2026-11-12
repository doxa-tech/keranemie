import { getTranslations } from "next-intl/server";
import { TeamBadge } from "@/components/team-badge";
import { requirePlayer } from "@/lib/auth";
import { playerLeaderboard, teamLeaderboard } from "@/lib/leaderboard";
import { cn } from "@/lib/utils";

export default async function LeaderboardPage({
  params,
}: PageProps<"/p/[partyId]/leaderboard">) {
  const { partyId } = await params;
  const player = await requirePlayer(partyId);
  const t = await getTranslations("Leaderboard");
  const [teams, players] = await Promise.all([
    teamLeaderboard(partyId),
    playerLeaderboard(partyId),
  ]);

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-xl font-semibold">{t("teams")}</h1>
        <ol className="divide-y rounded-xl border" aria-label={t("teams")}>
          {teams.map((team, index) => (
            <li
              key={team.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5",
                team.id === player.teamId && "bg-muted/60",
              )}
              aria-current={team.id === player.teamId ? "true" : undefined}
            >
              <Rank index={index} />
              <TeamBadge team={team} />
              <span className="ml-auto text-lg font-semibold tabular-nums">
                {team.score}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">{t("players")}</h2>
        <ol className="divide-y rounded-xl border" aria-label={t("players")}>
          {players.map((p, index) => (
            <li
              key={p.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2",
                p.id === player.id && "bg-muted/60 font-medium",
              )}
              aria-current={p.id === player.id ? "true" : undefined}
            >
              <Rank index={index} />
              <span className="min-w-0 flex-1 truncate">
                {p.displayName}
                {p.id === player.id && (
                  <span className="text-muted-foreground"> ({t("you")})</span>
                )}
              </span>
              <TeamBadge team={p.team} className="py-0" />
              <span className="w-10 text-right font-semibold tabular-nums">
                {p.score}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Rank({ index }: { index: number }) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <span className="w-6 text-center text-sm tabular-nums">
      {medals[index] ?? index + 1}
    </span>
  );
}
