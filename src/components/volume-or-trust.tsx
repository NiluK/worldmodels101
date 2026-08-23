"use client";

import { useMemo, useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * The trade MBPO is making, as one curve.
 *
 * A hundred real states from the replay buffer, and one choice: how far to
 * imagine from each. Longer rollouts buy rows fast and worth slowly, so the
 * batch grows while the average row drifts away from evidence. The only
 * quantity that matters is the product, and it flattens.
 *
 * Illustrative: the 0.88 per step discount and everything derived from it.
 * Real: MBPO's move, which is short rollouts branched from real states.
 */

const MAX_K = 20;
const PER_STATE = 100;
const DECAY = 0.88;

/**
 * A 900-unit plot shrunk into a phone column puts the tick labels under six
 * pixels, so the narrow version is a smaller plot rather than the same one
 * scaled down.
 */
const WIDE = { w: 900, h: 300, l: 76, r: 872, top: 26, bottom: 242 };
const NARROW = { w: 470, h: 208, l: 46, r: 442, top: 22, bottom: 150 };

/** worth of one row at rollout length k, and the rows that length buys */
function at(k: number) {
  let sum = 0;
  for (let i = 1; i <= k; i++) sum += DECAY ** i;
  return { rows: PER_STATE * k, worth: sum / k, effective: PER_STATE * sum };
}

type Text = {
  xAxis: string;
  xAxisShort: string;
  yAxis: string;
  yAxisShort: string;
  band: string;
  slider: string;
  rows: string;
  worth: string;
  effective: string;
  v1: string;
  v2: string;
  v3: string;
  aria: (k: number, rows: number, worth: string) => string;
};

const TEXT: LocaleText<Text> = {
  en: {
    xAxis: "transitions in the batch",
    xAxisShort: "transitions",
    yAxis: "average worth of a row",
    yAxisShort: "worth",
    band: "where MBPO works",
    slider: "Rollout length",
    rows: "Transitions in the batch",
    worth: "Average worth of a row",
    effective: "Effective transitions",
    v1: "Short rollouts from every real state. Almost every row in the batch is still next to something that happened.",
    v2: "The batch is growing faster than the learning is. Half of these rows are several steps out from any evidence.",
    v3: "Going from five steps out to twenty made the batch four times the size and not quite doubled what the learner gets.",
    aria: (k, rows, worth) =>
      `A falling curve of the average worth of a row against the size of the batch. At a rollout length of ${k} steps the batch holds ${rows} transitions and the average row is worth ${worth}.`,
  },
};

export function VolumeOrTrust() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const { ref, compact } = useCompact(600);
  const k = compact ? 1.65 : 1;
  const [len, setLen] = useState(3);

  const G = compact ? NARROW : WIDE;
  const xOf = (rows: number) =>
    G.l + (rows / (PER_STATE * MAX_K)) * (G.r - G.l);
  const yOf = (worth: number) => G.bottom - worth * (G.bottom - G.top);

  const points = useMemo(
    () => Array.from({ length: MAX_K }, (_, i) => at(i + 1)),
    [],
  );
  const here = points[len - 1];
  const path = (from: number, to: number) =>
    points
      .slice(from, to)
      .map(
        (pt, i) =>
          `${i ? "L" : "M"} ${xOf(pt.rows).toFixed(1)} ${yOf(pt.worth).toFixed(1)}`,
      )
      .join(" ");

  const dx = xOf(here.rows);
  const dy = yOf(here.worth);
  const verdict = len <= 4 ? T.v1 : len <= 10 ? T.v2 : T.v3;

  return (
    <div>
      <div ref={ref} className="px-5 pt-6 md:px-8">
        <svg
          viewBox={`0 0 ${G.w} ${G.h}`}
          className="block w-full"
          role="img"
          aria-label={T.aria(len, here.rows, here.worth.toFixed(2))}
        >
          <line
            x1={G.l}
            y1={G.top}
            x2={G.l}
            y2={G.bottom}
            stroke="var(--rule-strong)"
            strokeWidth="1"
          />
          <line
            x1={G.l}
            y1={G.bottom}
            x2={G.r}
            y2={G.bottom}
            stroke="var(--rule-strong)"
            strokeWidth="1"
          />

          {[0, 500, 1000, 1500, 2000].map((r) => (
            <g key={r}>
              <line
                x1={xOf(r)}
                y1={G.bottom}
                x2={xOf(r)}
                y2={G.bottom + 5}
                stroke="var(--rule-strong)"
                strokeWidth="1"
              />
              <text
                x={xOf(r)}
                y={G.bottom + 18 * k}
                textAnchor="middle"
                className="font-mono"
                fontSize={10 * k}
                fill="var(--ink-faint)"
              >
                {r}
              </text>
            </g>
          ))}
          {[0, 0.5, 1].map((v) => (
            <text
              key={v}
              x={G.l - 8}
              y={yOf(v) + 3.5 * k}
              textAnchor="end"
              className="font-mono"
              fontSize={10 * k}
              fill="var(--ink-faint)"
            >
              {v.toFixed(1)}
            </text>
          ))}

          {/* the whole trade, and the corner the paper actually works in */}
          <path
            d={path(0, MAX_K)}
            fill="none"
            stroke="var(--ink-faint)"
            strokeWidth="1.5"
          />
          <path
            d={path(0, 4)}
            fill="none"
            stroke="var(--actual)"
            strokeWidth="3"
          />
          <text
            x={xOf(points[0].rows) + 6}
            y={compact ? yOf(points[3].worth) + 42 : yOf(points[0].worth) - 14}
            className="font-mono"
            fontSize={10 * k}
            fill="var(--actual)"
          >
            {T.band}
          </text>

          <line
            x1={dx}
            y1={dy}
            x2={dx}
            y2={G.bottom}
            stroke="var(--imagine)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
          <line
            x1={G.l}
            y1={dy}
            x2={dx}
            y2={dy}
            stroke="var(--imagine)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
          <circle
            cx={dx}
            cy={dy}
            r={6}
            fill="var(--imagine)"
            stroke="var(--paper)"
            strokeWidth="1.5"
          />

          {compact ? (
            <text
              x={G.l}
              y={14}
              className="font-mono"
              fontSize={10 * k}
              fill="var(--ink-faint)"
            >
              {T.yAxisShort}
            </text>
          ) : (
            <text
              transform={`rotate(-90 20 ${(G.top + G.bottom) / 2})`}
              x={20}
              y={(G.top + G.bottom) / 2}
              textAnchor="middle"
              className="font-mono"
              fontSize={10}
              fill="var(--ink-faint)"
            >
              {T.yAxis}
            </text>
          )}
          <text
            x={(G.l + G.r) / 2}
            y={G.h - 8}
            textAnchor="middle"
            className="font-mono"
            fontSize={10 * k}
            fill="var(--ink-faint)"
          >
            {compact ? T.xAxisShort : T.xAxis}
          </text>
        </svg>
      </div>

      <div
        data-print-hide
        className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8"
      >
        <label className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[18rem] sm:flex-1 sm:flex-nowrap">
          <span className="label basis-full whitespace-nowrap sm:basis-auto">
            {T.slider}
          </span>
          <input
            type="range"
            min={1}
            max={MAX_K}
            value={len}
            onChange={(e) => setLen(Number(e.target.value))}
            className="h-1 min-w-[6rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-10 text-right !text-ink">{len}</span>
        </label>
        <p
          className="label basis-full !normal-case !tracking-normal !text-[0.8rem]"
          aria-live="polite"
        >
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.rows, String(here.rows)],
          [T.worth, here.worth.toFixed(2)],
          [T.effective, String(Math.round(here.effective))],
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
