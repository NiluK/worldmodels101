"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * A run of actions nobody has taken.
 *
 * One real state goes in, drawn slate and drawn once. Everything after it is
 * the model reading its own output back in, so every state on the road after
 * the first is vermilion. The dashed pair of lines into and out of the model
 * box shows which state is being fed in at the moment: slate for the first
 * step, vermilion for every step after it. Keep pins a finished chain so a
 * second plan can be written beside a first one.
 *
 * The dynamics are a toy: fixed deltas per action, one second per step. The
 * point is the wiring, not the physics.
 */

type Action = "coast" | "brake" | "pressOn";

const ORDER: Action[] = ["coast", "brake", "pressOn"];
const DELTA: Record<Action, number> = { coast: -2, brake: -12, pressOn: 8 };
const MAX_H = 8;
const V0 = 50; // km/h at the start
const SPAN = 200; // metres drawn on the road
const STEP_MS = 120;

const DEFAULT_PLAN: Action[] = [
  "coast",
  "brake",
  "brake",
  "coast",
  "pressOn",
  "coast",
  "coast",
  "coast",
];

type State = { v: number; x: number };

function rollout(plan: Action[], h: number): State[] {
  const out: State[] = [];
  let v = V0;
  let x = 0;
  for (let i = 0; i < h; i++) {
    v = Math.max(0, v + DELTA[plan[i]]);
    x += v / 3.6;
    out.push({ v, x });
  }
  return out;
}

function layout(compact: boolean) {
  const fs = compact ? 17 : 10.5;
  const W = compact ? 560 : 900;
  const H = compact ? 300 : 224;
  const x0 = compact ? 40 : 60;
  const x1 = W - (compact ? 30 : 40);
  const road = compact ? 208 : 168;
  const box = {
    x: compact ? 170 : 340,
    w: compact ? 220 : 220,
    y: compact ? 44 : 34,
    h: compact ? 54 : 50,
  };
  const ghost = compact ? 132 : 120;
  return { fs, W, H, x0, x1, road, box, ghost };
}

type Strings = {
  actions: Record<Action, string>;
  step: (n: number, a: string) => string;
  beyond: (n: number) => string;
  horizon: string;
  run: string;
  reset: string;
  keep: string;
  pinned: string;
  model: string;
  realIn: string;
  readsBack: string;
  metres: string;
  given: string;
  made: string;
  distance: string;
  endSpeed: string;
  m: (n: number) => string;
  kmh: (n: number) => string;
  v0: string;
  v1: (h: number) => string;
  v2: string;
  v3: string;
  aria: (h: number, made: number, d: number) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    actions: { coast: "coast", brake: "brake", pressOn: "press on" },
    step: (n, a) => `step ${n}, ${a}, press to change it`,
    beyond: (n) => `step ${n}, past the horizon`,
    horizon: "horizon",
    run: "Run",
    reset: "Reset",
    keep: "Keep",
    pinned: "pinned run",
    model: "model",
    realIn: "one real state in, 50 km/h",
    readsBack: "reads its own answer back in",
    metres: "metres",
    given: "states you were given",
    made: "states the model made",
    distance: "distance covered",
    endSpeed: "speed at the end",
    m: (n) => `${n} m`,
    kmh: (n) => `${n} km/h`,
    v0: "Nobody has taken this run. Press Run.",
    v1: (h) =>
      `One real state in, ${h} imagined ones out. Every step after the first read the step before it.`,
    v2: "Two runs, neither of them taken. The model answered both from the same starting state.",
    v3: "The longer the run, the more of it is the model reading its own handwriting.",
    aria: (h, made, d) =>
      `An illustrative braking car on a road in metres. The plan is ${h} steps long; the model has produced ${made} imagined states, reaching ${d} metres.`,
  },
  zh: {
    actions: { coast: "滑行", brake: "刹车", pressOn: "继续加速" },
    step: (n, a) => `第 ${n} 步，${a}，按一下可以改`,
    beyond: (n) => `第 ${n} 步，在视野之外`,
    horizon: "视野",
    run: "跑一遍",
    reset: "重来",
    keep: "留下",
    pinned: "钉住的一次",
    model: "模型",
    realIn: "一个真实状态进去，50 公里每小时",
    readsBack: "把自己的答案读回去",
    metres: "米",
    given: "别人给它的状态",
    made: "模型自己造出的状态",
    distance: "走过的距离",
    endSpeed: "末了的速度",
    m: (n) => `${n} 米`,
    kmh: (n) => `${n} 公里每小时`,
    v0: "这一串没有人跑过。按「跑一遍」。",
    v1: (h) => `一个真实状态进去，${h} 个想象出来的出来。第一步之后的每一步，读的都是上一步。`,
    v2: "两次运行，哪一次都没有人跑过。模型是从同一个起点回答这两次的。",
    v3: "跑得越长，其中就有越多是模型在读自己的字迹。",
    aria: (h, made, d) =>
      `一辆示意性的刹车中的车，走在以米为刻度的路上。这串动作有 ${h} 步；模型已经造出 ${made} 个想象的状态，走到 ${d} 米。`,
  },
};

