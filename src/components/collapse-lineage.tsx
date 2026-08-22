"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * Three shapes of fix for the pile-up, run on one small cloud of descriptions.
 *
 * Eight things, each seen twice (a filled dot and a hollow one, joined). Every
 * method pulls each pair together. Left at that, the cheapest way to satisfy
 * the loss is for every description to drift to the same spot, so the bare
 * dynamics also drift towards the centroid and towards one diagonal (the parts
 * copying each other). Contrastive adds repulsion between all points. BYOL has
 * no repulsion: the pull is towards a slowly updated copy of the cloud, which
 * trails behind. VICReg has no repulsion either: it watches the cloud's own
 * spread and pushes back out when an axis goes flat or the axes correlate.
 * Illustrative throughout; nothing here is an optimiser.
 */

type Pt = [number, number];
type Cloud = Pt[];
type Method = "none" | "contrastive" | "byol" | "vicreg";

const METHODS: Method[] = ["none", "contrastive", "byol", "vicreg"];

/** index 2i and 2i+1 are the two views of thing i */
const INIT: Cloud = [
  [-0.95, 0.55], [-0.78, 0.72],
  [0.35, 0.95], [0.52, 0.8],
  [1.05, 0.25], [0.88, 0.42],
  [0.7, -0.75], [0.86, -0.58],
  [-0.15, -1.0], [-0.32, -0.85],
  [-1.05, -0.35], [-0.88, -0.18],
  [0.05, 0.2], [0.22, 0.05],
  [-0.45, -0.25], [-0.28, -0.4],
];

const PULL = 0.3;      // each view towards its partner
const DRIFT = 0.3;     // towards the centroid: the trivial solution
const DIAG = 0.15;     // towards one diagonal: the parts copying each other
const REPEL = 0.032;   // contrastive: away from every other point
const BYOL_PULL = 0.5; // towards the target copy's view of the partner
const BYOL_DRIFT = 0.04;
const BYOL_DIAG = 0.04;
const TAU = 0.2;       // how fast the target copy follows
const VAR_FLOOR = 0.5; // VICReg: fraction of the starting axis variance
const CORR_MAX = 0.8;

function stats(c: Cloud) {
  const n = c.length;
  const mx = c.reduce((s, p) => s + p[0], 0) / n;
  const my = c.reduce((s, p) => s + p[1], 0) / n;
  let vx = 0, vy = 0, cv = 0;
  for (const [x, y] of c) {
    vx += (x - mx) ** 2;
    vy += (y - my) ** 2;
    cv += (x - mx) * (y - my);
  }
  vx /= n; vy /= n; cv /= n;
  return { mx, my, vx, vy, cv, corr: cv / Math.sqrt(vx * vy || 1e-9) };
}

const S0 = stats(INIT);

type Sim = {
  cloud: Cloud;
  target: Cloud;
  prev: Cloud | null;
  repel: Pt[] | null;
  penalised: boolean;
  steps: number;
};

const FRESH: Sim = { cloud: INIT, target: INIT, prev: null, repel: null, penalised: false, steps: 0 };

