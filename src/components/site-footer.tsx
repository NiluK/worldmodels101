"use client";

import Link from "next/link";
import { SignalMark } from "./signal-mark";
import { useT } from "./locale-provider";
import { REPO_URL } from "@/lib/github";

export function SiteFooter() {
  const t = useT();
  return (
    <footer data-print-hide className="relative z-10 mt-32 border-t border-rule">
      <div className="ticks" />
      <div className="mx-auto flex max-w-[84rem] flex-col gap-6 px-6 py-12 md:flex-row md:items-end md:justify-between md:px-10">
        <div className="flex items-start gap-3">
          <SignalMark size={22} />
          <p className="max-w-sm text-sm leading-relaxed text-ink-muted">
{t("foot.body")}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/about" className="label hover:text-ink transition-colors">
            {t("foot.about")}
          </Link>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="label hover:text-ink transition-colors"
          >
            {t("foot.source")}
          </a>
          <span className="label">&copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
