"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_META,
  localeFromPath,
  translate,
  type Locale,
} from "@/lib/i18n";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/**
 * Locale is derived from the pathname, not from the value the server passed in.
 *
 * The root layout resolves the locale from a request header, and Next does not
 * re-run a root layout on client-side navigation. Trusting that value left the
 * page half-translated after a switch: the route's own server components
 * re-rendered in the new language while the header, every interactive figure
 * and the <html> attributes stayed on the old one. Since data-locale drives the
 * CJK font stack, Chinese also rendered in a Latin face with Latin leading.
 *
 * The server value is still the initial render, so SSR output is correct and
 * there is no flash on first paint; usePathname then keeps it honest across
 * every navigation after that.
 */
export function LocaleProvider({
  locale: initial,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const locale = pathname ? localeFromPath(pathname) : initial;

  useEffect(() => {
    const el = document.documentElement;
    el.lang = LOCALE_META[locale].htmlLang;
    el.dataset.locale = locale;
  }, [locale]);

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

/** t("map.ordered") inside any client component. */
export function useT() {
  const locale = useLocale();
  return (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
}
