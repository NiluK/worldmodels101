"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import type { Locale } from "@/lib/i18n";

/**
 * The 1990 shape, made concrete.
 *
 * A grid, an agent, a goal, and two boxes beside the field. One box predicts
 * what a move would do (the world model); the other picks moves (the chooser).
 * Pointing at an arrow asks the model: the ghost is its answer. Clicking asks
 * the world. Where the two disagree you see both, because the model was
 * written to be a little wrong: it knows the walls but not the patches.
 *
 * The Kalman half is the second mode. An estimator answers "where am I", not
 * "what if", so the ghosts go away and the buttons just move the dot.
 *
 * The learned model is a table of corrections over a one-square-per-move
 * prior, filled in only where the agent has actually been surprised. The
 * chooser plans inside that model (breadth-first search over what the model
 * believes each move does) and takes the first step. Laps make the learning
 * visible: with corrections kept, the surprises fall lap over lap and the
 * route shortens; without them, every lap repeats the first.
 */

type Dir = "up" | "down" | "left" | "right";
type Cell = readonly [number, number];
type Mode = "predict" | "estimate";
type Patch = "ice" | "drift" | "lift";

/**
 * W wall, i ice (carries you on in your direction until the patch ends),
 * d drift (pushes you down a row as you cross), u lift (pushes you up a row),
 * S start, G goal. The top corridor is the naive shortest route and costs a
 * square at every lift; the bottom looks a step longer until the ice is known.
 */
const MAP = [
  "....W..W..",
  "..u.uu..u.",
  "S.WWWWWW..",
  "..WWWWWW.G",
  "Widd.iii..",
  ".i...W....",
];
const ROWS = MAP.length;
const COLS = MAP[0].length;
const CELL = 60;
const OX = 26;
const OY = 8;
const FW = OX + COLS * CELL + 8;
const FH = OY + ROWS * CELL + 24;
const LAP_CAP = 60;
const TICK_MS = 350;

const WALLS = new Set<string>();
const PATCH: Record<string, Patch> = {};
let start: Cell = [0, 0];
let goal: Cell = [0, 0];
MAP.forEach((row, y) =>
  [...row].forEach((ch, x) => {
    const k = `${x},${y}`;
    if (ch === "W") WALLS.add(k);
    else if (ch === "i") PATCH[k] = "ice";
    else if (ch === "d") PATCH[k] = "drift";
    else if (ch === "u") PATCH[k] = "lift";
    else if (ch === "S") start = [x, y];
    else if (ch === "G") goal = [x, y];
  }),
);
const START: Cell = start;
const GOAL: Cell = goal;

const DIRS: Record<Dir, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};
/** button order, left to right */
const PAD: Dir[] = ["left", "up", "down", "right"];
/** the chooser's tie-break: towards the goal first */
const CHOOSE: Dir[] = ["right", "up", "down", "left"];
const GLYPH: Record<Dir, string> = { left: "←", up: "↑", down: "↓", right: "→" };
const KEYS: Record<string, Dir> = {
  ArrowLeft: "left", ArrowUp: "up", ArrowDown: "down", ArrowRight: "right",
};

const key = (c: Cell) => `${c[0]},${c[1]}`;
const same = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1];
const free = (x: number, y: number) =>
  x >= 0 && x < COLS && y >= 0 && y < ROWS && !WALLS.has(`${x},${y}`);
const name = (c: Cell) => `${"ABCDEFGHIJ"[c[0]]}${c[1] + 1}`;
const cx = (c: Cell) => OX + c[0] * CELL + CELL / 2;
const cy = (c: Cell) => OY + c[1] * CELL + CELL / 2;
const manhattan = (a: Cell, b: Cell) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

function step(c: Cell, d: Dir): Cell | null {
  const [dx, dy] = DIRS[d];
  const x = c[0] + dx;
  const y = c[1] + dy;
  return free(x, y) ? [x, y] : null;
}

/** what the model believes before it has learned anything: one square, walls respected */
const naive = (from: Cell, d: Dir): Cell => step(from, d) ?? from;

/** what actually happens: the same, then whatever the patch you landed on does to you */
function truth(from: Cell, d: Dir): Cell {
  let c = naive(from, d);
  if (c === from) return c;
  let dir = d;
  for (let i = 0; i < 12; i++) {
    const p = PATCH[key(c)];
    if (!p) break;
    const n = step(c, p === "ice" ? dir : p === "drift" ? "down" : "up");
    if (!n) break;
    c = n;
    if (p !== "ice") dir = p === "drift" ? "down" : "up";
  }
  return c;
}

type Table = Record<string, Cell>;
const tkey = (from: Cell, d: Dir) => `${key(from)}:${d}`;
const believe = (table: Table, from: Cell, d: Dir): Cell => table[tkey(from, d)] ?? naive(from, d);

