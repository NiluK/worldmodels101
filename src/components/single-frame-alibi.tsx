"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * The single-frame alibi, made visible.
 *
 * Six frames of a rollout, spread evenly from step 0 to the chosen horizon.
 * Each frame is one chair in one room corner, drawn crisp, with a floor line
 * and a shadow, so that any frame on its own looks finished. With identity in
 * hidden state the chair's parameters drift a little with every step, by a
 * fixed deterministic amount, and by step 100 a high-backed slatted chair has
 * become a low round stool. No frame is the mistake; only the strip is. With
 * identity in an object store every frame reads back the frame-0 chair.
 *
 * Nothing here is measured. The chair, the drift and the threshold that
 * decides "same chair" are all illustrative.
 */

const FRAMES = 6;
const MAX_STEP = 100;
const FW = 140; // frame viewBox width
const FH = 132; // frame viewBox height
const FLOOR = 106;
const CX = 90;

/** two or three muted tokens for the seat; never a raw hex */
const FILLS = ["var(--ink-muted)", "var(--actual)", "var(--rule-strong)"] as const;

type Chair = {
  seatH: number;
  seatW: number;
  backH: number;
  rounded: boolean;
  slats: number;
  splay: number;
  fill: number;
};

/**
 * A fixed drift per parameter, as a function of step only, so the same horizon
 * always gives the same six frames. The continuous parameters move linearly;
 * the discrete ones (shape, slats, colour) step at different points along the
 * way, so no single frame carries more than one small change.
 */
function chairAt(step: number): Chair {
  const p = Math.min(1, Math.max(0, step / MAX_STEP));
  return {
    seatH: 36 - 10 * p,
    seatW: 44 - 12 * p,
    backH: 50 - 46 * p,
    rounded: p > 0.5,
    slats: Math.max(1, Math.round(4 - 3 * p)),
    splay: 9 * p,
    fill: p < 0.3 ? 0 : p < 0.65 ? 1 : 2,
  };
}

/** one parameter distance decides "same chair"; back height is the loudest one */
const SAME_THRESHOLD = 8;
const sameChair = (a: Chair, b: Chair) => Math.abs(a.backH - b.backH) < SAME_THRESHOLD;

const TEXT: Record<
  Locale,
  {
    horizon: string;
    where: string;
    hidden: string;
    store: string;
    step: (n: number) => string;
    frame: (i: number, s: number) => string;
    selected: string;
    onItsOwn: string;
    looksFine: string;
    sameQ: string;
    yes: string;
    no: string;
    horizonCell: string;
    steps: (n: number) => string;
    fineCell: string;
    sameCell: string;
    ofSix: (n: number) => string;
    v0: string;
    v1: string;
    v2: string;
    strip: (h: number, hidden: boolean) => string;
  }
