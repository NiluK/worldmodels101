"use client";

import { useId, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";
import { useSweep } from "./use-sweep";
import { PlayButton } from "./play-button";
import { pickText } from "@/lib/locale-text";

/**
 * Two bills for the same planning job.
 *
 * A planner has to score many candidate action sequences before it commits to
 * one. Planning in pixels renders every frame of every candidate; planning in a
 * learned latent scores a short code per step and renders only the winner,
 * once, afterwards. The figure draws both rows, stacks them as many times as
 * there are sequences, and puts the two costs on one shared scale so the
 * pixel bar can be seen running off the chart well before a hundred.
 *
 * Every number here is a stand-in: eight steps, forty units a rendered frame,
 * one unit a latent code. The ratio is the point, not the figures.
 */

const STEPS = 8;
const FRAME_COST = 40;   // illustrative units per rendered frame
const CODE_COST = 1;     // illustrative units per latent code
const CHART_MAX = 4000;  // the shared scale; the pixel bar leaves it at 13 sequences
const MAX_SEQ = 100;
const STACK_MAX = 5;     // how many copies of a row are drawn behind the front one

const TILE_W = 42;
const TILE_H = 28;
const TILE_GAP = 10;
const CELL = 7;          // 6 by 4 cells fill a 42 by 28 tile
const TICK_W = 4;
const TICK_H = 12;

const fmt = (n: number) => n.toLocaleString("en-GB");

const TEXT = {
  en: {
    oneSeq: "one action sequence, eight steps",
    pixels: "plan in pixels",
    latent: "plan in a latent",
    chosen: "the chosen one",
    chosenSub: "drawn once, after choosing",
    off: "off the chart",
    units: (n: number) => `${fmt(n)} units`,
    copies: (n: number) => `×${n}`,
    slider: "Sequences to score",
    show: "Show the chosen one drawn",
    rSeq: "Sequences",
    rFrames: "Frames rendered, pixels",
    rCodes: "Codes scored, latent",
    rDrawn: "Frames drawn, latent",
    rCostP: "Cost, pixels",
    rCostL: "Cost, latent",
    times: (n: number, m: number) => `${n} × ${m} = ${fmt(n * m)}`,
    v1: "One sequence, and the two bills are close. Rendering one is cheap enough.",
    v2: "A few sequences and the pixel bill is already pulling away. The latent planner paid a fraction and drew one.",
    v3: (n: number) => `${n} sequences and the pixel bill is most of the chart. The latent planner paid a fraction and drew one.`,
    v4: (n: number) => `${n} sequences and the pixel bill has run off the chart. The latent planner scored all of them and drew the winner.`,
    v5: "A hundred sequences. Rendering each one is where the pixel planner goes broke; the latent planner scored all hundred and drew the winner.",
    aria: (n: number, p: number, l: number, off: boolean) =>
      `Two planners scoring ${n} action sequences of eight steps. Planning in pixels renders every frame and costs ${fmt(p)} units${off ? ", off the chart" : ""}. Planning in a latent scores a short code per step, draws only the chosen sequence, and costs ${fmt(l)} units.`,
  },
  zh: {
    oneSeq: "一条动作序列，八步",
    pixels: "在像素里规划",
    latent: "在潜变量里规划",
    chosen: "选中的那条",
    chosenSub: "选定之后只画一次",
    off: "超出图表",
    units: (n: number) => `${fmt(n)} 单位`,
    copies: (n: number) => `×${n}`,
    slider: "要打分的序列数",
    show: "画出选中的那条",
    rSeq: "序列数",
    rFrames: "渲染的帧数，像素",
    rCodes: "打分的编码数，潜变量",
    rDrawn: "画出的帧数，潜变量",
    rCostP: "开销，像素",
    rCostL: "开销，潜变量",
    times: (n: number, m: number) => `${n} × ${m} = ${fmt(n * m)}`,
    v1: "一条序列，两张账单相差不多。只渲染一条还算便宜。",
    v2: "几条序列，像素的账单就已经拉开了。潜变量规划器只付了零头，只画了一条。",
    v3: (n: number) => `${n} 条序列，像素的账单已占去图表的大半。潜变量规划器只付了零头，只画了一条。`,
    v4: (n: number) => `${n} 条序列，像素的账单已经超出图表。潜变量规划器给全部打了分，只画了赢的那条。`,
    v5: "一百条序列。逐条渲染正是像素规划器破产的地方；潜变量规划器给一百条都打了分，只画了赢的那条。",
    aria: (n: number, p: number, l: number, off: boolean) =>
      `两个规划器给 ${n} 条八步的动作序列打分。在像素里规划要渲染每一帧，开销 ${fmt(p)} 单位${off ? "，已超出图表" : ""}。在潜变量里规划每步只打分一个短编码，只画选中的那条，开销 ${fmt(l)} 单位。`,
  },
} as const;

/** a deterministic grey pattern so each step's frame looks like a different picture */
const shade = (step: number, c: number, r: number) => {
  const v = (c * 3 + r * 5 + step * 2 + ((c * r) % 3)) % 7;
  return 0.12 + (v / 6) * 0.5;
};

function FrameTile({ x, y, step, opacity = 1 }: { x: number; y: number; step: number; opacity?: number }) {
  const cells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 6; c++) {
      cells.push(
        <rect key={`${r}-${c}`} x={x + c * CELL} y={y + r * CELL} width={CELL} height={CELL}
          fill="var(--ink)" opacity={shade(step, c, r)} />,
      );
    }
  }
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={TILE_W} height={TILE_H} fill="var(--paper)" />
      {cells}
      <rect x={x + 0.5} y={y + 0.5} width={TILE_W - 1} height={TILE_H - 1} fill="none" stroke="var(--rule-strong)" strokeWidth="1" />
    </g>
  );
}

