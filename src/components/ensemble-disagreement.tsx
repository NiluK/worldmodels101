"use client";

import { useId, useMemo, useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";
import { PlayButton } from "./play-button";
import { useSweep } from "./use-sweep";

/**
 * Disagreement as a warning light, and the one way it fails.
 *
 * Five models trained on the same data, rolled forward from the same start.
 * Inside the data they track the truth and each other. Past it they fan apart,
 * and the width of the fan is the thing a planner can be charged for. Switch
 * on a shared blind spot and a hole opens in the data: inside it the five
 * agree, tightly, and are wrong together. Nothing here is a trained ensemble;
 * every curve is a made-up function of the step.
 */

const W = 900;
const H = 280;
const PAD = { l: 36, r: 24, t: 22, b: 40 };
const STEPS = 30;
const DATA_END = 14;
const GAP = { a: 6, b: 10 };
const N = 5;

const PX = (s: number) => PAD.l + (s / STEPS) * (W - PAD.l - PAD.r);
const PY = (v: number) => PAD.t + (1 - v) * (H - PAD.t - PAD.b);

const truth = (s: number) => 0.52 + 0.16 * Math.sin(s / 4.6) + 0.07 * Math.sin(s / 1.9 + 1);

const DIR = [-1, -0.45, 0.1, 0.55, 1];
const PHASE = [0.3, 1.7, 2.9, 4.1, 5.6];

/** 1 on the plateau of the blind spot, 0 outside, short ramps at the edges */
const inGap = (s: number) => Math.max(0, Math.min(1, Math.min(s - GAP.a, GAP.b - s) * 2));

function member(i: number, s: number, blind: boolean) {
  const e = Math.max(0, s - DATA_END);
  const wobble = 0.012 * Math.sin(s * 0.9 + PHASE[i]);
  // the fan widens past the data, and the whole ensemble also drifts off the truth
  const fan = DIR[i] * 0.0022 * e ** 1.6 + 0.004 * e * Math.sin(s * 0.7 + PHASE[i]) + 0.0045 * e;
  const g = blind ? inGap(s) : 0;
  // in the gap the five collapse onto one shared, wrong answer
  return truth(s) + (wobble + fan) * (1 - 0.85 * g) + 0.14 * g;
}

const TEXT = {
  en: {
    data: "where the data is",
    gap: "blind spot",
    truth: "truth",
    models: "five models",
    axis: "steps into the plan",
    horizon: "how far the plan goes",
    blind: "shared blind spot",
    disagree: "disagreement at the marker",
    error: "error at the marker",
    vIn: "Inside the data the five agree, and they are right.",
    vPast: "Past the data the five fan apart. The spread is the warning, and a planner can be charged for it.",
    vGap: "In the gap the five agree, tightly, and they are all wrong. Disagreement is a hint and not a verdict.",
    aria: (step: number, d: string, err: string, v: string) =>
      `Five model predictions against a truth curve, drawn to step ${step} of ${STEPS}. Disagreement ${d}, error ${err}, illustrative units. ${v}`,
  },
  zh: {
    data: "数据覆盖的范围",
    gap: "盲区",
    truth: "真实",
    models: "五个模型",
    axis: "计划走到第几步",
    horizon: "计划走多远",
    blind: "共同盲区",
    disagree: "标记处的分歧",
    error: "标记处的误差",
    vIn: "在数据之内，五个模型意见一致，而且是对的。",
    vPast: "出了数据范围，五个模型各自散开。散开的幅度就是警报，规划器可以为此扣分。",
    vGap: "在盲区里，五个模型意见一致、靠得很紧，却一起错了。分歧只是提示，不是裁决。",
    aria: (step: number, d: string, err: string, v: string) =>
      `五条模型预测曲线与一条真实曲线，画到第${step}步，共${STEPS}步。分歧${d}，误差${err}，示意单位。${v}`,
  },
} as const;

export function EnsembleDisagreement() {
  const uid = useId();
  const locale = useLocale();
  const T = TEXT[locale as keyof typeof TEXT] ?? TEXT.en;
  const { ref, compact } = useCompact();
  const [step, setStep] = useState(10);
  const [blind, setBlind] = useState(false);
  const sweep = useSweep({ value: step, min: 1, max: STEPS, step: 1, setValue: setStep });
  const fs = compact ? 17 : 10.5;

  // half-step samples so the curves bend instead of kink
  const xs = useMemo(() => Array.from({ length: step * 2 + 1 }, (_, i) => i / 2), [step]);
  const ys = useMemo(() => xs.map((s) => DIR.map((_, i) => member(i, s, blind))), [xs, blind]);

  const curvePath = (i: number) =>
    xs.map((s, k) => `${k ? "L" : "M"} ${PX(s).toFixed(1)} ${PY(ys[k][i]).toFixed(1)}`).join(" ");
  const band =
    xs.map((s, k) => `${k ? "L" : "M"} ${PX(s).toFixed(1)} ${PY(Math.max(...ys[k])).toFixed(1)}`).join(" ") +
    " " +
    [...xs].reverse().map((s, k) => `L ${PX(s).toFixed(1)} ${PY(Math.min(...ys[xs.length - 1 - k])).toFixed(1)}`).join(" ") +
    " Z";
  const truthPath = Array.from({ length: STEPS * 2 + 1 }, (_, i) => i / 2)
    .map((s, k) => `${k ? "L" : "M"} ${PX(s).toFixed(1)} ${PY(truth(s)).toFixed(1)}`)
    .join(" ");

  const at = ys[ys.length - 1];
  const spread = Math.max(...at) - Math.min(...at);
  const mean = at.reduce((a, b) => a + b, 0) / N;
  const err = Math.abs(mean - truth(step));
  // illustrative units: one decimal, scaled so the fan reads as whole numbers
  const dTxt = (spread * 10).toFixed(1);
  const eTxt = (err * 10).toFixed(1);

  const verdict = blind && inGap(step) === 1 ? T.vGap : step <= DATA_END ? T.vIn : T.vPast;
  const mx = PX(step);
  const floor = PY(0);

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={T.aria(step, dTxt, eTxt, verdict)}>
          {/* where the data is, with a hole in it when the blind spot is on */}
          {(blind ? [[0, GAP.a], [GAP.b, DATA_END]] : [[0, DATA_END]]).map(([a, b]) => (
            <rect key={a} x={PX(a)} y={PAD.t - 6} width={PX(b) - PX(a)} height={floor - PAD.t + 6}
              fill="var(--actual-soft)" opacity="0.7" />
          ))}
          <text x={PX(0) + 6} y={PAD.t + 6} className="font-mono" fontSize={fs} letterSpacing="1"
            fill="var(--actual)">{T.data}</text>
          {blind && !compact && (
            <text x={PX((GAP.a + GAP.b) / 2)} y={floor - 8} textAnchor="middle" className="font-mono"
              fontSize={fs} letterSpacing="1" fill="var(--actual)">{T.gap}</text>
          )}

          {/* legend */}
          <g transform={`translate(${W - PAD.r - (compact ? 190 : 150)}, ${PAD.t + 2})`}>
            <line x1="0" y1="0" x2="18" y2="0" stroke="var(--imagine)" strokeWidth="1.5" />
            <text x="24" y="4" className="font-mono" fontSize={fs} fill="var(--ink-muted)">{T.models}</text>
            <line x1="0" y1={fs + 8} x2="18" y2={fs + 8} stroke="var(--ink)" strokeWidth="1" />
            <text x="24" y={fs + 12} className="font-mono" fontSize={fs} fill="var(--ink-muted)">{T.truth}</text>
          </g>

          {/* axis */}
          <line x1={PX(0)} y1={floor} x2={PX(STEPS)} y2={floor} stroke="var(--rule-strong)" strokeWidth="1" />
          {[0, 10, 20, 30].map((s) => (
            <g key={s}>
              <line x1={PX(s)} y1={floor} x2={PX(s)} y2={floor + 4} stroke="var(--rule-strong)" strokeWidth="1" />
              <text x={PX(s)} y={floor + 8 + fs} textAnchor="middle" className="font-mono tnum" fontSize={fs}
                fill="var(--ink-faint)">{s}</text>
            </g>
          ))}
          {!compact && (
            <text x={PX(STEPS)} y={floor + 8 + fs} textAnchor="end" className="font-mono" fontSize={fs}
              letterSpacing="1" fill="var(--ink-faint)" dx="-30">{T.axis}</text>
          )}

          {/* the disagreement band, then the five, then the truth on top */}
          <path d={band} fill="var(--imagine-soft)" opacity="0.9" />
          {DIR.map((_, i) => (
            <path key={i} d={curvePath(i)} fill="none" stroke="var(--imagine)" strokeWidth="1.2" opacity="0.85" />
          ))}
          <path d={truthPath} fill="none" stroke="var(--ink)" strokeWidth="1" />

          {/* the marker: a hairline and the five answers at this step */}
          <line x1={mx} y1={PAD.t - 6} x2={mx} y2={floor} stroke="var(--ink-muted)" strokeWidth="1"
            strokeDasharray="2 3" />
          {at.map((v, i) => (
            <circle key={i} cx={mx} cy={PY(v)} r="2.6" fill="var(--imagine)" />
          ))}
          <circle cx={mx} cy={PY(truth(step))} r="2.6" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.2" />
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-full flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[18rem]">
          <span className="label whitespace-nowrap">{T.horizon}</span>
          <input
            type="range"
            min={1}
            max={STEPS}
            value={step}
            onChange={(e) => {
              sweep.stop();
              setStep(Number(e.target.value));
            }}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-8 text-right !text-ink">{step}</span>
        </label>
        <PlayButton playing={sweep.playing} onClick={sweep.toggle} />

        <span className="flex cursor-pointer items-center gap-3">
          <span className="label" id={`${uid}-blind`}>{T.blind}</span>
          <button
            type="button"
            role="switch"
            aria-checked={blind}
            aria-labelledby={`${uid}-blind`}
            onClick={() => {
              sweep.stop();
              setBlind((b) => !b);
            }}
            className={`relative h-6 w-11 border transition-colors ${
              blind ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"
            }`}
          >
            <span
              className={`absolute top-[3px] h-4 w-4 transition-all ${
                blind ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"
              }`}
            />
          </button>
        </span>

        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]">{verdict}</p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        {[
          [T.disagree, dTxt],
          [T.error, eTxt],
        ].map(([k, v]) => (
          <div key={k} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{k}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
