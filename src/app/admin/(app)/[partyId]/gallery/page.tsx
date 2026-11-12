import { asc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { PartyEvents } from "@/components/party-events";
import { SubmissionContent } from "@/components/submission-content";
import { TeamBadge } from "@/components/team-badge";
import { db } from "@/db";
import { challenges, teams } from "@/db/schema";
import { isUuid } from "@/lib/ids";
import { listSubmissions } from "@/lib/leaderboard";
import { signedPhotoUrls } from "@/lib/photos";
import { GalleryFilters } from "./gallery-filters";

export default async function GalleryPage({
  params,
  searchParams,
}: PageProps<"/admin/[partyId]/gallery">) {
  const { partyId } = await params;
  const { team, challenge } = await searchParams;
  const teamId = typeof team === "string" && isUuid(team) ? team : undefined;
  const challengeId =
    typeof challenge === "string" && isUuid(challenge) ? challenge : undefined;
  const t = await getTranslations("Gallery");

  const [photos, teamRows, challengeRows] = await Promise.all([
    listSubmissions(partyId, {
      type: "photo",
      excludeRejected: true,
      teamId,
      challengeId,
      limit: 500,
    }),
    db
      .select({ id: teams.id, name: teams.name })
      .from(teams)
      .where(eq(teams.partyId, partyId))
      .orderBy(asc(teams.position)),
    db
      .select({ id: challenges.id, name: challenges.title })
      .from(challenges)
      .where(eq(challenges.partyId, partyId))
      .orderBy(asc(challenges.position)),
  ]);
  const photoUrls = await signedPhotoUrls(
    photos.map((p) => p.submission.photoPath),
  );

  return (
    <div className="space-y-4">
      <PartyEvents partyId={partyId} types={["submission.created"]} />
      <GalleryFilters
        teams={teamRows}
        challenges={challengeRows}
        teamId={teamId}
        challengeId={challengeId}
      />
      {photos.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      ) : (
        <ul
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          aria-label={t("title")}
        >
          {photos.map(({ submission, player, team, challenge }) => (
            <li key={submission.id} className="space-y-1.5">
              <SubmissionContent
                submission={submission}
                photoUrl={photoUrls.get(submission.photoPath!)}
                alt={`${challenge.title} · ${player.displayName}`}
                compact
              />
              <p className="truncate text-xs">
                <span className="font-medium">{challenge.title}</span>
              </p>
              <p className="flex items-center gap-1.5 truncate text-xs">
                <span className="text-muted-foreground truncate">
                  {player.displayName}
                </span>
                <TeamBadge team={team} className="py-0" />
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
