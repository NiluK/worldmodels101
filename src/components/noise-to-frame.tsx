"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * One frame of a game, made by a diffusion model.
 *
 * The frames before it and the key being held sit on the left as the
 * conditioning. The centre grid starts as seeded noise and is pulled toward a
 * corridor picture one step at a time; the fewer steps you allow, the faster
 * the frame arrives and the more speckle it keeps. The per-step cost and the
 * playable line are stand-ins, chosen so the slider crosses the line in the
 * middle of its range.
 */

const COLS = 24;
const ROWS = 16;
const CELL = 18;
const GX = 236;
const GY = 6;
const W = 680;
const H = ROWS * CELL + 12;
const MAX_STEPS = 20;
const DEFAULT_STEPS = 12;
const MS_PER_STEP = 6;       // illustrative
const PLAYABLE_FPS = 20;     // illustrative
const BAR_MAX_FPS = 60;

const TEXT = {
  en: {
    cleanUp: "Clean up",
    stepOnce: "Step once",
    stepsPerFrame: "Steps per frame",
    conditioning: "conditioning",
    before: "the frames before",
    key: "key held",
    forward: "forward",
    thisFrame: "the frame being made",
    steps: "steps",
    of: "of",
    time: "time per frame",
    ms: "ms",
    fps: "frames a second",
    playable: "playable",
    line: "about 20 a second",
    lineNote: "the playable line, illustrative",
    noisy: "Start from noise. Each step cleans it a little, guided by the frames before and the key.",
    play: "Clean enough to read and fast enough to play. That is the move from watching to playing.",
    slow: "Cleaner, but this many steps is too slow to answer a keypress. You are watching, not playing.",
    rough: "Fast, but rough. The speckle is what fewer steps costs.",
    aria: (s: number, n: number) =>
      `A diffusion model making one game frame from three earlier frames and a held key. Step ${s} of ${n}: ${
        s === 0 ? "pure noise" : s < n ? "partly cleaned" : "finished"
      }.`,
  },
};

/** The picture the noise is pulled toward: a corridor, as ink density 0 to 1. */
function target(c: number, r: number) {
  const u = ((c + 0.5) / COLS) * 2 - 1;
  const v = ((r + 0.5) / ROWS) * 2 - 1;
  const au = Math.abs(u);
  const av = Math.abs(v);
  if (u > 0.42 && u < 0.72 && v > 0.08 && v < 0.5) return 0.85;  // a block on the right
  if (au < 0.22 && av < 0.22) return 0.5;                          // the far wall
  if (Math.abs(au - av) < 0.07) return 0.7;                        // the corridor edges
  if (av > au) return v > 0 ? 0.3 : 0.08;                           // floor, ceiling
  return 0.18;                                                      // side walls
}

/** Seeded so the noise is the same on every render and every reload. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A tiny first-person corridor in outline, for the conditioning frames. */
function Corridor({ x, y, near }: { x: number; y: number; near: number }) {
  const w = 116;
  const h = 74;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const fw = 14;
  const fh = 9;
  const bx = x + w * 0.66;
  const bw = 10 + near * 5;
  const bh = 8 + near * 4;
  return (
    <g stroke="var(--actual)" strokeWidth="1.2" fill="none">
      <rect x={x} y={y} width={w} height={h} />
      <rect x={cx - fw / 2} y={cy - fh / 2} width={fw} height={fh} />
      <path d={`M ${x} ${y + h} L ${cx - fw / 2} ${cy + fh / 2} M ${x + w} ${y + h} L ${cx + fw / 2} ${cy + fh / 2}`} />
      <path d={`M ${x} ${y} L ${cx - fw / 2} ${cy - fh / 2} M ${x + w} ${y} L ${cx + fw / 2} ${cy - fh / 2}`} opacity="0.5" />
      <rect x={bx + near * 3} y={y + h - 10 - bh - near * 3} width={bw} height={bh} fill="var(--actual)" />
    </g>
  );
}

