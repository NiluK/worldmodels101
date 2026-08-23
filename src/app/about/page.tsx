import type { Metadata } from "next";
import { AboutView } from "@/components/about-view";
import { AUTHOR } from "@/lib/author";
import { translate } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "About",
  description: `${AUTHOR} on why World Models 101 exists, what it assumes, and how to correct it.`,
  alternates: { canonical: "/about", languages: { en: "/about" } },
  openGraph: { title: `About · World Models 101`, description: translate("en", "about.lead") },
};

export default function About() {
  return <AboutView locale="en" />;
}
