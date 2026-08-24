import type { Metadata } from "next";
import { ChapterView } from "@/components/chapter-view";
import { chapterText } from "@/lib/chapters";
import { translatedSlugs } from "@/content/registry";
import { AUTHOR, AUTHOR_URL } from "@/lib/author";
import { serializeJsonLd, SITE_NAME, SITE_URL } from "@/lib/seo";

export function generateStaticParams() {
  return translatedSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/chapters/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const c = chapterText("en", slug);
  if (!c) return {};
  return {
    title: c.title,
    description: c.blurb,
    alternates: {
      canonical: `/chapters/${slug}`,
      languages: { en: `/chapters/${slug}` },
    },
    openGraph: {
      title: `${c.title} · World Models 101`,
      description: c.blurb,
      url: `/chapters/${slug}`,
      siteName: SITE_NAME,
      type: "article",
      images: [{ url: `/og/${slug}.png`, width: 1200, height: 630, alt: c.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: c.title,
      description: c.blurb,
      images: [`/og/${slug}.png`],
    },
  };
}

export default async function Page(props: PageProps<"/chapters/[slug]">) {
  const { slug } = await props.params;
  const chapter = chapterText("en", slug);
  const url = `${SITE_URL}/chapters/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Article", "LearningResource"],
        "@id": `${url}/#article`,
        url,
        mainEntityOfPage: url,
        headline: chapter.title,
        description: chapter.blurb,
        image: `${SITE_URL}/og/${slug}.png`,
        inLanguage: "en",
        position: chapter.n,
        isAccessibleForFree: true,
        author: {
          "@type": "Person",
          name: AUTHOR,
          url: AUTHOR_URL,
        },
        isPartOf: {
          "@type": "Course",
          "@id": `${SITE_URL}/#course`,
          name: SITE_NAME,
          url: SITE_URL,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: SITE_NAME,
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: chapter.title,
            item: url,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <ChapterView locale="en" slug={slug} />
    </>
  );
}
