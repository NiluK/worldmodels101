"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * A regularity copied out of footage.
 *
 * Five training strips each show a thing being dropped. A sixth strip has only
 * its first two frames; pressing Continue fills the other four the way the
 * footage goes. There is no physics anywhere in here: just two spacing rules,
 * one where the gaps between frames grow and one where they stay equal. Flip
 * the footage and the continuation follows it, which is the whole point of the
 * paragraph it sits beside.
 */

type Footage = "gravity" | "steady";

const FRAMES = 6;
const GIVEN = 2;
const TAIL = FRAMES - GIVEN;
const FRAME_U = 34;   // frame height, in drop units
const BALL_U = 1.6;   // ball radius, in drop units
const STEP_MS = 280;

/** start heights and horizontal placement of the ball, one per training strip */
const TRAIN = [
  { y0: 2, x: 0.5 }, { y0: 4.5, x: 0.35 }, { y0: 3, x: 0.62 },
  { y0: 5.5, x: 0.45 }, { y0: 1.5, x: 0.55 },
];
/** the new drop starts from a height that is in none of the strips */
const NEW = { y0: 3.8, x: 0.5 };

/** the two spacing rules; positions in drop units, frame index i from 0 */
const dropAt = (f: Footage, y0: number, i: number) => (f === "gravity" ? y0 + i * i : y0 + 5 * i);
const gapsOf = (f: Footage) =>
  Array.from({ length: TAIL }, (_, k) => dropAt(f, 0, GIVEN + k) - dropAt(f, 0, GIVEN + k - 1));

const SMALL = { u: 1.9, w: 26, gap: 3 };
const BIG = { u: 3, w: 40, gap: 4 };
const stripW = (s: typeof SMALL) => FRAMES * s.w + (FRAMES - 1) * s.gap;

const TEXT = {
  en: {
    training: "training footage",
    gapsGrow: "the gaps grow frame by frame",
    gapsEqual: "the gaps stay equal",
    newDrop: "a new drop",
    given: "given",
    continued: "the model continues",
    footage: "footage",
    real: "real gravity",
    steady: "made up: steady speed",
    switchAria: "use made up footage where things fall at a steady speed",
    go: "Continue",
    reset: "Reset",
    eq: "equations supplied",
    gaps: "gap between frames",
    matches: "matches the footage",
    yes: "yes",
    notYet: "not yet",
    v0: "No equation anywhere. Only footage, and a drop it has not seen.",
    v1: "It speeds up on the way down. The footage did, so the continuation does.",
    v2: "It falls at a steady speed now. The regularity followed the footage, not a law.",
    aria: (f: Footage, n: number) =>
      `Five training strips of a ball being dropped, ${f === "gravity" ? "speeding up as it falls" : "falling at a steady speed"}. A new strip with two frames given and ${n} of four continued by the model${n ? `, ${f === "gravity" ? "speeding up too" : "at a steady speed too"}` : ""}.`,
  },
  zh: {
    training: "训练片段",
    gapsGrow: "帧间距一帧比一帧大",
    gapsEqual: "帧间距保持相等",
    newDrop: "一次新的下落",
    given: "已给出",
    continued: "模型续上的",
    footage: "素材",
    real: "真实重力",
    steady: "编造的：匀速",
    switchAria: "改用编造的素材，东西以匀速下落",
    go: "续上",
    reset: "重置",
    eq: "提供的方程",
    gaps: "帧间距",
    matches: "与素材一致",
    yes: "是",
    notYet: "尚未",
    v0: "哪里都没有方程。只有素材，和一次它没见过的下落。",
    v1: "它在下落途中越来越快。素材如此，续上的部分也如此。",
    v2: "现在它以匀速下落。规律跟着素材走，而不是跟着某条定律。",
    aria: (f: Footage, n: number) =>
      `五段训练片段，各是一个球被放下，${f === "gravity" ? "越落越快" : "匀速下落"}。一段新的片段给出了前两帧，模型续上了四帧中的 ${n} 帧${n ? `，${f === "gravity" ? "同样越落越快" : "同样匀速"}` : ""}。`,
  },
} as const;

function Strip({ x, y, s, y0, bx, footage, filled, fs, label }: {
  x: number; y: number; s: typeof SMALL; y0: number; bx: number; footage: Footage;
  /** frames drawn in --actual; the rest are the model's, up to `filled` */
  filled: number; fs: number; label?: { given: string; continued: string; on: boolean };
}) {
  const h = FRAME_U * s.u;
  const r = BALL_U * s.u;
  const given = label ? GIVEN : FRAMES;
  return (
    <g>
      {Array.from({ length: FRAMES }, (_, i) => {
        const fx = x + i * (s.w + s.gap);
        const shown = i < given || i < given + filled;
        const col = i < given ? "var(--actual)" : "var(--imagine)";
        const cx = fx + bx * s.w;
        const cy = y + dropAt(footage, y0, i) * s.u;
        return (
          <g key={i}>
            <rect x={fx} y={y} width={s.w} height={h} fill={shown ? "var(--paper)" : "url(#cff-hatch)"}
              stroke="var(--rule-strong)" strokeWidth="1" />
            {shown && i > 0 && (
              <line x1={cx - r - 3} y1={y + dropAt(footage, y0, i - 1) * s.u} x2={cx - r - 3} y2={cy}
                stroke={col} strokeWidth="1" opacity="0.7" />
            )}
            {shown && <circle cx={cx} cy={cy} r={r} fill={col} />}
          </g>
        );
      })}
      {label && (
        <>
          <text x={x} y={y + h + fs * 1.5} className="font-mono" fontSize={fs} fill="var(--actual)">
            {label.given}
          </text>
          <text x={x + GIVEN * (s.w + s.gap)} y={y + h + fs * 1.5} className="font-mono" fontSize={fs}
            fill={label.on ? "var(--imagine)" : "var(--ink-faint)"}>
            {label.continued}
          </text>
        </>
      )}
    </g>
  );
}

