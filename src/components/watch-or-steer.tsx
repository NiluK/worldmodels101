"use client";

import { useState, type KeyboardEvent } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * Who picks the next frame.
 *
 * One growing row of frames. The first two are given; every later one is
 * generated. In watch mode the turns come from a fixed table, so the same
 * press gives the same clip back every time and the reader is a spectator.
 * In steer mode the key the reader holds goes in alongside the frames, and
 * the frame that arrives is the one they asked for.
 *
 * The conditioning strip at the top is the whole argument in two boxes: the
 * frames before are always there, and the key is the one extra input. Nothing
 * else about the model changes between the two modes.
 */

type Mode = "watch" | "steer";
type Turn = -1 | 0 | 1;
type Step = { turn: Turn; by: "model" | "you" };

const GIVEN = 2;
const TOTAL = 8;
const MAX_GEN = TOTAL - GIVEN;

/** watch mode is a table, not a coin toss: starting again must give the same clip */
const WATCH_TURNS: Turn[] = [1, 1, 0, -1, -1, 0];

const FW = 92;
const FH = 66;
const GAP = 10;
const M = 20;
const COND_H = 104;

/** frame interior, in frame units */
const CE = FH * 0.16;
const FLOOR = FH * 0.62;
const GROUND = FH * 0.82;
const WL = FW * 0.2;
const WR = FW * 0.8;
const PITCH = 58;
const HEIGHTS = [22, 14, 27];

type Text = {
  mode: string;
  watch: string;
  steer: string;
  next: string;
  left: string;
  right: string;
  again: string;
  given: string;
  byModel: [string, string];
  byYou: string;
  dir: { left: string; right: string };
  condFrames: string;
  condKey: string;
  condNothing: string;
  condNext: string;
  rFrames: string;
  rYours: string;
  rExtra: string;
  extraNone: string;
  extraKey: string;
  ofN: (a: number, b: number) => string;
  watch0: string;
  watchMid: string;
  watchFull: string;
  steer0: string;
  steerMid: (dir: string) => string;
  steerFull: string;
  keyHelp: string;
  aria: (mode: string, n: number, yours: number) => string;
};

const TEXT: LocaleText<Text> = {
  en: {
    mode: "next frame picked by",
    watch: "watch",
    steer: "steer",
    next: "Next frame",
    left: "Left",
    right: "Right",
    again: "Start again",
    given: "given",
    byModel: ["the model", "chose"],
    byYou: "you chose",
    dir: { left: "left", right: "right" },
    condFrames: "the frames before",
    condKey: "the key being held",
    condNothing: "nothing",
    condNext: "the next frame",
    rFrames: "frames so far",
    rYours: "chosen by you",
    rExtra: "the extra input",
    extraNone: "none",
    extraKey: "a key, every frame",
    ofN: (a, b) => `${a} of ${b}`,
    watch0: "Press Next frame. You have no say in what arrives.",
    watchMid: "It chose again. Start again and press the same button and you get the same clip back.",
    watchFull: "Eight frames and you chose none of them. That is a video.",
    steer0: "Now the key goes in with the frames. Press left or right.",
    steerMid: (dir) => `You pressed ${dir} and it went ${dir}. The same start, and a different clip because you asked for one.`,
    steerFull: "Every frame after the first two is one you asked for. That is somewhere you can be.",
    keyHelp: "The clip. In steer mode the left and right arrow keys add a frame.",
    aria: (mode, n, yours) =>
      `A row of ${n} frames of a walk, left to right, in ${mode} mode. The first two are given; ${n - GIVEN} were generated and ${yours} of those were chosen by you.`,
  },
  zh: {
    mode: "下一帧由谁来定",
    watch: "观看",
    steer: "操控",
    next: "下一帧",
    left: "向左",
    right: "向右",
    again: "重新开始",
    given: "已给出",
    byModel: ["模型", "选的"],
    byYou: "你选的",
    dir: { left: "左", right: "右" },
    condFrames: "之前的帧",
    condKey: "按住的键",
    condNothing: "没有",
    condNext: "下一帧",
    rFrames: "已有的帧",
    rYours: "你选的帧",
    rExtra: "额外的输入",
    extraNone: "没有",
    extraKey: "每一帧都有一个键",
    ofN: (a, b) => `${a} / ${b}`,
    watch0: "按「下一帧」。接下来出现什么，你说了不算。",
    watchMid: "它又选了一次。重新开始，按同一个按钮，你会拿回同一段片子。",
    watchFull: "八帧，没有一帧是你选的。这就是一段视频。",
    steer0: "现在键和帧一起送进去。按向左或者向右。",
    steerMid: (dir) => `你按了向${dir}，它就往${dir}走。同样的开头，因为你提了要求，片子就不一样了。`,
    steerFull: "前两帧之后的每一帧都是你要的。这才是一个你能待着的地方。",
    keyHelp: "这段片子。在操控模式下，左右方向键各加一帧。",
    aria: (mode, n, yours) =>
      `一行 ${n} 帧的行走画面，从左到右，处于${mode}模式。前两帧是给出的；生成了 ${n - GIVEN} 帧，其中 ${yours} 帧由你选定。`,
  },
};

