"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { pickText, type LocaleText } from "@/lib/locale-text";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";

/**
 * Ha and Schmidhuber's three pieces, as a loop you can step.
 *
 * Encoder, dynamics model, controller. The point of drawing them as a pipeline
 * is that only one of the three can run on its own output, and that is the
 * piece which gets to be called the world model. The "where is it running"
 * switch is the train-in-dream-then-move-back idea: in the dream the dynamics
 * model feeds itself and the game is not consulted; in the real game frames
 * come from the game and the dynamics model only predicts.
 *
 * Every state change happens on the click itself. The lighting sequence that
 * follows a step is decoration and is skipped under reduced motion.
 */

type Piece = "enc" | "dyn" | "ctl";
type Stage = "game" | Piece | "act";
type Choice = Piece | null;

const LATENT = 32;
const CELLS = 36;

/* Two layouts. Wide is one row; compact wraps the pipeline onto two rows so
   the type stays legible in a 300px column instead of shrinking to nothing. */
type Box = { x: number; y: number; w: number; h: number };
type Ticks = { x: number; w: number; base: number };
type Layout = {
  W: number;
  H: number;
  game: Box;
  grid: { x: number; y: number; cell: number };
  gameLabel: { x: number; y: number };
  enc: Box;
  dyn: Box;
  ctl: Box;
  z: Ticks;
  z2: Ticks;
  act: { cx: number; cy: number; r: number };
  frameIn: string;
  encToZ: string;
  zToDyn: string;
  dynToZ2: string;
  z2ToCtl: string;
  ctlToAct: string;
  loopToDyn: string;
  loopToGame: string;
  feedback: string;
  feedLabel: { x: number; y: number };
  actionLabel: { x: number; y: number } | null;
};

const TICK_MAX = 26;

const WIDE: Layout = (() => {
  const mid = 96;
  const enc: Box = { x: 122, y: 66, w: 122, h: 60 };
  const dyn: Box = { x: 378, y: 66, w: 142, h: 60 };
  const ctl: Box = { x: 654, y: 66, w: 132, h: 60 };
  const game: Box = { x: 10, y: 56, w: 82, h: 80 };
  const z: Ticks = { x: 258, w: 96, base: mid + 12 };
  const z2: Ticks = { x: 534, w: 96, base: mid + 12 };
  const act = { cx: 840, cy: mid, r: 22 };
  const loopY = 188;
  const feedY = 30;
  return {
    W: 900, H: 206, game, grid: { x: 23, y: 69, cell: 9 },
    gameLabel: { x: game.x + game.w / 2, y: game.y - 10 },
    enc, dyn, ctl, z, z2, act,
    frameIn: `M ${game.x + game.w + 3} ${mid} L ${enc.x - 6} ${mid}`,
    encToZ: `M ${enc.x + enc.w + 3} ${mid} L ${z.x - 4} ${mid}`,
    zToDyn: `M ${z.x + z.w + 4} ${mid} L ${dyn.x - 6} ${mid}`,
    dynToZ2: `M ${dyn.x + dyn.w + 3} ${mid} L ${z2.x - 4} ${mid}`,
    z2ToCtl: `M ${z2.x + z2.w + 4} ${mid} L ${ctl.x - 6} ${mid}`,
    ctlToAct: `M ${ctl.x + ctl.w + 3} ${mid} L ${act.cx - act.r - 8} ${mid}`,
    loopToDyn: `M ${act.cx} ${act.cy + act.r + 2} L ${act.cx} ${loopY} L ${dyn.x + dyn.w / 2} ${loopY} L ${dyn.x + dyn.w / 2} ${dyn.y + dyn.h + 8}`,
    loopToGame: `M ${dyn.x + dyn.w / 2} ${loopY} L ${game.x + game.w / 2} ${loopY} L ${game.x + game.w / 2} ${game.y + game.h + 8}`,
    feedback: `M ${z2.x + z2.w / 2} ${z2.base - TICK_MAX - 8} L ${z2.x + z2.w / 2} ${feedY} L ${z.x + z.w / 2} ${feedY} L ${z.x + z.w / 2} ${z.base - TICK_MAX - 10}`,
    feedLabel: { x: (z.x + z2.x + z2.w) / 2, y: feedY - 8 },
    actionLabel: { x: act.cx - 8, y: loopY - 6 },
  };
})();

