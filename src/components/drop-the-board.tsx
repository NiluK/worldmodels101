"use client";

import { useReducedMotion } from "motion/react";
import { useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * Four things a model could carry, and only two of them decide anything.
 *
 * The position on the left is the input and never changes. The column in the
 * middle is what a model might hold on to; the panel on the right is the only
 * thing anyone actually wanted. Drop the picture and drop the stones and the
 * recommendation does not move, while nearly all of the cost goes. Drop either
 * of the two numbers and there is nothing left to recommend with.
 *
 * The board, the two scores and the costs are invented. The shape is the
 * claim: a model does not have to look like the world.
 */

type CarriedId = "picture" | "stones" | "value" | "policy";
type MoveId = "topRight" | "centre";

const CARRIED: { id: CarriedId; cost: number; hat: boolean }[] = [
  { id: "picture", cost: 240, hat: false },
  { id: "stones", cost: 90, hat: false },
  { id: "value", cost: 1, hat: true },
  { id: "policy", cost: 1, hat: true },
];

/** the two numbers are the ones the recommendation is built out of */
const DECIDERS: CarriedId[] = ["value", "policy"];
const LOOKABLE: CarriedId[] = ["picture", "stones"];

const MOVES: { id: MoveId; col: number; row: number; value: number }[] = [
  { id: "topRight", col: 7, row: 1, value: 0.62 },
  { id: "centre", col: 4, row: 4, value: 0.53 },
];

/** ten stones on a 9 by 9, hardcoded, chosen only to look like a game */
const STONES: { col: number; row: number; black: boolean }[] = [
  { col: 2, row: 2, black: true },
  { col: 6, row: 2, black: true },
  { col: 2, row: 6, black: true },
  { col: 6, row: 6, black: true },
  { col: 3, row: 4, black: true },
  { col: 4, row: 2, black: false },
  { col: 2, row: 4, black: false },
  { col: 6, row: 4, black: false },
  { col: 4, row: 6, black: false },
  { col: 7, row: 7, black: false },
];

/**
 * Two layouts, not one scaled down. A 900 unit box in a phone column shrinks
 * every label past reading, so the narrow one stacks the three panels and is
 * drawn in a 560 unit box with type to match.
 */
function layout(compact: boolean) {
  const fs = compact ? 17 : 10.5;
  const W = compact ? 560 : 900;
  const H = compact ? 930 : 300;
  const cell = compact ? 34 : 26;
  const board = { x: compact ? (W - cell * 8) / 2 : 34, y: 26 };
  const col = {
    x: compact ? 40 : 300,
    y: compact ? 368 : 30,
    w: compact ? 480 : 292,
    rowH: compact ? 64 : 50,
  };
  const rec = { x: compact ? 40 : 640, y: compact ? 706 : 30, w: compact ? 480 : 230 };
  return { fs, W, H, cell, board, col, rec };
}

type Strings = {
  position: string;
  columnTitle: string;
  recTitle: string;
  items: Record<CarriedId, string>;
  short: Record<CarriedId, string>;
  drop: (s: string) => string;
  carry: (s: string) => string;
  carryAll: string;
  moves: Record<MoveId, string>;
  noRec: string;
  totalLabel: string;
  units: (n: number) => string;
  droppedLabel: string;
  ofFour: (n: number) => string;
  none: string;
  vAll: string;
  vLooked: string;
  vNumber: string;
  vMixed: (n: number) => string;
  estimates: string;
  aria: (carried: number, total: number, rec: string) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    position: "the position",
    columnTitle: "what it could carry",
    recTitle: "the move it recommends",
    items: {
      picture: "a picture of the next board",
      stones: "where every stone is",
      value: "how good this is",
      policy: "what to try",
    },
    short: {
      picture: "the picture",
      stones: "the stones",
      value: "how good this is",
      policy: "what to try",
    },
    drop: (s) => `drop ${s}`,
    carry: (s) => `carry ${s}`,
    carryAll: "Carry all four",
    moves: { topRight: "play at the top right", centre: "play at the centre" },
    noRec: "no recommendation",
    totalLabel: "what it carries",
    units: (n) => `${n} ${n === 1 ? "unit" : "units"}`,
    droppedLabel: "dropped",
    ofFour: (n) => `${n} of 4`,
    none: "none",
    vAll: "It carries everything. The move at the top right wins by 0.09.",
    vLooked: "You dropped everything you could look at, and the move did not move.",
    vNumber:
      "Drop either number and there is no move to recommend. Those two are what the decision turned on.",
    vMixed: (n) => `It carries ${n} of the four.`,
    estimates: "Both numbers are estimates.",
    aria: (carried, total, rec) =>
      `An illustrative nine by nine Go position beside four things a model could carry. It carries ${carried} of the four, costing ${total} illustrative units. ${rec}`,
  },
  zh: {
    position: "局面",
    columnTitle: "它可以带上的东西",
    recTitle: "它推荐的一手",
    items: {
      picture: "下一个棋盘的图",
      stones: "每颗子在哪儿",
      value: "这有多好",
      policy: "该试什么",
    },
    short: {
      picture: "那张图",
      stones: "那些子",
      value: "这有多好",
      policy: "该试什么",
    },
    drop: (s) => `丢掉${s}`,
    carry: (s) => `带上${s}`,
    carryAll: "四样都带上",
    moves: { topRight: "下在右上", centre: "下在天元" },
    noRec: "没有可推荐的一手",
    totalLabel: "它带着的东西",
    units: (n) => `${n} 单位`,
    droppedLabel: "已丢掉",
    ofFour: (n) => `4 样里的 ${n} 样`,
    none: "无",
    vAll: "四样全带着。右上那一手以 0.09 领先。",
    vLooked: "凡是能看的你都丢掉了，那一手却没有动。",
    vNumber: "两个数丢掉任何一个，就没有可推荐的一手了。当初的决定就落在这两样上。",
    vMixed: (n) => `它带着四样里的 ${n} 样。`,
    estimates: "这两个数都是估计出来的。",
    aria: (carried, total, rec) =>
      `左边是一个示意性的 9 路围棋局面，旁边是模型可以带上的四样东西。它带着四样里的 ${carried} 样，代价是 ${total} 个示意单位。${rec}`,
  },
};

