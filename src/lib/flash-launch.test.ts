import { describe, expect, it } from "vitest";
import { parseFlashLaunch } from "./flash-launch";

const now = new Date("2026-12-01T19:00:00.000Z");

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("parseFlashLaunch", () => {
  it("starts now", () => {
    expect(parseFlashLaunch(form({ when: "now" }), now)).toEqual({
      startsAt: now,
    });
  });

  it("starts after a timer", () => {
    expect(parseFlashLaunch(form({ when: "in", delayMin: "10" }), now)).toEqual(
      { startsAt: new Date("2026-12-01T19:10:00.000Z") },
    );
  });

  it("rejects a timer that isn't a whole number of minutes in range", () => {
    for (const delayMin of ["", "0", "1.5", "1441", "abc"]) {
      expect(parseFlashLaunch(form({ when: "in", delayMin }), now)).toEqual({
        error: "invalid",
      });
    }
  });

  it("starts at a given time", () => {
    expect(
      parseFlashLaunch(
        form({ when: "at", startsAt: "2026-12-01T21:30:00.000Z" }),
        now,
      ),
    ).toEqual({ startsAt: new Date("2026-12-01T21:30:00.000Z") });
  });

  it("accepts the current minute but not an earlier time", () => {
    expect(
      parseFlashLaunch(
        form({ when: "at", startsAt: "2026-12-01T18:59:30.000Z" }),
        now,
      ),
    ).toEqual({ startsAt: new Date("2026-12-01T18:59:30.000Z") });
    expect(
      parseFlashLaunch(
        form({ when: "at", startsAt: "2026-12-01T18:55:00.000Z" }),
        now,
      ),
    ).toEqual({ error: "past" });
  });

  it("rejects a missing time or an unknown mode", () => {
    expect(parseFlashLaunch(form({ when: "at", startsAt: "" }), now)).toEqual({
      error: "invalid",
    });
    expect(parseFlashLaunch(form({ when: "later" }), now)).toEqual({
      error: "invalid",
    });
  });
});
