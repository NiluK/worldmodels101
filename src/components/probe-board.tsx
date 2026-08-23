"use client";

import { useReducedMotion } from "motion/react";
import { useId, useMemo, useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * Othello-GPT and the probe.
 *
 * A strip of move tokens goes into a network that was never shown a board. A
 * probe reads the network's activations and draws an 8 by 8 board from them.
 * Flip one disc in that inner board and the next legal moves change, which is
 * the evidence that the network plays from it. Ask the probe for mine and
 * theirs instead of black and white, and it can be a straight line.
 *
 * The position is a real five-move opening and the legal moves are computed
 * from the board, so the list changes honestly when a disc is flipped. The
 * activations are illustrative.
 */

type Text = {
  moves: string; legal: string; network: string; probe: string; linear: string; smallNet: string;
  notGiven1: string; notGiven2: string; readOut: string; legendBW: string; legendMT: string;
  read: string; clear: string; flip: string; flipBack: string; askMine: string;
  v0: string; v1: string; v2: string; rBoard: string; rProbe: string; rLegal: string;
  blank: string; wasRead: string; oneFlipped: string; probeBW: string; probeMT: string; aria: string;
};

const TEXT: LocaleText<Text> = {
  en: {
    moves: "moves so far",
    legal: "next legal moves, white",
    network: "network",
    probe: "probe",
    linear: "linear",
    smallNet: "small network",
    notGiven1: "not given",
    notGiven2: "read out",
    readOut: "read out by the probe",
    legendBW: "● black  ○ white",
    legendMT: "● mine  ○ theirs",
    read: "Read the board",
    clear: "Clear the readout",
    flip: "Flip a square in the inner board",
    flipBack: "Flip it back",
    askMine: "Ask as mine/theirs",
    v0: "The network was given the moves and nothing else. Ask the probe for the board.",
    v1: "The probe read a board out of the activations. Nobody put one in.",
    v2: "The disc at {sq} was flipped in the inner board, and the next legal moves changed with it. The network plays from that board.",
    rBoard: "Board",
    rProbe: "Probe",
    rLegal: "Next legal moves",
    blank: "blank",
    wasRead: "read out",
    oneFlipped: "read out, one disc flipped",
    probeBW: "small network, asked as black and white",
    probeMT: "a straight line, asked as mine and theirs",
    aria: "Move tokens feed a network, a probe reads its activations, and an 8 by 8 board on the right shows what the probe read. {state}",
  },
  zh: {
    moves: "已下的着法",
    legal: "接下来的合法着法，轮到白方",
    network: "网络",
    probe: "探针",
    linear: "线性",
    smallNet: "小网络",
    notGiven1: "未曾给出",
    notGiven2: "只能读出",
    readOut: "由探针读出",
    legendBW: "● 黑  ○ 白",
    legendMT: "● 我方  ○ 对方",
    read: "读出棋盘",
    clear: "清除读数",
    flip: "把内部棋盘上的一格翻过来",
    flipBack: "翻回去",
    askMine: "按「我方/对方」来问",
    v0: "网络只拿到过这些着法，别的什么都没有。让探针去读棋盘。",
    v1: "探针从激活值里读出了一个棋盘。没有人把棋盘放进去过。",
    v2: "内部棋盘上 {sq} 的棋子被翻了过来，接下来的合法着法也跟着变了。网络下棋用的就是这个棋盘。",
    rBoard: "棋盘",
    rProbe: "探针",
    rLegal: "合法着法数",
    blank: "空白",
    wasRead: "已读出",
    oneFlipped: "已读出，一子被翻",
    probeBW: "小网络，按黑白来问",
    probeMT: "一条直线，按我方对方来问",
    aria: "着法记号进入一个网络，探针读取它的激活值，右侧的 8×8 棋盘显示探针读出的结果。{state}",
  },
};

/* ---------- a real Othello position, so the legal moves are honest ---------- */

type Board = number[][]; // 0 empty, 1 black, 2 white
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] as const;
const sq = (c: number, r: number) => "abcdefgh"[c] + (r + 1);
const on = (x: number, y: number) => x >= 0 && x < 8 && y >= 0 && y < 8;

