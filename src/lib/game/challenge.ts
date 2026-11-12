import { partyStatus, type PartyTimes } from "./party";

export type ChallengeTiming = {
  kind: "permanent" | "flash";
  hidden: boolean;
  flashStartsAt: Date | null;
  flashDurationMin: number | null;
};

export function flashEndsAt(challenge: ChallengeTiming): Date | null {
  if (challenge.kind !== "flash" || !challenge.flashStartsAt) return null;
  return new Date(
    challenge.flashStartsAt.getTime() +
      (challenge.flashDurationMin ?? 0) * 60_000,
  );
}

export type FlashState = "upcoming" | "running" | "over";

export function flashState(challenge: ChallengeTiming, now: Date): FlashState {
  const end = flashEndsAt(challenge);
  if (!challenge.flashStartsAt || !end) return "over";
  if (now < challenge.flashStartsAt) return "upcoming";
  if (now < end) return "running";
  return "over";
}

// A challenge can be submitted when the party is live, the challenge isn't
// hidden and, for a flash challenge, it is running.
export function isChallengeAvailable(
  challenge: ChallengeTiming,
  party: PartyTimes,
  now: Date,
): boolean {
  if (partyStatus(party, now) !== "live") return false;
  if (challenge.hidden) return false;
  if (challenge.kind === "permanent") return true;
  return flashState(challenge, now) === "running";
}

// Case, accent and whitespace insensitive comparison of text answers.
export function normalizeAnswer(answer: string): string {
  return answer
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export type AutoValidation =
  | { status: "approved"; points: number }
  | { status: "rejected"; reason: "wrong_answer" }
  | { status: "pending" };

// Outcome of a new submission, before any admin review.
export function validateSubmission(
  challenge: {
    validation: "auto" | "manual";
    points: number;
    type: "photo" | "text";
    expectedAnswer: string | null;
  },
  textAnswer: string | null,
): AutoValidation {
  if (challenge.validation === "manual") return { status: "pending" };
  if (challenge.type === "text" && challenge.expectedAnswer) {
    const matches =
      normalizeAnswer(textAnswer ?? "") ===
      normalizeAnswer(challenge.expectedAnswer);
    if (!matches) return { status: "rejected", reason: "wrong_answer" };
  }
  return { status: "approved", points: challenge.points };
}

// The next time the list of available challenges changes on its own:
// a flash challenge starting or ending, or the party ending.
export function nextScheduledChange(
  challenges: ChallengeTiming[],
  partyEndsAt: Date,
  now: Date,
): Date | null {
  const times = [partyEndsAt];
  for (const challenge of challenges) {
    if (challenge.kind !== "flash" || challenge.hidden) continue;
    if (challenge.flashStartsAt) times.push(challenge.flashStartsAt);
    const end = flashEndsAt(challenge);
    if (end) times.push(end);
  }
  const future = times.filter((t) => t > now).map((t) => t.getTime());
  return future.length ? new Date(Math.min(...future)) : null;
}

// A flash challenge whose start should be announced now: started, still
// running, visible, in a live party, and not announced yet.
export function isFlashStartDue(
  challenge: ChallengeTiming & { startNotifiedAt: Date | null },
  party: PartyTimes,
  now: Date,
): boolean {
  return (
    challenge.kind === "flash" &&
    challenge.startNotifiedAt === null &&
    isChallengeAvailable(challenge, party, now)
  );
}
