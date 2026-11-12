// Returns `path` if it is a path of this app, so it can be used as a
// redirect target without sending users to another site.
export function safePath(path: unknown): string | undefined {
  if (typeof path !== "string") return undefined;
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return undefined;
  }
  return path;
}
