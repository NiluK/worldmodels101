"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText } from "@/lib/locale-text";

/**
 * Where the computation happens.
 *
 * PlaNet and Dreamer share a world model and differ in what they do with it.
 * PlaNet searches at every decision: it imagines many action sequences, keeps
 * the best, and takes its first step. Dreamer imagines once, up front, learns a
 * behaviour from those futures, and then every decision is a reflex that costs
 * the model nothing. The two panels are the same small world; the counters are
 * the point. Nothing here is a real planner.
 */

type Pt = { x: number; y: number };

const W = 320;
const H = 200;
const START: Pt = { x: 44, y: 100 };
const GOAL: Pt = { x: 276, y: 100 };
const OB = { x0: 146, y0: 58, x1: 172, y1: 142 };
const STEP = 24;
const HORIZON = 6;
const CANDS = 12;
const TRAIN_TOTAL = 3000;
const GOAL_R = 14;

const TEXT = {
  en: {
    left: "PlaNet: plan by search",
    right: "Dreamer: learn the behaviour",
    decide: "Decide",
    train: "Train in imagination",
    training: "Training",
    trained: "Trained",
    reset: "Reset",
    goal: "goal",
    callsLeft: `model calls this decision: ${CANDS} sequences × ${HORIZON} steps = ${CANDS * HORIZON}`,
    callsLeftIdle: "model calls this decision: press Decide",
    callsRightNone: "model calls this decision: train first",
    callsRight: "model calls this decision: 0",
    imagined: "imagined steps",
    atGoal: "at the goal",
    decisions: "decisions made",
    calls: "total model calls",
    v0: "Same world twice. Decide on the left; on the right, train first.",
    v1: `Every decision on the left ran the model ${CANDS * HORIZON} times before the dot moved once.`,
    v2: `Training spent ${TRAIN_TOTAL.toLocaleString("en")} imagined steps. Nothing has moved yet.`,
    v3: "Search pays at decision time, every time. Dreamer paid once, in advance.",
    ariaLeft: (d: number, c: number) =>
      `PlaNet panel: a dot, a wall and a goal. ${d} decisions so far, ${c} model calls. Each decision fans out ${CANDS} imagined sequences and takes the first step of the best.`,
    ariaRight: (trained: boolean, d: number) =>
      `Dreamer panel: the same dot, wall and goal. ${trained ? `Trained on ${TRAIN_TOTAL} imagined steps; ${d} reflex decisions since, each costing no model calls.` : "Not yet trained; the dot has not moved."}`,
  },
  zh: {
    left: "PlaNet：靠搜索来规划",
    right: "Dreamer：学会行为",
    decide: "决定",
    train: "在想象中训练",
    training: "训练中",
    trained: "已训练",
    reset: "重置",
    goal: "目标",
    callsLeft: `这一步决定调用模型：${CANDS} 条序列 × ${HORIZON} 步 = ${CANDS * HORIZON} 次`,
    callsLeftIdle: "这一步决定调用模型：按「决定」",
    callsRightNone: "这一步决定调用模型：先训练",
    callsRight: "这一步决定调用模型：0 次",
    imagined: "想象步数",
    atGoal: "已到目标",
    decisions: "已做决定",
    calls: "模型调用总数",
    v0: "同一个世界，画了两遍。左边按「决定」；右边先训练。",
    v1: `左边每做一次决定，模型先跑 ${CANDS * HORIZON} 次，点才动一步。`,
    v2: `训练花掉了 ${TRAIN_TOTAL.toLocaleString("zh-CN")} 个想象步。还什么都没动。`,
    v3: "搜索在每次决定时付费，次次如此。Dreamer 提前一次付清。",
    ariaLeft: (d: number, c: number) =>
      `PlaNet 面板：一个点、一堵墙、一个目标。已做 ${d} 次决定，调用模型 ${c} 次。每次决定展开 ${CANDS} 条想象序列，走最好一条的第一步。`,
    ariaRight: (trained: boolean, d: number) =>
      `Dreamer 面板：同样的点、墙和目标。${trained ? `已用 ${TRAIN_TOTAL} 个想象步训练；此后做了 ${d} 次反射式决定，每次不调用模型。` : "尚未训练；点还没动。"}`,
  },
};

