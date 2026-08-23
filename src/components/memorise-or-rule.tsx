"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId, useMemo, useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText } from "@/lib/locale-text";

/**
 * Memorising against finding the rule.
 *
 * One sequence, made by a two-number rule of the kind the predictor in the
 * guess-check-adjust figure ends up with. A lookup table of every value seen
 * grows with the data and says nothing about anything new. The rule is two
 * numbers whatever the data, and keeps going off the right-hand end. Numbers
 * and the wave are illustrative.
 */

const A = 1.9;
const B = -0.99;
const MIN = 4;
const MAX = 200;
const NEW = 20;
const TOTAL = MAX + NEW;
const SHOWN = 12;

const W = 720;
const H = 200;
const PAD = { l: 10, r: 10, t: 16, b: 18 };

/** the whole sequence, fixed: the rule is deterministic, so new data is just the next values */
const SERIES: number[] = (() => {
  const s = [0, 0.31];
  for (let i = 2; i < TOTAL; i++) s.push(A * s[i - 1] + B * s[i - 2]);
  return s;
})();

/** the x axis always holds the data seen plus the room the new data will take */
const px = (i: number, n: number) => PAD.l + (i / (n + NEW - 1)) * (W - PAD.l - PAD.r);
const py = (v: number) => PAD.t + (1 - (v + 1.1) / 2.2) * (H - PAD.t - PAD.b);
const path = (from: number, to: number, n: number) =>
  SERIES.slice(from, to)
    .map((v, k) => `${k ? "L" : "M"} ${px(from + k, n).toFixed(1)} ${py(v).toFixed(1)}`)
    .join(" ");
const fmt = (v: number) => (v < 0 ? "" : " ") + v.toFixed(2);

const TEXT: Record<
  string,
  {
    table: string;
    rule: string;
    ruleLabel: string;
    illustrative: string;
    formula: string;
    storesValues: (n: number) => string;
    storesNumbers: string;
    andMore: (n: number) => string;
    noEntry: string;
    continues: string;
    amount: string;
    amountShort: string;
    newData: string;
    hideNew: string;
    seen: string;
    newRegion: string;
    rValues: string;
    rTable: string;
    rRule: string;
    rNew: string;
    nValues: (n: number) => string;
    twoNumbers: string;
    onNewBefore: string;
    onNewAfter: string;
    verdictBefore: string;
    verdictAfter: string;
    aria: (n: number, revealed: boolean) => string;
  }
> = {
  en: {
    table: "The table",
    rule: "The rule",
    ruleLabel: "the rule: two numbers",
    illustrative: "illustrative",
    formula: "next = a × last + b × the one before",
    storesValues: (n) => `stores: ${n} values`,
    storesNumbers: "stores: 2 numbers",
    andMore: (n) => `... and ${n} more`,
    noEntry: "no entry",
    continues: "continues",
    amount: "Amount of data seen",
    amountShort: "Data seen",
    newData: "New data",
    hideNew: "Hide new data",
    seen: "seen so far",
    newRegion: "new data",
    rValues: "Values seen",
    rTable: "The table stores",
    rRule: "The rule stores",
    rNew: "On new data",
    nValues: (n) => `${n} values`,
    twoNumbers: "2 numbers",
    onNewBefore: "nothing new yet",
    onNewAfter: "table: nothing / rule: continues",
    verdictBefore: "The table is as big as the data. The rule is two numbers, whatever the data.",
    verdictAfter:
      "The table has no entry for anything new. The rule just keeps going. That is why the rule is the stowaway.",
    aria: (n, revealed) =>
      `A line chart of ${n} values made by a two-number rule.` +
      (revealed
        ? ` Twenty new values sit off the right end, and the rule's continuation lands on every one of them.`
        : ""),
  },
};

