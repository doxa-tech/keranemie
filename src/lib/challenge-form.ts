import { z } from "zod";

const challengeInput = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000),
    type: z.enum(["photo", "text"]),
    points: z.coerce.number().int().min(0).max(10_000),
    validation: z.enum(["auto", "manual"]),
    expectedAnswer: z.string().trim().max(200),
    kind: z.enum(["permanent", "flash"]),
    flashStartsAt: z.string(),
    flashDurationMin: z.string(),
  })
  .transform((c, ctx) => {
    const flash = c.kind === "flash";
    const flashStartsAt = flash ? new Date(c.flashStartsAt) : null;
    const flashDurationMin = flash ? Number(c.flashDurationMin) : null;
    if (flash && (!flashStartsAt || Number.isNaN(flashStartsAt.getTime()))) {
      ctx.addIssue({ code: "custom", path: ["flashStartsAt"], message: "flash" });
    }
    if (
      flash &&
      (!Number.isInteger(flashDurationMin) ||
        flashDurationMin! < 1 ||
        flashDurationMin! > 24 * 60)
    ) {
      ctx.addIssue({ code: "custom", path: ["flashDurationMin"], message: "flash" });
    }
    return {
      title: c.title,
      description: c.description,
      type: c.type,
      points: c.points,
      validation: c.validation,
      // Only text challenges have an expected answer.
      expectedAnswer:
        c.type === "text" && c.expectedAnswer ? c.expectedAnswer : null,
      kind: c.kind,
      flashStartsAt,
      flashDurationMin,
    };
  });

export type ChallengeInput = z.output<typeof challengeInput>;

export type ChallengeFormValues = {
  title: string;
  description: string;
  type: "photo" | "text";
  points: string;
  validation: "auto" | "manual";
  expectedAnswer: string;
  kind: "permanent" | "flash";
  // datetime-local value in the user's time zone
  flashStartsAt: string;
  flashDurationMin: string;
};

export type ChallengeFormState = {
  error?: "invalid" | "flash";
  values?: ChallengeFormValues;
};

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

export function parseChallengeForm(formData: FormData) {
  return challengeInput.safeParse({
    title: field(formData, "title"),
    description: field(formData, "description"),
    type: field(formData, "type"),
    points: field(formData, "points"),
    validation: field(formData, "validation"),
    expectedAnswer: field(formData, "expectedAnswer"),
    kind: field(formData, "kind"),
    flashStartsAt: field(formData, "flashStartsAt"),
    flashDurationMin: field(formData, "flashDurationMin"),
  });
}

export function challengeFormError(
  formData: FormData,
  error: z.ZodError,
): ChallengeFormState {
  return {
    error: error.issues.some((i) => i.message === "flash") ? "flash" : "invalid",
    values: {
      title: field(formData, "title"),
      description: field(formData, "description"),
      type: field(formData, "type") === "text" ? "text" : "photo",
      points: field(formData, "points"),
      validation: field(formData, "validation") === "auto" ? "auto" : "manual",
      expectedAnswer: field(formData, "expectedAnswer"),
      kind: field(formData, "kind") === "flash" ? "flash" : "permanent",
      flashStartsAt: field(formData, "flashStartsAtLocal"),
      flashDurationMin: field(formData, "flashDurationMin"),
    },
  };
}
