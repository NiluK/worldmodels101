"use client";

import { useMemo, useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * The chapter's own trick, run twenty times at one temperature.
 *
 * Sitting in the corner stops the fireballs, and the question is how often
 * that still holds once the dream is made less sure of itself. At the left it
 * holds every time, which is what makes it worth building a policy on. In the
 * middle it holds now and then, which is not the same thing. At the right
 * nothing holds, the game included, so there is no task left to learn.
 *
 * Illustrative: the twenty runs, the outcome odds and the trick itself, which
 * stands in for the exploit rather than reproducing it. Real: the finding, that
 * the agent scored far better in its dream than in the game and that more
 * uncertainty closed the gap.
 */

const RUNS = 20;
const CELL = 46;
const GAP = 9;

type Outcome = "trick" | "fireball" | "nonsense";

function rng(seed: number) {
  let a = (seed * 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roll(temp: number, seed: number): Outcome[] {
  const nonsense = Math.max(0, Math.min(1, (temp - 0.5) / 0.5)) ** 1.5;
  const trick = (1 - temp) ** 1.4;
  const r = rng(seed);
  return Array.from({ length: RUNS }, () => {
    const a = r();
    const b = r();
    // the left end is certainty, not luck
    if (temp === 0) return "trick";
    if (a < nonsense) return "nonsense";
    return b < trick ? "trick" : "fireball";
  });
}

type Text = {
  temperature: string;
  again: string;
  trick: string;
  fireball: string;
  nonsense: string;
  ofRuns: (n: number) => string;
  v1: string;
  v2: string;
  v3: string;
  aria: (t: string, a: number, b: number, c: number) => string;
};

const TEXT: LocaleText<Text> = {
  en: {
    temperature: "Temperature",
    again: "Roll again",
    trick: "The trick paid",
    fireball: "Fireball came anyway",
    nonsense: "Dream made no sense",
    ofRuns: (n) => `${n} of 20`,
    v1: "The trick pays nearly every run, so a policy can lean its whole score on it.",
    v2: "The trick pays now and then. That is not reliable enough to build on, and there is still a game in there to learn.",
    v3: "Nothing is reliable now, the fireballs included, so there is no task left to learn.",
    aria: (t, a, b, c) =>
      `Twenty runs of the same trick at temperature ${t}. The trick paid in ${a}, the fireball came anyway in ${b}, and the dream made no sense in ${c}.`,
  },
};

export function TwentyDreams() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const { ref, compact } = useCompact(560);
  const [pct, setPct] = useState(10);
  const [round, setRound] = useState(0);

  const temp = pct / 100;
  const cells = useMemo(
    () => roll(temp, round * 211 + pct + 1),
    [temp, round, pct],
  );

  const cols = compact ? 5 : 10;
  const rows = RUNS / cols;
  const W = cols * CELL + (cols - 1) * GAP;
  const H = rows * CELL + (rows - 1) * GAP;

  const count = (o: Outcome) => cells.filter((c) => c === o).length;
  const nTrick = count("trick");
  const nFire = count("fireball");
  const nNonsense = count("nonsense");

  const verdict = temp < 0.2 ? T.v1 : temp <= 0.6 ? T.v2 : T.v3;

  return (
    <div>
      <div ref={ref} className="px-5 pt-6 md:px-8">
        <div className="mx-auto max-w-[34rem]">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block w-full"
            role="img"
            aria-label={T.aria(temp.toFixed(2), nTrick, nFire, nNonsense)}
          >
            <defs>
              <pattern
                id="td-hatch"
                width="7"
                height="7"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M -1 1 L 1 -1 M 0 7 L 7 0 M 6 8 L 8 6"
                  stroke="var(--ink-faint)"
                  strokeWidth="0.8"
                  opacity="0.5"
                />
              </pattern>
            </defs>
            {cells.map((outcome, i) => {
              const x = (i % cols) * (CELL + GAP);
              const y = Math.floor(i / cols) * (CELL + GAP);
              const fill =
                outcome === "trick"
                  ? "var(--imagine)"
                  : outcome === "fireball"
                    ? "var(--actual)"
                    : "url(#td-hatch)";
              return (
                <g key={i}>
                  <rect x={x} y={y} width={CELL} height={CELL} fill={fill} />
                  {outcome === "nonsense" && (
                    <rect
                      x={x + 0.5}
                      y={y + 0.5}
                      width={CELL - 1}
                      height={CELL - 1}
                      fill="none"
                      stroke="var(--ink-faint)"
                      strokeWidth="1"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {[
              [T.trick, "var(--imagine)"],
              [T.fireball, "var(--actual)"],
              [T.nonsense, "transparent"],
            ].map(([label, swatch]) => (
              <li key={label} className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 border"
                  style={{
                    background: swatch,
                    borderColor:
                      swatch === "transparent" ? "var(--ink-faint)" : swatch,
                  }}
                />
                <span className="label !text-[0.62rem]">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        data-print-hide
        className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8"
      >
        <label className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[18rem] sm:flex-1 sm:flex-nowrap">
          <span className="label basis-full whitespace-nowrap sm:basis-auto">
            {T.temperature}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            className="h-1 min-w-[6rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-12 text-right !text-ink">
            {temp.toFixed(2)}
          </span>
        </label>

        <button
          type="button"
          onClick={() => setRound((n) => n + 1)}
          className="label h-9 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink"
        >
          {T.again}
        </button>

        <p
          className="label basis-full !normal-case !tracking-normal !text-[0.8rem]"
          aria-live="polite"
        >
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.trick, T.ofRuns(nTrick)],
          [T.fireball, T.ofRuns(nFire)],
          [T.nonsense, T.ofRuns(nNonsense)],
        ].map(([label, value]) => (
          <div key={label} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{label}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
