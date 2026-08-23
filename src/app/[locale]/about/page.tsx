import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutView } from "@/components/about-view";
import { isLocale, localePath, PREFIXED_LOCALES, translate } from "@/lib/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(props: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  return {
    title: translate(locale, "about.title"),
    description: translate(locale, "about.lead"),
    alternates: {
      canonical: localePath(locale, "/about"),
      languages: { en: "/about", "zh-Hans": "/zh/about" },
    },
  };
}

export default async function LocaleAbout(props: PageProps<"/[locale]/about">) {
  const { locale } = await props.params;
  if (!isLocale(locale) || locale === "en") notFound();
  return <AboutView locale={locale} />;
}
