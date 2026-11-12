"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { setLocale } from "@/i18n/actions";
import { locales } from "@/i18n/config";

// Shows the other language; one click switches to it.
export function LanguageSwitch() {
  const t = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const other = locales.find((l) => l !== locale) ?? locales[0];

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={t("switchLanguage")}
      onClick={() =>
        startTransition(async () => {
          await setLocale(other);
          router.refresh();
        })
      }
    >
      {other.toUpperCase()}
    </Button>
  );
}
