"use client";

import Link from "next/link";
import { SignalMark } from "./signal-mark";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitch } from "./language-switch";
import { useT, useLocale } from "./locale-provider";
import { localePath } from "@/lib/i18n";

export function SiteHeader() {
  const t = useT();
  const locale = useLocale();
  return (
    <header data-print-hide className="sticky top-0 z-50 border-b border-rule bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[84rem] items-center gap-4 px-5 md:gap-6 md:px-10">
        <Link href={localePath(locale, "/")} className="group flex items-center gap-2.5">
          <SignalMark size={24} />
          <span className="label !text-ink transition-opacity group-hover:opacity-60 max-[420px]:sr-only">
            World&nbsp;Models&nbsp;101
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-4 md:gap-6">
          <Link href={localePath(locale, "/#chapters")} className="label hover:text-ink transition-colors">
            {t("nav.chapters")}
          </Link>
          <Link href={localePath(locale, "/about")} className="label hover:text-ink transition-colors">
            {t("nav.about")}
          </Link>
          <LanguageSwitch />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
