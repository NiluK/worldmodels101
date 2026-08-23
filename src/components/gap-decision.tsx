"use client";

import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText } from "@/lib/locale-text";

/**
 * The junction. Chapter 2's opening figure.
 *
 * You are waiting to turn right and a car is coming from the right. The forecast
 * is the model: it says when that car reaches the crossing, and you commit on
 * the forecast before anything has happened. An experienced driver forecasts
 * from the true speed. A learner reads the speed low, by a third here, and so
 * believes there is more time than there is. Press Go and the scene plays at
 * the true speed, whatever the forecast said.
 *
 * All numbers are illustrative: metres, km/h and seconds, one decimal.
 */

/** seconds from the stop line to being clear of the oncoming lane */
const CROSS_S = 3.0;
/** the margin the decision rule wants on top of that */
const MARGIN_S = 0.5;
/** the learner reads the oncoming speed as this fraction of the truth */
const LEARNER_FACTOR = 2 / 3;
/** metres the oncoming car must travel past the crossing before you go behind it */
const PASS_M = 16;

const D_MIN = 20;
const D_MAX = 120;
const V_MIN = 30;
const V_MAX = 80;
const D_DEFAULT = 40;
const V_DEFAULT = 60;

/** drawing */
const H = 250;
const ROAD_TOP = 60;
const ROAD_BOT = 140;
const CENTRE_Y = 100;
const NEAR_Y = 120;
const FAR_Y = 80;
const YOU_Y0 = 170;
const STOP_Y = 150;
/**
 * Horizontal layout. The narrow version uses a shorter viewBox so the cars
 * and type are not shrunk to nothing when the column is 300 px wide; the
 * metres-per-pixel scale changes with it, the seconds do not.
 */
type Geo = { W: number; SIDE_L: number; SIDE_R: number; YOU_X: number; JX: number; SCALE: number };
const GEO_WIDE: Geo = { W: 820, SIDE_L: 150, SIDE_R: 230, YOU_X: 190, JX: 204, SCALE: 4.8 };
const GEO_COMPACT: Geo = { W: 560, SIDE_L: 100, SIDE_R: 180, YOU_X: 140, JX: 154, SCALE: 2.8 };
const CAR_L = 36;
const CAR_W = 20;
const TURN_R = 40;
/** your path: straight up, a quarter turn to the right, then along the far lane */
const S1 = YOU_Y0 - NEAR_Y;
// (JX sits just right of your lane in both layouts, so the turn geometry is the same)
const S2 = (Math.PI / 2) * TURN_R;
/** path length at which your tail is out of the oncoming lane (checked below) */
const L_CLEAR = 96;

type Who = "learner" | "experienced";
type Outcome = "clear" | "hit" | "waited";
type Stage = "ready" | "playing" | "done";

type Text = {
  distance: string;
  speed: string;
  whose: string;
  learner: string;
  experienced: string;
  go: string;
  reset: string;
  forecast: (arr: string, need: string, spare: string, go: boolean) => string;
  pressSee: string;
  press: (go: boolean) => string;
  clear: (x: string) => string;
  hit: (x: string, y: string) => string;
  waited: (x: string) => string;
  better: string;
  cForecast: string;
  cReal: string;
  cOff: string;
  cOutcome: string;
  sec: (n: string) => string;
  spotOn: (n: string) => string;
  generous: (n: string) => string;
  outClear: string;
  outHit: string;
  outWaited: string;
  pending: string;
  afterGo: string;
  you: string;
  oncoming: string;
  crossing: string;
  aria: (d: number, v: number, who: string, go: boolean, stage: Stage, outcome: Outcome) => string;
};

