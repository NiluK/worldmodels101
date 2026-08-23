"use client";

import { useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * What a fresh reading can and cannot pull back.
 *
 * Predict, correct, predict, correct, drawn as a sawtooth. Every prediction
 * pushes the error up by an honest step; every blip pulls the part a reading
 * can see back down by the gain. That half settles on a small number and
 * stays there, which is the look-again truce working.
 *
 * The wind is the other half. It is not in the dynamics the filter was given
 * and no reading touches it, so it sits flat forever however many corrections
 * arrive. That flat line is why the truce is a truce and not a fix.
 *
 * Fully deterministic, so every reader sees the same trace. Units are
 * illustrative.
 */

/** honest error the prediction adds on its own, and how much of it a blip removes */
const Q = 1.0;
const GAIN = 0.6;
const MAX_TICKS = 16;
/** a little headroom above the top label, so the strongest wind does not clip */
const MAX_ERR = 10.5;

/** the sawtooth, as one polyline: each tick is an up stroke then a down stroke */
function trace(ticks: number, wind: number) {
  const pts: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  let pe = 0;
  for (let i = 1; i <= ticks; i++) {
    pe = pe + Q + wind;
    pts.push({ x: i - 0.5, y: pe });
    pe = (1 - GAIN) * pe;
    pts.push({ x: i, y: pe });
  }
  return { pts, pe };
}

type Strings = {
  seen: string;
  unseen: string;
  errSeen: string;
  errUnseen: string;
  xAxis: string;
  yAxis: string;
  predict: string;
  correct: string;
  wind: string;
  look: string;
  reset: string;
  corrections: string;
  units: (n: string) => string;
  v0: string;
  vCalm: string;
  vEarly: string;
  vLate: (n: number, pe: string, he: string) => string;
  aria: (n: number, pe: string, he: string) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    seen: "the part you can see",
    unseen: "the part you cannot see",
    errSeen: "error you can see",
    errUnseen: "error you cannot see",
    xAxis: "corrections",
    yAxis: "how far off",
    predict: "predict",
    correct: "correct",
    wind: "wind the filter was not told about",
    look: "Look again",
    reset: "Reset",
    corrections: "corrections",
    units: (n) => `${n} units`,
    v0: "Press Look again. Each press is one prediction and one blip.",
    vCalm:
      "No wind, so every blip pulls the error nearly all the way back. This is the filter with the dynamics it was given being right.",
    vEarly: "The blips keep pulling the measured half down. The half you cannot see has not moved.",
    vLate: (n, pe, he) =>
      `${n} corrections in. The measured half comes back to about ${pe} every time, and the half you cannot see is still sitting at ${he}. No reading touches it.`,
    aria: (n, pe, he) =>
      `A chart of two error traces against corrections. After ${n} corrections the part a reading can see settles at ${pe} units after each blip, drawn as a sawtooth. The part no reading touches is flat at ${he} units.`,
  },
  zh: {
    seen: "你看得见的那一半",
    unseen: "你看不见的那一半",
    errSeen: "你看得见的误差",
    errUnseen: "你看不见的误差",
    xAxis: "修正次数",
    yAxis: "偏差有多大",
    predict: "预测",
    correct: "修正",
    wind: "没有告诉滤波器的风",
    look: "再看一眼",
    reset: "重置",
    corrections: "修正次数",
    units: (n) => `${n} 个单位`,
    v0: "按「再看一眼」。每按一次就是一次预测加一次读数。",
    vCalm: "没有风，所以每次读数几乎把误差整个拉回来。这是滤波器手上那套动力学恰好正确的情形。",
    vEarly: "读数一直在把看得见的那一半往下拉。看不见的那一半一动没动。",
    vLate: (n, pe, he) =>
      `已经修正 ${n} 次。看得见的那一半每次都回到 ${pe} 左右，而看不见的那一半仍然停在 ${he}。没有任何读数碰得到它。`,
    aria: (n, pe, he) =>
      `一张两条误差曲线随修正次数变化的图。经过 ${n} 次修正后，读数能看见的那一半在每次修正后稳定在 ${pe} 个单位，画成锯齿状。没有任何读数碰得到的那一半平直地停在 ${he} 个单位。`,
  },
};

function layout(compact: boolean) {
  const fs = compact ? 17 : 10.5;
  const W = compact ? 560 : 900;
  const padL = compact ? 30 : 44;
  const padR = compact ? 26 : 40;
  const keyH = Math.round(fs * 2.6 + 10);
  const padT = compact ? 24 : keyH + 26;
  const padB = Math.round(fs * 3 + 16) + (compact ? keyH : 0);
  const H = compact ? 320 : 290;
  const plotB = H - padB;
  return {
    fs,
    W,
    H,
    padL,
    padR,
    padT,
    plotB,
    keyY: compact ? plotB + fs * 3 + 16 : 14,
    xAt: (k: number) => padL + (k / MAX_TICKS) * (W - padL - padR),
    yAt: (v: number) => plotB - (Math.min(v, MAX_ERR) / MAX_ERR) * (plotB - padT),
  };
}

