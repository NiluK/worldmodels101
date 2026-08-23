"use client";

import { useMemo, useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * What a recording can answer, and what it has to borrow for.
 *
 * A ball on a table, twenty four moments of it, with a nudge recorded at seven
 * of them. Ask what comes next and the answer is the very next cell: it was
 * always there and nothing had to be worked out. Ask what would happen if you
 * nudged, at a moment where nobody did, and there is no cell to read. The
 * figure then goes looking for other moments where the ball was in about the
 * same place and somebody did nudge, and averages those. Near the start of the
 * recording there are none, and then there is no answer at all.
 *
 * The trace, the nudges and the band that counts as "about the same place" are
 * all illustrative and fixed, so the figure is the same on every render.
 */

/** twenty four moments of a ball rolling, nudged now and then */
const P = [
  22, 30, 40, 50, 59, 64, 66, 64, 60, 60, 63, 63, 61, 62, 61, 57, 53, 49, 51, 53, 59, 62, 68, 74,
];
const N = P.length;
/** hand chosen, not random: the same seven moments on every render */
const NUDGED = [8, 9, 12, 17, 19, 21, 22];
const NUDGED_SET = new Set(NUDGED);
/** how close counts as about the same place */
const BAND = 4;

const W = 600;
const PAD = 10;
const CELL = (W - PAD * 2) / N;
const cellX = (i: number) => PAD + i * CELL;
const midX = (i: number) => PAD + (i + 0.5) * CELL;

const LO = 16;
const HI = 80;

/**
 * The narrow tier is not the wide one shrunk. Twenty four cells across a phone
 * leaves each one about ten pixels, so the box grows taller and the type grows
 * with it rather than falling to five pixels.
 */
function geom(narrow: boolean) {
  return narrow
    ? { H: 396, top: 42, bot: 226, missTop: 240, missH: 26, stripTop: 302, stripH: 56, k: 2.3 }
    : { H: 210, top: 20, bot: 126, missTop: 132, missH: 16, stripTop: 164, stripH: 28, k: 1 };
}

type Mode = "next" | "whatif";
type Kind = "recorded" | "borrowed" | "none";

type Strings = {
  ballLabel: string;
  nudgeLabel: string;
  moment: string;
  next: string;
  whatif: string;
  notRecorded: string;
  answer: string;
  recordedNext: string;
  borrowedAnswer: string;
  nothingToGoOn: string;
  fromN: (n: number) => string;
  cQuestion: string;
  cSource: string;
  cSupport: string;
  qNext: string;
  qWhatif: string;
  sRecording: string;
  sBorrowed: (n: number) => string;
  sNowhere: string;
  vNext: string;
  vNudged: string;
  vBorrowed: (n: number) => string;
  vNone: string;
  note: string;
  aria: (moment: number, mode: Mode, kind: Kind, n: number) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    ballLabel: "where the ball was",
    nudgeLabel: "nudge recorded",
    moment: "moment",
    next: "What comes next",
    whatif: "What if I nudge it",
    notRecorded: "not recorded",
    answer: "Answer",
    recordedNext: "recorded next position",
    borrowedAnswer: "borrowed answer",
    nothingToGoOn: "nothing to go on",
    fromN: (n) => (n === 1 ? "from 1 moment" : `from ${n} moments`),
    cQuestion: "Question",
    cSource: "Where the answer comes from",
    cSupport: "Moments to learn from",
    qNext: "what comes next",
    qWhatif: "what if I nudge it",
    sRecording: "the recording, one cell along",
    sBorrowed: (n) => (n === 1 ? "borrowed from 1 other moment" : `borrowed from ${n} other moments`),
    sNowhere: "nowhere",
    vNext: "The answer was already in the recording, one cell along. Nothing had to be worked out.",
    vNudged:
      "Somebody did nudge here, so you asked for the action that was taken. This is still just what comes next.",
    vBorrowed: (n) =>
      `Nobody nudged at this moment, so there is no cell to read. The answer had to be borrowed from ${n} ${
        n === 1 ? "moment" : "moments"
      } where the ball was in about the same place and somebody did nudge.`,
    vNone:
      "Nobody nudged at this moment, and nowhere much like it either. A recording of what happened cannot say what would have.",
    note: "the recording is illustrative",
    aria: (moment, mode, kind, n) =>
      `A recording of a ball on a table, twenty four moments, with a nudge recorded at seven of them. Moment ${moment} is selected and the question is ${
        mode === "next" ? "what comes next" : "what would happen if you nudged"
      }. ${
        kind === "recorded"
          ? "The answer is read straight out of the recording, one moment along."
          : kind === "borrowed"
            ? `Nothing was recorded, so the answer is borrowed from ${n} other moments where the ball was in about the same place and a nudge was recorded.`
            : "Nothing was recorded and no other moment is much like it, so there is no answer."
      }`,
  },
  zh: {
    ballLabel: "球当时在哪里",
    nudgeLabel: "记录到的推动",
    moment: "时刻",
    next: "接下来会怎样",
    whatif: "如果我推它一下呢",
    notRecorded: "没有记录",
    answer: "答案",
    recordedNext: "记录中的下一位置",
    borrowedAnswer: "借来的答案",
    nothingToGoOn: "没有任何依据",
    fromN: (n) => `来自 ${n} 个时刻`,
    cQuestion: "问题",
    cSource: "答案从哪里来",
    cSupport: "可供借鉴的时刻",
    qNext: "接下来会怎样",
    qWhatif: "如果我推它一下呢",
    sRecording: "记录本身，往后一格",
    sBorrowed: (n) => `从另外 ${n} 个时刻借来`,
    sNowhere: "无处可借",
    vNext: "答案本来就在记录里，往后一格就是。什么也不用推算。",
    vNudged: "这一刻确实有人推了，所以你问的正是当时采取的动作。这仍然只是「接下来会怎样」。",
    vBorrowed: (n) =>
      `这一刻没有人推，所以没有哪一格可读。答案只能从另外 ${n} 个时刻借来：那些时刻球在差不多的位置，而且确实有人推了。`,
    vNone: "这一刻没有人推，和它相像的地方也没有。一份「发生了什么」的记录，说不出「本来会怎样」。",
    note: "记录仅为示意",
    aria: (moment, mode, kind, n) =>
      `一段球在桌上滚动的记录，共二十四个时刻，其中七个时刻记录到了推动。当前选中第 ${moment} 个时刻，问题是${
        mode === "next" ? "接下来会怎样" : "如果推它一下会怎样"
      }。${
        kind === "recorded"
          ? "答案直接从记录里往后读一格。"
          : kind === "borrowed"
            ? `记录里没有这一条，所以答案是从另外 ${n} 个时刻借来的：那些时刻球在差不多的位置，而且记录到了推动。`
            : "记录里没有这一条，也没有哪个时刻与它相像，所以没有答案。"
      }`,
  },
};

