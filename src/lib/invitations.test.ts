import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ db: {} }));

const { checkInvitation } = await import("./invitations");

const now = new Date("2026-12-01T12:00:00Z");
const invitation = {
  email: "ana@example.com",
  expiresAt: new Date("2026-12-08T12:00:00Z"),
  acceptedAt: null,
};

describe("checkInvitation", () => {
  it("accepts a valid invitation for the same email, ignoring case", () => {
    expect(checkInvitation(invitation, { email: "Ana@Example.com" }, now)).toBe(
      "ok",
    );
  });

  it("refuses another email", () => {
    expect(checkInvitation(invitation, { email: "bob@example.com" }, now)).toBe(
      "wrongEmail",
    );
  });

  it("refuses expired and already accepted invitations", () => {
    expect(
      checkInvitation(
        { ...invitation, expiresAt: now },
        { email: invitation.email },
        now,
      ),
    ).toBe("expired");
    expect(
      checkInvitation(
        { ...invitation, acceptedAt: now },
        { email: invitation.email },
        now,
      ),
    ).toBe("accepted");
  });
});
