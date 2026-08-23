"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * A rate is not a guarantee.
 *
 * One room, one door, and a walk away and back per press. Almost every run
 * comes back the way it left, which is what "usually" looks like from inside;
 * the tally underneath is the only place the exceptions are visible at all.
 *
 * The outcomes are a function of the run index, not Math.random: the server
 * and the client have to agree, and the reader has to be able to be told the
 * same story twice. Under the engine there is nothing to draw from, so every
 * run holds and the readouts stop reporting a rate.
 */

type Hold = "learned" | "engine";
type Outcome = "held" | "moved" | "gone";

const MAX_RUNS = 60;
const STEP_MS = 45;
const BATCH = 20;

/** the runs that do not come back the same; chosen so the first several presses hold */
const FAILS = new Set([9, 23, 31, 44, 52]);

/** two of the five lose the door altogether; both facts are functions of the index */
const isGone = (i: number) => i % 3 === 1;
const shiftOf = (i: number) => {
  const s = ((i * 7) % 11) - 5;
  return s === 0 ? 4 : s;
};
const outcomeOf = (i: number, hold: Hold): Outcome =>
  hold === "engine" || !FAILS.has(i) ? "held" : isGone(i) ? "gone" : "moved";

const WALL_Y0 = 30;
const FLOOR = 124;
const DOOR_W = 44;
const DOOR_H = 78;
const PITCH = 22;

/** the room is laid out across whatever width the viewBox has, so the narrow
 *  version can use a smaller box and get bigger type for the same screen */
function room(compact: boolean) {
  const W = compact ? 440 : 720;
  return {
    W,
    wallX0: Math.round(W * 0.15),
    wallX1: W - Math.round(W * 0.15),
    doorX: Math.round(W * 0.39),
    winX: W - Math.round(W * 0.15) - 84,
    unit: compact ? 11 : 17,
  };
}

type Text = {
  goOne: string;
  goMany: string;
  reset: string;
  holdLabel: string;
  learned: string;
  engine: string;
  capNone: string;
  capHeld: (n: number) => string;
  capMoved: (n: number) => string;
  capGone: (n: number) => string;
  tally: string;
  rRuns: string;
  rHeld: string;
  rGuarantee: string;
  guarNo: string;
  guarYes: string;
  ofN: (a: number, b: number) => string;
  v0: string;
  vAll: (n: number) => string;
  vJust: (n: number) => string;
  vSome: (n: number, k: number) => string;
  vEngine: string;
  aria: (n: number, k: number, cap: string) => string;
};

const TEXT: LocaleText<Text> = {
  en: {
    goOne: "Walk away and back",
    goMany: "Do twenty",
    reset: "Start over",
    holdLabel: "what holds the door in place",
    learned: "learned",
    engine: "an engine's scene graph",
    capNone: "no runs yet",
    capHeld: (n) => `run ${n}: the door came back where it was`,
    capMoved: (n) => `run ${n}: the door came back somewhere else`,
    capGone: (n) => `run ${n}: the door was not there at all`,
    tally: "one mark per run",
    rRuns: "runs",
    rHeld: "held",
    rGuarantee: "guarantee",
    guarNo: "no, this is a rate",
    guarYes: "yes, it is read back from a store",
    ofN: (a, b) => `${a} of ${b}`,
    v0: "Nothing here is holding the door in place. Press and see how often it comes back anyway.",
    vAll: (n) => `${n} out of ${n}. That is a rate, and a rate is not a promise.`,
    vJust: (n) => `Run ${n} came back with the door somewhere else. Nothing was holding it, so nothing had to hold.`,
    vSome: (n, k) => `${n} runs, ${k} of them wrong. Usually is exactly what that means.`,
    vEngine: "Nothing to fail here. The door is read back from a store, so every run is the same run.",
    aria: (n, k, cap) =>
      `A room with a door and a window. The door as it was left is drawn in slate and the door as it came back in vermilion. ${n} runs, ${k} of them came back the same. ${cap}`,
  },
};