const TEXT: Record<string, Text> = {
  en: {
    distance: "How far away it is",
    speed: "How fast it is going",
    whose: "Whose forecast",
    learner: "a learner",
    experienced: "an experienced driver",
    go: "Go",
    reset: "Reset",
    forecast: (arr, need, spare, go) =>
      `Forecast: it arrives in ${arr} s. You need ${need} s, with ${spare} s spare. ${go ? "Go" : "Wait"}.`,
    pressSee: "The forecast says go. Press Go and see.",
    press: (go) => `The forecast says ${go ? "go" : "wait"}. Press Go.`,
    clear: (x) => `Clear by ${x} s. The forecast was close enough.`,
    hit: (x, y) =>
      `It arrived ${x} s before you were across. The forecast was wrong by ${y} s, and the wrong part was the speed.`,
    waited: (x) => `You waited. It passed in ${x} s and you crossed behind it.`,
    better: "A better model, same junction.",
    cForecast: "Forecast arrival",
    cReal: "Real arrival",
    cOff: "Forecast was off by",
    cOutcome: "Outcome",
    sec: (n) => `${n} s`,
    spotOn: (n) => `${n} s, spot on`,
    generous: (n) => `${n} s too generous`,
    outClear: "clear",
    outHit: "hit",
    outWaited: "waited",
    pending: "not yet",
    afterGo: "after Go",
    you: "you",
    oncoming: "oncoming",
    crossing: "crossing",
    aria: (d, v, who, go, stage, outcome) =>
      `Illustrative top-down view of a T-junction. Your car waits on the side road. A car ${d} m away at ${v} km/h approaches along the main road from the right. The forecast of ${who} says ${go ? "go" : "wait"}. ${
        stage === "ready"
          ? "Nothing has happened yet."
          : stage === "playing"
            ? "The scene is playing at the true speed."
            : outcome === "clear"
              ? "You crossed and were clear before it arrived."
              : outcome === "hit"
                ? "It arrived before you were across and the cars met at the crossing."
                : "You waited, it passed, and you crossed behind it."
      }`,
  },
};

/** Everything the figure needs to know, from the three controls. */
function analyse(dM: number, vKmh: number, who: Who) {
  const v = vKmh / 3.6;
  const tTrue = dM / v;
  const tForecast = who === "learner" ? dM / (v * LEARNER_FACTOR) : tTrue;
  const goes = tForecast >= CROSS_S + MARGIN_S - 1e-9;
  const tPass = tTrue + PASS_M / v;
  const outcome: Outcome = !goes ? "waited" : tTrue >= CROSS_S ? "clear" : "hit";
  const tEnd =
    outcome === "hit"
      ? tTrue + 0.7
      : outcome === "clear"
        ? Math.min(tTrue + 0.8, CROSS_S + 2.0)
        : tPass + CROSS_S + 0.6;
  return { v, tTrue, tForecast, goes, tPass, outcome, tEnd, rate: Math.max(1, tEnd / 7) };
}

/** how far along your path you are, t seconds after you set off */
function progress(t: number) {
  if (t <= 0) return 0;
  if (t <= CROSS_S) return L_CLEAR * (t / CROSS_S) ** 2;
  return L_CLEAR + ((2 * L_CLEAR) / CROSS_S) * (t - CROSS_S);
}

/** position and heading (degrees, 0 = facing right) at path length s */
function placeYou(s: number, youX: number): { x: number; y: number; a: number } {
  if (s <= S1) return { x: youX, y: YOU_Y0 - s, a: -90 };
  if (s <= S1 + S2) {
    const th = (s - S1) / TURN_R;
    return {
      x: youX + TURN_R - TURN_R * Math.cos(th),
      y: NEAR_Y - TURN_R * Math.sin(th),
      a: -90 + (th * 180) / Math.PI,
    };
  }
  return { x: youX + TURN_R + (s - S1 - S2), y: FAR_Y, a: 0 };
}

const f1 = (n: number) => (Math.abs(n) < 0.05 ? 0 : n).toFixed(1);

