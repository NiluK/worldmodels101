"use client";

import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";
import { pickText } from "@/lib/locale-text";

/**
 * The leaf problem, as a ledger.
 *
 * A coarse road scene is drawn twice: what a pixel model predicted for the
 * next second, and what the next second held. The car ahead moves the way
 * anyone would expect, so the model gets it nearly right. Every leaf and
 * every ripple on the puddle takes a new shade nobody could have called, so
 * the model is wrong on each of them. A squared-error loss does not know
 * which cells matter. It adds them all up, and the ledger on the right shows
 * where the total lands. The shades, the errors and the shares are
 * illustrative; the shape of the split is the point.
 */

const COLS = 20;
const ROWS = 12;
const N = COLS * ROWS;
const CELL = 10;
const W = COLS * CELL;
const H = ROWS * CELL;
const HORIZON = 4; // rows 0..3 are sky

/** The road, row by row from the horizon down: [first col, last col]. */
const ROAD: Record<number, [number, number]> = {
  4: [8, 11], 5: [7, 12], 6: [7, 13], 7: [6, 13],
  8: [5, 14], 9: [5, 15], 10: [4, 15], 11: [3, 16],
};
const EDGE_DEPTH = 2;           // road cells this close to the verge count as the edge
const CAR_COLS: [number, number] = [9, 11];
const CAR_ROWS = 2;
const CAR_TOP_ROW = 9;          // where the car starts; it climbs one row per second
const CAR_CYCLE = 4;            // and comes round again so the figure never runs out of road
/** Puddle cells, in the order they are filled as the slider rises. Interior road only. */
const PUDDLE: [number, number][] = [
  [10, 12], [10, 13], [11, 13], [11, 12], [9, 12], [11, 14], [10, 7], [11, 6],
];
const LEVELS = 4;               // shades a leaf or ripple can take
/** The model's small residual on the things it did predict. Illustrative. */
const ERR_CAR = 0.15;
const ERR_EDGE = 0.12;
const DRIVER_THRESHOLD = 20;    // percent of the error below which the verdict flips

type Kind = "sky" | "kerb" | "road" | "edge" | "car" | "leaf" | "puddle";

function hash(a: number, b: number, c: number) {
  let x = (Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 2246822519)) | 0;
  x = Math.imul(x ^ (x >>> 15), 2246822507);
  x = Math.imul(x ^ (x >>> 13), 3266489909);
  return (x ^ (x >>> 16)) >>> 0;
}

const isRoad = (r: number, c: number) => r >= HORIZON && c >= ROAD[r][0] && c <= ROAD[r][1];
const isEdge = (r: number, c: number) =>
  isRoad(r, c) && (c - ROAD[r][0] < EDGE_DEPTH || ROAD[r][1] - c < EDGE_DEPTH);

/**
 * Foliage grows in from both edges of the frame, bottom row first, so a low
 * slider gives a hedge and a high one gives trees meeting over the road.
 */
const FOLIAGE_ORDER: number[] = (() => {
  const out: number[] = [];
  for (let d = 0; d < COLS / 2; d++) {
    for (let r = ROWS - 1; r >= 0; r--) {
      for (const c of [d, COLS - 1 - d]) if (!isRoad(r, c)) out.push(r * COLS + c);
    }
  }
  return out;
})();

/**
 * Shade of a flickering cell at second t. Each second it jumps to a shade at
 * least two steps from the one before, so a leaf that changes changes
 * visibly, and which way it goes is decided by the hash and nothing else.
 */
function shadeAt(i: number, t: number) {
  let s = hash(i, 0, 7) % LEVELS;
  for (let k = 1; k <= t; k++) {
    const far = [0, 1, 2, 3].filter((x) => Math.abs(x - s) >= 2);
    s = far[hash(i, k, 3) % far.length];
  }
  return s;
}

type Cell = { kind: Kind; prev: number; now: number; err: number };

