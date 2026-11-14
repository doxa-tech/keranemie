import { z } from "zod";

// A party lasts from one minute to two weeks.
export const MAX_PARTY_MINUTES = 14 * 24 * 60;

// Empty form values (no start, no duration) become null.
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" || v == null ? null : v), schema.nullable());

// The form gives an optional start and an optional duration; the party
// stores its end when both are known. No start: started by hand ("Start
// now", which then applies the duration). No duration: ended by hand.
const partyInput = z
  .object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(1000),
    startsAt: optional(z.coerce.date()),
    durationMin: optional(
      z.coerce.number().int().min(1).max(MAX_PARTY_MINUTES),
    ),
  })
  .transform((p) => ({
    ...p,
    endsAt:
      p.startsAt && p.durationMin
        ? new Date(p.startsAt.getTime() + p.durationMin * 60_000)
        : null,
  }));

export type PartyFormState = {
  error?: "invalid" | "duration";
  // Submitted text values, so the form keeps them after an error (React
  // resets form fields after each action).
  values?: { name: string; description: string };
  saved?: boolean;
};

export function submittedValues(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  };
}

export function parsePartyForm(formData: FormData) {
  return partyInput.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    startsAt: formData.get("startsAt"),
    durationMin: formData.get("durationMin"),
  });
}

export function partyFormError(
  error: z.ZodError,
): Required<PartyFormState>["error"] {
  return error.issues.some((i) => i.path[0] === "durationMin")
    ? "duration"
    : "invalid";
}