const COMPACT: Layout = (() => {
  const mid1 = 70;
  const mid2 = 196;
  const game: Box = { x: 20, y: 30, w: 82, h: 80 };
  const enc: Box = { x: 130, y: 40, w: 110, h: 60 };
  const z: Ticks = { x: 256, w: 96, base: mid1 + 12 };
  const dyn: Box = { x: 20, y: 166, w: 130, h: 60 };
  const z2: Ticks = { x: 166, w: 96, base: mid2 + 12 };
  const ctl: Box = { x: 282, y: 166, w: 112, h: 60 };
  const act = { cx: 436, cy: mid2, r: 20 };
  const loopY = 252;
  const dx = dyn.x + dyn.w / 2;
  return {
    W: 470, H: 266, game, grid: { x: 33, y: 43, cell: 9 },
    gameLabel: { x: game.x + game.w / 2, y: game.y - 10 },
    enc, dyn, ctl, z, z2, act,
    frameIn: `M ${game.x + game.w + 3} ${mid1} L ${enc.x - 6} ${mid1}`,
    encToZ: `M ${enc.x + enc.w + 3} ${mid1} L ${z.x - 4} ${mid1}`,
    zToDyn: `M ${z.x + z.w / 2} ${z.base + 4} L ${z.x + z.w / 2} 120 L ${dx} 120 L ${dx} ${dyn.y - 6}`,
    dynToZ2: `M ${dyn.x + dyn.w + 3} ${mid2} L ${z2.x - 4} ${mid2}`,
    z2ToCtl: `M ${z2.x + z2.w + 4} ${mid2} L ${ctl.x - 6} ${mid2}`,
    ctlToAct: `M ${ctl.x + ctl.w + 3} ${mid2} L ${act.cx - act.r - 6} ${mid2}`,
    loopToDyn: `M ${act.cx} ${act.cy + act.r + 2} L ${act.cx} ${loopY} L ${dx} ${loopY} L ${dx} ${dyn.y + dyn.h + 8}`,
    loopToGame: `M ${dx} ${loopY} L 6 ${loopY} L 6 ${mid1} L ${game.x - 6} ${mid1}`,
    feedback: `M ${z2.x + z2.w / 2} ${z2.base - TICK_MAX - 6} L ${z2.x + z2.w / 2} 150 L ${z.x + z.w - 20} 150 L ${z.x + z.w - 20} ${z.base + 8}`,
    feedLabel: { x: (z2.x + z2.w / 2 + z.x + z.w - 20) / 2, y: 144 },
    actionLabel: null,
  };
})();

