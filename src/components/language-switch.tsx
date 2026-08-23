"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { barePath, localeFromPath, localePath, LOCALES, LOCALE_META } from "@/lib/i18n";
import { useT } from "./locale-provider";

/**
 * Eight languages will not fit as a row of links beside the wordmark, so this
 * is a button and a menu. It keeps your place: each entry points at the same
 * page in that language, not at its home page, which is the usual way these
 * lose you. Chapters exist in every language even before the prose is
 * translated, so there is nowhere to fall back to.
 *
 * Plain details/summary would be simpler, but it cannot be closed by clicking
 * away or by Escape without script anyway, and those are the two things people
 * try first.
 */
export function LanguageSwitch({ className = "" }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const current = localeFromPath(pathname);
  const bare = barePath(pathname);
  const t = useT();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div ref={box} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("nav.language")}
        className="label inline-flex items-center gap-2 transition-colors hover:text-ink"
      >
        <span aria-hidden="true" className="text-[0.9em] leading-none">
          {"\u{1F310}"}
        </span>
        <span className="!text-ink">{LOCALE_META[current].label}</span>
        <span aria-hidden="true" className="text-[0.6em] leading-none">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <ul
          role="menu"
          className="absolute right-0 z-50 mt-3 min-w-[11rem] border border-ink bg-paper py-1 shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
        >
          {LOCALES.map((l) => {
            const active = l === current;
            return (
              <li key={l} role="none">
                <Link
                  role="menuitem"
                  href={localePath(l, bare)}
                  onClick={() => setOpen(false)}
                  hrefLang={LOCALE_META[l].htmlLang}
                  lang={LOCALE_META[l].htmlLang}
                  aria-current={active ? "true" : undefined}
                  className={`label block px-4 py-2 transition-colors hover:bg-paper-raised hover:!text-ink ${
                    active ? "!text-imagine" : "!text-ink-muted"
                  }`}
                >
                  {LOCALE_META[l].label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
