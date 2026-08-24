import type { Metadata } from "next";
import { AboutView } from "@/components/about-view";
import { AUTHOR } from "@/lib/author";
import { translate } from "@/lib/i18n";
import { serializeJsonLd, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About",
  description: `${AUTHOR} on why World Models 101 exists, what it assumes, and how to correct it.`,
  alternates: { canonical: "/about", languages: { en: "/about" } },
  openGraph: {
    title: `About · World Models 101`,
    description: translate("en", "about.lead"),
    url: "/about",
    type: "profile",
  },
};

export default function About() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: `${SITE_URL}/about`,
    name: `About ${AUTHOR}`,
    mainEntity: {
      "@type": "Person",
      "@id": `${SITE_URL}/#author`,
      name: AUTHOR,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <AboutView locale="en" />
    </>
  );
}
