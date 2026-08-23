"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * Dyna's loop, run twice.
 *
 * A grid world with the target in the far corner. Each lap: the current policy
 * walks from the start, the cells it touched become the model's coverage, and
 * the next policy is trained inside that model. The toy stand-in for "trained
 * inside the model" is a walk that heads for the covered cell nearest the
 * target and explores from there, so the policy can only aim at places the
 * model has been. Lap one is a random walk, which is why the first model knows
 * the floor near the start and nothing about the target. With improvement off,
 * every lap is that same random walk and the coverage stops growing.
 */

const COLS = 12;
const ROWS = 8;
const STEPS = 40;
const CELL = 40;
const OX = 10;
const OY = 20;
const W = COLS * CELL + OX * 2;
const H = ROWS * CELL + OY * 2;
const START: [number, number] = [0, ROWS - 1];
const TARGET: [number, number] = [COLS - 1, 0];
const TARGET_IDX = TARGET[1] * COLS + TARGET[0];
const BIAS = 0.7;     // chance of a step toward the model's edge
const NOVELTY = 0.5;  // chance of preferring an unseen cell while exploring
const STEP_MS = 32;
const PHASE_MS = 480;

const TEXT = {
  en: {
    run: "Run a lap",
    reset: "Reset",
    improve: "Improve the policy",
    phases: { act: "act in the world", fit: "fit model", train: "train policy in the model", out: "take the behaviour back out" },
    lap: "Lap",
    seen: "Cells the model has seen",
    seenVal: (n: number, total: number) => `${n} of ${total}`,
    covered: "Target covered",
    yes: "yes",
    no: "no",
    start: "start",
    target: "target",
    before: "The model only knows where the agent has been, so a policy trained inside it cannot find the target yet.",
    after: (n: number) => `Lap ${n}: the better policy went further, and the model now covers the target.`,
    same: "The same policy every lap brings back the same data, so the model never learns the rest of the world.",
    aria: (lap: number, n: number, total: number, hit: boolean) =>
      `A ${COLS} by ${ROWS} grid world with the start bottom left and the target top right. ${lap} ${lap === 1 ? "lap" : "laps"} run, the model has seen ${n} of ${total} cells, target ${hit ? "covered" : "not covered"}.`,
  },
} as const;

type Phase = keyof typeof TEXT.en.phases;
const PHASES: Phase[] = ["act", "fit", "train", "out"];
type Lap = { path: number[]; improved: boolean };

/** mulberry32: small, seeded, and the same in every browser */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const idx = (c: number, r: number) => r * COLS + c;
const cx = (i: number) => OX + (i % COLS) * CELL + CELL / 2;
const cy = (i: number) => OY + Math.floor(i / COLS) * CELL + CELL / 2;
const manhattan = (a: [number, number], b: [number, number]) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * One lap's walk. Lap one, and every lap without improvement, is the same
 * seeded random walk. An improved lap heads for the covered cell nearest the
 * target, then explores outward from it, preferring cells the model has not seen.
 */
function walk(lap: number, improve: boolean, covered: Set<number>): number[] {
  const improved = improve && lap > 1;
  const r = rng(improved ? lap * 7919 + 17 : 7936);
  let goal: [number, number] | null = null;
  if (improved) {
    let best = Infinity;
    for (const i of covered) {
      const c: [number, number] = [i % COLS, Math.floor(i / COLS)];
      const d = manhattan(c, TARGET);
      if (d < best) { best = d; goal = c; }
    }
  }
  let pos: [number, number] = START;
  const path = [idx(...pos)];
  const seen = new Set(path);
  for (let s = 0; s < STEPS; s++) {
    const nbrs = DIRS
      .map(([dx, dy]) => [pos[0] + dx, pos[1] + dy] as [number, number])
      .filter(([c, rr]) => c >= 0 && c < COLS && rr >= 0 && rr < ROWS);
    let pick: [number, number];
    if (goal && manhattan(pos, goal) > 0 && r() < BIAS) {
      const g = goal;
      const d0 = manhattan(pos, g);
      const better = nbrs.filter((n) => manhattan(n, g) < d0);
      pick = better[Math.floor(r() * better.length)];
    } else if (goal && r() < NOVELTY) {
      const fresh = nbrs.filter((n) => !covered.has(idx(...n)) && !seen.has(idx(...n)));
      pick = fresh.length ? fresh[Math.floor(r() * fresh.length)] : nbrs[Math.floor(r() * nbrs.length)];
    } else {
      pick = nbrs[Math.floor(r() * nbrs.length)];
    }
    pos = pick;
    path.push(idx(...pos));
    seen.add(idx(...pos));
  }
  return path;
}

const polyline = (cells: number[]) => cells.map((i) => `${cx(i)},${cy(i)}`).join(" ");

