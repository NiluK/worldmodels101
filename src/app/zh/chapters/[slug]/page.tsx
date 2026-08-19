import type { Metadata } from "next";
import { ChapterView } from "@/components/chapter-view";
import { chapterText } from "@/lib/chapters";
import { translatedSlugs } from "@/content/registry";

export function generateStaticParams() {
  return translatedSlugs("zh").map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/zh/chapters/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const c = chapterText("zh", slug);
  if (!c) return {};
  return {
    title: c.title,
    description: c.blurb,
    alternates: {
      canonical: `/zh/chapters/${slug}`,
      languages: { en: `/chapters/${slug}`, "zh-Hans": `/zh/chapters/${slug}` },
    },
    openGraph: { title: `${c.title} · World Models 101`, description: c.blurb },
  };
}

export default async function Page(props: PageProps<"/zh/chapters/[slug]">) {
  const { slug } = await props.params;
  return <ChapterView locale="zh" slug={slug} />;
}
