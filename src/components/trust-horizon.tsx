"use client";

import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { useSweep } from "./use-sweep";
import { PlayButton } from "./play-button";

/**
 * When to trust your model, made playable.
 *
 * A fixed wrong model and a replanning interval, nothing more. The planner
 * picks one steering command, trusts the model for k steps, then looks at the
 * real state and plans again. The slate line is what really happened; each
 * dashed vermilion stretch is what the model thought would happen before the
 * next look. Short k and the dashes never get far from the line. Long k and
 * the plan is for a world that is not there.
 *
 * Dynamics, error and distances are illustrative.
 */

const W = 900;
const H = 310;
const STEP = 20;
const MAX_STEPS = 40;
const REACH = 16;
const START = { x: 70, y: 215, h: 0 };
const GOAL = { x: 830, y: 95 };
/** the world turns a little on its own, and drifts down the field */
const TURN_TRUE = 0.05;
/** the model knows about the turn, but thinks it is smaller than it is */
const TURN_MODEL = 0.035;
const DRIFT_Y = 1.5;
/** steering commands the planner can choose from */
const COMMANDS = Array.from({ length: 61 }, (_, i) => (i - 30) * 0.01);

type Pt = { x: number; y: number; h: number };
type Segment = { start: number; pts: Pt[] };

const step = (s: Pt, u: number, turn: number): Pt => {
  const h = s.h + u + turn;
  return { x: s.x + STEP * Math.cos(h), y: s.y + STEP * Math.sin(h) + DRIFT_Y, h };
};
const toGoal = (p: Pt) => Math.hypot(p.x - GOAL.x, p.y - GOAL.y);

function simulate(k: number) {
  const real: Pt[] = [START];
  const segments: Segment[] = [];
  let s: Pt = START;
  let t = 0;
  let reached = false;
  while (t < MAX_STEPS && !reached) {
    const n = Math.min(k, MAX_STEPS - t);
    // the command whose imagined path comes closest to the goal
    let best = 0;
    let bestD = Infinity;
    for (const u of COMMANDS) {
      let m = s;
      let d = Infinity;
      for (let i = 0; i < n; i++) {
        m = step(m, u, TURN_MODEL);
        d = Math.min(d, toGoal(m));
      }
      if (d < bestD) {
        bestD = d;
        best = u;
      }
    }
    const imagined: Pt[] = [];
    let m = s;
    for (let i = 0; i < n; i++) {
      m = step(m, best, TURN_MODEL);
      imagined.push(m);
    }
    segments.push({ start: t, pts: imagined });
    // commit to it, in the real world
    for (let i = 0; i < n; i++) {
      s = step(s, best, TURN_TRUE);
      real.push(s);
      t++;
      if (toGoal(s) < REACH) {
        reached = true;
        break;
      }
    }
  }
  return { real, segments, steps: t, reached, dist: toGoal(s) };
}

const path = (pts: { x: number; y: number }[]) =>
  pts.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

const TEXT = {
  en: {
    trusted: "Steps trusted before replanning",
    run: "Run",
    stepsTrusted: "Steps trusted",
    replans: "Replans",
    distance: "Distance from goal at the end",
    reached: "reached",
    units: (n: string) => `${n} steps`,
    real: "real",
    imagined: "imagined",
    start: "start",
    goal: "goal",
    v1: "Trusted for a few steps and replanned from a real state, the errors never get the chance to pile up.",
    v2: "The model is trusted for longer, and the gap between imagined and real opens before each replan.",
    v3: "Trusted this long, the imagined path has left the real one, and the plan is for a world that is not there.",
    hit: "It reached the goal.",
    miss: "It missed.",
    aria: (k: number, r: number, end: string) =>
      `A top-down field with a start on the left and a goal on the right. The solid slate path is what really happened. The dashed vermilion stretches are what the model imagined over each run of ${k} trusted steps, each starting again from the real state. ${r} replans. ${end}`,
    ariaHit: "The real path reached the goal.",
    ariaMiss: (d: string) => `The real path ended ${d} steps from the goal.`,
    ariaRunning: "Running.",
  },
  zh: {
    trusted: "重新规划前信任的步数",
    run: "运行",
    stepsTrusted: "信任步数",
    replans: "重新规划次数",
    distance: "结束时与目标的距离",
    reached: "已到达",
    units: (n: string) => `${n} 步`,
    real: "真实",
    imagined: "想象",
    start: "起点",
    goal: "目标",
    v1: "只信任几步，并从真实状态重新规划，误差没有机会累积。",
    v2: "模型被信任得更久，每次重新规划之前，想象与真实之间的差距都会张开。",
    v3: "信任这么久，想象的路径已经离开了真实的路径，这个计划是为一个并不存在的世界做的。",
    hit: "它到达了目标。",
    miss: "它错过了。",
    aria: (k: number, r: number, end: string) =>
      `俯视的场地，起点在左，目标在右。实线的石板蓝路径是真实发生的事。虚线的朱红段是模型在每段 ${k} 步的信任区间内想象的路径，每段都从真实状态重新开始。重新规划 ${r} 次。${end}`,
    ariaHit: "真实路径到达了目标。",
    ariaMiss: (d: string) => `真实路径在距目标 ${d} 步处结束。`,
    ariaRunning: "运行中。",
  },
} as const;

