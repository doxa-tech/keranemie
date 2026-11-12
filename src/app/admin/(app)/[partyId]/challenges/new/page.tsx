import { getTranslations } from "next-intl/server";
import { createChallenge } from "../actions";
import { ChallengeForm } from "../challenge-form";

export default async function NewChallengePage({
  params,
}: PageProps<"/admin/[partyId]/challenges/new">) {
  const { partyId } = await params;
  const t = await getTranslations("Challenges");

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("add")}</h2>
      <ChallengeForm
        action={createChallenge.bind(null, partyId)}
        submitLabel={t("create")}
      />
    </div>
  );
}
