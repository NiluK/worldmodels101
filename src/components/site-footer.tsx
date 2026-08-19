import Link from "next/link";
import { SignalMark } from "./signal-mark";

export function SiteFooter() {
  return (
    <footer data-print-hide className="relative z-10 mt-32 border-t border-rule">
      <div className="ticks" />
      <div className="mx-auto flex max-w-[84rem] flex-col gap-6 px-6 py-12 md:flex-row md:items-end md:justify-between md:px-10">
        <div className="flex items-start gap-3">
          <SignalMark size={22} />
          <p className="max-w-sm text-sm leading-relaxed text-ink-muted">
            A free primer on world models. Free to read, free to share, free to
            steal for your own course. Attribution appreciated.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/about" className="label hover:text-ink transition-colors">
            About
          </Link>
          <a
            href="https://github.com"
            className="label hover:text-ink transition-colors"
          >
            Source
          </a>
          <span className="label">&copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