export function TrustHorizon() {
  const locale = useLocale();
  const T = TEXT[locale as keyof typeof TEXT] ?? TEXT.en;
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const fs = compact ? 1.65 : 1;

  const [k, setK] = useState(10);
  const sim = useMemo(() => simulate(k), [k]);
  // how many real steps are on screen; MAX_STEPS means the whole episode
  const [shown, setShown] = useState(MAX_STEPS);
  const visible = Math.min(shown, sim.steps);
  const done = visible >= sim.steps;

  useEffect(() => {
    if (shown >= sim.steps) return;
    const id = window.setTimeout(() => setShown(shown + 1), 70);
    return () => window.clearTimeout(id);
  }, [shown, sim.steps]);

  const setTrusted = (v: number) => {
    setK(v);
    setShown(MAX_STEPS);
  };
  const sweep = useSweep({ value: k, min: 1, max: MAX_STEPS, step: 1, setValue: setTrusted });
  const run = () => {
    sweep.stop();
    setShown(still ? MAX_STEPS : 0);
  };

  const here = sim.real[visible];
  const replansShown = sim.segments.filter((s) => s.start > 0 && s.start <= visible).length;
  const distShown = toGoal(here) / STEP;
  const reachedShown = done && sim.reached;
  const distText = reachedShown ? T.reached : T.units(distShown.toFixed(1));

  const verdict = k <= 5 ? T.v1 : k < 20 ? T.v2 : T.v3;
  const outcome = done ? (sim.reached ? T.hit : T.miss) : "";
  const ariaEnd = !done ? T.ariaRunning : sim.reached ? T.ariaHit : T.ariaMiss(distShown.toFixed(1));

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={T.aria(k, replansShown, ariaEnd)}>
          <defs>
            <pattern id="thgrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M30 0 L0 0 0 30" fill="none" stroke="var(--rule)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#thgrid)" opacity="0.55" />

          {/* legend */}
          <line x1="24" y1="22" x2="54" y2="22" stroke="var(--actual)" strokeWidth="2.5" />
          <text x="62" y="22" dominantBaseline="middle" className="font-mono" fontSize={10 * fs} letterSpacing="1" fill="var(--ink-faint)">
            {T.real}
          </text>
          <line x1={compact ? 150 : 120} y1="22" x2={compact ? 180 : 150} y2="22" stroke="var(--imagine)" strokeWidth="2" strokeDasharray="5 5" />
          <text x={compact ? 188 : 158} y="22" dominantBaseline="middle" className="font-mono" fontSize={10 * fs} letterSpacing="1" fill="var(--ink-faint)">
            {T.imagined}
          </text>

          {/* goal: a ring, and the hairline inside which we call it reached */}
          <circle cx={GOAL.x} cy={GOAL.y} r={REACH} fill="none" stroke="var(--rule)" strokeWidth="1" />
          <circle cx={GOAL.x} cy={GOAL.y} r="7" fill="none" stroke="var(--ink)" strokeWidth="2" />
          <text x={GOAL.x} y={GOAL.y - REACH - 8} textAnchor="middle" className="font-mono" fontSize={10 * fs} letterSpacing="1" fill="var(--ink-faint)">
            {T.goal}
          </text>
          <text x={START.x} y={START.y + 24} textAnchor="middle" className="font-mono" fontSize={10 * fs} letterSpacing="1" fill="var(--ink-faint)">
            {T.start}
          </text>

          {/* what the model imagined over each trusted stretch, drawn when the plan is made */}
          {sim.segments.filter((s) => s.start <= visible).map((s) => (
            <path key={s.start} d={path([sim.real[s.start], ...s.pts])} fill="none"
              stroke="var(--imagine)" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />
          ))}

          {/* what really happened */}
          <path d={path(sim.real.slice(0, visible + 1))} fill="none"
            stroke="var(--actual)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* each replan starts again from the real state */}
          {sim.segments.filter((s) => s.start > 0 && s.start <= visible).map((s) => (
            <circle key={s.start} cx={sim.real[s.start].x} cy={sim.real[s.start].y} r="3.5"
              fill="var(--paper)" stroke="var(--actual)" strokeWidth="1.5" />
          ))}

          <circle cx={START.x} cy={START.y} r="5" fill="var(--actual)" stroke="var(--paper)" strokeWidth="2" />
          <circle cx={here.x} cy={here.y} r="6" fill="var(--actual)" stroke="var(--paper)" strokeWidth="2" />
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className={compact
          ? "flex basis-full flex-wrap items-center gap-x-3 gap-y-2"
          : "flex min-w-[min(18rem,100%)] flex-1 items-center gap-3"}>
          <span className={compact ? "label basis-full" : "label whitespace-nowrap"}>{T.trusted}</span>
          <input
            type="range"
            min={1}
            max={MAX_STEPS}
            value={k}
            onChange={(e) => {
              sweep.stop();
              setTrusted(Number(e.target.value));
            }}
            className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-8 text-right !text-ink">{k}</span>
        </label>
        <PlayButton playing={sweep.playing} onClick={sweep.toggle} />
        <button
          type="button"
          onClick={run}
          className={`label h-10 border px-5 transition-colors ${
            done ? "border-rule-strong bg-paper !text-ink hover:border-ink" : "border-imagine bg-imagine !text-paper"
          }`}
        >
          {T.run}
        </button>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}
          {outcome ? ` ${outcome}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.stepsTrusted, String(k)],
          [T.replans, String(replansShown)],
          [T.distance, distText],
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
