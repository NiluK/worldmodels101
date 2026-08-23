import type { Metadata } from "next";
import { HomeView } from "@/components/home-view";
import { translate } from "@/lib/i18n";

export const metadata: Metadata = {
  description: translate("en", "home.metaDescription"),
  alternates: { canonical: "/", languages: { en: "/" } },
};

export default function Home() {
  return <HomeView locale="en" />;
}