/** one first-person frame: side walls, a far wall, and landmarks that slide as the heading turns */
function Frame({ heading, colour, id }: { heading: number; colour: string; id: string }) {
  const off = -heading * 11;
  return (
    <>
      <clipPath id={id}>
        <rect x="0" y="0" width={FW} height={FH} />
      </clipPath>
      <rect x="0" y="0" width={FW} height={FH} fill="var(--paper)" stroke="var(--rule-strong)" strokeWidth="1" />
      <g clipPath={`url(#${id})`}>
        <g stroke={colour} strokeWidth="1" fill="none" opacity="0.5">
          <polyline points={`0,0 ${WL},${CE} ${WL},${FLOOR} 0,${FH}`} />
          <polyline points={`${FW},0 ${WR},${CE} ${WR},${FLOOR} ${FW},${FH}`} />
          <rect x={WL} y={CE} width={WR - WL} height={FLOOR - CE} />
          <line x1="0" y1={GROUND} x2={FW} y2={GROUND} opacity="0.6" />
        </g>
        {[-3, -2, -1, 0, 1, 2, 3].map((j) => {
          const h = HEIGHTS[((j % 3) + 3) % 3];
          return (
            <rect
              key={j}
              x={FW / 2 + off + j * PITCH - 7}
              y={GROUND - h}
              width="14"
              height={h}
              fill={colour}
              opacity="0.9"
            />
          );
        })}
      </g>
    </>
  );
}

