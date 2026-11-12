"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  approveSubmission,
  rejectSubmission,
  updateAwardedPoints,
} from "./actions";

export function ReviewActions({
  partyId,
  submissionId,
  defaultPoints,
}: {
  partyId: string;
  submissionId: string;
  defaultPoints: number;
}) {
  const t = useTranslations("Review");
  const [rejecting, setRejecting] = useState(false);
  const [pending, startTransition] = useTransition();
  const id = `points-${submissionId}`;

  function run(action: typeof approveSubmission, formData: FormData) {
    startTransition(async () => {
      const result = await action(partyId, submissionId, formData);
      if (!result.ok) toast.error(t("alreadyReviewed"));
    });
  }

  if (rejecting) {
    return (
      <form
        action={(formData) => run(rejectSubmission, formData)}
        className="space-y-2"
      >
        <Label htmlFor={`message-${submissionId}`}>{t("rejectMessage")}</Label>
        <Input
          id={`message-${submissionId}`}
          name="message"
          maxLength={300}
          autoFocus
        />
        <div className="flex gap-2">
          <Button type="submit" variant="destructive" disabled={pending}>
            {t("confirmReject")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setRejecting(false)}
          >
            {t("cancel")}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form
      action={(formData) => run(approveSubmission, formData)}
      className="flex flex-wrap items-end gap-2"
    >
      <div className="space-y-1">
        <Label htmlFor={id} className="text-xs">
          {t("points")}
        </Label>
        <Input
          id={id}
          name="points"
          type="number"
          inputMode="numeric"
          defaultValue={defaultPoints}
          className="w-24"
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {t("approve")}
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => setRejecting(true)}
      >
        {t("reject")}
      </Button>
    </form>
  );
}

export function EditPoints({
  partyId,
  submissionId,
  points,
}: {
  partyId: string;
  submissionId: string;
  points: number;
}) {
  const t = useTranslations("Review");
  const [pending, startTransition] = useTransition();
  const id = `awarded-${submissionId}`;

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          await updateAwardedPoints(partyId, submissionId, formData);
          toast.success(t("pointsSaved"));
        })
      }
      className="flex items-center gap-2"
    >
      <Label htmlFor={id} className="sr-only">
        {t("points")}
      </Label>
      <Input
        id={id}
        name="points"
        type="number"
        inputMode="numeric"
        defaultValue={points}
        className="h-7 w-20"
        required
      />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {t("savePoints")}
      </Button>
    </form>
  );
}
