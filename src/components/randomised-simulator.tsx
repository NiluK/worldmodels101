"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId, useMemo, useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * Domain randomisation, on one axis.
 *
 * A simulator draws the same scene over and over with the colour and the
 * camera changed; the real world is one fixed sample. Fold colour and tilt into
 * a single number, 0 to 100, and the question becomes geometric: does the real
 * sample fall inside the band the policy trained on? Make the simulator vary
 * more than reality does and nothing the policy learned depends on one version.
 *
 * The axis, the numbers and the thumbnails are illustrative. The claim is the
 * text's.
 */

type Strings = {
  sim: string;
  real: string;
  realTick: string;
  axis: string;
  bracket: string;
  vary: string;
  train: string;
  widen: string;
  rRange: string;
  rReal: string;
  rInside: string;
  yes: string;
  no: string;
  untrained: string;
  range: (lo: number, hi: number) => string;
  vPre: string;
  vOut: string;
  vIn: string;
  vWiden: string;
  aria: (lo: number, hi: number, trained: { a: number; b: number; inside: boolean } | null) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    sim: "simulator",
    real: "real world",
    realTick: "real",
    axis: "scene variation",
    bracket: "what the policy can handle",
    vary: "How much the simulator varies",
    train: "Train",
    widen: "Widen as it learns",
    rRange: "Simulator range",
    rReal: "Real world",
    rInside: "Real scene inside the trained range",
    yes: "yes",
    no: "no",
    untrained: "untrained",
    range: (lo, hi) => `${lo} to ${hi}`,
    vPre: "Press Train to see what the policy can handle.",
    vOut: "The policy only ever saw one version of the scene. The real one is not that version.",
    vIn: "The simulator varied more than reality does, so nothing the policy learned depends on one version of it.",
    vWiden: "The range widened on its own as the policy improved.",
    aria: (lo, hi, t) =>
      `Six simulator scenes spread over scene variation ${lo} to ${hi}, and one real scene fixed at ${REAL}.` +
      (t
        ? ` The trained policy can handle ${t.a} to ${t.b}, and the real scene is ${t.inside ? "inside" : "outside"} that range.`
        : " Not trained yet."),
  },
  zh: {
    sim: "模拟器",
    real: "真实世界",
    realTick: "真实",
    axis: "场景变化",
    bracket: "策略能应付的范围",
    vary: "模拟器变化多大",
    train: "训练",
    widen: "边学边放宽",
    rRange: "模拟器范围",
    rReal: "真实世界",
    rInside: "真实场景在训练范围内",
    yes: "是",
    no: "否",
    untrained: "尚未训练",
    range: (lo, hi) => `${lo} 到 ${hi}`,
    vPre: "按「训练」，看看策略能应付什么。",
    vOut: "策略只见过场景的一种版本，而真实的那一个不是这种版本。",
    vIn: "模拟器的变化比现实还大，所以策略学到的东西不依赖于它的任何一个版本。",
    vWiden: "随着策略进步，范围自己放宽了。",
    aria: (lo, hi, t) =>
      `六个模拟器场景分布在场景变化 ${lo} 到 ${hi} 之间，一个真实场景固定在 ${REAL}。` +
      (t ? `训练后的策略能应付 ${t.a} 到 ${t.b}，真实场景${t.inside ? "在" : "不在"}这个范围内。` : "尚未训练。"),
  },
};

const W = 740;
const H = 236;
const N = 6;
const THUMB = { w: 80, h: 66, y: 30, gap: 10, x0: 24 };
const DIVIDER = 590;
const REAL_X = 626;
const AXIS = { y: 192, x0: 30, x1: 710 };
const REAL = 55;
/** the simulator's band sits off to one side of the real scene on purpose */
const CENTRE = 35;
/** how much the band grows per press when the switch is on */
const GROW = 16;

const ax = (v: number) => AXIS.x0 + (v / 100) * (AXIS.x1 - AXIS.x0);