export function UntakenRollout() {
  const [plan, setPlan] = useState<Action[]>(DEFAULT_PLAN);
  const [h, setH] = useState(5);
  const [ran, setRan] = useState(false);
  const [shown, setShown] = useState(0);
  const [ghost, setGhost] = useState<State[] | null>(null);
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const L = layout(compact);
  const fs = L.fs;

  const states = useMemo(() => rollout(plan, h), [plan, h]);

  /**
   * The whole run is decided on the press; only how much of it is on screen
   * arrives over time, so a reader who never waits still sees the counters and
   * a reader with reduced motion sees the finished chain at once.
   */
  useEffect(() => {
    if (!ran || shown >= h) return;
    const id = window.setTimeout(() => setShown((n) => n + 1), STEP_MS);
    return () => window.clearTimeout(id);
  }, [ran, shown, h]);

  const clear = () => {
    setRan(false);
    setShown(0);
  };
  const setAction = (i: number, a: Action) => {
    setPlan((p) => p.map((x, j) => (j === i ? a : x)));
    clear();
  };
  const cycle = (i: number, dir: number) => {
    const at = (ORDER.indexOf(plan[i]) + dir + ORDER.length) % ORDER.length;
    setAction(i, ORDER[at]);
  };
  const onKey = (i: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      cycle(i, 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      cycle(i, -1);
    }
  };
  const press = () => {
    if (ran) {
      clear();
      return;
    }
    setRan(true);
    setShown(still ? h : 1);
  };

  const made = ran ? h : 0;
  const last = states[h - 1];
  const dist = ran ? Math.round(last.x) : 0;
  const speed = ran ? Math.round(last.v) : V0;

  const base = !ran ? T.v0 : ghost ? T.v2 : T.v1(h);
  const verdict = h === MAX_H ? `${base} ${T.v3}` : base;

  const xOf = (m: number) => L.x0 + (Math.min(m, SPAN) / SPAN) * (L.x1 - L.x0);
  const visible = states.slice(0, Math.min(shown, h));
  const feedFrom = visible.length > 1 ? xOf(visible[visible.length - 2].x) : L.x0;
  const feedReal = visible.length <= 1;
  const feedTo = visible.length > 0 ? xOf(visible[visible.length - 1].x) : null;
  const ticks = Array.from({ length: compact ? 3 : 5 }, (_, i) => i * (compact ? 100 : 50));
  const dash = still ? undefined : "opacity 200ms ease";

  return (
    <div>
      <div ref={ref} className="px-4 pt-5 md:px-8">
        <svg
          viewBox={`0 0 ${L.W} ${L.H}`}
          className="block w-full"
          role="img"
          aria-label={T.aria(h, made, dist)}
        >
          {/* the model, and the loop that makes a rollout a rollout */}
          <rect
            x={L.box.x}
            y={L.box.y}
            width={L.box.w}
            height={L.box.h}
            fill="var(--paper)"
            stroke="var(--ink)"
            strokeWidth="1.4"
          />
          <text
            x={L.box.x + L.box.w / 2}
            y={L.box.y + L.box.h / 2 + fs * 0.4}
            textAnchor="middle"
            className="font-mono"
            fontSize={fs * 1.2}
            letterSpacing="1"
            fill="var(--ink)"
          >
            {T.model}
          </text>
          <path
            d={`M ${L.box.x + L.box.w} ${L.box.y} C ${L.box.x + L.box.w} ${L.box.y - 34}, ${L.box.x} ${L.box.y - 34}, ${L.box.x} ${L.box.y}`}
            fill="none"
            stroke="var(--imagine)"
            strokeWidth="1.4"
          />
          <path
            d={`M ${L.box.x - 4} ${L.box.y - 8} L ${L.box.x} ${L.box.y} L ${L.box.x + 5} ${L.box.y - 7}`}
            fill="none"
            stroke="var(--imagine)"
            strokeWidth="1.4"
          />
          {!compact && (
            <text
              x={L.box.x + L.box.w + 14}
              y={L.box.y + L.box.h / 2 + fs * 0.4}
              className="font-mono"
              fontSize={fs}
              letterSpacing="1"
              fill="var(--imagine)"
            >
              {T.readsBack}
            </text>
          )}

          {/* which state is going in right now */}
          {feedTo !== null && (
            <g style={{ transition: dash }}>
              <line
                x1={feedFrom}
                y1={L.road}
                x2={L.box.x + 18}
                y2={L.box.y + L.box.h}
                stroke={feedReal ? "var(--actual)" : "var(--imagine)"}
                strokeWidth="1.2"
                strokeDasharray="3 4"
              />
              <line
                x1={L.box.x + L.box.w - 18}
                y1={L.box.y + L.box.h}
                x2={feedTo}
                y2={L.road}
                stroke="var(--imagine)"
                strokeWidth="1.2"
                strokeDasharray="3 4"
              />
            </g>
          )}

          {/* the pinned run */}
          {ghost && (
            <g opacity="0.5">
              <line
                x1={L.x0}
                y1={L.ghost}
                x2={xOf(ghost[ghost.length - 1].x)}
                y2={L.ghost}
                stroke="var(--imagine)"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
              {ghost.map((s, i) => (
                <circle key={i} cx={xOf(s.x)} cy={L.ghost} r="3" fill="var(--imagine)" />
              ))}
              <text
                x={L.x0}
                y={L.ghost - fs * 1.1}
                className="font-mono"
                fontSize={fs}
                letterSpacing="1"
                fill="var(--imagine)"
              >
                {T.pinned}
              </text>
            </g>
          )}

          {/* the road */}
          <line
            x1={L.x0}
            y1={L.road}
            x2={L.x1}
            y2={L.road}
            stroke="var(--rule-strong)"
            strokeWidth="1"
          />
          {ticks.map((m) => (
            <g key={m}>
              <line
                x1={xOf(m)}
                y1={L.road}
                x2={xOf(m)}
                y2={L.road + 7}
                stroke="var(--rule-strong)"
                strokeWidth="1"
              />
              <text
                x={xOf(m)}
                y={L.road + fs * 4.2}
                textAnchor="middle"
                className="font-mono tnum"
                fontSize={fs}
                fill="var(--ink-faint)"
              >
                {m}
              </text>
            </g>
          ))}
          <text
            x={L.x1}
            y={L.road + fs * 2.4}
            textAnchor="end"
            className="font-mono"
            fontSize={fs}
            letterSpacing="1"
            fill="var(--ink-faint)"
          >
            {T.metres}
          </text>

          {/* and everything the model made up */}
          {visible.map((s, i) => {
            const px = i === 0 ? L.x0 : xOf(visible[i - 1].x);
            return (
              <g key={i}>
                <line
                  x1={px}
                  y1={L.road}
                  x2={xOf(s.x)}
                  y2={L.road}
                  stroke="var(--imagine)"
                  strokeWidth="2.4"
                />
                <circle cx={xOf(s.x)} cy={L.road} r="5" fill="var(--imagine)" />
                {!compact && (
                  <text
                    x={xOf(s.x)}
                    y={L.road + fs * 2.4}
                    textAnchor="middle"
                    className="font-mono tnum"
                    fontSize={fs}
                    fill="var(--imagine)"
                  >
                    {Math.round(s.v)}
                  </text>
                )}
              </g>
            );
          })}
          {/* the one thing here that really happened */}
          <circle cx={L.x0} cy={L.road} r="6" fill="var(--actual)" />
          <text
            x={L.x0}
            y={L.road - fs * 3.4}
            className="font-mono"
            fontSize={fs}
            letterSpacing="1"
            fill="var(--actual)"
          >
            {T.realIn}
          </text>
        </svg>
      </div>

      <div
        data-print-hide
        className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-rule px-5 py-4 md:px-8"
      >
        <div className="grid basis-full grid-cols-4 gap-2 md:grid-cols-8">
          {plan.map((a, i) => {
            const live = i < h;
            return (
              <button
                key={i}
                type="button"
                disabled={!live}
                onClick={() => cycle(i, 1)}
                onKeyDown={onKey(i)}
                aria-label={live ? T.step(i + 1, T.actions[a]) : T.beyond(i + 1)}
                className={`label h-9 whitespace-nowrap border px-1 transition-colors ${
                  live
                    ? "border-rule-strong bg-paper !text-ink hover:border-ink"
                    : "border-dashed border-rule bg-paper !text-ink-faint"
                }`}
              >
                {live ? T.actions[a] : ""}
              </button>
            );
          })}
        </div>

        <label className="flex min-w-full flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[16rem]">
          <span className="label whitespace-nowrap">{T.horizon}</span>
          <input
            type="range"
            min={1}
            max={MAX_H}
            value={h}
            onChange={(e) => {
              setH(Number(e.target.value));
              clear();
            }}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-8 text-right !text-ink">{h}</span>
        </label>

        <button
          type="button"
          onClick={press}
          className="label h-9 border border-imagine bg-imagine px-4 !text-paper transition-colors"
        >
          {ran ? T.reset : T.run}
        </button>
        <button
          type="button"
          onClick={() => setGhost(states.slice(0, h))}
          disabled={!ran}
          className="label h-9 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-50"
        >
          {T.keep}
        </button>

        <p
          className="label basis-full !normal-case !tracking-normal !text-[0.8rem]"
          aria-live="polite"
        >
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-rule bg-rule sm:grid-cols-4">
        {[
          [T.given, "1"],
          [T.made, String(made)],
          [T.distance, T.m(dist)],
          [T.endSpeed, T.kmh(speed)],
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
