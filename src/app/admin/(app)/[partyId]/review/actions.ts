"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { requirePartyAdmin } from "@/lib/auth";
import { pushToPlayer } from "@/lib/push";
import { broadcast } from "@/lib/realtime/server";

const points = z.coerce.number().int().min(-10_000).max(10_000);

async function review(
  partyId: string,
  submissionId: string,
  from: "pending" | "approved",
  values: Partial<typeof submissions.$inferInsert>,
) {
  const { user } = await requirePartyAdmin(partyId);
  const [updated] = await db
    .update(submissions)
    .set({ ...values, reviewedBy: user.id, reviewedAt: new Date() })
    .where(
      and(
        eq(submissions.id, submissionId),
        eq(submissions.partyId, partyId),
        eq(submissions.status, from),
      ),
    )
    .returning({
      playerId: submissions.playerId,
      status: submissions.status,
      challengeId: submissions.challengeId,
    });
  if (updated && updated.status !== "pending") {
    await broadcast(partyId, {
      type: "submission.reviewed",
      playerId: updated.playerId,
      status: updated.status,
    });
    // Only the first review is pushed, not later point changes.
    if (from === "pending") {
      await pushToPlayer(updated.playerId, {
        titleKey: updated.status === "approved" ? "approvedTitle" : "rejectedTitle",
        bodyKey: updated.status === "approved" ? "approvedBody" : "rejectedBody",
        values: { points: values.pointsAwarded ?? 0 },
        url: `/p/${partyId}/challenges/${updated.challengeId}`,
      });
    }
  }
  refresh();
  return { ok: !!updated };
}

export async function approveSubmission(
  partyId: string,
  submissionId: string,
  formData: FormData,
) {
  const parsed = points.safeParse(formData.get("points"));
  if (!parsed.success) return { ok: false };
  return review(partyId, submissionId, "pending", {
    status: "approved",
    pointsAwarded: parsed.data,
    reviewMessage: null,
  });
}

export async function rejectSubmission(
  partyId: string,
  submissionId: string,
  formData: FormData,
) {
  const message = String(formData.get("message") ?? "").trim().slice(0, 300);
  return review(partyId, submissionId, "pending", {
    status: "rejected",
    pointsAwarded: null,
    reviewMessage: message || null,
  });
}

// Changes the points of an already approved submission.
export async function updateAwardedPoints(
  partyId: string,
  submissionId: string,
  formData: FormData,
) {
  const parsed = points.safeParse(formData.get("points"));
  if (!parsed.success) return { ok: false };
  return review(partyId, submissionId, "approved", {
    pointsAwarded: parsed.data,
  });
}
