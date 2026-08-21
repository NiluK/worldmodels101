import type { ComponentType } from "react";
import type { Locale } from "@/lib/i18n";

/** Explicit registry per locale — keeps chapter imports statically analysable. */
const EN: Record<string, () => Promise<{ default: ComponentType }>> = {
  "what-people-mean": () => import("./what-people-mean.mdx"),
  "the-idea": () => import("./the-idea.mdx"),
  prediction: () => import("./prediction.mdx"),
  latents: () => import("./latents.mdx"),
  dynamics: () => import("./dynamics.mdx"),
  dreaming: () => import("./dreaming.mdx"),
  jepa: () => import("./jepa.mdx"),
};

const ZH: Record<string, () => Promise<{ default: ComponentType }>> = {
  "what-people-mean": () => import("./zh/what-people-mean.mdx"),
  "the-idea": () => import("./zh/the-idea.mdx"),
  prediction: () => import("./zh/prediction.mdx"),
  latents: () => import("./zh/latents.mdx"),
  dynamics: () => import("./zh/dynamics.mdx"),
  dreaming: () => import("./zh/dreaming.mdx"),
  jepa: () => import("./zh/jepa.mdx"),
};

export const CONTENT = EN;

/** Falls back to English where a translation does not exist yet. */
export function contentFor(locale: Locale, slug: string) {
  if (locale === "zh") return ZH[slug] ?? null;
  return EN[slug] ?? null;
}

export function translatedSlugs(locale: Locale) {
  return Object.keys(locale === "zh" ? ZH : EN);
}