type Strings = {
  game: string;
  enc: string[];
  dyn: string[];
  ctl: string[];
  action: string;
  z: string;
  zNext: string;
  fedBack: string;
  piece: string;
  inLabel: string;
  outLabel: string;
  forLabel: string;
  detail: Record<Piece, { in: string; out: string; why: string }>;
  step: string;
  where: string;
  real: string;
  dream: string;
  realLine: string;
  dreamLine: string;
  question: string;
  verdict: Record<Piece, string>;
  pick: string;
  realSteps: string;
  dreamSteps: string;
  width: string;
  widthNote: string;
  aria: (p: { mode: string; real: number; dream: number; piece: string }) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    game: "Real game",
    enc: ["Encoder"],
    dyn: ["Dynamics", "model"],
    ctl: ["Controller"],
    action: "action",
    z: "32 numbers",
    zNext: "next 32",
    fedBack: "fed back",
    piece: "Piece",
    inLabel: "In",
    outLabel: "Out",
    forLabel: "For",
    detail: {
      enc: {
        in: "One video frame.",
        out: "Thirty-two numbers.",
        why: "Squeezes the frame down to a short list of numbers the other two pieces can work on.",
      },
      dyn: {
        in: "The thirty-two numbers, plus the action taken.",
        out: "The next thirty-two numbers.",
        why: "Predicts where those numbers go next. It is the one piece that can run on its own output.",
      },
      ctl: {
        in: "The numbers.",
        out: "An action.",
        why: "Picks the action. Trained almost entirely inside the model's imagined rollouts, then moved back into the real game.",
      },
    },
    step: "Step",
    where: "Where is it running?",
    real: "In the real game",
    dream: "Inside the dream",
    realLine: "Frames come from the game. The dynamics model only predicts.",
    dreamLine: "The dynamics model feeds its own output back. The game is not consulted.",
    question: "Which piece is the world model?",
    verdict: {
      ctl: "No. The controller is the one piece that is plainly not a world model; it is the thing that uses one.",
      dyn: "Yes, and Ha and Schmidhuber used the name for the encoder and dynamics model together.",
      enc: "Half of it. It makes the state the model runs on.",
    },
    pick: "Pick one.",
    realSteps: "Real steps",
    dreamSteps: "Imagined steps",
    width: "Latent width",
    widthNote: "Ha and Schmidhuber's choice",
    aria: ({ mode, real, dream, piece }) =>
      `Three boxes in a loop: encoder, dynamics model, controller, with a real game feeding the encoder and the controller's action looping back. Running ${mode}. ${real} real steps, ${dream} imagined steps. ${piece} selected.`,
  },
  zh: {
    game: "真实游戏",
    enc: ["编码器"],
    dyn: ["动力学模型"],
    ctl: ["控制器"],
    action: "动作",
    z: "32 个数",
    zNext: "下一组 32 个",
    fedBack: "喂回",
    piece: "部件",
    inLabel: "输入",
    outLabel: "输出",
    forLabel: "用途",
    detail: {
      enc: {
        in: "一帧画面。",
        out: "三十二个数。",
        why: "把画面压成一小串数字，好让另外两块部件在上面工作。",
      },
      dyn: {
        in: "这三十二个数，加上所采取的动作。",
        out: "下一组三十二个数。",
        why: "预测这些数字接下来往哪走。它是唯一能拿自己的输出继续跑的部件。",
      },
      ctl: {
        in: "这些数字。",
        out: "一个动作。",
        why: "挑选动作。几乎完全在模型想象出来的推演里训练，然后搬回真实游戏。",
      },
    },
    step: "走一步",
    where: "它在哪里运行？",
    real: "在真实游戏里",
    dream: "在梦里",
    realLine: "画面来自游戏。动力学模型只负责预测。",
    dreamLine: "动力学模型把自己的输出喂回给自己。游戏不再被问到。",
    question: "哪一块是世界模型？",
    verdict: {
      ctl: "不是。控制器恰恰是那块显然不是世界模型的部件；它是使用世界模型的那个东西。",
      dyn: "是，而且 Ha 与 Schmidhuber 把这个名字用在编码器和动力学模型两者合起来的整体上。",
      enc: "算一半。它造出模型赖以运行的状态。",
    },
    pick: "选一个。",
    realSteps: "真实步数",
    dreamSteps: "想象步数",
    width: "潜在向量宽度",
    widthNote: "Ha 与 Schmidhuber 的选择",
    aria: ({ mode, real, dream, piece }) =>
      `三个方框连成一个环：编码器、动力学模型、控制器，真实游戏喂给编码器，控制器的动作回流。当前${mode}。真实步数 ${real}，想象步数 ${dream}。已选中${piece}。`,
  },
};

