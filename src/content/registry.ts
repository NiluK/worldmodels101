import type { ComponentType } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

type Loader = () => Promise<{ default: ComponentType }>;

/** Explicit registry per locale — keeps chapter imports statically analysable. */
const EN: Record<string, Loader> = {
  "what-people-mean": () => import("./what-people-mean.mdx"),
  "the-idea": () => import("./the-idea.mdx"),
  prediction: () => import("./prediction.mdx"),
  latents: () => import("./latents.mdx"),
  dynamics: () => import("./dynamics.mdx"),
  dreaming: () => import("./dreaming.mdx"),
  jepa: () => import("./jepa.mdx"),
  "video-worlds": () => import("./video-worlds.mdx"),
  "whats-broken": () => import("./whats-broken.mdx"),
};

const ZH: Record<string, Loader> = {
  "what-people-mean": () => import("./zh/what-people-mean.mdx"),
  "the-idea": () => import("./zh/the-idea.mdx"),
  prediction: () => import("./zh/prediction.mdx"),
  latents: () => import("./zh/latents.mdx"),
  dynamics: () => import("./zh/dynamics.mdx"),
  dreaming: () => import("./zh/dreaming.mdx"),
  jepa: () => import("./zh/jepa.mdx"),
  "video-worlds": () => import("./zh/video-worlds.mdx"),
  "whats-broken": () => import("./zh/whats-broken.mdx"),
};

/**
 * Locales whose prose has been translated. A locale absent from here still has
 * a working site: the chrome, the figures and the quiz come from the
 * dictionary, and the chapter body falls back to English under a note saying
 * so. Add the map here when a language's MDX lands.
 */
const BY_LOCALE: Partial<Record<Locale, Record<string, Loader>>> = { en: EN, zh: ZH };

/** True when this locale has its own prose for this chapter. */
export function hasTranslation(locale: Locale, slug: string) {
  return Boolean(BY_LOCALE[locale]?.[slug]);
}

/** Falls back to English where a translation does not exist yet. */
export function contentFor(locale: Locale, slug: string) {
  return BY_LOCALE[locale]?.[slug] ?? EN[slug] ?? null;
}

export function translatedSlugs(locale: Locale) {
  return Object.keys(BY_LOCALE[locale] ?? BY_LOCALE[DEFAULT_LOCALE] ?? EN);
}

export const CONTENT = EN;