export function UsuallyNotAlways() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const reduced = useReducedMotion();
  const { ref, compact } = useCompact(680);
  const fs = compact ? 13 : 10;
  const { W, wallX0, wallX1, doorX: DOOR_X, winX, unit: UNIT } = room(compact);

  const [hold, setHold] = useState<Hold>("learned");
  const [runs, setRuns] = useState(0);
  const [target, setTarget] = useState(0);

  useEffect(() => {
    if (runs >= target) return;
    const id = window.setTimeout(() => setRuns((r) => Math.min(target, r + 1)), STEP_MS);
    return () => window.clearTimeout(id);
  }, [runs, target]);

  // functional updates throughout: two presses in the same tick must both count
  const goOne = () => {
    setTarget((t) => Math.min(MAX_RUNS, t + 1));
    setRuns((r) => Math.min(MAX_RUNS, r + 1));
  };
  const goMany = () => {
    setTarget((t) => Math.min(MAX_RUNS, t + BATCH));
    setRuns((r) => Math.min(MAX_RUNS, r + (reduced ? BATCH : 1)));
  };
  const clear = () => {
    setTarget(0);
    setRuns(0);
  };
  const flip = (h: Hold) => {
    setHold(h);
    clear();
  };

  let failures = 0;
  for (let i = 1; i <= runs; i++) if (outcomeOf(i, hold) !== "held") failures += 1;
  const held = runs - failures;
  const last: Outcome | null = runs === 0 ? null : outcomeOf(runs, hold);

  const caption =
    last === null
      ? T.capNone
      : last === "held"
        ? T.capHeld(runs)
        : last === "moved"
          ? T.capMoved(runs)
          : T.capGone(runs);

  const verdict =
    hold === "engine"
      ? T.vEngine
      : runs === 0
        ? T.v0
        : last !== "held"
          ? T.vJust(runs)
          : failures === 0
            ? T.vAll(runs)
            : T.vSome(runs, failures);

  const perRow = compact ? 12 : 20;
  const tallyRows = Math.ceil(MAX_RUNS / perRow);
  const tallyW = perRow * PITCH;
  const tallyX = (W - tallyW) / 2;
  const tallyTop = 186;
  const H = tallyTop + tallyRows * PITCH + 6;

  const shownDoorX = last === null || last === "held" ? DOOR_X : DOOR_X + shiftOf(runs) * UNIT;

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={T.aria(runs, held, caption)}>
          <defs>
            <pattern id="una-brick" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="var(--imagine)" strokeWidth="1.1" />
            </pattern>
          </defs>

          {/* the room */}
          <rect
            x={wallX0}
            y={WALL_Y0}
            width={wallX1 - wallX0}
            height={FLOOR - WALL_Y0}
            fill="var(--paper-sunk)"
            stroke="var(--rule-strong)"
            strokeWidth="1"
          />
          <line x1={wallX0 - 26} y1={FLOOR} x2={W - wallX0 + 26} y2={FLOOR} stroke="var(--ink)" strokeWidth="1.5" />
          <line x1={wallX0 - 26} y1={FLOOR + 12} x2={W - wallX0 + 26} y2={FLOOR + 12} stroke="var(--rule)" strokeWidth="1" />

          {/* the landmark, so the door's position along the wall can be read */}
          <g stroke="var(--ink-muted)" strokeWidth="1" fill="none">
            <rect x={winX} y="42" width="64" height="40" />
            <line x1={winX + 32} y1="42" x2={winX + 32} y2="82" />
            <line x1={winX} y1="62" x2={winX + 64} y2="62" />
          </g>

          {/* the door as it was left */}
          <rect
            x={DOOR_X - DOOR_W / 2}
            y={FLOOR - DOOR_H}
            width={DOOR_W}
            height={DOOR_H}
            fill="none"
            stroke="var(--actual)"
            strokeWidth="1.5"
          />
          <circle cx={DOOR_X + DOOR_W / 2 - 8} cy={FLOOR - DOOR_H / 2} r="2.5" fill="var(--actual)" />

          {/* the door as it came back */}
          {last === "gone" && (
            <>
              <rect
                x={DOOR_X - DOOR_W / 2}
                y={FLOOR - DOOR_H}
                width={DOOR_W}
                height={DOOR_H}
                fill="var(--paper-sunk)"
              />
              <rect
                x={DOOR_X - DOOR_W / 2}
                y={FLOOR - DOOR_H}
                width={DOOR_W}
                height={DOOR_H}
                fill="url(#una-brick)"
                stroke="var(--imagine)"
                strokeWidth="1.2"
              />
            </>
          )}
          {last !== null && last !== "gone" && (
            <>
              <rect
                x={shownDoorX - DOOR_W / 2}
                y={FLOOR - DOOR_H}
                width={DOOR_W}
                height={DOOR_H}
                fill="none"
                stroke="var(--imagine)"
                strokeWidth="2"
              />
              <circle cx={shownDoorX + DOOR_W / 2 - 8} cy={FLOOR - DOOR_H / 2} r="2.5" fill="var(--imagine)" />
            </>
          )}

          <text x={wallX0} y={FLOOR + 30} className="font-mono" fontSize={fs} fill="var(--ink-muted)">
            {caption}
          </text>

          {/* the tally: the only place "usually" is visible */}
          <text x={tallyX} y={tallyTop - 12} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-faint)">
            {T.tally}
          </text>
          {Array.from({ length: MAX_RUNS }, (_, k) => {
            const i = k + 1;
            const x = tallyX + (k % perRow) * PITCH;
            const y = tallyTop + Math.floor(k / perRow) * PITCH;
            if (i > runs) {
              return <circle key={i} cx={x + 6} cy={y + 6} r="1.4" fill="var(--rule)" />;
            }
            return outcomeOf(i, hold) === "held" ? (
              <polyline
                key={i}
                points={`${x + 1},${y + 6} ${x + 4.5},${y + 10} ${x + 11},${y + 1}`}
                fill="none"
                stroke="var(--actual)"
                strokeWidth="1.8"
              />
            ) : (
              <path
                key={i}
                d={`M ${x + 1} ${y + 1} L ${x + 11} ${y + 11} M ${x + 11} ${y + 1} L ${x + 1} ${y + 11}`}
                fill="none"
                stroke="var(--imagine)"
                strokeWidth="1.8"
              />
            );
          })}
        </svg>
      </div>

      <div
        data-print-hide
        className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="label">{T.holdLabel}</span>
          <div className="flex flex-wrap gap-px" role="group" aria-label={T.holdLabel}>
            {(["learned", "engine"] as const).map((h) => (
              <button
                key={h}
                type="button"
                aria-pressed={hold === h}
                onClick={() => flip(h)}
                className={`label h-9 border px-5 transition-colors ${
                  hold === h
                    ? "border-imagine bg-imagine !text-paper"
                    : "border-rule-strong bg-paper !text-ink hover:border-ink"
                }`}
              >
                {h === "learned" ? T.learned : T.engine}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={goOne}
            disabled={runs >= MAX_RUNS}
            className="h-9 border border-rule-strong bg-paper px-4 transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rule-strong"
          >
            <span className="label whitespace-nowrap !text-ink">{T.goOne}</span>
          </button>
          <button
            type="button"
            onClick={goMany}
            disabled={runs >= MAX_RUNS}
            className="h-9 border border-rule-strong bg-paper px-4 transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rule-strong"
          >
            <span className="label whitespace-nowrap !text-ink">{T.goMany}</span>
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={runs === 0}
            className="h-9 border border-rule-strong bg-paper px-4 transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rule-strong"
          >
            <span className="label whitespace-nowrap !text-ink">{T.reset}</span>
          </button>
        </div>

        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.rRuns, String(runs)],
          [T.rHeld, T.ofN(held, runs)],
          [T.rGuarantee, hold === "learned" ? T.guarNo : T.guarYes],
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