/* A small deterministic generator so server and client agree on every tick. */
function rng(seed: number) {
  let s = (seed * 1103515245 + 12345) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function series(n: number, seed: number) {
  const r = rng(seed);
  return Array.from({ length: n }, () => 0.2 + r() * 0.8);
}

/** Change a handful of entries and leave the rest alone, so the eye can follow. */
function nudge(v: number[], seed: number, count: number) {
  const r = rng(seed);
  const out = v.slice();
  for (let i = 0; i < count; i++) {
    const j = Math.floor(r() * out.length);
    out[j] = 0.15 + r() * 0.85;
  }
  return out;
}

const SEQ: Record<"real" | "dream", Stage[]> = {
  real: ["game", "enc", "dyn", "ctl", "act"],
  dream: ["dyn", "ctl", "act"],
};

export function ThreePieces() {
  const locale = useLocale();
  const s = pickText(TEXT, locale);
  const still = useReducedMotion();
  const { ref, compact } = useCompact(520);
  const k = compact ? 1.65 : 1;

  const [selected, setSelected] = useState<Piece>("dyn");
  const [dreaming, setDreaming] = useState(false);
  const [real, setReal] = useState(0);
  const [dream, setDream] = useState(0);
  const [z, setZ] = useState(() => series(LATENT, 7));
  const [zNext, setZNext] = useState(() => nudge(series(LATENT, 7), 11, 6));
  const [frame, setFrame] = useState(() => series(CELLS, 3));
  const [turn, setTurn] = useState(0);
  const [choice, setChoice] = useState<Choice>(null);

  /* the lighting pass: -1 idle, 0..n a stage, 99 everything at once */
  const [phase, setPhase] = useState(-1);
  const timers = useRef<number[]>([]);
  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  /** Set on the click itself; the timers only walk it forward and switch it off. */
  const light = (mode: "real" | "dream") => {
    clearTimers();
    if (still) {
      setPhase(99);
      timers.current.push(window.setTimeout(() => setPhase(-1), 900));
      return;
    }
    const n = SEQ[mode].length;
    setPhase(0);
    for (let i = 1; i <= n; i++) {
      timers.current.push(window.setTimeout(() => setPhase(i < n ? i : -1), i * 240));
    }
  };

  const step = () => {
    const n = real + dream + 1;
    if (dreaming) {
      setDream((d) => d + 1);
      setZ(zNext);
      setZNext(nudge(zNext, n * 31 + 5, 6));
    } else {
      setReal((r) => r + 1);
      const zz = nudge(z, n * 17 + 1, 5);
      setZ(zz);
      setZNext(nudge(zz, n * 31 + 5, 6));
      setFrame(nudge(frame, n * 13 + 2, 7));
    }
    setTurn(Math.floor(rng(n * 3)() * 3) - 1);
    light(dreaming ? "dream" : "real");
  };

  const seq = SEQ[dreaming ? "dream" : "real"];
  const lit = (st: Stage) => phase === 99 || (phase >= 0 && seq[phase] === st);

  const L = compact ? COMPACT : WIDE;
  const boxes = [
    { id: "enc" as Piece, box: L.enc, name: s.enc },
    { id: "dyn" as Piece, box: L.dyn, name: s.dyn },
    { id: "ctl" as Piece, box: L.ctl, name: s.ctl },
  ];

  const pieceName = (p: Piece) => s[p].join(" ");
  const detail = s.detail[selected];
  const mono = { className: "font-mono", letterSpacing: 1 } as const;

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg
          viewBox={`0 0 ${L.W} ${L.H}`}
          className="block w-full"
          role="img"
          aria-label={s.aria({
            mode: dreaming ? s.dream : s.real,
            real,
            dream,
            piece: pieceName(selected),
          })}
        >
          <defs>
            <marker id="tp-ar" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6" fill="none" stroke="var(--ink-muted)" strokeWidth="1.3" />
            </marker>
            <marker id="tp-ar-hot" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6" fill="none" stroke="var(--imagine)" strokeWidth="1.3" />
            </marker>
          </defs>

          {/* frame in: game to encoder, dropped to a dashed trace in the dream */}
          <path
            d={L.frameIn} fill="none"
            stroke={dreaming ? "var(--rule-strong)" : "var(--ink-muted)"}
            strokeWidth={1.4}
            strokeDasharray={dreaming ? "3 4" : undefined}
            markerEnd={dreaming ? undefined : "url(#tp-ar)"}
          />
          {[L.encToZ, L.dynToZ2].map((d) => (
            <path key={d} d={d} fill="none" stroke="var(--ink-muted)" strokeWidth={1.4} />
          ))}
          {[L.zToDyn, L.z2ToCtl, L.ctlToAct].map((d) => (
            <path key={d} d={d} fill="none" stroke="var(--ink-muted)" strokeWidth={1.4} markerEnd="url(#tp-ar)" />
          ))}

          {/* the action loops back: always into the dynamics model, into the game only when real */}
          <path d={L.loopToDyn} fill="none" stroke="var(--ink-muted)" strokeWidth={1.4} markerEnd="url(#tp-ar)" />
          <path
            d={L.loopToGame} fill="none"
            stroke={dreaming ? "var(--rule-strong)" : "var(--ink-muted)"}
            strokeWidth={1.4}
            strokeDasharray={dreaming ? "3 4" : undefined}
            markerEnd={dreaming ? undefined : "url(#tp-ar)"}
          />
          {L.actionLabel && (
            <text x={L.actionLabel.x} y={L.actionLabel.y} {...mono} fontSize={11 * k} fill="var(--ink-faint)" textAnchor="end">
              {s.action}
            </text>
          )}

          {/* in the dream the next latent is fed back into the dynamics model's input */}
          {dreaming && (
            <>
              <path d={L.feedback} fill="none" stroke="var(--imagine)" strokeWidth={1.6} markerEnd="url(#tp-ar-hot)" />
              <text x={L.feedLabel.x} y={L.feedLabel.y} {...mono} fontSize={11 * k} fill="var(--imagine)" textAnchor="middle">
                {s.fedBack}
              </text>
            </>
          )}

          {/* the real game: a tiny frame */}
          <rect
            x={L.game.x} y={L.game.y} width={L.game.w} height={L.game.h}
            fill={lit("game") ? "var(--actual-soft)" : "var(--paper)"}
            stroke={dreaming ? "var(--rule-strong)" : lit("game") ? "var(--actual)" : "var(--ink)"}
            strokeWidth={lit("game") ? 2 : 1.3}
            strokeDasharray={dreaming ? "4 4" : undefined}
            className="transition-[fill,stroke] duration-200 motion-reduce:transition-none"
          />
          {frame.map((v, i) => (
            <rect
              key={i}
              x={L.grid.x + (i % 6) * L.grid.cell}
              y={L.grid.y + Math.floor(i / 6) * L.grid.cell}
              width={L.grid.cell - 1} height={L.grid.cell - 1}
              fill={dreaming ? "var(--rule)" : "var(--ink)"}
              opacity={dreaming ? 0.9 : 0.12 + v * 0.78}
            />
          ))}
          <text x={L.gameLabel.x} y={L.gameLabel.y} textAnchor="middle" {...mono}
            fontSize={11 * k} fill={dreaming ? "var(--ink-faint)" : "var(--ink-muted)"}>
            {s.game}
          </text>

          {/* the three pieces */}
          {boxes.map((b) => {
            const on = lit(b.id);
            const sel = selected === b.id;
            const lines = compact ? b.name : [b.name.join(" ")];
            const cy = b.box.y + b.box.h / 2;
            return (
              <g key={b.id} onClick={() => setSelected(b.id)} className="cursor-pointer">
                <rect
                  x={b.box.x} y={b.box.y} width={b.box.w} height={b.box.h}
                  fill={on || sel ? "var(--imagine-soft)" : "var(--paper)"}
                  stroke={on || sel ? "var(--imagine)" : "var(--ink)"}
                  strokeWidth={on ? 2.4 : sel ? 2 : 1.3}
                  className="transition-[fill,stroke] duration-200 motion-reduce:transition-none"
                />
                {lines.map((ln, li) => (
                  <text
                    key={li}
                    x={b.box.x + b.box.w / 2}
                    y={cy + (li - (lines.length - 1) / 2) * 20 * k + 5 * k}
                    textAnchor="middle"
                    fontFamily="var(--font-body)"
                    fontSize={15.5 * k}
                    fill="var(--ink)"
                  >
                    {ln}
                  </text>
                ))}
              </g>
            );
          })}

          {/* the two latent rows: 32 ticks each */}
          {[
            { at: L.z, v: z, label: s.z },
            { at: L.z2, v: zNext, label: s.zNext },
          ].map(({ at, v, label }, row) => (
            <g key={row}>
              {v.map((h, i) => (
                <motion.rect
                  key={i}
                  x={at.x + i * 3}
                  width={2}
                  fill={row === 1 ? "var(--imagine)" : "var(--actual)"}
                  initial={false}
                  animate={{ y: at.base - h * TICK_MAX, height: h * TICK_MAX }}
                  transition={{ duration: still ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
              ))}
              <line x1={at.x - 2} y1={at.base + 1} x2={at.x + at.w} y2={at.base + 1} stroke="var(--rule-strong)" strokeWidth={1} />
              {!compact && (
                <text x={at.x + at.w / 2} y={at.base + 16} textAnchor="middle" {...mono} fontSize={11 * k} fill="var(--ink-faint)">
                  {label}
                </text>
              )}
            </g>
          ))}

          {/* the action: a glyph, turning left, straight or right */}
          <g transform={`translate(${L.act.cx} ${L.act.cy}) rotate(${turn * 34})`}>
            <circle r={L.act.r} fill={lit("act") ? "var(--imagine-soft)" : "var(--paper)"}
              stroke={lit("act") ? "var(--imagine)" : "var(--ink)"} strokeWidth={lit("act") ? 2 : 1.3}
              className="transition-[fill,stroke] duration-200 motion-reduce:transition-none" />
            <path d="M 0 11 L 0 -10 M -7 -3 L 0 -10 L 7 -3" fill="none" stroke="var(--ink)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      </div>

      {/* which piece, and what passes through it */}
      <div className="mt-4 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="label">{s.piece}</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label={s.piece}>
            {boxes.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b.id)}
                aria-pressed={selected === b.id}
                className={`border px-5 py-2 font-mono text-[0.7rem] uppercase tracking-[0.12em] transition-colors ${
                  selected === b.id
                    ? "border-imagine bg-imagine text-paper"
                    : "border-rule-strong bg-paper text-ink hover:border-ink"
                }`}
              >
                {pieceName(b.id)}
              </button>
            ))}
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 text-[0.92rem] leading-relaxed sm:grid-cols-[auto_1fr]">
          <dt className="label pt-0.5">{s.inLabel}</dt>
          <dd className="text-ink">{detail.in}</dd>
          <dt className="label pt-0.5">{s.outLabel}</dt>
          <dd className="text-ink">{detail.out}</dd>
          <dt className="label pt-0.5">{s.forLabel}</dt>
          <dd className="max-w-[58ch] text-ink-muted">{detail.why}</dd>
        </dl>
      </div>

      {/* step, and where the loop is running */}
      <div data-print-hide className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <button
          onClick={step}
          className="border border-rule-strong bg-paper px-5 py-2 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink active:border-imagine active:bg-imagine active:text-paper"
        >
          {s.step}
        </button>
        <label className="flex cursor-pointer items-center gap-3">
          <span className="label">{s.where}</span>
          <button
            role="switch"
            aria-checked={dreaming}
            aria-label={s.where}
            onClick={() => setDreaming((v) => !v)}
            className={`relative h-6 w-11 shrink-0 border transition-colors ${
              dreaming ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"
            }`}
          >
            <span
              className={`absolute top-[3px] h-4 w-4 transition-all ${
                dreaming ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"
              }`}
            />
          </button>
          <span className={`label !normal-case !tracking-normal !text-[0.8rem] ${dreaming ? "!text-imagine" : "!text-ink"}`}>
            {dreaming ? s.dream : s.real}
          </span>
        </label>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem] sm:basis-auto sm:flex-1">
          {dreaming ? s.dreamLine : s.realLine}
        </p>
      </div>

      {/* the question the chapter is circling */}
      <div data-print-hide className="border-t border-rule px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <span id="tp-q" className="text-[0.98rem] text-ink">{s.question}</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="tp-q">
            {boxes.map((b) => (
              <button
                key={b.id}
                role="radio"
                aria-checked={choice === b.id}
                onClick={() => {
                  setChoice(b.id);
                  setSelected(b.id);
                }}
                className={`border px-5 py-2 font-mono text-[0.7rem] uppercase tracking-[0.12em] transition-colors ${
                  choice === b.id
                    ? "border-imagine bg-imagine text-paper"
                    : "border-rule-strong bg-paper text-ink hover:border-ink"
                }`}
              >
                {pieceName(b.id)}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 max-w-[62ch] text-[0.92rem] leading-relaxed text-ink-muted" aria-live="polite">
          {choice ? s.verdict[choice] : s.pick}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [s.realSteps, String(real), null],
          [s.dreamSteps, String(dream), null],
          [s.width, String(LATENT), s.widthNote],
        ].map(([label, v, note]) => (
          <div key={label as string} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{label}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{v}</p>
            {note && <p className="mt-0.5 text-[0.8rem] text-ink-muted">{note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