export function WatchOrSteer() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const { ref, compact } = useCompact(720);
  const fs = compact ? 13 : 11;

  const [mode, setMode] = useState<Mode>("watch");
  const [steps, setSteps] = useState<Step[]>([]);

  const full = steps.length >= MAX_GEN;
  const yours = steps.filter((s) => s.by === "you").length;
  const lastYou = [...steps].reverse().find((s) => s.by === "you");

  const setModeTo = (m: Mode) => {
    setMode(m);
    setSteps([]);
  };
  const advance = (turn: Turn, by: Step["by"]) =>
    setSteps((prev) => (prev.length >= MAX_GEN ? prev : [...prev, { turn, by }]));
  const nextFrame = () => advance(WATCH_TURNS[steps.length] ?? 0, "model");
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (mode !== "steer") return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      advance(-1, "you");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      advance(1, "you");
    }
  };

  /** headings, one per frame; the two given frames sit at zero */
  const headings: number[] = [0, 0];
  for (const s of steps) headings.push(headings[headings.length - 1] + s.turn);

  const perRow = compact ? 4 : TOTAL;
  const rows = Math.ceil(TOTAL / perRow);
  const tagH = fs * 2.6 + 8;
  const rowPitch = FH + tagH + 18;
  const W = M * 2 + perRow * FW + (perRow - 1) * GAP;
  const H = COND_H + rows * rowPitch;

  const bw = compact ? 130 : 158;
  const bh = 34;
  const by1 = 14;
  const by2 = by1 + bh + 10;
  const mid = (by1 + by2 + bh) / 2;

  const arrow = (y: number) => {
    const x0 = M + bw + 2;
    const x1 = M + bw + 34;
    return `M ${x0} ${y} L ${x1} ${y} L ${x1} ${mid}`;
  };

  const modeWord = mode === "watch" ? T.watch : T.steer;
  const verdict =
    mode === "watch"
      ? steps.length === 0
        ? T.watch0
        : full
          ? T.watchFull
          : T.watchMid
      : steps.length === 0
        ? T.steer0
        : full
          ? T.steerFull
          : T.steerMid(lastYou && lastYou.turn < 0 ? T.dir.left : T.dir.right);

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <div
          tabIndex={0}
          role="group"
          aria-label={T.keyHelp}
          onKeyDown={onKey}
          className="focus-visible:outline-2 focus-visible:outline-imagine"
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block w-full"
            role="img"
            aria-label={T.aria(modeWord, GIVEN + steps.length, yours)}
          >
            {/* what feeds the next frame */}
            <rect
              x={M}
              y={by1}
              width={bw}
              height={bh}
              fill="none"
              stroke="var(--actual)"
              strokeWidth="1"
            />
            <text x={M + 9} y={by1 + bh / 2 + fs * 0.36} className="font-mono" fontSize={fs} fill="var(--actual)">
              {T.condFrames}
            </text>
            <rect
              x={M}
              y={by2}
              width={bw}
              height={bh}
              fill="none"
              stroke={mode === "steer" ? "var(--imagine)" : "var(--rule-strong)"}
              strokeWidth="1"
              strokeDasharray={mode === "steer" ? undefined : "3 3"}
            />
            <text
              x={M + 9}
              y={by2 + bh / 2 + fs * 0.36}
              className="font-mono"
              fontSize={fs}
              fill={mode === "steer" ? "var(--imagine)" : "var(--ink-faint)"}
            >
              {mode === "steer" ? T.condKey : T.condNothing}
            </text>
            <path d={arrow(by1 + bh / 2)} fill="none" stroke="var(--rule-strong)" strokeWidth="1" />
            <path d={arrow(by2 + bh / 2)} fill="none" stroke="var(--rule-strong)" strokeWidth="1" />
            <path
              d={`M ${M + bw + 34} ${mid} L ${M + bw + 52} ${mid} M ${M + bw + 46} ${mid - 4} L ${M + bw + 52} ${mid} L ${M + bw + 46} ${mid + 4}`}
              fill="none"
              stroke="var(--rule-strong)"
              strokeWidth="1"
            />
            <text x={M + bw + 58} y={mid + fs * 0.36} className="font-mono" fontSize={fs} fill="var(--ink-muted)">
              {T.condNext}
            </text>

            {/* the clip */}
            {Array.from({ length: TOTAL }, (_, i) => {
              const shown = i < GIVEN + steps.length;
              const isGiven = i < GIVEN;
              const step = steps[i - GIVEN];
              const x = M + (i % perRow) * (FW + GAP);
              const y = COND_H + Math.floor(i / perRow) * rowPitch;
              const colour = isGiven ? "var(--actual)" : "var(--imagine)";
              return (
                <g key={i} transform={`translate(${x} ${y})`}>
                  {shown ? (
                    <Frame heading={headings[i]} colour={colour} id={`wos-clip-${i}`} />
                  ) : (
                    <rect
                      x="0"
                      y="0"
                      width={FW}
                      height={FH}
                      fill="none"
                      stroke="var(--rule)"
                      strokeWidth="1"
                      strokeDasharray="3 4"
                    />
                  )}
                  {shown && (
                    <>
                      <text
                        x="0"
                        y={FH + fs * 1.5}
                        className="font-mono"
                        fontSize={fs}
                        fill={isGiven ? "var(--actual)" : "var(--ink-muted)"}
                      >
                        {isGiven ? T.given : step?.by === "you" ? T.byYou : T.byModel[0]}
                      </text>
                      {!isGiven && (
                        <text x="0" y={FH + fs * 2.7} className="font-mono" fontSize={fs} fill="var(--ink-muted)">
                          {step?.by === "you"
                            ? step.turn < 0
                              ? T.dir.left
                              : T.dir.right
                            : T.byModel[1]}
                        </text>
                      )}
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div
        data-print-hide
        className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="label">{T.mode}</span>
          <div className="flex flex-wrap gap-px" role="group" aria-label={`${T.watch} / ${T.steer}`}>
            {(["watch", "steer"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setModeTo(m)}
                className={`label h-9 border px-3 transition-colors ${
                  mode === m
                    ? "border-imagine bg-imagine !text-paper"
                    : "border-rule-strong bg-paper !text-ink hover:border-ink"
                }`}
              >
                {m === "watch" ? T.watch : T.steer}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {mode === "watch" ? (
            <button
              type="button"
              onClick={nextFrame}
              disabled={full}
              className="h-9 border border-rule-strong bg-paper px-4 transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rule-strong"
            >
              <span className="label whitespace-nowrap !text-ink">{T.next}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => advance(-1, "you")}
                disabled={full}
                className="h-9 border border-rule-strong bg-paper px-4 transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rule-strong"
              >
                <span className="label whitespace-nowrap !text-ink">{T.left}</span>
              </button>
              <button
                type="button"
                onClick={() => advance(1, "you")}
                disabled={full}
                className="h-9 border border-rule-strong bg-paper px-4 transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rule-strong"
              >
                <span className="label whitespace-nowrap !text-ink">{T.right}</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setSteps([])}
            disabled={steps.length === 0}
            className="h-9 border border-rule-strong bg-paper px-4 transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rule-strong"
          >
            <span className="label whitespace-nowrap !text-ink">{T.again}</span>
          </button>
        </div>

        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.rFrames, T.ofN(GIVEN + steps.length, TOTAL)],
          [T.rYours, T.ofN(yours, steps.length)],
          [T.rExtra, mode === "watch" ? T.extraNone : T.extraKey],
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
