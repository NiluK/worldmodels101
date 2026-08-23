import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChapterView } from "@/components/chapter-view";
import { translatedSlugs } from "@/content/registry";
import { chapterText } from "@/lib/chapters";
import { isLocale, localePath, LOCALE_META, PREFIXED_LOCALES } from "@/lib/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LOCALES.flatMap((locale) =>
    translatedSlugs(locale).map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata(
  props: PageProps<"/[locale]/chapters/[slug]">,
): Promise<Metadata> {
  const { locale, slug } = await props.params;
  if (!isLocale(locale)) return {};
  const c = chapterText(locale, slug);
  if (!c) return {};
  return {
    title: c.title,
    description: c.blurb,
    alternates: {
      canonical: localePath(locale, `/chapters/${slug}`),
      languages: Object.fromEntries(
        Object.entries(LOCALE_META).map(([l, m]) => [
          m.htmlLang,
          localePath(l as never, `/chapters/${slug}`),
        ]),
      ),
    },
    openGraph: { title: `${c.title} · World Models 101`, description: c.blurb },
  };
}

export default async function Page(props: PageProps<"/[locale]/chapters/[slug]">) {
  const { locale, slug } = await props.params;
  if (!isLocale(locale) || locale === "en") notFound();
  return <ChapterView locale={locale} slug={slug} />;
}