/**
 * Plan inside the model: breadth-first search over what the model believes
 * each move does, from here to the goal. Returns the first move of the
 * shortest believed route, or null if the model sees no route at all.
 */
function plan(table: Table, s: Cell): Dir | null {
  const origin = key(s);
  if (origin === key(GOAL)) return null;
  const prev = new Map<string, { from: string; d: Dir } | null>([[origin, null]]);
  const queue: Cell[] = [s];
  while (queue.length) {
    const c = queue.shift()!;
    for (const d of CHOOSE) {
      const n = believe(table, c, d);
      const k = key(n);
      if (prev.has(k)) continue;
      prev.set(k, { from: key(c), d });
      if (k === key(GOAL)) {
        let cur = k;
        while (prev.get(cur)!.from !== origin) cur = prev.get(cur)!.from;
        return prev.get(cur)!.d;
      }
      queue.push(n);
    }
  }
  return null;
}

/** the chooser: plan if it can, otherwise the move whose believed outcome is nearest */
function choose(table: Table, s: Cell): Dir {
  const planned = plan(table, s);
  if (planned) return planned;
  let best: Dir = CHOOSE[0];
  let bestD = Infinity;
  for (const d of CHOOSE) {
    const dist = manhattan(believe(table, s, d), GOAL);
    if (dist < bestD) {
      bestD = dist;
      best = d;
    }
  }
  return best;
}

type Last = {
  from: Cell;
  d: Dir;
  predicted: Cell | null;
  actual: Cell;
  off: number;
  /** the patch that did it, if any */
  cause: Patch | null;
  byChooser: boolean;
  candidates?: { d: Dir; p: Cell }[];
  learned: boolean;
  /** set on the step that finished a lap, so the verdict can sum it up */
  lapEnd: { n: number; surprises: number; steps: number; capped: boolean } | null;
};

type Lap = { surprises: number; steps: number; capped: boolean };

type S = {
  mode: Mode;
  pos: Cell;
  steps: number;
  errors: number;
  lap: number;
  laps: Lap[];
  learn: boolean;
  showMap: boolean;
  table: Table;
  last: Last | null;
  running: boolean;
};

const INITIAL: S = {
  mode: "predict", pos: START, steps: 0, errors: 0, lap: 1, laps: [],
  learn: false, showMap: false, table: {}, last: null, running: false,
};

/** one move, pure. Ends the lap when the goal is reached or the cap is hit. */
function advance(prev: S, d: Dir, byChooser: boolean): S {
  const from = prev.pos;
  const predicting = prev.mode === "predict";
  const predicted = predicting ? believe(prev.table, from, d) : null;
  const actual = truth(from, d);
  const off = predicted ? manhattan(predicted, actual) : 0;
  const landing = naive(from, d);
  const cause = off > 0 ? (PATCH[key(landing)] ?? null) : null;
  const learned = off > 0 && prev.learn;
  const table = learned ? { ...prev.table, [tkey(from, d)]: actual } : prev.table;
  const candidates = byChooser
    ? CHOOSE.map((a) => ({ d: a, p: believe(prev.table, from, a) }))
    : undefined;
  const steps = prev.steps + 1;
  const errors = prev.errors + (off > 0 ? 1 : 0);
  const reached = same(actual, GOAL);
  const capped = !reached && steps >= LAP_CAP;
  const lapEnd = reached || capped
    ? { n: prev.lap, surprises: errors, steps, capped }
    : null;
  const last: Last = {
    from, d, predicted, actual, off, cause, byChooser, candidates, learned, lapEnd,
  };
  if (lapEnd) {
    return {
      ...prev,
      pos: START,
      steps: 0,
      errors: 0,
      lap: prev.lap + 1,
      laps: [...prev.laps, { surprises: errors, steps, capped }],
      table,
      last,
      running: false,
    };
  }
  return { ...prev, pos: actual, steps, errors, table, last };
}

const chooserStep = (prev: S): S => advance(prev, choose(prev.table, prev.pos), true);

/** the rest of the lap at once, for reduced motion or an impatient second click */
function finishLap(prev: S): S {
  let st = prev;
  const lap = prev.lap;
  for (let i = 0; i < LAP_CAP + 1 && st.lap === lap; i++) st = chooserStep(st);
  return { ...st, running: false };
}

