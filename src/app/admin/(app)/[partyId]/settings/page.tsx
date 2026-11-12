import { getFormatter, getTimeZone, getTranslations } from "next-intl/server";
import { ConfirmButton } from "@/components/confirm-button";
import { CopyButton } from "@/components/copy-button";
import { PartyForm } from "@/components/party-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requirePartyAdmin } from "@/lib/auth";
import { toLocalInputValue } from "@/lib/dates";
import { partyStatus } from "@/lib/game/party";
import {
  getParty,
  inviteUrl,
  listPartyAdmins,
  listPendingInvitations,
} from "@/lib/parties";
import {
  deleteParty,
  endPartyNow,
  openParty,
  removeAdmin,
  revokeInvitation,
  startPartyNow,
  updateParty,
} from "./actions";
import { InviteForm } from "./invite-form";

export default async function SettingsPage({
  params,
}: PageProps<"/admin/[partyId]/settings">) {
  const { partyId } = await params;
  const { role, user } = await requirePartyAdmin(partyId);
  const party = (await getParty(partyId))!;
  const isOwner = role === "owner";
  const t = await getTranslations("Settings");
  const format = await getFormatter();
  const timeZone = await getTimeZone();
  const status = partyStatus(party, new Date());
  const [admins, invitations] = await Promise.all([
    listPartyAdmins(partyId),
    isOwner ? listPendingInvitations(partyId) : [],
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t("lifecycle.title")}</CardTitle>
          <CardDescription>{t(`lifecycle.status.${status}`)}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {status === "draft" && (
            <ConfirmButton
              label={t("lifecycle.open")}
              title={t("lifecycle.openTitle")}
              description={t("lifecycle.openDescription")}
              action={openParty.bind(null, partyId)}
            />
          )}
          {status === "open" && (
            <ConfirmButton
              label={t("lifecycle.startNow")}
              title={t("lifecycle.startNowTitle")}
              description={t("lifecycle.startNowDescription")}
              action={startPartyNow.bind(null, partyId)}
            />
          )}
          {status === "live" && (
            <ConfirmButton
              label={t("lifecycle.endNow")}
              title={t("lifecycle.endNowTitle")}
              description={t("lifecycle.endNowDescription")}
              action={endPartyNow.bind(null, partyId)}
              variant="destructive"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("details")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PartyForm
            action={updateParty.bind(null, partyId)}
            submitLabel={t("save")}
            defaults={{
              name: party.name,
              description: party.description ?? "",
              startsAt: toLocalInputValue(party.startsAt, timeZone),
              endsAt: toLocalInputValue(party.endsAt, timeZone),
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admins.title")}</CardTitle>
          <CardDescription>{t("admins.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="divide-y" aria-label={t("admins.title")}>
            {admins.map((admin) => (
              <li
                key={admin.userId}
                className="flex items-center justify-between gap-2 py-2"
              >
                <span className="min-w-0 truncate text-sm">
                  {admin.email}
                  {admin.userId === user.id && (
                    <span className="text-muted-foreground"> ({t("admins.you")})</span>
                  )}
                </span>
                {admin.role === "owner" ? (
                  <span className="text-muted-foreground text-xs">
                    {t("admins.owner")}
                  </span>
                ) : (
                  isOwner && (
                    <ConfirmButton
                      label={t("admins.remove")}
                      title={t("admins.removeTitle", { email: admin.email ?? "" })}
                      action={removeAdmin.bind(null, partyId, admin.userId)}
                      variant="ghost"
                      size="sm"
                    />
                  )
                )}
              </li>
            ))}
          </ul>

          {isOwner && (
            <div className="space-y-4">
              <InviteForm partyId={partyId} />
              {invitations.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">
                    {t("admins.pending")}
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {t("admins.pendingHint")}
                  </p>
                  <ul className="divide-y" aria-label={t("admins.pending")}>
                    {invitations.map((invitation) => (
                      <li
                        key={invitation.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2"
                      >
                        <span className="min-w-0 truncate text-sm">
                          {invitation.email}
                          <span className="text-muted-foreground block text-xs">
                            {t("admins.expires", {
                              date: format.dateTime(invitation.expiresAt, {
                                dateStyle: "medium",
                              }),
                            })}
                          </span>
                        </span>
                        <span className="flex gap-1">
                          <CopyButton
                            value={inviteUrl(invitation.token)}
                            label={t("admins.copyLink")}
                          />
                          <ConfirmButton
                            label={t("admins.revoke")}
                            title={t("admins.revokeTitle", {
                              email: invitation.email,
                            })}
                            action={revokeInvitation.bind(
                              null,
                              partyId,
                              invitation.id,
                            )}
                            variant="ghost"
                            size="sm"
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {isOwner && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("danger.title")}</CardTitle>
            <CardDescription>{t("danger.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ConfirmButton
              label={t("danger.delete")}
              title={t("danger.deleteTitle")}
              description={t("danger.deleteDescription")}
              action={deleteParty.bind(null, partyId)}
              variant="destructive"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
