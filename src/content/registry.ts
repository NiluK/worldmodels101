import type { ComponentType } from "react";

/** Explicit registry — keeps chapter imports statically analysable. */
export const CONTENT: Record<string, () => Promise<{ default: ComponentType }>> = {
  "what-people-mean": () => import("./what-people-mean.mdx"),
  "the-idea": () => import("./the-idea.mdx"),
};
