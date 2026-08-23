import { existsSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { Byline } from "@/components/byline";
import { DefinitionMap } from "@/components/definition-map";
import { PredictionHero } from "@/components/prediction-hero";
import { StarCta } from "@/components/star-cta";
import { CHAPTERS, chapterText } from "@/lib/chapters";
import { getStars } from "@/lib/github";
import { localePath, translate, type Locale } from "@/lib/i18n";

/**
 * The landing page.
 */
export async function HomeView({ locale }: { locale: Locale }) {
  const stars = await getStars();
  const bookName = "world-models-101.pdf";
  const hasBook = existsSync(join(process.cwd(), "public", "pdf", bookName));
  const t = (k: string, v?: Record<string, string | number>) => translate(locale, k, v);
  const path = (p: string) => localePath(locale, p);

  return (
    <>
      {/* ── hero ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[84rem] px-6 pb-10 pt-16 md:px-10 md:pt-24">
        <p className="label rise" style={{ animationDelay: "0ms" }}>
          {t("site.tagline")}
        </p>
        <h1
          className="display rise mt-5 text-[clamp(2.8rem,10vw,8rem)]"
          style={{ animationDelay: "70ms" }}
        >
          {t("home.h1")}
          <span className="ml-4 align-super font-mono text-[0.18em] tracking-[0.2em] text-imagine">
            101
          </span>
        </h1>
        <p
          className="rise mt-8 max-w-[36ch] text-[clamp(1.2rem,2.3vw,1.6rem)] leading-[1.45] text-ink md:max-w-[42ch]"
          style={{ animationDelay: "150ms" }}
        >
          {t("site.deck")}
        </p>
        <div
          className="rise mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
          style={{ animationDelay: "230ms" }}
        >
          <Link
            href={path(`/chapters/${CHAPTERS[0].slug}`)}
            className="group inline-flex items-center gap-3 border border-ink bg-ink px-6 py-3 text-paper transition-colors hover:border-imagine hover:bg-imagine"
          >
            <span className="label !text-paper">{t("site.begin")}</span>
            <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </Link>
          {hasBook && (
            <a
              href={`/pdf/${bookName}`}
              className="label !text-imagine underline decoration-imagine/40 underline-offset-4 transition-colors hover:decoration-imagine"
            >
              {t("site.book")}
            </a>
          )}
          <Byline locale={locale} />
        </div>
      </section>

      <div className="rise mt-6" style={{ animationDelay: "300ms" }}>
        <PredictionHero />
      </div>

      {/* ── the disambiguation: the reason this site exists ─────────── */}
      <section id="map" className="mx-auto mt-28 max-w-[84rem] px-6 md:px-10">
        <div className="flex flex-col gap-4 border-b border-ink pb-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="display text-[clamp(1.8rem,4.6vw,3.2rem)] leading-tight">
            {t("home.mapTitle")}
          </h2>
          <p className="label max-w-[34ch] sm:text-right">{t("home.mapNote")}</p>
        </div>
        <div className="mt-8">
          <DefinitionMap />
        </div>
      </section>

      {/* ── the premise ──────────────────────────────────────────────── */}
      <section className="mx-auto mt-28 max-w-[84rem] px-6 md:px-10">
        <div className="grid gap-x-16 gap-y-10 md:grid-cols-[13rem_minmax(0,40rem)]">
          <p className="label md:pt-3">{t("home.premise")}</p>
          <div className="prose">
            <p className="text-[1.25rem] leading-[1.6]">{t("home.premise.p1")}</p>
            <p>{t("home.premise.p2")}</p>
            <p>{t("home.premise.p3")}</p>
          </div>
        </div>
      </section>

      {/* ── chapters ─────────────────────────────────────────────────── */}
      <section id="chapters" className="mx-auto mt-32 max-w-[84rem] px-6 md:px-10">
        <div className="flex items-baseline justify-between border-b border-ink pb-3">
          <h2 className="display text-[clamp(1.8rem,4.6vw,3.2rem)]">{t("home.contents")}</h2>
          <p className="label">{t("home.chapterCount", { n: CHAPTERS.length })}</p>
        </div>

        <ol>
          {CHAPTERS.map((c) => {
            const live = c.status === "ready";
            const text = chapterText(locale, c.slug);
            const Row = (
              <div
                className={`grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-5 py-8 md:grid-cols-[5rem_minmax(0,1fr)_11rem] md:gap-x-10 ${
                  live ? "" : "opacity-55"
                }`}
              >
                <span className="display tnum text-[2.4rem] leading-none text-ink-faint transition-colors group-hover:text-imagine md:text-[3.2rem]">
                  {String(c.n).padStart(2, "0")}
                </span>

                <div>
                  <h3 className="display text-[clamp(1.4rem,2.8vw,2.2rem)] leading-tight">
                    {text.title}
                  </h3>
                  <p className="mt-3 max-w-[52ch] text-ink-muted">{text.blurb}</p>
                  {text.demo && (
                    <p className="mt-4 flex max-w-[52ch] gap-2.5 font-mono text-[0.78rem] leading-relaxed text-imagine">
                      <span aria-hidden className="select-none">
                        &#9656;
                      </span>
                      <span>{text.demo}</span>
                    </p>
                  )}
                </div>

                <div className="col-start-2 mt-5 flex items-center gap-4 md:col-start-3 md:mt-1 md:justify-end">
                  <span className={`label ${live ? "!text-imagine" : ""}`}>
                    {live
                      ? t("chapter.readArrow")
                      : c.status === "drafting"
                        ? t("chapter.drafting")
                        : t("chapter.soon")}
                  </span>
                </div>
              </div>
            );

            return (
              <li key={c.slug} className="border-b border-rule">
                {live ? (
                  <Link
                    href={path(`/chapters/${c.slug}`)}
                    className="group block transition-colors hover:bg-paper-raised"
                  >
                    {Row}
                  </Link>
                ) : (
                  <div className="group cursor-default">{Row}</div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── audience ─────────────────────────────────────────────────── */}
      <section className="mx-auto mt-32 max-w-[84rem] px-6 md:px-10">
        <div className="grid gap-x-16 gap-y-10 md:grid-cols-[13rem_minmax(0,40rem)]">
          <p className="label md:pt-3">{t("home.audience")}</p>
          <div className="grid gap-8 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-ink pt-4">
                <h3 className="font-mono text-[0.7rem] uppercase tracking-[0.16em]">
                  {t(`home.who${i}.t`)}
                </h3>
                <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-muted">
                  {t(`home.who${i}.b`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StarCta locale={locale} stars={stars} />
    </>
  );
}
