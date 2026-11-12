import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PartyStatusBadge } from "@/components/party-status-badge";
import { requirePartyAdmin } from "@/lib/auth";
import { partyStatus } from "@/lib/game/party";
import { isUuid } from "@/lib/ids";
import { getParty } from "@/lib/parties";
import { PartyNav } from "./party-nav";

export default async function PartyLayout({
  children,
  params,
}: LayoutProps<"/admin/[partyId]">) {
  const { partyId } = await params;
  if (!isUuid(partyId)) notFound();
  await requirePartyAdmin(partyId);
  const party = await getParty(partyId);
  if (!party) notFound();
  const t = await getTranslations("PartyNav");

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {party.name}
          </h1>
          <PartyStatusBadge status={partyStatus(party, new Date())} />
        </div>
        <PartyNav
          partyId={partyId}
          links={[
            { href: "", label: t("dashboard") },
            { href: "/review", label: t("review") },
            { href: "/challenges", label: t("challenges") },
            { href: "/teams", label: t("teams") },
            { href: "/gallery", label: t("gallery") },
            { href: "/settings", label: t("settings") },
            { href: "/share", label: t("share") },
          ]}
        />
      </div>
      {children}
    </div>
  );
}
