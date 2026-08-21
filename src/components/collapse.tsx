"use client";

import { useState } from "react";
import { useT } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * The price of not predicting pixels.
 *
 * Score a model on how close its prediction is to another *learned* embedding
 * and there is a trivial way to win: make every embedding the same. The loss
 * goes to zero and the representation carries no information at all.
 *
 * This is not an illustration. It is a two-by-two encoder trained by gradient
 * descent on four paired views, and the numbers are whatever that produces.
 * Without the safeguard the loss reaches zero and the spread reaches zero with
 * it. With the safeguard the loss never gets near zero, which is the point:
 * the useful run is the one that looks worse.
 */

const W = 620;
const H = 230;
const PAD = { l: 46, r: 22, t: 20, b: 40 };
const STEPS = 400;
const LR = 0.9;
const TARGET = 1;

/** four things, each seen twice slightly differently */
const PAIRS: [number, number][][] = [
  [[1, 0.2], [0.9, 0.35]],
  [[-0.8, 0.6], [-0.7, 0.45]],
  [[0.3, -1], [0.45, -0.9]],
  [[-0.5, -0.7], [-0.6, -0.55]],
];

type Frame = { loss: number; spread: number; embs: [number, number][] };

function train(guard: boolean): Frame[] {
  const Wm = [
    [1, 0.15],
    [-0.1, 0.95],
  ];
  const out: Frame[] = [];
  for (let s = 0; s < STEPS; s++) {
    const g = [
      [0, 0],
      [0, 0],
    ];
    let loss = 0;
    const embs: [number, number][] = [];
    for (const [a, b] of PAIRS) {
      const ea: [number, number] = [Wm[0][0] * a[0] + Wm[0][1] * a[1], Wm[1][0] * a[0] + Wm[1][1] * a[1]];
      const eb: [number, number] = [Wm[0][0] * b[0] + Wm[0][1] * b[1], Wm[1][0] * b[0] + Wm[1][1] * b[1]];
      embs.push(ea);
      const d = [ea[0] - eb[0], ea[1] - eb[1]];
      loss += d[0] * d[0] + d[1] * d[1];
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) g[i][j] += 2 * d[i] * (a[j] - b[j]);
    }
    loss /= PAIRS.length;
    const m = [
      embs.reduce((s2, e) => s2 + e[0], 0) / PAIRS.length,
      embs.reduce((s2, e) => s2 + e[1], 0) / PAIRS.length,
    ];
    const spread = embs.reduce((s2, e) => s2 + (e[0] - m[0]) ** 2 + (e[1] - m[1]) ** 2, 0) / PAIRS.length;
    out.push({ loss, spread, embs: embs.map((e) => [e[0], e[1]] as [number, number]) });
    if (guard) {
      // hold the spread near a target rather than pushing it apart without limit
      const c = 2 * (spread - TARGET) * 1.2;
      PAIRS.forEach(([a], k) => {
        for (let i = 0; i < 2; i++)
          for (let j = 0; j < 2; j++) g[i][j] += (c * 2 * (embs[k][i] - m[i]) * a[j]) / PAIRS.length;
      });
    }
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) Wm[i][j] -= (LR * g[i][j]) / PAIRS.length;
  }
  return out;
}

const RUNS = { off: train(false), on: train(true) };

const px = (i: number) => PAD.l + (i / STEPS) * (W - PAD.l - PAD.r);
const py = (v: number, max: number) => PAD.t + (1 - Math.min(1, v / max)) * (H - PAD.t - PAD.b);
const line = (f: Frame[], sel: (x: Frame) => number, max: number) =>
  f.map((x, i) => `${i ? "L" : "M"} ${px(i).toFixed(1)} ${py(sel(x), max).toFixed(1)}`).join(" ");

export function Collapse() {
  const t = useT();
  const { ref, compact } = useCompact(520);
  const fs = compact ? 16 : 10;
  const [guard, setGuard] = useState(false);
  const [step, setStep] = useState(STEPS - 1);
  const run = guard ? RUNS.on : RUNS.off;
  const f = run[step];

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={t("cl.aria", { g: guard ? "on" : "off" })}>
          <line x1={PAD.l} y1={py(0, 1)} x2={W - PAD.r} y2={py(0, 1)} stroke="var(--rule)" strokeWidth="1" />
          <path d={line(run, (x) => x.loss, 0.035)} fill="none" stroke="var(--imagine)" strokeWidth="2.2" />
          <path d={line(run, (x) => x.spread, 1.2)} fill="none" stroke="var(--actual)" strokeWidth="2.2"
            strokeDasharray="5 4" />
          <line x1={px(step)} y1={PAD.t - 6} x2={px(step)} y2={py(0, 1)} stroke="var(--ink)" strokeWidth="1.2" />
          <text x={PAD.l} y={PAD.t - 6} className="font-mono" fontSize={fs} fill="var(--imagine)">
            {t("cl.loss")}
          </text>
          <text x={PAD.l + (compact ? 330 : 260)} y={PAD.t - 6} className="font-mono" fontSize={fs}
            fill="var(--actual)">
            {t("cl.spread")}
          </text>
          <text x={PAD.l} y={H - 12} className="font-mono" fontSize={fs} fill="var(--ink-faint)">
            {t("cl.axis")}
          </text>
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <button
          onClick={() => setGuard((v) => !v)}
          className={`border px-4 py-1.5 transition-colors ${guard ? "border-ink bg-ink text-paper" : "border-rule-strong hover:border-ink"}`}
        >
          <span className={`label ${guard ? "!text-paper" : ""}`}>
            {t(guard ? "cl.guardOn" : "cl.guardOff")}
          </span>
        </button>
        <label className="flex min-w-full flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[14rem]">
          <span className="label whitespace-nowrap">{t("cl.step")}</span>
          <input type="range" min={0} max={STEPS - 1} value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            className="h-1 min-w-[7rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-10 text-right !text-ink">{step}</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label" style={{ color: "var(--imagine)" }}>{t("cl.loss")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{f.loss.toFixed(5)}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label" style={{ color: "var(--actual)" }}>{t("cl.spread")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{f.spread.toFixed(3)}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("cl.verdict")}</p>
          <p className="mt-1 text-[0.98rem] leading-snug text-ink">
            {t(f.spread < 0.05 ? "cl.v.dead" : guard ? "cl.v.alive" : "cl.v.going")}
          </p>
        </div>
      </div>
    </div>
  );
}
