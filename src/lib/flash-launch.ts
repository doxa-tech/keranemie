import { z } from "zod";

// A datetime-local value has minute precision: picking the current minute
// gives a time slightly in the past, which still counts as "now".
const PAST_TOLERANCE_MS = 60_000;

const flashLaunchInput = z.discriminatedUnion("when", [
  z.object({ when: z.literal("now") }),
  // Timer: starts after a number of minutes.
  z.object({
    when: z.literal("in"),
    delayMin: z.coerce.number().int().min(1).max(24 * 60),
  }),
  z.object({ when: z.literal("at"), startsAt: z.iso.datetime() }),
]);

export type FlashLaunch =
  | { startsAt: Date }
  | { error: "invalid" | "past" };

// When a flash challenge launched from the dashboard starts.
export function parseFlashLaunch(formData: FormData, now: Date): FlashLaunch {
  const parsed = flashLaunchInput.safeParse({
    when: formData.get("when"),
    delayMin: formData.get("delayMin") ?? undefined,
    startsAt: formData.get("startsAt") ?? undefined,
  });
  if (!parsed.success) return { error: "invalid" };
  const input = parsed.data;
  if (input.when === "now") return { startsAt: now };
  if (input.when === "in") {
    return { startsAt: new Date(now.getTime() + input.delayMin * 60_000) };
  }
  const startsAt = new Date(input.startsAt);
  if (startsAt.getTime() < now.getTime() - PAST_TOLERANCE_MS) {
    return { error: "past" };
  }
  return { startsAt };
}
