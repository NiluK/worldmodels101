"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText } from "@/lib/locale-text";

/**
 * MuZero's model answers with three numbers, never with a board.
 *
 * Left, a position. Middle, the model. Right, what comes out: reward, value,
 * policy. A switch adds the board MuZero never drew, and a small search tree
 * shows that planning only ever read the numbers. Every figure is illustrative.
 */

const TEXT = {
  en: {
    position: "the position",
    model: "MuZero's model",
    nextBoard: "the next board",
    neverDrawn: "never drawn",
    readOff: "read off",
    reward: "reward",
    value: "value",
    policy: "policy",
    lose: "lose",
    win: "win",
    predicts: "What the model predicts",
    three: "three numbers",
    board: "the next board",
    search: "Search",
    reset: "Reset",
    tree: "search tree",
    idleThree: "The model answers with three numbers. Press Search to step the tree.",
    idleBoard: "The model answers with a whole board, and the three numbers are read off it. Press Search to step the tree.",
    vThree: "The search read three numbers at every node and never asked for a picture. That is what planning needs.",
    vBoard: "Drawing the board at every node costs more and the search reads none of it.",
    nodes: "nodes visited",
    numbers: "numbers read",
    boards: "boards drawn",
    aria: (mode: string, n: number, b: number) =>
      `A Go position feeds MuZero's model, which outputs reward, value and policy. Mode: ${mode}. The search tree has visited ${n} nodes and drawn ${b} boards.`,
  },
  zh: {
    position: "当前局面",
    model: "MuZero 的模型",
    nextBoard: "下一个棋盘",
    neverDrawn: "从未画出",
    readOff: "读出",
    reward: "奖励",
    value: "价值",
    policy: "策略",
    lose: "输",
    win: "赢",
    predicts: "模型预测的是什么",
    three: "三个数",
    board: "下一个棋盘",
    search: "搜索",
    reset: "重置",
    tree: "搜索树",
    idleThree: "模型用三个数作答。按「搜索」逐步展开搜索树。",
    idleBoard: "模型画出整张棋盘，再从上面读出三个数。按「搜索」逐步展开搜索树。",
    vThree: "搜索在每个节点只读三个数，从未要过一张图。规划需要的正是这些。",
    vBoard: "在每个节点画出棋盘代价更高，而搜索一点也不读它。",
    nodes: "访问的节点",
    numbers: "读出的数",
    boards: "画出的棋盘",
    aria: (mode: string, n: number, b: number) =>
      `一个围棋局面输入 MuZero 的模型，模型输出奖励、价值和策略。模式：${mode}。搜索树已访问 ${n} 个节点，画出 ${b} 张棋盘。`,
  },
} as const;

const N = 9;
/** illustrative stones: [row, col, black?] */
const STONES: [number, number, boolean][] = [
  [2, 2, true], [2, 6, false], [3, 3, false], [4, 4, true], [4, 5, false],
  [5, 3, true], [5, 5, true], [6, 2, false], [6, 6, false], [3, 6, true],
];
/** illustrative likely moves: [row, col, weight] */
const POLICY: [number, number, number][] = [
  [3, 4, 0.4], [5, 4, 0.3], [4, 3, 0.2], [6, 4, 0.1],
];
const VALUE = 0.6;

/** three levels: root, three children, two grandchildren under the best child */
const TREE = [
  { id: 0, x: 450, y: 20, v: 0.6, p: 1, parent: -1, level: 0 },
  { id: 1, x: 330, y: 88, v: 0.7, p: 0.4, parent: 0, level: 1 },
  { id: 2, x: 450, y: 88, v: 0.5, p: 0.3, parent: 0, level: 1 },
  { id: 3, x: 570, y: 88, v: 0.4, p: 0.2, parent: 0, level: 1 },
  { id: 4, x: 260, y: 156, v: 0.8, p: 0.5, parent: 1, level: 2 },
  { id: 5, x: 400, y: 156, v: 0.5, p: 0.3, parent: 1, level: 2 },
];

