"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * The same junction as PixelBlur, described rather than drawn.
 *
 * Two futures, a car turning left and a car turning right, each written as a
 * short list of numbers. Seven of the eight entries are the same in both, so
 * a predictor working in description space can state them outright; only the
 * turn entry is open, and it stays open rather than being averaged away. The
 * pixel ghost is still here for comparison: the switch flips between the two
 * targets and the middle panel shows what each one forces the prediction to be.
 *
 * The lists are illustrative. Nothing here is a measured embedding.
 */

const W = 200;
const H = 150;

/** Entry names and the value both futures share; `turn` is the one that differs. */
const ENTRIES = ["road", "speed", "junction", "car", "lane", "light", "weather", "turn"] as const;
const SHARED_VALUES = [0.8, 0.5, 0.9, 0.7, 0.3, 0.6, 0.2];
const TURN = { left: -1, right: 1 };
/** The leaf-like entries: nothing a driver decides depends on them. */
const DROPPABLE = new Set<number>([5, 6]);

type Strings = {
  left: string;
  right: string;
  ghost: string;
  predicted: string;
  outright: string;
  open: string;
  what: string;
  pixels: string;
  description: string;
  switchAria: string;
  drop: string;
  dropAria: string;
  share: string;
  shareN: string;
  openLabel: string;
  openN: string;
  dropped: string;
  none: string;
  droppedN: string;
  vPixels: string;
  vDesc: string;
  vDrop: string;
  note: string;
  entries: Record<(typeof ENTRIES)[number], string>;
  aria: (desc: boolean, drop: boolean) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    left: "turns left",
    right: "turns right",
    ghost: "the average picture, which never happens",
    predicted: "the predicted description",
    outright: "predicted outright",
    open: "still open: left or right",
    what: "What is predicted",
    pixels: "pixels",
    description: "description",
    switchAria: "Predict the description instead of the pixels",
    drop: "drop what no decision needs",
    dropAria: "Drop the entries no decision depends on",
    share: "entries the two futures share",
    shareN: "7 of 8",
    openLabel: "entries still open",
    openN: "1 of 8, kept explicit",
    dropped: "dropped as irrelevant",
    none: "none",
    droppedN: "2 of 8: light, weather",
    vPixels: "Averaging two pictures gives a picture of neither.",
    vDesc: "The two descriptions agree on seven entries, so those are predicted outright. The eighth is still open, and the description does not pretend otherwise.",
    vDrop: "Seven entries are predicted outright, one is kept open, and two that no decision needs are dropped. Nothing downstream is graded on them.",
    note: "the lists are illustrative",
    entries: {
      road: "road", speed: "speed", junction: "junction", car: "car",
      lane: "lane", light: "light", weather: "weather", turn: "turn",
    },
    aria: (desc, drop) =>
      `Two futures at a junction, a car turning left and a car turning right, each written as an eight-entry description. Seven entries agree and only the turn entry differs. ${
        desc
          ? "The prediction is a description: seven entries predicted outright, the turn entry left open."
          : "The prediction is the average picture, both futures drawn at half strength."
      }${drop ? " Light and weather are dropped as irrelevant." : ""}`,
  },
  zh: {
    left: "向左转",
    right: "向右转",
    ghost: "平均图像，它从不会发生",
    predicted: "预测出的描述",
    outright: "直接预测出来",
    open: "仍未定：左或右",
    what: "预测的是什么",
    pixels: "像素",
    description: "描述",
    switchAria: "预测描述而不是像素",
    drop: "丢掉决策用不到的",
    dropAria: "丢掉没有任何决策依赖的条目",
    share: "两个未来共有的条目",
    shareN: "8 个里的 7 个",
    openLabel: "仍未定的条目",
    openN: "8 个里的 1 个，明确保留",
    dropped: "作为无关项丢掉",
    none: "无",
    droppedN: "8 个里的 2 个：光线、天气",
    vPixels: "把两张图平均，得到的是一张谁也不是的图。",
    vDesc: "两份描述在七个条目上一致，所以这七个被直接预测出来。第八个仍未定，描述也不假装它已定。",
    vDrop: "七个条目直接预测出来，一个保持未定，两个决策用不到的被丢掉。下游没有任何东西会按它们打分。",
    note: "列表仅为示意",
    entries: {
      road: "路面", speed: "速度", junction: "路口", car: "车",
      lane: "车道", light: "光线", weather: "天气", turn: "转向",
    },
    aria: (desc, drop) =>
      `路口处的两个未来，一辆车向左转，一辆车向右转，各自写成一份八个条目的描述。七个条目一致，只有转向这一项不同。${
        desc ? "预测的是一份描述：七个条目直接预测出来，转向一项保持未定。" : "预测的是平均图像，两个未来各以一半强度画出。"
      }${drop ? "光线和天气作为无关项被丢掉。" : ""}`,
  },
};

