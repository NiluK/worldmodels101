import { AUTHOR, AUTHOR_URL } from "@/lib/author";
import { translate, type Locale } from "@/lib/i18n";

/**
 * The byline. Rendered as a label so it sits in the same register as the other
 * chapter metadata rather than competing with the title, and the name itself is
 * the link: nobody wants a separate "LinkedIn" word next to their own name.
 */
export function Byline({ locale, className = "" }: { locale: Locale; className?: string }) {
  return (
    <span className={`label ${className}`}>
      {translate(locale, "byline.by")}{" "}
      <a
        href={AUTHOR_URL}
        target="_blank"
        rel="noopener noreferrer me"
        className="!text-ink underline decoration-rule-strong underline-offset-4 transition-colors hover:!text-imagine hover:decoration-imagine"
      >
        {AUTHOR}
      </a>
    </span>
  );
}
