import { describe, expect, it } from "vitest";
import { passwordMatches } from "./password";

describe("passwordMatches", () => {
  it("matches the configured password only", () => {
    expect(passwordMatches("open sesame", "open sesame")).toBe(true);
    expect(passwordMatches("open sesame ", "open sesame")).toBe(false);
    expect(passwordMatches("Open sesame", "open sesame")).toBe(false);
    expect(passwordMatches("", "open sesame")).toBe(false);
  });

  it("matches nothing when no password is configured", () => {
    expect(passwordMatches("", undefined)).toBe(false);
    expect(passwordMatches("", "")).toBe(false);
    expect(passwordMatches("anything", undefined)).toBe(false);
  });
});
