"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * Three what ifs, one of which gets answered by the world.
 *
 * The model hands over all three predictions before anything is pressed, which
 * is the whole point of asking it. Taking one replaces that branch with what
 * actually happened, off by whatever the model never had: a patch of oil, a
 * gust. The other two keep their vermilion answers and never get checked, and
 * the only way on is a different situation, not a retry of this one.
 *
 * Every number here is invented.
 */

type Situation = {
  /** metres to the line, and km/h */
  dist: number;
  speed: number;
  /** predicted metres past the line, one per action */
  pred: [number, number, number];
  /** how far the world came in past the prediction, per action */
  delta: [number, number, number];
  /** index into the reason list */
  reason: number;
};

const SITUATIONS: Situation[] = [
  { dist: 42, speed: 50, pred: [4.2, 12.6, 19.8], delta: [1.3, 0.9, 2.1], reason: 0 },
  { dist: 28, speed: 38, pred: [2.1, 8.4, 13.9], delta: [0.6, 1.4, 2.4], reason: 1 },
  { dist: 55, speed: 62, pred: [6.8, 17.2, 25.1], delta: [2.2, 1.1, 3.0], reason: 2 },
  { dist: 35, speed: 45, pred: [3.4, 10.5, 16.2], delta: [0.9, 2.6, 1.5], reason: 3 },
];

type Strings = {
  actions: [string, string, string];
  take: (action: string) => string;
  start: string;
  toLine: (m: number) => string;
  speed: (v: number) => string;
  past: (m: string) => string;
  never: string;
  next: string;
  reasons: [string, string, string, string];
  reads: [string, string, string, string];
  blank: string;
  metres: (m: string) => string;
  vBefore: string;
  vTaken: (x: string, reason: string) => string;
  vGone: string;
  join: string;
  aria: (dist: number, speed: number, verdict: string) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    actions: ["brake now", "hold this speed", "press on"],
    take: (a) => `take ${a}`,
    start: "where you are",
    toLine: (m) => `${m} m to the line`,
    speed: (v) => `${v} km/h`,
    past: (m) => `${m} m past the line`,
    never: "nobody will find out",
    next: "Next situation",
    reasons: ["a patch of oil", "a gust", "a wet line", "someone braking ahead"],
    reads: ["checked", "never checked", "the one you took was off by", "situations seen"],
    blank: "not yet",
    metres: (m) => `${m} m`,
    vBefore: "Three answers, none of them checked. The model will give you all three for nothing.",
    vTaken: (x, reason) =>
      `You took one. It came in ${x} m off, because of ${reason}. The other two are the model's word and nothing else.`,
    vGone: "That situation is gone. You never get to run the other two.",
    join: " ",
    aria: (dist, speed, verdict) =>
      `A car ${dist} metres from the line at ${speed} km per hour, and three actions the model has already answered. Illustrative. ${verdict}`,
  },
  zh: {
    actions: ["现在刹车", "保持这个速度", "继续往前开"],
    take: (a) => `执行「${a}」`,
    start: "你现在在哪里",
    toLine: (m) => `离停车线 ${m} 米`,
    speed: (v) => `时速 ${v} 公里`,
    past: (m) => `越过停车线 ${m} 米`,
    never: "没有人会知道",
    next: "换一个情形",
    reasons: ["一摊油", "一阵风", "一道湿滑的白线", "前面有人刹车"],
    reads: ["已经验证", "永远不会验证", "你执行的那个偏了", "见过的情形"],
    blank: "还没有",
    metres: (m) => `${m} 米`,
    vBefore: "三个答案，一个都没有被验证。模型白送你全部三个。",
    vTaken: (x, reason) => `你执行了其中一个。结果偏了 ${x} 米，原因是${reason}。另外两个只是模型的说法，仅此而已。`,
    vGone: "那个情形已经过去了。另外两个你永远没有机会跑。",
    join: "",
    aria: (dist, speed, verdict) =>
      `一辆车离停车线 ${dist} 米，时速 ${speed} 公里，三个动作模型都已经给了答案。数字仅作示意。${verdict}`,
  },
};

