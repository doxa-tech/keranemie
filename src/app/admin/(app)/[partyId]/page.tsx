import { getFormatter, getTranslations } from "next-intl/server";
import { getParty } from "@/lib/parties";

// Placeholder overview until the live dashboard (phase 5).
export default async function PartyOverview({
  params,
}: PageProps<"/admin/[partyId]">) {
  const { partyId } = await params;
  const party = (await getParty(partyId))!;
  const t = await getTranslations("PartyOverview");
  const format = await getFormatter();

  return (
    <dl className="grid max-w-lg grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
      <dt className="text-muted-foreground">{t("joinCode")}</dt>
      <dd className="font-mono font-medium">{party.joinCode}</dd>
      <dt className="text-muted-foreground">{t("startsAt")}</dt>
      <dd>
        {format.dateTime(party.startsAt, {
          dateStyle: "full",
          timeStyle: "short",
        })}
      </dd>
      <dt className="text-muted-foreground">{t("endsAt")}</dt>
      <dd>
        {format.dateTime(party.endsAt, {
          dateStyle: "full",
          timeStyle: "short",
        })}
      </dd>
      {party.description && (
        <>
          <dt className="text-muted-foreground">{t("description")}</dt>
          <dd className="whitespace-pre-line">{party.description}</dd>
        </>
      )}
    </dl>
  );
}
