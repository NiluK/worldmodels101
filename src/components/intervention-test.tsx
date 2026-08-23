"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * Why reading a board out of a network settles nothing.
 *
 * Two wiring diagrams of the same network, identical but for one wire. In the
 * first the board sits on the path from the moves to the next legal moves; in
 * the second the path runs straight through and the probe works the board out
 * on the side, where it goes nowhere. Reading the board out fits both, which
 * is the trap. Changing one square only fits the first, because only the first
 * has anything downstream of the board to change.
 *
 * The move lists are illustrative. What is not invented is the finding the
 * observed strip reports: Li and colleagues changed the probed board by hand
 * in 2022 and the network's next moves changed with it.
 */

type State = "idle" | "read" | "changed";

const LW = 560;
const LH = 218;
const CY = 96;

const CHIP_W = 122;
const IN_X = 8;
const OUT_X = LW - IN_X - CHIP_W;
const BOX_X = 172;
const BOX_W = 216;
const BOX_Y = 48;
const BOX_H = 96;

/** the 3 by 3 stand-in for a board: a cluster, deliberately not 8 by 8 */
const GLYPH_R = 5;
const GLYPH_PITCH = 15;
const GLYPH_HALF = GLYPH_PITCH + GLYPH_R;
const FLIPPED = 4;

const A_GLYPH = { cx: BOX_X + BOX_W / 2, cy: CY };
const B_GLYPH = { cx: 376, cy: 186 };
const PROBE = { cx: BOX_X + BOX_W / 2, cy: 186, half: 22 };

const MOVES_SO_FAR = ["d3", "c5", "f6", "e6"];
const NEXT_BEFORE = ["c4", "e3", "f5", "d6"];
const NEXT_AFTER = ["c4", "e3", "f5", "g4"];

type Strings = {
  laneA: string;
  laneAShort: string;
  laneB: string;
  laneBShort: string;
  movesSoFar: string;
  network: string;
  nextMoves: string;
  probe: string;
  goesNowhere: string;
  unchanged: string;
  fits: string;
  ruledOut: string;
  read: string;
  change: string;
  again: string;
  observed: string;
  observedIdle: string;
  observedRead: string;
  observedChanged: string;
  source: string;
  cTest: string;
  cStanding: string;
  cRuled: string;
  testIdle: string;
  testRead: string;
  testChanged: string;
  ruledIdle: string;
  ruledRead: string;
  ruledChanged: string;
  vIdle: string;
  vRead: string;
  vChanged: string;
  aria: (s: State) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    laneA: "It plays from a board",
    laneAShort: "plays from a board",
    laneB: "The probe works it out",
    laneBShort: "probe works it out",
    movesSoFar: "moves so far",
    network: "network",
    nextMoves: "next legal moves",
    probe: "probe",
    goesNowhere: "goes nowhere",
    unchanged: "unchanged",
    fits: "fits what was seen",
    ruledOut: "ruled out",
    read: "Read the board",
    change: "Change one square",
    again: "Start again",
    observed: "Observed",
    observedIdle: "nothing yet",
    observedRead: "a board can be read out.",
    observedChanged: "the next moves changed.",
    source: "Li and colleagues, 2022",
    cTest: "Test",
    cStanding: "Stories still standing",
    cRuled: "What ruled one out",
    testIdle: "nothing run yet",
    testRead: "read the board",
    testChanged: "changed one square",
    ruledIdle: "nothing yet",
    ruledRead: "nothing, both fit",
    ruledChanged: "the moves changed",
    vIdle: "Two stories about one network. Run a test and see which of them it separates.",
    vRead: "Both stories say a board can be read out, so reading one out separates nothing.",
    vChanged:
      "Only one of the stories has a wire out of that board. The moves changed, so that is the story left.",
    aria: (s) =>
      s === "idle"
        ? "Two wiring diagrams of the same network, alike but for one wire. Nothing has been run yet and both stories still stand."
        : s === "read"
          ? "Two wiring diagrams of the same network. A board has been read out of both, so both stories still stand."
          : "Two wiring diagrams of the same network. One square has been changed. In the first the next legal moves changed with it; in the second they did not, and that story is ruled out.",
  },
};

