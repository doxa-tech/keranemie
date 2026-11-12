import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Countdown } from "@/components/countdown";
import {
  RejectionReason,
  SubmissionStatus,
} from "@/components/submission-status";
import { Badge } from "@/components/ui/badge";
import { requirePlayer } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { getParty } from "@/lib/parties";
import { signedPhotoUrls } from "@/lib/photos";
import { getPlayerChallenge } from "@/lib/submissions";
import { PhotoForm } from "./photo-form";
import { TextForm } from "./text-form";

export default async function ChallengePage({
  params,
}: PageProps<"/p/[partyId]/challenges/[challengeId]">) {
  const { partyId, challengeId } = await params;
  if (!isUuid(challengeId)) notFound();
  const player = await requirePlayer(partyId);
  const party = (await getParty(partyId))!;
  const item = await getPlayerChallenge(party, player, challengeId);
  if (!item) notFound();
  const { challenge, active, latest, available, endsAt } = item;
  const t = await getTranslations("Challenge");
  const tf = await getTranslations("ChallengeForm");
  const shown = active ?? latest;
  const photoUrl = shown?.photoPath
    ? (await signedPhotoUrls([shown.photoPath])).get(shown.photoPath)
    : undefined;

  return (
    <div className="space-y-6">
      <Link
        href={`/p/${partyId}`}
        className="text-muted-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeftIcon className="size-4" />
        {t("back")}
      </Link>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{tf(`types.${challenge.type}`)}</Badge>
          <Badge variant="outline">
            {t("points", { count: challenge.points })}
          </Badge>
          {challenge.kind === "flash" && endsAt && available && (
            <Badge>
              {t("endsIn")}&nbsp;
              <Countdown to={endsAt.toISOString()} />
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {challenge.title}
        </h1>
        {challenge.description && (
          <p className="whitespace-pre-line">{challenge.description}</p>
        )}
      </div>

      {shown && (
        <section className="space-y-2 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-medium">{t("yourSubmission")}</h2>
            <SubmissionStatus submission={shown} />
          </div>
          <RejectionReason submission={shown} />
          {shown.textAnswer && (
            <p className="whitespace-pre-line">{shown.textAnswer}</p>
          )}
          {photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
            <img
              src={photoUrl}
              alt={shown.caption ?? challenge.title}
              className="max-h-96 w-full rounded-lg object-contain"
            />
          )}
          {shown.caption && (
            <p className="text-muted-foreground text-sm">{shown.caption}</p>
          )}
        </section>
      )}

      {!active &&
        (available ? (
          <section className="space-y-3">
            {latest?.status === "rejected" && (
              <p className="text-muted-foreground text-sm">{t("tryAgain")}</p>
            )}
            {challenge.type === "text" ? (
              <TextForm partyId={partyId} challengeId={challengeId} />
            ) : (
              <PhotoForm partyId={partyId} challengeId={challengeId} />
            )}
          </section>
        ) : (
          <p className="text-muted-foreground">{t("unavailable")}</p>
        ))}
    </div>
  );
}
