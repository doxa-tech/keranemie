"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { DateTimeField } from "@/components/date-time-field";
import { DurationField } from "@/components/duration-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_PARTY_MINUTES, type PartyFormState } from "@/lib/party-form";

type Defaults = {
  name: string;
  description: string;
  // "YYYY-MM-DDTHH:mm" in the user's time zone, or "" (started by hand)
  startsAt: string;
  // null: until ended by hand
  durationMin: number | null;
};

// Quick choices for the party duration, in minutes.
const DURATION_PRESETS = [60, 120, 180, 240, 360];

export function PartyForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (state: PartyFormState, formData: FormData) => Promise<PartyFormState>;
  defaults?: Defaults;
  submitLabel: string;
}) {
  const t = useTranslations("PartyForm");
  const format = useFormatter();
  const [state, formAction, pending] = useActionState(action, {});
  const [startsAt, setStartsAt] = useState(defaults?.startsAt ?? "");
  const [durationMin, setDurationMin] = useState<number | null>(
    defaults ? defaults.durationMin : 180,
  );
  // The end depends on the device time zone: shown after hydration only.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const endsAt =
    mounted && startsAt && durationMin
      ? new Date(new Date(startsAt).getTime() + durationMin * 60_000)
      : null;

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={100}
          defaultValue={state.values?.name ?? defaults?.name}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{t("description")}</Label>
        <Textarea
          id="description"
          name="description"
          maxLength={1000}
          defaultValue={state.values?.description ?? defaults?.description}
        />
        <p className="text-muted-foreground text-xs">
          {t("descriptionHint")}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="startsAt">{t("startsAt")}</Label>
        <DateTimeField
          id="startsAt"
          name="startsAt"
          label={t("startsAt")}
          defaultValue={defaults?.startsAt}
          onLocalChange={setStartsAt}
        />
        <p className="text-muted-foreground text-xs">{t("startsAtHint")}</p>
      </div>
      <div className="space-y-2">
        <Label id="durationMin-label">{t("duration")}</Label>
        <DurationField
          name="durationMin"
          labelId="durationMin-label"
          presets={DURATION_PRESETS}
          defaultValue={defaults ? defaults.durationMin : 180}
          maxMinutes={MAX_PARTY_MINUTES}
          allowNone
          onChange={setDurationMin}
        />
        {mounted && (
          <p className="text-muted-foreground text-sm" data-testid="ends-at">
            {endsAt
              ? t("endsAtPreview", {
                  date: format.dateTime(endsAt, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                    hourCycle: "h23",
                  }),
                })
              : durationMin
                ? t("durationFromStartPreview")
                : t("untilEndedPreview")}
          </p>
        )}
      </div>
      {state.saved && (
        <p className="text-muted-foreground text-sm" role="status">
          {t("saved")}
        </p>
      )}
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

function noopSubscribe() {
  return () => {};
}
