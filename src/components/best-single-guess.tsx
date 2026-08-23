"use client";

import { useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * What one number costs when the world has two answers.
 *
 * One frozen moment: the ball went behind the wall and twenty worlds are
 * consistent with what is known. Eight stopped at the kerb, twelve rolled on.
 * The reader drags the model's single answer along the ground and watches the
 * typical miss, which is minimised in the empty space between the clumps.
 *
 * Nothing moves, nothing widens and there is no time slider: this is a
 * scoreboard, not the picture from chapter 1. The two readouts are computed
 * from the world list rather than asserted, so the flip to the spread is the
 * only place the arithmetic changes.
 */

/** the twenty worlds, in metres from where the ball went out of sight */
const KERB = [2.0, 2.05, 2.1, 2.2, 2.2, 2.3, 2.35, 2.4];
const ROLLED = [6.2, 6.25, 6.3, 6.4, 6.4, 6.45, 6.5, 6.55, 6.6, 6.65, 6.7, 6.8];
const WORLDS = [...KERB, ...ROLLED];
const MAX_M = 9;
const NEAR = 0.5;

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const rms = (a: number) => Math.sqrt(WORLDS.reduce((s, w) => s + (w - a) ** 2, 0) / WORLDS.length);
const covered = (a: number) => WORLDS.filter((w) => Math.abs(w - a) <= NEAR).length;

type Strings = {
  behind: string;
  kerb: string;
  rolled: string;
  kerbShort: string;
  rolledShort: string;
  answerLabel: string;
  spreadLabel: string;
  metres: (n: string) => string;
  unit: string;
  typical: string;
  notOne: string;
  right: string;
  ofTwenty: (n: number) => string;
  within: string;
  vBest: string;
  vNear: (n: number) => string;
  vNowhere: string;
  vSpread: string;
  ariaOne: (a: string, miss: string, n: number) => string;
  ariaSpread: string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    behind: "behind the wall",
    kerb: "stopped at the kerb, 8",
    rolled: "rolled on, 12",
    kerbShort: "8",
    rolledShort: "12",
    answerLabel: "the one answer",
    spreadLabel: "hand back the spread",
    metres: (n) => `${n} m`,
    unit: "m",
    typical: "typical miss",
    notOne: "not one number",
    right: "worlds you got right",
    ofTwenty: (n) => `${n} of 20`,
    within: "within half a metre",
    vBest: "This is the answer with the smallest typical miss, and the ball is never there. A squared loss puts the model right here.",
    vNear: (n) => `Right in ${n} worlds out of twenty and badly wrong in the rest. One number cannot say which.`,
    vNowhere: "Wrong in all twenty, and nothing in the answer says so.",
    vSpread:
      "The spread covers both outcomes and says which is likelier. That is the half of the state the deterministic part cannot hold.",
    ariaOne: (a, miss, n) =>
      `Twenty possible resting places for a ball hidden behind a wall, eight near 2 metres and twelve near 6.5 metres. The model's single answer sits at ${a} metres, a typical miss of ${miss} metres, right in ${n} of the twenty worlds.`,
    ariaSpread:
      "Twenty possible resting places for a ball hidden behind a wall. Instead of one answer the model hands back a spread with two lobes, a smaller one over the eight worlds at the kerb and a larger one over the twelve that rolled on.",
  },
};

function layout(compact: boolean) {
  const fs = compact ? 17 : 10.5;
  const W = compact ? 560 : 900;
  const pad = compact ? 22 : 44;
  const wallTop = 8;
  const wallH = compact ? 74 : 62;
  const ground = wallTop + wallH + (compact ? 118 : 104);
  const H = Math.round(ground + fs * 4.2 + 14);
  const r = compact ? 7 : 6;
  return {
    fs,
    W,
    H,
    pad,
    wallTop,
    wallH,
    ground,
    r,
    ballY: ground - r - 1,
    apexY: ground - (compact ? 92 : 82),
    tickY: ground + fs + 12,
    clumpY: ground + fs * 3 + 12,
    lobeMax: compact ? 88 : 78,
    xAt: (m: number) => pad + (m / MAX_M) * (W - 2 * pad),
  };
}

/** a soft lobe over one clump, its height carrying how many worlds it holds */
function lobePath(L: ReturnType<typeof layout>, centre: number, spread: number, share: number) {
  const height = L.lobeMax * share;
  const steps = 40;
  const pts: string[] = [`M ${L.xAt(centre - spread * 3).toFixed(1)} ${L.ground.toFixed(1)}`];
  for (let i = 0; i <= steps; i++) {
    const m = centre - spread * 3 + (i / steps) * spread * 6;
    const y = L.ground - height * Math.exp(-((m - centre) ** 2) / (2 * spread * spread));
    pts.push(`L ${L.xAt(m).toFixed(1)} ${y.toFixed(1)}`);
  }
  pts.push(`L ${L.xAt(centre + spread * 3).toFixed(1)} ${L.ground.toFixed(1)} Z`);
  return pts.join(" ");
}

