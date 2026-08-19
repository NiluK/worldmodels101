"use client";

import { useEffect, useState } from "react";

type Mode = "light" | "dark";

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("wm101-theme") as Mode | null;
    const initial =
      stored ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setMode(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function flip() {
    const next: Mode = mode === "dark" ? "light" : "dark";
    setMode(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("wm101-theme", next);
  }

  return (
    <button
      onClick={flip}
      className="label hover:text-ink transition-colors cursor-pointer"
      aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} theme`}
      suppressHydrationWarning
    >
      {mode === "dark" ? "Light" : "Dark"}
    </button>
  );
}
