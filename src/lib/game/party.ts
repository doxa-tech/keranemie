export type PartyStatus = "draft" | "open" | "live" | "ended";

export type PartyTimes = {
  openedAt: Date | null;
  // Null: not scheduled, started by hand.
  startsAt: Date | null;
  // Null: runs until ended by hand.
  endsAt: Date | null;
};

// The status is derived from timestamps: "open now", "start now" and
// "end now" just set the matching timestamp to the current time.
export function partyStatus(party: PartyTimes, now: Date): PartyStatus {
  if (!party.openedAt) return "draft";
  if (!party.startsAt || now < party.startsAt) return "open";
  if (!party.endsAt || now < party.endsAt) return "live";
  return "ended";
}

// The planned length in minutes, or null when the party runs until ended
// by hand. Parties created before durations were stored have none: their
// length comes from their times.
export function plannedDurationMin(
  party: PartyTimes & { durationMin: number | null },
): number | null {
  if (party.durationMin) return party.durationMin;
  if (party.startsAt && party.endsAt) {
    return Math.round((party.endsAt.getTime() - party.startsAt.getTime()) / 60_000);
  }
  return null;
}

// Players can join an open or live party.
export function canJoin(status: PartyStatus): boolean {
  return status === "open" || status === "live";
}

// No 0/O or 1/I, so codes are easy to read aloud and type.
const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const JOIN_CODE_LENGTH = 6;

export function generateJoinCode(
  randomInt: (max: number) => number = defaultRandomInt,
): string {
  let code = "";
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
    code += JOIN_CODE_ALPHABET[randomInt(JOIN_CODE_ALPHABET.length)];
  }
  return code;
}

// Accepts what players type: lowercase, spaces, dashes.
export function normalizeJoinCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function defaultRandomInt(max: number): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] % max;
}