function buildFrame(tick: number, share: number) {
  const kinds: Kind[] = Array.from({ length: N }, (_, i) => {
    const r = Math.floor(i / COLS), c = i % COLS;
    if (r < HORIZON) return "sky";
    if (!isRoad(r, c)) return "kerb";
    return isEdge(r, c) ? "edge" : "road";
  });
  const carRow = CAR_TOP_ROW - (tick % CAR_CYCLE);
  for (let r = carRow; r < carRow + CAR_ROWS; r++)
    for (let c = CAR_COLS[0]; c <= CAR_COLS[1]; c++) kinds[r * COLS + c] = "car";

  const target = Math.round((share / 100) * N);
  const puddles = Math.max(2, Math.min(PUDDLE.length, Math.round(target * 0.06)));
  PUDDLE.slice(0, puddles).forEach(([r, c]) => { kinds[r * COLS + c] = "puddle"; });
  FOLIAGE_ORDER.slice(0, Math.min(target - puddles, FOLIAGE_ORDER.length)).forEach((i) => { kinds[i] = "leaf"; });

  let driver = 0, noise = 0, driverCells = 0, noiseCells = 0;
  const cells: Cell[] = kinds.map((kind, i) => {
    if (kind === "leaf" || kind === "puddle") {
      const prev = shadeAt(i, tick - 1), now = shadeAt(i, tick);
      const err = ((now - prev) / (LEVELS - 1)) ** 2;
      noise += err; noiseCells++;
      return { kind, prev, now, err };
    }
    const err = kind === "car" ? ERR_CAR : kind === "edge" ? ERR_EDGE : 0;
    if (err) { driver += err; driverCells++; }
    return { kind, prev: 0, now: 0, err };
  });
  const total = driver + noise;
  return {
    cells,
    driverPct: total ? (100 * driver) / total : 0,
    noisePct: total ? (100 * noise) / total : 0,
    driverFrame: (100 * driverCells) / N,
    noiseFrame: (100 * noiseCells) / N,
  };
}

const TEXT = {
  en: {
    predicted: "what the model predicted",
    happened: "what happened next",
    error: "where the error landed",
    errorSub: "each cell tinted by its squared error",
    driverRow: "pixels a driver cares about",
    driverSub: "the car, the road edge",
    noiseRow: "pixels no decision depends on",
    noiseSub: "leaves, puddle, light",
    ofError: (n: string) => `${n} of the error`,
    ofFrame: (n: string) => `${n} of the frame`,
    next: "Next second",
    slider: "foliage and water in the frame",
    second: "second",
    rdDriver: "share of the error on the car and road edge",
    rdNoise: "share on leaves and water",
    vLow: "Most of the error, and so most of the push on the weights, is on pixels no decision depends on.",
    vHigh: "Push the slider up. The more of the frame is leaves and water, the more the loss is about leaves and water.",
    under: "under 5%",
    over: "over 95%",
    illustrative: "shades, errors and shares are illustrative",
    aria: (t: number, d: string, l: string) =>
      `A coarse road scene drawn twice, as the model predicted it and as it happened, with a third panel tinting each cell by its squared error. At second ${t}, ${d} of the error is on the car and road edge and ${l} is on leaves and water.`,
  },
  zh: {
    predicted: "模型预测的画面",
    happened: "下一秒实际的画面",
    error: "误差落在哪里",
    errorSub: "每格按平方误差着色",
    driverRow: "司机在意的像素",
    driverSub: "前车、路缘",
    noiseRow: "没有任何决定依赖的像素",
    noiseSub: "树叶、水洼、光影",
    ofError: (n: string) => `占误差的 ${n}`,
    ofFrame: (n: string) => `占画面的 ${n}`,
    next: "下一秒",
    slider: "画面里的树叶和水",
    second: "第几秒",
    rdDriver: "落在前车和路缘上的误差份额",
    rdNoise: "落在树叶和水上的份额",
    vLow: "大部分误差，也就是对权重的大部分推力，都落在没有任何决定依赖的像素上。",
    vHigh: "把滑块往上推。画面里树叶和水越多，损失就越是关于树叶和水。",
    under: "不到 5%",
    over: "超过 95%",
    illustrative: "色调、误差和份额均为示意",
    aria: (t: number, d: string, l: string) =>
      `一幅粗略的道路场景画了两次：模型的预测与实际发生的情况，第三格把每个单元按平方误差着色。第 ${t} 秒，${d} 的误差落在前车和路缘上，${l} 落在树叶和水上。`,
  },
};

const TERRAIN = ["var(--terrain-1)", "var(--terrain-2)", "var(--terrain-3)", "var(--terrain-4)"];

function fill(kind: Kind, shade: number) {
  switch (kind) {
    case "sky": return "var(--paper)";
    case "kerb": return "var(--rule)";
    case "road": return "var(--rule-strong)";
    case "edge": return "var(--rule-strong)";
    case "car": return "var(--actual)";
    case "leaf": return TERRAIN[shade];
    case "puddle": return "var(--paper-sunk)";
  }
}
const fillOpacity = (kind: Kind) => (kind === "road" ? 0.45 : kind === "edge" ? 0.7 : 1);

function Panel({ label, sub, className = "", children }: {
  label: string; sub?: string; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-hidden>
        <rect width={W} height={H} fill="var(--paper)" />
        {children}
      </svg>
      <p className="label mt-2 !text-[0.58rem]">{label}</p>
      {sub && <p className="label !text-[0.58rem] !normal-case !tracking-normal">{sub}</p>}
    </div>
  );
}

