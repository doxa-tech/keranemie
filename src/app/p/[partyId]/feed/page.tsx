import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { SubmissionContent } from "@/components/submission-content";
import { TeamBadge } from "@/components/team-badge";
import { buttonVariants } from "@/components/ui/button";
import { requirePlayer } from "@/lib/auth";
import { listSubmissions } from "@/lib/leaderboard";
import { signedPhotoUrls } from "@/lib/photos";

const PAGE_SIZE = 20;
const MAX_ITEMS = 500;

export default async function FeedPage({
  params,
  searchParams,
}: PageProps<"/p/[partyId]/feed">) {
  const { partyId } = await params;
  await requirePlayer(partyId);
  const { limit: limitParam } = await searchParams;
  const limit = Math.min(
    MAX_ITEMS,
    Math.max(PAGE_SIZE, Number(limitParam) || PAGE_SIZE),
  );
  const t = await getTranslations("Feed");
  const format = await getFormatter();
  const now = new Date();
  // One extra row tells whether there is more to show.
  const rows = await listSubmissions(partyId, {
    status: "approved",
    limit: limit + 1,
  });
  const items = rows.slice(0, limit);
  const photoUrls = await signedPhotoUrls(
    items.map((r) => r.submission.photoPath),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      {items.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          {t("empty")}
        </p>
      ) : (
        <ul className="space-y-4" aria-label={t("title")}>
          {items.map(({ submission, player, team, challenge }) => (
            <li key={submission.id} className="space-y-2 rounded-xl border p-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{player.displayName}</span>
                <TeamBadge team={team} className="py-0" />
                <span className="text-muted-foreground ml-auto text-xs">
                  {format.relativeTime(submission.createdAt, now)}
                </span>
              </div>
              <p className="text-sm">
                {challenge.title}
                <span className="text-muted-foreground">
                  {" "}
                  · {t("points", { count: submission.pointsAwarded ?? 0 })}
                </span>
              </p>
              <SubmissionContent
                submission={submission}
                photoUrl={
                  submission.photoPath
                    ? photoUrls.get(submission.photoPath)
                    : undefined
                }
                alt={`${challenge.title} · ${player.displayName}`}
              />
            </li>
          ))}
        </ul>
      )}
      {rows.length > limit && limit < MAX_ITEMS && (
        <Link
          href={`/p/${partyId}/feed?limit=${limit + PAGE_SIZE}`}
          scroll={false}
          className={buttonVariants({ variant: "outline", className: "w-full" })}
        >
          {t("more")}
        </Link>
      )}
    </div>
  );
}
