"use client";

import { useState } from "react";
import { useReducedMotion } from "motion/react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * What the actor can actually see when it learns.
 *
 * One imagined rollout, fifteen steps long, and a reward that the reader can
 * drag out past the end of it. Past the end there is nothing for the actor to
 * add up, which is the hole the critic is there to fill: one number standing
 * for everything after the last imagined step. The number is a guess, and no
 * part of it came from the environment.
 *
 * Illustrative: the rollout length, the reward value and the discount. The
 * claim that has to survive is the chapter's, that neither the actor nor the
 * critic touched the world while learning.
 */

const LAST = 60;
const IMAGINED = 15;
const REWARD = 10;
const DISCOUNT = 0.97;

/**
 * A 900-unit box shrunk into a phone column puts the type under six pixels, so
 * the narrow version is a shorter box rather than the same box scaled down.
 */
const WIDE = {
  w: 900,
  h: 196,
  x0: 70,
  x1: 866,
  track: 112,
  blockTop: 44,
  rewardY: 96,
  rowY: 140,
  bracketY: 158,
  bracketLabelY: 180,
  blockHalf: 60,
  rewardHalf: 92,
  labelHalf: 74,
};
const NARROW = {
  w: 470,
  h: 170,
  x0: 34,
  x1: 442,
  track: 92,
  blockTop: 30,
  rewardY: 76,
  rowY: 118,
  bracketY: 136,
  bracketLabelY: 158,
  blockHalf: 84,
  rewardHalf: 138,
  labelHalf: 126,
};

type Text = {
  realState: string;
  realStateShort: string;
  stops: string;
  after: string;
  reward: string;
  bracket: string;
  guess: string;
  slider: string;
  critic: string;
  steps: string;
  inside: string;
  supplied: string;
  vIn: string;
  vOut: (n: number) => string;
  vCritic: string;
  aria: (r: number, on: boolean) => string;
};

const TEXT: LocaleText<Text> = {
  en: {
    realState: "a real state",
    realStateShort: "real state",
    stops: "imagination stops here",
    after: "everything after",
    reward: "the object comes off the table",
    bracket: "what the actor can add up",
    guess: "critic's guess",
    slider: "Where the reward sits",
    critic: "Critic estimates the rest",
    steps: "Imagined steps",
    inside: "Reward inside the rollout",
    supplied: "Reward the critic supplies",
    vIn: "The reward is inside the imagined stretch, so the actor can see it without help.",
    vOut: (n) =>
      `The reward is ${n} steps past the end of what the actor imagined, so the actor has nothing to aim at.`,
    vCritic:
      "The critic hands the actor one number for everything after step fifteen. The actor learned from that number, and none of it came from the world.",
    aria: (r, on) =>
      `A track of sixty steps from one real state. The first fifteen are imagined; the reward sits at step ${r}. The critic's estimate is ${on ? "on" : "off"}.`,
  },
};

