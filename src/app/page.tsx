import type { Metadata } from "next";
import { HomeView } from "@/components/home-view";
import { translate } from "@/lib/i18n";
import { AUTHOR, AUTHOR_URL } from "@/lib/author";
import { CHAPTERS } from "@/lib/chapters";
import { serializeJsonLd, SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  description: translate("en", "home.metaDescription"),
  alternates: { canonical: "/", languages: { en: "/" } },
};

export default function Home() {
  const description = translate("en", "home.metaDescription");
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description,
        inLanguage: "en",
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#author`,
        name: AUTHOR,
        url: `${SITE_URL}/about`,
        sameAs: [AUTHOR_URL, "https://github.com/NiluK"],
      },
      {
        "@type": "Course",
        "@id": `${SITE_URL}/#course`,
        url: SITE_URL,
        name: SITE_NAME,
        description,
        inLanguage: "en",
        isAccessibleForFree: true,
        educationalLevel: "Beginner",
        author: { "@id": `${SITE_URL}/#author` },
        provider: { "@id": `${SITE_URL}/#author` },
        hasPart: CHAPTERS.map((chapter) => ({
          "@type": "LearningResource",
          position: chapter.n,
          name: chapter.title,
          description: chapter.blurb,
          url: `${SITE_URL}/chapters/${chapter.slug}`,
          inLanguage: "en",
          isAccessibleForFree: true,
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <HomeView locale="en" />
    </>
  );
}
