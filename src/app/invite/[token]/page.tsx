import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUser } from "@/lib/auth";
import {
  acceptInvitation,
  checkInvitation,
  getInvitation,
} from "@/lib/invitations";

export default async function InvitePage({
  params,
}: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const user = await getUser();
  if (!user || user.isAnonymous) {
    redirect(`/admin/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const invitation = await getInvitation(token);
  const check = invitation
    ? checkInvitation(invitation, user, new Date())
    : "notFound";
  if (invitation && check === "ok") {
    await acceptInvitation(invitation, user.id);
    redirect(`/admin/${invitation.partyId}`);
  }
  if (invitation && check === "accepted") {
    redirect(`/admin/${invitation.partyId}`);
  }

  const t = await getTranslations("Invite");
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>
            {t(check, { email: user.email ?? "" })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/admin" className={buttonVariants({ variant: "outline" })}>
            {t("back")}
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
