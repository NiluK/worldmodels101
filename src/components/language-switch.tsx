"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_META, localeFromPath, localePath, LOCALES } from "@/lib/i18n";

/**
 * Links to the same page in the other language rather than dumping the reader
 * on a translated home page, which is the usual way these lose your place.
 * Falls back to the home page where no translation of the current page exists.
 */
const TRANSLATED = new Set(["/", "/chapters/what-people-mean"]);

export function LanguageSwitch() {
  const pathname = usePathname() ?? "/";
  const current = localeFromPath(pathname);
  const bare = current === "zh" ? pathname.replace(/^\/zh/, "") || "/" : pathname;

  return (
    <div className="flex items-center gap-2">
      {LOCALES.map((l, i) => {
        const target = TRANSLATED.has(bare) ? bare : "/";
        const active = l === current;
        return (
          <span key={l} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden className="text-ink-faint">·</span>}
            {active ? (
              <span className="label !text-ink" aria-current="true">
                {LOCALE_META[l].label}
              </span>
            ) : (
              <Link
                href={localePath(l, target)}
                hrefLang={LOCALE_META[l].htmlLang}
                className="label transition-colors hover:text-ink"
              >
                {LOCALE_META[l].label}
              </Link>
            )}
          </span>
        );
      })}
    </div>
  );
}
