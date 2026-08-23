"use client";

import { useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * Twelve links in order, which is what a diamond costs in Minecraft.
 *
 * DreamerV3 finished this chain without human data. The point of the figure is
 * that the chain is unforgiving: nine times in ten per link still fails about
 * seven runs in ten, so getting to the end is worth more as evidence than any
 * single task score. The per link odds and the runs are illustrative; the
 * twelve milestones are the game's, and nothing here is presented as a
 * measured success rate for DreamerV3.
 */

const LINK = 40;
const GAPX = 26;

/** deterministic, so run n is the same run on every reload */
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

type Text = {
  links: string[][];
  short: string[];
  slider: string;
  tryRun: string;
  tryAgain: string;
  chance: string;
  odds: string;
  furthest: string;
  none: string;
  noRun: string;
  v0: string;
  vBroke: (milestone: string, left: number) => string;
  vWon: (x: string) => string;
  vRare: string;
  aria: (state: string) => string;
  ariaFresh: string;
  ariaBroke: (m: string) => string;
  ariaWon: string;
};

const TEXT: LocaleText<Text> = {
  en: {
    links: [
      ["log"],
      ["planks"],
      ["stick"],
      ["crafting", "table"],
      ["wooden", "pickaxe"],
      ["stone"],
      ["stone", "pickaxe"],
      ["furnace"],
      ["iron", "ore"],
      ["iron", "ingot"],
      ["iron", "pickaxe"],
      ["diamond"],
    ],
    short: [
      "log",
      "planks",
      "stick",
      "table",
      "wood",
      "stone",
      "pick",
      "furnace",
      "ore",
      "ingot",
      "iron",
      "diamond",
    ],
    slider: "Chance per link",
    tryRun: "Try a run",
    tryAgain: "Try again",
    chance: "Chance per link",
    odds: "Chance of reaching the diamond",
    furthest: "Furthest link this run",
    none: "none",
    noRun: "no run yet",
    v0: "Twelve links, and every one of them has to hold.",
    vBroke: (m, left) =>
      `This run stopped at ${m}. ${left === 1 ? "One link" : `${left} links`} to go, and the chain does not carry partial credit.`,
    vWon: (x) =>
      `This run got the diamond. At these odds that happens about ${x} times in ten.`,
    vRare:
      "At these odds the diamond is a rare accident, which is why nobody got there by luck.",
    aria: (state) =>
      `A chain of twelve Minecraft milestones ending in a diamond. ${state}`,
    ariaFresh: "No run yet, so every link is empty.",
    ariaBroke: (m) => `This run broke at ${m}.`,
    ariaWon: "This run reached the diamond.",
  },
};

type Run = { seed: number; reached: number; broke: number | null };

function play(seed: number, p: number): Run {
  const r = rng(seed);
  for (let i = 0; i < 12; i++) {
    if (r() >= p) return { seed, reached: i, broke: i };
  }
  return { seed, reached: 12, broke: null };
}

export function DiamondChain() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const { ref, compact } = useCompact(620);
  const k = compact ? 1.65 : 1;

  const [pct, setPct] = useState(90);
  const [runs, setRuns] = useState(0);
  const [run, setRun] = useState<Run | null>(null);

  const p = pct / 100;
  const chainOdds = p ** 12;

  const cols = compact ? 6 : 12;
  const rows = 12 / cols;
  /** the outer labels overhang their link, so the box carries a margin */
  const M = compact ? 32 : 16;
  const labelH = compact ? 32 : 36;
  const rowH = LINK + labelH;
  const W = cols * LINK + (cols - 1) * GAPX;
  const H = rows * rowH + (rows - 1) * 12;

  const reachedName = run && run.reached > 0 ? T.short[run.reached - 1] : null;
  const ariaState = !run
    ? T.ariaFresh
    : run.broke === null
      ? T.ariaWon
      : T.ariaBroke(T.short[run.broke]);

  const verdict = !run
    ? chainOdds < 0.15
      ? T.vRare
      : T.v0
    : run.broke === null
      ? T.vWon((chainOdds * 10).toFixed(1))
      : T.vBroke(T.short[run.broke], 12 - run.broke);

  return (
    <div>
      <div ref={ref} className="px-5 pt-6 md:px-8">
        <svg
          viewBox={`${-M} 0 ${W + 2 * M} ${H}`}
          className="block w-full"
          role="img"
          aria-label={T.aria(ariaState)}
        >
          {Array.from({ length: 12 }, (_, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = col * (LINK + GAPX);
            const y = row * (rowH + 12);
            const reached = run !== null && i < run.reached;
            const broke = run !== null && run.broke === i;
            const fresh = run === null;
            const stroke = broke
              ? "var(--imagine)"
              : reached
                ? "var(--actual)"
                : fresh && i === 11
                  ? "var(--imagine)"
                  : "var(--rule-strong)";
            const lines = compact ? [T.short[i]] : T.links[i];
            return (
              <g key={i}>
                {col < cols - 1 && (
                  <line
                    x1={x + LINK}
                    y1={y + LINK / 2}
                    x2={x + LINK + GAPX}
                    y2={y + LINK / 2}
                    stroke={
                      run !== null && i + 1 <= run.reached
                        ? "var(--actual)"
                        : "var(--rule)"
                    }
                    strokeWidth="1"
                  />
                )}
                <rect
                  x={x + 0.75}
                  y={y + 0.75}
                  width={LINK - 1.5}
                  height={LINK - 1.5}
                  fill={reached ? "var(--actual)" : "none"}
                  stroke={stroke}
                  strokeWidth={broke ? 2 : 1}
                />
                {broke && (
                  <path
                    d={`M ${x + 9} ${y + 9} L ${x + LINK - 9} ${y + LINK - 9} M ${x + LINK - 9} ${y + 9} L ${x + 9} ${y + LINK - 9}`}
                    stroke="var(--imagine)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                )}
                {lines.map((line, j) => (
                  <text
                    key={line}
                    x={x + LINK / 2}
                    y={y + LINK + 13 * k + j * 11 * k}
                    textAnchor="middle"
                    className="font-mono"
                    fontSize={9.5 * k}
                    fill={reached || broke ? "var(--ink)" : "var(--ink-faint)"}
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div
        data-print-hide
        className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8"
      >
        <label className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[18rem] sm:flex-1 sm:flex-nowrap">
          <span className="label basis-full whitespace-nowrap sm:basis-auto">
            {T.slider}
          </span>
          <input
            type="range"
            min={50}
            max={99}
            value={pct}
            onChange={(e) => {
              setPct(Number(e.target.value));
              setRun(null);
            }}
            className="h-1 min-w-[6rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-12 text-right !text-ink">{pct}%</span>
        </label>

        <button
          type="button"
          onClick={() => {
            const seed = runs + 1;
            setRuns(seed);
            setRun(play(seed, p));
          }}
          className="label h-9 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink"
        >
          {run ? T.tryAgain : T.tryRun}
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
          [T.chance, `${pct}%`],
          [T.odds, `${(chainOdds * 100).toFixed(0)}%`],
          [T.furthest, run ? (reachedName ?? T.none) : T.noRun],
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
