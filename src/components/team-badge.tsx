import { cn } from "@/lib/utils";

export function TeamBadge({
  team,
  className,
}: {
  team: { name: string; color: string; emoji: string | null };
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white",
        className,
      )}
      style={{ backgroundColor: team.color }}
    >
      {team.emoji && <span aria-hidden>{team.emoji}</span>}
      {team.name}
    </span>
  );
}
