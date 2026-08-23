import type { Q } from "../quiz";
import { zh } from "./zh";

/**
 * Chapter quizzes per locale. A locale absent here falls back to English, and
 * so does a chapter a locale has not reached yet, which keeps a
 * half-translated language from showing another chapter's questions.
 */
export const QUIZ_BY_LOCALE: Record<string, Record<number, Q[]> | undefined> = { zh };