export function NoiseToFrame() {
  const locale = useLocale();
  const t = TEXT[locale as keyof typeof TEXT] ?? TEXT.en;
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const k = compact ? 1.65 : 1;

  const [n, setN] = useState(DEFAULT_STEPS);
  const [s, setS] = useState(0);
  const [running, setRunning] = useState(false);

  const noise = useMemo(() => {
    const rnd = seeded(1993);
    return Array.from({ length: COLS * ROWS }, () => [rnd(), rnd()] as const);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setS((v) => {
        if (v + 1 >= n) setRunning(false);
        return Math.min(v + 1, n);
      });
    }, 120);
    return () => window.clearInterval(id);
  }, [running, n]);


  const cleanUp = () => {
    if (still) { setS(n); setRunning(false); return; }
    setS(0);
    setRunning(true);
  };
  const stepOnce = () => {
    setRunning(false);
    setS((v) => Math.min(v + 1, n));
  };
  const changeSteps = (v: number) => {
    setRunning(false);
    setN(v);
    setS(0);
  };

  const p = s / n;
  const speckle = 0.45 / n;
  const done = s >= n;
  const ms = n * MS_PER_STEP;
  const fps = Math.round(1000 / ms);
  const playable = fps >= PLAYABLE_FPS;
  const verdict = !done ? t.noisy : n < 4 ? t.rough : playable ? t.play : t.slow;

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={t.aria(s, n)}>
          <defs>
            <marker id="ntf-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--ink-muted)" strokeWidth="1" />
            </marker>
          </defs>

          {/* conditioning: three earlier frames and the held key */}
          <Corridor x={12} y={8} near={0} />
          <Corridor x={20} y={30} near={1} />
          <Corridor x={28} y={52} near={2} />
          {!compact && (
            <text x={12} y={146} className="font-mono" fontSize={10 * k} letterSpacing="1" fill="var(--ink-faint)">
              {t.before}
            </text>
          )}
          <g transform="translate(52 176)">
            <rect x={0} y={0} width={60} height={40} rx={3} fill="none" stroke="var(--actual)" strokeWidth="1.2" />
            <path d="M 30 10 L 30 30 M 22 18 L 30 10 L 38 18" fill="none" stroke="var(--actual)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <text x={30} y={56} textAnchor="middle" className="font-mono" fontSize={10 * k} letterSpacing="1" fill="var(--actual)">
              {t.forward}
            </text>
          </g>
          {!compact && (
            <text x={12} y={252} className="font-mono" fontSize={10 * k} letterSpacing="1" fill="var(--ink-faint)">
              {t.key}
            </text>
          )}
          <text x={12} y={H - 6} className="font-mono" fontSize={10 * k} letterSpacing="1" fill="var(--ink-muted)">
            {t.conditioning}
          </text>

          <line x1={170} y1={H / 2} x2={GX - 10} y2={H / 2} stroke="var(--ink-muted)" strokeWidth="1" markerEnd="url(#ntf-arrow)" />

          {/* the frame being made */}
          <rect x={GX} y={GY} width={COLS * CELL} height={ROWS * CELL} fill="var(--paper-sunk)" />
          {noise.map(([n1, n2], i) => {
            const c = i % COLS;
            const r = Math.floor(i / COLS);
            const d = Math.min(1, Math.max(0, (1 - p) * n1 + p * target(c, r) + p * (n2 - 0.5) * speckle));
            return (
              <rect key={i} x={GX + c * CELL} y={GY + r * CELL} width={CELL} height={CELL}
                fill={done ? "var(--imagine)" : "var(--ink)"} fillOpacity={d} />
            );
          })}
          <rect x={GX} y={GY} width={COLS * CELL} height={ROWS * CELL} fill="none"
            stroke={done ? "var(--imagine)" : "var(--rule-strong)"} strokeWidth="1" />
          <text x={GX} y={H - 6} className="font-mono" fontSize={10 * k} letterSpacing="1"
            fill={done ? "var(--imagine)" : "var(--ink-muted)"}>
            {t.thisFrame}
          </text>
        </svg>
      </div>

      <div data-print-hide className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <button type="button" onClick={cleanUp}
          className="label h-10 border border-imagine bg-imagine px-5 !text-paper transition-colors hover:opacity-90">
          {t.cleanUp}
        </button>
        <button type="button" onClick={stepOnce} disabled={done}
          className="label h-10 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-60">
          {t.stepOnce}
        </button>
        <label className="flex min-w-[18rem] flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          <span className="label whitespace-nowrap">{t.stepsPerFrame}</span>
          <span className="flex min-w-[12rem] flex-1 items-center gap-3">
            <input type="range" min={1} max={MAX_STEPS} value={n}
              onChange={(e) => changeSteps(Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
            <span className="label tnum w-8 text-right !text-ink">{n}</span>
          </span>
        </label>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]">{verdict}</p>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-rule bg-rule sm:grid-cols-4">
        {[
          [t.steps, `${s} ${t.of} ${n}`],
          [t.time, `${ms} ${t.ms}`],
          [t.fps, String(fps)],
        ].map(([a, b]) => (
          <div key={a} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{a}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{b}</p>
          </div>
        ))}
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t.playable}</p>
          <svg viewBox="0 0 200 14" className="mt-2 block w-full" aria-hidden="true">
            <rect x={0} y={3} width={200} height={8} fill="var(--paper-sunk)" />
            <rect x={0} y={3} width={(Math.min(fps, BAR_MAX_FPS) / BAR_MAX_FPS) * 200} height={8}
              fill={playable ? "var(--imagine)" : "var(--ink-faint)"} />
            <line x1={(PLAYABLE_FPS / BAR_MAX_FPS) * 200} y1={0} x2={(PLAYABLE_FPS / BAR_MAX_FPS) * 200} y2={14}
              stroke="var(--ink)" strokeWidth="1" />
          </svg>
          <p className="label mt-1 !normal-case !tracking-normal !text-[0.62rem]">
            {t.line}, {t.lineNote}
          </p>
        </div>
      </div>
    </div>
  );
}
