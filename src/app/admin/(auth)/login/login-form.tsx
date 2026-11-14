"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink, type LoginState } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("Login");
  const [state, action, pending] = useActionState<LoginState, FormData>(
    sendMagicLink,
    { status: "idle" },
  );

  if (state.status === "sent") {
    return (
      <div className="space-y-1 text-center" role="status">
        <p className="font-medium">{t("sentTitle")}</p>
        <p className="text-muted-foreground text-sm">
          {t("sentBody", { email: state.email ?? "" })}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
        />
      </div>
      {state.status === "password" && (
        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
          />
          <p className="text-muted-foreground text-xs">{t("passwordHint")}</p>
        </div>
      )}
      {state.wrongPassword && (
        <p className="text-destructive text-sm" role="alert">
          {t("wrongPassword")}
        </p>
      )}
      {state.status === "error" && (
        <p className="text-destructive text-sm" role="alert">
          {t("error")}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {t("submit")}
      </Button>
    </form>
  );
}