> = {
  en: {
    horizon: "Horizon",
    where: "Where identity lives",
    hidden: "hidden state",
    store: "object store",
    step: (n) => `step ${n}`,
    frame: (i, s) => `Frame ${i}, step ${s}`,
    selected: "Selected frame",
    onItsOwn: "This frame on its own",
    looksFine: "looks fine",
    sameQ: "Same chair as frame 1?",
    yes: "yes",
    no: "no",
    horizonCell: "Horizon",
    steps: (n) => `${n} steps`,
    fineCell: "Frames that look fine on their own",
    sameCell: "Frames showing the same chair as frame 1",
    ofSix: (n) => `${n} of 6`,
    v0: "Every frame looks fine, and so far they agree.",
    v1: "Every frame looks fine. Only the strip is wrong: the chair became another chair, and no frame is the mistake.",
    v2: "Every frame looks fine and every frame is the same chair. A stored object is being read back.",
    strip: (h, hidden) =>
      hidden
        ? `Six frames from step 0 to step ${h}, identity in hidden state. The chair drifts a little from frame to frame.`
        : `Six frames from step 0 to step ${h}, identity in an object store. Every frame shows the same chair.`,
  },
  zh: {
    horizon: "预测步长",
    where: "身份存放在哪里",
    hidden: "隐状态",
    store: "对象存储",
    step: (n) => `第 ${n} 步`,
    frame: (i, s) => `第 ${i} 帧，第 ${s} 步`,
    selected: "选中的帧",
    onItsOwn: "单看这一帧",
    looksFine: "看起来没问题",
    sameQ: "和第一帧是同一把椅子吗？",
    yes: "是",
    no: "否",
    horizonCell: "预测步长",
    steps: (n) => `${n} 步`,
    fineCell: "单看没问题的帧",
    sameCell: "与第一帧是同一把椅子的帧",
    ofSix: (n) => `6 帧中的 ${n} 帧`,
    v0: "每一帧都看起来没问题，而且到目前为止它们彼此一致。",
    v1: "每一帧都看起来没问题。错的只有整条胶片：椅子变成了另一把椅子，却没有哪一帧是那个错误。",
    v2: "每一帧都看起来没问题，而且每一帧都是同一把椅子。被读回的是一个存起来的对象。",
    strip: (h, hidden) =>
      hidden
        ? `从第 0 步到第 ${h} 步的六帧，身份放在隐状态里。椅子一帧一帧地慢慢变样。`
        : `从第 0 步到第 ${h} 步的六帧，身份放在对象存储里。每一帧都是同一把椅子。`,
  },
};

function ChairFrame({ chair, step, label, compact }: { chair: Chair; step: number; label: string; compact: boolean }) {
  const seatTop = FLOOR - chair.seatH;
  const half = chair.seatW / 2;
  const postIn = half - 4;
  const backTop = seatTop - chair.backH;
  const hasBack = chair.backH > 7;
  const fill = FILLS[chair.fill];
  // slats sit between the posts, from just under the top rail to just above the seat
  const slatXs = Array.from({ length: chair.slats }, (_, i) => CX - postIn + ((i + 1) * (2 * postIn)) / (chair.slats + 1));
  const railY = backTop + 2;
  const railCtrl = chair.rounded ? railY - 12 : railY;
  return (
    <svg viewBox={`0 0 ${FW} ${FH}`} className="block w-full" aria-hidden="true" focusable="false">
      {/* room corner: a wall edge and the floor */}
      <line x1="30" y1="6" x2="30" y2={FLOOR} stroke="var(--rule-strong)" strokeWidth="1" />
      <line x1="30" y1={FLOOR} x2={FW} y2={FLOOR} stroke="var(--rule-strong)" strokeWidth="1" />
      <line x1="30" y1={FLOOR} x2="4" y2={FLOOR + 16} stroke="var(--rule-strong)" strokeWidth="1" />
      <text x="38" y="17" className="font-mono" fontSize={compact ? 13 : 10} letterSpacing="1" fill="var(--ink-faint)">
        {label}
      </text>

      {/* shadow, the same in every frame */}
      <ellipse cx={CX + 4} cy={FLOOR + 1} rx={half + 8} ry="3.5" fill="var(--ink)" opacity="0.12" />

      {/* back legs, a little inset and shorter, as seen from the front */}
      <line x1={CX - half + 6} y1={seatTop + 4} x2={CX - half + 6 - chair.splay * 0.6} y2={FLOOR - 5}
        stroke="var(--ink-muted)" strokeWidth="1.6" strokeLinecap="round" />
      <line x1={CX + half - 6} y1={seatTop + 4} x2={CX + half - 6 + chair.splay * 0.6} y2={FLOOR - 5}
        stroke="var(--ink-muted)" strokeWidth="1.6" strokeLinecap="round" />

      {/* back: two posts, a rail and slats */}
      {hasBack && (
        <>
          <line x1={CX - postIn} y1={seatTop} x2={CX - postIn} y2={backTop} stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
          <line x1={CX + postIn} y1={seatTop} x2={CX + postIn} y2={backTop} stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
          {chair.backH > 16 &&
            slatXs.map((x) => (
              <line key={x} x1={x} y1={railY + 6} x2={x} y2={seatTop - 3} stroke="var(--ink)" strokeWidth="1.3" />
            ))}
          <path
            d={`M ${CX - postIn} ${railY} Q ${CX} ${railCtrl} ${CX + postIn} ${railY} L ${CX + postIn} ${railY + 5} Q ${CX} ${railCtrl + 5} ${CX - postIn} ${railY + 5} Z`}
            fill={fill}
          />
        </>
      )}

      {/* seat */}
      <rect x={CX - half} y={seatTop} width={chair.seatW} height="6" rx={chair.rounded ? 3 : 0} fill={fill} />

      {/* front legs */}
      <line x1={CX - half + 2} y1={seatTop + 6} x2={CX - half + 2 - chair.splay} y2={FLOOR}
        stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
      <line x1={CX + half - 2} y1={seatTop + 6} x2={CX + half - 2 + chair.splay} y2={FLOOR}
        stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
      <text x={FW - 6} y={FH - 6} textAnchor="end" className="font-mono" fontSize={compact ? 13 : 10} fill="var(--ink-faint)">
        {step}
      </text>
    </svg>
  );
}

