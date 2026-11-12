import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LanguageSwitch } from "@/components/language-switch";
import { getUser } from "@/lib/auth";
import { findActivePlayerParty } from "@/lib/players";
import { JoinCodeForm } from "./join-code-form";

export default async function Home() {
  // A player coming back on the same device goes straight to their party.
  const user = await getUser();
  if (user) {
    const party = await findActivePlayerParty(user.id);
    if (party) redirect(`/p/${party.id}`);
  }
  const t = await getTranslations("Home");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 px-4">
      <div className="absolute top-2 right-2">
        <LanguageSwitch />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground mb-6">{t("tagline")}</p>
      <JoinCodeForm />
      <Link
        href="/admin"
        className="text-muted-foreground hover:text-foreground mt-12 text-sm underline underline-offset-4"
      >
        {t("organize")}
      </Link>
    </main>
  );
}
