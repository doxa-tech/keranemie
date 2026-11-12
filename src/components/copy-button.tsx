"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyButton({
  value,
  label,
  variant = "outline",
}: {
  value: string;
  label: string;
  variant?: "outline" | "default" | "ghost";
}) {
  const t = useTranslations("Common");

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          toast.success(t("copied"));
        } catch {
          toast.error(t("copyFailed"));
        }
      }}
    >
      {label}
    </Button>
  );
}
