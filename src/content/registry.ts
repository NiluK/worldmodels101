import type { ComponentType } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

type Loader = () => Promise<{ default: ComponentType }>;

/** Explicit registry per locale — keeps chapter imports statically analysable. */
const EN: Record<string, Loader> = {
  "what-is-a-world-model": () => import("./what-is-a-world-model.mdx"),
  "how-do-world-models-work": () => import("./how-do-world-models-work.mdx"),
  "why-prediction-is-learning": () => import("./why-prediction-is-learning.mdx"),
  "what-is-latent-space": () => import("./what-is-latent-space.mdx"),
  "what-is-a-dynamics-model": () => import("./what-is-a-dynamics-model.mdx"),
  "can-ai-learn-inside-a-world-model": () => import("./can-ai-learn-inside-a-world-model.mdx"),
  "what-is-jepa": () => import("./what-is-jepa.mdx"),
  "are-video-models-world-simulators": () => import("./are-video-models-world-simulators.mdx"),
  "what-is-still-broken": () => import("./what-is-still-broken.mdx"),
};

const ZH: Record<string, Loader> = {
  "what-is-a-world-model": () => import("./zh/what-is-a-world-model.mdx"),
  "how-do-world-models-work": () => import("./zh/how-do-world-models-work.mdx"),
  "why-prediction-is-learning": () => import("./zh/why-prediction-is-learning.mdx"),
  "what-is-latent-space": () => import("./zh/what-is-latent-space.mdx"),
  "what-is-a-dynamics-model": () => import("./zh/what-is-a-dynamics-model.mdx"),
  "can-ai-learn-inside-a-world-model": () => import("./zh/can-ai-learn-inside-a-world-model.mdx"),
  "what-is-jepa": () => import("./zh/what-is-jepa.mdx"),
  "are-video-models-world-simulators": () => import("./zh/are-video-models-world-simulators.mdx"),
  "what-is-still-broken": () => import("./zh/what-is-still-broken.mdx"),
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
