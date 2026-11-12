// Team colors: distinct from each other and readable with white text.
export const TEAM_COLORS = [
  "#dc2626", // red
  "#2563eb", // blue
  "#16a34a", // green
  "#9333ea", // purple
  "#ea580c", // orange
  "#0891b2", // cyan
  "#db2777", // pink
  "#4d7c0f", // olive
] as const;

export function isTeamColor(value: string): boolean {
  return (TEAM_COLORS as readonly string[]).includes(value);
}
