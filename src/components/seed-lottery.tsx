"use client";

import { useReducedMotion } from "motion/react";
import { useState } from "react";
import { Room, ROOM_W, ROOM_H } from "./latent-room";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * Locatello's result in a box.
 *
 * Nine rooms, each made from two true factors (how far the wall is, where the
 * gap is), sit as nine points in the square. Each press of Retrain is a fresh
 * seed, and a fresh seed hands the trainer a different pair of axes over the
 * same nine points: the arrows and the lattice turn, the points stay where
 * they are, and the decoder, composing the inverse of the same change, draws
 * the same nine rooms every time. Nothing in the pictures said which axes to
 * pick, so the seed picks them. The rotation (with a mild shear) stands in for
 * what a real trainer does from a different seed; everything is illustrative.
 */

const PAD = 220;
const C = PAD / 2;
/** margin round the square so the axis labels can sit past the arrow tips */
const M = 30;
const ARROW = 78;
const LATTICE = [-70, -35, 35, 70];
const LEVELS = [0.2, 0.5, 0.8];
/** the nine rooms: every pair of (depth, offset) from LEVELS */
const POINTS: [number, number][] = LEVELS.flatMap((d) => LEVELS.map((o) => [d, o] as [number, number]));
const GAP = 14;
const GRID_W = ROOM_W * 3 + GAP * 2;
const GRID_H = ROOM_H * 3 + GAP * 2;

const TEXT = {
  en: {
    aria: (seed: number, meaning: string) =>
      `Nine points in a square with two axis arrows, beside nine small rooms decoded from them. Seed ${seed}. Axis 1 means ${meaning}. The nine rooms are the same as before.`,
    axis1: "axis 1",
    axis2: "axis 2",
    seed: (n: number) => `seed ${n}`,
    pad: "the rooms as points, and this seed's axes",
    rooms: "the nine rooms, decoded",
    retrain: "Retrain (new seed)",
    redrawQ: "Redraw of the nine rooms",
    redrawA: "identical every time",
    meaningQ: "What axis 1 means",
    depth: "how far the wall is",
    gap: "where the gap is",
    mix: "a mix of the two",
    v0: "Press Retrain. Watch the rooms on the right and the arrows on the left.",
    v1: "Same pictures, different axes. Nothing in the pictures told the trainer which axes to pick.",
  },
};