export function SecondLap() {
  const locale = useLocale();
  const T = TEXT[locale as keyof typeof TEXT] ?? TEXT.en;
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const k = compact ? 1.65 : 1;

  const [laps, setLaps] = useState<Lap[]>([]);
  const [improve, setImprove] = useState(true);
  const [revealed, setRevealed] = useState(STEPS);
  const [phase, setPhase] = useState<Phase | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => { window.clearTimeout(t); window.clearInterval(t); });
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  /** first visit of every cell: which lap, which step. Coverage is the key set. */
  const first = useMemo(() => {
    const m = new Map<number, { lap: number; step: number }>();
    laps.forEach(({ path }, li) => path.forEach((c, s) => { if (!m.has(c)) m.set(c, { lap: li + 1, step: s }); }));
    return m;
  }, [laps]);

  const lap = laps.length;
  const last = laps[lap - 1];
  const shown = (c: number) => {
    const f = first.get(c);
    return !!f && (f.lap < lap || f.step <= revealed);
  };
  const seenCount = Array.from(first.keys()).filter(shown).length;
  const hitLap = laps.findIndex((l) => l.path.includes(TARGET_IDX)) + 1;
  const hit = hitLap > 0 && shown(TARGET_IDX);

  const run = () => {
    const n = lap + 1;
    const path = walk(n, improve, new Set(first.keys()));
    setLaps([...laps, { path, improved: improve && n > 1 }]);
    clearTimers();
    if (still) { setRevealed(STEPS); setPhase(null); return; }
    setRevealed(0);
    setPhase("act");
    let s = 0;
    const id = window.setInterval(() => {
      s += 1;
      setRevealed(s);
      if (s < STEPS) return;
      window.clearInterval(id);
      PHASES.slice(1).forEach((p, i) =>
        timers.current.push(window.setTimeout(() => setPhase(p), i * PHASE_MS)));
      timers.current.push(window.setTimeout(() => setPhase(null), (PHASES.length - 1) * PHASE_MS));
    }, STEP_MS);
    timers.current.push(id);
  };

  const reset = () => {
    clearTimers();
    setLaps([]);
    setRevealed(STEPS);
    setPhase(null);
  };

  const sameTwice = lap >= 2 && !laps[lap - 1].improved && !laps[lap - 2].improved;
  const verdict = hit ? T.after(hitLap) : sameTwice ? T.same : T.before;
  const agent = last ? last.path[Math.min(revealed, STEPS)] : null;

  return (
    <div>
      <div ref={ref} className="px-4 pt-5 md:px-8">
        {/* the four steps of the loop; the live one is inked while a lap runs */}
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1" aria-hidden="true">
          {PHASES.map((p, i) => (
            <span key={p} className={`label tnum ${phase === p ? "!text-imagine" : phase ? "!text-ink-faint" : ""}`}>
              {i + 1} {T.phases[p]}
            </span>
          ))}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full max-w-[38rem]" role="img"
          aria-label={T.aria(lap, seenCount, COLS * ROWS, hit)}>
          {/* what the model has seen */}
          {Array.from(first.keys()).filter(shown).map((c) => (
            <rect key={c} x={cx(c) - CELL / 2} y={cy(c) - CELL / 2} width={CELL} height={CELL} fill="var(--actual-soft)" />
          ))}
          {/* hairline cells */}
          {Array.from({ length: COLS + 1 }, (_, i) => (
            <line key={`v${i}`} x1={OX + i * CELL} y1={OY} x2={OX + i * CELL} y2={OY + ROWS * CELL} stroke="var(--rule)" strokeWidth="1" />
          ))}
          {Array.from({ length: ROWS + 1 }, (_, i) => (
            <line key={`h${i}`} x1={OX} y1={OY + i * CELL} x2={OX + COLS * CELL} y2={OY + i * CELL} stroke="var(--rule)" strokeWidth="1" />
          ))}
          {/* earlier laps, faint, so the reach of each lap can be compared */}
          {laps.slice(0, -1).map((l, i) => (
            <polyline key={i} points={polyline(l.path)} fill="none" stroke="var(--actual)" strokeWidth={1.2 * k}
              strokeLinejoin="round" opacity="0.3" />
          ))}
          {last && (
            <polyline points={polyline(last.path.slice(0, revealed + 1))} fill="none" stroke="var(--actual)"
              strokeWidth={1.6 * k} strokeLinejoin="round" />
          )}
          {/* start and target */}
          <rect x={cx(idx(...START)) - 7} y={cy(idx(...START)) - 7} width="14" height="14" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
          <text x={cx(idx(...START))} y={H - 6} textAnchor="middle" className="font-mono" fontSize={9.5 * k} letterSpacing="1" fill="var(--ink-faint)">
            {T.start}
          </text>
          <circle cx={cx(TARGET_IDX)} cy={cy(TARGET_IDX)} r="9" fill={hit ? "var(--imagine-soft)" : "none"} stroke="var(--imagine)" strokeWidth="2.5" />
          <text x={cx(TARGET_IDX)} y={OY - 7} textAnchor="middle" className="font-mono" fontSize={9.5 * k} letterSpacing="1" fill="var(--imagine)">
            {T.target}
          </text>
          {/* the agent */}
          {agent !== null && agent !== undefined && (
            <circle cx={cx(agent)} cy={cy(agent)} r={5 * Math.min(k, 1.3)} fill="var(--actual)" stroke="var(--paper)" strokeWidth="2" />
          )}
        </svg>
      </div>

      <div data-print-hide className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={run}
            className="label border border-rule-strong bg-paper px-4 py-1.5 !text-ink transition-colors hover:border-ink">
            {T.run}
          </button>
          <button type="button" onClick={reset} disabled={lap === 0}
            className="label border border-rule-strong bg-paper px-4 py-1.5 !text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-60">
            {T.reset}
          </button>
        </div>
        <label className="flex cursor-pointer items-center gap-3">
          <span className="label">{T.improve}</span>
          <button type="button" role="switch" aria-checked={improve} onClick={() => setImprove(!improve)}
            className={`relative h-6 w-11 border transition-colors ${improve ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"}`}>
            <span className={`absolute top-[3px] h-4 w-4 transition-all ${improve ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"}`} />
          </button>
        </label>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">{verdict}</p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.lap, String(lap)],
          [T.seen, T.seenVal(seenCount, COLS * ROWS)],
          [T.covered, hit ? T.yes : T.no],
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