const rand = (seed: number) => {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};
const clamp = (p: Pt): Pt => ({ x: Math.min(W - 10, Math.max(10, p.x)), y: Math.min(H - 10, Math.max(10, p.y)) });
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const blocked = (p: Pt) => p.x > OB.x0 - 6 && p.x < OB.x1 + 6 && p.y > OB.y0 - 6 && p.y < OB.y1 + 6;
const turn = (from: number, to: number) => {
  let d = to - from;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
};
const poly = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

/** PlaNet's step: fan out CANDS sequences of HORIZON actions, score them, keep the best. */
function imagine(p: Pt, seed: number): { paths: Pt[][]; best: number } {
  const base = Math.atan2(GOAL.y - p.y, GOAL.x - p.x);
  const paths: Pt[][] = [];
  const costs: number[] = [];
  for (let i = 0; i < CANDS; i++) {
    let h = base + (i / (CANDS - 1) - 0.5) * 2.6 * Math.min(1, dist(p, GOAL) / (4 * STEP));
    let q = p;
    const pts = [p];
    let cost = 0;
    for (let s = 0; s < HORIZON; s++) {
      const next = clamp({ x: q.x + STEP * Math.cos(h), y: q.y + STEP * Math.sin(h) });
      let hit = false;
      for (let f = 0.25; f <= 1; f += 0.25) {
        if (blocked({ x: q.x + (next.x - q.x) * f, y: q.y + (next.y - q.y) * f })) hit = true;
      }
      q = next;
      pts.push(q);
      if (hit) {
        cost += 1000 - s * 100;
        break;
      }
      cost += dist(q, GOAL) * 0.3;
      h += turn(h, Math.atan2(GOAL.y - q.y, GOAL.x - q.x)) * 0.35 + (rand(seed * 31 + i * 7 + s) - 0.5) * 0.5;
    }
    paths.push(pts);
    costs.push(cost + dist(q, GOAL));
  }
  let best = 0;
  costs.forEach((c, i) => {
    if (c < costs[best]) best = i;
  });
  return { paths, best };
}

/** Dreamer's step: a fixed reflex that goes round the top of the wall. No model in the loop. */
function reflex(p: Pt): Pt {
  const band = p.y > OB.y0 - 16 && p.y < OB.y1 + 16;
  const target: Pt =
    p.x < OB.x0 - 4 && band
      ? { x: OB.x0 - 14, y: OB.y0 - 22 }
      : p.x < OB.x1 + 8 && p.y < OB.y0
        ? { x: OB.x1 + 16, y: OB.y0 - 22 }
        : GOAL;
  const d = dist(p, target) || 1;
  return clamp({ x: p.x + (STEP * (target.x - p.x)) / d, y: p.y + (STEP * (target.y - p.y)) / d });
}

function World({
  label,
  trail,
  dot,
  faint,
  strong,
  k,
  goalText,
}: {
  label: string;
  trail: Pt[];
  dot: Pt;
  faint: Pt[][];
  strong: Pt[] | null;
  k: number;
  goalText: string;
}) {
  const still = useReducedMotion();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={label}>
      <rect width={W} height={H} fill="var(--paper-sunk)" opacity="0.5" />
      <rect x={OB.x0} y={OB.y0} width={OB.x1 - OB.x0} height={OB.y1 - OB.y0} fill="var(--ink)" />
      <circle cx={GOAL.x} cy={GOAL.y} r={GOAL_R - 4} fill="none" stroke="var(--ink)" strokeWidth="1.2" />
      <circle cx={GOAL.x} cy={GOAL.y} r="2" fill="var(--ink)" />
      <text x={GOAL.x} y={GOAL.y + 24 * k} textAnchor="middle" className="font-mono" fontSize={8 * k} letterSpacing="1" fill="var(--ink-faint)">
        {goalText}
      </text>
      {faint.map((pts, i) => (
        <path key={i} d={poly(pts)} fill="none" stroke="var(--imagine)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
      ))}
      {strong && <path d={poly(strong)} fill="none" stroke="var(--imagine)" strokeWidth="2" strokeLinecap="round" />}
      {trail.length > 1 && <path d={poly(trail)} fill="none" stroke="var(--actual)" strokeWidth="1.5" opacity="0.8" />}
      <motion.circle
        r="5"
        fill="var(--actual)"
        stroke="var(--paper)"
        strokeWidth="1.5"
        initial={false}
        animate={{ cx: dot.x, cy: dot.y }}
        transition={{ duration: still ? 0 : 0.3, ease: "easeOut" }}
      />
    </svg>
  );
}