function Tick() {
  return (
    <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" className="mr-1.5 inline-block shrink-0 align-[-1px]">
      <path d="M1.5 5.5 L4 8 L8.5 2" fill="none" stroke="var(--imagine)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MemoriseOrRule() {
  const still = useReducedMotion();
  const clipId = useId();
  const { ref, compact } = useCompact(560);
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const k = compact ? 1.65 : 1;
  const [n, setN] = useState(24);
  const [revealed, setRevealed] = useState(false);

  const seenPath = useMemo(() => path(0, n, n), [n]);
  const rulePath = useMemo(() => path(n - 1, n + NEW, n), [n]);
  const x = (i: number) => px(i, n);
  const last = SERIES[n - 1];
  const rows = SERIES.slice(0, Math.min(n, SHOWN));
  const hidden = n - rows.length;

  const box = "border border-rule bg-paper px-4 py-3";

  return (
    <div>
      <div ref={ref} className="px-4 pt-5 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={T.aria(n, revealed)}>
          <line x1={PAD.l} y1={py(0)} x2={W - PAD.r} y2={py(0)} stroke="var(--rule)" strokeWidth="1" />
          <text x={PAD.l} y={PAD.t - 5} className="font-mono" fontSize={10 * k} letterSpacing="1" fill="var(--ink-faint)">
            {T.seen}
          </text>

          {revealed && (
            <g>
              <rect x={x(n - 0.5)} y={PAD.t - 2} width={x(n + NEW - 0.5) - x(n - 0.5)} height={H - PAD.t - PAD.b + 4}
                fill="var(--imagine-soft)" opacity="0.7" />
              {!compact && (
                <text x={x(n + NEW - 0.5) - 4} y={PAD.t - 5} textAnchor="end" className="font-mono" fontSize={10 * k}
                  letterSpacing="1" fill="var(--imagine)">
                  {T.newRegion}
                </text>
              )}
            </g>
          )}

          {/* what has been seen */}
          <path d={seenPath} fill="none" stroke="var(--actual)" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx={x(n - 1)} cy={py(last)} r="4" fill="var(--actual)" stroke="var(--paper)" strokeWidth="1.5" />

          {/* the rule, continued past the data, landing on the new values */}
          {revealed && (
            <g>
              {SERIES.slice(n, n + NEW).map((v, j) => (
                <circle key={j} cx={x(n + j)} cy={py(v)} r="3" fill="var(--paper)" stroke="var(--imagine)" strokeWidth="1.4" />
              ))}
              {/* the continuation is drawn left to right by widening a clip, so the dashes stay dashes */}
              <clipPath id={clipId}>
                <motion.rect
                  x={x(n - 1) - 3}
                  y={0}
                  height={H}
                  width={x(n + NEW - 1) - x(n - 1) + 6}
                  initial={still ? false : { width: 0 }}
                  animate={{ width: x(n + NEW - 1) - x(n - 1) + 6 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </clipPath>
              <path
                d={rulePath}
                clipPath={`url(#${clipId})`}
                fill="none"
                stroke="var(--imagine)"
                strokeWidth="2"
                strokeDasharray="5 4"
                strokeLinejoin="round"
              />
            </g>
          )}
        </svg>

        <div className={`mt-4 grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-2"}`}>
          {/* the table: every value, growing with the data */}
          <div className={box}>
            <p className="label">{T.table}</p>
            <ol className="tnum mt-2 font-mono text-[0.75rem] leading-[1.5] text-ink">
              {rows.map((v, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-8 text-ink-faint">{i + 1}</span>
                  <span className="whitespace-pre">{fmt(v)}</span>
                </li>
              ))}
              {hidden > 0 && <li className="text-ink-muted">{T.andMore(hidden)}</li>}
            </ol>
            {revealed && (
              <div className="mt-2 border-t border-rule pt-2 font-mono text-[0.75rem] leading-[1.5]">
                <p className="break-all tracking-[0.2em] text-imagine" aria-hidden="true">
                  {"?".repeat(NEW)}
                </p>
                <p className="text-ink-muted">{T.noEntry}</p>
              </div>
            )}
            <p className="label mt-3 !text-ink">{T.storesValues(n)}</p>
          </div>

          {/* the rule: two numbers, whatever the data */}
          <div className={box}>
            <p className="label">{T.rule}</p>
            <p className="label mt-2 !normal-case !tracking-normal">
              {T.ruleLabel} <span className="text-ink-faint">({T.illustrative})</span>
            </p>
            <div className="tnum mt-2 flex gap-6 font-mono text-[1.1rem] text-ink">
              <span className="whitespace-nowrap">
                <span className="text-ink-faint">a </span>
                {A.toFixed(2)}
              </span>
              <span className="whitespace-nowrap">
                <span className="text-ink-faint">b </span>
                {B.toFixed(2)}
              </span>
            </div>
            <p className="mt-2 font-mono text-[0.75rem] text-ink-muted">{T.formula}</p>
            {revealed && (
              <p className="mt-3 border-t border-rule pt-2 font-mono text-[0.75rem] text-ink">
                <Tick />
                {T.continues}
              </p>
            )}
            <p className="label mt-3 !text-ink">{T.storesNumbers}</p>
          </div>
        </div>
      </div>

      <div data-print-hide className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-[18rem] flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          <span className="label whitespace-nowrap">{compact ? T.amountShort : T.amount}</span>
          <span className="flex min-w-[12rem] flex-1 items-center gap-3">
            <input
              type="range"
              min={MIN}
              max={MAX}
              value={n}
              onChange={(e) => {setN(Number(e.target.value)); }}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
            />
            <span className="label tnum w-10 text-right !text-ink">{n}</span>
          </span>
        </label>
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          aria-pressed={revealed}
          className={`border px-5 py-2 font-mono text-[0.7rem] uppercase tracking-[0.1em] transition-colors ${
            revealed ? "border-imagine bg-imagine text-paper" : "border-rule-strong bg-paper text-ink hover:border-ink"
          }`}
        >
          {revealed ? T.hideNew : T.newData}
        </button>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {revealed ? T.verdictAfter : T.verdictBefore}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-rule bg-rule md:grid-cols-4">
        {[
          [T.rValues, String(n)],
          [T.rTable, T.nValues(n)],
          [T.rRule, T.twoNumbers],
          [T.rNew, revealed ? T.onNewAfter : T.onNewBefore],
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
