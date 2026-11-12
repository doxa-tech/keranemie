import { describe, expect, it } from "vitest";
import { toLocalInputValue } from "./dates";

describe("toLocalInputValue", () => {
  it("formats in the given time zone", () => {
    const date = new Date("2026-12-01T18:05:00Z");
    expect(toLocalInputValue(date, "UTC")).toBe("2026-12-01T18:05");
    expect(toLocalInputValue(date, "Europe/Paris")).toBe("2026-12-01T19:05");
    expect(toLocalInputValue(date, "America/New_York")).toBe(
      "2026-12-01T13:05",
    );
  });

  it("uses 00 for midnight", () => {
    expect(
      toLocalInputValue(new Date("2026-12-01T23:30:00Z"), "Europe/Paris"),
    ).toBe("2026-12-02T00:30");
  });
});
