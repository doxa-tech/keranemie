import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LanguageSwitch } from "@/components/language-switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUser } from "@/lib/auth";
import { safePath } from "@/lib/safe-path";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const { error, next } = await searchParams;
  const nextPath = safePath(next);
  const user = await getUser();
  if (user && !user.isAnonymous) redirect(nextPath ?? "/admin");
  const t = await getTranslations("Login");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="absolute top-2 right-2">
        <LanguageSwitch />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error === "link" && (
            <p className="text-destructive text-sm" role="alert">
              {t("linkError")}
            </p>
          )}
          <LoginForm next={nextPath} />
        </CardContent>
      </Card>
    </main>
  );
}
