import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LanguageSwitch } from "@/components/language-switch";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPlayer } from "@/lib/auth";
import { canJoin, normalizeJoinCode, partyStatus } from "@/lib/game/party";
import { getPartyByCode } from "@/lib/parties";
import { JoinForm } from "./join-form";

export default async function JoinPage({ params }: PageProps<"/join/[code]">) {
  const { code } = await params;
  const party = await getPartyByCode(normalizeJoinCode(code));
  if (party && (await getPlayer(party.id))) redirect(`/p/${party.id}`);
  const t = await getTranslations("Join");
  const status = party ? partyStatus(party, new Date()) : null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="absolute top-2 right-2">
        <LanguageSwitch />
      </div>
      <Card className="w-full max-w-sm">
        {party && status && canJoin(status) ? (
          <>
            <CardHeader>
              <CardTitle className="text-xl">{party.name}</CardTitle>
              {party.description && (
                <CardDescription className="whitespace-pre-line">
                  {party.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <JoinForm code={party.joinCode} partyName={party.name} />
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>{party ? party.name : t("notFoundTitle")}</CardTitle>
              <CardDescription>
                {!party
                  ? t("notFound")
                  : status === "draft"
                    ? t("notOpen")
                    : t("ended")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/" className={buttonVariants({ variant: "outline" })}>
                {t("back")}
              </Link>
            </CardContent>
          </>
        )}
      </Card>
    </main>
  );
}
