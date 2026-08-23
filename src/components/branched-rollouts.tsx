"use client";

import { useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { PlayButton } from "./play-button";
import { useSweep } from "./use-sweep";
import { pickText } from "@/lib/locale-text";

/**
 * Short branches from many real states, or one long branch from one.
 *
 * MBPO's trade: every imagined rollout starts from a real state in the replay
 * buffer and runs for only a few steps. The branches here fade with each step
 * out, standing in for a model error that compounds along the rollout. The
 * fade rate is illustrative; the shape of the trade is the point.
 */

const W = 900;
const H = 300;
const BASE_Y = 252;
const TOP_Y = 28;
const MAX_LEN = 20;
const N_REAL = 8;
const STEP_Y = (BASE_Y - TOP_Y) / MAX_LEN;
const NEAR = 3;
const LONE = 3; // which dot carries the single long rollout
const X0 = 80;
const DX = (W - 2 * X0) / (N_REAL - 1);

/** deterministic wobble in [-1, 1] */
function wob(b: number, i: number) {
  const s = Math.sin(b * 127.1 + i * 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}

function branch(b: number): [number, number][] {
  const pts: [number, number][] = [[X0 + b * DX, BASE_Y]];
  let drift = 0;
  for (let i = 1; i <= MAX_LEN; i++) {
    drift = Math.max(-34, Math.min(34, drift + wob(b, i) * 7));
    pts.push([X0 + b * DX + drift, BASE_Y - i * STEP_Y]);
  }
  return pts;
}

const trust = (i: number) => 0.9 * Math.pow(0.88, i);

type Strings = {
  real: string;
  imagined: string;
  stepN: (n: number) => string;
  length: string;
  every: string;
  one: string;
  batch: string;
  near: string;
  furthest: string;
  steps: (n: number) => string;
  v1: string;
  v2: string;
  v3: string;
  lone1: string;
  lone2: string;
  aria: (branches: number, len: number) => string;
};

const TEXT: Record<string, Strings> = {
  en: {
    real: "real states (replay buffer)",
    imagined: "imagined rollouts",
    stepN: (n) => `step ${n}`,
    length: "Rollout length",
    every: "Branch from every real state",
    one: "One long rollout from one state",
    batch: "Imagined steps in the batch",
    near: "Steps near evidence",
    furthest: "Furthest step from a real state",
    steps: (n) => `${n} ${n === 1 ? "step" : "steps"}`,
    v1: "Short branches from many real states: a lot of imagined steps, and every one of them close to evidence.",
    v2: "The branches are starting to fade. The learner is paying the model's error at every step out.",
    v3: "Most of this batch is far from any real state. The count went up, and the trust went down.",
    lone1: "One rollout from one real state: close to evidence, but hardly any imagined data.",
    lone2: "One long rollout from one real state: the same length, far fewer steps, and most of them far from evidence.",
    aria: (branches, len) =>
      `${N_REAL} real states along the bottom. ${branches === 1 ? "One imagined rollout" : `${branches} imagined rollouts`} of ${len} ${len === 1 ? "step" : "steps"} grow upward and fade with each step.`,
  },
};

export function BranchedRollouts() {
  const [len, setLen] = useState(3);
  const [every, setEvery] = useState(true);
  const sweep = useSweep({ value: len, min: 1, max: MAX_LEN, step: 1, setValue: setLen });
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const k = compact ? 1.65 : 1;

  const branches = useMemo(() => Array.from({ length: N_REAL }, (_, b) => branch(b)), []);
  const active = every ? branches.map((_, b) => b) : [LONE];

  const nBranches = active.length;
  const batch = nBranches * len;
  const near = nBranches * Math.min(len, NEAR);
  const lineY = BASE_Y - len * STEP_Y;

  const verdict = !every
    ? len <= NEAR ? T.lone1 : T.lone2
    : len <= NEAR ? T.v1 : len <= 10 ? T.v2 : T.v3;

  const fade = still ? undefined : "opacity 220ms ease";

  return (
    <div>
      <div ref={ref} className="px-4 pt-5 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={T.aria(nBranches, len)}>
          {/* the ground: where evidence lives */}
          <line x1={X0 - 40} y1={BASE_Y} x2={W - X0 + 40} y2={BASE_Y} stroke="var(--rule-strong)" strokeWidth="1" />

          {/* how far out the batch reaches */}
          <line
            x1={X0 - 40} y1={lineY} x2={W - X0 + 40} y2={lineY}
            stroke="var(--imagine)" strokeWidth="1" strokeDasharray="2 5" opacity="0.6"
          />
          <text
            x={W - X0 + 40} y={lineY - 6} textAnchor="end" className="font-mono tnum" fontSize={10 * k}
            fill="var(--imagine)"
          >
            {T.stepN(len)}
          </text>

          {/* imagined rollouts: one segment per step, fading as they go */}
          {branches.map((pts, b) => {
            const on = active.includes(b);
            return (
              <g key={b}>
                {pts.slice(1).map((p, i) => {
                  const q = pts[i];
                  const shown = on && i < len;
                  return (
                    <line
                      key={i}
                      x1={q[0].toFixed(2)} y1={q[1].toFixed(2)} x2={p[0].toFixed(2)} y2={p[1].toFixed(2)}
                      stroke="var(--imagine)" strokeWidth="2.2" strokeLinecap="round"
                      opacity={shown ? trust(i) : 0}
                      style={{ transition: fade }}
                    />
                  );
                })}
                {pts.slice(1).map((p, i) => {
                  const shown = on && i < len;
                  return (
                    <circle
                      key={`d${i}`} cx={p[0].toFixed(2)} cy={p[1].toFixed(2)} r="2.4"
                      fill="var(--imagine)" opacity={shown ? trust(i) : 0}
                      style={{ transition: fade }}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* real states */}
          {branches.map((pts, b) => (
            <circle key={b} cx={pts[0][0]} cy={pts[0][1]} r="6" fill="var(--ink)" stroke="var(--paper-raised)" strokeWidth="2" />
          ))}

          <text x={X0 - 40} y={BASE_Y + 26} className="font-mono" fontSize={10 * k} letterSpacing="1" fill="var(--ink-muted)">
            {T.real}
          </text>
          {!compact && (
            <text x={X0 - 40} y={TOP_Y - 10} className="font-mono" fontSize={10} letterSpacing="1" fill="var(--imagine)">
              {T.imagined}
            </text>
          )}
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-full flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[18rem]">
          <span className="label whitespace-nowrap">{T.length}</span>
          <input
            type="range"
            min={1}
            max={MAX_LEN}
            value={len}
            onChange={(e) => {
              sweep.stop();
              setLen(Number(e.target.value));
            }}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-8 text-right !text-ink">{len}</span>
        </label>
        <PlayButton playing={sweep.playing} onClick={sweep.toggle} />

        <label className="flex cursor-pointer items-center gap-3">
          <span className="label">{every ? T.every : T.one}</span>
          <button
            type="button"
            role="switch"
            aria-checked={every}
            aria-label={T.every}
            onClick={() => {
              sweep.stop();
              setEvery((v) => !v);
            }}
            className={`relative h-6 w-11 shrink-0 border transition-colors ${
              every ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"
            }`}
          >
            <span
              className={`absolute top-[3px] h-4 w-4 transition-all ${
                every ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"
              }`}
            />
          </button>
        </label>

        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]">{verdict}</p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.batch, String(batch)],
          [T.near, String(near)],
          [T.furthest, T.steps(len)],
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
