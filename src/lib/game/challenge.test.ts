import { describe, expect, it } from "vitest";
import {
  flashEndsAt,
  flashState,
  isChallengeAvailable,
  normalizeAnswer,
  validateSubmission,
} from "./challenge";

const party = {
  openedAt: new Date("2026-12-01T17:00:00Z"),
  startsAt: new Date("2026-12-01T18:00:00Z"),
  endsAt: new Date("2026-12-01T22:00:00Z"),
};
const during = new Date("2026-12-01T19:00:00Z");

const permanent = {
  kind: "permanent" as const,
  hidden: false,
  flashStartsAt: null,
  flashDurationMin: null,
};

const flash = {
  kind: "flash" as const,
  hidden: false,
  flashStartsAt: new Date("2026-12-01T19:00:00Z"),
  flashDurationMin: 15,
};

describe("flash timing", () => {
  it("ends after its duration", () => {
    expect(flashEndsAt(flash)).toEqual(new Date("2026-12-01T19:15:00Z"));
    expect(flashEndsAt(permanent)).toBeNull();
  });

  it("is upcoming, running, then over", () => {
    expect(flashState(flash, new Date("2026-12-01T18:59:59Z"))).toBe(
      "upcoming",
    );
    expect(flashState(flash, new Date("2026-12-01T19:00:00Z"))).toBe(
      "running",
    );
    expect(flashState(flash, new Date("2026-12-01T19:15:00Z"))).toBe("over");
  });
});

describe("isChallengeAvailable", () => {
  it("needs a live party", () => {
    expect(isChallengeAvailable(permanent, party, during)).toBe(true);
    expect(
      isChallengeAvailable(permanent, party, new Date("2026-12-01T17:30:00Z")),
    ).toBe(false);
    expect(
      isChallengeAvailable(permanent, { ...party, openedAt: null }, during),
    ).toBe(false);
  });

  it("is never available when hidden", () => {
    expect(
      isChallengeAvailable({ ...permanent, hidden: true }, party, during),
    ).toBe(false);
  });

  it("is available only while a flash challenge runs", () => {
    expect(isChallengeAvailable(flash, party, during)).toBe(true);
    expect(
      isChallengeAvailable(flash, party, new Date("2026-12-01T19:20:00Z")),
    ).toBe(false);
  });
});

describe("normalizeAnswer", () => {
  it("ignores case, accents and extra spaces", () => {
    expect(normalizeAnswer("  Crème   BRÛLÉE ")).toBe("creme brulee");
  });
});

describe("validateSubmission", () => {
  const text = {
    validation: "auto" as const,
    points: 10,
    type: "text" as const,
    expectedAnswer: "Tour Eiffel",
  };

  it("leaves manual challenges pending", () => {
    expect(validateSubmission({ ...text, validation: "manual" }, "x")).toEqual(
      { status: "pending" },
    );
  });

  it("approves a matching answer and rejects a wrong one", () => {
    expect(validateSubmission(text, "tour eiffel")).toEqual({
      status: "approved",
      points: 10,
    });
    expect(validateSubmission(text, "Louvre")).toEqual({
      status: "rejected",
      reason: "wrong_answer",
    });
  });

  it("approves auto challenges without an expected answer", () => {
    expect(validateSubmission({ ...text, expectedAnswer: null }, "x")).toEqual(
      { status: "approved", points: 10 },
    );
    expect(
      validateSubmission(
        { ...text, type: "photo", expectedAnswer: null },
        null,
      ),
    ).toEqual({ status: "approved", points: 10 });
  });
});
