import Link from "next/link";
import { notFound } from "next/navigation";
import { CHAPTERS, chapterText } from "@/lib/chapters";
import { contentFor } from "@/content/registry";
import { ReadingProgress } from "@/components/reading-progress";
import { Narration } from "@/components/narration";
import { SHOW_NARRATION } from "@/lib/flags";
import { existsSync } from "node:fs";
import path from "node:path";
import { localePath, translate, type Locale } from "@/lib/i18n";
import { StarCta } from "@/components/star-cta";
import { Byline } from "@/components/byline";
import { getStars } from "@/lib/github";

export async function ChapterView({ locale, slug }: { locale: Locale; slug: string }) {
  const t = (k: string, v?: Record<string, string | number>) => translate(locale, k, v);
  const load = contentFor(locale, slug);
  const exists = CHAPTERS.some((c) => c.slug === slug);
  if (!exists || !load) notFound();
  const chapter = chapterText(locale, slug);

  const { default: Body } = await load();
  const stars = await getStars();

  // Narration is optional: the player only appears once `pnpm narrate` has
  // produced an MP3 for this chapter.
  const audio = `/audio/${slug}.mp3`;
  const hasAudio =
    SHOW_NARRATION &&
    existsSync(path.join(process.cwd(), "public", "audio", `${slug}.mp3`));

  // offered only where one has actually been generated
  // one PDF per locale; the English one is not an acceptable stand-in
  const pdfName =
    locale === "en"
      ? `world-models-101-chapter-${chapter.n}.pdf`
      : `world-models-101-chapter-${chapter.n}-${locale}.pdf`;
  const pdf = `/pdf/${pdfName}`;
  const hasPdf = existsSync(path.join(process.cwd(), "public", "pdf", pdfName));
  const next = CHAPTERS.find((c) => c.n === chapter.n + 1);
  const prev = CHAPTERS.find((c) => c.n === chapter.n - 1);

  return (
    <article>
      <ReadingProgress />

      {/* chapter plate */}
      <header className="track pt-16 pb-12 md:pt-24">
        <div>
          <Link href={localePath(locale, "/#chapters")} data-print-hide className="label hover:text-ink transition-colors">
            &larr; {t("nav.contents")}
          </Link>

          <div className="mt-8 flex items-start gap-6 md:gap-10">
            <span className="display tnum text-[clamp(3rem,9vw,6rem)] leading-[0.8] text-imagine">
              {String(chapter.n).padStart(2, "0")}
            </span>
            <div className="pt-1">
              <h1 className="display text-[clamp(2.4rem,7vw,4.6rem)] leading-[0.92]">
                {chapter.title}
              </h1>
              <Byline locale={locale} className="mt-5 block" />
              <p className="label mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{t("chapter.read", { n: chapter.minutes })}</span>
                {hasPdf && (
                  <a
                    href={pdf}
                    data-print-hide
                    className="!text-imagine underline decoration-imagine/40 underline-offset-4 transition-colors hover:decoration-imagine"
                  >
                    PDF
                  </a>
                )}
              </p>
            </div>
          </div>

          <p className="mt-10 max-w-[46ch] border-l-2 border-actual pl-5 text-[1.15rem] leading-[1.5] text-ink-muted">
            {chapter.blurb}
          </p>

          {hasAudio && (
            <div className="mt-8 max-w-[30rem]">
              <Narration src={audio} />
            </div>
          )}
        </div>
      </header>

      <div className="track prose pb-16">
        <Body />
      </div>

      {/* chapter foot */}
      <div data-print-hide className="track border-t border-ink pt-8">
        <StarCta locale={locale} stars={stars} compact />
      </div>

      <nav data-print-hide className="track mt-10 border-t border-rule pt-8">
        <div className="flex flex-col gap-8 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {prev ? (
              <Link href={localePath(locale, `/chapters/${prev.slug}`)} className="group block">
                <p className="label">{t("chapter.prev")}</p>
                <p className="display mt-2 text-2xl group-hover:text-imagine transition-colors">
                  {chapterText(locale, prev.slug).title}
                </p>
              </Link>
            ) : (
              <div>
                <p className="label">{t("chapter.start")}</p>
                <p className="display mt-2 text-2xl text-ink-faint">{t("chapter.atBeginning")}</p>
              </div>
            )}
          </div>

          <div className="sm:text-right">
            {next ? (
              next.status === "ready" ? (
                <Link href={localePath(locale, `/chapters/${next.slug}`)} className="group block">
                  <p className="label">{t("chapter.next")}</p>
                  <p className="display mt-2 text-2xl group-hover:text-imagine transition-colors">
                    {chapterText(locale, next.slug).title}
                  </p>
                </Link>
              ) : (
                <div>
                  <p className="label">Next &middot; {next.status === "drafting" ? t("chapter.drafting") : t("chapter.soon")}</p>
                  <p className="display mt-2 text-2xl text-ink-faint">{chapterText(locale, next.slug).title}</p>
                </div>
              )
            ) : null}
          </div>
        </div>
      </nav>
    </article>
  );
}