/** small deterministic PRNG so the figure behaves the same every time */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function band(width: number) {
  const lo = Math.max(0, CENTRE - width / 2);
  const hi = Math.min(100, CENTRE + width / 2);
  return { lo, hi };
}

/** six draws spread across the band, evenly but not neatly, with the ends near the edges */
function sample(seed: number, lo: number, hi: number) {
  const rnd = mulberry32(seed * 7919 + 11);
  return Array.from({ length: N }, (_, i) => {
    const u = (i + (rnd() - 0.5) * 0.6) / (N - 1);
    return lo + Math.min(1, Math.max(0, u)) * (hi - lo);
  });
}

/**
 * One tiny scene: a cube on a table. The scene variation number is folded into
 * a lightness (the stand-in for colour and lighting) and a camera tilt.
 */
function Scene({ x, v, stroke }: { x: number; v: number; stroke: string }) {
  const tilt = ((v - 50) / 50) * 7;
  const shade = 0.45 * (1 - v / 100);
  const cube = 0.85 - 0.6 * (v / 100);
  const { w, h, y } = THUMB;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} fill="var(--paper-sunk)" />
      <rect width={w} height={h} fill="var(--ink)" opacity={shade} />
      <g transform={`translate(${w / 2} ${h / 2 + 6}) skewX(${tilt.toFixed(1)})`}>
        <line x1={-w / 2} y1={14} x2={w / 2} y2={14} stroke="var(--rule-strong)" strokeWidth="1" />
        <rect x={-11} y={-8} width={22} height={22} fill="var(--ink)" opacity={cube} />
        <polygon points="-11,-8 -5,-14 17,-14 11,-8" fill="var(--ink)" opacity={cube * 0.7} />
        <polygon points="11,-8 17,-14 17,8 11,14" fill="var(--ink)" opacity={cube * 0.85} />
      </g>
      <rect width={w} height={h} fill="none" stroke={stroke} strokeWidth="1" />
    </g>
  );
}