function Arrow({
  x1,
  y1,
  x2,
  y2,
  stroke,
  dash,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  dash?: string;
}) {
  const horiz = y1 === y2;
  const head = horiz
    ? `${x2},${y2} ${x2 - 7},${y2 - 4} ${x2 - 7},${y2 + 4}`
    : `${x2},${y2} ${x2 - 4},${y2 - 7} ${x2 + 4},${y2 - 7}`;
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={horiz ? x2 - 6 : x2}
        y2={horiz ? y2 : y2 - 6}
        stroke={stroke}
        strokeWidth={dash ? 1 : 1.4}
        strokeDasharray={dash}
      />
      <polygon points={head} fill={stroke} />
    </g>
  );
}

/** The board stand-in: outlined before it has been read, solid after. */
function Glyph({
  cx,
  cy,
  filled,
  flipped,
  muted,
}: {
  cx: number;
  cy: number;
  filled: boolean;
  flipped: boolean;
  muted: boolean;
}) {
  const plain = muted ? "var(--ink-faint)" : "var(--actual)";
  const mark = muted ? "var(--ink-faint)" : "var(--imagine)";
  return (
    <g>
      {Array.from({ length: 9 }, (_, i) => {
        const x = cx + ((i % 3) - 1) * GLYPH_PITCH;
        const y = cy + (Math.floor(i / 3) - 1) * GLYPH_PITCH;
        const hit = flipped && i === FLIPPED;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={GLYPH_R}
            fill={filled ? (hit ? mark : plain) : "none"}
            stroke={filled ? "none" : muted ? "var(--ink-faint)" : "var(--rule-strong)"}
            strokeWidth="1.2"
          />
        );
      })}
    </g>
  );
}

/** A chip holding a short list of squares, four across or two by two when narrow. */
function Chip({
  x,
  caption,
  moves,
  changedAt,
  compact,
  k,
  muted,
}: {
  x: number;
  caption: string;
  moves: string[];
  changedAt: number | null;
  compact: boolean;
  k: number;
  muted: boolean;
}) {
  const h = compact ? 58 : 40;
  const y = CY - h / 2;
  const ink = muted ? "var(--ink-faint)" : "var(--ink)";
  return (
    <g>
      <text
        x={x + CHIP_W / 2}
        y={y - 8}
        textAnchor="middle"
        className="font-mono"
        fontSize={8.5 * k}
        letterSpacing="0.5"
        fill={muted ? "var(--ink-faint)" : "var(--ink-muted)"}
      >
        {caption}
      </text>
      <rect
        x={x}
        y={y}
        width={CHIP_W}
        height={h}
        fill="var(--paper-sunk)"
        stroke={muted ? "var(--ink-faint)" : "var(--rule-strong)"}
        strokeWidth="1"
      />
      {moves.map((m, i) => {
        const mx = compact ? x + 30.5 + (i % 2) * 61 : x + 5 + i * 29 + 14.5;
        const my = compact ? y + 22 + Math.floor(i / 2) * 22 : CY + 4;
        return (
          <text
            key={i}
            x={mx}
            y={my}
            textAnchor="middle"
            className="font-mono tnum"
            fontSize={9.5 * k}
            fill={changedAt === i ? (muted ? "var(--ink-faint)" : "var(--imagine)") : ink}
          >
            {m}
          </text>
        );
      })}
    </g>
  );
}

