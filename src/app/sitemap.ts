import type { MetadataRoute } from "next";
import { CHAPTERS } from "@/lib/chapters";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
    },
    ...CHAPTERS.map((chapter) => ({
      url: `${SITE_URL}/chapters/${chapter.slug}`,
    })),
    {
      url: `${SITE_URL}/about`,
    },
  ];
}
