"use client";

import { useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * The one-step job, done by hand.
 *
 * For five rounds the reader is the dynamics model: they are handed a state
 * and an action and have to say where the ball goes next. Check scores the
 * guess against the truth and the average miss builds up underneath.
 *
 * The point is not the miss, which is small however carelessly you drag. The
 * point is that every round starts from the truth, which is the condition the
 * headline one-step number is measured under and the condition a rollout
 * loses at step two. The rounds are fixed rather than generated so the
 * drawing and the readouts cannot disagree; distances are illustrative.
 */

/** position, speed and action per round, with the true next state alongside */
const ROUNDS = [
  { pos: 1.0, speed: 1.2, action: "coast", nextPos: 2.2, nextSpeed: 1.2 },
  { pos: 2.2, speed: 1.2, action: "push", nextPos: 4.0, nextSpeed: 1.8 },
  { pos: 4.0, speed: 1.8, action: "push", nextPos: 6.4, nextSpeed: 2.4 },
  { pos: 6.4, speed: 2.4, action: "brake", nextPos: 8.1, nextSpeed: 1.7 },
  { pos: 8.1, speed: 1.7, action: "brake", nextPos: 9.1, nextSpeed: 1.0 },
] as const;

const MAX_M = 12;

type Strings = {
  know: string;
  did: string;
  next: string;
  position: string;
  speed: string;
  unit: string;
  metres: (n: string) => string;
  perStep: (n: string) => string;
  action: (a: "push" | "coast" | "brake") => string;
  answer: string;
  check: string;
  nextStep: string;
  startOver: string;
  step: string;
  stepOf: (n: number) => string;
  missNow: string;
  average: string;
  none: string;
  v0: string;
  vClose: (x: string) => string;
  vFar: (x: string) => string;
  vDone: (x: string) => string;
  aria: (a: {
    pos: string;
    speed: string;
    action: string;
    answer: string;
    truth: string | null;
    miss: string | null;
    n: number;
  }) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    know: "what you know",
    did: "what you did",
    next: "what you know next",
    position: "position",
    speed: "speed",
    unit: "m",
    metres: (n) => `${n} m`,
    perStep: (n) => `${n} m/step`,
    action: (a) => ({ push: "push", coast: "coast", brake: "brake" })[a],
    answer: "your answer",
    check: "Check",
    nextStep: "Next step",
    startOver: "Start over",
    step: "step",
    stepOf: (n) => `${n} of 5`,
    missNow: "miss this step",
    average: "average miss",
    none: "-",
    v0: "You have the state and the action. Say where it goes next.",
    vClose: (x) => `Off by ${x} m. One step is an easy job when you are handed the true state.`,
    vFar: (x) => `Off by ${x} m. Still an easy job, and the average is what gets reported.`,
    vDone: (x) =>
      `Five steps, average miss ${x} m. That is the number a paper leads with, and every one of those steps started from the truth.`,
    aria: (a) =>
      `A track from 0 to 12 metres, step ${a.n} of 5. The ball is at ${a.pos} metres moving ${a.speed} metres per step, and the action is ${a.action}. Your answer sits at ${a.answer} metres. ` +
      (a.truth === null
        ? "The true next position is not shown yet."
        : `The true next position is ${a.truth} metres, so you are off by ${a.miss} metres.`),
  },
  zh: {
    know: "你知道的",
    did: "你做的",
    next: "你接下来知道的",
    position: "位置",
    speed: "速度",
    unit: "米",
    metres: (n) => `${n} 米`,
    perStep: (n) => `${n} 米/步`,
    action: (a) => ({ push: "推", coast: "滑行", brake: "刹车" })[a],
    answer: "你的答案",
    check: "检查",
    nextStep: "下一步",
    startOver: "重新开始",
    step: "步",
    stepOf: (n) => `第 ${n} 步，共 5 步`,
    missNow: "这一步的偏差",
    average: "平均偏差",
    none: "-",
    v0: "状态和动作都给你了。说出它接下来到哪里。",
    vClose: (x) => `偏了 ${x} 米。当真实状态被直接递到手上时，走一步是件容易的事。`,
    vFar: (x) => `偏了 ${x} 米。仍然是件容易的事，而被报告出来的正是这个平均值。`,
    vDone: (x) => `五步，平均偏差 ${x} 米。这就是论文开头写的那个数字，而这五步每一步都是从真值出发的。`,
    aria: (a) =>
      `一条 0 到 12 米的轨道，第 ${a.n} 步，共 5 步。球在 ${a.pos} 米处，速度为每步 ${a.speed} 米，动作是${a.action}。你的答案落在 ${a.answer} 米。` +
      (a.truth === null
        ? "真实的下一个位置还没有显示。"
        : `真实的下一个位置是 ${a.truth} 米，你偏了 ${a.miss} 米。`),
  },
};

