"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { DateTimeField } from "@/components/date-time-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PartyFormState } from "@/lib/party-form";

type Defaults = {
  name: string;
  description: string;
  // datetime-local values in the user's time zone
  startsAt: string;
  endsAt: string;
};

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
  const [state, formAction, pending] = useActionState(action, {});

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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startsAt">{t("startsAt")}</Label>
          <DateTimeField
            id="startsAt"
            name="startsAt"
            required
            defaultValue={defaults?.startsAt}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endsAt">{t("endsAt")}</Label>
          <DateTimeField
            id="endsAt"
            name="endsAt"
            required
            defaultValue={defaults?.endsAt}
          />
        </div>
      </div>
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
