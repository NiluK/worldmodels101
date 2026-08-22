"use client";

import { useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * Where is the ball now?
 *
 * A ball rolls in from the left at a known speed and passes behind a wall. The
 * figure draws two answers to "where is it now": one confident coordinate, and
 * a spread that widens the longer the ball is hidden. Behind the wall the ball
 * actually stops against a kerb for a while, so the confident coordinate comes
 * out the far side before the ball does. Beliefs are drawn over the wall (the
 * wall hides the ball, not the model's guesses). Everything here is
 * illustrative.
 */

const W = 900;
const H = 230;
const GROUND = 186;
const R = 16;
const X0 = 56;
const V = 8;
const WALL_L = 360;
const WALL_R = 600;
const KERB = 464;
const T_KERB = (KERB - X0) / V; // 51
const STOP = 14;
const T_IN = (WALL_L - X0) / V; // 38
const T_MAX = 100;

const TEXT = {
  en: {
    aria: (t: number, where: string) => `Side view of a ball rolling left to right past a tall wall. Time ${t} of ${T_MAX}. ${where}`,
    ariaSeen: "The ball is in view and the belief sits on it.",
    ariaHidden: (n: number) => `The ball has been behind the wall for ${n} steps.`,
    ariaSpread: (w: string) => `The spread is ${w} ball widths wide.`,
    ariaPoint: "Only a single point is drawn.",
    dotLabel: "one confident coordinate",
    spreadLabel: "where it might be",
    time: "time",
    mode: "the model carries",
    detOnly: "deterministic part only",
    detStoch: "deterministic plus stochastic",
    hidden: "time hidden",
    steps: (n: number) => `${n} steps`,
    width: "width of the spread",
    widths: (w: string) => `${w} ball widths`,
    noSpread: "no spread",
    collapsed: "collapsed to a point",
    dot: "the single dot",
    onBall: "on the ball",
    inside: "inside the spread",
    outside: "outside the spread",
    vBefore: "In view. While you can see the ball, one point is the right answer.",
    vSpread: "Behind the wall the honest answer is a spread, not a point.",
    vSpreadOut: "By the known speed it should be out by now. It is not, so the spread stays behind the wall and the single dot is wrong.",
    vPoint: "Behind the wall the honest answer is a spread, not a point. This model can only give a point.",
    vPointOut: "The point has come out from behind the wall. The ball has not.",
    vBack: "Back in view: the spread collapses to what you can see.",
  },
  zh: {
    aria: (t: number, where: string) => `侧视图：一只球从左向右滚过一堵高墙。时间 ${t}，共 ${T_MAX}。${where}`,
    ariaSeen: "球在视野内，信念落在球上。",
    ariaHidden: (n: number) => `球已在墙后 ${n} 步。`,
    ariaSpread: (w: string) => `分布宽度为 ${w} 个球宽。`,
    ariaPoint: "只画了一个点。",
    dotLabel: "一个自信的坐标",
    spreadLabel: "它可能在哪里",
    time: "时间",
    mode: "模型携带",
    detOnly: "只有确定性部分",
    detStoch: "确定性加随机性",
    hidden: "隐藏时长",
    steps: (n: number) => `${n} 步`,
    width: "分布的宽度",
    widths: (w: string) => `${w} 个球宽`,
    noSpread: "没有分布",
    collapsed: "收缩成一个点",
    dot: "那个单点",
    onBall: "落在球上",
    inside: "在分布之内",
    outside: "在分布之外",
    vBefore: "在视野内。看得见球的时候，一个点就是正确的答案。",
    vSpread: "在墙后，诚实的答案是一片分布，而不是一个点。",
    vSpreadOut: "按已知速度，它现在应该已经出来了。它没有，所以分布留在墙后，而那个单点是错的。",
    vPoint: "在墙后，诚实的答案是一片分布，而不是一个点。这个模型只能给出一个点。",
    vPointOut: "那个点已经从墙后出来了。球没有。",
    vBack: "回到视野：分布收缩成你看得见的东西。",
  },
} as const;

/** the ball really does stop against a kerb behind the wall for a while */
function truthX(t: number) {
  if (t <= T_KERB) return X0 + V * t;
  if (t <= T_KERB + STOP) return KERB;
  return KERB + V * (t - T_KERB - STOP);
}

/** fixed jitter so the cloud of guesses does not dance as the slider moves */
const SAMPLES = Array.from({ length: 26 }, (_, i) => {
  const u = (Math.sin(i * 12.9898 + 7.2) * 43758.5453) % 1;
  const v = (Math.sin(i * 78.233 + 3.1) * 24634.6345) % 1;
  return [Math.abs(u), Math.abs(v)] as const;
});

export function BallBehindWall() {
  const locale = useLocale();
  const s = TEXT[locale as keyof typeof TEXT] ?? TEXT.en;
  const { ref, compact } = useCompact(560);
  const k = compact ? 1.65 : 1;
  const [t, setT] = useState(30);
  const [stochastic, setStochastic] = useState(true);

  const ball = truthX(t);
  const hidden = ball >= WALL_L && ball <= WALL_R;
  const hiddenFor = hidden ? Math.max(0, t - T_IN) : 0;
  const nominal = X0 + V * t; // what the known speed says

  // While hidden the guess widens with time, but a ball seen nowhere else
  // must still be behind the wall, so the spread is clipped to it.
  const halfW = 16 + 7 * hiddenFor;
  const lo = hidden ? Math.max(WALL_L, nominal - halfW) : ball;
  const hi = hidden ? Math.min(WALL_R, nominal + halfW) : ball;
  const dotX = hidden ? nominal : ball;
  const widthBalls = ((hi - lo) / (2 * R)).toFixed(1);
  const dotInside = dotX >= lo && dotX <= hi;
  const y = GROUND - R;

  const verdict = !hidden
    ? t < T_IN ? s.vBefore : s.vBack
    : stochastic
      ? dotInside ? s.vSpread : s.vSpreadOut
      : nominal > WALL_R ? s.vPointOut : s.vPoint;

  const where = hidden
    ? `${s.ariaHidden(hiddenFor)} ${stochastic ? s.ariaSpread(widthBalls) : s.ariaPoint}`
    : s.ariaSeen;

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={s.aria(t, where)}>
          <line x1="0" y1={GROUND} x2={W} y2={GROUND} stroke="var(--rule-strong)" strokeWidth="1" />
          {/* the ball, drawn first so the wall can hide it */}
          <circle cx={ball} cy={y} r={R} fill="var(--ball)" stroke="var(--ink)" strokeWidth="1.5" />
          <rect x={WALL_L} y="26" width={WALL_R - WALL_L} height={GROUND - 26} fill="var(--ink)" />

          {/* beliefs sit over the wall: it hides the ball, not the guess */}
          {stochastic && hidden && (
            <g>
              <rect x={lo} y={y - R - 5} width={hi - lo} height={2 * R + 10} fill="var(--imagine-soft)" opacity="0.85" />
              {SAMPLES.map(([u, v], i) => (
                <circle key={i} cx={lo + u * (hi - lo)} cy={y - R + 2 + v * (2 * R - 4)} r="2.6" fill="var(--imagine)" opacity="0.55" />
              ))}
              {!compact && (
                <text x={(lo + hi) / 2} y={y - R - 14} textAnchor="middle" className="font-mono" fontSize={10 * k} letterSpacing="1" fill="var(--imagine)">
                  {s.spreadLabel}
                </text>
              )}
            </g>
          )}
          <circle cx={dotX} cy={y} r="6" fill="var(--ink-faint)" stroke="var(--paper)" strokeWidth="2" />
          {!compact && (
            <text x={dotX} y={GROUND + 18} textAnchor="middle" className="font-mono" fontSize={10 * k} letterSpacing="1" fill="var(--ink-faint)">
              {s.dotLabel}
            </text>
          )}
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-[16rem] flex-1 items-center gap-3">
          <span className="label whitespace-nowrap">{s.time}</span>
          <input
            type="range"
            min={0}
            max={T_MAX}
            value={t}
            onChange={(e) => setT(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-10 text-right !text-ink">{t}</span>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <span className="label mr-1">{s.mode}</span>
          {([false, true] as const).map((on) => (
            <button
              key={String(on)}
              type="button"
              aria-pressed={stochastic === on}
              onClick={() => setStochastic(on)}
              className={`label border px-3 py-1.5 transition-colors ${
                stochastic === on ? "border-imagine bg-imagine !text-paper" : "border-rule-strong bg-paper !text-ink hover:border-ink"
              }`}
            >
              {on ? s.detStoch : s.detOnly}
            </button>
          ))}
        </div>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]">{verdict}</p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [s.hidden, s.steps(hiddenFor)],
          [s.width, !stochastic ? s.noSpread : hidden ? s.widths(widthBalls) : s.collapsed],
          [s.dot, !hidden ? s.onBall : !stochastic ? s.noSpread : dotInside ? s.inside : s.outside],
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
