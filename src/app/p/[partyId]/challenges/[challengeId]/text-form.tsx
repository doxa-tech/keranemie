"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitText, type SubmitState } from "./actions";

export function TextForm({
  partyId,
  challengeId,
}: {
  partyId: string;
  challengeId: string;
}) {
  const t = useTranslations("Submit");
  const [state, formAction, pending] = useActionState<SubmitState, FormData>(
    submitText.bind(null, partyId, challengeId),
    {},
  );

  useEffect(() => {
    if (state.result) showResult(state.result, t);
  }, [state.at, state.result, t]);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="answer">{t("answer")}</Label>
        <Textarea
          id="answer"
          name="answer"
          required
          maxLength={1000}
          className="min-h-24 text-base"
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {t("send")}
      </Button>
    </form>
  );
}

export function showResult(
  result: NonNullable<SubmitState["result"]>,
  t: (key: string) => string,
) {
  if ("error" in result) toast.error(t(`errors.${result.error}`));
  else if (result.status === "approved") toast.success(t("approved"));
  else if (result.status === "pending") toast.success(t("pending"));
  else toast.error(t("wrongAnswer"));
}
