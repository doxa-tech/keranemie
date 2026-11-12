"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinParty, type JoinState } from "./actions";

export function JoinForm({ code, partyName }: { code: string; partyName: string }) {
  const t = useTranslations("Join");
  const [state, formAction, pending] = useActionState<JoinState, FormData>(
    joinParty.bind(null, code),
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("nameLabel")}</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={30}
          autoComplete="nickname"
          defaultValue={state.name}
          className="h-11 text-base"
        />
        <p className="text-muted-foreground text-xs">{t("nameHint")}</p>
      </div>
      {state.error && (
        <p className="text-destructive text-sm" role="alert">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {t("confirm", { party: partyName })}
      </Button>
    </form>
  );
}
