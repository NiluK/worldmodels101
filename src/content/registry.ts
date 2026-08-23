import type { ComponentType } from "react";

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

export function contentFor(slug: string) {
  return EN[slug] ?? null;
}

export function translatedSlugs() {
  return Object.keys(EN);
}

export const CONTENT = EN;
