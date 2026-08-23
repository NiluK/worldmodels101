import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeView } from "@/components/home-view";
import { isLocale, localePath, LOCALE_META, PREFIXED_LOCALES, translate } from "@/lib/i18n";

/**
 * Every language except English, which keeps the root so live URLs do not move.
 * dynamicParams is off: /nonsense is a 404, not a half-rendered English page.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(props: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  return {
    title: `${translate(locale, "home.h1")} 101`,
    description: translate(locale, "home.metaDescription"),
    alternates: {
      canonical: localePath(locale, "/"),
      languages: Object.fromEntries(
        Object.values(LOCALE_META).map((m) => [m.htmlLang, m.href]),
      ),
    },
  };
}

export default async function LocaleHome(props: PageProps<"/[locale]">) {
  const { locale } = await props.params;
  if (!isLocale(locale) || locale === "en") notFound();
  return <HomeView locale={locale} />;
}
