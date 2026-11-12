import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));

const { isPlayerPhotoPath, newPhotoPath } = await import("./photos");

const partyId = "11111111-1111-1111-1111-111111111111";
const playerId = "22222222-2222-2222-2222-222222222222";

describe("photo paths", () => {
  it("accepts paths generated for the player", () => {
    expect(isPlayerPhotoPath(newPhotoPath(partyId, playerId), partyId, playerId)).toBe(true);
  });

  it("rejects other players' folders and odd names", () => {
    const other = "33333333-3333-3333-3333-333333333333";
    expect(isPlayerPhotoPath(newPhotoPath(partyId, other), partyId, playerId)).toBe(false);
    expect(isPlayerPhotoPath(`${partyId}/${playerId}/../x.jpg`, partyId, playerId)).toBe(false);
    expect(isPlayerPhotoPath(`${partyId}/${playerId}/a/b.jpg`, partyId, playerId)).toBe(false);
  });
});
