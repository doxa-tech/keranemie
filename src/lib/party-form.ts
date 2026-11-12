import { z } from "zod";

const partyInput = z
  .object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(1000),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .refine((p) => p.endsAt > p.startsAt, { path: ["endsAt"] });

export type PartyFormState = {
  error?: "invalid" | "endsBeforeStart";
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
    endsAt: formData.get("endsAt"),
  });
}

export function partyFormError(
  error: z.ZodError,
): Required<PartyFormState>["error"] {
  return error.issues.some((i) => i.path[0] === "endsAt" && i.code === "custom")
    ? "endsBeforeStart"
    : "invalid";
}
