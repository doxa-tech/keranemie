// A typed 24-hour time as "HH:mm", or null. Phone keypads have no colon,
// so "1830", "18h30", "18.30", "9:05" and a bare hour ("18") are accepted.
export function parseTime(text: string): string | null {
  const value = text.trim().toLowerCase();
  const match =
    value.match(/^(\d{1,2})\s*[:h.]\s*(\d{2})$/) ??
    value.match(/^(\d{1,2})(\d{2})$/) ??
    value.match(/^(\d{1,2})\s*h?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  if (hours > 23 || minutes > 59) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}`;
}

// Whole hours and remaining minutes of a duration in minutes.
export function splitMinutes(total: number) {
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}