export function RandomisedSimulator() {
  const uid = useId();
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const still = useReducedMotion();
  const { ref, compact } = useCompact(520);
  const k = compact ? 1.65 : 1;

  const [width, setWidth] = useState(15);
  const [widen, setWiden] = useState(false);
  const [grown, setGrown] = useState(0);
  const [presses, setPresses] = useState(0);
  const [trained, setTrained] = useState<{ a: number; b: number; widened: boolean } | null>(null);

  const eff = Math.min(100, width + grown);
  const { lo, hi } = band(eff);
  const samples = useMemo(() => sample(presses, lo, hi), [presses, lo, hi]);

  function train() {
    // the Rubik's Cube version: the band grows on its own as the policy improves
    const g = widen ? Math.min(100, grown + GROW) : grown;
    const next = Math.min(100, width + g);
    const b = band(next);
    const s = sample(presses + 1, b.lo, b.hi);
    setGrown(g);
    setPresses((p) => p + 1);
    setTrained({ a: Math.min(...s), b: Math.max(...s), widened: widen && g > 0 });
  }

  function toggleWiden() {
    setWiden((w) => !w);
    if (widen) setGrown(0);
  }

  const inside = trained ? trained.a <= REAL && REAL <= trained.b : null;
  const verdict = !trained
    ? T.vPre
    : (inside ? T.vIn : T.vOut) + (trained.widened ? " " + T.vWiden : "");

  const fade = still ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.35 } };
  const fs = 10 * k;

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={T.aria(Math.round(lo), Math.round(hi), trained ? { a: Math.round(trained.a), b: Math.round(trained.b), inside: !!inside } : null)}>

          {/* panel labels */}
          <text x={THUMB.x0} y={18} className="font-mono" fontSize={fs} letterSpacing="1.5" fill="var(--imagine)">
            {T.sim.toUpperCase()}
          </text>
          <text x={REAL_X + THUMB.w} y={18} textAnchor="end" className="font-mono" fontSize={fs} letterSpacing="1.5" fill="var(--actual)">
            {T.real.toUpperCase()}
          </text>

          {/* six simulator draws, sorted so they read left to right along the axis */}
          <motion.g key={presses} {...fade}>
            {[...samples].sort((p, q) => p - q).map((v, i) => (
              <Scene key={i} x={THUMB.x0 + i * (THUMB.w + THUMB.gap)} v={v} stroke="var(--imagine)" />
            ))}
          </motion.g>

          <line x1={DIVIDER} y1={12} x2={DIVIDER} y2={THUMB.y + THUMB.h + 10} stroke="var(--rule-strong)" strokeWidth="1" />

          {/* the one fixed sample, and its thread down to the axis */}
          <Scene x={REAL_X} v={REAL} stroke="var(--actual)" />
          <path
            d={`M ${REAL_X + THUMB.w / 2} ${THUMB.y + THUMB.h} V ${AXIS.y - 66} H ${ax(REAL).toFixed(1)} V ${AXIS.y - 14}`}
            fill="none" stroke="var(--actual)" strokeWidth="1" strokeDasharray="2 3" />

          {/* axis */}
          <line x1={AXIS.x0} y1={AXIS.y} x2={AXIS.x1} y2={AXIS.y} stroke="var(--rule-strong)" strokeWidth="1" />
          <rect x={ax(lo)} y={AXIS.y - 6} width={Math.max(1, ax(hi) - ax(lo))} height={12} fill="var(--imagine-soft)" />
          {samples.map((v, i) => (
            <line key={i} x1={ax(v)} y1={AXIS.y - 9} x2={ax(v)} y2={AXIS.y + 9} stroke="var(--imagine)" strokeWidth="1.5" />
          ))}
          <line x1={ax(REAL)} y1={AXIS.y - 14} x2={ax(REAL)} y2={AXIS.y + 14} stroke="var(--actual)" strokeWidth="2.5" />
          <text x={ax(REAL)} y={AXIS.y + 28} textAnchor="middle" className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--actual)">
            {`${T.realTick.toUpperCase()} ${REAL}`}
          </text>
          <text x={AXIS.x0} y={AXIS.y + 28} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-faint)">
            {compact ? "0" : `${T.axis.toUpperCase()} 0`}
          </text>
          <text x={AXIS.x1} y={AXIS.y + 28} textAnchor="end" className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-faint)">
            100
          </text>

          {/* the bracket: the span the policy actually saw */}
          {trained && (
            <motion.g key={`b${presses}`} {...fade}>
              <path
                d={`M ${ax(trained.a).toFixed(1)} ${AXIS.y - 22} v -10 H ${ax(trained.b).toFixed(1)} v 10`}
                fill="none" stroke="var(--ink)" strokeWidth="1.5" />
              <text
                x={Math.min(Math.max(ax((trained.a + trained.b) / 2), 120 * k), W - 120 * k)}
                y={AXIS.y - 40} textAnchor="middle" className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink)"
                stroke="var(--paper-raised)" strokeWidth="4" paintOrder="stroke">
                {T.bracket.toUpperCase()}
              </text>
            </motion.g>
          )}
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-[16rem] flex-1 flex-wrap items-center gap-3">
          <span className="label basis-full whitespace-nowrap sm:basis-auto">{T.vary}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-8 text-right !text-ink">{width}</span>
        </label>

        <button
          type="button"
          onClick={train}
          className="label h-10 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink"
        >
          {T.train}
        </button>

        <span className="flex cursor-pointer items-center gap-3">
          <span className="label" id={`${uid}-widen`}>{T.widen}</span>
          <button
            type="button"
            role="switch"
            aria-checked={widen}
            aria-labelledby={`${uid}-widen`}
            onClick={toggleWiden}
            className={`relative h-6 w-11 border transition-colors ${
              widen ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"
            }`}
          >
            <span
              className={`absolute top-[3px] h-4 w-4 transition-all ${
                widen ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"
              }`}
            />
          </button>
        </span>

        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.rRange, T.range(Math.round(lo), Math.round(hi))],
          [T.rReal, String(REAL)],
          [T.rInside, trained ? (inside ? T.yes : T.no) : T.untrained],
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
