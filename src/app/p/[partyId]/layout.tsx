import { notFound } from "next/navigation";
import { LanguageSwitch } from "@/components/language-switch";
import { TeamBadge } from "@/components/team-badge";
import { requirePlayer } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { getParty } from "@/lib/parties";
import { getPlayerTeam } from "@/lib/players";
import { PlayerEvents } from "./player-events";
import { PlayerNav } from "./player-nav";

export default async function PlayerLayout({
  children,
  params,
}: LayoutProps<"/p/[partyId]">) {
  const { partyId } = await params;
  if (!isUuid(partyId)) notFound();
  const player = await requirePlayer(partyId);
  const [party, team] = await Promise.all([
    getParty(partyId),
    getPlayerTeam(player.teamId),
  ]);
  if (!party) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-background/95 sticky top-[env(safe-area-inset-top,0px)] z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-xl items-center gap-2 px-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{party.name}</p>
            <p className="text-muted-foreground flex items-center gap-1.5 truncate text-xs">
              <span className="truncate">{player.displayName}</span>
              {team && <TeamBadge team={team} className="py-0" />}
            </p>
          </div>
          <LanguageSwitch />
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-6 pb-24">
        {children}
      </main>
      <PlayerNav partyId={partyId} />
      <PlayerEvents partyId={partyId} playerId={player.id} />
    </div>
  );
}
