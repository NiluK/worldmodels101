"use client";

import { motion, useReducedMotion, type Transition } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * Professor Forcing, drawn as two trails of hidden states and a judge.
 *
 * The teacher-forced trail never moves. The free-running trail starts out
 * drifting away from it, the way a free run does after the second step. Each
 * round the judge looks, then the free trail is pulled a fixed fraction of the
 * way toward the forced one. Nothing touches the inputs; the only thing being
 * trained is what the hidden states look like. All numbers are illustrative.
 */

type Text = {
  forced: string; free: string; judge: string; guessing: string; mostly: string; certain: string;
  inputs: string; train: string; reset: string; rRounds: string; rGap: string;
  v0: string; v1: string; v2: string; aria: string;
};

const TEXT: LocaleText<Text> = {
  en: {
    forced: "teacher-forced run",
    free: "free run",
    judge: "judge",
    guessing: "guessing",
    mostly: "mostly",
    certain: "certain",
    inputs: "inputs: untouched",
    train: "Train a round",
    reset: "Reset",
    rRounds: "rounds trained",
    rGap: "gap between the trails",
    v0: "The judge can tell the free run from the forced run at a glance.",
    v1: "The free trail is being pulled toward the forced one. The inputs have not changed.",
    v2: "The judge cannot tell the two runs apart, so the model behaves the same either way. That is the training objective doing the work.",
    aria: "Two trails of twelve hidden states, one teacher-forced and one free. After {n} rounds the gap between them is {g} and the judge reads {w}.",
  },
  zh: {
    forced: "教师强制的那一趟",
    free: "自由运行的那一趟",
    judge: "裁判",
    guessing: "在猜",
    mostly: "大致分得清",
    certain: "确定",
    inputs: "输入：没有动过",
    train: "训练一轮",
    reset: "重置",
    rRounds: "已训练的轮数",
    rGap: "两条轨迹之间的差距",
    v0: "裁判一眼就能把自由运行和教师强制的那一趟分开。",
    v1: "自由运行的轨迹正被拉向教师强制的那条。输入没有变。",
    v2: "裁判已经分不出这两趟，于是模型在两种情况下表现一样。这是训练目标在起作用。",
    aria: "两条各十二个隐藏状态的轨迹，一条是教师强制，一条是自由运行。训练 {n} 轮后，两条轨迹的差距是 {g}，裁判的读数是「{w}」。",
  },
};

const N = 12;
const MAX_ROUNDS = 8;
/** each round pulls the free trail this fraction of the way to the forced one */
const PULL = 0.35;
/** the forced trail: a gentle wave, in viewBox units */
const FORCED = Array.from({ length: N }, (_, i) => 72 + 16 * Math.sin(i * 0.7));
/** how far the free trail starts out from the forced one; grows along the trail */
const DRIFT0 = Array.from({ length: N }, (_, i) => 2 + 0.85 * i * i);
const MEAN_DRIFT0 = DRIFT0.reduce((a, b) => a + b, 0) / N;

const shrink = (rounds: number) => Math.pow(1 - PULL, rounds);
/** gap in illustrative units: the mean distance between paired dots, scaled */
const gapOf = (rounds: number) => (MEAN_DRIFT0 * shrink(rounds)) / 10;
/** how often the judge can tell the trails apart, 50 (guessing) to 100 (certain) */
const sepOf = (gap: number) => 50 + 50 * Math.min(1, gap / 2.2);

const W = 720;
const TRAIL_TOP = 18;
const TRAIL_H = 222;

