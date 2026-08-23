import { zh } from "./zh";

/** Chapter title, blurb and demo line, per locale. Missing entries use English. */
export type ChapterText = { title: string; blurb: string; demo: string };

export const CHAPTER_TEXT_BY_LOCALE: Record<
  string,
  Record<string, ChapterText> | undefined
> = { zh };
