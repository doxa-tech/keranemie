"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JOIN_CODE_LENGTH, normalizeJoinCode } from "@/lib/game/party";

export function JoinCodeForm() {
  const t = useTranslations("Home");
  const router = useRouter();
  const [code, setCode] = useState("");
  const normalized = normalizeJoinCode(code);

  return (
    <form
      className="w-full max-w-xs space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/join/${normalized}`);
      }}
    >
      <Label htmlFor="code" className="sr-only">
        {t("codeLabel")}
      </Label>
      <Input
        id="code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={t("codePlaceholder")}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        className="h-12 text-center font-mono text-2xl tracking-[0.3em] uppercase"
      />
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={normalized.length !== JOIN_CODE_LENGTH}
      >
        {t("join")}
      </Button>
    </form>
  );
}
