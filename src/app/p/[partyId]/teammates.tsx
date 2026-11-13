import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

// The players of the player's team, the player included.
export function Teammates({
  players,
  playerId,
  className,
}: {
  players: { id: string; displayName: string }[];
  playerId: string;
  className?: string;
}) {
  const t = useTranslations("Player");

  if (players.length <= 1) {
    return <p className="text-muted-foreground text-sm">{t("aloneInTeam")}</p>;
  }
  return (
    <ul
      className={cn("flex flex-wrap gap-1.5", className)}
      aria-label={t("teammates")}
    >
      {players.map((p) => (
        <li
          key={p.id}
          className={cn(
            "bg-muted max-w-full truncate rounded-full px-2.5 py-0.5 text-sm",
            p.id === playerId && "font-medium",
          )}
        >
          {p.displayName}
          {p.id === playerId && (
            <span className="text-muted-foreground"> ({t("you")})</span>
          )}
        </li>
      ))}
    </ul>
  );
}
