import { zh } from "./zh";

/**
 * One note per source, keyed by URL, per locale. Anything missing falls back to
 * the English note that ships beside the source itself.
 */
export const NOTE_BY_LOCALE: Record<string, Record<string, string> | undefined> = { zh };
