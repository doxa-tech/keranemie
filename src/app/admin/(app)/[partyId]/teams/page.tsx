import { asc, count, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { TeamBadge } from "@/components/team-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import { players, teams } from "@/db/schema";
import { MoveButtons } from "../move-buttons";
import { moveTeam } from "./actions";
import { DeleteTeamButton } from "./delete-team-button";
import { TeamForm } from "./team-form";

export default async function TeamsPage({
  params,
}: PageProps<"/admin/[partyId]/teams">) {
  const { partyId } = await params;
  const t = await getTranslations("Teams");
  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      color: teams.color,
      emoji: teams.emoji,
      playerCount: count(players.id),
    })
    .from(teams)
    .leftJoin(players, eq(players.teamId, teams.id))
    .where(eq(teams.partyId, partyId))
    .groupBy(teams.id)
    .orderBy(asc(teams.position), asc(teams.name));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        ) : (
          <ul className="divide-y rounded-xl border" aria-label={t("title")}>
            {rows.map((team, index) => (
              <li
                key={team.id}
                className="flex flex-wrap items-center gap-2 px-3 py-2"
              >
                <TeamBadge team={team} />
                <span className="text-muted-foreground text-sm">
                  {t("players", { count: team.playerCount })}
                </span>
                <span className="ml-auto flex items-center gap-1">
                  <MoveButtons
                    canMoveUp={index > 0}
                    canMoveDown={index < rows.length - 1}
                    action={moveTeam.bind(null, partyId, team.id)}
                  />
                  <TeamForm
                    partyId={partyId}
                    team={team}
                    triggerLabel={t("edit")}
                  />
                  <DeleteTeamButton
                    partyId={partyId}
                    teamId={team.id}
                    teamName={team.name}
                  />
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-muted-foreground text-xs">{t("assignmentHint")}</p>
      </section>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>{t("add")}</CardTitle>
          <CardDescription>{t("addDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <TeamForm partyId={partyId} defaultColorIndex={rows.length} />
        </CardContent>
      </Card>
    </div>
  );
}
