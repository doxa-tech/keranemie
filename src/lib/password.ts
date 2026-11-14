import { createHash, timingSafeEqual } from "node:crypto";

// Constant-time comparison of a typed password with the configured one.
// Nothing matches when no password is configured.
export function passwordMatches(
  input: string,
  expected: string | undefined,
): boolean {
  if (!expected) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(input), digest(expected));
}
