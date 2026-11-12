// Postgres unique violation, optionally on a given constraint or index.
// Drizzle wraps driver errors, so the Postgres error may be in `cause`.
export function isUniqueViolation(error: unknown, constraint?: string) {
  const pgError = findPgError(error);
  if (pgError?.code !== "23505") return false;
  return !constraint || pgError.constraint_name === constraint;
}

type PgError = { code?: string; constraint_name?: string };

function findPgError(error: unknown): PgError | undefined {
  let current: unknown = error;
  for (let depth = 0; current && depth < 5; depth++) {
    if (typeof current === "object" && "code" in current) {
      return current as PgError;
    }
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}