function advance(method: Method, sim: Sim): Sim {
  const { cloud, target, penalised } = sim;
  const { mx, my, vx, vy, cv, corr } = stats(cloud);
  const repel: Pt[] = [];
  const next: Cloud = cloud.map((p, i) => {
    const q = cloud[i ^ 1];
    const rx = p[0] - mx, ry = p[1] - my;
    const diag = (rx + ry) / 2;
    let dx = 0, dy = 0;
    if (method === "byol") {
      const t = target[i ^ 1];
      dx += BYOL_PULL * (t[0] - p[0]) - BYOL_DRIFT * rx + BYOL_DIAG * (diag - rx);
      dy += BYOL_PULL * (t[1] - p[1]) - BYOL_DRIFT * ry + BYOL_DIAG * (diag - ry);
    } else {
      dx += PULL * (q[0] - p[0]) - DRIFT * rx + DIAG * (diag - rx);
      dy += PULL * (q[1] - p[1]) - DRIFT * ry + DIAG * (diag - ry);
    }
    if (method === "contrastive") {
      let fx = 0, fy = 0;
      cloud.forEach((k, j) => {
        if (j === i || j === (i ^ 1)) return;
        const ex = p[0] - k[0], ey = p[1] - k[1];
        const r2 = ex * ex + ey * ey + 0.02;
        fx += ex / r2;
        fy += ey / r2;
      });
      repel.push([REPEL * fx, REPEL * fy]);
      dx += REPEL * fx;
      dy += REPEL * fy;
    }
    if (method === "vicreg" && penalised) {
      const gx = vx < VAR_FLOOR * S0.vx ? Math.min(1.6, Math.sqrt(S0.vx / vx)) : 1;
      const gy = vy < VAR_FLOOR * S0.vy ? Math.min(1.6, Math.sqrt(S0.vy / vy)) : 1;
      dx += (gx - 1) * rx;
      dy += (gy - 1) * ry;
      if (Math.abs(corr) > CORR_MAX) dy -= 0.6 * (cv / vx) * rx;
    }
    return [p[0] + dx, p[1] + dy];
  });
  const nextTarget: Cloud = target.map((t, i) => [
    t[0] + TAU * (next[i][0] - t[0]),
    t[1] + TAU * (next[i][1] - t[1]),
  ]);
  const s = stats(next);
  const hot = s.vx < VAR_FLOOR * S0.vx || s.vy < VAR_FLOOR * S0.vy || Math.abs(s.corr) > CORR_MAX;
  return {
    cloud: next,
    target: nextTarget,
    prev: cloud,
    repel: method === "contrastive" ? repel : null,
    penalised: method === "vicreg" && hot,
    steps: sim.steps + 1,
  };
}

/** wide on a desktop column, near square on a phone; the cloud sits at the centre */
const H = 400;
const SC = 130;

const TEXT: Record<string, {
  methods: Record<Method, string>;
  method: string; step: string; reset: string; spread: string; steps: string;
  legend: string; target: string; repel: string; ellipse: string; ellipseHot: string;
  verdict: Record<Method, string>;
}> = {
  en: {
    methods: { none: "nothing", contrastive: "contrastive (2020)", byol: "BYOL (2020)", vicreg: "VICReg (2021)" },
    method: "How the pile-up is stopped",
    step: "Step",
    reset: "Reset",
    spread: "spread",
    steps: "steps taken",
    legend: "filled and hollow: two views of one thing",
    target: "faint dots: the target encoder's copy, trailing",
    repel: "faint arrows: pushed away from every other point",
    ellipse: "ellipse: the cloud's spread",
    ellipseHot: "spread too low or axes copying: pushed back out",
    verdict: {
      none: "Pairs pulled together and nothing else: the cloud piles up, and the loss is perfect.",
      contrastive: "Pairs pulled together, everything else pushed apart. The cloud cannot pile up because every point is being shoved.",
      byol: "Nothing is pushed apart. The cloud chases a copy of itself that lags behind, and it keeps its shape anyway.",
      vicreg: "Nothing is pushed apart. The cloud is penalised directly when its spread drops or its axes copy each other.",
    },
  },
  zh: {
    methods: { none: "不做处理", contrastive: "对比式（2020）", byol: "BYOL（2020）", vicreg: "VICReg（2021）" },
    method: "怎样阻止堆成一团",
    step: "走一步",
    reset: "重置",
    spread: "离散度",
    steps: "已走步数",
    legend: "实心与空心：同一样东西的两个视图",
    target: "淡色小点：目标编码器的副本，落在后面",
    repel: "淡色箭头：被其余每个点推开",
    ellipse: "椭圆：点云的离散范围",
    ellipseHot: "离散度太低或两轴互相抄袭：被推回去",
    verdict: {
      none: "只把成对的两个视图拉到一起，别的什么都不做：点云堆成一团，而损失完美。",
      contrastive: "成对的拉到一起，其余的全部推开。每个点都在被推，点云堆不起来。",
      byol: "没有任何东西被推开。点云追着一份落在后面的自己的副本跑，形状却仍然保住了。",
      vicreg: "没有任何东西被推开。一旦点云的离散度下降，或者两条轴互相抄袭，点云本身就直接受罚。",
    },
  },
};

