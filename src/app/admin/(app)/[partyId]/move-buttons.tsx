"use client";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function MoveButtons({
  canMoveUp,
  canMoveDown,
  action,
}: {
  canMoveUp: boolean;
  canMoveDown: boolean;
  action: (direction: "up" | "down") => Promise<void>;
}) {
  const t = useTranslations("Common");
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("moveUp")}
        disabled={!canMoveUp || pending}
        onClick={() => startTransition(() => action("up"))}
      >
        <ArrowUpIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("moveDown")}
        disabled={!canMoveDown || pending}
        onClick={() => startTransition(() => action("down"))}
      >
        <ArrowDownIcon />
      </Button>
    </>
  );
}
