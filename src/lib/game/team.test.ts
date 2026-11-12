import { describe, expect, it } from "vitest";
import { pickTeam } from "./team";

describe("pickTeam", () => {
  it("returns null without teams", () => {
    expect(pickTeam([])).toBeNull();
  });

  it("picks the smallest team", () => {
    const teams = [
      { id: "a", playerCount: 3 },
      { id: "b", playerCount: 1 },
      { id: "c", playerCount: 2 },
    ];
    expect(pickTeam(teams)?.id).toBe("b");
  });

  it("breaks ties with the random function", () => {
    const teams = [
      { id: "a", playerCount: 1 },
      { id: "b", playerCount: 1 },
      { id: "c", playerCount: 2 },
    ];
    expect(pickTeam(teams, () => 0)?.id).toBe("a");
    expect(pickTeam(teams, () => 0.99)?.id).toBe("b");
  });
});
