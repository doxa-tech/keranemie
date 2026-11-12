import { describe, expect, it } from "vitest";
import { formatDuration } from "./countdown";

describe("formatDuration", () => {
  it("shows minutes and seconds under an hour", () => {
    expect(formatDuration(65_000)).toBe("01:05");
    expect(formatDuration(0)).toBe("00:00");
  });

  it("rounds up partial seconds", () => {
    expect(formatDuration(500)).toBe("00:01");
  });

  it("shows hours when needed", () => {
    expect(formatDuration(3_725_000)).toBe("1:02:05");
  });

  it("shows days beyond 24 hours", () => {
    expect(formatDuration(3 * 86_400_000 + 3_725_000)).toBe("3d 01:02:05");
    expect(formatDuration(86_400_000, "j")).toBe("1j 00:00:00");
  });
});
