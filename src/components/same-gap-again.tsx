"use client";

import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * Practising the same right turn in two places.
 *
 * The thing being practised is one specific gap: an oncoming car 60 m away at
 * 60 km/h. In the dream that gap comes round every single time, for nothing.
 * At the junction you take whatever gap turns up, you wait for it, and about
 * one attempt in eight is the one you were trying to learn.
 *
 * Both tallies stay on screen because the comparison is the figure. The
 * attempts at the junction come from a deterministic hash of the attempt
 * index, so the picture is stable across renders and Try twenty is exactly
 * twenty presses of Try.
 */

/** metres of gap: the one being practised, and how close counts as the same gap */
const TARGET = 60;
const TOL = 5;
const GAP_MIN = 20;
const GAP_MAX = 110;
const CAP = 120;

/** stable pseudo random in [0, 1), so attempt 7 is always attempt 7 */
function hash(i: number) {
  const x = Math.sin((i + 1) * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

type Attempt = { gap: number; wait: number; hit: boolean; nearMiss: boolean };

function junctionAttempt(i: number): Attempt {
  const gap = GAP_MIN + hash(i * 2 + 1) * (GAP_MAX - GAP_MIN);
  const wait = 20 + hash(i * 2 + 2) * 160;
  const hit = Math.abs(gap - TARGET) <= TOL;
  const nearMiss = !hit && gap < TARGET - TOL && hash(i * 3 + 7) < 0.3;
  return { gap, wait, hit, nearMiss };
}

const DREAM_ATTEMPT: Attempt = { gap: TARGET, wait: 0, hit: true, nearMiss: false };

type Side = "dream" | "junction";

type Strings = {
  target: string;
  targetValue: string;
  dream: string;
  junction: string;
  switchLabel: string;
  try1: string;
  try20: string;
  again: string;
  empty: string;
  reads: [string, string, string, string];
  minutes: (m: string) => string;
  vNone: string;
  vDream: (n: number) => string;
  vJunction: (n: number, k: number, m: string, c: number) => string;
  vBoth: string;
  join: string;
  aria: (verdict: string) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    target: "the gap you are trying to learn",
    targetValue: "60 m, car doing 60 km/h",
    dream: "in the dream",
    junction: "at the junction",
    switchLabel: "practise at the junction",
    try1: "Try",
    try20: "Try twenty",
    again: "Start again",
    empty: "no attempts yet",
    reads: ["attempts", "attempts at the gap you wanted", "time spent", "near misses"],
    minutes: (m) => `${m} min`,
    vNone: "Press Try.",
    vDream: (n) => `${n} attempts at the same gap, no time, nothing at risk.`,
    vJunction: (n, k, m, c) =>
      `${n} attempts, ${k} of them at the gap you wanted, ${m} minutes, ${c} near misses.`,
    vBoth:
      "Same practice, two prices. The dream is the one where you get to fail at the same moment over and over.",
    join: " ",
    aria: (verdict) =>
      `Two tallies of practice attempts at the same right turn, one in the dream and one at the junction. Each bar is the gap that attempt offered; solid bars are the gap being practised. Illustrative. ${verdict}`,
  },
};

/** bar geometry: bars narrow as the tally fills, then wrap onto another row */
function layout(compact: boolean, dreamN: number, juncN: number) {
  const fs = compact ? 17 : 14;
  const W = compact ? 560 : 900;
  const L = compact ? 14 : 18;
  const R = compact ? 14 : 18;
  const rowW = W - L - R;
  const maxSlot = compact ? 24 : 22;
  const minSlot = compact ? 12 : 11;
  const barMax = compact ? 62 : 60;
  const rowGap = 10;

  const slotFor = (n: number) =>
    Math.max(minSlot, Math.min(maxSlot, n > 0 ? rowW / n : maxSlot));
  const plan = (n: number) => {
    const slot = slotFor(n);
    const perRow = Math.max(1, Math.floor(rowW / slot));
    const rows = Math.max(1, Math.ceil(Math.max(n, 1) / perRow));
    return { slot, perRow, rows, height: (fs + 8) + rows * barMax + (rows - 1) * rowGap };
  };

  const refH = fs + 12 + barMax * 0.55;
  const dream = plan(dreamN);
  const junction = plan(juncN);
  const dreamY = refH + 14;
  const junctionY = dreamY + dream.height + 14;
  const H = junctionY + junction.height + 8;

  return { fs, W, L, rowW, barMax, rowGap, refH, dream, junction, dreamY, junctionY, H };
}

export function SameGapAgain() {
  const still = useReducedMotion();
  const locale = useLocale();
  const s = pickText(TEXT, locale);
  const { ref, compact } = useCompact(560);

  const [side, setSide] = useState<Side>("dream");
  const [dreamN, setDreamN] = useState(0);
  const [juncN, setJuncN] = useState(0);

  const junc = useMemo(
    () => Array.from({ length: juncN }, (_, i) => junctionAttempt(i)),
    [juncN],
  );

  const juncHits = junc.filter((a) => a.hit).length;
  const juncWait = junc.reduce((t, a) => t + a.wait, 0);
  const juncMisses = junc.filter((a) => a.nearMiss).length;

  const n = side === "dream" ? dreamN : juncN;
  const hits = side === "dream" ? dreamN : juncHits;
  const minutes = side === "dream" ? "0.0" : (juncWait / 60).toFixed(1);
  const misses = side === "dream" ? 0 : juncMisses;

  const add = (k: number) => {
    if (side === "dream") setDreamN((v) => Math.min(CAP, v + k));
    else setJuncN((v) => Math.min(CAP, v + k));
  };
  const reset = () => {
    setDreamN(0);
    setJuncN(0);
  };

  const g = layout(compact, dreamN, juncN);
  const { fs, W, L, barMax } = g;
  const hOf = (gap: number) => (gap / GAP_MAX) * barMax;
  const targetH = hOf(TARGET);

  const parts: string[] = [];
  if (n === 0) parts.push(s.vNone);
  else if (side === "dream") parts.push(s.vDream(dreamN));
  else parts.push(s.vJunction(juncN, juncHits, minutes, juncMisses));
  if (dreamN > 0 && juncN > 0) parts.push(s.vBoth);
  const verdict = parts.join(s.join);

  const block = (
    which: Side,
    count: number,
    plan: { slot: number; perRow: number; rows: number; height: number },
    y: number,
  ) => {
    const active = side === which;
    const colour = which === "dream" ? "var(--imagine)" : "var(--actual)";
    const top = y + fs + 8;
    const barW = Math.max(3, plan.slot * 0.62);
    return (
      <g key={which} opacity={active ? 1 : 0.5}>
        <text x={L} y={y + fs} className="font-mono" fontSize={fs} letterSpacing="1"
          fill={active ? "var(--ink)" : "var(--ink-faint)"}>
          {which === "dream" ? s.dream : s.junction}
        </text>
        {Array.from({ length: plan.rows }, (_, r) => {
          const base = top + r * (barMax + g.rowGap) + barMax;
          return (
            <g key={r}>
              <line x1={L} y1={base} x2={L + g.rowW} y2={base}
                stroke="var(--rule)" strokeWidth="1" />
              <line x1={L} y1={base - targetH} x2={L + g.rowW} y2={base - targetH}
                stroke="var(--rule-strong)" strokeWidth="1" strokeDasharray="2 5" />
            </g>
          );
        })}
        {Array.from({ length: count }, (_, i) => {
          const a = which === "dream" ? DREAM_ATTEMPT : junc[i];
          const r = Math.floor(i / plan.perRow);
          const c = i % plan.perRow;
          const base = top + r * (barMax + g.rowGap) + barMax;
          const h = Math.max(2, hOf(a.gap));
          return (
            <rect key={i} x={L + c * plan.slot} y={base - h} width={barW} height={h}
              fill={colour} opacity={a.hit ? 1 : 0.3} />
          );
        })}
        {count === 0 && (
          <text x={L} y={top + barMax - 4} className="font-mono" fontSize={fs}
            fill="var(--ink-faint)">
            {s.empty}
          </text>
        )}
      </g>
    );
  };

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${g.H}`} className="block w-full" role="img"
          aria-label={s.aria(verdict)}>
          {/* the gap being practised, drawn once so every bar can be read against it */}
          <g>
            <rect x={L} y={g.refH - targetH} width={compact ? 20 : 18} height={targetH}
              fill="none" stroke="var(--ink)" strokeWidth="1.2" />
            <line x1={L} y1={g.refH - targetH} x2={W - 18} y2={g.refH - targetH}
              stroke="var(--rule-strong)" strokeWidth="1" strokeDasharray="2 5" />
            <text x={L + (compact ? 28 : 26)} y={g.refH - targetH + fs * 0.9}
              className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink)">
              {s.target}
            </text>
            {!compact && (
              <text x={L + 26} y={g.refH - targetH + fs * 2.3} className="font-mono"
                fontSize={fs} fill="var(--ink-faint)">
                {s.targetValue}
              </text>
            )}
          </g>
          {block("dream", dreamN, g.dream, g.dreamY)}
          {block("junction", juncN, g.junction, g.junctionY)}
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-col gap-4 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <span className={`label ${side === "dream" ? "!text-ink" : ""}`}>{s.dream}</span>
          <button
            type="button"
            role="switch"
            aria-checked={side === "junction"}
            aria-label={s.switchLabel}
            onClick={() => setSide((v) => (v === "dream" ? "junction" : "dream"))}
            className={`relative h-6 w-11 border transition-colors ${
              side === "junction" ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"
            }`}
          >
            <span
              className={`absolute top-[3px] h-4 w-4 transition-all ${
                side === "junction" ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"
              }`}
            />
          </button>
          <span className={`label ${side === "junction" ? "!text-ink" : ""}`}>{s.junction}</span>

          <div className="flex flex-wrap gap-2">
            {[
              { label: s.try1, k: 1 },
              { label: s.try20, k: 20 },
            ].map((b) => (
              <button
                key={b.k}
                type="button"
                onClick={() => add(b.k)}
                disabled={n >= CAP}
                className="label h-9 border border-rule-strong bg-paper px-3 !text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-40"
              >
                {b.label}
              </button>
            ))}
            <button
              type="button"
              onClick={reset}
              disabled={dreamN === 0 && juncN === 0}
              className="label h-9 border border-rule-strong bg-paper px-3 !text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-40"
            >
              {s.again}
            </button>
          </div>
        </div>

        <motion.p
          key={verdict}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: still ? 0 : 0.2 }}
          aria-live="polite"
          className="label max-w-[62ch] !normal-case !tracking-normal !text-[0.8rem]"
        >
          {verdict}
        </motion.p>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-rule bg-rule sm:grid-cols-4">
        {[
          [s.reads[0], String(n)],
          [s.reads[1], String(hits)],
          [s.reads[2], s.minutes(minutes)],
          [s.reads[3], String(misses)],
        ].map(([label, v]) => (
          <div key={label} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{label}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
