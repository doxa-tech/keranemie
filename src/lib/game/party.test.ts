import { describe, expect, it } from "vitest";
import {
  canJoin,
  generateJoinCode,
  JOIN_CODE_LENGTH,
  normalizeJoinCode,
  partyStatus,
  plannedDurationMin,
} from "./party";

const startsAt = new Date("2026-12-01T18:00:00Z");
const endsAt = new Date("2026-12-01T22:00:00Z");
const before = new Date("2026-12-01T17:00:00Z");
const during = new Date("2026-12-01T19:00:00Z");

describe("partyStatus", () => {
  it("is draft until opened, whatever the time", () => {
    expect(partyStatus({ openedAt: null, startsAt, endsAt }, during)).toBe(
      "draft",
    );
  });

  it("is open, then live, then ended once opened", () => {
    const party = { openedAt: before, startsAt, endsAt };
    expect(partyStatus(party, before)).toBe("open");
    expect(partyStatus(party, startsAt)).toBe("live");
    expect(partyStatus(party, during)).toBe("live");
    expect(partyStatus(party, endsAt)).toBe("ended");
  });

  it("stays open until started by hand, and live until ended by hand", () => {
    const later = new Date("2027-06-01T00:00:00Z");
    expect(
      partyStatus({ openedAt: before, startsAt: null, endsAt: null }, later),
    ).toBe("open");
    expect(
      partyStatus({ openedAt: before, startsAt, endsAt: null }, later),
    ).toBe("live");
  });
});

describe("plannedDurationMin", () => {
  it("uses the chosen duration, else the scheduled times", () => {
    const times = { openedAt: null, startsAt: null, endsAt: null };
    expect(plannedDurationMin({ ...times, durationMin: 90 })).toBe(90);
    expect(
      plannedDurationMin({ ...times, startsAt, endsAt, durationMin: null }),
    ).toBe(240);
    expect(plannedDurationMin({ ...times, startsAt, durationMin: null })).toBeNull();
  });
});

describe("canJoin", () => {
  it("allows joining only open and live parties", () => {
    expect(canJoin("draft")).toBe(false);
    expect(canJoin("open")).toBe(true);
    expect(canJoin("live")).toBe(true);
    expect(canJoin("ended")).toBe(false);
  });
});

describe("generateJoinCode", () => {
  it("returns 6 characters without ambiguous ones", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateJoinCode();
      expect(code).toHaveLength(JOIN_CODE_LENGTH);
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]+$/);
    }
  });
});

describe("normalizeJoinCode", () => {
  it("uppercases and strips separators", () => {
    expect(normalizeJoinCode(" ab3-x9 k ")).toBe("AB3X9K");
  });
});