/** small deterministic generator, so seed n always hands out the same axes */
function rng(seed: number) {
  let a = (seed * 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The axes a fresh seed picks: where axis 1 points, and how far axis 2 leans off square. */
function axesFor(seed: number): { theta: number; lean: number } {
  if (seed === 1) return { theta: 0, lean: 0 };
  const r = rng(seed);
  // illustrative: about a third of runs land near a nameable direction
  const theta = r() < 0.34 ? Math.floor(r() * 4) * 90 + (r() - 0.5) * 12 : r() * 360;
  const lean = (r() - 0.5) * 44;
  return { theta, lean };
}

/** the shortest turn from one angle to another, so the arrows never spin the long way round */
function turn(from: number, to: number) {
  const d = (((to - from) % 360) + 540) % 360 - 180;
  return from + d;
}

/** which of the two true factors axis 1 lines up with, if either */
function meaningOf(theta: number): "depth" | "gap" | "mix" {
  const a = ((theta % 180) + 180) % 180;
  const offDepth = Math.min(a, 180 - a);
  if (offDepth <= 10) return "depth";
  if (Math.abs(a - 90) <= 10) return "gap";
  return "mix";
}

const dir = (deg: number) => {
  const r = (deg * Math.PI) / 180;
  // 0 degrees is the depth direction, straight up the square
  return [Math.sin(r), -Math.cos(r)] as const;
};

export function SeedLottery() {
  const locale = useLocale();
  const s = TEXT[locale as keyof typeof TEXT] ?? TEXT.en;
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  // the axis labels sit inside the square, so they grow less than usual when compact
  const k = compact ? 1.3 : 1;
  const [seed, setSeed] = useState(1);
  // cumulative, so each press turns the short way from wherever the arrows are
  const [theta, setTheta] = useState(0);
  const [lean, setLean] = useState(0);

  const retrain = () => {
    const next = seed + 1;
    const a = axesFor(next);
    setSeed(next);
    setTheta((t) => turn(t, a.theta));
    setLean(a.lean);
  };

  const meaning = meaningOf(theta);
  const meaningText = s[meaning];
  const ease = still ? "none" : "transform 0.45s ease";
  const [ux, uy] = dir(theta);
  const [vx, vy] = dir(theta + 90 + lean);
  // label centres sit just past the arrowhead, further out when the text runs along the arrow
  const reach = (x: number, y: number) => ARROW + 10 + 18 * k * Math.abs(x) + 6 * k * Math.abs(y);
  const ru = reach(ux, uy), rv = reach(vx, vy);

  return (
    <div>
      <div
        ref={ref}
        role="img"
        aria-label={s.aria(seed, meaningText)}
        className={`grid gap-6 px-5 pt-6 md:px-8 ${compact ? "grid-cols-1" : "grid-cols-[minmax(0,13rem)_minmax(0,1fr)]"}`}
      >
        {/* the square: nine points, and the axes this seed chose over them */}
        <div className={compact ? "mx-auto w-full max-w-[19rem]" : ""}>
          <svg viewBox={`${-M} ${-M} ${PAD + 2 * M} ${PAD + 2 * M}`} className="block w-full" aria-hidden="true">
            <defs>
              <clipPath id="sl-pad">
                <rect x={0} y={0} width={PAD} height={PAD} />
              </clipPath>
            </defs>
            <rect x={0.5} y={0.5} width={PAD - 1} height={PAD - 1} fill="var(--paper)"
              stroke="var(--rule-strong)" strokeWidth="1" />
            <g clipPath="url(#sl-pad)">
              {/* the lattice of the chosen basis: lines along axis 1 ... */}
              <g style={{ transform: `rotate(${theta}deg)`, transformOrigin: `${C}px ${C}px`, transition: ease }}>
                {LATTICE.map((o) => (
                  <line key={`a${o}`} x1={C + o} y1={-PAD} x2={C + o} y2={PAD * 2}
                    stroke="var(--rule)" strokeWidth="1" />
                ))}
              </g>
              {/* ... and along axis 2, which leans off square when the seed says so */}
              <g style={{ transform: `rotate(${theta + lean}deg)`, transformOrigin: `${C}px ${C}px`, transition: ease }}>
                {LATTICE.map((o) => (
                  <line key={`b${o}`} x1={-PAD} y1={C + o} x2={PAD * 2} y2={C + o}
                    stroke="var(--rule)" strokeWidth="1" />
                ))}
              </g>
            </g>

            {/* the nine rooms, as points; these never move */}
            {POINTS.map(([d, o]) => (
              <circle key={`${d}-${o}`} cx={o * PAD} cy={(1 - d) * PAD} r={4.2}
                fill="var(--ink)" stroke="var(--paper)" strokeWidth="1.5" />
            ))}

            {/* axis 1 */}
            <g style={{ transform: `rotate(${theta}deg)`, transformOrigin: `${C}px ${C}px`, transition: ease }}>
              <line x1={C} y1={C} x2={C} y2={C - ARROW} stroke="var(--imagine)" strokeWidth="2" />
              <path d={`M ${C} ${C - ARROW - 7} l -5 9 l 10 0 z`} fill="var(--imagine)" />
            </g>
            {/* axis 2 */}
            <g style={{ transform: `rotate(${theta + lean}deg)`, transformOrigin: `${C}px ${C}px`, transition: ease }}>
              <line x1={C} y1={C} x2={C + ARROW} y2={C} stroke="var(--imagine)" strokeWidth="2" />
              <path d={`M ${C + ARROW + 7} ${C} l -9 -5 l 0 10 z`} fill="var(--imagine)" />
            </g>
            <circle cx={C} cy={C} r={3} fill="var(--imagine)" />

            {/* labels ride the tips but stay upright */}
            <g style={{ transform: `translate(${C + ux * ru}px, ${C + uy * ru}px)`, transition: ease }}>
              <text textAnchor="middle" dominantBaseline="middle" className="font-mono"
                fontSize={10 * k} fill="var(--imagine)">{s.axis1}</text>
            </g>
            <g style={{ transform: `translate(${C + vx * rv}px, ${C + vy * rv}px)`, transition: ease }}>
              <text textAnchor="middle" dominantBaseline="middle" className="font-mono"
                fontSize={10 * k} fill="var(--imagine)">{s.axis2}</text>
            </g>
          </svg>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <p className="label !text-[0.6rem]">{s.pad}</p>
            <p className="label tnum shrink-0 !text-ink">{s.seed(seed)}</p>
          </div>
        </div>

        {/* the nine rooms, decoded from the same nine points: identical every run */}
        <div>
          <svg viewBox={`0 0 ${GRID_W} ${GRID_H}`} className="block w-full" aria-hidden="true">
            {POINTS.map(([d, o], i) => {
              const col = i % 3, row = Math.floor(i / 3);
              return (
                <g key={`${d}-${o}`} transform={`translate(${col * (ROOM_W + GAP)} ${row * (ROOM_H + GAP)})`}>
                  <rect width={ROOM_W} height={ROOM_H} fill="var(--paper-sunk)" />
                  <Room z={[d, o]} />
                </g>
              );
            })}
          </svg>
          <p className="label mt-2 !text-[0.6rem]">{s.rooms}</p>
        </div>
      </div>

      <div data-print-hide className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <button
          type="button"
          onClick={retrain}
          className="label border border-rule-strong bg-paper px-3 py-1.5 !text-ink hover:border-ink"
        >
          {s.retrain}
        </button>
        <p className="label !normal-case !tracking-normal !text-[0.8rem]">{seed > 1 ? s.v1 : s.v0}</p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{s.redrawQ}</p>
          <p className="mt-1 text-[0.98rem] leading-snug text-ink">{s.redrawA}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{s.meaningQ}</p>
          <p className="mt-1 text-[0.98rem] leading-snug text-ink">{meaningText}</p>
        </div>
      </div>
    </div>
  );
}
