"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignalMark } from "./signal-mark";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitch } from "./language-switch";
import { useT, useLocale } from "./locale-provider";
import { localePath } from "@/lib/i18n";
import { StarButton } from "./star-cta";

/**
 * Four nav items plus a two-language switch do not fit beside the wordmark on a
 * phone: the switch used to break mid-character. Below `md` everything except
 * the mark collapses into a panel.
 */
export function SiteHeader({ stars }: { stars: number | null }) {
  const t = useT();
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  // Closing happens on the click that navigates, not in an effect watching the
  // pathname: setState inside an effect body cascades a second render.
  const close = () => setOpen(false);

  // Widening past the breakpoint the panel exists for should also close it.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 768px)");
    mq.addEventListener("change", close);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      mq.removeEventListener("change", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header data-print-hide className="sticky top-0 z-50 border-b border-rule bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[84rem] items-center gap-4 px-5 md:gap-6 md:px-10">
        <Link href={localePath(locale, "/")} className="group flex items-center gap-2.5">
          <SignalMark size={24} />
          <span className="label !text-ink transition-opacity group-hover:opacity-60">
            World&nbsp;Models&nbsp;101
          </span>
        </Link>

        {/* wide: everything in a row */}
        <nav className="ml-auto hidden items-center gap-4 md:flex md:gap-6">
          <Link href={localePath(locale, "/#chapters")} className="label hover:text-ink transition-colors">
            {t("nav.chapters")}
          </Link>
          <Link href={localePath(locale, "/about")} className="label hover:text-ink transition-colors">
            {t("nav.about")}
          </Link>
          <LanguageSwitch />
          <ThemeToggle />
          <StarButton locale={locale} stars={stars} placement="header" />
        </nav>

        {/* narrow: one button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={t(open ? "nav.close" : "nav.menu")}
          className="ml-auto flex h-9 w-9 items-center justify-center border border-rule-strong transition-colors hover:border-ink md:hidden"
        >
          <span aria-hidden className="relative block h-[11px] w-[17px]">
            {[0, 5, 10].map((y, i) => (
              <span
                key={y}
                className="absolute left-0 block h-[1.5px] w-full bg-ink transition-transform duration-200"
                style={
                  open
                    ? i === 1
                      ? { top: 5, opacity: 0 }
                      : { top: 5, transform: `rotate(${i === 0 ? 45 : -45}deg)` }
                    : { top: y }
                }
              />
            ))}
          </span>
        </button>
      </div>

      {open && (
        <div id="site-menu" className="border-t border-rule bg-paper md:hidden">
          <nav className="mx-auto flex max-w-[84rem] flex-col px-5 py-2">
            <Link
              href={localePath(locale, "/#chapters")}
              onClick={close}
              className="label border-b border-rule py-4 hover:text-ink transition-colors"
            >
              {t("nav.chapters")}
            </Link>
            <Link
              href={localePath(locale, "/about")}
              onClick={close}
              className="label border-b border-rule py-4 hover:text-ink transition-colors"
            >
              {t("nav.about")}
            </Link>
            <div className="flex items-center justify-between border-b border-rule py-4">
              <span className="label !text-ink-faint">{t("nav.language")}</span>
              <LanguageSwitch onNavigate={close} />
            </div>
            <div className="flex items-center justify-between py-4">
              <span className="label !text-ink-faint">{t("nav.theme")}</span>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
