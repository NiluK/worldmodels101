import type { LocalisedDefinition } from "../definitions";
import { zh } from "./zh";

/** The five definitions, per locale. Missing entries fall back to English. */
export const DEFINITION_TEXT_BY_LOCALE: Record<
  string,
  Record<string, LocalisedDefinition> | undefined
> = { zh };
