import { REPO, REPO_URL } from "@/lib/github";
import { translate, type Locale } from "@/lib/i18n";

/**
 * Below this the count argues against the ask: "1 star" reads as nobody cares,
 * which is worse than showing nothing. Drop it to 0 once the number carries
 * itself.
 */
const SHOW_COUNT_FROM = 10;

/** The GitHub mark, inlined so the CTA costs no extra request. */
function GitHubMark({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor" aria-hidden
      className="shrink-0">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
        0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01
        1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95
        0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 2-.27c.68
        0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0
        3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01
        8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

/**
 * The ask. Deliberately states why a star helps rather than just asking for
 * one: this site is a reputation play with no paywall, so the only currency
 * it trades in is being findable.
 */
export function StarCta({
  locale,
  stars,
  compact = false,
}: {
  locale: Locale;
  stars: number | null;
  compact?: boolean;
}) {
  const t = (k: string, v?: Record<string, string | number>) => translate(locale, k, v);

  const button = (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-2.5 border border-ink bg-ink px-5 py-2.5 text-paper transition-colors hover:border-imagine hover:bg-imagine"
    >
      <GitHubMark size={16} />
      <span className="label !text-paper">{t("star.button")}</span>
      {stars !== null && stars >= SHOW_COUNT_FROM && (
        <span className="label tnum !text-paper/70 border-l border-paper/30 pl-2.5">
          {stars.toLocaleString(locale === "zh" ? "zh-CN" : "en-GB")}
        </span>
      )}
    </a>
  );

  if (compact) {
    return (
      <div data-print-hide className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <p className="max-w-[42ch] text-[0.95rem] leading-relaxed text-ink-muted">
          {t("star.compact")}
        </p>
        {button}
      </div>
    );
  }

  return (
    <section data-print-hide className="mx-auto mt-32 max-w-[84rem] px-6 md:px-10">
      <div className="border border-ink bg-paper-raised">
        <div className="ticks" />
        <div className="flex flex-col gap-8 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-10 md:py-12">
          <div>
            <p className="label flex items-center gap-2">
              <GitHubMark size={14} />
              {REPO}
            </p>
            <h2 className="display mt-4 text-[clamp(1.6rem,3.4vw,2.2rem)] leading-tight">
              {t("star.title")}
            </h2>
            <p className="mt-4 max-w-[52ch] text-[1rem] leading-relaxed text-ink-muted">
              {t("star.body")}
            </p>
          </div>
          <div className="shrink-0">{button}</div>
        </div>
      </div>
    </section>
  );
}
