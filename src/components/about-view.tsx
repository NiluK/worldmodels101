import { AUTHOR, AUTHOR_URL } from "@/lib/author";
import { REPO, REPO_URL } from "@/lib/github";
import { translate, type Locale } from "@/lib/i18n";

/**
 * The about page, which is about the person who wrote this.
 *
 * It used to be about the book: its shape, what it assumed, a reading list.
 * Most of that is now visible from the contents page or the chapters
 * themselves. What only this page can carry is who is making the claims, and
 * the corrections section that every chapter's sign-off points at, so both
 * survive.
 */
const READING = [
  { key: "craik", label: "Kenneth Craik, 1943", title: "The Nature of Explanation" },
  {
    key: "dyna",
    label: "Richard Sutton, 1991",
    title: "Dyna: an Integrated Architecture for Learning, Planning and Reacting",
  },
  { key: "ha", label: "David Ha & Jürgen Schmidhuber, 2018", title: "World Models" },
  { key: "lecun", label: "Yann LeCun, 2022", title: "A Path Towards Autonomous Machine Intelligence" },
];

export function AboutView({ locale }: { locale: Locale }) {
  const t = (k: string) => translate(locale, k);

  return (
    <div className="track pt-16 pb-8 md:pt-24">
      <h1 className="display text-[clamp(2.6rem,8vw,5rem)] leading-[0.92]">{t("about.title")}</h1>

      <div className="prose mt-12">
        <p className="text-[1.25rem] leading-[1.5]">{t("about.lead")}</p>
        <p>{t("about.before")}</p>

        <h2>{t("about.whyTitle")}</h2>
        <p>{t("about.why")}</p>
        <p>{t("about.assumes")}</p>

        <h2>{t("about.correctionsTitle")}</h2>
        <p>
          {t("about.corrections")}{" "}
          <a href={`${REPO_URL}/issues`} target="_blank" rel="noopener noreferrer">
            {t("about.correctionsLink")}
          </a>{" "}
          {t("about.correctionsAfter")}
        </p>

        <h2>{t("about.elsewhereTitle")}</h2>
        <p className="font-mono text-[0.85rem] leading-relaxed">
          <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer me">
            linkedin.com/in/nilukulasingham
          </a>
          <br />
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            github.com/{REPO}
          </a>
        </p>

        <h2>{t("about.readingTitle")}</h2>
      </div>

      <ul className="mt-8 border-t border-ink">
        {READING.map((r) => (
          <li key={r.key} className="border-b border-rule py-5">
            <p className="label">{r.label}</p>
            <p className="mt-1.5 text-[1.05rem]">{r.title}</p>
            <p className="mt-1.5 max-w-[54ch] text-[0.92rem] leading-relaxed text-ink-muted">
              {t(`about.reading.${r.key}`)}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-8 font-mono text-[0.78rem] leading-relaxed text-ink-muted">
        {t("about.signoff").replace("{author}", AUTHOR)}
      </p>
    </div>
  );
}
