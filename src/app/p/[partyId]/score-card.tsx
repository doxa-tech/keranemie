import { useTranslations } from "next-intl";

export function ScoreCard({
  playerScore,
  teamScore,
  teamName,
}: {
  playerScore: number;
  teamScore: number;
  teamName: string;
}) {
  const t = useTranslations("Player");

  return (
    <dl className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border p-3">
        <dt className="text-muted-foreground text-xs">{t("myScore")}</dt>
        <dd className="text-2xl font-semibold" data-testid="player-score">
          {playerScore}
        </dd>
      </div>
      <div className="rounded-xl border p-3">
        <dt className="text-muted-foreground truncate text-xs">
          {t("teamScore", { team: teamName })}
        </dt>
        <dd className="text-2xl font-semibold" data-testid="team-score">
          {teamScore}
        </dd>
      </div>
    </dl>
  );
}