export function CopiedFromFootage() {
  const locale = useLocale();
  const T = TEXT[locale === "zh" ? "zh" : "en"];
  const reduced = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const [footage, setFootage] = useState<Footage>("gravity");
  const [filled, setFilled] = useState(0);

  // one frame at a time under motion; Continue already put the first one down
  useEffect(() => {
    if (filled === 0 || filled >= TAIL) return;
    const id = window.setTimeout(() => setFilled((f) => Math.min(TAIL, f + 1)), STEP_MS);
    return () => window.clearTimeout(id);
  }, [filled]);

  const go = () => setFilled(reduced ? TAIL : 1);
  const reset = () => setFilled(0);
  const flip = () => { setFootage((f) => (f === "gravity" ? "steady" : "gravity")); setFilled(0); };

  const done = filled >= TAIL;
  const gaps = gapsOf(footage);
  const fs = compact ? 13 : 10.5;

  // layout: training strips in two columns of three; the new drop beside them, or below when compact
  const smallW = stripW(SMALL);
  const colPitch = smallW + 24;
  const rowPitch = FRAME_U * SMALL.u + 14;
  const W = compact ? 420 : 780;
  const tx = compact ? (W - (2 * colPitch - 24)) / 2 : 40;
  const ty = 40;
  const noteY = ty + 3 * rowPitch - 14 + fs * 1.8;
  const bigW = stripW(BIG);
  const bigH = FRAME_U * BIG.u;
  const nx = compact ? (W - bigW) / 2 : 470;
  const ny = compact ? noteY + 56 : 60;
  const H = compact ? ny + bigH + fs * 2.4 : 300;

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={T.aria(footage, filled)}>
          <defs>
            <pattern id="cff-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--rule)" strokeWidth="1.2" />
            </pattern>
          </defs>

          <text x={tx} y={ty - 14} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-faint)">
            {T.training}
          </text>
          {TRAIN.map((d, i) => (
            <Strip key={i} x={tx + (i % 2) * colPitch} y={ty + Math.floor(i / 2) * rowPitch}
              s={SMALL} y0={d.y0} bx={d.x} footage={footage} filled={0} fs={fs} />
          ))}
          <text x={tx} y={noteY} className="font-mono" fontSize={fs} fill="var(--ink-muted)">
            {footage === "gravity" ? T.gapsGrow : T.gapsEqual}
          </text>

          <text x={nx} y={ny - 14} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-faint)">
            {T.newDrop}
          </text>
          <Strip x={nx} y={ny} s={BIG} y0={NEW.y0} bx={NEW.x} footage={footage} filled={filled} fs={fs}
            label={{ given: T.given, continued: T.continued, on: filled > 0 }} />
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <span className="flex cursor-pointer items-center gap-3">
          <span className="label whitespace-nowrap">{T.footage}</span>
          <button
            type="button"
            role="switch"
            aria-checked={footage === "steady"}
            aria-label={T.switchAria}
            onClick={flip}
            className={`relative h-6 w-11 shrink-0 border transition-colors ${
              footage === "steady" ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"
            }`}
          >
            <span
              className={`absolute top-[3px] h-4 w-4 transition-all ${
                footage === "steady" ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"
              }`}
            />
          </button>
          <span className="label !text-ink">{footage === "steady" ? T.steady : T.real}</span>
        </span>
        <div className="flex gap-2">
          <button type="button" onClick={go} disabled={filled > 0}
            className="border border-rule-strong bg-paper px-4 py-1.5 transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rule-strong">
            <span className="label !text-ink">{T.go}</span>
          </button>
          <button type="button" onClick={reset} disabled={filled === 0}
            className="border border-rule-strong bg-paper px-4 py-1.5 transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rule-strong">
            <span className="label !text-ink">{T.reset}</span>
          </button>
        </div>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {!done ? T.v0 : footage === "gravity" ? T.v1 : T.v2}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{T.eq}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">0</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{T.gaps}</p>
          <p className="tnum mt-1 flex gap-3 text-[0.98rem] text-ink">
            {gaps.map((g, k) => (
              <span key={k} style={{ color: k < filled ? "var(--imagine)" : "var(--ink-faint)" }}>
                {k < filled ? g : "·"}
              </span>
            ))}
          </p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{T.matches}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{filled > 0 ? T.yes : T.notYet}</p>
        </div>
      </div>
    </div>
  );
}
