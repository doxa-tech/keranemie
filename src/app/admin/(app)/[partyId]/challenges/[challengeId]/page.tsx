import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTimeZone, getTranslations } from "next-intl/server";
import { db } from "@/db";
import { challenges } from "@/db/schema";
import { toLocalInputValue } from "@/lib/dates";
import { isUuid } from "@/lib/ids";
import { updateChallenge } from "../actions";
import { ChallengeForm } from "../challenge-form";

export default async function EditChallengePage({
  params,
}: PageProps<"/admin/[partyId]/challenges/[challengeId]">) {
  const { partyId, challengeId } = await params;
  if (!isUuid(challengeId)) notFound();
  const [challenge] = await db
    .select()
    .from(challenges)
    .where(
      and(eq(challenges.id, challengeId), eq(challenges.partyId, partyId)),
    );
  if (!challenge) notFound();
  const t = await getTranslations("Challenges");
  const timeZone = await getTimeZone();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        {t("editTitle", { title: challenge.title })}
      </h2>
      <p className="text-muted-foreground text-sm">{t("editPointsHint")}</p>
      <ChallengeForm
        action={updateChallenge.bind(null, partyId, challengeId)}
        submitLabel={t("save")}
        defaults={{
          title: challenge.title,
          description: challenge.description,
          type: challenge.type,
          points: String(challenge.points),
          validation: challenge.validation,
          expectedAnswer: challenge.expectedAnswer ?? "",
          kind: challenge.kind,
          flashStartsAt: challenge.flashStartsAt
            ? toLocalInputValue(challenge.flashStartsAt, timeZone)
            : "",
          flashDurationMin: String(challenge.flashDurationMin ?? 15),
        }}
      />
    </div>
  );
}
