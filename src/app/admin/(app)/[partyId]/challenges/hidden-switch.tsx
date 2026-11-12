"use client";

import { useOptimistic, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { setChallengeHidden } from "./actions";

export function HiddenSwitch({
  partyId,
  challengeId,
  hidden,
}: {
  partyId: string;
  challengeId: string;
  hidden: boolean;
}) {
  const t = useTranslations("Challenges");
  const [, startTransition] = useTransition();
  const [optimisticHidden, setOptimisticHidden] = useOptimistic(hidden);
  const id = `visible-${challengeId}`;

  return (
    <span className="flex items-center gap-2 px-2">
      <Switch
        id={id}
        checked={!optimisticHidden}
        onCheckedChange={(visible) =>
          startTransition(async () => {
            setOptimisticHidden(!visible);
            await setChallengeHidden(partyId, challengeId, !visible);
          })
        }
      />
      <Label htmlFor={id} className="text-sm font-normal">
        {t("visible")}
      </Label>
    </span>
  );
}
