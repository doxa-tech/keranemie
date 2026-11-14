"use client";

import { useActionState, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { DateTimeField } from "@/components/date-time-field";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { scheduleFlash, type LaunchFlashState } from "./actions";

type When = "now" | "in" | "at";

type Challenge = { id: string; title: string; flashDurationMin: number | null };

export function LaunchFlashDialog({
  partyId,
  challenge,
}: {
  partyId: string;
  challenge: Challenge;
}) {
  const t = useTranslations("Dashboard.launch");
  const tc = useTranslations("Common");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        {t("open")}
      </DialogTrigger>
      <DialogContent closeLabel={tc("close")}>
        <DialogHeader>
          <DialogTitle>{t("title", { title: challenge.title })}</DialogTitle>
          <DialogDescription>
            {t("description", { minutes: challenge.flashDurationMin ?? 0 })}
          </DialogDescription>
        </DialogHeader>
        {/* Mounted with the dialog: starts from "now" each time it opens. */}
        <LaunchFlashForm
          partyId={partyId}
          challengeId={challenge.id}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function LaunchFlashForm({
  partyId,
  challengeId,
  onDone,
}: {
  partyId: string;
  challengeId: string;
  onDone: () => void;
}) {
  const t = useTranslations("Dashboard.launch");
  const [when, setWhen] = useState<When>("now");
  const [, startTransition] = useTransition();
  const [state, launch, pending] = useActionState<LaunchFlashState, FormData>(
    async (prev, formData) => {
      const result = await scheduleFlash(partyId, challengeId, prev, formData);
      if (result.saved) {
        toast.success(result.started ? t("started") : t("scheduled"));
        onDone();
      }
      return result;
    },
    {},
  );
  const id = (name: string) => `launch-${challengeId}-${name}`;

  // A submit handler rather than a form action: React resets forms after
  // actions, which would put the select back to "now" after an error.
  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => launch(formData));
  }

  return (
    <form onSubmit={send} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={id("when")}>{t("when")}</Label>
        <NativeSelect
          id={id("when")}
          name="when"
          value={when}
          onChange={(e) => setWhen(e.target.value as When)}
        >
          <option value="now">{t("whens.now")}</option>
          <option value="in">{t("whens.in")}</option>
          <option value="at">{t("whens.at")}</option>
        </NativeSelect>
      </div>
      {when === "in" && (
        <div className="space-y-2">
          <Label htmlFor={id("delay")}>{t("delayMin")}</Label>
          <Input
            id={id("delay")}
            name="delayMin"
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            required
            defaultValue="10"
          />
        </div>
      )}
      {when === "at" && (
        <div className="space-y-2">
          <Label htmlFor={id("at")}>{t("startsAt")}</Label>
          <DateTimeField
            id={id("at")}
            name="startsAt"
            label={t("startsAt")}
            required
          />
        </div>
      )}
      {state.error && (
        <p className="text-destructive text-sm" role="alert">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {t(`submit.${when}`)}
      </Button>
    </form>
  );
}