export function ProfessorForcing() {
  const still = !!useReducedMotion();
  const { ref, compact } = useCompact(560);
  const k = compact ? 1.65 : 1;
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const [rounds, setRounds] = useState(0);
  const [judging, setJudging] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const gap = gapOf(rounds);
  const sep = sepOf(gap);
  const word = sep >= 88 ? T.certain : sep >= 68 ? T.mostly : T.guessing;
  const verdict = rounds === 0 ? T.v0 : rounds < 4 ? T.v1 : T.v2;
  const done = rounds >= MAX_ROUNDS;

  const train = () => {
    if (done) return;
    setRounds((r) => Math.min(MAX_ROUNDS, r + 1));
    if (still) return;
    setJudging(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setJudging(false), 300);
  };
  const reset = () => {
    setRounds(0);
    setJudging(false);
    if (timer.current) window.clearTimeout(timer.current);
  };

  // the judge looks first, then the trail moves, dot by dot from the left
  const move: Transition = still ? { duration: 0 } : { duration: 0.3, delay: 0.3, ease: [0.16, 1, 0.3, 1] };
  const moveAt = (i: number): Transition => (still ? move : { ...move, delay: 0.3 + i * 0.025 });

  // trails run the full width when the judge box drops underneath
  const X0 = 28;
  const X1 = compact ? W - 28 : 500;
  const PITCH = (X1 - X0) / (N - 1);
  const xOf = (i: number) => X0 + i * PITCH;
  const freeY = (i: number) => FORCED[i] + DRIFT0[i] * shrink(rounds);
  const R = 4.5 * k;

  const JB = compact
    ? { x: 20, y: TRAIL_TOP + TRAIL_H + 16, w: W - 40, h: 132 }
    : { x: 548, y: 44, w: 152, h: 150 };
  const H = compact ? JB.y + JB.h + 12 : TRAIL_TOP + TRAIL_H;
  const barX = JB.x + 14;
  const barW = JB.w - 28;
  const barY = JB.y + (compact ? 86 : 96);

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={T.aria.replace("{n}", String(rounds)).replace("{g}", gap.toFixed(1)).replace("{w}", word)}>

          {/* legend */}
          <circle cx={X0 + 4} cy={TRAIL_TOP} r={3.2 * k} fill="var(--actual)" />
          <text x={X0 + 14 * k} y={TRAIL_TOP + 3.5 * k} className="font-mono" fontSize={10 * k} letterSpacing="1" fill="var(--actual)">
            {T.forced}
          </text>
          <circle cx={X0 + 4 + (compact ? 250 : 170)} cy={TRAIL_TOP} r={3.2 * k} fill="var(--imagine)" />
          <text x={X0 + 14 * k + (compact ? 250 : 170)} y={TRAIL_TOP + 3.5 * k} className="font-mono" fontSize={10 * k} letterSpacing="1" fill="var(--imagine)">
            {T.free}
          </text>

          {/* the gap at each step */}
          {FORCED.map((fy, i) => (
            <motion.line key={`g${i}`}
              x1={xOf(i)} y1={fy} x2={xOf(i)} y2={freeY(i)}
              initial={false} animate={{ y2: freeY(i) }} transition={moveAt(i)}
              stroke="var(--ink-faint)" strokeWidth="1" strokeDasharray="2 3" />
          ))}

          {/* the teacher-forced trail: never moves */}
          {FORCED.slice(1).map((fy, j) => (
            <line key={`fs${j}`} x1={xOf(j)} y1={FORCED[j]} x2={xOf(j + 1)} y2={fy}
              stroke="var(--actual)" strokeWidth="1.4" />
          ))}
          {FORCED.map((fy, i) => (
            <circle key={`fd${i}`} cx={xOf(i)} cy={fy} r={R} fill="var(--actual)" stroke="var(--paper)" strokeWidth="1.5" />
          ))}

          {/* the free trail: pulled over, dot by dot */}
          {FORCED.slice(1).map((_, j) => (
            <motion.line key={`ls${j}`} x1={xOf(j)} x2={xOf(j + 1)} y1={freeY(j)} y2={freeY(j + 1)}
              initial={false} animate={{ y1: freeY(j), y2: freeY(j + 1) }} transition={moveAt(j)}
              stroke="var(--imagine)" strokeWidth="1.4" />
          ))}
          {FORCED.map((_, i) => (
            <motion.circle key={`ld${i}`} cx={xOf(i)} cy={freeY(i)} r={R}
              initial={false} animate={{ cy: freeY(i) }} transition={moveAt(i)}
              fill="var(--imagine)" stroke="var(--paper)" strokeWidth="1.5" />
          ))}

          <text x={X0} y={TRAIL_TOP + TRAIL_H - 6} className="font-mono" fontSize={10 * k} letterSpacing="1" fill="var(--ink-muted)">
            {T.inputs}
          </text>

          {/* the judge */}
          <rect x={JB.x} y={JB.y} width={JB.w} height={JB.h}
            fill={judging ? "var(--imagine-soft)" : "var(--paper)"}
            stroke={judging ? "var(--imagine)" : "var(--ink)"} strokeWidth={judging ? 1.8 : 1.2}
            style={{ transition: still ? undefined : "fill 0.15s, stroke 0.15s" }} />
          <text x={JB.x + 14} y={JB.y + 22 * k} className="font-mono" fontSize={10 * k} letterSpacing="1" fill="var(--ink-muted)">
            {T.judge}
          </text>
          <text x={JB.x + 14} y={JB.y + (compact ? 68 : 66)} fontFamily="var(--font-body)" fontSize={compact ? 26 : 20} fill="var(--ink)">
            {word}
          </text>
          <rect x={barX} y={barY} width={barW} height={6} fill="var(--rule)" />
          <motion.rect x={barX} y={barY} height={6} width={(barW * (sep - 50)) / 50} fill="var(--imagine)"
            initial={false} animate={{ width: (barW * (sep - 50)) / 50 }} transition={move} />
          <text x={barX} y={barY + 20 * k} className="font-mono" fontSize={9 * k} letterSpacing="1" fill="var(--ink-muted)">
            {T.guessing}
          </text>
          <text x={barX + barW} y={barY + 20 * k} textAnchor="end" className="font-mono" fontSize={9 * k} letterSpacing="1" fill="var(--ink-muted)">
            {T.certain}
          </text>
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <button
          type="button"
          onClick={train}
          disabled={done}
          className="label h-10 border border-imagine bg-imagine px-4 !text-paper transition-colors hover:border-ink disabled:cursor-default disabled:opacity-60"
        >
          {T.train}
        </button>
        <button
          type="button"
          onClick={reset}
          className="label h-10 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink"
        >
          {T.reset}
        </button>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        {[
          [T.rRounds, String(rounds)],
          [T.rGap, gap.toFixed(1)],
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
