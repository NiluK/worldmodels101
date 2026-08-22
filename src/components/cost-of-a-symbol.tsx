"use client";

import { useReducedMotion } from "motion/react";
import { useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";

/**
 * Shannon's price list, made draggable.
 *
 * A sender and a receiver share a predictor. Before each symbol both run it,
 * so the sender only has to send enough to pick the right one out of what the
 * predictor already thought was likely. The cost of a symbol given probability
 * p is -log2(p) bits, and that is the only real number in here: the letters on
 * the bar chart are placeholders and say nothing about any language.
 */

/** Slider stops, as fractions so the readout is exact and the cost matches it. */
const STOPS: [number, number][] = [
  [1, 1000], [1, 500], [1, 200], [1, 100], [1, 50], [1, 20], [1, 10], [1, 5], [1, 4], [1, 3],
  [1, 2],
  [2, 3], [3, 4], [4, 5], [9, 10], [19, 20], [49, 50], [99, 100], [199, 200], [499, 500], [999, 1000],
];
const HALF = 10;
const TICKS: { at: number; text: string; essential: boolean }[] = [
  { at: 0, text: "1/1000", essential: true },
  { at: 3, text: "1/100", essential: false },
  { at: 6, text: "1/10", essential: true },
  { at: 10, text: "1/2", essential: true },
  { at: 14, text: "9/10", essential: true },
];

/** The other symbols the predictor had in mind. Weights are arbitrary. */
const OTHERS: { glyph: string; w: number }[] = [
  { glyph: "a", w: 0.18 },
  { glyph: "i", w: 0.26 },
  { glyph: "o", w: 0.12 },
  { glyph: "t", w: 0.2 },
  { glyph: "s", w: 0.09 },
  { glyph: "n", w: 0.15 },
];
const ARRIVED = "e";
const ARRIVED_AT = 3; // position of the arrived symbol among the bars

const MAX_CELLS = 12;

/**
 * Two layouts rather than one scaled down: a 900-unit drawing at 340px puts
 * every label under 5px, so the narrow version is redrawn at 520 units with
 * smaller boxes and the decorative label dropped.
 */
function layout(compact: boolean) {
  const W = compact ? 460 : 900;
  const boxW = compact ? 80 : 128;
  const senderX = compact ? 10 : 28;
  const receiverX = W - senderX - boxW;
  const wireX0 = senderX + boxW;
  const wireX1 = receiverX;
  return {
    W,
    H: compact ? 340 : 300,
    boxW,
    boxH: compact ? 50 : 58,
    senderX,
    receiverX,
    wireX0,
    wireX1,
    wireY: compact ? 248 : 222,
    symbolRest: wireX0 + (wireX1 - wireX0) * 0.3,
    barBase: compact ? 160 : 150,
    barMax: compact ? 96 : 104,
    barW: compact ? 26 : 30,
    barGap: compact ? 40 : 50,
    cellW: compact ? 14 : 18,
    cellH: compact ? 12 : 13,
    cellGap: 4,
    f: {
      title: compact ? 14 : 10,
      glyph: compact ? 17 : 12,
      arrived: 9,
      box: compact ? 13 : 11,
      symbol: compact ? 19 : 15,
      cost: compact ? 14 : 10,
    },
  };
}

const TEXT = {
  en: {
    title: "What the shared predictor said was likely next",
    title1: "What the shared predictor",
    title2: "said was likely next",
    arrived: "the one that arrived",
    sender: "sender",
    receiver: "receiver",
    cost: "cost",
    slider: "How likely the predictor said it was",
    probLabel: "Probability given",
    costLabel: "Cost to send",
    prob: (m: number, n: number) => `${m} in ${n}`,
    bits: (s: string) => `${s} bits`,
    under: "under 0.1 bits",
    v0: "Confident and correct. Almost nothing to send.",
    v1: "Roughly a coin toss. One or two bits.",
    v2: "Confident and wrong. The rare symbol is the dear one.",
    tail: "The price of a symbol is the probability you gave it.",
    join: " ",
    aria: (p: string, c: string) =>
      `A sender, a wire and a receiver, with a bar chart of what the shared predictor expected next. The predictor gave the symbol that arrived a probability of ${p}, so it costs ${c} to send.`,
  },
  zh: {
    title: "共享预测器认为接下来可能出现的符号",
    title1: "共享预测器认为",
    title2: "接下来可能出现的符号",
    arrived: "实际到达的那个",
    sender: "发送方",
    receiver: "接收方",
    cost: "成本",
    slider: "预测器给它的概率",
    probLabel: "给出的概率",
    costLabel: "发送成本",
    prob: (m: number, n: number) => `${n} 分之 ${m}`,
    bits: (s: string) => `${s} 比特`,
    under: "不到 0.1 比特",
    v0: "有把握，而且对了。几乎不用发什么。",
    v1: "差不多是掷硬币。一两个比特。",
    v2: "有把握，却错了。罕见的符号才是贵的。",
    tail: "一个符号的价钱，就是你给它的概率。",
    join: "",
    aria: (p: string, c: string) =>
      `发送方、导线、接收方，上方是共享预测器对下一个符号的预期。预测器给实际到达的符号的概率是${p}，所以发送它要花${c}。`,
  },
} as const;

export function CostOfASymbol() {
  const [i, setI] = useState(HALF);
  const locale = useLocale();
  const T = TEXT[locale] ?? TEXT.en;
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const L = layout(compact);

  const [num, den] = STOPS[i];
  const p = num / den;
  const cost = -Math.log2(p);
  const costText = cost < 0.1 ? T.under : T.bits(cost.toFixed(1));
  const probText = T.prob(num, den);
  const verdict = p >= 0.9 ? T.v0 : p >= 0.25 ? T.v1 : T.v2;

  // bit cells on the wire: whole cells plus one partial, capped
  const whole = Math.floor(cost);
  const frac = cost - whole;
  const needed = whole + (frac > 0 ? 1 : 0);
  const drawn = Math.min(needed, MAX_CELLS);
  const over = needed > MAX_CELLS;
  const cellsW = drawn * L.cellW + (drawn - 1) * L.cellGap;
  const wireMid = (L.wireX0 + L.wireX1) / 2;
  const cellX0 = wireMid - cellsW / 2;

  // bars: the arrived symbol takes p, the others share what is left
  const bars: { glyph: string; h: number; hot: boolean }[] = [];
  OTHERS.forEach((o, j) => {
    if (j === ARRIVED_AT) bars.push({ glyph: ARRIVED, h: p, hot: true });
    bars.push({ glyph: o.glyph, h: o.w * (1 - p), hot: false });
  });
  const barsX0 = L.W / 2 - ((bars.length - 1) * L.barGap) / 2 - L.barW / 2;
  const barsX1 = barsX0 + (bars.length - 1) * L.barGap + L.barW;

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${L.W} ${L.H}`} className="block w-full" role="img"
          aria-label={T.aria(probText, costText)}>
          <defs>
            <marker id="cos-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6" fill="none" stroke="var(--rule-strong)" strokeWidth="1.2" />
            </marker>
          </defs>

          {/* the predictor's list; the title breaks in two when narrow */}
          {(compact ? [T.title1, T.title2] : [T.title]).map((line, n) => (
            <text key={line} x={L.W / 2} y={22 + n * (L.f.title + 6)} textAnchor="middle"
              className="font-mono" fontSize={L.f.title} letterSpacing="1" fill="var(--ink-muted)">
              {line.toUpperCase()}
            </text>
          ))}
          <line x1={barsX0 - 14} y1={L.barBase + 0.5} x2={barsX1 + 14} y2={L.barBase + 0.5}
            stroke="var(--rule-strong)" strokeWidth="1" />
          {bars.map((b, j) => {
            const x = barsX0 + j * L.barGap;
            const h = Math.max(1.5, b.h * L.barMax);
            return (
              <g key={b.glyph}>
                <rect x={x} y={L.barBase - h} width={L.barW} height={h}
                  fill={b.hot ? "var(--imagine)" : "var(--rule-strong)"}
                  style={still ? undefined : { transition: "y 200ms ease-out, height 200ms ease-out" }} />
                <text x={x + L.barW / 2} y={L.barBase + L.f.glyph + 4} textAnchor="middle"
                  className="font-mono" fontSize={L.f.glyph}
                  fill={b.hot ? "var(--imagine)" : "var(--ink-muted)"}>
                  {b.glyph}
                </text>
                {b.hot && !compact && (
                  <text x={x + L.barW / 2} y={L.barBase + 30} textAnchor="middle" className="font-mono"
                    fontSize={L.f.arrived} letterSpacing="1" fill="var(--imagine)">
                    {T.arrived.toUpperCase()}
                  </text>
                )}
              </g>
            );
          })}

          {/* sender and receiver */}
          {[
            { x: L.senderX, label: T.sender },
            { x: L.receiverX, label: T.receiver },
          ].map(({ x, label }) => (
            <g key={label}>
              <rect x={x + 0.5} y={L.wireY - L.boxH / 2 + 0.5} width={L.boxW} height={L.boxH}
                fill="var(--paper)" stroke="var(--ink)" strokeWidth="1" />
              <text x={x + L.boxW / 2} y={L.wireY + 4} textAnchor="middle" className="font-mono"
                fontSize={L.f.box} letterSpacing="1" fill="var(--ink)">
                {label.toUpperCase()}
              </text>
            </g>
          ))}

          {/* the wire */}
          <line x1={L.wireX0} y1={L.wireY + 0.5} x2={L.wireX1 - 2} y2={L.wireY + 0.5}
            stroke="var(--rule-strong)" strokeWidth="1" markerEnd="url(#cos-arrow)" />

          {/* the symbol on its way: parked a third of the way along, and, when
              motion is allowed, drifting from sender to receiver on a loop */}
          <g transform={`translate(${L.symbolRest} 0)`}>
            <g>
              <rect x={-12} y={L.wireY - 13} width={24} height={26} fill="var(--paper-raised)" />
              <text x={0} y={L.wireY + 5} textAnchor="middle" className="font-mono"
                fontSize={L.f.symbol} fill="var(--ink)">
                {ARRIVED}
              </text>
              {!still && (
                <>
                  <animateTransform attributeName="transform" type="translate"
                    from={`${L.wireX0 + 24 - L.symbolRest} 0`} to={`${L.wireX1 - 24 - L.symbolRest} 0`}
                    dur="6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.88;1"
                    dur="6s" repeatCount="indefinite" />
                </>
              )}
            </g>
          </g>

          {/* what it costs, as bit cells under the wire */}
          {Array.from({ length: drawn }, (_, c) => {
            const x = cellX0 + c * (L.cellW + L.cellGap);
            const partial = c === drawn - 1 && frac > 0 && !over;
            const w = partial ? Math.max(2, L.cellW * frac) : L.cellW;
            return (
              <g key={c}>
                <rect x={x + 0.5} y={L.wireY + 14.5} width={L.cellW} height={L.cellH}
                  fill="none" stroke="var(--rule-strong)" strokeWidth="1" />
                <rect x={x} y={L.wireY + 14} width={w} height={L.cellH + 1} fill="var(--imagine)" />
              </g>
            );
          })}
          {over && (
            <text x={cellX0 + cellsW + 8} y={L.wireY + 25} className="font-mono" fontSize={L.f.cost + 3}
              fill="var(--imagine)">
              +
            </text>
          )}
          <text x={wireMid} y={L.wireY + 34 + L.f.cost * 1.4} textAnchor="middle"
            className="font-mono tnum" fontSize={L.f.cost} letterSpacing="1" fill="var(--ink-muted)">
            {`${T.cost}: ${costText}`.toUpperCase()}
          </text>
        </svg>
      </div>

      <div data-print-hide className="mt-2 border-t border-rule px-5 py-4 md:px-8">
        <label className="block">
          <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="label min-w-[12rem]">{T.slider}</span>
            <span className="label tnum ml-auto shrink-0 whitespace-nowrap !text-ink">{probText}</span>
          </span>
          <input
            type="range"
            min={0}
            max={STOPS.length - 1}
            step={1}
            value={i}
            onChange={(e) => setI(Number(e.target.value))}
            aria-valuetext={probText}
            className="mt-3 h-1 w-full cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="relative mt-2 block h-4" aria-hidden="true">
            {TICKS.filter((tk) => tk.essential || !compact).map((tk) => (
              <span key={tk.at} className="label tnum absolute -translate-x-1/2 !tracking-normal"
                style={{ left: `${(tk.at / (STOPS.length - 1)) * 100}%` }}>
                {tk.text}
              </span>
            ))}
          </span>
        </label>

        <p className="label mt-4 !normal-case !tracking-normal !text-[0.8rem]">
          {verdict}{T.join}{T.tail}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        {[
          [T.probLabel, probText],
          [T.costLabel, costText],
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