function Board({ x, y, size, stones, extra, faint = false, cross = false }: {
  x: number; y: number; size: number; stones: [number, number, boolean][];
  extra?: [number, number, boolean]; faint?: boolean; cross?: boolean;
}) {
  const cell = size / N;
  const all = extra ? [...stones, extra] : stones;
  const stroke = faint ? "var(--rule)" : "var(--rule-strong)";
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={size} height={size} fill={faint ? "var(--paper-sunk)" : "var(--paper)"} stroke="var(--rule)" />
      {Array.from({ length: N }, (_, i) => (
        <g key={i}>
          <line x1={cell / 2} y1={cell / 2 + i * cell} x2={size - cell / 2} y2={cell / 2 + i * cell} stroke={stroke} strokeWidth="0.6" />
          <line x1={cell / 2 + i * cell} y1={cell / 2} x2={cell / 2 + i * cell} y2={size - cell / 2} stroke={stroke} strokeWidth="0.6" />
        </g>
      ))}
      {!faint && all.map(([r, c, black], i) => (
        <circle key={i} cx={cell / 2 + c * cell} cy={cell / 2 + r * cell} r={cell * 0.42}
          fill={black ? "var(--ink)" : "var(--paper)"} stroke={black ? "var(--ink)" : "var(--rule-strong)"} strokeWidth="0.8" />
      ))}
      {cross && (
        <g stroke="var(--rule-strong)" strokeWidth="0.8">
          <line x1="0" y1="0" x2={size} y2={size} />
          <line x1={size} y1="0" x2="0" y2={size} />
        </g>
      )}
    </g>
  );
}