/** One pass over the grid. `which` picks the shade a flickering cell shows. */
function Grid({ cells, which }: { cells: Cell[]; which: "prev" | "now" }) {
  return (
    <>
      {cells.map((cell, i) => {
        const x = (i % COLS) * CELL, y = Math.floor(i / COLS) * CELL;
        const shade = cell[which];
        return (
          <g key={i}>
            <rect x={x} y={y} width={CELL} height={CELL} fill={fill(cell.kind, shade)} fillOpacity={fillOpacity(cell.kind)} />
            {cell.kind === "puddle" && shade > 0 && (
              <rect x={x} y={y} width={CELL} height={CELL} fill="var(--ink-faint)" fillOpacity={shade * 0.1} />
            )}
          </g>
        );
      })}
    </>
  );
}

const round5 = (x: number) => Math.round(x / 5) * 5;

export function LeafLedger() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const still = useReducedMotion();
  const { ref, compact } = useCompact(720);
  const [tick, setTick] = useState(1);
  const [share, setShare] = useState(30);

  const frame = useMemo(() => buildFrame(tick, share), [tick, share]);

  const pct = (x: number) => {
    const r = round5(x);
    return r === 0 ? T.under : r === 100 ? T.over : `${r}%`;
  };
  const driverStr = pct(frame.driverPct);
  const noiseStr = pct(frame.noisePct);
  const verdict = frame.driverPct < DRIVER_THRESHOLD ? T.vLow : T.vHigh;

  const fade = still ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } };
  const barMove = still ? undefined : "width 300ms ease";

  const rows: [string, string, number, number][] = [
    [T.driverRow, T.driverSub, frame.driverPct, frame.driverFrame],
    [T.noiseRow, T.noiseSub, frame.noisePct, frame.noiseFrame],
  ];

  return (
    <div>
      <div ref={ref} className={`grid gap-6 px-4 pt-6 md:px-8 ${compact ? "grid-cols-1" : "grid-cols-[minmax(0,5fr)_minmax(0,3fr)]"}`}>
        <div role="img" aria-label={T.aria(tick, driverStr, noiseStr)}
          className={`grid gap-3 ${compact ? "grid-cols-2" : "grid-cols-3"}`}>
          <Panel label={T.predicted}>
            <Grid cells={frame.cells} which="prev" />
          </Panel>
          <Panel label={T.happened}>
            <motion.g key={tick} {...fade}>
              <Grid cells={frame.cells} which="now" />
            </motion.g>
          </Panel>
          <Panel label={T.error} sub={T.errorSub} className={compact ? "col-span-2" : ""}>
            <motion.g key={tick} {...fade}>
              {frame.cells.map((cell, i) => (
                <rect key={i} x={(i % COLS) * CELL} y={Math.floor(i / COLS) * CELL} width={CELL} height={CELL}
                  fill={cell.err > 0 ? "var(--imagine)" : "none"} fillOpacity={Math.min(1, cell.err)}
                  stroke="var(--rule)" strokeWidth="0.4" />
              ))}
            </motion.g>
          </Panel>
        </div>

        {/* the ledger: where a squared-error loss says the error is */}
        <div className="flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-4">
            {rows.map(([row, sub, errPct, framePct]) => (
              <div key={row}>
                <p className="label !text-ink">{row}</p>
                <p className="label !text-[0.7rem] !normal-case !tracking-normal">{sub}</p>
                <div className="mt-2 h-1.5 w-full bg-rule">
                  <div className="h-full bg-imagine" style={{ width: `${errPct}%`, transition: barMove }} />
                </div>
                <p className="label tnum mt-1.5 !text-ink">{T.ofError(pct(errPct))}</p>
                <p className="label tnum">{T.ofFrame(`${round5(framePct)}%`)}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="label !text-[0.8rem] !normal-case !tracking-normal">{verdict}</p>
            <p className="label mt-3 !text-[0.58rem]">{T.illustrative}</p>
          </div>
        </div>
      </div>

      <div data-print-hide className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <button type="button" onClick={() => setTick((t) => t + 1)}
          className="border border-rule-strong bg-paper px-4 py-1.5 text-ink transition-colors hover:border-ink">
          <span className="label !text-ink">{T.next}</span>
        </button>
        <label className="flex min-w-[18rem] flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          <span className="label">{T.slider}</span>
          <span className="flex min-w-[12rem] flex-1 items-center gap-3">
            <input type="range" min={10} max={60} step={5} value={share}
              onChange={(e) => {setShare(Number(e.target.value)); }}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
            <span className="label tnum w-10 text-right !text-ink">{share}%</span>
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.second, String(tick)],
          [T.rdDriver, driverStr],
          [T.rdNoise, noiseStr],
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
