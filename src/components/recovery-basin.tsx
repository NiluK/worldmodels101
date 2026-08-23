"use client";

import { useState } from "react";
import { useT } from "./locale-provider";

const W = 680;
const H = 280;
const STEPS = 10;
const X = (i: number) => 42 + (i / STEPS) * (W - 84);
const Y = (v: number) => H / 2 - v * 94;

function rollout(start: number, gain: number) {
  return Array.from({ length: STEPS + 1 }, (_, i) => start * gain ** i);
}

function line(values: number[]) {
  return values.map((v, i) => `${i ? "L" : "M"} ${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
}

/**
 * One-step tests exercise the centre line. Deployment exercises the region
 * around it. The arithmetic is illustrative; the distribution-shift geometry
 * is the point. Both models are perfect on the demonstrated path. Only the one
 * trained on perturbed states learns which way recovery lies.
 */
export function RecoveryBasin() {
  const t = useT();
  const [offset, setOffset] = useState(36);
  const start = offset / 100;
  const truthOnly = rollout(start, 1.13);
  const recovery = rollout(start, 0.62);
  const finalTruth = Math.abs(truthOnly[STEPS]);
  const finalRecovery = Math.abs(recovery[STEPS]);

  return (
    <div>
      <div className="px-4 pt-6 md:px-8">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full"
          role="img"
          aria-label={t("rb.aria", { n: offset })}
        >
          <rect x="24" y={Y(0.13)} width={W - 48} height={Y(-0.13) - Y(0.13)} fill="var(--actual-soft)" />
          <line x1="24" y1={Y(0)} x2={W - 24} y2={Y(0)} stroke="var(--actual)" strokeWidth="1.6" />
          <path d={line(truthOnly)} fill="none" stroke="var(--imagine)" strokeWidth="2.5" strokeDasharray="6 4" />
          <path d={line(recovery)} fill="none" stroke="var(--actual)" strokeWidth="2.7" />

          {truthOnly.map((v, i) => (
            <circle key={`t-${i}`} cx={X(i)} cy={Y(v)} r={i === 0 ? 4.5 : 3} fill="var(--imagine)" />
          ))}
          {recovery.slice(1).map((v, i) => (
            <circle key={`r-${i}`} cx={X(i + 1)} cy={Y(v)} r="3" fill="var(--actual)" />
          ))}

          <text x="34" y="24" className="font-mono" fontSize="10" fill="var(--imagine)">{t("rb.truthOnly")}</text>
          <text x="34" y="40" className="font-mono" fontSize="10" fill="var(--actual)">{t("rb.recovery")}</text>
          <text x={W - 28} y={Y(0) - 9} textAnchor="end" className="font-mono" fontSize="9" fill="var(--actual)">{t("rb.demonstrated")}</text>
          <text x="42" y={H - 14} className="font-mono" fontSize="9" fill="var(--ink-faint)">{t("rb.first")}</text>
          <text x={W - 42} y={H - 14} textAnchor="end" className="font-mono" fontSize="9" fill="var(--ink-faint)">{t("rb.later")}</text>
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-[14rem] flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          <span className="label whitespace-nowrap">{t("rb.offset")}</span>
          <input
            type="range"
            min={2}
            max={45}
            value={offset}
            onChange={(event) => setOffset(Number(event.target.value))}
            className="h-1 min-w-[8rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-12 text-right !text-ink">{offset}%</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("rb.oneStep")}</p>
          <p className="mt-1 text-[0.96rem] text-ink">{t("rb.oneStepA")}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label !text-imagine">{t("rb.truthEnd")}</p>
          <p className="tnum mt-1 text-[0.96rem] text-ink">{finalTruth.toFixed(2)}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label !text-actual">{t("rb.recoveryEnd")}</p>
          <p className="tnum mt-1 text-[0.96rem] text-ink">{finalRecovery.toFixed(3)}</p>
        </div>
      </div>
    </div>
  );
}