export function BestSingleGuess() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const { ref, compact } = useCompact(600);
  const L = layout(compact);

  const [answer, setAnswer] = useState(4.8);
  const [spread, setSpread] = useState(false);

  const miss = rms(answer);
  const hit = covered(answer);
  const kerbMean = mean(KERB);
  const rolledMean = mean(ROLLED);

  const verdict = spread
    ? T.vSpread
    : answer >= 4.2 && answer <= 5.4
      ? T.vBest
      : hit > 0
        ? T.vNear(hit)
        : T.vNowhere;

  const ticks = compact ? [0, 4, 8] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg
          viewBox={`0 0 ${L.W} ${L.H}`}
          className="block w-full"
          role="img"
          aria-label={spread ? T.ariaSpread : T.ariaOne(answer.toFixed(1), miss.toFixed(1), hit)}
        >
          {/* the wall the ball went behind */}
          <rect x={0} y={L.wallTop} width={L.W} height={L.wallH} fill="var(--paper-sunk)" />
          <text
            x={L.pad}
            y={L.wallTop + L.fs + 8}
            className="font-mono"
            fontSize={L.fs}
            letterSpacing="1"
            fill="var(--ink-faint)"
          >
            {T.behind}
          </text>

          {/* the spread: two lobes, sized by how many worlds each holds */}
          {spread && (
            <g>
              <path d={lobePath(L, kerbMean, 0.36, KERB.length / WORLDS.length)} fill="var(--imagine-soft)" stroke="var(--imagine)" strokeWidth="1.6" />
              <path d={lobePath(L, rolledMean, 0.36, ROLLED.length / WORLDS.length)} fill="var(--imagine-soft)" stroke="var(--imagine)" strokeWidth="1.6" />
            </g>
          )}

          {/* every miss, as a fan from the single answer */}
          {!spread &&
            WORLDS.map((w, i) => (
              <line
                key={i}
                x1={L.xAt(answer)}
                y1={L.apexY}
                x2={L.xAt(w)}
                y2={L.ballY}
                stroke="var(--imagine)"
                strokeWidth="0.8"
                opacity="0.35"
              />
            ))}

          {/* the ground */}
          <line x1={L.xAt(0)} y1={L.ground} x2={L.xAt(MAX_M)} y2={L.ground} stroke="var(--rule-strong)" strokeWidth="1" />
          {Array.from({ length: MAX_M + 1 }, (_, m) => (
            <line
              key={m}
              x1={L.xAt(m)}
              y1={L.ground}
              x2={L.xAt(m)}
              y2={L.ground + (ticks.includes(m) ? 7 : 4)}
              stroke="var(--rule)"
              strokeWidth="1"
            />
          ))}
          {ticks.map((m) => (
            <text
              key={m}
              x={L.xAt(m)}
              y={L.tickY}
              textAnchor="middle"
              className="font-mono tnum"
              fontSize={L.fs}
              fill="var(--ink-faint)"
            >
              {m}
            </text>
          ))}
          <text x={L.xAt(MAX_M) + 5} y={L.ground - 6} className="font-mono" fontSize={L.fs} fill="var(--ink-faint)">
            {T.unit}
          </text>

          {/* the twenty worlds, filled once the answer covers them */}
          {WORLDS.map((w, i) => {
            const on = spread || Math.abs(w - answer) <= NEAR;
            return (
              <circle
                key={i}
                cx={L.xAt(w)}
                cy={L.ballY}
                r={L.r}
                fill={on ? "var(--actual)" : "var(--actual-soft)"}
                stroke="var(--actual)"
                strokeWidth="1.4"
                className="transition-[fill] duration-200 motion-reduce:transition-none"
              />
            );
          })}

          <text
            x={L.xAt(kerbMean)}
            y={L.clumpY}
            textAnchor="middle"
            className="font-mono"
            fontSize={L.fs}
            fill="var(--ink-faint)"
          >
            {compact ? T.kerbShort : T.kerb}
          </text>
          <text
            x={L.xAt(rolledMean)}
            y={L.clumpY}
            textAnchor="middle"
            className="font-mono"
            fontSize={L.fs}
            fill="var(--ink-faint)"
          >
            {compact ? T.rolledShort : T.rolled}
          </text>

          {/* the model's single answer */}
          {!spread && (
            <g>
              <line
                x1={L.xAt(answer)}
                y1={L.apexY}
                x2={L.xAt(answer)}
                y2={L.ballY}
                stroke="var(--imagine)"
                strokeWidth="1.2"
              />
              <circle cx={L.xAt(answer)} cy={L.ballY} r={L.r + 2} fill="var(--imagine)" />
            </g>
          )}
        </svg>
      </div>

      <div
        data-print-hide
        className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-rule px-5 py-4 md:px-8"
      >
        <label className="flex min-w-[min(18rem,100%)] flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          <span className={`label whitespace-nowrap ${spread ? "opacity-50" : ""}`}>{T.answerLabel}</span>
          <input
            type="range"
            min={0}
            max={MAX_M}
            step={0.1}
            value={answer}
            disabled={spread}
            onChange={(e) => setAnswer(Number(e.target.value))}
            aria-valuetext={T.metres(answer.toFixed(1))}
            className="h-1 min-w-[8rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)] disabled:cursor-default disabled:opacity-40"
          />
          <span
            className={`label tnum w-16 whitespace-nowrap text-right !normal-case ${spread ? "opacity-50" : "!text-ink"}`}
          >
            {T.metres(answer.toFixed(1))}
          </span>
        </label>

        <label className="flex cursor-pointer items-center gap-3">
          <span className="label">{T.spreadLabel}</span>
          <button
            type="button"
            role="switch"
            aria-checked={spread}
            aria-label={T.spreadLabel}
            onClick={() => setSpread((v) => !v)}
            className={`relative h-6 w-11 border transition-colors ${
              spread ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"
            }`}
          >
            <span
              className={`absolute top-[3px] h-4 w-4 transition-all motion-reduce:transition-none ${
                spread ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"
              }`}
            />
          </button>
        </label>

        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{T.typical}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">
            {spread ? T.notOne : T.metres(miss.toFixed(1))}
          </p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{T.right}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">
            {T.ofTwenty(spread ? WORLDS.length : hit)}
          </p>
          <p className="mt-1 text-[0.72rem] text-ink-faint">{T.within}</p>
        </div>
      </div>
    </div>
  );
}