export function OnlyOneGetsTaken() {
  const still = useReducedMotion();
  const locale = useLocale();
  const s = pickText(TEXT, locale);
  const { ref, compact } = useCompact(560);

  const [seen, setSeen] = useState(1);
  const [taken, setTaken] = useState<number | null>(null);
  const [advanced, setAdvanced] = useState(false);

  const sit = SITUATIONS[(seen - 1) % SITUATIONS.length];
  const reason = s.reasons[sit.reason];
  const offBy = taken === null ? null : sit.delta[taken];

  const verdict =
    taken !== null
      ? s.vTaken(sit.delta[taken].toFixed(1), reason)
      : advanced
        ? [s.vGone, s.vBefore].join(s.join)
        : s.vBefore;

  const fs = compact ? 17 : 11;
  const W = compact ? 560 : 900;
  const H = 300;

  const startX = compact ? 26 : 110;
  const startY = compact ? 42 : 150;
  const endX = compact ? 130 : 620;
  const ys: [number, number, number] = compact ? [110, 178, 246] : [64, 150, 236];

  const branch = (j: number) => {
    const y = ys[j];
    const state = taken === null ? "open" : taken === j ? "took" : "dropped";
    const colour =
      state === "took" ? "var(--actual)" : state === "dropped" ? "var(--ink-faint)" : "var(--imagine)";
    const value = state === "took" ? sit.pred[j] + sit.delta[j] : sit.pred[j];
    const path = compact
      ? `M ${startX + 8} ${y} L ${endX} ${y}`
      : `M ${startX + 12} ${startY} C ${startX + 190} ${startY}, ${endX - 250} ${y}, ${endX} ${y}`;
    return (
      <g key={j} opacity={state === "dropped" ? 0.55 : 1}>
        <path d={path} fill="none" stroke={colour} strokeWidth={state === "took" ? 2.6 : 1.8}
          strokeDasharray={state === "took" ? undefined : "5 5"} strokeLinecap="round" />
        <circle cx={endX} cy={y} r={state === "took" ? 6 : 4.5} fill={colour}
          stroke="var(--paper)" strokeWidth="1.5" />
        <text x={endX + 14} y={y - fs * 0.35} className="font-mono" fontSize={fs} letterSpacing="1"
          fill={state === "dropped" ? "var(--ink-faint)" : "var(--ink)"}>
          {s.actions[j]}
        </text>
        <text x={endX + 14} y={y + fs * 0.95} className="font-mono tnum" fontSize={fs} fill={colour}>
          {s.past(value.toFixed(1))}
        </text>
        {state === "took" && (
          <text x={endX + 14} y={y + fs * 2.25} className="font-mono" fontSize={fs} fill="var(--ink-muted)">
            {reason}
          </text>
        )}
        {state === "dropped" && (
          <text x={endX + 14} y={y + fs * 2.25} className="font-mono" fontSize={fs} fill="var(--ink-faint)">
            {s.never}
          </text>
        )}
      </g>
    );
  };

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={s.aria(sit.dist, sit.speed, verdict)}>
          {/* the one state the world handed over */}
          <circle cx={startX} cy={startY} r="7" fill="var(--actual)" stroke="var(--paper)" strokeWidth="2" />
          <text x={startX + (compact ? 16 : -8)} y={startY - fs * 1.4} className="font-mono"
            fontSize={fs} letterSpacing="1" textAnchor={compact ? "start" : "middle"} fill="var(--ink-faint)">
            {s.start}
          </text>
          <text x={startX + (compact ? 16 : -8)} y={startY + fs * 1.8} className="font-mono tnum"
            fontSize={fs} textAnchor={compact ? "start" : "middle"} fill="var(--ink)">
            {s.toLine(sit.dist)}
          </text>
          <text x={startX + (compact ? 16 : -8)} y={startY + fs * 3.1} className="font-mono tnum"
            fontSize={fs} textAnchor={compact ? "start" : "middle"} fill="var(--ink)">
            {s.speed(sit.speed)}
          </text>
          {[0, 1, 2].map(branch)}
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-col gap-4 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex flex-wrap gap-2">
          {taken === null
            ? s.actions.map((a, j) => (
                <button
                  key={a}
                  type="button"
                  aria-label={s.take(a)}
                  onClick={() => {
                    setTaken(j);
                    setAdvanced(false);
                  }}
                  className="border border-rule-strong bg-paper px-3 py-1.5 font-mono text-[0.7rem] text-ink transition-colors hover:border-ink"
                >
                  {a}
                </button>
              ))
            : (
                <button
                  type="button"
                  onClick={() => {
                    setSeen((v) => v + 1);
                    setTaken(null);
                    setAdvanced(true);
                  }}
                  className="border border-imagine bg-imagine px-3 py-1.5 font-mono text-[0.7rem] text-paper transition-colors"
                >
                  {s.next}
                </button>
              )}
        </div>

        <motion.p
          key={verdict}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: still ? 0 : 0.2 }}
          aria-live="polite"
          className="label max-w-[62ch] !normal-case !tracking-normal !text-[0.8rem]"
        >
          {verdict}
        </motion.p>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-rule bg-rule sm:grid-cols-4">
        {[
          [s.reads[0], taken === null ? "0" : "1"],
          [s.reads[1], taken === null ? "3" : "2"],
          [s.reads[2], offBy === null ? s.blank : s.metres(offBy.toFixed(1))],
          [s.reads[3], String(seen)],
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
