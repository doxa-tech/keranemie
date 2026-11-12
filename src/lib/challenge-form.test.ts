import { describe, expect, it } from "vitest";
import { parseChallengeForm } from "./challenge-form";

function form(values: Record<string, string>) {
  const data = new FormData();
  const defaults = {
    title: "Group selfie",
    description: "",
    type: "photo",
    points: "10",
    validation: "manual",
    expectedAnswer: "",
    kind: "permanent",
    flashStartsAt: "",
    flashDurationMin: "",
  };
  for (const [key, value] of Object.entries({ ...defaults, ...values })) {
    data.set(key, value);
  }
  return data;
}

describe("parseChallengeForm", () => {
  it("parses a permanent challenge and drops flash fields", () => {
    const result = parseChallengeForm(
      form({ flashStartsAt: "2026-12-01T19:00:00.000Z", flashDurationMin: "15" }),
    );
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      points: 10,
      kind: "permanent",
      flashStartsAt: null,
      flashDurationMin: null,
    });
  });

  it("requires a start and a duration for flash challenges", () => {
    expect(parseChallengeForm(form({ kind: "flash" })).success).toBe(false);
    expect(
      parseChallengeForm(
        form({
          kind: "flash",
          flashStartsAt: "2026-12-01T19:00:00.000Z",
          flashDurationMin: "0",
        }),
      ).success,
    ).toBe(false);
    const result = parseChallengeForm(
      form({
        kind: "flash",
        flashStartsAt: "2026-12-01T19:00:00.000Z",
        flashDurationMin: "15",
      }),
    );
    expect(result.data).toMatchObject({
      flashStartsAt: new Date("2026-12-01T19:00:00.000Z"),
      flashDurationMin: 15,
    });
  });

  it("keeps the expected answer only for text challenges", () => {
    expect(
      parseChallengeForm(form({ expectedAnswer: "Paris" })).data
        ?.expectedAnswer,
    ).toBeNull();
    expect(
      parseChallengeForm(form({ type: "text", expectedAnswer: " Paris " }))
        .data?.expectedAnswer,
    ).toBe("Paris");
  });

  it("rejects negative points and empty titles", () => {
    expect(parseChallengeForm(form({ points: "-1" })).success).toBe(false);
    expect(parseChallengeForm(form({ title: " " })).success).toBe(false);
  });
});
