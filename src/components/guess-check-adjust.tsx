"use client";

import { useState } from "react";
import { useT } from "./locale-provider";
import { useCompact } from "./use-compact";
import { useSweep } from "./use-sweep";
import { PlayButton } from "./play-button";

/**
 * The loop, running for real.
 *
 * A two-tap linear predictor guesses the next value from the previous two,
 * the true value arrives, and the weights take one gradient step on the
 * squared error. Nothing here is staged: the weights start at zero, the error
 * curve is whatever the arithmetic produces, and the predictor ends up
 * discovering the recurrence that generates the sequence.
 *
 * That is the point of putting it on screen. Nobody told it the rule. It was
 * only ever asked to be less wrong about the next number.
 */

const W = 640;
const H = 260;
const PAD = { l: 34, r: 20, t: 20, b: 46 };
const STEPS = 220;
const LR = 0.5;

/** the sequence to be learned: a decaying oscillation, so two taps suffice */
const truth = (i: number) => Math.sin(i * 0.42) * Math.exp(-i * 0.004);

const px = (i: number) => PAD.l + (i / STEPS) * (W - PAD.l - PAD.r);
const py = (v: number) => PAD.t + (1 - (v + 1.15) / 2.3) * (H - PAD.t - PAD.b);

type Frame = { w: [number, number]; guess: number; real: number; err: number };

/** Replays the whole run from scratch so any step is reachable without drift. */
function runTo(n: number): { frames: Frame[]; errors: number[] } {
  let w: [number, number] = [0, 0];
  const frames: Frame[] = [];
  const errors: number[] = [];
  for (let i = 2; i <= n + 1; i++) {
    const a = truth(i - 1);
    const b = truth(i - 2);
    const guess = w[0] * a + w[1] * b;
    const real = truth(i);
    const err = real - guess;
    frames.push({ w: [w[0], w[1]], guess, real, err });
    errors.push(Math.abs(err));
    w = [w[0] + LR * err * a, w[1] + LR * err * b];
  }
  return { frames, errors };
}

export function GuessCheckAdjust() {
  const t = useT();
  const { ref, compact } = useCompact(520);
  const fs = compact ? 15 : 10;
  const [n, setN] = useState(6);
  // the run used to be a requestAnimationFrame loop; the shared sweep keeps
  // the same one-step-per-tick motion and gives the figure the house control
  const sweep = useSweep({ value: n, min: 6, max: STEPS, step: 1, setValue: setN, intervalMs: 30 });

  const { frames, errors } = runTo(n);
  const last = frames[frames.length - 1];
  /** mean absolute error over the most recent stretch, not the whole run */
  const recent = errors.slice(-24);
  const mae = recent.reduce((s, e) => s + e, 0) / recent.length;

  const line = (sel: (f: Frame) => number) =>
    frames.map((f, i) => `${i ? "L" : "M"} ${px(i + 2).toFixed(1)} ${py(sel(f)).toFixed(1)}`).join(" ");

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={t("gca.aria", { n: String(n) })}>
          <line x1={PAD.l} y1={py(0)} x2={W - PAD.r} y2={py(0)} stroke="var(--rule)" strokeWidth="1" />
          {/* what actually arrived */}
          <path d={line((f) => f.real)} fill="none" stroke="var(--actual)" strokeWidth="2" />
          {/* what it guessed before seeing it */}
          <path d={line((f) => f.guess)} fill="none" stroke="var(--imagine)" strokeWidth="1.8"
            strokeDasharray="4 3" />
          {last && (
            <>
              <line x1={px(n + 1)} y1={py(last.guess)} x2={px(n + 1)} y2={py(last.real)}
                stroke="var(--ink)" strokeWidth="1" />
              <circle cx={px(n + 1)} cy={py(last.real)} r={4} fill="var(--actual)" />
              <circle cx={px(n + 1)} cy={py(last.guess)} r={4} fill="var(--imagine)" />
            </>
          )}
          <text x={PAD.l} y={H - 22} className="font-mono" fontSize={fs} fill="var(--actual)">
            {t("gca.real")}
          </text>
          <text x={PAD.l + (compact ? 150 : 96)} y={H - 22} className="font-mono" fontSize={fs}
            fill="var(--imagine)">
            {t("gca.guess")}
          </text>
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-[18rem] flex-1 items-center gap-3">
          <span className="label whitespace-nowrap">{t("gca.step")}</span>
          <input type="range" min={6} max={STEPS} value={n}
            onChange={(e) => { sweep.stop(); setN(Number(e.target.value)); }}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-10 text-right !text-ink">{n}</span>
        </label>
        <PlayButton playing={sweep.playing} onClick={sweep.toggle} />
        <button
          type="button"
          onClick={() => { sweep.stop(); setN(6); }}
          className="label transition-colors hover:text-ink"
        >
          {t("gca.reset")}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("gca.wrongBy")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{mae.toFixed(3)}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("gca.weights")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">
            {last ? `${last.w[0].toFixed(2)}, ${last.w[1].toFixed(2)}` : "0.00, 0.00"}
          </p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("gca.verdict")}</p>
          <p className="mt-1 text-[0.98rem] leading-snug text-ink">
            {t(mae > 0.3 ? "gca.v.bad" : mae > 0.06 ? "gca.v.mid" : "gca.v.good")}
          </p>
        </div>
      </div>
    </div>
  );
}
