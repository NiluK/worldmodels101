"use client";

import { useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText } from "@/lib/locale-text";

/**
 * The two halves, drawn apart.
 *
 * The world model answers what-ifs and never touches the world. The policy
 * reads those answers (or does not, when the model is off) and is the only
 * thing that ever moves the dot. Scores under the ghosts are illustrative.
 */

const N = 5;
const CELL = 44;
const OX = 40;
const OY = 40;
const START = { x: 0, y: 3 };
const GOAL = { x: 4, y: 1 };
/** up, across, down */
const MOVES = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
];

type Pt = { x: number; y: number };
const cx = (x: number) => OX + x * CELL + CELL / 2;
const cy = (y: number) => OY + y * CELL + CELL / 2;
const clamp = (v: number) => Math.max(0, Math.min(N - 1, v));
const dist = (p: Pt) => Math.hypot(p.x - GOAL.x, p.y - GOAL.y);
const step = (p: Pt, i: number): Pt => ({ x: clamp(p.x + MOVES[i].dx), y: clamp(p.y + MOVES[i].dy) });

/** what the model predicts for each candidate, with a made-up score */
function whatIfs(p: Pt) {
  return MOVES.map((_, i) => {
    const q = step(p, i);
    const wobble = ((p.x * 3 + p.y * 5 + i * 7) % 4) * 0.05;
    return { at: q, score: Math.round((6 - dist(q) + wobble) * 10) / 10 };
  });
}
/** the reflex: whichever step shortens the straight line to the goal */
function reflex(p: Pt) {
  let best = 0;
  MOVES.forEach((_, i) => { if (dist(step(p, i)) < dist(step(p, best))) best = i; });
  return best;
}
function bestScored(ghosts: ReturnType<typeof whatIfs>) {
  let best = 0;
  ghosts.forEach((g, i) => { if (g.score > ghosts[best].score) best = i; });
  return best;
}

type Verdict = "vIdle" | "vAsk" | "vActOn" | "vActOff" | "vGoal";

const TEXT = {
  en: {
    ask: "Ask the model", act: "Act", reset: "Reset", on: "Model on", off: "Model off",
    model: "world model", policy: "policy", reflex: "reflex", reads: "reads the what-ifs",
    state: "state", whatIfs: "three what-ifs", action: "one action", goal: "goal", dim: "off",
    calls: "model calls", steps: "world steps",
    vIdle: "Only the policy ever touches the world.",
    vAsk: "The model answered three what-ifs and touched nothing.",
    vActOn: "The policy read the three answers, picked one, and touched the world once.",
    vActOff: "No what-ifs. The policy acted by reflex, straight from what it sees, and still touched the world once.",
    vGoal: "The dot is at the goal and stays there. Reset to go again.",
    aria: (p: Pt, on: boolean, v: string) =>
      `A five by five world with a dot at column ${p.x + 1}, row ${p.y + 1}, and a hollow goal mark at column ${GOAL.x + 1}, row ${GOAL.y + 1}. Beside it, a world model box and a policy box. The model is ${on ? "on" : "off"}. ${v}`,
  },
} as const;

