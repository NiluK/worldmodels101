"use client";

import { useState } from "react";
import { useT } from "./locale-provider";
import { useCompact } from "./use-compact";
import { useSweep } from "./use-sweep";
import { PlayButton } from "./play-button";

/**
 * Why a picture is not a state.
 *
 * One frame fixes where the ball is and nothing else, so every direction is
 * still open. A second frame fixes which way and how fast. A third fixes
 * whether it is speeding up. None of those quantities are in any single image:
 * they only exist across frames, and a predictor that wants to be right has to
 * carry them itself.
 *
 * The fan is the set of futures still consistent with what has been seen. It
 * narrowing is the whole chapter in one control.
 */

const W = 640;
const H = 300;
const R = 7;

/** the ball's real history, arriving right to left in time */
const PAST = [
  { x: 120, y: 196 },
  { x: 210, y: 158 },
  { x: 300, y: 138 },
];
/** where it truly goes next */
const TRUTH = [
  { x: 390, y: 136 },
  { x: 480, y: 152 },
  { x: 570, y: 186 },
];

/** Futures still open after `seen` frames, as end points of a three-step run. */
function fan(seen: number) {
  const from = PAST[2];
  if (seen === 1) {
    // position only: any heading at all
    return Array.from({ length: 13 }, (_, i) => {
      const a = (-Math.PI * 0.92) + (i / 12) * Math.PI * 1.84;
      return [from, { x: from.x + Math.cos(a) * 270, y: from.y + Math.sin(a) * 270 }];
    });
  }
  if (seen === 2) {
    // heading and speed fixed, curvature still open
    return Array.from({ length: 9 }, (_, i) => {
      const bend = (i - 4) * 26;
      return [
        from,
        { x: from.x + 90, y: from.y - 8 + bend * 0.34 },
        { x: from.x + 180, y: from.y - 4 + bend },
        { x: from.x + 270, y: from.y + 8 + bend * 2 },
      ];
    });
  }
  return [[from, ...TRUTH]];
}

const path = (pts: { x: number; y: number }[]) =>
  pts.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

export function FramesToState() {
  const t = useT();
  const { ref, compact } = useCompact(520);
  const fs = compact ? 15 : 10;
  const [seen, setSeen] = useState(1);
  const sweep = useSweep({ value: seen, min: 1, max: 3, step: 1, setValue: setSeen });
  const futures = fan(seen);

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={t("fts.aria", { n: String(seen) })}>
          <defs>
            {/* the fan is clipped to the frame: a future leaving the picture is
                still a future, but it should not leave the figure. */}
            <clipPath id="fts-box">
              <rect x={20} y={20} width={W - 40} height={H - 60} />
            </clipPath>
          </defs>
          <rect x={20} y={20} width={W - 40} height={H - 60} fill="none"
            stroke="var(--rule)" strokeWidth="1" />

          {/* futures still consistent with what has been seen */}
          <g clipPath="url(#fts-box)">
            {futures.map((f, i) => (
              <path key={i} d={path(f)} fill="none" stroke="var(--imagine)" strokeWidth="1.6"
                opacity={seen === 3 ? 0.95 : 0.34} strokeDasharray={seen === 3 ? undefined : "4 4"} />
            ))}
          </g>

          {/* the frames actually seen */}
          {PAST.map((p, i) => {
            const shown = i >= 3 - seen;
            return (
              <g key={i} opacity={shown ? 1 : 0.14}>
                <circle cx={p.x} cy={p.y} r={R} fill={i === 2 ? "var(--actual)" : "none"}
                  stroke="var(--actual)" strokeWidth="2" />
                <text x={p.x} y={p.y + 26} textAnchor="middle" className="font-mono tnum"
                  fontSize={fs * 0.95} fill="var(--ink-faint)">
                  {shown ? t("fts.frame", { n: String(i - (3 - seen) + 1) }) : ""}
                </text>
              </g>
            );
          })}

          <text x={28} y={H - 26} className="font-mono" fontSize={fs} fill="var(--ink-faint)">
            {t("fts.axis")}
          </text>
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-full flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[16rem]">
          <span className="label whitespace-nowrap">{t("fts.seen")}</span>
          <input type="range" min={1} max={3} value={seen}
            onChange={(e) => {
              sweep.stop();
              setSeen(Number(e.target.value));
            }}
            className="h-1 min-w-[7rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-8 text-right !text-ink">{seen}</span>
        </label>
        <PlayButton playing={sweep.playing} onClick={sweep.toggle} />
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("fts.known")}</p>
          <p className="mt-1 text-[0.98rem] leading-snug text-ink">{t(`fts.known.${seen}`)}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("fts.open")}</p>
          <p className="mt-1 text-[0.98rem] leading-snug text-ink">{t(`fts.open.${seen}`)}</p>
        </div>
      </div>
    </div>
  );
}
