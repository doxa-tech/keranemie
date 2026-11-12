export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const localeCookie = "locale";

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

// Picks the first supported language from an Accept-Language header.
export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return defaultLocale;
  const languages = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of languages) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}