function captured(b: Board, c: number, r: number, me: number) {
  const out: [number, number][] = [];
  if (b[r][c]) return out;
  for (const [dx, dy] of DIRS) {
    const run: [number, number][] = [];
    let x = c + dx, y = r + dy;
    while (on(x, y) && b[y][x] === 3 - me) { run.push([x, y]); x += dx; y += dy; }
    if (run.length && on(x, y) && b[y][x] === me) out.push(...run);
  }
  return out;
}
function legalMoves(b: Board, me: number) {
  const l: string[] = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (captured(b, c, r, me).length) l.push(sq(c, r));
  return l;
}
const MOVES = ["d3", "c5", "f6", "f5", "e6"];
const TO_MOVE = MOVES.length % 2 ? 2 : 1; // black opens, so white is to move here
const BASE: Board = Array.from({ length: 8 }, () => Array(8).fill(0));
BASE[3][3] = 2; BASE[3][4] = 1; BASE[4][3] = 1; BASE[4][4] = 2;
MOVES.reduce((me, m) => {
  const c = "abcdefgh".indexOf(m[0]), r = Number(m[1]) - 1;
  for (const [x, y] of captured(BASE, c, r, me)) BASE[y][x] = me;
  BASE[r][c] = me;
  return 3 - me;
}, 1);
const FLIP = { c: 3, r: 3 }; // d4
const FLIPPED = BASE.map((row) => [...row]);
FLIPPED[FLIP.r][FLIP.c] = 3 - FLIPPED[FLIP.r][FLIP.c];
const LEGAL_BASE = legalMoves(BASE, TO_MOVE);
const LEGAL_FLIP = legalMoves(FLIPPED, TO_MOVE);

/* illustrative activations: a row of ticks, a few of which move with the flip.
   A literal list, not Math.sin, so server and browser agree to the last digit. */
const ACT = [0.62, 0.31, 0.84, 0.47, 0.29, 0.73, 0.55, 0.92, 0.38, 0.66, 0.27, 0.79,
  0.44, 0.88, 0.35, 0.58, 0.71, 0.26, 0.63, 0.49, 0.81, 0.33, 0.57, 0.42];
const SHIFT = new Set([2, 7, 11, 16, 20]);

type Box = { x: number; y: number; w: number; h: number };

function layout(compact: boolean) {
  const k = compact ? 1.65 : 1;
  const rowH = 20 * k, step = 34 * k;
  const tok = compact ? { x: 24, y: 24, w: 432 } : { x: 24, y: 40, w: 210 };
  const perRow = Math.max(1, Math.floor(tok.w / step));
  const labelY = tok.y + 10 * k;
  const tokensY = labelY + rowH * 1.1;
  const legalLabelY = tokensY + Math.ceil(MOVES.length / perRow) * rowH + 8 * k;
  const legalY = legalLabelY + rowH * 1.1;
  const tokBottom = legalY + (Math.ceil(11 / perRow) - 1) * rowH + 6 * k;
  const tokens: Box = { ...tok, h: tokBottom - tok.y };
  const net: Box = compact ? { x: 60, y: tokBottom + 36, w: 360, h: 100 } : { x: 268, y: 40, w: 150, h: 150 };
  const probe: Box = compact ? { x: 130, y: net.y + net.h + 36, w: 220, h: 80 } : { x: 460, y: 75, w: 160, h: 80 };
  const board: Box = compact ? { x: 116, y: probe.y + probe.h + 36, w: 248, h: 248 } : { x: 672, y: 36, w: 248, h: 248 };
  const W = compact ? 480 : 940;
  const H = board.y + board.h + (compact ? 40 : 36);
  const arrow = (a: Box, b: Box) =>
    compact
      ? { x1: b.x + b.w / 2, y1: a.y + a.h + 8, x2: b.x + b.w / 2, y2: b.y - 8 }
      : { x1: a.x + a.w + 8, y1: 115, x2: b.x - 8, y2: 115 };
  return { k, rowH, step, perRow, labelY, tokensY, legalLabelY, legalY, tokens, net, probe, board, W, H,
    arrows: [arrow(tokens, net), arrow(net, probe), arrow(probe, board)] };
}