export function DropTheBoard() {
  const [dropped, setDropped] = useState<CarriedId[]>([]);
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const L = layout(compact);
  const fs = L.fs;

  const isDropped = (id: CarriedId) => dropped.includes(id);
  const toggle = (id: CarriedId) =>
    setDropped((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  const alive = DECIDERS.every((id) => !isDropped(id));
  const total = CARRIED.reduce((a, c) => a + (isDropped(c.id) ? 0 : c.cost), 0);
  const carriedCount = CARRIED.length - dropped.length;
  const best = MOVES[0];
  const recName = alive ? T.moves[best.id] : T.none;

  const lookedAway = LOOKABLE.every(isDropped) && dropped.length === LOOKABLE.length;
  const base = !alive
    ? T.vNumber
    : dropped.length === 0
      ? T.vAll
      : lookedAway
        ? T.vLooked
        : T.vMixed(carriedCount);
  const verdict = alive ? `${base} ${T.estimates}` : base;

  const fade = still ? undefined : "opacity 200ms ease";
  const bx = L.board.x;
  const by = L.board.y;
  const at = (col: number, row: number) => [bx + col * L.cell, by + row * L.cell] as const;

  return (
    <div>
      <div ref={ref} className="px-4 pt-5 md:px-8">
        <svg
          viewBox={`0 0 ${L.W} ${L.H}`}
          className="block w-full"
          role="img"
          aria-label={T.aria(
            carriedCount,
            total,
            alive ? `${T.recTitle}: ${recName}.` : `${T.noRec}.`,
          )}
        >
          {/* the input, which never changes */}
          {Array.from({ length: 9 }, (_, i) => (
            <g key={`g${i}`} stroke="var(--rule-strong)" strokeWidth="0.8">
              <line x1={bx} y1={by + i * L.cell} x2={bx + 8 * L.cell} y2={by + i * L.cell} />
              <line x1={bx + i * L.cell} y1={by} x2={bx + i * L.cell} y2={by + 8 * L.cell} />
            </g>
          ))}
          {STONES.map((s, i) => {
            const [x, y] = at(s.col, s.row);
            return (
              <circle
                key={`s${i}`}
                cx={x}
                cy={y}
                r={L.cell * 0.42}
                fill={s.black ? "var(--ink)" : "var(--paper-raised)"}
                stroke="var(--ink)"
                strokeWidth={s.black ? 0 : 1.4}
              />
            );
          })}
          {MOVES.map((m) => {
            const [x, y] = at(m.col, m.row);
            const win = m.id === best.id;
            return (
              <circle
                key={m.id}
                cx={x}
                cy={y}
                r={L.cell * 0.45}
                fill="none"
                stroke="var(--imagine)"
                strokeWidth={win ? 2.4 : 1.2}
                strokeDasharray={win ? undefined : "2 2.5"}
                opacity={alive ? 1 : 0.28}
                style={{ transition: fade }}
              />
            );
          })}
          <text
            x={bx + 4 * L.cell}
            y={by + 8 * L.cell + fs * 2.2}
            textAnchor="middle"
            className="font-mono"
            fontSize={fs}
            letterSpacing="1"
            fill="var(--ink-muted)"
          >
            {T.position}
          </text>

          {/* what it could carry */}
          <text
            x={L.col.x}
            y={L.col.y - fs * 0.7}
            className="font-mono"
            fontSize={fs}
            letterSpacing="1"
            fill="var(--ink-muted)"
          >
            {T.columnTitle}
          </text>
          {CARRIED.map((c, i) => {
            const top = L.col.y + i * L.col.rowH;
            const bl = top + L.col.rowH * 0.64;
            const off = isDropped(c.id);
            const m = fs * 0.95;
            return (
              <g key={c.id} opacity={off ? 0.4 : 1} style={{ transition: fade }}>
                <rect
                  x={L.col.x}
                  y={bl - m}
                  width={m}
                  height={m}
                  fill={off ? "none" : "var(--ink)"}
                  stroke="var(--rule-strong)"
                  strokeWidth="1"
                />
                {c.hat && (
                  <path
                    d={`M ${L.col.x + fs * 1.9} ${bl - fs * 1.1} L ${L.col.x + fs * 2.35} ${bl - fs * 1.62} L ${L.col.x + fs * 2.8} ${bl - fs * 1.1}`}
                    fill="none"
                    stroke="var(--imagine)"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                )}
                <text
                  x={L.col.x + fs * 1.9}
                  y={bl}
                  fontSize={fs * 1.15}
                  fill={off ? "var(--ink-faint)" : "var(--ink)"}
                >
                  {T.items[c.id]}
                </text>
                <text
                  x={L.col.x + L.col.w}
                  y={bl}
                  textAnchor="end"
                  className="font-mono tnum"
                  fontSize={fs}
                  fill="var(--ink-muted)"
                >
                  {c.cost}
                </text>
                <line
                  x1={L.col.x}
                  y1={top + L.col.rowH}
                  x2={L.col.x + L.col.w}
                  y2={top + L.col.rowH}
                  stroke="var(--rule)"
                  strokeWidth="1"
                />
              </g>
            );
          })}
          <text
            x={L.col.x}
            y={L.col.y + 4 * L.col.rowH + fs * 2.1}
            className="font-mono"
            fontSize={fs}
            letterSpacing="1"
            fill="var(--ink-muted)"
          >
            {T.totalLabel}
          </text>
          <text
            x={L.col.x + L.col.w}
            y={L.col.y + 4 * L.col.rowH + fs * 2.1}
            textAnchor="end"
            className="font-mono tnum"
            fontSize={fs * 1.3}
            fill="var(--ink)"
          >
            {total}
          </text>

          {/* the only thing anyone wanted */}
          <text
            x={L.rec.x}
            y={L.rec.y + fs * 1.2}
            className="font-mono"
            fontSize={fs}
            letterSpacing="1"
            fill="var(--ink-muted)"
          >
            {T.recTitle}
          </text>
          {MOVES.map((m, i) => {
            const bl = L.rec.y + fs * 4.2 + i * fs * 3.4;
            const win = m.id === best.id && alive;
            const mk = fs * 0.95;
            return (
              <g key={m.id} opacity={alive ? 1 : 0.32} style={{ transition: fade }}>
                {win && (
                  <rect x={L.rec.x} y={bl - mk} width={mk} height={mk} fill="var(--imagine)" />
                )}
                <text
                  x={L.rec.x + fs * 1.9}
                  y={bl}
                  fontSize={fs * 1.15}
                  fill={win ? "var(--imagine)" : "var(--ink)"}
                >
                  {T.moves[m.id]}
                </text>
                <text
                  x={L.rec.x + L.rec.w}
                  y={bl}
                  textAnchor="end"
                  className="font-mono tnum"
                  fontSize={fs * 1.15}
                  fill={win ? "var(--imagine)" : "var(--ink-muted)"}
                >
                  {m.value.toFixed(2)}
                </text>
              </g>
            );
          })}
          {!alive && (
            <text
              x={L.rec.x}
              y={L.rec.y + fs * 4.2 + 2 * fs * 3.4}
              className="font-mono"
              fontSize={fs * 1.15}
              letterSpacing="1"
              fill="var(--ink-muted)"
            >
              {T.noRec}
            </text>
          )}
        </svg>
      </div>

      <div
        data-print-hide
        className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-3 border-t border-rule px-5 py-4 md:px-8"
      >
        {CARRIED.map((c) => {
          const off = isDropped(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              aria-label={off ? T.carry(T.items[c.id]) : T.drop(T.items[c.id])}
              className={`label h-9 border px-3 transition-colors ${
                off
                  ? "border-rule-strong bg-paper !text-ink-muted hover:border-ink"
                  : "border-imagine bg-paper !text-imagine"
              }`}
            >
              {T.short[c.id]}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setDropped([])}
          disabled={dropped.length === 0}
          className="label ml-auto h-9 border border-rule-strong bg-paper px-3 !text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-50"
        >
          {T.carryAll}
        </button>
        <p
          className="label basis-full !normal-case !tracking-normal !text-[0.8rem]"
          aria-live="polite"
        >
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.totalLabel, T.units(total)],
          [T.droppedLabel, T.ofFour(dropped.length)],
          [T.recTitle, recName],
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