type Text = {
  modePredict: string;
  modeEstimate: string;
  worldModel: string;
  estimator: string;
  chooser: string;
  wmEq: string;
  wmBody: string[];
  estEq: string;
  estBody: string[];
  chBody: string[];
  chOff: string[];
  corrections: (n: number) => string;
  dir: Record<Dir, string>;
  decide: string;
  runLap: string;
  finishNow: string;
  learn: string;
  showMap: string;
  forget: string;
  reset: string;
  goal: string;
  startLabel: string;
  patch: Record<Patch, string>;
  fieldHelp: string;
  lapN: (n: number) => string;
  lapCell: (surprises: number, steps: number, capped: boolean) => string;
  lapLogEmpty: string;
  lap: string;
  steps: string;
  surprises: string;
  correctionsLabel: string;
  intro: string;
  estimate: string;
  match: (p: string) => string;
  miss: (p: string, a: string, n: number, cause: Patch | null) => string;
  noted: string;
  blocked: string;
  chose: (dir: string) => string;
  lapFirst: (m: number, k: number) => string;
  lapClean: (n: number) => string;
  lapDown: (n: number, m: number, prev: number) => string;
  lapNewRoute: (n: number, m: number) => string;
  lapSame: (n: number, m: number) => string;
  lapOff: (n: number, m: number, m1: number) => string;
  lapCapped: (n: number) => string;
  lapEst: (n: number, k: number) => string;
  aria: (you: string, goal: string, lap: number) => string;
};

