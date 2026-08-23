"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";
import { pickText } from "@/lib/locale-text";

/**
 * Latent actions, in miniature.
 *
 * Twelve before-and-after frame pairs from a toy platformer and no keypress
 * anywhere. Sorting files every pair under one of eight numbered codes, and the
 * same kind of change always lands in the same bin, so four bins fill and four
 * stay empty. After that the codes behave like a controller: press one and the
 * model draws what that code does to a frame it has not seen. The frames, the
 * count and the code numbers are all invented to show the mechanism.
 */

type Kind = "left" | "right" | "jump" | "still";

const FW = 44;
const FH = 32;
const GROUND = 27;
const CHAR = 8;
const slotX = (s: number) => 2 + s * 8;

/** which code each kind of change lands under; chosen, not learned */
const CODE_OF: Record<Kind, number> = { left: 3, right: 7, jump: 2, still: 5 };
const CODES = 8;

/** the training pairs: where the character starts, where blocks sit, what changed */
const PAIRS: { c: number; b: number[]; kind: Kind }[] = [
  { c: 3, b: [0], kind: "left" },
  { c: 1, b: [4], kind: "right" },
  { c: 2, b: [0, 4], kind: "jump" },
  { c: 4, b: [1], kind: "left" },
  { c: 2, b: [], kind: "still" },
  { c: 0, b: [3], kind: "right" },
  { c: 3, b: [1], kind: "jump" },
  { c: 2, b: [4], kind: "left" },
  { c: 3, b: [0], kind: "right" },
  { c: 1, b: [3], kind: "still" },
  { c: 1, b: [4], kind: "jump" },
  { c: 4, b: [0, 2], kind: "left" },
];
/** a layout in none of the pairs: a block, and a ledge the pile never had */
const FRESH = { c: 3, b: [0], ledge: true };

const KIND_OF_CODE = (code: number): Kind | null =>
  (Object.keys(CODE_OF) as Kind[]).find((k) => CODE_OF[k] === code) ?? null;
const COUNT_OF = (code: number) => PAIRS.filter((p) => CODE_OF[p.kind] === code).length;
const IN_USE = Object.keys(CODE_OF).length;

const after = (c: number, kind: Kind) => ({
  x: kind === "left" ? c - 1 : kind === "right" ? c + 1 : c,
  up: kind === "jump",
});

type Strings = {
  pairs: string; noKeys: string; bins: string; code: string; found: string;
  fresh: string; draws: string; noChange: string; never: string;
  press: string; sort: string; reset: string; rPairs: string; rCodes: string;
  rOf: string; rLabels: string; v0: string; v1: string; v2: string;
  aria0: string; aria1: string; aria2: string; ariaEmpty: string;
  kinds: Record<Kind, string>; kindsShort: Record<Kind, string>;
};

const TEXT: Record<string, Strings> = {
  en: {
    pairs: "frame pairs, before and after",
    noKeys: "no keypresses in the data",
    bins: "eight codes",
    code: "code {n}",
    found: "what the reader can see in the pile",
    fresh: "a fresh frame",
    draws: "what the model draws",
    noChange: "no change",
    never: "this code was never needed",
    press: "press a code",
    sort: "Sort the changes",
    reset: "Reset",
    rPairs: "pairs",
    rCodes: "codes in use",
    rOf: "{a} of {b}",
    rLabels: "keypress labels given",
    v0: "Twelve changes and no labels. The model has to file each one under a code.",
    v1: "Four codes cover every change. Nobody told it which code was which, and the piles behave like a controller.",
    v2: "Press a code and the model moves the character. That is the controller it found.",
    aria0: "Twelve before and after frame pairs from a small platform game, unsorted, beside eight empty bins numbered one to eight. No keypress labels.",
    aria1: "The twelve pairs sorted into four of eight bins: every step left in one, every step right in another, every jump in a third, the still ones in a fourth.",
    aria2: "Code {n} pressed. On a fresh frame the model draws the character after {k}.",
    ariaEmpty: "Code {n} pressed. It was never used, so the model draws no change.",
    kinds: { left: "every step left", right: "every step right", jump: "every jump", still: "stayed still" },
    kindsShort: { left: "steps left", right: "steps right", jump: "jumps", still: "stayed still" },
  },
};

