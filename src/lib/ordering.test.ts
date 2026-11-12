import { describe, expect, it } from "vitest";
import { moveInList } from "./ordering";

describe("moveInList", () => {
  it("moves an item up and down", () => {
    expect(moveInList(["a", "b", "c"], "b", "up")).toEqual(["b", "a", "c"]);
    expect(moveInList(["a", "b", "c"], "b", "down")).toEqual(["a", "c", "b"]);
  });

  it("keeps the list at the edges or for unknown ids", () => {
    expect(moveInList(["a", "b"], "a", "up")).toEqual(["a", "b"]);
    expect(moveInList(["a", "b"], "b", "down")).toEqual(["a", "b"]);
    expect(moveInList(["a", "b"], "x", "up")).toEqual(["a", "b"]);
  });
});
