import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LanguageSwitch } from "@/components/language-switch";

export default async function Home() {
  const t = await getTranslations("Home");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 px-4">
      <div className="absolute top-2 right-2">
        <LanguageSwitch />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground">{t("tagline")}</p>
      <Link
        href="/admin"
        className="text-muted-foreground hover:text-foreground mt-8 text-sm underline underline-offset-4"
      >
        {t("organize")}
      </Link>
    </main>
  );
}