const TEXT: Record<Locale, Text> = {
  en: {
    modePredict: "Predict before you act",
    modeEstimate: "Estimate only",
    worldModel: "World model",
    estimator: "Estimator",
    chooser: "Chooser",
    wmEq: "s, a → s′",
    wmBody: ["One square per move. Knows the walls, not the patches."],
    estEq: "z → ŝ",
    estBody: ["Says where you are. Does not choose a move."],
    chBody: ["Plans the route inside the model. Takes its first step."],
    chOff: ["Nothing to ask."],
    corrections: (n) => (n === 1 ? "1 correction" : `${n} corrections`),
    dir: { up: "Up", down: "Down", left: "Left", right: "Right" },
    decide: "Let the chooser decide",
    runLap: "Run a lap",
    finishNow: "Finish the lap now",
    learn: "Learn from mistakes",
    showMap: "Model's map",
    forget: "Forget",
    reset: "Reset",
    goal: "goal",
    startLabel: "start",
    patch: { ice: "ice", drift: "drift", lift: "lift" },
    fieldHelp: "Arrow keys preview a move; the same arrow again, or Enter, takes it.",
    lapN: (n) => `Lap ${n}`,
    lapCell: (m, k, capped) =>
      capped
        ? `stopped at ${k} steps`
        : `${m === 1 ? "1 surprise" : `${m} surprises`}, ${k} steps`,
    lapLogEmpty: "No laps finished yet. Reaching the goal ends a lap and the dot goes back to the start.",
    lap: "Lap",
    steps: "Steps this lap",
    surprises: "Surprises this lap",
    correctionsLabel: "Corrections held",
    intro: "Point at an arrow to see where the model says you would land. Press it to go, or let the chooser run a lap.",
    estimate: "An estimator tells you where you are. It does not learn what moves do, and it never weighs one against another.",
    match: (p) => `The model said ${p}, and that is where you landed.`,
    miss: (p, a, n, cause) =>
      `The model said ${p}. You ended at ${a}, ${n === 1 ? "1 square" : `${n} squares`} off.` +
      (cause === "ice"
        ? " The ice carried you on."
        : cause === "drift"
          ? " The drift pushed you down a row."
          : cause === "lift"
            ? " The lift pushed you up a row."
            : ""),
    noted: "The model has noted the correction.",
    blocked: "A wall. Nothing moved, and the model said nothing would.",
    chose: (dir) => `The chooser planned a route in the model and took ${dir.toLowerCase()}.`,
    lapFirst: (m, k) =>
      `First lap done: ${m === 1 ? "1 surprise" : `${m} surprises`} in ${k} steps. Run another and compare.`,
    lapClean: (n) => `Lap ${n}, no surprises: the model now knows every patch on this route.`,
    lapDown: (n, m, prev) =>
      `Lap ${n}: ${m === 1 ? "1 surprise" : `${m} surprises`}, down from ${prev}. The model is learning the route.`,
    lapNewRoute: (n, m) =>
      `Lap ${n}: ${m === 1 ? "1 surprise" : `${m} surprises`}. The model rerouted and met patches it had not seen.`,
    lapSame: (n, m) => `Lap ${n}: ${m === 1 ? "1 surprise" : `${m} surprises`}, the same as before.`,
    lapOff: (n, m, m1) =>
      m === m1
        ? `Learning is off, so lap ${n} was as surprised as lap 1.`
        : `Learning is off. Lap ${n} had ${m} surprises, lap 1 had ${m1}; nothing was kept between them.`,
    lapCapped: (n) => `Lap ${n} stopped at ${LAP_CAP} steps without reaching the goal.`,
    lapEst: (n, k) =>
      `Lap ${n} done in ${k} steps. The estimator knew where you were at every one of them, and nothing more.`,
    aria: (you, g, lap) => `A grid world, ${COLS} by ${ROWS}, lap ${lap}. You are at ${you}; the goal is at ${g}.`,
  },
  zh: {
    modePredict: "先预测，再行动",
    modeEstimate: "只做估计",
    worldModel: "世界模型",
    estimator: "估计器",
    chooser: "选择器",
    wmEq: "s, a → s′",
    wmBody: ["每步一格。知道墙在哪里，不知道地面的异常。"],
    estEq: "z → ŝ",
    estBody: ["只说你在哪里，不替你选一步。"],
    chBody: ["在模型里规划路线，走出第一步。"],
    chOff: ["无可问。"],
    corrections: (n) => `已修正 ${n} 处`,
    dir: { up: "上", down: "下", left: "左", right: "右" },
    decide: "让选择器来决定",
    runLap: "跑一圈",
    finishNow: "立刻跑完这一圈",
    learn: "从错误中学习",
    showMap: "模型的地图",
    forget: "遗忘",
    reset: "重置",
    goal: "目标",
    startLabel: "起点",
    patch: { ice: "冰", drift: "下沉", lift: "上托" },
    fieldHelp: "方向键预览一步；再按一次同一方向键或回车，就走这一步。",
    lapN: (n) => `第 ${n} 圈`,
    lapCell: (m, k, capped) => (capped ? `${k} 步后中止` : `${m} 次意外，${k} 步`),
    lapLogEmpty: "还没有跑完一圈。抵达目标即完成一圈，圆点回到起点。",
    lap: "圈数",
    steps: "本圈步数",
    surprises: "本圈意外",
    correctionsLabel: "已持有的修正",
    intro: "把指针放到箭头上，看模型认为你会落在哪里。按下就走，或者让选择器跑一圈。",
    estimate: "估计器告诉你你在哪里。它不去学一步会带来什么，也从不比较两步的好坏。",
    match: (p) => `模型说是 ${p}，你也正落在那里。`,
    miss: (p, a, n, cause) =>
      `模型说是 ${p}，你却停在了 ${a}，偏了 ${n} 格。` +
      (cause === "ice"
        ? "冰把你继续带了下去。"
        : cause === "drift"
          ? "下沉把你推低了一行。"
          : cause === "lift"
            ? "上托把你推高了一行。"
            : ""),
    noted: "模型已经把这次修正记下了。",
    blocked: "一堵墙。什么都没动，模型也说不会动。",
    chose: (dir) => `选择器在模型里规划了路线，选了「${dir}」。`,
    lapFirst: (m, k) => `第一圈跑完：${m} 次意外，${k} 步。再跑一圈，对比一下。`,
    lapClean: (n) => `第 ${n} 圈，零意外：模型已经认识这条路线上的每一块异常地面。`,
    lapDown: (n, m, prev) => `第 ${n} 圈：${m} 次意外，比上一圈的 ${prev} 次少。模型正在学会这条路。`,
    lapNewRoute: (n, m) => `第 ${n} 圈：${m} 次意外。模型改了路线，遇到了没见过的地面。`,
    lapSame: (n, m) => `第 ${n} 圈：${m} 次意外，和上一圈一样。`,
    lapOff: (n, m, m1) =>
      m === m1
        ? `学习已关闭，所以第 ${n} 圈和第一圈一样意外。`
        : `学习已关闭。第 ${n} 圈 ${m} 次意外，第一圈 ${m1} 次；两圈之间什么都没留下。`,
    lapCapped: (n) => `第 ${n} 圈在 ${LAP_CAP} 步后中止，没有抵达目标。`,
    lapEst: (n, k) => `第 ${n} 圈用了 ${k} 步。估计器每一步都知道你在哪里，仅此而已。`,
    aria: (you, g, lap) => `一个 ${COLS} 乘 ${ROWS} 的网格世界，第 ${lap} 圈。你在 ${you}，目标在 ${g}。`,
  },
};

