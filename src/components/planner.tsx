"use client";

import { useMemo, useState } from "react";
import { useT } from "./locale-provider";

/**
 * What "searchable" actually means.
 *
 * Chapter 1 defines this category by whether you can roll the model forward
 * under actions nobody has taken and search over them. This is that sentence,
 * executed: sample N action sequences, roll each one through the model, score
 * them, keep the best. Raise N and watch the plan get better, which is the
 * whole argument for having a model at all.
 */

const W = 900;
const H = 300;
const STEPS = 22;
const GOAL = { x: 830, y: 150 };
const WALL = { x: 430, y0: 0, y1: 175, w: 16 };

/** deterministic per-candidate noise so the picture is stable across renders */
function rand(seed: number) {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

type Traj = { pts: [number, number][]; cost: number; hit: boolean };

function rollout(seed: number, bias: number): Traj {
  const pts: [number, number][] = [[60, 150]];
  let x = 60;
  let y = 150;
  let vy = (rand(seed) - 0.5) * 9 + bias;
  let hit = false;
  for (let i = 0; i < STEPS; i++) {
    // one action per step: a small steering adjustment
    vy += (rand(seed * 7 + i) - 0.5) * 5.5;
    vy = Math.max(-16, Math.min(16, vy));
    x += (W - 120) / STEPS;
    y += vy;
    y = Math.max(14, Math.min(H - 14, y));
    // the wall is the reason a reflex is not enough
    if (x > WALL.x - 12 && x < WALL.x + WALL.w + 12 && y < WALL.y1) hit = true;
    pts.push([x, y]);
  }
  const end = pts[pts.length - 1];
  const miss = Math.hypot(end[0] - GOAL.x, end[1] - GOAL.y);
  return { pts, cost: miss + (hit ? 900 : 0), hit };
}

const path = (pts: [number, number][]) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

export function Planner() {
  const t = useT();
  const [n, setN] = useState(1);

  const { candidates, best } = useMemo(() => {
    const c: Traj[] = [];
    for (let i = 0; i < n; i++) c.push(rollout(i + 1, 0));
    const b = c.reduce((a, x) => (x.cost < a.cost ? x : a), c[0]);
    return { candidates: c, best: b };
  }, [n]);

  const reached = best && !best.hit && best.cost < 60;

  return (
    <div>
      <div className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={t("plan.aria", { n })}>
          <defs>
            <pattern id="pgrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M30 0 L0 0 0 30" fill="none" stroke="var(--rule)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#pgrid)" opacity="0.5" />

          {/* the obstacle, and the goal behind it */}
          <rect x={WALL.x} y={WALL.y0} width={WALL.w} height={WALL.y1} fill="var(--ink)" />
          <circle cx={GOAL.x} cy={GOAL.y} r="15" fill="none" stroke="var(--actual)" strokeWidth="2" strokeDasharray="3 3" />
          <circle cx={GOAL.x} cy={GOAL.y} r="5" fill="var(--actual)" />

          {/* every sequence the planner considered */}
          {candidates.map((c, i) =>
            c === best ? null : (
              <path key={i} d={path(c.pts)} fill="none" stroke="var(--imagine)"
                strokeWidth="1.1" opacity={Math.max(0.06, 0.5 / Math.sqrt(n))} />
            ),
          )}

          {/* the one it would execute */}
          {best && (
            <>
              <path d={path(best.pts)} fill="none" stroke="var(--imagine)" strokeWidth="3" strokeLinecap="round" />
              <circle cx={best.pts[best.pts.length - 1][0]} cy={best.pts[best.pts.length - 1][1]}
                r="6" fill="var(--imagine)" stroke="var(--paper)" strokeWidth="2" />
            </>
          )}
          <circle cx="60" cy="150" r="6" fill="var(--ink)" />
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-[18rem] flex-1 items-center gap-3">
          <span className="label whitespace-nowrap">{t("plan.tried")}</span>
          <input type="range" min={1} max={240} value={n} onChange={(e) => setN(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-12 text-right !text-ink">{n}</span>
        </label>
        <p className="label !normal-case !tracking-normal !text-[0.8rem]">
          {reached ? t("plan.found") : best?.hit ? t("plan.allHit") : t("plan.closest")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [t("plan.considered"), String(n)],
          [t("plan.hitWall"), `${candidates.filter((c) => c.hit).length} / ${n}`],
          [t("plan.bestMiss"), best ? `${Math.round(Math.min(best.cost, 999))}` : "–"],
        ].map(([k, v]) => (
          <div key={k} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{k}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
