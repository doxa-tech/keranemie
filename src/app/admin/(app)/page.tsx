import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { PartyStatusBadge } from "@/components/party-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { partyStatus } from "@/lib/game/party";
import { listAdminParties } from "@/lib/parties";

export default async function AdminHome() {
  const user = await requireAdmin();
  const t = await getTranslations("Admin");
  const format = await getFormatter();
  const rows = await listAdminParties(user.id);
  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("myParties")}
        </h1>
        <Link href="/admin/new" className={buttonVariants()}>
          {t("newParty")}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">{t("noParties")}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ party }) => (
            <li key={party.id}>
              <Link href={`/admin/${party.id}`} className="block">
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle>{party.name}</CardTitle>
                      <PartyStatusBadge status={partyStatus(party, now)} />
                    </div>
                    <CardDescription>
                      {party.startsAt && party.endsAt
                        ? format.dateTimeRange(party.startsAt, party.endsAt, {
                            dateStyle: "medium",
                            timeStyle: "short",
                            hourCycle: "h23",
                          })
                        : party.startsAt
                          ? t("startsAtUntilEnded", {
                              date: format.dateTime(party.startsAt, {
                                dateStyle: "medium",
                                timeStyle: "short",
                                hourCycle: "h23",
                              }),
                            })
                          : t("startedByHand")}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
