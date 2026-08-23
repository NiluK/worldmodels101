import { en } from "./dict/en";

export const LOCALES = ["en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Every locale except the default, which lives at the root. */
export const PREFIXED_LOCALES: readonly Locale[] = [];

export const LOCALE_META: Record<Locale, { label: string; htmlLang: string; href: string }> = {
  en: { label: "English", htmlLang: "en", href: "/" },
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Prefix a path for a locale. English stays at the root so live URLs do not move. */
export function localePath(locale: Locale, path = "/") {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

export function localeFromPath(pathname: string): Locale {
  const first = pathname.split("/")[1] ?? "";
  return isLocale(first) && first !== DEFAULT_LOCALE ? first : DEFAULT_LOCALE;
}

/** Strip a locale prefix when additional locales are configured. */
export function barePath(pathname: string) {
  const locale = localeFromPath(pathname);
  if (locale === DEFAULT_LOCALE) return pathname || "/";
  return pathname.replace(new RegExp(`^/${locale}`), "") || "/";
}

/**
 * UI strings. Chapter prose lives in MDX per locale; this covers the chrome and
 * everything baked into the interactive figures.
 *
 */
export type Dict = Record<string, string>;

/**
 * Locales are added to LOCALES before their dictionary is complete, so this is
 * partial on purpose: translate() falls back to English key by key, which lets
 * a half-translated language ship without holes in the chrome.
 */
const DICTS: Partial<Record<Locale, Dict>> = { en };

export function translate(locale: Locale, key: string, vars?: Record<string, string | number>) {
  const raw = DICTS[locale]?.[key] ?? en[key] ?? key;
  if (!vars) return raw;
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    raw,
  );
}
