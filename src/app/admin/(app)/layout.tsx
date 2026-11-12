import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LanguageSwitch } from "@/components/language-switch";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "./actions";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  const t = await getTranslations("Admin");

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
          <Link href="/admin" className="font-semibold">
            Keranemie
          </Link>
          <span className="text-muted-foreground ml-auto hidden truncate text-sm sm:block">
            {user.email}
          </span>
          <div className="ml-auto flex items-center gap-1 sm:ml-0">
            <LanguageSwitch />
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                {t("signOut")}
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