function layout(compact: boolean) {
  const fs = compact ? 17 : 10.5;
  const W = compact ? 560 : 900;
  const pad = compact ? 16 : 26;
  const gap = compact ? 8 : 16;
  const blockH = Math.round(fs * 4.4 + 14);
  const blockW = compact ? W - 2 * pad : (W - 2 * pad - 2 * gap) / 3;
  const blocksY = 10;
  const blocksH = compact ? 3 * blockH + 2 * gap : blockH;
  const trackY = blocksY + blocksH + (compact ? 104 : 94);
  const H = Math.round(trackY + fs * 3.6 + 16);
  const r = compact ? 9 : 7;
  return {
    fs,
    W,
    H,
    pad,
    gap,
    blockW,
    blockH,
    blocksY,
    trackY,
    r,
    ballY: trackY - r - 2,
    arrowY: trackY - r * 2 - 16,
    bracketY: trackY - (compact ? 86 : 62),
    tickY: trackY + fs + 12,
    blockAt: (i: number) =>
      compact
        ? { x: pad, y: blocksY + i * (blockH + gap) }
        : { x: pad + i * (blockW + gap), y: blocksY },
    xAt: (m: number) => pad + (m / MAX_M) * (W - 2 * pad),
  };
}

export function OneStepByHand() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const { ref, compact } = useCompact(600);
  const L = layout(compact);

  const [round, setRound] = useState(0);
  const [checked, setChecked] = useState(false);
  const [misses, setMisses] = useState<number[]>([]);
  const [answer, setAnswer] = useState<number>(ROUNDS[0].pos);

  const r = ROUNDS[round];
  const last = round === ROUNDS.length - 1;
  const miss = Math.abs(answer - r.nextPos);
  const shownMiss = checked ? misses[misses.length - 1] : null;
  const average = misses.length ? misses.reduce((s, m) => s + m, 0) / misses.length : null;

  // One press does one thing: score the round, move to the next, or start again.
  const advance = () => {
    if (!checked) {
      setMisses((m) => [...m, miss]);
      setChecked(true);
      return;
    }
    if (last) {
      setRound(0);
      setChecked(false);
      setMisses([]);
      setAnswer(ROUNDS[0].pos);
      return;
    }
    const n = round + 1;
    setRound(n);
    setChecked(false);
    setAnswer(ROUNDS[n].pos);
  };

  const buttonLabel = !checked ? T.check : last ? T.startOver : T.nextStep;
  // Branch on the number the reader can see, so "off by 0.4 m" never reads as
  // the under-0.4 sentence because of a float a decimal place further down.
  const shownText = (shownMiss ?? 0).toFixed(1);
  const verdict = !checked
    ? T.v0
    : last
      ? T.vDone((average ?? 0).toFixed(1))
      : Number(shownText) < 0.4
        ? T.vClose(shownText)
        : T.vFar(shownText);

  const ticks = compact ? [0, 6, 12] : [0, 2, 4, 6, 8, 10, 12];
  const fill = checked;

  /** one of the three blocks above the track */
  const block = (
    i: number,
    title: string,
    sub: string,
    rows: [string, string][],
    tone: "actual" | "ink" | "empty",
  ) => {
    const { x, y } = L.blockAt(i);
    const stroke =
      tone === "actual" ? "var(--actual)" : tone === "ink" ? "var(--rule-strong)" : "var(--rule-strong)";
    return (
      <g key={sub}>
        <rect
          x={x}
          y={y}
          width={L.blockW}
          height={L.blockH}
          fill={tone === "actual" ? "var(--actual-soft)" : "none"}
          stroke={stroke}
          strokeWidth="1"
          strokeDasharray={tone === "empty" ? "4 4" : undefined}
          className="transition-[fill,stroke] duration-200 motion-reduce:transition-none"
        />
        <text x={x + 10} y={y + L.fs + 9} className="font-mono" fontSize={L.fs} letterSpacing="1" fill="var(--ink-muted)">
          {title}
        </text>
        <text
          x={x + L.blockW - 10}
          y={y + L.fs + 9}
          textAnchor="end"
          className="font-mono"
          fontSize={L.fs}
          fill="var(--ink-faint)"
        >
          {sub}
        </text>
        {rows.map(([name, value], j) => (
          <g key={name}>
            <text
              x={x + 10}
              y={y + L.fs * (2.6 + j * 1.4) + 10}
              className="font-mono"
              fontSize={L.fs}
              fill="var(--ink-faint)"
            >
              {name}
            </text>
            <text
              x={x + L.blockW - 10}
              y={y + L.fs * (2.6 + j * 1.4) + 10}
              textAnchor="end"
              className="font-mono tnum"
              fontSize={L.fs * 1.05}
              fill={tone === "ink" ? "var(--ink)" : "var(--actual)"}
            >
              {value}
            </text>
          </g>
        ))}
      </g>
    );
  };

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg
          viewBox={`0 0 ${L.W} ${L.H}`}
          className="block w-full"
          role="img"
          aria-label={T.aria({
            pos: r.pos.toFixed(1),
            speed: r.speed.toFixed(1),
            action: T.action(r.action),
            answer: answer.toFixed(1),
            truth: checked ? r.nextPos.toFixed(1) : null,
            miss: checked ? (shownMiss ?? 0).toFixed(1) : null,
            n: round + 1,
          })}
        >
          {block(0, T.know, "s", [
            [T.position, T.metres(r.pos.toFixed(1))],
            [T.speed, T.perStep(r.speed.toFixed(1))],
          ], "actual")}
          {block(1, T.did, "a", [["", T.action(r.action)]], "ink")}
          {block(
            2,
            T.next,
            "s'",
            fill
              ? [
                  [T.position, T.metres(r.nextPos.toFixed(1))],
                  [T.speed, T.perStep(r.nextSpeed.toFixed(1))],
                ]
              : [
                  [T.position, ""],
                  [T.speed, ""],
                ],
            fill ? "actual" : "empty",
          )}

          {/* the track */}
          <line
            x1={L.xAt(0)}
            y1={L.trackY}
            x2={L.xAt(MAX_M)}
            y2={L.trackY}
            stroke="var(--rule-strong)"
            strokeWidth="1"
          />
          {Array.from({ length: MAX_M + 1 }, (_, m) => (
            <line
              key={m}
              x1={L.xAt(m)}
              y1={L.trackY}
              x2={L.xAt(m)}
              y2={L.trackY + (ticks.includes(m) ? 7 : 4)}
              stroke="var(--rule)"
              strokeWidth="1"
            />
          ))}
          {ticks.map((m) => (
            <text
              key={m}
              x={L.xAt(m)}
              y={L.tickY}
              textAnchor="middle"
              className="font-mono tnum"
              fontSize={L.fs}
              fill="var(--ink-faint)"
            >
              {m}
            </text>
          ))}
          <text
            x={L.xAt(MAX_M) + 4}
            y={L.trackY - 6}
            className="font-mono"
            fontSize={L.fs}
            fill="var(--ink-faint)"
          >
            {T.unit}
          </text>

          <defs>
            <marker id="osbh-head" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--actual)" />
            </marker>
          </defs>

          {/* where the ball is now, and how fast it is going */}
          <line
            x1={L.xAt(r.pos)}
            y1={L.arrowY}
            x2={L.xAt(Math.min(MAX_M, r.pos + r.speed))}
            y2={L.arrowY}
            stroke="var(--actual)"
            strokeWidth="1.6"
            markerEnd="url(#osbh-head)"
          />
          <circle
            cx={L.xAt(r.pos)}
            cy={L.ballY}
            r={L.r}
            fill="var(--paper-raised)"
            stroke="var(--actual)"
            strokeWidth="2"
          />

          {/* the truth: always in the tree, so its arrival can be a transition */}
          <g
            opacity={checked ? 1 : 0}
            className="transition-opacity duration-200 motion-reduce:transition-none"
          >
            <line
              x1={L.xAt(r.nextPos)}
              y1={L.bracketY}
              x2={L.xAt(r.nextPos)}
              y2={L.ballY - L.r}
              stroke="var(--actual)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <line
              x1={L.xAt(r.nextPos)}
              y1={L.arrowY}
              x2={L.xAt(Math.min(MAX_M, r.nextPos + r.nextSpeed))}
              y2={L.arrowY}
              stroke="var(--actual)"
              strokeWidth="1.6"
              markerEnd="url(#osbh-head)"
            />
            <circle
              cx={checked ? L.xAt(r.nextPos) : L.xAt(r.pos)}
              cy={L.ballY}
              r={L.r}
              fill="var(--actual)"
              stroke="var(--paper-raised)"
              strokeWidth="1.5"
              className="transition-[cx] duration-200 motion-reduce:transition-none"
            />
            {/* the miss, bracketed */}
            <line
              x1={L.xAt(answer)}
              y1={L.bracketY}
              x2={L.xAt(r.nextPos)}
              y2={L.bracketY}
              stroke="var(--imagine)"
              strokeWidth="1.2"
            />
            <line
              x1={L.xAt(answer)}
              y1={L.bracketY}
              x2={L.xAt(answer)}
              y2={L.bracketY + 6}
              stroke="var(--imagine)"
              strokeWidth="1.2"
            />
            <line
              x1={L.xAt(r.nextPos)}
              y1={L.bracketY}
              x2={L.xAt(r.nextPos)}
              y2={L.bracketY + 6}
              stroke="var(--imagine)"
              strokeWidth="1.2"
            />
            <text
              x={(L.xAt(answer) + L.xAt(r.nextPos)) / 2}
              y={L.bracketY - 7}
              textAnchor="middle"
              className="font-mono tnum"
              fontSize={L.fs}
              fill="var(--imagine)"
            >
              {T.metres(miss.toFixed(1))}
            </text>
          </g>

          {/* the reader's answer */}
          <line
            x1={L.xAt(answer)}
            y1={L.bracketY}
            x2={L.xAt(answer)}
            y2={L.ballY - L.r}
            stroke="var(--imagine)"
            strokeWidth="1"
          />
          <circle cx={L.xAt(answer)} cy={L.ballY} r={L.r - 1} fill="var(--imagine)" />
        </svg>
      </div>

      <div
        data-print-hide
        className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-rule px-5 py-4 md:px-8"
      >
        <label className="flex min-w-[min(18rem,100%)] flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          <span className="label whitespace-nowrap">{T.answer}</span>
          <input
            type="range"
            min={0}
            max={MAX_M}
            step={0.1}
            value={answer}
            onChange={(e) => setAnswer(Number(e.target.value))}
            aria-valuetext={T.metres(answer.toFixed(1))}
            className="h-1 min-w-[8rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-16 whitespace-nowrap text-right !normal-case !text-ink">
            {T.metres(answer.toFixed(1))}
          </span>
        </label>
        <button
          type="button"
          onClick={advance}
          className={`label h-10 border px-4 transition-colors ${
            checked
              ? "border-rule-strong bg-paper !text-ink hover:border-ink"
              : "border-imagine bg-imagine !text-paper"
          }`}
        >
          {buttonLabel}
        </button>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {([
          [T.step, T.stepOf(round + 1), true],
          [T.missNow, shownMiss === null ? T.none : T.metres(shownMiss.toFixed(1)), shownMiss !== null],
          [T.average, average === null ? T.none : T.metres(average.toFixed(1)), average !== null],
        ] as [string, string, boolean][]).map(([label, value, strong]) => (
          <div key={label} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{label}</p>
            <p className={`tnum mt-1 text-[0.98rem] ${strong ? "text-ink" : "text-ink-faint"}`}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
