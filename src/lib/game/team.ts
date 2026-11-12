// Picks the team with the fewest players; ties are broken randomly.
export function pickTeam<T extends { id: string; playerCount: number }>(
  teams: T[],
  random: () => number = Math.random,
): T | null {
  if (teams.length === 0) return null;
  const min = Math.min(...teams.map((t) => t.playerCount));
  const smallest = teams.filter((t) => t.playerCount === min);
  return smallest[Math.floor(random() * smallest.length)];
}