export function ProbeBoard() {
  const uid = useId();
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const [read, setRead] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [mine, setMine] = useState(false);

  const L = useMemo(() => layout(compact), [compact]);
  const { k } = L;
  const board = flipped ? FLIPPED : BASE;
  const legal = flipped ? LEGAL_FLIP : LEGAL_BASE;
  const cell = L.board.w / 8;
  const flipSq = sq(FLIP.c, FLIP.r);
  const verdict = flipped ? T.v2.replace("{sq}", flipSq) : read ? T.v1 : T.v0;
  const label = { className: "font-mono", fontSize: 10 * k, letterSpacing: 1, fill: "var(--ink-faint)" };

  const toggleRead = () => {
    if (read) setFlipped(false);
    setRead((v) => !v);
  };
  const toggleFlip = () => {
    setRead(true);
    setFlipped((v) => !v);
  };

  // probe glyph: a straight line, or three dots feeding two
  const g = compact ? 1.2 : 1;
  const gx = L.probe.x + L.probe.w - 48 * g, gy = L.probe.y + 8;
  const rect = (b: Box) => ({ x: b.x, y: b.y, width: b.w, height: b.h });

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${L.W} ${L.H}`} className="block w-full" role="img"
          aria-label={T.aria.replace("{state}", verdict)}>
          <defs>
            <marker id="pb-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0 0 L6 3 L0 6 z" fill="var(--rule-strong)" />
            </marker>
          </defs>

          {/* the only thing the network was ever given */}
          <text x={L.tokens.x} y={L.labelY} {...label}>{T.moves}</text>
          {MOVES.map((m, i) => (
            <text key={m} x={L.tokens.x + (i % L.perRow) * L.step} y={L.tokensY + Math.floor(i / L.perRow) * L.rowH}
              className="font-mono" fontSize={13 * k} fill="var(--ink)">{m}</text>
          ))}
          <text x={L.tokens.x} y={L.legalLabelY} {...label}>{T.legal}</text>
          {legal.map((m, i) => (
            <text key={m} x={L.tokens.x + (i % L.perRow) * L.step} y={L.legalY + Math.floor(i / L.perRow) * L.rowH}
              className="font-mono" fontSize={13 * k}
              fill={LEGAL_BASE.includes(m) ? "var(--ink)" : "var(--imagine)"}>{m}</text>
          ))}

          {L.arrows.map((a, i) => (
            <line key={i} {...a} stroke="var(--rule-strong)" strokeWidth="1" markerEnd="url(#pb-arrow)" />
          ))}

          {/* network: a box of activations */}
          <rect {...rect(L.net)} fill="var(--paper)" stroke="var(--rule-strong)" strokeWidth="1" />
          <text x={L.net.x + 12} y={L.net.y + 16 * k} {...label}>{T.network}</text>
          {ACT.map((h0, i) => {
            const shifted = flipped && SHIFT.has(i);
            const h = shifted ? 1.15 - h0 : h0;
            const inner = L.net.w - 24, s = inner / ACT.length;
            const base = L.net.y + L.net.h - 14, max = L.net.h - 26 * k - 24;
            return (
              <rect key={i} x={L.net.x + 12 + i * s + s * 0.25} y={base - h * max} width={s * 0.5} height={h * max}
                fill={shifted ? "var(--imagine)" : "var(--actual)"}
                style={{ transition: still ? "none" : "y 0.3s ease, height 0.3s ease" }} />
            );
          })}

          {/* probe: what reads the board out */}
          <rect {...rect(L.probe)} fill="var(--paper)" stroke="var(--rule-strong)" strokeWidth="1" />
          <text x={L.probe.x + 12} y={L.probe.y + 16 * k} {...label}>{T.probe}</text>
          <text x={L.probe.x + 12} y={L.probe.y + L.probe.h - 14} className="font-mono" fontSize={11 * k} fill="var(--ink)">
            {mine ? T.linear : T.smallNet}
          </text>
          {mine ? (
            <line x1={gx} y1={gy + 26 * g} x2={gx + 36 * g} y2={gy + 4 * g} stroke="var(--actual)" strokeWidth={1.5 * g} />
          ) : (
            <g stroke="var(--actual)" strokeWidth={0.8 * g} fill="var(--actual)">
              {[4, 15, 26].map((ly) => [9, 21].map((ry) => (
                <line key={`${ly}-${ry}`} x1={gx} y1={gy + ly * g} x2={gx + 36 * g} y2={gy + ry * g} />
              )))}
              {[4, 15, 26].map((ly) => <circle key={ly} cx={gx} cy={gy + ly * g} r={2.4 * g} />)}
              {[9, 21].map((ry) => <circle key={ry} cx={gx + 36 * g} cy={gy + ry * g} r={2.4 * g} />)}
            </g>
          )}

          {/* the board, drawn only from what the probe reads */}
          <rect {...rect(L.board)} fill="var(--paper)" stroke="var(--rule-strong)" strokeWidth="1" />
          {Array.from({ length: 7 }, (_, i) => (
            <g key={i} stroke="var(--rule)" strokeWidth="1">
              <line x1={L.board.x + (i + 1) * cell} y1={L.board.y} x2={L.board.x + (i + 1) * cell} y2={L.board.y + L.board.h} />
              <line x1={L.board.x} y1={L.board.y + (i + 1) * cell} x2={L.board.x + L.board.w} y2={L.board.y + (i + 1) * cell} />
            </g>
          ))}
          {board.map((row, r) => row.map((v, c) => {
            if (!v) return null;
            const filled = mine ? v === TO_MOVE : v === 1;
            const isFlip = flipped && r === FLIP.r && c === FLIP.c;
            const cx = L.board.x + (c + 0.5) * cell, cy = L.board.y + (r + 0.5) * cell;
            return (
              <g key={sq(c, r)} style={{ opacity: read ? 1 : 0, transition: still ? "none" : `opacity 0.2s ease ${(r * 8 + c) * 8}ms` }}>
                <circle cx={cx} cy={cy} r={cell * 0.36} fill={filled ? "var(--ink)" : "var(--paper)"} stroke="var(--ink)" strokeWidth="1.2" />
                {isFlip && <circle cx={cx} cy={cy} r={cell * 0.46} fill="none" stroke="var(--imagine)" strokeWidth="2.5" />}
              </g>
            );
          }))}
          {!read && (
            <g className="font-mono" fontSize={11 * k} fill="var(--ink-faint)" letterSpacing="1" textAnchor="middle">
              <rect x={L.board.x + L.board.w / 2 - 44 * k} y={L.board.y + L.board.h / 2 - 16 * k} width={88 * k} height={34 * k} fill="var(--paper)" />
              <text x={L.board.x + L.board.w / 2} y={L.board.y + L.board.h / 2 - 4 * k}>{T.notGiven1}</text>
              <text x={L.board.x + L.board.w / 2} y={L.board.y + L.board.h / 2 + 12 * k}>{T.notGiven2}</text>
            </g>
          )}
          <text x={L.board.x} y={L.board.y + L.board.h + 20 * k} {...label}>
            {read ? (mine ? T.legendMT : T.legendBW) : ""}
          </text>
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        {([[read, toggleRead, read ? T.clear : T.read], [flipped, toggleFlip, flipped ? T.flipBack : T.flip]] as const).map(
          ([active, onClick, text]) => (
            <button key={text} type="button" onClick={onClick} aria-pressed={active}
              className={`border px-4 py-1.5 transition-colors ${
                active ? "border-imagine bg-imagine text-paper" : "border-rule-strong bg-paper text-ink hover:border-ink"
              }`}>
              <span className={`label ${active ? "!text-paper" : ""}`}>{text}</span>
            </button>
          ),
        )}
        <span className="flex items-center gap-3">
          <span className="label" id={`${uid}-mine`}>{T.askMine}</span>
          <button type="button" role="switch" aria-labelledby={`${uid}-mine`} aria-checked={mine} onClick={() => setMine((v) => !v)}
            className={`relative h-6 w-11 border transition-colors ${mine ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"}`}>
            <span className={`absolute top-[3px] h-4 w-4 transition-all ${mine ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"}`} />
          </button>
        </span>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">{verdict}</p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.rBoard, flipped ? T.oneFlipped : read ? T.wasRead : T.blank],
          [T.rProbe, mine ? T.probeMT : T.probeBW],
          [T.rLegal, String(legal.length)],
        ].map(([kk, v]) => (
          <div key={kk} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{kk}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
