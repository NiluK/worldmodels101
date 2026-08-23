"use client";

import { useReducedMotion } from "motion/react";
import { useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * The planner's loop, slowed down until you can see the waste.
 *
 * Write a run of eight actions, play it through the model, score it, bin it.
 * The bin fills up, the field stays almost empty, and none of it has touched
 * anything. Commit takes the best run's first action only: one step goes to
 * the world in slate, and the other seven steps of the winner go in the bin
 * with everything else.
 *
 * Candidates are a deterministic function of their index, so the picture does
 * not change under you when the component re-renders, and the field is drawn
 * in a normalised space so a score means the same thing at 340 px and 1100.
 * The scores are illustrative.
 */

type Pt = { x: number; y: number };

/** normalised field: x in 0..1, y in 0..FY, same unit on both axes */
const FY = 0.3;
const START: Pt = { x: 0.055, y: 0.15 };
const GOAL: Pt = { x: 0.945, y: 0.15 };
const WALL = { x0: 0.482, x1: 0.51, gap0: 0.11, gap1: 0.19 };
const STEPS = 8;
const STEP = 0.111;
const PENALTY = 60;
const SHOP = 100;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** stable pseudo random in 0..1, so run 37 is always run 37 */
function noise(n: number) {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

function inWall(p: Pt) {
  return p.x > WALL.x0 && p.x < WALL.x1 && (p.y < WALL.gap0 || p.y > WALL.gap1);
}

function blocked(a: Pt, b: Pt) {
  for (let i = 1; i <= 16; i++) {
    const t = i / 16;
    if (inWall({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })) return true;
  }
  return false;
}

type Run = { pts: Pt[]; score: number; hit: boolean };

function write(idx: number, from: Pt): Run {
  const pts: Pt[] = [from];
  let a = (noise(idx * 3 + 1) - 0.5) * 1.5;
  let p = from;
  let hit = false;
  for (let s = 0; s < STEPS; s++) {
    a += (noise(idx * 31 + s * 7 + 5) - 0.5) * 1.1;
    const next = {
      x: clamp(p.x + Math.cos(a) * STEP, 0.02, 0.98),
      y: clamp(p.y + Math.sin(a) * STEP, 0.02, FY - 0.02),
    };
    if (blocked(p, next)) hit = true;
    pts.push(next);
    p = next;
  }
  const last = pts[pts.length - 1];
  const d = Math.hypot(last.x - GOAL.x, last.y - GOAL.y);
  return { pts, score: Math.round(d * 100) + (hit ? PENALTY : 0), hit };
}

function layout(compact: boolean) {
  const fs = compact ? 17 : 10.5;
  const W = compact ? 560 : 900;
  const fx = compact ? 20 : 30;
  const fy = compact ? 22 : 20;
  const fw = compact ? 520 : 840;
  const fh = fw * FY;
  const H = compact ? fy + fh + 14 : fy + fh + 78;
  const bin = { y: compact ? 30 : fy + fh + 46, h: 24 };
  const binH = 68;
  return { fs, W, H, fx, fy, fw, fh, bin, binH };
}

type Strings = {
  start: string;
  goal: string;
  bestSoFar: string;
  justWritten: string;
  binned: string;
  tryOne: string;
  tryTwenty: string;
  commit: string;
  reset: string;
  runsWritten: string;
  imagined: string;
  real: string;
  bestScore: string;
  none: string;
  v0: string;
  v1: (n: number) => string;
  v2: (i: number, r: number) => string;
  v3: string;
  aria: (n: number, c: number, best: string) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    start: "start",
    goal: "goal",
    bestSoFar: "best so far",
    justWritten: "just written",
    binned: "binned",
    tryOne: "Try one",
    tryTwenty: "Try twenty",
    commit: "Commit",
    reset: "Reset",
    runsWritten: "runs written",
    imagined: "imagined steps",
    real: "real steps",
    bestScore: "best score",
    none: "none",
    v0: "The planner has not written anything yet. Press Try one.",
    v1: (n) =>
      n === 1
        ? "1 run written, 1 run binned. None of it touched the world."
        : `${n} runs written, ${n} runs binned. None of it touched the world.`,
    v2: (i, r) =>
      `${i} imagined steps bought ${r} real ${r === 1 ? "one" : "ones"}. Seven eighths of the winner went in the bin with the rest.`,
    v3: "With one run it was guessing. With this many it is shopping.",
    aria: (n, c, best) =>
      `An illustrative field with a goal behind a wall. ${n} runs of eight actions have been written and binned, ${c} first actions have been committed to the world. Best score so far: ${best}.`,
  },
  zh: {
    start: "起点",
    goal: "目标",
    bestSoFar: "目前最好的",
    justWritten: "刚写下的",
    binned: "废纸篓",
    tryOne: "试一条",
    tryTwenty: "试二十条",
    commit: "执行",
    reset: "清空",
    runsWritten: "写下的方案",
    imagined: "想象出来的步数",
    real: "真实走出的步数",
    bestScore: "最好的分数",
    none: "无",
    v0: "规划器还什么都没写。按「试一条」。",
    v1: (n) => `写下了 ${n} 条，也扔掉了 ${n} 条。这里面没有一步碰到过世界。`,
    v2: (i, r) => `${i} 个想象出来的步，换来 ${r} 个真实的步。赢家的八分之七，也跟着一起进了废纸篓。`,
    v3: "只有一条的时候它是在猜。到了这个数量，它是在挑。",
    aria: (n, c, best) =>
      `一片示意性的场地，目标在障碍后面。已经写下并扔掉了 ${n} 条八个动作的方案，有 ${c} 个第一步交给了世界。目前最好的分数：${best}。`,
  },
};

export function ThrownAwayPlans() {
  const [runs, setRuns] = useState(0);
  const [best, setBest] = useState<Run | null>(null);
  const [last, setLast] = useState<Run | null>(null);
  const [trail, setTrail] = useState<Pt[]>([START]);
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const L = layout(compact);
  const fs = L.fs;

  const here = trail[trail.length - 1];
  const commits = trail.length - 1;

  const tryRuns = (n: number) => {
    let b = best;
    let l: Run | null = null;
    for (let i = 0; i < n; i++) {
      const r = write(runs + i, here);
      if (!b || r.score < b.score) b = r;
      l = r;
    }
    setRuns(runs + n);
    setBest(b);
    setLast(l);
  };

  const commit = () => {
    if (!best) return;
    setTrail([...trail, best.pts[1]]);
    setBest(null);
    setLast(null);
  };

  const reset = () => {
    setRuns(0);
    setBest(null);
    setLast(null);
    setTrail([START]);
  };

  const imagined = runs * STEPS;
  const base =
    runs === 0
      ? T.v0
      : commits > 0
        ? T.v2(imagined, commits)
        : T.v1(runs);
  const verdict = runs >= SHOP ? `${base} ${T.v3}` : base;

  const px = (p: Pt) => [L.fx + p.x * L.fw, L.fy + p.y * L.fw] as const;
  const line = (pts: Pt[]) =>
    pts.map((p, i) => `${i ? "L" : "M"} ${px(p)[0].toFixed(1)} ${px(p)[1].toFixed(1)}`).join(" ");
  const wx0 = L.fx + WALL.x0 * L.fw;
  const wx1 = L.fx + WALL.x1 * L.fw;
  const gy0 = L.fy + WALL.gap0 * L.fw;
  const gy1 = L.fy + WALL.gap1 * L.fw;
  const [gx, gy] = px(GOAL);
  const [hx, hy] = px(here);
  const fade = still ? undefined : "opacity 250ms ease";

  /** the bin never overflows: the ticks get closer together instead */
  const tickGap = Math.min(6, (L.fw - 40) / Math.max(runs, 1));
  const binBase = L.bin.y + L.bin.h;

  const bin = (
    <g>
      <text
        x={L.fx}
        y={L.bin.y - fs * 0.6}
        className="font-mono"
        fontSize={fs}
        letterSpacing="1"
        fill="var(--imagine)"
      >
        {T.binned}
      </text>
      <text
        x={L.fx + L.fw}
        y={L.bin.y - fs * 0.6}
        textAnchor="end"
        className="font-mono tnum"
        fontSize={fs}
        fill="var(--imagine)"
      >
        {runs}
      </text>
      <line
        x1={L.fx}
        y1={binBase}
        x2={L.fx + L.fw}
        y2={binBase}
        stroke="var(--rule)"
        strokeWidth="1"
      />
      {Array.from({ length: runs }, (_, i) => (
        <line
          key={i}
          x1={L.fx + 4 + i * tickGap}
          y1={binBase}
          x2={L.fx + 4 + i * tickGap}
          y2={L.bin.y}
          stroke="var(--imagine)"
          strokeWidth="1.4"
          opacity="0.7"
        />
      ))}
    </g>
  );

  return (
    <div>
      <div ref={ref} className="px-4 pt-5 md:px-8">
        <svg
          viewBox={`0 0 ${L.W} ${L.H}`}
          className="block w-full"
          role="img"
          aria-label={T.aria(runs, commits, best ? String(best.score) : T.none)}
        >
          <rect
            x={L.fx}
            y={L.fy}
            width={L.fw}
            height={L.fh}
            fill="var(--paper)"
            stroke="var(--rule)"
            strokeWidth="1"
          />

          {/* the obstacle, with a way round it */}
          <rect x={wx0} y={L.fy} width={wx1 - wx0} height={gy0 - L.fy} fill="var(--ink-faint)" />
          <rect
            x={wx0}
            y={gy1}
            width={wx1 - wx0}
            height={L.fy + L.fh - gy1}
            fill="var(--ink-faint)"
          />

          {/* the goal */}
          <circle cx={gx} cy={gy} r="9" fill="none" stroke="var(--ink)" strokeWidth="2" />
          <circle cx={gx} cy={gy} r="3" fill="var(--ink)" />
          <text
            x={gx}
            y={gy - 16}
            textAnchor="middle"
            className="font-mono"
            fontSize={fs}
            letterSpacing="1"
            fill="var(--ink-muted)"
          >
            {T.goal}
          </text>

          {/* the run that was just written, on its way to the bin */}
          {last && last !== best && (
            <path
              d={line(last.pts)}
              fill="none"
              stroke="var(--imagine)"
              strokeWidth="1.6"
              strokeLinejoin="round"
              opacity="0.32"
              style={{ transition: fade }}
            />
          )}

          {/* the one still on the shelf */}
          {best && (
            <g>
              <path
                d={line(best.pts)}
                fill="none"
                stroke="var(--imagine)"
                strokeWidth="2.6"
                strokeLinejoin="round"
              />
              {best.pts.slice(1).map((p, i) => (
                <circle key={i} cx={px(p)[0]} cy={px(p)[1]} r="2.6" fill="var(--imagine)" />
              ))}
              <text
                x={px(best.pts[STEPS])[0]}
                y={px(best.pts[STEPS])[1] - 12}
                textAnchor="middle"
                className="font-mono tnum"
                fontSize={fs}
                fill="var(--imagine)"
              >
                {`${T.bestSoFar} ${best.score}`}
              </text>
            </g>
          )}

          {/* the only marks here that happened */}
          {trail.length > 1 && (
            <path
              d={line(trail)}
              fill="none"
              stroke="var(--actual)"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          )}
          <circle cx={hx} cy={hy} r="6.5" fill="var(--actual)" />
          <text
            x={hx}
            y={hy + fs * 2.2}
            textAnchor="middle"
            className="font-mono"
            fontSize={fs}
            letterSpacing="1"
            fill="var(--actual)"
          >
            {T.start}
          </text>

          {/* wide layout keeps the bin under the field */}
          {!compact && bin}
        </svg>
      </div>

      <div
        data-print-hide
        className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-3 border-t border-rule px-5 py-4 md:px-8"
      >
        <button
          type="button"
          onClick={() => tryRuns(1)}
          className="label h-9 border border-imagine bg-imagine px-4 !text-paper transition-colors"
        >
          {T.tryOne}
        </button>
        <button
          type="button"
          onClick={() => tryRuns(20)}
          className="label h-9 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink"
        >
          {T.tryTwenty}
        </button>
        <button
          type="button"
          onClick={commit}
          disabled={!best}
          className="label h-9 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-50"
        >
          {T.commit}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={runs === 0 && commits === 0}
          className="label ml-auto h-9 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-50"
        >
          {T.reset}
        </button>
        <p
          className="label basis-full !normal-case !tracking-normal !text-[0.8rem]"
          aria-live="polite"
        >
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-rule bg-rule sm:grid-cols-4">
        {[
          [T.runsWritten, String(runs)],
          [T.imagined, String(imagined)],
          [T.real, String(commits)],
          [T.bestScore, best ? String(best.score) : T.none],
        ].map(([label, v]) => (
          <div key={label} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{label}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{v}</p>
          </div>
        ))}
      </div>

      {compact && (
        <div className="border-t border-rule px-4 py-4 md:px-8">
          <svg viewBox={`0 0 ${L.W} ${L.binH}`} className="block w-full" aria-hidden="true">
            {bin}
          </svg>
        </div>
      )}
    </div>
  );
}