export function WhatTheBlipFixes() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const { ref, compact } = useCompact(600);
  const L = layout(compact);

  const [wind, setWind] = useState(0);
  const [ticks, setTicks] = useState(0);

  const { pts, pe } = trace(ticks, wind);
  const he = wind;
  const done = ticks >= MAX_TICKS;

  const verdict =
    ticks === 0
      ? T.v0
      : wind === 0
        ? T.vCalm
        : ticks < 6
          ? T.vEarly
          : T.vLate(ticks, pe.toFixed(1), he.toFixed(1));

  const path = pts.map((p, i) => `${i ? "L" : "M"} ${L.xAt(p.x).toFixed(1)} ${L.yAt(p.y).toFixed(1)}`).join(" ");
  const xTicks = compact ? [0, 8, 16] : [0, 4, 8, 12, 16];
  const yTicks = [0, 3, 6, 9];
  const flatTo = Math.max(ticks, 0.6);

  const key = [
    { colour: "var(--actual)", label: T.seen },
    { colour: "var(--imagine)", label: T.unseen },
  ];

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg
          viewBox={`0 0 ${L.W} ${L.H}`}
          className="block w-full"
          role="img"
          aria-label={T.aria(ticks, pe.toFixed(1), he.toFixed(1))}
        >
          {/* key */}
          {key.map((item, i) => (
            <g key={item.label} transform={`translate(${L.padL}, ${L.keyY + i * (L.fs + 8)})`}>
              <rect x={0} y={-L.fs * 0.8} width={L.fs} height={L.fs * 0.9} fill={item.colour} />
              <text x={L.fs + 8} y={0} className="font-mono" fontSize={L.fs} fill="var(--ink-muted)">
                {item.label}
              </text>
            </g>
          ))}

          {/* grid */}
          {yTicks.map((v) => (
            <line
              key={v}
              x1={L.padL}
              y1={L.yAt(v)}
              x2={L.W - L.padR}
              y2={L.yAt(v)}
              stroke="var(--rule)"
              strokeWidth="1"
            />
          ))}

          {/* the half no reading touches */}
          <g>
            <line
              x1={L.xAt(0)}
              y1={L.yAt(he)}
              x2={L.xAt(flatTo)}
              y2={L.yAt(he)}
              stroke="var(--imagine)"
              strokeWidth="2.5"
            />
            <text
              x={L.xAt(flatTo) + 6}
              y={L.yAt(he) - 6}
              className="font-mono tnum"
              fontSize={L.fs}
              fill="var(--imagine)"
            >
              {he.toFixed(1)}
            </text>
          </g>

          {/* the half a reading can see */}
          <path d={path} fill="none" stroke="var(--actual)" strokeWidth="2.5" strokeLinejoin="round" />
          {Array.from({ length: ticks }, (_, i) => (
            <line
              key={i}
              x1={L.xAt(i + 1)}
              y1={L.plotB}
              x2={L.xAt(i + 1)}
              y2={L.plotB - 6}
              stroke="var(--actual)"
              strokeWidth="1.6"
            />
          ))}

          {/* name the two half steps once, on the first tooth */}
          {ticks > 0 && !compact && (
            <>
              <text
                x={L.xAt(0.5) + 7}
                y={L.yAt(Q + wind) - 6}
                className="font-mono"
                fontSize={L.fs}
                fill="var(--ink-faint)"
              >
                {T.predict}
              </text>
              <text
                x={L.xAt(1) + 7}
                y={L.yAt((1 - GAIN) * (Q + wind)) + L.fs}
                className="font-mono"
                fontSize={L.fs}
                fill="var(--ink-faint)"
              >
                {T.correct}
              </text>
            </>
          )}

          {/* axes */}
          <line x1={L.padL} y1={L.plotB} x2={L.W - L.padR} y2={L.plotB} stroke="var(--rule-strong)" strokeWidth="1" />
          <line x1={L.padL} y1={L.padT} x2={L.padL} y2={L.plotB} stroke="var(--rule-strong)" strokeWidth="1" />
          {yTicks.map((v) => (
            <text
              key={`y${v}`}
              x={L.padL - 6}
              y={L.yAt(v) + L.fs * 0.36}
              textAnchor="end"
              className="font-mono tnum"
              fontSize={L.fs}
              fill="var(--ink-faint)"
            >
              {v}
            </text>
          ))}
          {xTicks.map((v) => (
            <text
              key={v}
              x={L.xAt(v)}
              y={L.plotB + L.fs + 10}
              textAnchor="middle"
              className="font-mono tnum"
              fontSize={L.fs}
              fill="var(--ink-faint)"
            >
              {v}
            </text>
          ))}
          <text
            x={L.W - L.padR}
            y={L.plotB + L.fs * 2.4 + 10}
            textAnchor="end"
            className="font-mono"
            fontSize={L.fs}
            letterSpacing="1"
            fill="var(--ink-faint)"
          >
            {T.xAxis}
          </text>
          <text
            x={L.padL}
            y={L.padT - 7}
            className="font-mono"
            fontSize={L.fs}
            letterSpacing="1"
            fill="var(--ink-faint)"
          >
            {T.yAxis}
          </text>
        </svg>
      </div>

      <div
        data-print-hide
        className="mt-2 flex flex-col gap-4 border-t border-rule px-5 py-4 md:px-8"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <label className="flex min-w-[min(18rem,100%)] flex-1 flex-wrap items-center gap-x-3 gap-y-2">
            <span className="label">{T.wind}</span>
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={wind}
              onChange={(e) => {
                setWind(Number(e.target.value));
                setTicks(0);
              }}
              aria-valuetext={T.units(String(wind))}
              className="h-1 min-w-[8rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
            />
            <span className="label tnum w-8 text-right !text-ink">{wind}</span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTicks((n) => Math.min(MAX_TICKS, n + 1))}
              disabled={done}
              className={`label h-10 border px-5 transition-colors ${
                done
                  ? "border-rule-strong bg-paper !text-ink opacity-60"
                  : "border-imagine bg-imagine !text-paper"
              }`}
            >
              {T.look}
            </button>
            <button
              type="button"
              onClick={() => setTicks(0)}
              className="label h-10 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink"
            >
              {T.reset}
            </button>
          </div>
        </div>
        <p className="label max-w-[64ch] !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.corrections, String(ticks)],
          [T.errSeen, T.units(pe.toFixed(1))],
          [T.errUnseen, T.units(he.toFixed(1))],
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
