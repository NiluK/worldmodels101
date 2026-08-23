import type { Locale } from "./i18n";

/**
 * A component's own string table.
 *
 * English is required and every other locale is optional, so a component can
 * ship before its translations do and fall back rather than render undefined.
 * Read it with pickText, never with a bare index: a bare index is what breaks,
 * in every component at once, the next time a locale joins LOCALES.
 *
 * Two overloads because the tables are written two ways. Most are object
 * literals (often `as const`), where the English shape is the return type; a
 * few are annotated `Record<string, Strings>`, which the first overload cannot
 * match because an index signature does not satisfy a declared property.
 */
export type LocaleText<T> = { en: T } & Partial<Record<Locale, T>>;

export function pickText<T extends { en: unknown }>(table: T, locale: Locale): T["en"];
export function pickText<T>(table: Record<string, T>, locale: Locale): T;
export function pickText(table: Record<string, unknown>, locale: string): unknown {
  return table[locale] ?? table.en;
}
