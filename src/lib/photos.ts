import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const PHOTOS_BUCKET = "photos";
const SIGNED_URL_SECONDS = 60 * 60;

// Each player uploads under their own folder: {partyId}/{playerId}/{uuid}.jpg
export function newPhotoPath(partyId: string, playerId: string) {
  return `${partyId}/${playerId}/${randomUUID()}.jpg`;
}

export function isPlayerPhotoPath(
  path: string,
  partyId: string,
  playerId: string,
) {
  const prefix = `${partyId}/${playerId}/`;
  return (
    path.startsWith(prefix) &&
    /^[0-9a-f-]{36}\.jpg$/.test(path.slice(prefix.length))
  );
}

export async function createPhotoUploadUrl(path: string) {
  const { data, error } = await createAdminClient()
    .storage.from(PHOTOS_BUCKET)
    .createSignedUploadUrl(path);
  if (error) throw error;
  return { path: data.path, token: data.token };
}

export async function photoExists(path: string) {
  const { data } = await createAdminClient()
    .storage.from(PHOTOS_BUCKET)
    .exists(path);
  return data === true;
}

// Short-lived URLs to display private photos, keyed by path.
export async function signedPhotoUrls(
  paths: (string | null)[],
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => !!p))];
  if (unique.length === 0) return new Map();
  const { data, error } = await createAdminClient()
    .storage.from(PHOTOS_BUCKET)
    .createSignedUrls(unique, SIGNED_URL_SECONDS);
  if (error) throw error;
  const urls = new Map<string, string>();
  for (const { path, signedUrl } of data) {
    if (path && signedUrl) urls.set(path, signedUrl);
  }
  return urls;
}
