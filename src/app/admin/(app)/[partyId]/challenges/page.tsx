import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getFormatter, getTranslations } from "next-intl/server";
import { ConfirmButton } from "@/components/confirm-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/db";
import { challenges } from "@/db/schema";
import { flashEndsAt, flashState } from "@/lib/game/challenge";
import { MoveButtons } from "../move-buttons";
import {
  deleteChallenge,
  launchFlashNow,
  moveChallenge,
} from "./actions";
import { HiddenSwitch } from "./hidden-switch";

export default async function ChallengesPage({
  params,
}: PageProps<"/admin/[partyId]/challenges">) {
  const { partyId } = await params;
  const t = await getTranslations("Challenges");
  const tf = await getTranslations("ChallengeForm");
  const format = await getFormatter();
  const now = new Date();
  const rows = await db
    .select()
    .from(challenges)
    .where(eq(challenges.partyId, partyId))
    .orderBy(asc(challenges.position), asc(challenges.createdAt));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <Link
          href={`/admin/${partyId}/challenges/new`}
          className={buttonVariants()}
        >
          {t("add")}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      ) : (
        <ul className="divide-y rounded-xl border" aria-label={t("title")}>
          {rows.map((challenge, index) => {
            const state =
              challenge.kind === "flash" ? flashState(challenge, now) : null;
            return (
              <li key={challenge.id} className="space-y-2 px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{challenge.title}</span>
                  <Badge variant="secondary">
                    {tf(`types.${challenge.type}`)}
                  </Badge>
                  <Badge variant="outline">
                    {t("points", { count: challenge.points })}
                  </Badge>
                  {challenge.validation === "auto" && (
                    <Badge variant="outline">{tf("validations.auto")}</Badge>
                  )}
                  {challenge.kind === "flash" && (
                    <Badge>{t(`flash.${state!}`)}</Badge>
                  )}
                  {challenge.hidden && (
                    <Badge variant="destructive">{t("hidden")}</Badge>
                  )}
                </div>
                {challenge.kind === "flash" && challenge.flashStartsAt && (
                  <p className="text-muted-foreground text-sm">
                    {format.dateTimeRange(
                      challenge.flashStartsAt,
                      flashEndsAt(challenge)!,
                      { dateStyle: "short", timeStyle: "short" },
                    )}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-1">
                  <MoveButtons
                    canMoveUp={index > 0}
                    canMoveDown={index < rows.length - 1}
                    action={moveChallenge.bind(null, partyId, challenge.id)}
                  />
                  <HiddenSwitch
                    partyId={partyId}
                    challengeId={challenge.id}
                    hidden={challenge.hidden}
                  />
                  <Link
                    href={`/admin/${partyId}/challenges/${challenge.id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    {t("edit")}
                  </Link>
                  {challenge.kind === "flash" && state !== "running" && (
                    <ConfirmButton
                      label={t("launchNow")}
                      title={t("launchNowTitle", { title: challenge.title })}
                      description={t("launchNowDescription", {
                        minutes: challenge.flashDurationMin ?? 0,
                      })}
                      action={launchFlashNow.bind(null, partyId, challenge.id)}
                      variant="outline"
                      size="sm"
                    />
                  )}
                  <ConfirmButton
                    label={t("delete")}
                    title={t("deleteTitle", { title: challenge.title })}
                    description={t("deleteDescription")}
                    action={deleteChallenge.bind(null, partyId, challenge.id)}
                    variant="ghost"
                    size="sm"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
