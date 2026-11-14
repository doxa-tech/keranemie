import { describe, expect, it } from "vitest";
import { parseTime, splitMinutes } from "./time";

describe("parseTime", () => {
  it("accepts the usual ways of typing a time", () => {
    expect(parseTime("18:30")).toBe("18:30");
    expect(parseTime("1830")).toBe("18:30");
    expect(parseTime("18h30")).toBe("18:30");
    expect(parseTime("18H30")).toBe("18:30");
    expect(parseTime("18.30")).toBe("18:30");
    expect(parseTime(" 9:05 ")).toBe("09:05");
    expect(parseTime("905")).toBe("09:05");
    expect(parseTime("0")).toBe("00:00");
    expect(parseTime("18")).toBe("18:00");
    expect(parseTime("18h")).toBe("18:00");
  });

  it("rejects anything that isn't a 24-hour time", () => {
    for (const text of ["", "24:00", "18:60", "6:30 pm", "18:3", "abc", "12345"]) {
      expect(parseTime(text)).toBeNull();
    }
  });
});

describe("splitMinutes", () => {
  it("splits a duration into hours and minutes", () => {
    expect(splitMinutes(90)).toEqual({ hours: 1, minutes: 30 });
    expect(splitMinutes(45)).toEqual({ hours: 0, minutes: 45 });
    expect(splitMinutes(240)).toEqual({ hours: 4, minutes: 0 });
  });
});
