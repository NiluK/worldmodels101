"use client";

import { useEffect, useState } from "react";
import { useT } from "./locale-provider";

type Mode = "light" | "dark";

/**
 * The icon shows what you will get, not what you have: a moon while the page is
 * light, a sun while it is dark. Same rule the old text label followed.
 *
 * Drawn inline rather than as emoji so it takes the ink colour, matches the
 * hairline weight of the rules around it, and renders the same on every
 * platform.
 */
function Moon() {
  return (
    <svg viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true">
      <path
        d="M16.5 12.6A7 7 0 0 1 7.4 3.5a7 7 0 1 0 9.1 9.1Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Sun() {
  return (
    <svg viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="3.6" stroke="currentColor" strokeWidth="1.3" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line
          key={a}
          x1="10"
          y1="1.6"
          x2="10"
          y2="3.6"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          transform={`rotate(${a} 10 10)`}
        />
      ))}
    </svg>
  );
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode | null>(null);
  const t = useT();

  useEffect(() => {
    const stored = localStorage.getItem("wm101-theme") as Mode | null;
    const initial =
      stored ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    // defer the state write so the effect does not cascade a second render
    document.documentElement.dataset.theme = initial;
    queueMicrotask(() => setMode(initial));
  }, []);

  function flip() {
    const next: Mode = mode === "dark" ? "light" : "dark";
    setMode(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("wm101-theme", next);
  }

  const dark = mode === "dark";

  return (
    <button
      onClick={flip}
      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center text-ink-muted transition-colors hover:text-ink"
      aria-label={t(dark ? "nav.toLight" : "nav.toDark")}
      title={t(dark ? "nav.toLight" : "nav.toDark")}
      suppressHydrationWarning
    >
      {dark ? <Sun /> : <Moon />}
    </button>
  );
}