export function CriticSeesFurther() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const { ref, compact } = useCompact(600);
  const k = compact ? 1.65 : 1;
  const still = useReducedMotion();

  const [r, setR] = useState(40);
  const [critic, setCritic] = useState(false);

  const G = compact ? NARROW : WIDE;
  const px = (step: number) => G.x0 + (step / LAST) * (G.x1 - G.x0);
  const stopX = px(IMAGINED);
  const inside = r <= IMAGINED;
  const supplied = critic && !inside ? REWARD * DISCOUNT ** (r - IMAGINED) : 0;
  const bracketEnd = critic ? stopX + G.blockHalf : stopX;
  const rewardX = Math.max(G.rewardHalf, Math.min(G.w - G.rewardHalf, px(r)));
  const bracketMid = Math.max(G.labelHalf, (px(1) + bracketEnd) / 2);

  const verdict = inside ? T.vIn : critic ? T.vCritic : T.vOut(r - IMAGINED);

  return (
    <div>
      <div ref={ref} className="px-5 pt-6 md:px-8">
        <svg
          viewBox={`0 0 ${G.w} ${G.h}`}
          className="block w-full"
          role="img"
          aria-label={T.aria(r, critic)}
        >
          {/* everything past the last imagined step, unmarked */}
          <line
            x1={stopX}
            y1={G.track}
            x2={G.x1}
            y2={G.track}
            stroke="var(--ink-faint)"
            strokeWidth="1.5"
          />
          {/* the imagined stretch */}
          <line
            x1={G.x0}
            y1={G.track}
            x2={stopX}
            y2={G.track}
            stroke="var(--imagine)"
            strokeWidth="2"
          />
          {Array.from({ length: IMAGINED }, (_, i) => i + 1)
            .filter((s) => !compact || s % 3 === 0)
            .map((s) => (
              <line
                key={s}
                x1={px(s)}
                y1={G.track - 7}
                x2={px(s)}
                y2={G.track + 7}
                stroke="var(--imagine)"
                strokeWidth="1.5"
              />
            ))}

          <line
            x1={stopX}
            y1={G.blockTop - 10}
            x2={stopX}
            y2={G.track + 14}
            stroke="var(--ink-faint)"
            strokeWidth="1"
          />
          <circle cx={G.x0} cy={G.track} r={6} fill="var(--actual)" />

          {/* one number for everything the rollout did not reach */}
          {critic && (
            <g
              style={{
                opacity: 1,
                transition: still ? "none" : "opacity 200ms ease",
              }}
            >
              <rect
                x={stopX - G.blockHalf}
                y={G.blockTop}
                width={G.blockHalf * 2}
                height={36}
                fill="none"
                stroke="var(--imagine)"
                strokeWidth="1.5"
              />
              <text
                x={stopX}
                y={G.blockTop + 24}
                textAnchor="middle"
                className="font-mono"
                fontSize={11 * k}
                fill="var(--imagine)"
              >
                {T.guess}
              </text>
            </g>
          )}

          <rect
            x={px(r) - 6.5}
            y={G.track - 6.5}
            width={13}
            height={13}
            fill="var(--ink)"
          />
          <text
            x={rewardX}
            y={G.rewardY}
            textAnchor="middle"
            className="font-mono"
            fontSize={11 * k}
            fill="var(--ink)"
          >
            {T.reward}
          </text>

          <text
            x={G.x0 - 10}
            y={G.rowY}
            className="font-mono"
            fontSize={(compact ? 10 : 11) * k}
            fill="var(--ink-faint)"
          >
            {compact ? T.realStateShort : T.realState}
          </text>
          <text
            x={stopX + 8}
            y={G.rowY}
            className="font-mono"
            fontSize={(compact ? 10 : 11) * k}
            fill="var(--ink-faint)"
          >
            {T.stops}
          </text>
          {/* the narrow box has no room for a third label on this row */}
          {!compact && (
            <text
              x={G.x1}
              y={G.rowY}
              textAnchor="end"
              className="font-mono"
              fontSize={11}
              fill="var(--ink-faint)"
            >
              {T.after}
            </text>
          )}

          {/* what the actor can add up */}
          <path
            d={`M ${px(1)} ${G.bracketY - 8} L ${px(1)} ${G.bracketY} L ${bracketEnd} ${G.bracketY} L ${bracketEnd} ${G.bracketY - 8}`}
            fill="none"
            stroke="var(--imagine)"
            strokeWidth="1.2"
          />
          <text
            x={bracketMid}
            y={G.bracketLabelY}
            textAnchor="middle"
            className="font-mono"
            fontSize={11 * k}
            fill="var(--imagine)"
          >
            {T.bracket}
          </text>
        </svg>
      </div>

      <div
        data-print-hide
        className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8"
      >
        <label className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[18rem] sm:flex-1 sm:flex-nowrap">
          <span className="label basis-full whitespace-nowrap sm:basis-auto">
            {T.slider}
          </span>
          <input
            type="range"
            min={1}
            max={LAST}
            value={r}
            onChange={(e) => setR(Number(e.target.value))}
            className="h-1 min-w-[6rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-10 text-right !text-ink">{r}</span>
        </label>

        <label className="flex cursor-pointer items-center gap-3">
          <span className="label">{T.critic}</span>
          <button
            type="button"
            role="switch"
            aria-checked={critic}
            onClick={() => setCritic((v) => !v)}
            className={`relative h-6 w-11 border transition-colors ${
              critic
                ? "border-imagine bg-imagine"
                : "border-rule-strong bg-paper"
            }`}
          >
            <span
              className={`absolute top-[3px] h-4 w-4 ${still ? "" : "transition-all"} ${
                critic ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"
              }`}
            />
          </button>
        </label>

        <p
          className="label basis-full !normal-case !tracking-normal !text-[0.8rem]"
          aria-live="polite"
        >
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.steps, String(IMAGINED)],
          [T.inside, inside ? String(REWARD) : "0"],
          [T.supplied, supplied === 0 ? "0" : supplied.toFixed(1)],
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
