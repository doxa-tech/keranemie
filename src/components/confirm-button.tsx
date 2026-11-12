"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// A button that asks for confirmation before running a server action.
export function ConfirmButton({
  label,
  title,
  description,
  confirmLabel,
  action,
  variant = "default",
  size = "default",
}: {
  label: string;
  title: string;
  description?: string;
  confirmLabel?: string;
  action: () => Promise<unknown>;
  variant?: "default" | "outline" | "destructive" | "ghost" | "secondary";
  size?: "default" | "sm" | "xs";
}) {
  const t = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={variant} size={size} />}>
        {label}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {t("cancel")}
          </DialogClose>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await action();
                setOpen(false);
              })
            }
          >
            {confirmLabel ?? label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
