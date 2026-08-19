"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useT } from "./locale-provider";

/**
 * The model eating its own output.
 *
 * One box is given by the world. Every box after it is the model reading its
 * own last answer, which is what makes the error curve bend rather than climb.
 * Nothing dramatic happens at any single step, and that is the point: the
 * failure is the accumulation, not any one prediction.
 *
 * The growth constant is illustrative. What is not illustrative is the shape:
 * a per-step error that feeds forward compounds instead of adding.
 */

const W = 900;
const H = 208;
const PAD_L = 34;
const PAD_R = 26;
const TOP = 42;
const BASE = 172;   // where the error bars stand
const MAX_H = 24;

const STEP_ERR = 2;      // percent introduced per step
const GROWTH = 1.22;     // and how much the last step's error amplifies

/** total error after k steps, as a percentage, capped where it stops meaning anything */
const errAt = (k: number) =>
  Math.min(100, (STEP_ERR * (GROWTH ** k - 1)) / (GROWTH - 1));

export function CompoundingRollout() {
  const t = useT();
  const still = useReducedMotion();
  const [h, setH] = useState(6);

  // the chain always spans the figure, so the shape of the growth is readable
  // at every horizon rather than huddling in the left quarter.
  const slot = (W - PAD_L - PAD_R) / (h + 1);
  const bw = Math.min(34, slot - 7);
  const cx = (i: number) => PAD_L + slot * i + slot / 2;
  const err = errAt(h);

  return (
    <div>
      <div className="overflow-x-auto px-5 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full min-w-[600px]" role="img"
          aria-label={t("comp.aria", { h: String(h), pct: String(Math.round(err)) })}>
          <line x1={PAD_L} y1={BASE + 0.5} x2={W - PAD_R} y2={BASE + 0.5}
            stroke="var(--rule)" strokeWidth="1" />

          {Array.from({ length: h + 1 }, (_, i) => {
            const given = i === 0;
            const tone = given ? "var(--actual)" : "var(--imagine)";
            const e = errAt(i);
            const barH = (e / 100) * (BASE - TOP - 40);
            return (
              <motion.g key={i}
                initial={still ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: still ? 0 : Math.min(i, 8) * 0.02 }}>
                {/* the state itself */}
                <rect x={cx(i) - bw / 2} y={TOP} width={bw} height={22} fill={tone}
                  opacity={given ? 0.9 : 0.34} />
                {/* feeding forward */}
                {i < h && (
                  <line x1={cx(i) + bw / 2 + 2} y1={TOP + 11} x2={cx(i + 1) - bw / 2 - 2}
                    y2={TOP + 11} stroke="var(--rule-strong)" strokeWidth="1" />
                )}
                {/* how wrong it is by now */}
                <rect x={cx(i) - bw / 2} y={BASE - barH} width={bw} height={barH} fill={tone}
                  opacity={given ? 0.9 : 0.8} />
              </motion.g>
            );
          })}

          <text x={cx(0)} y={TOP - 12} textAnchor="middle" className="font-mono" fontSize="10"
            fill="var(--actual)">
            {t("comp.given")}
          </text>
          {h >= 3 && (
            <text x={cx(h) + bw / 2} y={TOP - 12} textAnchor="end" className="font-mono"
              fontSize="10" fill="var(--imagine)">
              {t("comp.imagined")}
            </text>
          )}
          <text x={PAD_L} y={BASE + 20} className="font-mono" fontSize="10" fill="var(--ink-faint)">
            {t("comp.errorAxis")}
          </text>
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-[18rem] flex-1 items-center gap-3">
          <span className="label whitespace-nowrap">{t("comp.horizon")}</span>
          <input type="range" min={1} max={MAX_H} value={h}
            onChange={(e) => setH(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-10 text-right !text-ink">{h}</span>
        </label>
        <p className="label !normal-case !tracking-normal !text-[0.8rem]">
          {err < 12 ? t("comp.fine") : err < 60 ? t("comp.drifting") : t("comp.gone")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("comp.perStep")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{STEP_ERR}%</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("comp.after", { h: String(h) })}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{Math.round(err)}%</p>
        </div>
      </div>
    </div>
  );
}