export function NotInTheRecording() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  /** 760 stacks the answer panel under the strip; 560 is the type tier. */
  const { ref, compact } = useCompact(760);
  const { ref: typeRef, compact: narrow } = useCompact(480);
  const { H, top: TRACE_TOP, bot: TRACE_BOT, missTop: MISSING_TOP, missH: MISSING_H, stripTop: STRIP_TOP, stripH: STRIP_H, k } = geom(narrow);
  const traceY = (p: number) => TRACE_BOT - ((p - LO) / (HI - LO)) * (TRACE_BOT - TRACE_TOP);
  const [i, setI] = useState(4);
  const [mode, setMode] = useState<Mode>("next");

  const nudgedHere = NUDGED_SET.has(i);
  const supporters = useMemo(
    () => NUDGED.filter((j) => j !== i && Math.abs(P[j] - P[i]) <= BAND),
    [i],
  );
  const kind: Kind =
    mode === "next" || nudgedHere ? "recorded" : supporters.length > 0 ? "borrowed" : "none";

  const recorded = P[i + 1];
  const borrowed =
    supporters.length > 0
      ? P[i] + supporters.reduce((s, j) => s + (P[j + 1] - P[j]), 0) / supporters.length
      : null;
  const shown = kind === "borrowed" && borrowed !== null ? Math.round(borrowed * 10) / 10 : null;

  const verdict =
    mode === "next"
      ? T.vNext
      : nudgedHere
        ? T.vNudged
        : kind === "borrowed"
          ? T.vBorrowed(supporters.length)
          : T.vNone;

  const source =
    kind === "recorded" ? T.sRecording : kind === "borrowed" ? T.sBorrowed(supporters.length) : T.sNowhere;

  const btn = (active: boolean) =>
    `label h-9 border px-4 transition-colors ${
      active
        ? "border-imagine bg-imagine !text-paper"
        : "border-rule-strong bg-paper !text-ink hover:border-ink"
    }`;

  const missingLabelLeft = i + 1 > N / 2;

  return (
    <div>
      <div
        ref={ref}
        className={`flex gap-5 px-5 pt-6 md:px-8 ${compact ? "flex-col" : "items-start"}`}
      >
        <div ref={typeRef} className="min-w-0 w-full flex-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full"
          role="img"
          aria-label={T.aria(i + 1, mode, kind, supporters.length)}
        >
          <text
            x={PAD}
            y={narrow ? 26 : 13}
            className="font-mono"
            fontSize={8.5 * k}
            letterSpacing="0.5"
            fill="var(--ink-faint)"
          >
            {T.ballLabel}
          </text>

          {/* the trace: where the ball was at each of the twenty four moments */}
          <path
            d={P.map((p, n) => `${n ? "L" : "M"} ${midX(n).toFixed(1)} ${traceY(p).toFixed(1)}`).join(" ")}
            fill="none"
            stroke="var(--actual)"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          {P.map((p, n) => (
            <circle
              key={n}
              cx={midX(n)}
              cy={traceY(p)}
              r={2.6}
              fill="var(--actual)"
              opacity={n === i || (kind === "recorded" && n === i + 1) ? 1 : 0.55}
            />
          ))}

          {/* the recorded answer, one moment along */}
          {kind === "recorded" && (
            <circle
              cx={midX(i + 1)}
              cy={traceY(recorded)}
              r={6}
              fill="none"
              stroke="var(--actual)"
              strokeWidth="1.6"
            />
          )}
          {/* the borrowed answer, drawn beside the recorded one */}
          {kind === "borrowed" && borrowed !== null && (
            <circle
              cx={midX(i + 1) + 5}
              cy={traceY(borrowed)}
              r={4}
              fill="var(--imagine)"
              stroke="var(--paper)"
              strokeWidth="1.2"
            />
          )}

          {/* the cell that was never recorded */}
          {mode === "whatif" && !nudgedHere && (
            <g>
              <rect
                x={cellX(i + 1) + 1}
                y={MISSING_TOP}
                width={CELL - 2}
                height={MISSING_H}
                fill="none"
                stroke="var(--imagine)"
                strokeWidth="1.2"
                strokeDasharray="3 2"
              />
              <text
                x={missingLabelLeft ? cellX(i + 1) - 5 : cellX(i + 1) + CELL + 5}
                y={MISSING_TOP + MISSING_H / 2 + 3.5}
                textAnchor={missingLabelLeft ? "end" : "start"}
                className="font-mono"
                fontSize={8.5 * k}
                fill="var(--imagine)"
              >
                {T.notRecorded}
              </text>
            </g>
          )}

          <text
            x={PAD}
            y={STRIP_TOP - (narrow ? 16 : 6)}
            className="font-mono"
            fontSize={8.5 * k}
            letterSpacing="0.5"
            fill="var(--ink-faint)"
          >
            {T.nudgeLabel}
          </text>

          {/* the strip: one cell per moment, a tick where a nudge was recorded */}
          {P.map((_, n) => {
            const lit = kind === "recorded" && n === i + 1;
            const borrowedFrom = kind === "borrowed" && supporters.includes(n);
            return (
              <g key={n}>
                <rect
                  x={cellX(n) + 1}
                  y={STRIP_TOP}
                  width={CELL - 2}
                  height={STRIP_H}
                  fill={
                    lit ? "var(--actual-soft)" : borrowedFrom ? "var(--imagine-soft)" : "var(--paper-sunk)"
                  }
                  stroke={lit ? "var(--actual)" : borrowedFrom ? "var(--imagine)" : "var(--rule)"}
                  strokeWidth="1"
                />
                {NUDGED_SET.has(n) && (
                  <line
                    x1={midX(n)}
                    y1={STRIP_TOP + 7}
                    x2={midX(n)}
                    y2={STRIP_TOP + STRIP_H - 7}
                    stroke="var(--imagine)"
                    strokeWidth="2"
                  />
                )}
                {!narrow && (
                  <text
                    x={midX(n)}
                    y={STRIP_TOP + STRIP_H + 13}
                    textAnchor="middle"
                    className="font-mono tnum"
                    fontSize={7.5}
                    fill="var(--ink-faint)"
                  >
                    {n + 1}
                  </text>
                )}
                <rect
                  x={cellX(n)}
                  y={STRIP_TOP - 4}
                  width={CELL}
                  height={STRIP_H + 8}
                  fill="transparent"
                  className={n < N - 1 ? "cursor-pointer" : ""}
                  onClick={n < N - 1 ? () => setI(n) : undefined}
                />
              </g>
            );
          })}

          {/* the selected moment, boxed across both parts */}
          <rect
            x={cellX(i)}
            y={TRACE_TOP - 4}
            width={CELL}
            height={STRIP_TOP + STRIP_H + 4 - (TRACE_TOP - 4)}
            fill="none"
            stroke="var(--ink)"
            strokeWidth="1.2"
            pointerEvents="none"
          />
        </svg>
        </div>

        {/* the answer, and where it had to come from */}
        <div
          className={`border border-rule bg-paper-sunk px-4 py-3 ${compact ? "w-full" : "w-[13rem] shrink-0"}`}
        >
          <div className={compact ? "flex flex-wrap items-baseline gap-x-5 gap-y-1" : ""}>
            <p className="label">{T.answer}</p>
            {kind === "none" ? (
              <p className={`text-[0.95rem] text-ink-muted ${compact ? "" : "mt-1"}`}>
                {T.nothingToGoOn}
              </p>
            ) : (
              <>
                <p className={`tnum text-[1.35rem] leading-none text-ink ${compact ? "" : "mt-1"}`}>
                  {kind === "recorded" ? recorded : shown}
                </p>
                <p
                  className={`label !normal-case !tracking-normal !text-[0.75rem] ${
                    compact ? "" : "mt-2"
                  }`}
                >
                  {kind === "recorded" ? T.recordedNext : T.borrowedAnswer}
                </p>
                {kind === "borrowed" && (
                  <p
                    className={`label !normal-case !tracking-normal !text-[0.75rem] !text-imagine ${
                      compact ? "" : "mt-1"
                    }`}
                  >
                    {T.fromN(supporters.length)}
                  </p>
                )}
              </>
            )}
            <p className={`label !text-[0.6rem] !text-ink-faint ${compact ? "ml-auto" : "mt-3"}`}>
              {T.note}
            </p>
          </div>
        </div>
      </div>

      <div
        data-print-hide
        className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8"
      >
        <label className="flex min-w-[15rem] flex-1 items-center gap-3">
          <span className="label whitespace-nowrap">{T.moment}</span>
          <input
            type="range"
            min={1}
            max={N - 1}
            value={i + 1}
            onChange={(e) => setI(Number(e.target.value) - 1)}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-8 text-right !text-ink">{i + 1}</span>
        </label>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn(mode === "next")} onClick={() => setMode("next")}>
            {T.next}
          </button>
          <button
            type="button"
            className={btn(mode === "whatif")}
            onClick={() => setMode("whatif")}
          >
            {T.whatif}
          </button>
        </div>

        <p
          aria-live="polite"
          className="label basis-full !normal-case !tracking-normal !text-[0.8rem]"
        >
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.cQuestion, mode === "next" ? T.qNext : T.qWhatif],
          [T.cSource, source],
          [T.cSupport, String(supporters.length)],
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