/** the two boxes, stacked: beside the field when there is room, beneath it when not */
function Modules({
  T, mode, corrections,
}: {
  T: Text;
  mode: Mode;
  corrections: number;
}) {
  const est = mode === "estimate";

  const box = (
    label: string,
    eq: string | null,
    lines: string[],
    hot: boolean,
    off: boolean,
    corner?: string,
  ) => (
    <div
      className={`min-w-0 border px-4 py-4 ${
        off
          ? "border-dashed border-rule-strong bg-paper"
          : hot
            ? "border-imagine bg-imagine-soft"
            : "border-ink bg-paper"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className={`label ${off ? "!text-ink-faint" : hot ? "!text-imagine-on-soft" : "!text-ink"}`}>
          {label}
        </span>
        {corner && <span className="label tnum !text-imagine-on-soft">{corner}</span>}
      </div>
      {eq && (
        <p className={`mt-2 font-mono text-[0.95rem] ${off ? "text-ink-faint" : "text-ink"}`}>{eq}</p>
      )}
      <p className={`mt-2 max-w-[36ch] text-[0.88rem] leading-relaxed ${off ? "text-ink-faint" : "text-ink-muted"}`}>
        {lines.join(" ")}
      </p>
    </div>
  );

  const arrowStroke = est ? "var(--ink-faint)" : "var(--ink-muted)";
  const dash = est ? "3 4" : "0";
  const arrows = (
    <svg viewBox="0 0 120 56" width="120" height="56" className="shrink-0 self-center" aria-hidden="true">
      <defs>
        <marker id="tn-ar-v" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
          <path d="M0,0 L7,3 L0,6" fill="none" stroke={arrowStroke} strokeWidth="1.3" />
        </marker>
      </defs>
      <line x1="40" y1="50" x2="40" y2="10" stroke={arrowStroke} strokeWidth="1.3" strokeDasharray={dash} markerEnd="url(#tn-ar-v)" />
      <text x="30" y="32" textAnchor="end" className="font-mono" fontSize="11" fill={arrowStroke}>a</text>
      <line x1="80" y1="6" x2="80" y2="46" stroke={arrowStroke} strokeWidth="1.3" strokeDasharray={dash} markerEnd="url(#tn-ar-v)" />
      <text x="90" y="32" className="font-mono" fontSize="11" fill={arrowStroke}>s′</text>
    </svg>
  );

  return (
    <div className="flex flex-col">
      {box(
        est ? T.estimator : T.worldModel,
        est ? T.estEq : T.wmEq,
        est ? T.estBody : T.wmBody,
        !est, false,
        !est && corrections > 0 ? T.corrections(corrections) : undefined,
      )}
      {arrows}
      {box(T.chooser, null, est ? T.chOff : T.chBody, false, est)}
    </div>
  );
}

/** Hoisted: a component declared inside render is remounted on every render. */
function Switch({
  on, onToggle, label, disabled,
}: { on: boolean; onToggle: () => void; label: string; disabled?: boolean }) {
  return (
    <label className={`flex items-center gap-3 ${disabled ? "opacity-40" : "cursor-pointer"}`}>
      <span className="label">{label}</span>
      <button
        role="switch"
        aria-checked={on}
        disabled={disabled}
        onClick={onToggle}
        className={`relative h-6 w-11 border transition-colors disabled:cursor-not-allowed ${
          on ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"
        }`}
      >
        <span
          className={`absolute top-[3px] h-4 w-4 transition-all ${
            on ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"
          }`}
        />
      </button>
    </label>
  );
}

/** where to put the one label per patch kind: the bottom-right square of a representative patch */
const PATCH_LABEL_AT: Record<Patch, Cell> = { ice: [7, 4], drift: [3, 4], lift: [5, 1] };

export function TwoNetworks() {
  const locale = useLocale();
  const T = TEXT[locale] ?? TEXT.en;
  const { ref, compact } = useCompact(620);
  const k = compact ? 1.65 : 1;

  const [s, setS] = useState<S>(INITIAL);
  const [preview, setPreview] = useState<Dir | null>(null);
  const stillRef = useRef(false);
  useEffect(() => {
    stillRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const commit = useCallback((d: Dir, byChooser = false) => {
    setS((prev) => (prev.running ? prev : advance(prev, d, byChooser)));
    setPreview(null);
  }, []);

  /** one step: plan inside the model, take the first move */
  const decide = useCallback(() => {
    setS((prev) => (prev.running ? prev : chooserStep(prev)));
    setPreview(null);
  }, []);

  /** a whole lap: one step per tick, or all at once under reduced motion or a second press */
  const runLap = useCallback(() => {
    setPreview(null);
    setS((prev) => {
      if (prev.running || stillRef.current) return finishLap(prev);
      return { ...prev, running: true };
    });
  }, []);

  useEffect(() => {
    if (!s.running) return;
    const id = window.setTimeout(() => setS((prev) => (prev.running ? chooserStep(prev) : prev)), TICK_MS);
    return () => window.clearTimeout(id);
  }, [s.running, s.steps, s.lap]);

  const setMode = (mode: Mode) => {
    setPreview(null);
    setS((prev) => (prev.mode === mode ? prev : { ...prev, mode, last: null, running: false }));
  };
  const toggleLearn = () => setS((prev) => ({ ...prev, learn: !prev.learn }));
  const toggleMap = () => setS((prev) => ({ ...prev, showMap: !prev.showMap }));
  const forget = () => setS((prev) => ({ ...prev, table: {}, last: null }));
  const reset = () => {
    setPreview(null);
    setS((prev) => ({
      ...INITIAL, mode: prev.mode, learn: prev.learn, showMap: prev.showMap, table: prev.table,
    }));
  };

  const onFieldKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = KEYS[e.key];
    if (d) {
      e.preventDefault();
      if (s.mode === "estimate" || preview === d) commit(d);
      else setPreview(d);
      return;
    }
    if ((e.key === "Enter" || e.key === " ") && preview) {
      e.preventDefault();
      commit(preview);
    } else if (e.key === "Escape") {
      setPreview(null);
    }
  };

  const predicting = s.mode === "predict";
  const ghost = predicting && preview && !s.running ? believe(s.table, s.pos, preview) : null;
  const last = !preview ? s.last : null;
  const corrections = Object.keys(s.table).length;

  const verdict = useMemo(() => {
    const L = s.last;
    if (!predicting) {
      if (L?.lapEnd) return L.lapEnd.capped ? T.lapCapped(L.lapEnd.n) : T.lapEst(L.lapEnd.n, L.lapEnd.steps);
      return T.estimate;
    }
    if (!L) return T.intro;
    if (L.lapEnd) {
      const { n, surprises: m, capped } = L.lapEnd;
      if (capped) return T.lapCapped(n);
      const done = s.laps;
      if (done.length <= 1) return T.lapFirst(m, L.lapEnd.steps);
      const prevM = done[done.length - 2].surprises;
      if (!s.learn) return T.lapOff(n, m, done[0].surprises);
      if (m === 0) return T.lapClean(n);
      if (m < prevM) return T.lapDown(n, m, prevM);
      if (m > prevM) return T.lapNewRoute(n, m);
      return T.lapSame(n, m);
    }
    const lead = L.byChooser ? `${T.chose(T.dir[L.d])} ` : "";
    if (L.off === 0 && same(L.actual, L.from)) return lead + T.blocked;
    if (L.off === 0) return lead + T.match(name(L.actual));
    return lead + T.miss(name(L.predicted!), name(L.actual), L.off, L.cause) + (L.learned ? ` ${T.noted}` : "");
  }, [T, predicting, s.last, s.laps, s.learn]);

  const btn = "border border-rule-strong bg-paper text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rule-strong";
  const btnOn = "border-imagine bg-imagine text-paper";
  const wordBtn = `px-3 py-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] ${btn}`;

  const patchCells = Object.entries(PATCH) as [string, Patch][];
  const mapEntries = s.showMap && predicting
    ? Object.entries(s.table).map(([tk, to]) => {
        const [xy] = tk.split(":");
        const [x, y] = xy.split(",").map(Number);
        return { from: [x, y] as Cell, to };
      })
    : [];
  const shaded = new Set(mapEntries.map((e) => key(e.from)));

  const field = (
    <svg viewBox={`0 0 ${FW} ${FH}`} className="block w-full" role="img"
      aria-label={`${T.aria(name(s.pos), name(GOAL), s.lap)} ${verdict}`}>
      <defs>
        <pattern id="tn-ice" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="var(--rule-strong)" strokeWidth="0.8" opacity="0.55" />
        </pattern>
      </defs>

      {/* the field */}
      <rect x={OX} y={OY} width={COLS * CELL} height={ROWS * CELL} fill="var(--paper)" />
      {Array.from({ length: COLS + 1 }, (_, i) => (
        <line key={`v${i}`} x1={OX + i * CELL} y1={OY} x2={OX + i * CELL} y2={OY + ROWS * CELL}
          stroke="var(--rule)" strokeWidth="1" />
      ))}
      {Array.from({ length: ROWS + 1 }, (_, i) => (
        <line key={`h${i}`} x1={OX} y1={OY + i * CELL} x2={OX + COLS * CELL} y2={OY + i * CELL}
          stroke="var(--rule)" strokeWidth="1" />
      ))}

      {/* coordinates, so the verdict can name a square */}
      {Array.from({ length: COLS }, (_, i) => (
        <text key={`c${i}`} x={OX + i * CELL + CELL / 2} y={OY + ROWS * CELL + 15}
          textAnchor="middle" className="font-mono" fontSize={9 * k} fill="var(--ink-faint)">
          {"ABCDEFGHIJ"[i]}
        </text>
      ))}
      {Array.from({ length: ROWS }, (_, i) => (
        <text key={`r${i}`} x={OX - 8} y={OY + i * CELL + CELL / 2 + 3}
          textAnchor="end" className="font-mono" fontSize={9 * k} fill="var(--ink-faint)">
          {i + 1}
        </text>
      ))}

      {/* the squares the model holds a correction for: only where it has actually been surprised */}
      {mapEntries.map(({ from }) => (
        <rect key={key(from)} x={OX + from[0] * CELL + 1} y={OY + from[1] * CELL + 1}
          width={CELL - 2} height={CELL - 2} fill="var(--imagine-soft)" opacity="0.9" />
      ))}

      {/* the patches: the things the model does not know about */}
      {patchCells.map(([c, p]) => {
        const [x, y] = c.split(",").map(Number);
        const X = OX + x * CELL;
        const Y = OY + y * CELL;
        const mx = X + CELL / 2;
        const my = Y + CELL / 2;
        return (
          <g key={c}>
            <rect x={X} y={Y} width={CELL} height={CELL}
              fill={shaded.has(c) ? "var(--imagine-soft)" : "var(--paper-sunk)"} />
            {p === "ice" && <rect x={X} y={Y} width={CELL} height={CELL} fill="url(#tn-ice)" />}
            {p === "drift" && (
              <path d={`M ${mx - 9} ${my - 5} L ${mx} ${my + 5} L ${mx + 9} ${my - 5}`}
                fill="none" stroke="var(--rule-strong)" strokeWidth="1.5" />
            )}
            {p === "lift" && (
              <path d={`M ${mx - 9} ${my + 5} L ${mx} ${my - 5} L ${mx + 9} ${my + 5}`}
                fill="none" stroke="var(--rule-strong)" strokeWidth="1.5" />
            )}
          </g>
        );
      })}
      {!compact &&
        (Object.keys(PATCH_LABEL_AT) as Patch[]).map((p) => {
          const at = PATCH_LABEL_AT[p];
          return (
            <text key={p} x={OX + (at[0] + 1) * CELL - 5} y={OY + (at[1] + 1) * CELL - 6}
              textAnchor="end" className="font-mono" fontSize={10} letterSpacing="1" fill="var(--ink-muted)">
              {T.patch[p]}
            </text>
          );
        })}

      {/* walls */}
      {[...WALLS].map((c) => {
        const [x, y] = c.split(",").map(Number);
        return (
          <rect key={c} x={OX + x * CELL} y={OY + y * CELL} width={CELL} height={CELL}
            fill="var(--rule-strong)" />
        );
      })}
      <rect x={OX} y={OY} width={COLS * CELL} height={ROWS * CELL} fill="none"
        stroke="var(--rule-strong)" strokeWidth="1" />

      {/* what the model has learned: the dotted line runs to what really happened */}
      {mapEntries.map(({ from, to }) => (
        <line key={key(from)} x1={cx(from)} y1={cy(from)} x2={cx(to)} y2={cy(to)}
          stroke="var(--imagine)" strokeWidth="1.2" strokeDasharray="2 3" opacity="0.8" />
      ))}

      {/* start and goal */}
      <circle cx={cx(START)} cy={cy(START)} r="12" fill="none" stroke="var(--rule-strong)"
        strokeWidth="1.2" strokeDasharray="3 3" />
      {!compact && (
        <text x={cx(START)} y={cy(START) + 25} textAnchor="middle" className="font-mono"
          fontSize={10} letterSpacing="1" fill="var(--ink-muted)">
          {T.startLabel}
        </text>
      )}
      <circle cx={cx(GOAL)} cy={cy(GOAL)} r="12" fill="none" stroke="var(--ink)" strokeWidth="1.4" />
      <circle cx={cx(GOAL)} cy={cy(GOAL)} r="3" fill="var(--ink)" />
      {!compact && (
        <text x={cx(GOAL)} y={cy(GOAL) + 25} textAnchor="middle" className="font-mono"
          fontSize={10} letterSpacing="1" fill="var(--ink-muted)">
          {T.goal}
        </text>
      )}

      {/* the last step: what the model said, and what happened */}
      {last && last.predicted && (
        <g>
          {last.candidates?.map(({ d, p }) =>
            d === last.d ? null : (
              <circle key={d} cx={cx(p)} cy={cy(p)} r="11" fill="none" stroke="var(--imagine)"
                strokeWidth="1.5" strokeDasharray="3 3" opacity="0.35" />
            ),
          )}
          {!same(last.from, last.predicted) && (
            <line x1={cx(last.from)} y1={cy(last.from)} x2={cx(last.predicted)} y2={cy(last.predicted)}
              stroke="var(--imagine)" strokeWidth="1.2" strokeDasharray="2 4" />
          )}
          {last.off > 0 && (
            <line x1={cx(last.from)} y1={cy(last.from)} x2={cx(last.actual)} y2={cy(last.actual)}
              stroke="var(--actual)" strokeWidth="1.2" strokeDasharray="2 4" />
          )}
          <circle cx={cx(last.predicted)} cy={cy(last.predicted)} r="13" fill="none"
            stroke="var(--imagine)" strokeWidth="2" strokeDasharray="4 3" />
          {last.off > 0 && (
            <circle cx={cx(last.from)} cy={cy(last.from)} r="4" fill="var(--actual)" opacity="0.5" />
          )}
          {/* the lap ended on this square; the dot has gone home */}
          {last.lapEnd && (
            <circle cx={cx(last.actual)} cy={cy(last.actual)} r="7" fill="var(--actual)" opacity="0.45" />
          )}
        </g>
      )}

      {/* the question: where would this move put me? */}
      {ghost && (
        <g>
          {!same(s.pos, ghost) && (
            <line x1={cx(s.pos)} y1={cy(s.pos)} x2={cx(ghost)} y2={cy(ghost)}
              stroke="var(--imagine)" strokeWidth="1.2" strokeDasharray="2 4" />
          )}
          <circle cx={cx(ghost)} cy={cy(ghost)} r="13" fill="none"
            stroke="var(--imagine)" strokeWidth="2" strokeDasharray="4 3" />
        </g>
      )}

      {/* the agent: always the actual one. Position is state; the slide is only a CSS transition. */}
      <g
        className="transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{ transform: `translate(${cx(s.pos)}px, ${cy(s.pos)}px)` }}
      >
        <circle r="11" fill="var(--actual)" stroke="var(--paper)" strokeWidth="2" />
      </g>
    </svg>
  );

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <div className={compact ? "flex flex-col gap-5" : "flex items-start gap-6"}>
          <div
            tabIndex={0}
            role="group"
            aria-label={T.fieldHelp}
            onKeyDown={onFieldKey}
            onBlur={() => setPreview(null)}
            className={`min-w-0 focus-visible:outline-2 focus-visible:outline-imagine ${compact ? "" : "flex-[5]"}`}
          >
            {field}
          </div>
          <div className={compact ? "min-w-0" : "min-w-0 flex-[2]"}>
            <Modules T={T} mode={s.mode} corrections={corrections} />
          </div>
        </div>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex gap-px" role="group" aria-label={`${T.modePredict} / ${T.modeEstimate}`}>
          {(["predict", "estimate"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              aria-pressed={s.mode === m}
              className={`px-3 py-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] ${
                s.mode === m ? btnOn : btn
              }`}
            >
              {m === "predict" ? T.modePredict : T.modeEstimate}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {PAD.map((d) => (
            <button
              key={d}
              aria-label={T.dir[d]}
              disabled={s.running}
              onPointerEnter={() => setPreview(d)}
              onPointerLeave={() => setPreview((p) => (p === d ? null : p))}
              onFocus={() => setPreview(d)}
              onBlur={() => setPreview((p) => (p === d ? null : p))}
              onClick={() => commit(d)}
              className={`flex h-10 w-10 items-center justify-center ${btn} active:bg-imagine active:text-paper`}
            >
              {GLYPH[d]}
            </button>
          ))}
        </div>

        <button onClick={decide} disabled={!predicting || s.running} className={wordBtn}>
          {T.decide}
        </button>
        <button
          onClick={runLap}
          disabled={!predicting}
          aria-pressed={s.running}
          className={`${wordBtn} ${s.running ? "!border-imagine !text-imagine" : ""}`}
        >
          {s.running ? T.finishNow : T.runLap}
        </button>

        <Switch on={s.learn} onToggle={toggleLearn} label={T.learn} disabled={!predicting} />
        <Switch on={s.showMap} onToggle={toggleMap} label={T.showMap} disabled={!predicting} />

        <button onClick={forget} disabled={corrections === 0} className={wordBtn}>
          {T.forget}
        </button>
        <button onClick={reset} className={wordBtn}>
          {T.reset}
        </button>

        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}
        </p>
      </div>

      {/* the lap log: the demonstration */}
      <div className="flex flex-wrap gap-px border-t border-rule bg-rule">
        {s.laps.length === 0 ? (
          <p className="label basis-full bg-paper px-5 py-3 !normal-case !tracking-normal !text-[0.8rem] md:px-8">
            {T.lapLogEmpty}
          </p>
        ) : (
          s.laps.map((lap, i) => (
            <div key={i} className="flex-1 basis-[11rem] bg-paper px-5 py-3 md:px-8">
              <p className="label">{T.lapN(i + 1)}</p>
              <p className={`tnum mt-1 text-[0.9rem] ${lap.capped ? "text-ink-muted" : "text-ink"}`}>
                {T.lapCell(lap.surprises, lap.steps, lap.capped)}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-rule bg-rule sm:grid-cols-4">
        {[
          [T.lap, String(s.lap)],
          [T.steps, String(s.steps)],
          [T.surprises, predicting ? String(s.errors) : "·"],
          [T.correctionsLabel, predicting ? String(corrections) : "·"],
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