/** The junction from PixelBlur: a road, a fork, and the car gone one way. */
function Scene({ up, opacity = 1, ghost = false }: { up: boolean; opacity?: number; ghost?: boolean }) {
  const y = up ? 42 : 108;
  const other = up ? 108 : 42;
  return (
    <g opacity={opacity}>
      <path d="M 24 75 L 92 75" stroke="var(--ink)" strokeWidth="1.4" opacity={0.4} />
      <path d={`M 92 75 L 168 ${other}`} stroke="var(--rule-strong)" strokeWidth="1" strokeDasharray="2 4" />
      <path d={`M 92 75 L 168 ${y}`} stroke="var(--ink)" strokeWidth="1.4"
        opacity={ghost ? 0.25 : 0.4} strokeDasharray={ghost ? "3 3" : undefined} />
      <circle cx={168} cy={y} r={11} fill="var(--imagine)" />
    </g>
  );
}

/** One future's description: eight entries, the last one the only place they differ. */
function Description({ turn, drop, k, names }: {
  turn: number; drop: boolean; k: number; names: Strings["entries"];
}) {
  const values = [...SHARED_VALUES, turn];
  const pitch = 24.5;
  const base = 34;
  return (
    <svg viewBox={`0 0 ${W} 70`} className="mt-2 block w-full" aria-hidden>
      {values.map((v, i) => {
        const x = 2 + i * pitch;
        const dropped = drop && DROPPABLE.has(i);
        const h = Math.abs(v) * 18;
        return (
          <g key={i} opacity={dropped ? 0.3 : 1}>
            <rect x={x} y={14} width={22} height={40} fill="var(--paper-sunk)"
              stroke={i === 7 ? "var(--ink)" : "none"} strokeWidth="1" />
            <rect x={x + 7} y={v >= 0 ? base - h : base} width={8} height={h} fill="var(--actual)" />
            <line x1={x} y1={base} x2={x + 22} y2={base} stroke="var(--rule-strong)" strokeWidth="0.6" />
            <text x={x + 11} y={9} textAnchor="middle" className="font-mono tnum" fontSize={7 * k} fill="var(--ink)">
              {i === 7 ? (v > 0 ? "+1" : "-1") : v.toFixed(1)}
            </text>
            <text x={x + 11} y={i % 2 ? 68 : 61} textAnchor="middle" className="font-mono"
              fontSize={6 * k} fill={i === 7 ? "var(--ink)" : "var(--ink-faint)"}>
              {names[ENTRIES[i]]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** What a predictor working in description space can say: seven entries outright, one left open. */
function PredictedDescription({ drop, k, T }: { drop: boolean; k: number; T: Strings }) {
  const pitch = 22;
  const x0 = 14;
  const base = 78;
  return (
    <g>
      <defs>
        <pattern id="sd-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="var(--imagine)" strokeWidth="1.2" />
        </pattern>
      </defs>
      {/* bracket over the seven shared entries */}
      <path d={`M ${x0} 30 v -4 H ${x0 + 6 * pitch + 19} v 4`} fill="none" stroke="var(--imagine)" strokeWidth="0.8" />
      <text x={x0 + (6 * pitch + 19) / 2} y={19} textAnchor="middle" className="font-mono"
        fontSize={7 * k} fill="var(--imagine)">{T.outright}</text>
      {SHARED_VALUES.map((v, i) => {
        const x = x0 + i * pitch;
        const dropped = drop && DROPPABLE.has(i);
        return (
          <g key={i} opacity={dropped ? 0.3 : 1}>
            <rect x={x} y={base - 24} width={19} height={48} fill="var(--paper)" opacity={0.5} />
            <rect x={x + 5} y={base - v * 22} width={9} height={v * 22} fill="var(--imagine)" />
            <text x={x + 9.5} y={i % 2 ? 120 : 112} textAnchor="middle" className="font-mono"
              fontSize={6 * k} fill="var(--ink-faint)">{T.entries[ENTRIES[i]]}</text>
          </g>
        );
      })}
      {/* the turn entry: both values still possible, so neither is drawn */}
      <rect x={x0 + 7 * pitch} y={base - 24} width={19} height={48} fill="url(#sd-hatch)"
        stroke="var(--imagine)" strokeWidth="0.8" />
      <text x={x0 + 7 * pitch + 9.5} y={120} textAnchor="middle" className="font-mono"
        fontSize={6 * k} fill="var(--ink)">{T.entries.turn}</text>
      <line x1={x0} y1={base} x2={x0 + 8 * pitch - 3} y2={base} stroke="var(--rule-strong)" strokeWidth="0.6" />
      <text x={x0 + 8 * pitch - 3} y={140} textAnchor="end" className="font-mono"
        fontSize={7 * k} fill="var(--imagine)">{T.open}</text>
    </g>
  );
}

function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onToggle}
      className={`relative h-6 w-11 shrink-0 border transition-colors ${on ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"}`}>
      <span className={`absolute top-[3px] h-4 w-4 transition-all ${on ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"}`} />
    </button>
  );
}

export function SharedDescription() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const still = useReducedMotion();
  /**
   * Three tiers. Wide: the three panels in a row, as PixelBlur. Mid: the two
   * futures side by side and the prediction beneath them, so the pair still
   * reads as a pair. Narrow: one column. The small viewBox scales up rather
   * than down below the wide tier, so type only needs a light nudge.
   */
  const { ref: wideRef, compact: mid } = useCompact(720);
  const { ref: narrowRef, compact: narrow } = useCompact(480);
  const k = mid ? 1.2 : 1;
  const [desc, setDesc] = useState(false);
  const [drop, setDrop] = useState(false);

  const side = narrow ? "mx-auto w-full max-w-[22rem]" : "";
  const middle = narrow
    ? "order-3 mx-auto w-full max-w-[22rem]"
    : mid ? "order-3 col-span-2 mx-auto w-full max-w-[22rem]" : "order-2";
  const cols = narrow ? "grid-cols-1 gap-6" : mid ? "grid-cols-2 gap-4" : "grid-cols-3 gap-4";
  const verdict = desc ? (drop ? T.vDrop : T.vDesc) : T.vPixels;

  return (
    <div ref={wideRef}>
      <div ref={narrowRef} className="px-5 pt-6 md:px-8">
        <div role="img" aria-label={T.aria(desc, drop)} className={`grid ${cols}`}>
          <div className={`order-1 ${side}`}>
            <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-hidden>
              <rect width={W} height={H} fill="var(--paper-sunk)" />
              <Scene up opacity={desc ? 0.35 : 1} />
            </svg>
            <p className="label mt-2 !text-[0.58rem]">{T.left}</p>
            <Description turn={TURN.left} drop={drop} k={k} names={T.entries} />
          </div>

          <div className={middle}>
            <motion.svg key={desc ? "d" : "p"} viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-hidden
              initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
              <rect width={W} height={H} fill="var(--paper-sunk)" />
              {desc ? (
                <PredictedDescription drop={drop} k={k} T={T} />
              ) : (
                <>
                  <Scene up opacity={0.5} ghost />
                  <Scene up={false} opacity={0.5} ghost />
                </>
              )}
            </motion.svg>
            <p className="label mt-2 !text-[0.58rem] !text-imagine">{desc ? T.predicted : T.ghost}</p>
          </div>

          <div className={`${narrow ? "order-2" : mid ? "order-2" : "order-3"} ${side}`}>
            <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-hidden>
              <rect width={W} height={H} fill="var(--paper-sunk)" />
              <Scene up={false} opacity={desc ? 0.35 : 1} />
            </svg>
            <p className="label mt-2 !text-[0.58rem]">{T.right}</p>
            <Description turn={TURN.right} drop={drop} k={k} names={T.entries} />
          </div>
        </div>
        <p className="label mt-4 text-right !text-[0.58rem]">{T.note}</p>
      </div>

      <div data-print-hide className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="label">{T.what}</span>
          <span className="flex items-center gap-3">
            <span className={`label ${desc ? "" : "!text-ink"}`}>{T.pixels}</span>
            <Switch on={desc} onToggle={() => setDesc((v) => !v)} label={T.switchAria} />
            <span className={`label ${desc ? "!text-ink" : ""}`}>{T.description}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="label">{T.drop}</span>
          <Switch on={drop} onToggle={() => setDrop((v) => !v)} label={T.dropAria} />
        </div>
        <motion.p key={verdict} aria-live="polite"
          initial={still ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
          className="label basis-full !normal-case !tracking-normal !text-[0.8rem]">
          {verdict}
        </motion.p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.share, T.shareN],
          [T.openLabel, T.openN],
          [T.dropped, drop ? T.droppedN : T.none],
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
