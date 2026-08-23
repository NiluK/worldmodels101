import { en } from "./dict/en";
import { zh } from "./dict/zh";

export const LOCALES = ["en", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Every locale except the default, which lives at the root. */
export const PREFIXED_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

export const LOCALE_META: Record<Locale, { label: string; htmlLang: string; href: string }> = {
  en: { label: "English", htmlLang: "en", href: "/" },
  zh: { label: "简体中文", htmlLang: "zh-Hans", href: "/zh" },
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

/** Strip the locale prefix, so /zh/chapters/x and /chapters/x both give /chapters/x. */
export function barePath(pathname: string) {
  const locale = localeFromPath(pathname);
  if (locale === DEFAULT_LOCALE) return pathname || "/";
  return pathname.replace(new RegExp(`^/${locale}`), "") || "/";
}

/**
 * UI strings. Chapter prose lives in MDX per locale; this covers the chrome and
 * everything baked into the interactive figures.
 *
 * Terminology decisions worth recording, because they are judgement calls a
 * reviewer should check rather than silent defaults:
 *   world model      世界模型   (established)
 *   Renderer         渲染器
 *   Simulator        仿真器     (not 模拟器, which commonly reads as "emulator")
 *   Dynamics Model   动力学模型
 *   Representation   表征模型   (表征 is standard for "representation" in ML)
 *   Implicit Model   内隐模型
 *   state            状态       observation 观测
 *   partial observability 部分可观测性
 *   latent           潜在／隐   embedding 嵌入
 *   horizon          预测步长
 */
export type Dict = Record<string, string>;

/**
 * Locales are added to LOCALES before their dictionary is complete, so this is
 * partial on purpose: translate() falls back to English key by key, which lets
 * a half-translated language ship without holes in the chrome.
 */
const DICTS: Partial<Record<Locale, Dict>> = { en, zh };

export function translate(locale: Locale, key: string, vars?: Record<string, string | number>) {
  const raw = DICTS[locale]?.[key] ?? en[key] ?? key;
  if (!vars) return raw;
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    raw,
  );
}
