"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requirePlayer } from "@/lib/auth";
import { getParty } from "@/lib/parties";
import {
  createPhotoUploadUrl,
  isPlayerPhotoPath,
  newPhotoPath,
  photoExists,
} from "@/lib/photos";
import { getPlayerChallenge, submit, type SubmitResult } from "@/lib/submissions";

export type SubmitState = { result?: SubmitResult; at?: number };

export async function submitText(
  partyId: string,
  challengeId: string,
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const player = await requirePlayer(partyId);
  const party = (await getParty(partyId))!;
  const answer = z
    .string()
    .trim()
    .min(1)
    .max(1000)
    .safeParse(formData.get("answer"));
  if (!answer.success) return {};
  const result = await submit(party, player, challengeId, {
    textAnswer: answer.data,
  });
  refresh();
  return { result, at: Date.now() };
}

// Step 1 of a photo submission: a signed URL to upload the file directly
// to storage from the browser.
export async function createUpload(partyId: string, challengeId: string) {
  const player = await requirePlayer(partyId);
  const party = (await getParty(partyId))!;
  const item = await getPlayerChallenge(party, player, challengeId);
  if (!item?.available || item.active || item.challenge.type !== "photo") {
    return null;
  }
  return createPhotoUploadUrl(newPhotoPath(partyId, player.id));
}

// Step 2: record the submission once the file is uploaded.
export async function submitPhoto(
  partyId: string,
  challengeId: string,
  path: string,
  caption: string,
): Promise<SubmitResult> {
  const player = await requirePlayer(partyId);
  const party = (await getParty(partyId))!;
  if (!isPlayerPhotoPath(path, partyId, player.id) || !(await photoExists(path))) {
    return { error: "unavailable" };
  }
  const result = await submit(party, player, challengeId, {
    photoPath: path,
    caption: caption.trim().slice(0, 300),
  });
  refresh();
  return result;
}
