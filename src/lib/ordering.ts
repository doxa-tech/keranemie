// Moves `id` one step up or down in an ordered list of ids.
export function moveInList(
  ids: string[],
  id: string,
  direction: "up" | "down",
): string[] {
  const index = ids.indexOf(id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