export function ThreeNumbers() {
  const [mode, setMode] = useState<"three" | "board">("three");
  const [step, setStep] = useState(0);
  const locale = useLocale();
  const t = pickText(TEXT, locale);
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const k = compact ? 1.65 : 1;
  const fs = 10 * k;

  const visible = TREE.filter((n) => n.level < step);
  const visited = visible.length;
  const boards = mode === "board" ? visited : 0;
  const modeLabel = mode === "three" ? t.three : t.board;

  /**
   * Wide: one row, position, model, next board, outputs, then the tree.
   * Compact: two rows. The model sits beside the position; the next board and
   * the outputs share the row below, and the tree is spread across the width.
   */
  const L = compact
    ? { W: 460, H: 640, pos: [20, 20], model: [250, 65], mw: 180, next: [20, 210], out: [250, 210], outPolicy: [0, 128], tree: { y: 440, cx: 230, sx: 1.1 } }
    : { W: 900, H: 420, pos: [20, 28], model: [230, 73], mw: 130, next: [420, 28], out: [640, 28], outPolicy: [140, 96], tree: { y: 228, cx: 450, sx: 1 } };
  const [px, py] = L.pos;
  const [mx, my] = L.model;
  const mw = L.mw;
  const mc = mx + mw / 2;
  const [nx, ny] = L.next;
  const [ox, oy] = L.out;
  const tx = (x: number) => L.tree.cx + (x - 450) * L.tree.sx;

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${L.W} ${L.H}`} className="block w-full" role="img" aria-label={t.aria(modeLabel, visited, boards)}>
          <defs>
            <marker id="tn-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0 0 L8 4 L0 8 z" fill="var(--rule-strong)" />
            </marker>
          </defs>

          {/* the position */}
          <Board x={px} y={py} size={150} stones={STONES} />
          <text x={px + 75} y={py + 168} textAnchor="middle" className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-muted)">{t.position}</text>
          <line x1={px + 156} y1={py + 75} x2={mx - 4} y2={py + 75} stroke="var(--rule-strong)" markerEnd="url(#tn-arrow)" />

          {/* the model */}
          <rect x={mx} y={my} width={mw} height={60} fill="var(--paper)" stroke="var(--imagine)" strokeWidth="1.2" />
          <text x={mc} y={my + 34} textAnchor="middle" className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink)">{t.model}</text>

          {/* the next board: drawn, or never drawn */}
          {mode === "board" ? (
            <>
              {compact ? (
                <path d={`M${mc} ${my + 64} C ${mc} ${ny - 20}, ${nx + 75} ${my + 90}, ${nx + 75} ${ny - 4}`} fill="none" stroke="var(--rule-strong)" markerEnd="url(#tn-arrow)" />
              ) : (
                <line x1={mx + mw + 6} y1={py + 75} x2={nx - 4} y2={py + 75} stroke="var(--rule-strong)" markerEnd="url(#tn-arrow)" />
              )}
              <Board x={nx} y={ny} size={150} stones={STONES} extra={[3, 4, true]} />
              <line x1={nx + 156} y1={ny + 75} x2={ox - 14} y2={ny + 75} stroke="var(--rule-strong)" markerEnd="url(#tn-arrow)" />
              <text x={(nx + 156 + ox - 14) / 2} y={ny + 66} textAnchor="middle" className="font-mono" fontSize={fs * 0.9} fill="var(--ink-muted)">{t.readOff}</text>
            </>
          ) : (
            <>
              {compact ? (
                <line x1={mc} y1={my + 64} x2={mc} y2={oy - 6} stroke="var(--rule-strong)" markerEnd="url(#tn-arrow)" />
              ) : (
                <path d={`M${mx + mw + 6} ${py + 75} C ${nx} ${py - 10}, ${nx + 156} ${py - 10}, ${ox - 12} ${py + 75}`} fill="none" stroke="var(--rule-strong)" markerEnd="url(#tn-arrow)" />
              )}
              <Board x={nx} y={ny} size={150} stones={[]} faint cross />
            </>
          )}
          <text x={nx + 75} y={ny + 168} textAnchor="middle" className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-muted)">
            {mode === "board" ? t.nextBoard : t.neverDrawn}
          </text>

          {/* three outputs */}
          <g transform={`translate(${ox} ${oy})`}>
            <text x={0} y={12} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-muted)">{t.reward}</text>
            <text x={120} y={12} textAnchor="end" className="font-mono tnum" fontSize={fs * 1.4} fill="var(--imagine)">0</text>

            <text x={0} y={52} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-muted)">{t.value}</text>
            <rect x={0} y={60} width={120} height={8} fill="var(--paper-sunk)" stroke="var(--rule)" />
            <rect x={0} y={60} width={120 * VALUE} height={8} fill="var(--imagine)" />
            <text x={0} y={84} className="font-mono" fontSize={fs * 0.85} fill="var(--ink-faint)">{t.lose}</text>
            <text x={120} y={84} textAnchor="end" className="font-mono" fontSize={fs * 0.85} fill="var(--ink-faint)">{t.win}</text>

            <text x={0} y={118} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-muted)">{t.policy}</text>
            <g transform={`translate(${L.outPolicy[0]} ${L.outPolicy[1]})`}>
              <Board x={0} y={0} size={72} stones={[]} faint />
              {POLICY.map(([r, c, w]) => (
                <circle key={`${r}${c}`} cx={4 + c * 8} cy={4 + r * 8} r={1.8 + w * 6} fill="var(--imagine)" opacity={0.45 + w} />
              ))}
            </g>
          </g>

          {/* the search tree */}
          <g transform={`translate(0 ${L.tree.y})`}>
            <line x1={20} y1={0} x2={L.W - 20} y2={0} stroke="var(--rule)" />
            <text x={20} y={16} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-faint)">{t.tree}</text>
            {TREE.map((n) => (
              <circle key={`g${n.id}`} cx={tx(n.x)} cy={n.y} r={7} fill="none" stroke="var(--rule)" strokeDasharray="2 2" />
            ))}
            {visible.map((n) => {
              const parent = TREE[n.parent];
              return (
                <motion.g key={n.id} initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: still ? 0 : 0.3 }}>
                  {parent && (
                    <line x1={tx(parent.x)} y1={parent.y + 8} x2={tx(n.x)} y2={n.y - 8} stroke="var(--rule-strong)" strokeWidth="0.8" />
                  )}
                  {mode === "board" ? (
                    <Board x={tx(n.x) - 14} y={n.y - 14} size={28} stones={STONES} extra={n.level ? [3, 4, true] : undefined} />
                  ) : (
                    <circle cx={tx(n.x)} cy={n.y} r={7} fill="var(--paper)" stroke="var(--imagine)" strokeWidth="1.2" />
                  )}
                  <text x={tx(n.x) + (mode === "board" ? 20 : 13)} y={n.y + 3.5} className="font-mono tnum" fontSize={fs * 0.9} fill="var(--ink)">
                    v {n.v.toFixed(1)}{compact || !n.level ? "" : `  p ${n.p.toFixed(1)}`}
                  </text>
                </motion.g>
              );
            })}
          </g>
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="label whitespace-nowrap">{t.predicts}</span>
          <div className="flex flex-wrap gap-y-2">
            {(["three", "board"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}
                className={`whitespace-nowrap border px-3 py-1 font-mono text-[0.72rem] uppercase tracking-[0.12em] ${
                  mode === m ? "border-imagine bg-imagine text-paper" : "border-rule-strong bg-paper text-ink hover:border-ink"
                }`}>
                {m === "three" ? t.three : t.board}
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={() => setStep((s) => (s >= 3 ? 0 : s + 1))}
          className="border border-rule-strong bg-paper px-3 py-1 font-mono text-[0.72rem] uppercase tracking-[0.12em] text-ink hover:border-ink">
          {step >= 3 ? t.reset : t.search}
        </button>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {step === 0 ? (mode === "three" ? t.idleThree : t.idleBoard) : mode === "three" ? t.vThree : t.vBoard}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [t.nodes, String(visited)],
          [t.numbers, String(visited * 3)],
          [t.boards, String(boards)],
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
