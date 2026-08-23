"use client";

import { useMemo, useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * The month from the chapter's first paragraph, drawn as thirty days.
 *
 * The slider moves practice out of the world and into the model, and the
 * calendar empties from the end backwards. Two things refuse to move: the day
 * and a half at the start, which is the data the model is fitted from, and the
 * fact that a person walks to the bin on every one of those days. Nothing here
 * prices what an imagined step is worth; that is the next figure's job.
 *
 * Illustrative: two million attempts at one a second, one knocked bin every
 * four thousand attempts, and an imagined step costing about half a
 * millisecond. The month is the chapter's own number.
 */

const DAYS = 30;
/** the seed data the model is fitted from, in days; the slider cannot take it */
const SEED_DAYS = 1.5;
const ATTEMPTS = 2_000_000;
const TRIPS_AT_FULL = 500;
/** seconds of compute for one imagined attempt */
const IMAGINED_STEP_S = 0.0005;

const CELL = 74;
const GAP = 8;

type Text = {
  slider: string;
  fitted: string;
  daysRunning: string;
  trips: string;
  wallClock: string;
  days: (n: string) => string;
  v0: string;
  vMid: (n: string) => string;
  vTop: string;
  aria: (n: string, pct: number) => string;
};

const TEXT: LocaleText<Text> = {
  en: {
    slider: "Practice moved into the model",
    fitted: "fitted from these",
    daysRunning: "Days the arm is running",
    trips: "Trips to the bin",
    wallClock: "Total wall clock",
    days: (n) => `${n} d`,
    v0: "Thirty days of dropping things, and about five hundred trips to stand the bin back up.",
    vMid: (n) =>
      `${n} days left in the world. The rest of the practice happens where nothing falls over.`,
    vTop: "A day and a half in the world and twenty five trips to the bin. That day and a half is the part the model cannot supply, because it is what the model is fitted from.",
    aria: (n, pct) =>
      `A calendar of thirty days of a robot arm dropping things. ${pct} per cent of the practice has moved into the model, so ${n} days still run in the world and the later days are empty.`,
  },
};

export function MonthOfDrops() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const { ref, compact } = useCompact(560);
  const k = compact ? 1.65 : 1;
  const [moved, setMoved] = useState(0);

  const cols = compact ? 5 : 6;
  const rows = DAYS / cols;
  const top = compact ? 48 : 34;
  const W = cols * CELL + (cols - 1) * GAP;
  const H = top + rows * CELL + (rows - 1) * GAP;

  const daysInWorld = SEED_DAYS + (DAYS - SEED_DAYS) * (1 - moved / 100);
  const trips = Math.round((TRIPS_AT_FULL * daysInWorld) / DAYS);
  const imaginedDays = useMemo(() => {
    const share = (DAYS - daysInWorld) / DAYS;
    return (ATTEMPTS * share * IMAGINED_STEP_S) / 86_400;
  }, [daysInWorld]);
  const total = daysInWorld + imaginedDays;

  const verdict =
    moved === 0
      ? T.v0
      : moved === 100
        ? T.vTop
        : T.vMid(daysInWorld.toFixed(1));

  return (
    <div>
      <div ref={ref} className="px-5 pt-6 md:px-8">
        <div className="mx-auto max-w-[30rem]">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block w-full"
            role="img"
            aria-label={T.aria(daysInWorld.toFixed(1), moved)}
          >
            {/* the seed data: one day and the left half of the next, never emptied */}
            <text
              x={0}
              y={top - 20}
              className="font-mono"
              fontSize={11 * k}
              letterSpacing="0.5"
              fill="var(--ink-faint)"
            >
              {T.fitted}
            </text>
            <path
              d={`M 0 ${top - 4} L 0 ${top - 10} L ${CELL * 1.5 + GAP} ${top - 10} L ${CELL * 1.5 + GAP} ${top - 4}`}
              fill="none"
              stroke="var(--rule-strong)"
              strokeWidth="1"
            />

            {Array.from({ length: DAYS }, (_, i) => {
              const day = i + 1;
              const x = (i % cols) * (CELL + GAP);
              const y = top + Math.floor(i / cols) * (CELL + GAP);
              const frac = Math.max(0, Math.min(1, daysInWorld - i));
              const running = frac > 0;
              return (
                <g key={day}>
                  {running && (
                    <rect
                      x={x}
                      y={y}
                      width={CELL * frac}
                      height={CELL}
                      fill="var(--actual-soft)"
                    />
                  )}
                  <rect
                    x={x + 0.5}
                    y={y + 0.5}
                    width={CELL - 1}
                    height={CELL - 1}
                    fill="none"
                    stroke={running ? "var(--actual)" : "var(--rule)"}
                    strokeWidth="1"
                  />
                  {/* the practice for this day happens inside the model now */}
                  {!running && (
                    <path
                      d={`M ${x + CELL - 22} ${y + 12} l 4 5 l 9 -10`}
                      fill="none"
                      stroke="var(--imagine)"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {!compact && (
                    <text
                      x={x + 6}
                      y={y + 15}
                      className="font-mono"
                      fontSize={10}
                      fill="var(--ink-faint)"
                    >
                      {day}
                    </text>
                  )}
                </g>
              );
            })}

            {/* the seed pair carries a heavier edge so it reads as fixed */}
            <rect
              x={0.9}
              y={top + 0.9}
              width={CELL - 1.8}
              height={CELL - 1.8}
              fill="none"
              stroke="var(--rule-strong)"
              strokeWidth="1.8"
            />
            <rect
              x={CELL + GAP + 0.9}
              y={top + 0.9}
              width={CELL / 2 - 0.9}
              height={CELL - 1.8}
              fill="none"
              stroke="var(--rule-strong)"
              strokeWidth="1.8"
            />
          </svg>
        </div>
      </div>

      <div
        data-print-hide
        className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8"
      >
        <label className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[18rem] sm:flex-1 sm:flex-nowrap">
          <span className="label basis-full whitespace-nowrap sm:basis-auto">
            {T.slider}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={moved}
            onChange={(e) => setMoved(Number(e.target.value))}
            className="h-1 min-w-[6rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-12 text-right !text-ink">{moved}%</span>
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
          [T.daysRunning, daysInWorld.toFixed(1)],
          [T.trips, String(trips)],
          [T.wallClock, T.days(total.toFixed(1))],
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