function Car({ x, y, a, fill }: { x: number; y: number; a: number; fill: string }) {
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)})`}>
      <rect x={-CAR_L / 2} y={-CAR_W / 2} width={CAR_L} height={CAR_W} rx="3"
        fill={fill} stroke="var(--paper)" strokeWidth="1" />
      <rect x="4" y={-CAR_W / 2 + 2.5} width="5.5" height={CAR_W - 5} rx="1" fill="var(--paper)" opacity="0.55" />
      <rect x="-12" y={-CAR_W / 2 + 3} width="4" height={CAR_W - 6} rx="1" fill="var(--paper)" opacity="0.4" />
    </g>
  );
}

export function GapDecision() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const { ref, compact } = useCompact(560);
  const k = compact ? 1.45 : 1;
  const { W, SIDE_L, SIDE_R, YOU_X, JX, SCALE } = compact ? GEO_COMPACT : GEO_WIDE;
  const still = useReducedMotion();

  const [d, setD] = useState(D_DEFAULT);
  const [vKmh, setV] = useState(V_DEFAULT);
  const [who, setWho] = useState<Who>("learner");
  const [stage, setStage] = useState<Stage>("ready");
  const [tau, setTau] = useState(0);

  const rafRef = useRef(0);
  const timerRef = useRef(0);
  const playRef = useRef<{ start: number; tEnd: number; rate: number } | null>(null);

  const A = useMemo(() => analyse(d, vKmh, who), [d, vKmh, who]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    window.clearTimeout(timerRef.current);
    playRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stop();
    setStage("ready");
    setTau(0);
  }, [stop]);

  useEffect(() => stop, [stop]);

  const go = () => {
    stop();
    if (still) {
      setTau(A.tEnd);
      setStage("done");
      return;
    }
    setTau(0);
    setStage("playing");
    const play = { start: performance.now(), tEnd: A.tEnd, rate: A.rate };
    playRef.current = play;
    const finish = () => {
      if (playRef.current !== play) return;
      stop();
      setTau(play.tEnd);
      setStage("done");
    };
    const loop = (now: number) => {
      if (playRef.current !== play) return;
      const t = ((now - play.start) / 1000) * play.rate;
      if (t >= play.tEnd) {
        finish();
        return;
      }
      setTau(t);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    // rAF can be paused (background tab, some headless runs); the scene still has to finish
    timerRef.current = window.setTimeout(finish, (play.tEnd / play.rate) * 1000 + 80);
  };

  const onD = (n: number) => { reset(); setD(n); };
  const onV = (n: number) => { reset(); setV(n); };
  const onWho = (w: Who) => { reset(); setWho(w); };

  /* ---- the scene at time tau ---- */
  const t = Math.min(tau, A.tEnd);
  const { tTrue, tForecast, tPass, outcome, goes, v } = A;
  const tOther = outcome === "hit" ? Math.min(t, tTrue) : t;
  const otherFront = JX + (d - v * tOther) * SCALE;
  const sYou =
    outcome === "waited" ? progress(t - tPass) : outcome === "hit" ? progress(Math.min(t, tTrue)) : progress(t);
  const you = placeYou(sYou, YOU_X);
  const showRing = stage !== "ready" && outcome === "hit" && t >= tTrue;
  const showTick = stage !== "ready" && outcome === "clear" && t >= CROSS_S;
  const done = stage === "done";

  const arrowLen = 0.9 * vKmh;
  const otherStartFront = JX + d * SCALE;

  /* ---- words ---- */
  const whoLabel = who === "learner" ? T.learner : T.experienced;
  const forecastLine = T.forecast(f1(tForecast), f1(CROSS_S), f1(MARGIN_S), goes);
  let verdict: string;
  if (!done) {
    verdict = who === "learner" && goes && outcome === "hit" ? T.pressSee : T.press(goes);
  } else {
    verdict =
      outcome === "clear"
        ? T.clear(f1(tTrue - CROSS_S))
        : outcome === "hit"
          ? T.hit(f1(CROSS_S - tTrue), f1(tForecast - tTrue))
          : T.waited(f1(tPass));
    if (who === "experienced") verdict += ` ${T.better}`;
  }
  const off = tForecast - tTrue;
  const offText = Math.abs(off) < 0.05 ? T.spotOn(f1(0)) : T.generous(f1(off));
  const outcomeText = outcome === "clear" ? T.outClear : outcome === "hit" ? T.outHit : T.outWaited;

  const fs = 11 * k;
  const fsNum = 12 * k;

  return (
    <div>
      <div ref={ref} className="px-4 pt-5 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={T.aria(d, vKmh, whoLabel, goes, stage, outcome)}>
          <defs>
            <marker id="gd-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0 0 L6 3 L0 6 Z" fill="var(--ink)" />
            </marker>
          </defs>

          {/* roads */}
          <rect x="0" y={ROAD_TOP} width={W} height={ROAD_BOT - ROAD_TOP} fill="var(--paper-sunk)" />
          <rect x={SIDE_L} y={ROAD_BOT - 1} width={SIDE_R - SIDE_L} height={H - ROAD_BOT + 1} fill="var(--paper-sunk)" />
          {/* kerbs */}
          <line x1="0" y1={ROAD_TOP} x2={W} y2={ROAD_TOP} stroke="var(--rule-strong)" strokeWidth="1.2" />
          <line x1="0" y1={ROAD_BOT} x2={SIDE_L} y2={ROAD_BOT} stroke="var(--rule-strong)" strokeWidth="1.2" />
          <line x1={SIDE_R} y1={ROAD_BOT} x2={W} y2={ROAD_BOT} stroke="var(--rule-strong)" strokeWidth="1.2" />
          <line x1={SIDE_L} y1={ROAD_BOT} x2={SIDE_L} y2={H} stroke="var(--rule-strong)" strokeWidth="1.2" />
          <line x1={SIDE_R} y1={ROAD_BOT} x2={SIDE_R} y2={H} stroke="var(--rule-strong)" strokeWidth="1.2" />
          {/* centre line of the main road */}
          <line x1="0" y1={CENTRE_Y} x2={W} y2={CENTRE_Y} stroke="var(--rule-strong)" strokeWidth="1"
            strokeDasharray="10 8" opacity="0.8" />
          {/* stop line */}
          <line x1={SIDE_L + 2} y1={STOP_Y} x2={SIDE_R - 2} y2={STOP_Y} stroke="var(--rule-strong)" strokeWidth="2" />

          {/* the crossing you need to clear */}
          <line x1={JX} y1={ROAD_TOP} x2={JX} y2={ROAD_BOT} stroke="var(--ink-muted)" strokeWidth="1.2"
            strokeDasharray="4 4" />
          {!compact && (
            <text x={JX + 5} y={ROAD_TOP - 7} className="font-mono" fontSize={fs} letterSpacing="1"
              fill="var(--ink-muted)">
              {T.crossing.toUpperCase()}
            </text>
          )}

          {/* clear: a soft tick where it would have mattered */}
          {showTick && (
            <g>
              <circle cx={JX} cy={NEAR_Y} r="13" fill="var(--actual-soft)" />
              <polyline points={`${JX - 6},${NEAR_Y} ${JX - 2},${NEAR_Y + 4} ${JX + 6},${NEAR_Y - 5}`}
                fill="none" stroke="var(--actual)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}

          {/* speed arrow, from the start position */}
          {stage === "ready" && (
            <g>
              <line x1={otherStartFront - 6} y1={NEAR_Y} x2={otherStartFront - 6 - arrowLen} y2={NEAR_Y}
                stroke="var(--ink)" strokeWidth="1.5" markerEnd="url(#gd-arrow)" />
              <text x={otherStartFront - 6 - arrowLen / 2} y={NEAR_Y - 15} textAnchor="middle"
                className="font-mono tnum" fontSize={fsNum} fill="var(--ink)">
                {`${vKmh} km/h`}
              </text>
            </g>
          )}
          <text x={otherStartFront + CAR_L} y={ROAD_BOT + 18} textAnchor="end" className="font-mono"
            fontSize={fs} letterSpacing="1" fill="var(--ink-muted)">
            {T.oncoming.toUpperCase()}
          </text>

          {/* the oncoming car, heading left along the near lane */}
          <Car x={otherFront + CAR_L / 2} y={NEAR_Y} a={180} fill="var(--ink)" />

          {/* you */}
          {you.x < W + CAR_L && <Car x={you.x} y={you.y} a={you.a} fill="var(--actual)" />}
          <text x={YOU_X} y={YOU_Y0 + CAR_L / 2 + 18} textAnchor="middle" className="font-mono"
            fontSize={fs} letterSpacing="1" fill="var(--ink-muted)">
            {T.you.toUpperCase()}
          </text>

          {/* hit: the ring */}
          {showRing && (
            <g>
              <circle cx={JX - 2} cy={NEAR_Y} r="20" fill="none" stroke="var(--imagine)" strokeWidth="3" />
              <circle cx={JX - 2} cy={NEAR_Y} r="29" fill="none" stroke="var(--imagine)" strokeWidth="1" opacity="0.55" />
            </g>
          )}
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-[min(22rem,100%)] flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          <span className={`label whitespace-nowrap ${compact ? "basis-full" : ""}`}>{T.distance}</span>
          <input
            type="range"
            min={D_MIN}
            max={D_MAX}
            step={1}
            value={d}
            onChange={(e) => {
              onD(Number(e.target.value));
            }}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-14 !normal-case text-right !text-ink">{d} m</span>
        </label>
        <label className="flex min-w-[min(22rem,100%)] flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          <span className={`label whitespace-nowrap ${compact ? "basis-full" : ""}`}>{T.speed}</span>
          <input
            type="range"
            min={V_MIN}
            max={V_MAX}
            step={1}
            value={vKmh}
            onChange={(e) => {
              onV(Number(e.target.value));
            }}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-[4.5rem] !normal-case text-right !text-ink">{vKmh} km/h</span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <span className="label">{T.whose}</span>
          <div role="group" aria-label={T.whose} className="flex">
            {(["learner", "experienced"] as Who[]).map((w) => {
              const active = who === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => onWho(w)}
                  aria-pressed={active}
                  className={`label border px-5 py-2 transition-colors ${
                    active
                      ? "border-imagine bg-imagine !text-paper"
                      : "border-rule-strong bg-paper !text-ink hover:border-ink"
                  } ${w === "experienced" ? "-ml-px" : ""}`}
                >
                  {w === "learner" ? T.learner : T.experienced}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={go}
            disabled={stage === "playing"}
            className="label border border-ink bg-ink px-5 py-2 !text-paper transition-colors hover:border-imagine hover:bg-imagine disabled:cursor-default disabled:opacity-60"
          >
            {T.go}
          </button>
          <button
            type="button"
            onClick={reset}
            className="label border border-rule-strong bg-paper px-4 py-1.5 !text-ink transition-colors hover:border-ink"
          >
            {T.reset}
          </button>
        </div>

        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem] !text-ink">{forecastLine}</p>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-rule bg-rule sm:grid-cols-4">
        {[
          [T.cForecast, T.sec(f1(tForecast))],
          [T.cReal, done ? T.sec(f1(tTrue)) : T.afterGo],
          [T.cOff, done ? offText : T.afterGo],
          [T.cOutcome, done ? outcomeText : T.pending],
        ].map(([key, val]) => (
          <div key={key} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{key}</p>
            <p className={`tnum mt-1 text-[0.98rem] ${done && outcome === "hit" && key === T.cOutcome ? "text-imagine" : "text-ink"}`}>
              {val}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
