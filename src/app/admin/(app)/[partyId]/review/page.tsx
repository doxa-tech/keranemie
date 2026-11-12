import { getFormatter, getTranslations } from "next-intl/server";
import { PartyEvents } from "@/components/party-events";
import { SubmissionContent } from "@/components/submission-content";
import { SubmissionStatus } from "@/components/submission-status";
import { TeamBadge } from "@/components/team-badge";
import { listSubmissions } from "@/lib/leaderboard";
import { signedPhotoUrls } from "@/lib/photos";
import { EditPoints, ReviewActions } from "./review-actions";

export default async function ReviewPage({
  params,
}: PageProps<"/admin/[partyId]/review">) {
  const { partyId } = await params;
  const t = await getTranslations("Review");
  const format = await getFormatter();
  const [pending, reviewed] = await Promise.all([
    listSubmissions(partyId, { status: "pending", oldestFirst: true }),
    listSubmissions(partyId, { status: ["approved", "rejected"], limit: 20 }),
  ]);
  const photoUrls = await signedPhotoUrls(
    [...pending, ...reviewed].map((r) => r.submission.photoPath),
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <PartyEvents partyId={partyId} types={["submission.created"]} />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {t("queue", { count: pending.length })}
        </h2>
        {pending.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        ) : (
          <ul className="space-y-4" aria-label={t("queueLabel")}>
            {pending.map(({ submission, player, team, challenge }) => (
              <li key={submission.id} className="space-y-3 rounded-xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{challenge.title}</span>
                  <span className="text-muted-foreground text-sm">
                    · {player.displayName}
                  </span>
                  <TeamBadge team={team} />
                  <span className="text-muted-foreground ml-auto text-xs">
                    {format.relativeTime(submission.createdAt)}
                  </span>
                </div>
                <SubmissionContent
                  submission={submission}
                  photoUrl={
                    submission.photoPath
                      ? photoUrls.get(submission.photoPath)
                      : undefined
                  }
                  alt={challenge.title}
                />
                <ReviewActions
                  partyId={partyId}
                  submissionId={submission.id}
                  defaultPoints={challenge.points}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("recent")}</h2>
        {reviewed.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noRecent")}</p>
        ) : (
          <ul className="divide-y rounded-xl border" aria-label={t("recent")}>
            {reviewed.map(({ submission, player, challenge }) => (
              <li key={submission.id} className="space-y-1.5 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm">
                    <span className="font-medium">{challenge.title}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {player.displayName}
                    </span>
                  </span>
                  <SubmissionStatus submission={submission} />
                </div>
                {submission.status === "approved" && (
                  <EditPoints
                    partyId={partyId}
                    submissionId={submission.id}
                    points={submission.pointsAwarded ?? 0}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