export function PlanOrLearn() {
  const locale = useLocale();
  const s = pickText(TEXT, locale);
  const still = useReducedMotion();
  // stacked: the two panels no longer fit side by side. tiny: one panel is so
  // narrow that the SVG type has to be enlarged to stay legible.
  const { ref, compact: stacked } = useCompact(560);
  const { ref: panelRef, compact: tiny } = useCompact(420);
  const k = tiny ? 1.65 : 1;
  const fmt = (n: number) => n.toLocaleString(locale === "zh" ? "zh-CN" : "en");

  // left: every decision is a search
  const [lTrail, setLTrail] = useState<Pt[]>([START]);
  const [cands, setCands] = useState<{ paths: Pt[][]; best: number } | null>(null);
  // reveal phase: 0..CANDS candidates shown, +1 best drawn, +2 dot moved
  const [phase, setPhase] = useState(CANDS + 2);
  // right: one training run, then reflexes
  const [trainSteps, setTrainSteps] = useState(0);
  const [training, setTraining] = useState(false);
  const [rTrail, setRTrail] = useState<Pt[]>([START]);

  const lPos = lTrail[lTrail.length - 1];
  const rPos = rTrail[rTrail.length - 1];
  const lDone = dist(lPos, GOAL) < GOAL_R;
  const rDone = dist(rPos, GOAL) < GOAL_R;
  const lDecisions = lTrail.length - 1;
  const rDecisions = rTrail.length - 1;
  const trained = trainSteps >= TRAIN_TOTAL;

  useEffect(() => {
    if (still || phase >= CANDS + 2) return;
    const id = window.setTimeout(() => setPhase((v) => v + 1), phase < CANDS ? 45 : 220);
    return () => window.clearTimeout(id);
  }, [phase, still]);

  useEffect(() => {
    if (!training) return;
    const id = window.setInterval(() => {
      setTrainSteps((v) => {
        if (v + 100 >= TRAIN_TOTAL) {
          window.clearInterval(id);
          setTraining(false);
          return TRAIN_TOTAL;
        }
        return v + 100;
      });
    }, 40);
    return () => window.clearInterval(id);
  }, [training]);

  const decideLeft = () => {
    if (lDone) return;
    const next = imagine(lPos, lTrail.length);
    setCands(next);
    setLTrail((t) => [...t, next.paths[next.best][1]]);
    setPhase(still ? CANDS + 2 : 0);
  };
  const train = () => {
    if (trained || training) return;
    if (still) setTrainSteps(TRAIN_TOTAL);
    else setTraining(true);
  };
  const decideRight = () => {
    if (!trained || rDone) return;
    setRTrail((t) => [...t, reflex(rPos)]);
  };
  const reset = () => {
    setLTrail([START]);
    setCands(null);
    setPhase(CANDS + 2);
    setTrainSteps(0);
    setTraining(false);
    setRTrail([START]);
  };

  const lShown = cands ? cands.paths.slice(0, Math.min(phase, CANDS)) : [];
  const lStrong = cands && phase >= CANDS + 1 ? cands.paths[cands.best] : null;
  const lDot = phase >= CANDS + 2 ? lPos : lTrail[Math.max(0, lTrail.length - 2)];
  const lTrailShown = phase >= CANDS + 2 ? lTrail : lTrail.slice(0, -1);
  const dreaming = training ? imagine(START, 100 + Math.floor(trainSteps / 600)).paths : [];
  const lCalls = lDecisions * CANDS * HORIZON;
  const rCalls = trainSteps;

  const verdict =
    lDecisions > 0 && rDecisions > 0 ? s.v3 : rDecisions === 0 && trained ? s.v2 : lDecisions > 0 ? s.v1 : s.v0;

  const btn = "border border-rule-strong bg-paper px-4 py-1.5 text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rule-strong";

  return (
    <div>
      <div ref={ref} className={`grid ${stacked ? "grid-cols-1" : "grid-cols-2"}`}>
        <div ref={panelRef} className="flex flex-col px-4 pt-5 md:px-6">
          <p className="label mb-3">{s.left}</p>
          <World label={s.ariaLeft(lDecisions, lCalls)} trail={lTrailShown} dot={lDot} faint={lShown} strong={lStrong} k={k} goalText={s.goal} />
          <p className="label tnum mt-2 mb-3 !normal-case !tracking-normal">{cands ? s.callsLeft : s.callsLeftIdle}</p>
          <div data-print-hide className="mt-auto flex flex-wrap items-center gap-3 border-t border-rule py-3">
            <button type="button" onClick={decideLeft} disabled={lDone} className={btn}>
              <span className="label">{s.decide}</span>
            </button>
            {lDone && <span className="label">{s.atGoal}</span>}
          </div>
        </div>

        <div className={`flex flex-col px-4 pt-5 md:px-6 ${stacked ? "border-t border-rule" : "border-l border-rule"}`}>
          <p className="label mb-3">{s.right}</p>
          <World label={s.ariaRight(trained, rDecisions)} trail={rTrail} dot={rPos} faint={dreaming} strong={null} k={k} goalText={s.goal} />
          <p className="label tnum mt-2 flex items-center gap-2 !normal-case !tracking-normal">
            <span className="h-1 w-16 shrink-0 bg-rule" aria-hidden="true">
              <span className="block h-full bg-imagine" style={{ width: `${(trainSteps / TRAIN_TOTAL) * 100}%` }} />
            </span>
            {s.imagined} {fmt(trainSteps)}
          </p>
          <p className="label tnum mt-1 mb-3 !normal-case !tracking-normal">{trained ? s.callsRight : s.callsRightNone}</p>
          <div data-print-hide className="mt-auto flex flex-wrap items-center gap-3 border-t border-rule py-3">
            <button
              type="button"
              onClick={train}
              disabled={trained}
              className={`border px-4 py-1.5 transition-colors disabled:cursor-not-allowed ${
                training ? "border-imagine bg-imagine text-paper" : "border-rule-strong bg-paper text-ink hover:border-ink disabled:opacity-40"
              }`}
            >
              <span className={`label ${training ? "!text-paper" : ""}`}>{trained ? s.trained : training ? s.training : s.train}</span>
            </button>
            <button type="button" onClick={decideRight} disabled={!trained || rDone} className={btn}>
              <span className="label">{s.decide}</span>
            </button>
            {rDone && <span className="label">{s.atGoal}</span>}
          </div>
        </div>
      </div>

      <div data-print-hide className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <p className="label min-w-[16rem] flex-1 !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}
        </p>
        <button type="button" onClick={reset} className={btn}>
          <span className="label">{s.reset}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-rule bg-rule sm:grid-cols-4">
        {[
          [`PlaNet · ${s.decisions}`, fmt(lDecisions)],
          [`PlaNet · ${s.calls}`, fmt(lCalls)],
          [`Dreamer · ${s.decisions}`, fmt(rDecisions)],
          [`Dreamer · ${s.calls}`, fmt(rCalls)],
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