function CodeTile({ x, y, step, opacity = 1 }: { x: number; y: number; step: number; opacity?: number }) {
  // four ticks, heights varied a little per step so the codes differ
  const x0 = x + (TILE_W - (4 * TICK_W + 3 * 3)) / 2;
  return (
    <g opacity={opacity}>
      {[0, 1, 2, 3].map((i) => {
        const h = TICK_H - ((step * 3 + i * 5) % 3) * 2;
        return (
          <rect key={i} x={x0 + i * (TICK_W + 3)} y={y + TICK_H - h} width={TICK_W} height={h} fill="var(--imagine)" />
        );
      })}
    </g>
  );
}

export function PixelsOrLatent() {
  const [n, setN] = useState(10);
  const [showChosen, setShowChosen] = useState(true);
  const sweep = useSweep({ value: n, min: 1, max: MAX_SEQ, step: 1, setValue: setN });
  const still = useReducedMotion();
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const { ref, compact } = useCompact(600);
  const k = compact ? 1.65 : 1;
  const clipId = useId();

  const framesPixels = n * STEPS;
  const codesLatent = n * STEPS;
  const costPixels = framesPixels * FRAME_COST;
  const costLatent = codesLatent * CODE_COST + STEPS * FRAME_COST;
  const offChart = costPixels > CHART_MAX;
  const copies = Math.min(n, STACK_MAX);

  const verdict =
    n <= 1 ? T.v1
    : n <= 5 ? T.v2
    : !offChart ? T.v3(n)
    : n < MAX_SEQ ? T.v4(n)
    : T.v5;

  /**
   * Two layouts. Wide: label on the left, tiles in the middle, bar on the
   * right, one line per row. Compact: label above, tiles, then the bar below,
   * so nothing has to shrink past legibility at 340px.
   */
  const rowW = STEPS * TILE_W + (STEPS - 1) * TILE_GAP; // 406
  const L = compact
    ? { W: 480, tilesX: 16, barX: 16, barW: 448, rowH: 128, top: 68, labelDy: -12 }
    : { W: 900, tilesX: 200, barX: 650, barW: 226, rowH: 90, top: 60, labelDy: 0 };
  const barH = 10 * k;
  const fs = 10 * k;

  // row origins (y of the tiles' top edge)
  const yPixels = L.top;
  const yLatent = yPixels + L.rowH;
  const yChosen = yLatent + L.rowH;
  const bottom = showChosen ? yChosen + TILE_H : compact ? yLatent + TILE_H + 22 + barH : yLatent + TILE_H;
  const H = bottom + (compact ? 20 : 26);
  const ySeqLabel = compact ? 16 : 22;

  const barFor = (cost: number) => Math.min(cost / CHART_MAX, 1) * L.barW;
  const transition = still ? undefined : "width 220ms ease-out";

  type Kind = "frames" | "codes";
  const tiles = (kind: Kind, y: number, stacked: boolean) => {
    const out = [];
    const depth = stacked ? copies : 1;
    for (let d = depth - 1; d >= 0; d--) {
      const dx = -d * 2.5, dy = -d * 2.5;
      const op = d === 0 ? 1 : 0.22 + (0.45 * (depth - d)) / depth;
      for (let s = 0; s < STEPS; s++) {
        const x = L.tilesX + s * (TILE_W + TILE_GAP) + dx;
        out.push(
          kind === "frames"
            ? <FrameTile key={`${d}-${s}`} x={x} y={y + dy} step={s} opacity={op} />
            : <CodeTile key={`${d}-${s}`} x={x} y={y + (TILE_H - TICK_H) / 2 + dy} step={s} opacity={op} />,
        );
      }
    }
    return out;
  };

  const rowLabel = (text: string, y: number, color = "var(--ink-muted)", sub?: string) =>
    compact ? (
      <text x={L.tilesX} y={y + L.labelDy} className="font-mono" fontSize={fs} letterSpacing="1" fill={color}>
        {sub ? `${text}, ${sub}` : text}
      </text>
    ) : (
      <g>
        <text x={20} y={y + TILE_H / 2 + (sub ? -2 : 4)} className="font-mono" fontSize={fs} letterSpacing="1" fill={color}>
          {text}
        </text>
        {sub && (
          <text x={20} y={y + TILE_H / 2 + 11} className="font-mono" fontSize={fs} letterSpacing="0.4" fill="var(--ink-faint)">
            {sub}
          </text>
        )}
      </g>
    );

  const bar = (cost: number, y: number, fill: string, off: boolean) => {
    const by = compact ? y + TILE_H + 22 : y + (TILE_H - barH) / 2;
    const w = barFor(cost);
    return (
      <g>
        <rect x={L.barX} y={by} width={L.barW} height={barH} fill="var(--paper-sunk)" />
        <rect x={L.barX} y={by} width={w} height={barH} fill={fill} style={{ transition }} />
        {off && (
          <g clipPath={`url(#${clipId})`}>
            {/* a torn end: two paper-coloured slashes across the bar's right edge */}
            <line x1={L.barX + L.barW - 8} y1={by - 2} x2={L.barX + L.barW - 3} y2={by + barH + 2} stroke="var(--paper-raised)" strokeWidth="2.5" />
            <line x1={L.barX + L.barW - 3} y1={by - 2} x2={L.barX + L.barW + 2} y2={by + barH + 2} stroke="var(--paper-raised)" strokeWidth="2.5" />
          </g>
        )}
        <text
          x={compact ? L.barX : L.barX + L.barW}
          y={compact ? by - 6 : by - 5}
          textAnchor={compact ? "start" : "end"}
          className="font-mono tnum" fontSize={fs} letterSpacing="0.5" fill={off ? "var(--imagine)" : "var(--ink-muted)"}
        >
          {off ? `${T.units(cost)}, ${T.off}` : T.units(cost)}
        </text>
      </g>
    );
  };

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${L.W} ${H}`} className="block w-full" role="img"
          aria-label={T.aria(n, costPixels, costLatent, offChart)}>
          <defs>
            <clipPath id={clipId}>
              <rect x={L.barX} y={0} width={L.barW} height={H} />
            </clipPath>
          </defs>

          {/* the one sequence, eight steps */}
          <text x={L.tilesX} y={ySeqLabel} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-faint)">
            {T.oneSeq}
          </text>
          {Array.from({ length: STEPS }, (_, s) => (
            <rect key={s} x={L.tilesX + s * (TILE_W + TILE_GAP)} y={ySeqLabel + 8} width={TILE_W} height={6}
              fill="none" stroke="var(--ink)" strokeWidth="1" />
          ))}
          {!compact && (
            <line x1={L.tilesX + rowW} y1={ySeqLabel + 11} x2={L.barX + L.barW} y2={ySeqLabel + 11} stroke="var(--rule)" strokeWidth="1" />
          )}

          {/* plan in pixels: every frame of every sequence */}
          {rowLabel(T.pixels, yPixels, "var(--ink)")}
          {tiles("frames", yPixels, true)}
          <text x={L.tilesX + rowW + 8} y={yPixels + TILE_H / 2 + 4} className="font-mono tnum" fontSize={fs} fill="var(--ink-muted)">
            {T.copies(n)}
          </text>
          {bar(costPixels, yPixels, "var(--ink)", offChart)}

          {/* plan in a latent: a short code per step */}
          {rowLabel(T.latent, yLatent, "var(--imagine)")}
          {tiles("codes", yLatent, true)}
          <text x={L.tilesX + rowW + 8} y={yLatent + TILE_H / 2 + 4} className="font-mono tnum" fontSize={fs} fill="var(--ink-muted)">
            {T.copies(n)}
          </text>
          {bar(costLatent, yLatent, "var(--imagine)", false)}

          {/* only the chosen one is ever drawn */}
          {showChosen && (
            <g>
              {!compact && (
                <line x1={L.tilesX + 6} y1={yLatent + TILE_H + 4} x2={L.tilesX + 6} y2={yChosen - 4}
                  stroke="var(--rule-strong)" strokeWidth="1" strokeDasharray="2 3" />
              )}
              {rowLabel(T.chosen, yChosen, "var(--ink-muted)", T.chosenSub)}
              {tiles("frames", yChosen, false)}
              <text x={L.tilesX + rowW + 8} y={yChosen + TILE_H / 2 + 4} className="font-mono tnum" fontSize={fs} fill="var(--ink-muted)">
                {T.copies(1)}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex w-full min-w-0 flex-wrap items-center gap-3 sm:w-auto sm:min-w-[16rem] sm:flex-1">
          <span className="label basis-full whitespace-nowrap sm:basis-auto">{T.slider}</span>
          <input
            type="range"
            min={1}
            max={MAX_SEQ}
            value={n}
            onChange={(e) => { sweep.stop(); setN(Number(e.target.value)); }}
            className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-10 text-right !text-ink">{n}</span>
        </label>
        <PlayButton playing={sweep.playing} onClick={sweep.toggle} />

        <label className="flex cursor-pointer items-center gap-3">
          <span className="label">{T.show}</span>
          <button
            type="button"
            role="switch"
            aria-checked={showChosen}
            onClick={() => setShowChosen((v) => !v)}
            className={`relative h-6 w-11 border transition-colors ${
              showChosen ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"
            }`}
          >
            <span
              className={`absolute top-[3px] h-4 w-4 transition-all ${
                showChosen ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"
              }`}
            />
          </button>
        </label>

        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.rSeq, String(n)],
          [T.rFrames, T.times(n, STEPS)],
          [T.rCodes, T.times(n, STEPS)],
          [T.rDrawn, String(STEPS)],
          [T.rCostP, T.units(costPixels)],
          [T.rCostL, T.units(costLatent)],
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