export function ModelAndPolicy() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const { ref, compact } = useCompact(560);
  const k = compact ? 1.65 : 1;

  const [pos, setPos] = useState<Pt>(START);
  const [trail, setTrail] = useState<Pt[]>([START]);
  const [ghosts, setGhosts] = useState<ReturnType<typeof whatIfs> | null>(null);
  const [modelOn, setModelOn] = useState(true);
  const [lit, setLit] = useState<"model" | "policy" | null>(null);
  const [calls, setCalls] = useState(0);
  const [steps, setSteps] = useState(0);
  const [verdict, setVerdict] = useState<Verdict>("vIdle");

  const atGoal = pos.x === GOAL.x && pos.y === GOAL.y;

  const ask = () => {
    if (!modelOn || atGoal) return;
    setGhosts(whatIfs(pos));
    setCalls((c) => c + 3);
    setLit("model");
    setVerdict("vAsk");
  };
  const act = () => {
    if (atGoal) return;
    let next: Pt;
    if (modelOn) {
      // the policy reads the what-ifs; if nobody asked yet, it asks first
      const g = ghosts ?? whatIfs(pos);
      if (!ghosts) setCalls((c) => c + 3);
      next = g[bestScored(g)].at;
    } else {
      next = step(pos, reflex(pos));
    }
    setPos(next);
    setTrail((tr) => [...tr, next]);
    setGhosts(null);
    setSteps((s) => s + 1);
    setLit("policy");
    setVerdict(next.x === GOAL.x && next.y === GOAL.y ? "vGoal" : modelOn ? "vActOn" : "vActOff");
  };
  const reset = () => {
    setPos(START); setTrail([START]); setGhosts(null); setLit(null);
    setCalls(0); setSteps(0); setVerdict("vIdle");
  };
  const toggle = () => {
    setModelOn((on) => !on);
    setGhosts(null);
    setLit(null);
    if (!atGoal) setVerdict("vIdle");
  };

  const v = T[verdict];
  const fade = "transition-[fill,opacity,stroke] duration-300 motion-reduce:transition-none";
  const mono = { className: "font-mono", letterSpacing: 1, fill: "var(--ink-muted)" };
  const gridR = OX + N * CELL + 4;
  /** narrow columns stack the two boxes under a shorter viewBox so the type stays legible */
  const L = compact
    ? {
        w: 520, h: 300,
        box: { x: 300, y: 40, w: 200, h: 70 }, pbox: { x: 300, y: 180, w: 200, h: 70 },
        toModel: `M ${gridR} 75 H 296`, whatIfs: "M 400 114 V 176",
        toPolicy: `M ${gridR} 215 H 296`, action: `M 330 254 V 280 H ${cx(2)} V 264`,
      }
    : {
        w: 900, h: 290,
        box: { x: 370, y: 50, w: 200, h: 70 }, pbox: { x: 690, y: 50, w: 200, h: 70 },
        toModel: `M ${gridR} 95 H 366`, whatIfs: "M 574 95 H 686",
        toPolicy: `M ${gridR} 190 H 730 V 124`, action: `M 850 124 V 240 H ${gridR}`,
      };
  const { box, pbox } = L;

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${L.w} ${L.h}`} className="block w-full" role="img" aria-label={T.aria(pos, modelOn, v)}>
          <defs>
            <marker id="mp-arrow-actual" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M0 0 L8 4 L0 8 z" fill="var(--actual)" />
            </marker>
            <marker id="mp-arrow-imagine" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M0 0 L8 4 L0 8 z" fill="var(--imagine)" />
            </marker>
          </defs>

          {/* the world */}
          {Array.from({ length: N + 1 }, (_, i) => (
            <g key={i}>
              <line x1={OX + i * CELL} y1={OY} x2={OX + i * CELL} y2={OY + N * CELL} stroke="var(--rule)" />
              <line x1={OX} y1={OY + i * CELL} x2={OX + N * CELL} y2={OY + i * CELL} stroke="var(--rule)" />
            </g>
          ))}
          <rect x={OX} y={OY} width={N * CELL} height={N * CELL} fill="none" stroke="var(--rule-strong)" />
          {trail.length > 1 && (
            <path
              d={trail.map((p, i) => `${i ? "L" : "M"} ${cx(p.x)} ${cy(p.y)}`).join(" ")}
              fill="none" stroke="var(--actual)" strokeWidth="2" strokeLinejoin="round"
            />
          )}
          <circle cx={cx(GOAL.x)} cy={cy(GOAL.y)} r="9" fill="none" stroke="var(--ink)" strokeWidth="2" />
          {!compact && (
            <text x={cx(GOAL.x)} y={cy(GOAL.y) - 15} textAnchor="middle" fontSize={10} {...mono}>{T.goal}</text>
          )}
          {ghosts?.map((g, i) => (
            <g key={i}>
              <circle cx={cx(g.at.x)} cy={cy(g.at.y)} r="8" fill="var(--imagine-soft)"
                stroke="var(--imagine)" strokeWidth="1.2" strokeDasharray="3 2" />
              <text x={cx(g.at.x)} y={cy(g.at.y) + 18} textAnchor="middle" fontSize={9 * k}
                className="font-mono tnum" fill="var(--imagine)">{g.score.toFixed(1)}</text>
            </g>
          ))}
          <circle
            cx={cx(pos.x)} cy={cy(pos.y)} r="9" fill="var(--ink)" stroke="var(--paper)" strokeWidth="2"
            className="transition-[cx,cy] duration-300 ease-out motion-reduce:transition-none"
          />

          {/* the model */}
          <g className={fade} opacity={modelOn ? 1 : 0.4}>
            <path d={L.toModel} fill="none" stroke="var(--actual)" strokeWidth="1" markerEnd="url(#mp-arrow-actual)" />
            <path d={L.whatIfs} fill="none" stroke="var(--imagine)" strokeWidth="1" markerEnd="url(#mp-arrow-imagine)" />
            <rect x={box.x} y={box.y} width={box.w} height={box.h} className={fade}
              fill={lit === "model" ? "var(--imagine-soft)" : "none"}
              stroke="var(--imagine)" strokeWidth={lit === "model" ? 2 : 1.2} />
            <text x={box.x + box.w / 2} y={box.y + 30} textAnchor="middle"
              fontSize={13 * k} className="font-mono" fill="var(--ink)">{T.model}</text>
            {!compact && (
              <>
                <text x={(gridR + box.x) / 2} y={84} textAnchor="middle" fontSize={10} {...mono}>{T.state}</text>
                <text x={(box.x + box.w + pbox.x) / 2} y={84} textAnchor="middle" fontSize={10} {...mono}>{T.whatIfs}</text>
              </>
            )}
          </g>
          {!modelOn && (
            <text x={box.x + box.w / 2} y={box.y + 54} textAnchor="middle" fontSize={10 * k} {...mono}>{T.dim}</text>
          )}

          {/* the policy */}
          <path d={L.toPolicy} fill="none" stroke="var(--actual)" strokeWidth="1" markerEnd="url(#mp-arrow-actual)" />
          <path d={L.action} fill="none" stroke="var(--actual)" strokeWidth="1" markerEnd="url(#mp-arrow-actual)" />
          <rect x={pbox.x} y={pbox.y} width={pbox.w} height={pbox.h} className={fade}
            fill={lit === "policy" ? "var(--actual-soft)" : "none"}
            stroke="var(--actual)" strokeWidth={lit === "policy" ? 2 : 1.2} />
          <text x={pbox.x + pbox.w / 2} y={pbox.y + 30} textAnchor="middle"
            fontSize={13 * k} className="font-mono" fill="var(--ink)">{T.policy}</text>
          <text x={pbox.x + pbox.w / 2} y={pbox.y + 54} textAnchor="middle" fontSize={10 * k} {...mono}>
            {modelOn ? T.reads : T.reflex}
          </text>
          {!compact && (
            <>
              <text x={500} y={180} textAnchor="middle" fontSize={10} {...mono}>{T.state}</text>
              <text x={560} y={256} textAnchor="middle" fontSize={10} {...mono}>{T.action}</text>
            </>
          )}
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex flex-wrap gap-2">
          {[
            [T.ask, ask, !modelOn || atGoal],
            [T.act, act, atGoal],
            [T.reset, reset, false],
          ].map(([label, fn, off]) => (
            <button
              key={label as string}
              type="button"
              onClick={fn as () => void}
              disabled={off as boolean}
              className="border border-rule-strong bg-paper px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-50 disabled:hover:border-rule-strong"
            >
              {label as string}
            </button>
          ))}
        </div>
        <label className="ml-auto flex cursor-pointer items-center gap-3">
          <span className="label">{modelOn ? T.on : T.off}</span>
          <button
            type="button"
            role="switch"
            aria-checked={modelOn}
            onClick={toggle}
            className={`relative h-6 w-11 border transition-colors ${modelOn ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"}`}
          >
            <span className={`absolute top-[3px] h-4 w-4 transition-all ${modelOn ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"}`} />
          </button>
        </label>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">{v}</p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        {[[T.calls, calls], [T.steps, steps]].map(([label, n]) => (
          <div key={label as string} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{label}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{n}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