export function CollapseLineage() {
  const locale = useLocale();
  const T = TEXT[locale] ?? TEXT.en;
  const still = useReducedMotion();
  const { ref, compact } = useCompact(520);
  const k = compact ? 1.65 : 1;
  const W = compact ? 480 : 900;
  const sx = (x: number) => W / 2 + x * SC;
  const sy = (y: number) => H / 2 - y * SC;
  const R = compact ? 1.35 : 1;
  const [method, setMethod] = useState<Method>("contrastive");
  const [sim, setSim] = useState<Sim>(FRESH);

  const pick = (m: Method) => { setMethod(m); setSim(FRESH); };
  const step = () => setSim((s) => advance(method, s));
  const reset = () => setSim(FRESH);

  const s = stats(sim.cloud);
  const spread = (s.vx + s.vy) / (S0.vx + S0.vy);
  const spreadText = spread.toFixed(2);

  // the bounding ellipse, two standard deviations along each principal axis
  const half = (s.vx - s.vy) / 2;
  const root = Math.sqrt(half * half + s.cv * s.cv);
  const l1 = Math.max((s.vx + s.vy) / 2 + root, 1e-6);
  const l2 = Math.max((s.vx + s.vy) / 2 - root, 1e-6);
  const angle = (-0.5 * Math.atan2(2 * s.cv, s.vx - s.vy) * 180) / Math.PI;

  const move = { duration: still ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] as const };
  const topLabel =
    method === "byol" ? T.target
    : method === "contrastive" ? T.repel
    : method === "vicreg" ? (sim.penalised ? T.ellipseHot : T.ellipse)
    : null;

  const aria = locale === "zh"
    ? `${T.methods[method]}：已走 ${sim.steps} 步，离散度 ${spreadText}。${T.verdict[method]}`
    : `${T.methods[method]}: ${sim.steps} steps taken, spread ${spreadText}. ${T.verdict[method]}`;

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={aria}>
          <defs>
            <marker id="clg-ar" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--imagine)" strokeWidth="1.2" />
            </marker>
          </defs>

          {/* VICReg: the cloud's own spread, watched directly */}
          {method === "vicreg" && (
            <g transform={`translate(${sx(s.mx).toFixed(1)} ${sy(s.my).toFixed(1)}) rotate(${angle.toFixed(1)})`}>
              <ellipse
                rx={2 * Math.sqrt(l1) * SC} ry={2 * Math.sqrt(l2) * SC}
                fill={sim.penalised ? "var(--imagine-soft)" : "none"}
                fillOpacity={sim.penalised ? 0.5 : 0}
                stroke="var(--imagine)"
                strokeWidth={sim.penalised ? 1.8 : 1}
                strokeDasharray={sim.penalised ? "0" : "4 4"}
              />
            </g>
          )}

          {/* BYOL: the target encoder's copy, trailing the cloud */}
          {method === "byol" && sim.target.map((t, i) => (
            <motion.circle
              key={`t${i}`}
              r={3.5 * R}
              fill="none"
              stroke="var(--ink-faint)"
              strokeWidth="1"
              opacity="0.75"
              cx={sx(t[0])} cy={sy(t[1])}
              initial={false}
              animate={{ cx: sx(t[0]), cy: sy(t[1]) }}
              transition={move}
            />
          ))}

          {/* contrastive: the repulsion component, drawn faint */}
          {sim.prev && sim.repel && sim.prev.map((p, i) => {
            const r = sim.repel![i];
            const len = Math.hypot(r[0], r[1]) * SC;
            if (len < 2) return null;
            const g = 1.6;
            return (
              <line
                key={`r${i}`}
                x1={sx(p[0])} y1={sy(p[1])}
                x2={sx(p[0] + r[0] * g)} y2={sy(p[1] + r[1] * g)}
                stroke="var(--imagine)" strokeWidth="1" strokeDasharray="2 3" opacity="0.45"
              />
            );
          })}

          {/* the step just taken */}
          {sim.prev && sim.prev.map((p, i) => {
            const q = sim.cloud[i];
            const len = Math.hypot(q[0] - p[0], q[1] - p[1]) * SC;
            if (len < 2) return null;
            return (
              <line
                key={`a${i}`}
                x1={sx(p[0])} y1={sy(p[1])} x2={sx(q[0])} y2={sy(q[1])}
                stroke="var(--imagine)" strokeWidth="1.3" markerEnd="url(#clg-ar)"
              />
            );
          })}

          {/* pairs: two views of one thing */}
          {INIT.map((_, i) => {
            if (i % 2) return null;
            const a = sim.cloud[i], b = sim.cloud[i + 1];
            return (
              <motion.line
                key={`p${i}`}
                stroke="var(--rule-strong)" strokeWidth="1"
                x1={sx(a[0])} y1={sy(a[1])} x2={sx(b[0])} y2={sy(b[1])}
                initial={false}
                animate={{ x1: sx(a[0]), y1: sy(a[1]), x2: sx(b[0]), y2: sy(b[1]) }}
                transition={move}
              />
            );
          })}
          {sim.cloud.map((p, i) => (
            <motion.circle
              key={`c${i}`}
              r={(i % 2 ? 4.5 : 5) * R}
              fill={i % 2 ? "var(--paper)" : "var(--actual)"}
              stroke="var(--actual)"
              strokeWidth={i % 2 ? 1.6 : 1}
              cx={sx(p[0])} cy={sy(p[1])}
              initial={false}
              animate={{ cx: sx(p[0]), cy: sy(p[1]) }}
              transition={move}
            />
          ))}

          {topLabel && !compact && (
            <text x="6" y={12 * k + 2} className="font-mono" fontSize={10 * k} letterSpacing="0.5"
              fill={method === "vicreg" && sim.penalised ? "var(--imagine)" : "var(--ink-faint)"}>
              {topLabel}
            </text>
          )}
          <text x="6" y={H - 8} className="font-mono" fontSize={10 * k} letterSpacing="0.5" fill="var(--ink-faint)">
            {T.legend}
          </text>
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-col gap-4 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <span className="label">{T.method}</span>
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => pick(m)}
                aria-pressed={m === method}
                className={`border px-3 py-1.5 transition-colors ${
                  m === method
                    ? "border-imagine bg-imagine text-paper"
                    : "border-rule-strong bg-paper text-ink hover:border-ink"
                }`}
              >
                <span className={`label !text-[0.6rem] ${m === method ? "!text-paper" : "!text-ink"}`}>
                  {T.methods[m]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={step}
              className="border border-rule-strong bg-paper px-4 py-1.5 text-ink transition-colors hover:border-ink"
            >
              <span className="label !text-ink">{T.step}</span>
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={sim.steps === 0}
              className="border border-rule-strong bg-paper px-3 py-1.5 text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-50 disabled:hover:border-rule-strong"
            >
              <span className="label">{T.reset}</span>
            </button>
          </div>
          <p className="label max-w-[52ch] !normal-case !tracking-normal !text-[0.8rem]">
            {T.verdict[method]}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-rule bg-rule">
        {[
          [T.spread, spreadText],
          [T.steps, String(sim.steps)],
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
