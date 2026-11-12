import { describe, expect, it } from "vitest";
import { safePath } from "./safe-path";

describe("safePath", () => {
  it("keeps app paths", () => {
    expect(safePath("/invite/abc")).toBe("/invite/abc");
  });

  it("rejects other sites and non-strings", () => {
    expect(safePath("https://evil.example")).toBeUndefined();
    expect(safePath("//evil.example")).toBeUndefined();
    expect(safePath("/\\evil.example")).toBeUndefined();
    expect(safePath(null)).toBeUndefined();
  });
});
