"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteAdmin, type InviteState } from "./actions";

export function InviteForm({ partyId }: { partyId: string }) {
  const t = useTranslations("Settings.admins");
  const [state, formAction, pending] = useActionState<InviteState, FormData>(
    inviteAdmin.bind(null, partyId),
    {},
  );

  return (
    <form action={formAction} className="space-y-2">
      <Label htmlFor="invite-email">{t("inviteLabel")}</Label>
      <div className="flex gap-2">
        <Input
          id="invite-email"
          name="email"
          type="email"
          required
          autoComplete="off"
        />
        <Button type="submit" disabled={pending}>
          {t("invite")}
        </Button>
      </div>
      {state.error && (
        <p className="text-destructive text-sm" role="alert">
          {t(`errors.${state.error}`)}
        </p>
      )}
      {state.invited && (
        <p className="text-muted-foreground text-sm" role="status">
          {t("invited", { email: state.invited })}
        </p>
      )}
    </form>
  );
}
