import { describe, expect, it } from "vitest";
import { parsePartyForm, partyFormError } from "./party-form";

function form(values: Record<string, string>) {
  const data = new FormData();
  const defaults = {
    name: "Summer party",
    description: "",
    startsAt: "2026-12-01T18:00:00.000Z",
    durationMin: "180",
  };
  for (const [key, value] of Object.entries({ ...defaults, ...values })) {
    data.set(key, value);
  }
  return data;
}

describe("parsePartyForm", () => {
  it("computes the end from the start and the duration", () => {
    const result = parsePartyForm(form({ durationMin: "90" }));
    expect(result.data).toMatchObject({
      startsAt: new Date("2026-12-01T18:00:00.000Z"),
      endsAt: new Date("2026-12-01T19:30:00.000Z"),
    });
  });

  it("accepts parties over several days, up to two weeks", () => {
    expect(parsePartyForm(form({ durationMin: String(2 * 24 * 60) })).success).toBe(true);
    expect(parsePartyForm(form({ durationMin: String(14 * 24 * 60) })).success).toBe(true);
  });

  it("leaves the start and the end to be set by hand", () => {
    expect(parsePartyForm(form({ startsAt: "" })).data).toMatchObject({
      startsAt: null,
      durationMin: 180,
      endsAt: null,
    });
    expect(parsePartyForm(form({ durationMin: "" })).data).toMatchObject({
      startsAt: new Date("2026-12-01T18:00:00.000Z"),
      durationMin: null,
      endsAt: null,
    });
  });

  it("reports an out of range duration", () => {
    for (const durationMin of ["0", "1.5", String(14 * 24 * 60 + 1)]) {
      const result = parsePartyForm(form({ durationMin }));
      expect(result.success).toBe(false);
      expect(partyFormError(result.error!)).toBe("duration");
    }
  });

  it("reports other errors as invalid", () => {
    const result = parsePartyForm(form({ name: " ", startsAt: "soon" }));
    expect(partyFormError(result.error!)).toBe("invalid");
  });
});