const fmt = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

/** one frame: ground, blocks, character. `ghost` draws the character's old place too. */
function Frame({ x, y, c, b, up, ledge, ink, ghost }: {
  x: number; y: number; c: number; b: number[]; up?: boolean; ledge?: boolean;
  ink: string; ghost?: number;
}) {
  const cy = up ? GROUND - CHAR - 9 : GROUND - CHAR;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={FW} height={FH} fill="var(--paper-raised)" stroke="var(--rule-strong)" strokeWidth="1" />
      <line x1="0" y1={GROUND + 0.5} x2={FW} y2={GROUND + 0.5} stroke="var(--ink-muted)" strokeWidth="1" />
      {b.map((s) => (
        <rect key={s} x={slotX(s)} y={GROUND - CHAR} width={CHAR} height={CHAR} fill="var(--rule-strong)" />
      ))}
      {ledge && <rect x={slotX(0)} y={9} width={16} height={4} fill="var(--rule-strong)" />}
      {ghost !== undefined && (
        <rect x={slotX(ghost)} y={GROUND - CHAR} width={CHAR} height={CHAR}
          fill="none" stroke={ink} strokeWidth="1" strokeDasharray="2 2" />
      )}
      <rect x={slotX(c)} y={cy} width={CHAR} height={CHAR} fill={ink} />
    </g>
  );
}

function Arrow({ x, y, gap = 16 }: { x: number; y: number; gap?: number }) {
  return (
    <g stroke="var(--ink-muted)" strokeWidth="1" fill="none">
      <line x1={x + 3} y1={y} x2={x + gap - 3} y2={y} />
      <path d={`M ${x + gap - 6} ${y - 3} L ${x + gap - 3} ${y} L ${x + gap - 6} ${y + 3}`} />
    </g>
  );
}

/** before and after, side by side, drawn with its top-left at the origin */
function Pair({ c, b, kind }: { c: number; b: number[]; kind: Kind }) {
  const a = after(c, kind);
  return (
    <g>
      <Frame x={0} y={0} c={c} b={b} ink="var(--ink)" />
      <Arrow x={FW} y={FH / 2} />
      <Frame x={FW + 16} y={0} c={a.x} b={b} up={a.up} ink="var(--ink)" />
    </g>
  );
}


