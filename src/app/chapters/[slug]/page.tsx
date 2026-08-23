import type { Metadata } from "next";
import { ChapterView } from "@/components/chapter-view";
import { chapterText } from "@/lib/chapters";
import { translatedSlugs } from "@/content/registry";

export function generateStaticParams() {
  return translatedSlugs("en").map((slug) => ({ slug }));
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
      languages: { en: `/chapters/${slug}`, "zh-Hans": `/zh/chapters/${slug}` },
    },
    openGraph: {
      title: `${c.title} · World Models 101`,
      description: c.blurb,
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
  return <ChapterView locale="en" slug={slug} />;
}
