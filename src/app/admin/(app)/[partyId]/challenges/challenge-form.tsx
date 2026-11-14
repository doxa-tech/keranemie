"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { DateTimeField } from "@/components/date-time-field";
import { DurationField } from "@/components/duration-field";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  ChallengeFormState,
  ChallengeFormValues,
} from "@/lib/challenge-form";

// Quick choices for a flash challenge's duration, in minutes.
const FLASH_DURATION_PRESETS = [5, 10, 15, 30, 60];

const emptyValues: ChallengeFormValues = {
  title: "",
  description: "",
  type: "photo",
  points: "10",
  validation: "manual",
  expectedAnswer: "",
  kind: "permanent",
  flashStartsAt: "",
  flashDurationMin: "15",
};

export function ChallengeForm({
  action,
  defaults = emptyValues,
  submitLabel,
}: {
  action: (
    state: ChallengeFormState,
    formData: FormData,
  ) => Promise<ChallengeFormState>;
  defaults?: ChallengeFormValues;
  submitLabel: string;
}) {
  const t = useTranslations("ChallengeForm");
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? defaults;
  // Remount the fields with the submitted values after an error.
  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <Fields key={JSON.stringify(values)} values={values} />
      {state.error && (
        <p className="text-destructive text-sm" role="alert">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}

function Fields({ values }: { values: ChallengeFormValues }) {
  const t = useTranslations("ChallengeForm");
  const [type, setType] = useState(values.type);
  const [kind, setKind] = useState(values.kind);
  const [flashStartsAtLocal, setFlashStartsAtLocal] = useState(
    values.flashStartsAt,
  );

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">{t("title")}</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={120}
          defaultValue={values.title}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{t("description")}</Label>
        <Textarea
          id="description"
          name="description"
          maxLength={2000}
          defaultValue={values.description}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">{t("type")}</Label>
          <NativeSelect
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as "photo" | "text")}
          >
            <option value="photo">{t("types.photo")}</option>
            <option value="text">{t("types.text")}</option>
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="points">{t("points")}</Label>
          <Input
            id="points"
            name="points"
            type="number"
            inputMode="numeric"
            min={0}
            max={10000}
            required
            defaultValue={values.points}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="validation">{t("validation")}</Label>
        <NativeSelect
          id="validation"
          name="validation"
          defaultValue={values.validation}
        >
          <option value="manual">{t("validations.manual")}</option>
          <option value="auto">{t("validations.auto")}</option>
        </NativeSelect>
      </div>
      {type === "text" && (
        <div className="space-y-2">
          <Label htmlFor="expectedAnswer">{t("expectedAnswer")}</Label>
          <Input
            id="expectedAnswer"
            name="expectedAnswer"
            maxLength={200}
            defaultValue={values.expectedAnswer}
          />
          <p className="text-muted-foreground text-xs">
            {t("expectedAnswerHint")}
          </p>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="kind">{t("kind")}</Label>
        <NativeSelect
          id="kind"
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as "permanent" | "flash")}
        >
          <option value="permanent">{t("kinds.permanent")}</option>
          <option value="flash">{t("kinds.flash")}</option>
        </NativeSelect>
      </div>
      {kind === "flash" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="flashStartsAt">{t("flashStartsAt")}</Label>
            <DateTimeField
              id="flashStartsAt"
              name="flashStartsAt"
              label={t("flashStartsAt")}
              defaultValue={values.flashStartsAt}
              onLocalChange={setFlashStartsAtLocal}
            />
            {/* Kept to refill the field after an error. */}
            <input
              type="hidden"
              name="flashStartsAtLocal"
              value={flashStartsAtLocal}
            />
            <p className="text-muted-foreground text-xs">
              {t("flashStartsAtHint")}
            </p>
          </div>
          <div className="space-y-2">
            <Label id="flashDurationMin-label">{t("flashDurationMin")}</Label>
            <DurationField
              name="flashDurationMin"
              labelId="flashDurationMin-label"
              presets={FLASH_DURATION_PRESETS}
              defaultValue={Number(values.flashDurationMin) || 15}
              maxMinutes={24 * 60}
            />
          </div>
        </>
      )}
    </>
  );
}