export function LatentActions() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const k = compact ? 1.65 : 1;
  const [sorted, setSorted] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  /* once the slide is over the pairs are drawn in their bins outright, so the
     final state never depends on a transition having run */
  const [settled, setSettled] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  /* two layouts: side by side when there is room, stacked when there is not */
  const W = compact ? 460 : 900;
  const H = compact ? 656 : 430;
  const cols = compact ? 3 : 2;
  const pairAt = (i: number) => ({
    x: (compact ? 20 : 30) + (i % cols) * (compact ? 150 : 160),
    y: 40 + Math.floor(i / cols) * 44,
  });
  const pairsBottom = 40 + Math.ceil(PAIRS.length / cols) * 44;
  const BIN_W = compact ? 100 : 110;
  const BIN_H = 68;
  const binAt = (code: number) => {
    const i = code - 1;
    return {
      x: (compact ? 20 : 392) + (i % 4) * (BIN_W + (compact ? 8 : 14)),
      y: (compact ? pairsBottom + 72 : 40) + Math.floor(i / 4) * (BIN_H + 44),
    };
  };
  const binsTop = compact ? pairsBottom + 72 : 40;
  const binsBottom = binsTop + 2 * (BIN_H + 44);
  const PV = { x: compact ? 20 : 392, y: compact ? binsBottom + 44 : 350, s: 1.5 };

  const pickedKind = picked === null ? null : KIND_OF_CODE(picked);
  const freshAfter = pickedKind ? after(FRESH.c, pickedKind) : null;
  const ease = still ? "none" : "transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)";

  const sort = () => {
    setSorted(true);
    if (still) setSettled(true);
    else timer.current = window.setTimeout(() => setSettled(true), 700 + PAIRS.length * 50);
  };
  const reset = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setSorted(false);
    setSettled(false);
    setPicked(null);
  };

  const aria = !sorted
    ? T.aria0
    : picked === null
      ? T.aria1
      : pickedKind
        ? fmt(T.aria2, { n: picked, k: T.kinds[pickedKind] })
        : fmt(T.ariaEmpty, { n: picked });

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={aria}>
          {/* the data column */}
          <text x={pairAt(0).x} y={22} className="font-mono" fontSize={10 * k} letterSpacing="1" fill="var(--ink-faint)">
            {T.pairs}
          </text>
          <text x={pairAt(0).x} y={pairsBottom + 14} className="font-mono" fontSize={10 * k} letterSpacing="1" fill="var(--ink-muted)">
            {T.noKeys}
          </text>

          {/* the bins */}
          <text x={binAt(1).x} y={binsTop - 18} className="font-mono" fontSize={10 * k} letterSpacing="1" fill="var(--ink-faint)">
            {T.bins}
          </text>
          {Array.from({ length: CODES }, (_, i) => i + 1).map((code) => {
            const { x, y } = binAt(code);
            const n = COUNT_OF(code);
            const kind = KIND_OF_CODE(code);
            const live = sorted && picked === code;
            return (
              <g key={code}>
                <rect x={x} y={y} width={BIN_W} height={BIN_H} fill="none"
                  stroke={live ? "var(--imagine)" : "var(--rule-strong)"} strokeWidth={live ? 1.6 : 1} />
                <text x={x + 8} y={y + 15} className="font-mono" fontSize={10 * k} letterSpacing="1"
                  fill={live ? "var(--imagine)" : "var(--ink-muted)"}>
                  {fmt(T.code, { n: code })}
                </text>
                {/* one tick per pair filed here */}
                {sorted && Array.from({ length: n }, (_, j) => (
                  <rect key={j} x={x + 8 + j * 6} y={y + 22} width={3} height={7} fill="var(--imagine)" />
                ))}
                {sorted && kind && (
                  <text x={x} y={y + BIN_H + 15} className="font-mono" fontSize={(compact ? 8.5 : 9) * k}
                    fill="var(--ink-muted)">
                    {compact ? T.kindsShort[kind] : T.kinds[kind]}
                  </text>
                )}
              </g>
            );
          })}
          {sorted && (
            <text x={binAt(5).x} y={binsBottom - 8} className="font-mono" fontSize={9 * k}
              fill="var(--ink-faint)">
              {T.found}
            </text>
          )}

          {/* where each pair used to sit */}
          {sorted && PAIRS.map((_, i) => {
            const home = pairAt(i);
            return (
              <rect key={i} x={home.x} y={home.y} width={FW * 2 + 16} height={FH} fill="none"
                stroke="var(--rule)" strokeWidth="0.8" strokeDasharray="2 3" />
            );
          })}

          {/* the pairs, in the column or in their piles */}
          {PAIRS.map((p, i) => {
            const home = pairAt(i);
            const bin = binAt(CODE_OF[p.kind]);
            const rank = PAIRS.slice(0, i).filter((q) => q.kind === p.kind).length;
            const dest = { x: bin.x + 8 + rank * 5, y: bin.y + 36 + rank * 3 };
            if (settled) {
              return (
                <g key={i} transform={`translate(${dest.x} ${dest.y}) scale(0.5)`}>
                  <Pair c={p.c} b={p.b} kind={p.kind} />
                </g>
              );
            }
            return (
              <g key={i}
                style={{
                  transform: sorted
                    ? `translate(${dest.x - home.x}px, ${dest.y - home.y}px) scale(0.5)`
                    : "translate(0px, 0px) scale(1)",
                  transformOrigin: `${home.x}px ${home.y}px`,
                  transition: ease,
                  transitionDelay: still || !sorted ? "0s" : `${i * 0.05}s`,
                }}>
                <g transform={`translate(${home.x} ${home.y})`}>
                  <Pair c={p.c} b={p.b} kind={p.kind} />
                </g>
              </g>
            );
          })}

          {/* a fresh frame, and what the chosen code does to it */}
          <g>
            <text x={PV.x} y={PV.y - 12} className="font-mono" fontSize={10 * k} letterSpacing="1" fill="var(--ink-faint)">
              {T.fresh}
            </text>
            <g transform={`translate(${PV.x} ${PV.y}) scale(${PV.s})`}>
              <Frame x={0} y={0} c={FRESH.c} b={FRESH.b} ledge={FRESH.ledge} ink="var(--ink)" />
              <Arrow x={FW} y={FH / 2} gap={compact ? 14 : 16} />
              {freshAfter && pickedKind ? (
                <Frame x={FW + (compact ? 14 : 16)} y={0} c={freshAfter.x} b={FRESH.b} up={freshAfter.up}
                  ledge={FRESH.ledge} ink="var(--imagine)"
                  ghost={pickedKind === "still" ? undefined : FRESH.c} />
              ) : picked !== null ? (
                <Frame x={FW + (compact ? 14 : 16)} y={0} c={FRESH.c} b={FRESH.b} ledge={FRESH.ledge}
                  ink="var(--ink-faint)" />
              ) : (
                <rect x={FW + (compact ? 14 : 16)} y={0} width={FW} height={FH} fill="none"
                  stroke="var(--rule-strong)" strokeWidth="0.8" strokeDasharray="3 3" />
              )}
            </g>
            {(() => {
              const tx = PV.x + (FW * 2 + (compact ? 14 : 16)) * PV.s + (compact ? 14 : 18);
              const ty = PV.y + 12 * k;
              const lh = 13 * k;
              if (!sorted) return null;
              if (picked === null) {
                return (
                  <text x={tx} y={ty} className="font-mono" fontSize={10 * k} fill="var(--ink-muted)">{T.press}</text>
                );
              }
              return (
                <g className="font-mono">
                  <text x={tx} y={ty} fontSize={10 * k} letterSpacing="1" fill="var(--imagine)">
                    {fmt(T.code, { n: picked })}
                  </text>
                  <text x={tx} y={ty + lh} fontSize={9.5 * k} fill="var(--ink-muted)">
                    {pickedKind ? T.draws : T.noChange}
                  </text>
                  {!pickedKind && (
                    <text x={tx} y={ty + 2 * lh} fontSize={9 * k} fill="var(--ink-faint)">{T.never}</text>
                  )}
                </g>
              );
            })()}
          </g>
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex gap-2">
          <button type="button" onClick={sort} disabled={sorted}
            className="border border-rule-strong bg-paper px-4 py-1.5 transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rule-strong">
            <span className="label !text-ink">{T.sort}</span>
          </button>
          <button type="button" onClick={reset} disabled={!sorted}
            className="border border-rule-strong bg-paper px-4 py-1.5 transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rule-strong">
            <span className="label !text-ink">{T.reset}</span>
          </button>
        </div>

        {/* the bins as buttons; dead until there is something in them */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={T.press}>
          {Array.from({ length: CODES }, (_, i) => i + 1).map((code) => {
            const on = sorted && picked === code;
            return (
              <button key={code} type="button" disabled={!sorted} aria-pressed={on}
                onClick={() => setPicked(code)}
                className={`tnum border px-2.5 py-1 font-mono text-[0.68rem] tracking-[0.08em] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  on
                    ? "border-imagine bg-imagine text-paper"
                    : "border-rule-strong bg-paper text-ink hover:border-ink disabled:hover:border-rule-strong"
                }`}>
                {fmt(T.code, { n: code })}
              </button>
            );
          })}
        </div>

        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {!sorted ? T.v0 : picked === null ? T.v1 : T.v2}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.rPairs, String(PAIRS.length)],
          [T.rCodes, fmt(T.rOf, { a: sorted ? IN_USE : 0, b: CODES })],
          [T.rLabels, "0"],
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
