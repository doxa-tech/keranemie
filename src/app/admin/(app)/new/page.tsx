import { getTranslations } from "next-intl/server";
import { PartyForm } from "@/components/party-form";
import { createParty } from "../actions";

export default async function NewPartyPage() {
  const t = await getTranslations("Admin");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("newParty")}</h1>
      <PartyForm action={createParty} submitLabel={t("createParty")} />
    </div>
  );
}
