import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

type Submission = {
  status: "pending" | "approved" | "rejected";
  pointsAwarded: number | null;
  reviewMessage: string | null;
  reviewedBy: string | null;
};

export function SubmissionStatus({ submission }: { submission: Submission }) {
  const t = useTranslations("SubmissionStatus");

  if (submission.status === "approved") {
    return (
      <Badge>
        {t("approved", { points: submission.pointsAwarded ?? 0 })}
      </Badge>
    );
  }
  if (submission.status === "pending") {
    return <Badge variant="secondary">{t("pending")}</Badge>;
  }
  return <Badge variant="destructive">{t("rejected")}</Badge>;
}

// Why a submission was rejected: the admin's message, or a wrong answer
// when it was rejected automatically.
export function RejectionReason({ submission }: { submission: Submission }) {
  const t = useTranslations("SubmissionStatus");
  if (submission.status !== "rejected") return null;
  const reason =
    submission.reviewMessage ?? (submission.reviewedBy ? null : t("wrongAnswer"));
  if (!reason) return null;
  return <p className="text-destructive text-sm">{reason}</p>;
}