function Lane({
  lane,
  state,
  compact,
  k,
  pulseKey,
  still,
  T,
}: {
  lane: "A" | "B";
  state: State;
  compact: boolean;
  k: number;
  pulseKey: number;
  still: boolean | null;
  T: Strings;
}) {
  const muted = lane === "B" && state === "changed";
  const ink = muted ? "var(--ink-faint)" : "var(--ink)";
  const rule = muted ? "var(--ink-faint)" : "var(--rule-strong)";
  const soft = muted ? "var(--ink-faint)" : "var(--ink-muted)";
  const filled = state !== "idle";
  const flipped = state === "changed";
  const nextMoves = lane === "A" && state === "changed" ? NEXT_AFTER : NEXT_BEFORE;
  const changedAt = lane === "A" && state === "changed" ? 3 : null;
  const chipH = compact ? 58 : 40;

  const pulseFrom = lane === "A" ? A_GLYPH.cx + GLYPH_HALF : B_GLYPH.cx + GLYPH_HALF;
  const pulseTo = lane === "A" ? OUT_X : 434;
  const pulseY = lane === "A" ? CY : B_GLYPH.cy;

  return (
    <svg viewBox={`0 0 ${LW} ${LH}`} className="block w-full" aria-hidden>
      <Chip
        x={IN_X}
        caption={T.movesSoFar}
        moves={MOVES_SO_FAR}
        changedAt={null}
        compact={compact}
        k={k}
        muted={muted}
      />

      {/* the network, and the one wire the two stories differ by */}
      <rect
        x={BOX_X}
        y={BOX_Y}
        width={BOX_W}
        height={BOX_H}
        rx="10"
        fill="var(--paper)"
        stroke={rule}
        strokeWidth="1.2"
      />
      <text
        x={BOX_X + BOX_W / 2}
        y={BOX_Y + 16}
        textAnchor="middle"
        className="font-mono"
        fontSize={8.5 * k}
        letterSpacing="0.5"
        fill={soft}
      >
        {T.network}
      </text>

      <Arrow x1={IN_X + CHIP_W} y1={CY} x2={BOX_X} y2={CY} stroke={ink} />
      {lane === "A" ? (
        <>
          <Arrow x1={BOX_X} y1={CY} x2={A_GLYPH.cx - GLYPH_HALF} y2={CY} stroke={ink} />
          <Arrow x1={A_GLYPH.cx + GLYPH_HALF} y1={CY} x2={BOX_X + BOX_W} y2={CY} stroke={ink} />
        </>
      ) : (
        <line x1={BOX_X} y1={CY} x2={BOX_X + BOX_W} y2={CY} stroke={ink} strokeWidth="1.4" />
      )}
      <Arrow x1={BOX_X + BOX_W} y1={CY} x2={OUT_X} y2={CY} stroke={ink} />

      {lane === "A" && (
        <Glyph cx={A_GLYPH.cx} cy={A_GLYPH.cy} filled={filled} flipped={flipped} muted={muted} />
      )}

      {/* the probe reads; in lane B what it produces is a dead end */}
      <Arrow
        x1={PROBE.cx}
        y1={lane === "A" ? A_GLYPH.cy + GLYPH_HALF : BOX_Y + BOX_H}
        x2={PROBE.cx}
        y2={PROBE.cy - PROBE.half}
        stroke={soft}
        dash="3 3"
      />
      <rect
        x={PROBE.cx - PROBE.half}
        y={PROBE.cy - PROBE.half}
        width={PROBE.half * 2}
        height={PROBE.half * 2}
        fill="var(--paper)"
        stroke={rule}
        strokeWidth="1"
      />
      <text
        x={PROBE.cx}
        y={PROBE.cy + 3.5}
        textAnchor="middle"
        className="font-mono"
        fontSize={8 * k}
        fill={soft}
      >
        {T.probe}
      </text>

      {lane === "B" && (
        <>
          <Arrow
            x1={PROBE.cx + PROBE.half}
            y1={B_GLYPH.cy}
            x2={B_GLYPH.cx - GLYPH_HALF}
            y2={B_GLYPH.cy}
            stroke={soft}
            dash="3 3"
          />
          <Glyph cx={B_GLYPH.cx} cy={B_GLYPH.cy} filled={filled} flipped={flipped} muted={muted} />
          <line
            x1={B_GLYPH.cx + GLYPH_HALF}
            y1={B_GLYPH.cy}
            x2={434}
            y2={B_GLYPH.cy}
            stroke={soft}
            strokeWidth="1.2"
          />
          <line
            x1={434}
            y1={B_GLYPH.cy - 13}
            x2={434}
            y2={B_GLYPH.cy + 13}
            stroke={soft}
            strokeWidth="1.6"
          />
          <text
            x={442}
            y={B_GLYPH.cy + 3.5}
            className="font-mono"
            fontSize={8.5 * k}
            fill={soft}
          >
            {T.goesNowhere}
          </text>
        </>
      )}

      <Chip
        x={OUT_X}
        caption={T.nextMoves}
        moves={nextMoves}
        changedAt={changedAt}
        compact={compact}
        k={k}
        muted={muted}
      />
      {lane === "B" && state === "changed" && (
        <text
          x={OUT_X + CHIP_W / 2}
          y={CY + chipH / 2 + 15}
          textAnchor="middle"
          className="font-mono"
          fontSize={8.5 * k}
          fill="var(--ink-faint)"
        >
          {T.unchanged}
        </text>
      )}

      {state === "changed" && !still && (
        <motion.g
          key={pulseKey}
          initial={{ x: 0, opacity: 1 }}
          animate={{ x: pulseTo - pulseFrom, opacity: [1, 1, 0] }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <circle
            cx={pulseFrom}
            cy={pulseY}
            r="4"
            fill={muted ? "var(--ink-faint)" : "var(--imagine)"}
          />
        </motion.g>
      )}
    </svg>
  );
}

export function InterventionTest() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const k = compact ? 1.65 : 1;
  const [state, setState] = useState<State>("idle");
  const [pulseKey, setPulseKey] = useState(0);

  const go = (next: State) => {
    setState(next);
    if (next === "changed") setPulseKey((n) => n + 1);
  };

  const verdict = state === "idle" ? T.vIdle : state === "read" ? T.vRead : T.vChanged;
  const observed =
    state === "idle" ? T.observedIdle : state === "read" ? T.observedRead : T.observedChanged;

  const btn = (active: boolean) =>
    `label h-9 border px-4 transition-colors ${
      active
        ? "border-imagine bg-imagine !text-paper"
        : "border-rule-strong bg-paper !text-ink hover:border-ink"
    }`;

  const status = (lane: "A" | "B") => {
    if (state === "idle") return "";
    if (lane === "B" && state === "changed") return T.ruledOut;
    return T.fits;
  };

  return (
    <div>
      <div ref={ref} role="img" aria-label={T.aria(state)} className="px-5 pt-6 md:px-8">
        {(["A", "B"] as const).map((lane) => {
          const out = lane === "B" && state === "changed";
          const title =
            lane === "A"
              ? compact
                ? T.laneAShort
                : T.laneA
              : compact
                ? T.laneBShort
                : T.laneB;
          return (
            <div key={lane} className={lane === "B" ? "mt-6" : ""}>
              <div className="flex items-baseline justify-between gap-3">
                <p className={`label ${out ? "!text-ink-faint line-through" : "!text-ink"}`}>
                  {title}
                </p>
                {status(lane) && (
                  <p className={`label shrink-0 ${out ? "!text-ink-faint" : "!text-imagine"}`}>
                    {state !== "idle" && !out ? "✓ " : ""}
                    {status(lane)}
                  </p>
                )}
              </div>
              <Lane
                lane={lane}
                state={state}
                compact={compact}
                k={k}
                pulseKey={pulseKey}
                still={still}
                T={T}
              />
            </div>
          );
        })}

        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 border border-rule bg-paper-sunk px-4 py-2.5">
          <span className="label shrink-0">{T.observed}</span>
          <span
            className={`text-[0.85rem] ${state === "idle" ? "text-ink-faint" : "text-ink"}`}
          >
            {observed}
          </span>
          {state !== "idle" && (
            <span className="label ml-auto !text-[0.6rem] !text-ink-faint">{T.source}</span>
          )}
        </div>
      </div>

      <div
        data-print-hide
        className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8"
      >
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn(state !== "idle")} onClick={() => go("read")}>
            {T.read}
          </button>
          <button
            type="button"
            className={btn(state === "changed")}
            onClick={() => go("changed")}
          >
            {T.change}
          </button>
        </div>
        <button
          type="button"
          className="label h-9 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink"
          onClick={() => go("idle")}
        >
          {T.again}
        </button>
        <p
          aria-live="polite"
          className="label basis-full !normal-case !tracking-normal !text-[0.8rem]"
        >
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.cTest, state === "idle" ? T.testIdle : state === "read" ? T.testRead : T.testChanged],
          [T.cStanding, state === "changed" ? "1" : "2"],
          [
            T.cRuled,
            state === "idle" ? T.ruledIdle : state === "read" ? T.ruledRead : T.ruledChanged,
          ],
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