export function SingleFrameAlibi() {
  const locale = useLocale();
  const T = TEXT[locale] ?? TEXT.en;
  const { ref, compact } = useCompact(560);
  const [horizon, setHorizon] = useState(MAX_STEP);
  const [hidden, setHidden] = useState(true);
  const [selected, setSelected] = useState(FRAMES - 1);

  const steps = Array.from({ length: FRAMES }, (_, i) => Math.round((i * horizon) / (FRAMES - 1)));
  const first = chairAt(0);
  const chairs = steps.map((s) => (hidden ? chairAt(s) : first));
  const same = chairs.map((c) => sameChair(c, first));
  const sameCount = same.filter(Boolean).length;

  const verdict = !hidden ? T.v2 : sameCount === FRAMES ? T.v0 : T.v1;

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 pb-5 md:px-8">
        <div
          role="group"
          aria-label={T.strip(horizon, hidden)}
          className={`grid gap-2 ${compact ? "grid-cols-3" : "grid-cols-6"}`}
        >
          {chairs.map((c, i) => {
            const on = i === selected;
            return (
              <button
                key={i}
                type="button"
                aria-pressed={on}
                aria-label={T.frame(i + 1, steps[i])}
                onClick={() => setSelected(i)}
                className={`block border bg-paper p-0 text-left transition-colors ${
                  on ? "border-imagine" : "border-rule hover:border-ink"
                }`}
              >
                <ChairFrame chair={c} step={i + 1} label={T.step(steps[i])} compact={compact} />
              </button>
            );
          })}
        </div>
      </div>

      <div data-print-hide className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-[14rem] flex-1 items-center gap-3">
          <span className="label whitespace-nowrap">{T.horizon}</span>
          <input
            type="range"
            min={0}
            max={MAX_STEP}
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-10 text-right !text-ink">{horizon}</span>
        </label>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="label whitespace-nowrap">{T.where}</span>
          <div className="flex">
            {[
              [true, T.hidden],
              [false, T.store],
            ].map(([v, name]) => (
              <button
                key={String(v)}
                type="button"
                aria-pressed={hidden === v}
                onClick={() => setHidden(v as boolean)}
                className={`label whitespace-nowrap border px-3 py-1.5 transition-colors ${
                  hidden === v
                    ? "border-imagine bg-imagine !text-paper"
                    : "border-rule-strong bg-paper !text-ink hover:border-ink"
                } ${v ? "" : "-ml-px"}`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]">{verdict}</p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.selected, T.frame(selected + 1, steps[selected])],
          [T.onItsOwn, T.looksFine],
          [T.sameQ, same[selected] ? T.yes : T.no],
        ].map(([k, v]) => (
          <div key={k} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{k}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.horizonCell, T.steps(horizon)],
          [T.fineCell, T.ofSix(FRAMES)],
          [T.sameCell, T.ofSix(sameCount)],
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
