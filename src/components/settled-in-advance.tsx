"use client";

import { useReducedMotion } from "motion/react";
import { useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * Twenty situations down one road, and the one choice none of the systems
 * escapes: how much of the answer was settled before the road was seen.
 *
 * Settle nothing and every situation is worked out on the spot, which is
 * correct everywhere and expensive everywhere. Settle the lot and the answers
 * come back instantly, including at the two places where the road stops being
 * ordinary, where what comes back was prepared for a different question. The
 * middle setting is the one that reads the road first.
 *
 * The twenty situations, the two odd ones and the thinking units are all
 * invented. The shape of the trade is not.
 */

type Setting = "nothing" | "some" | "most";

const N = 20;
const ODD = [6, 14]; // the seventh and the fifteenth
const THINK_COST = 12;
const SETTINGS: Setting[] = ["nothing", "some", "most"];

function outcome(i: number, s: Setting) {
  const odd = ODD.includes(i);
  if (s === "nothing") return { thought: true, units: THINK_COST, wrong: false };
  if (s === "most") return { thought: false, units: 0, wrong: odd };
  return { thought: odd, units: odd ? THINK_COST : 0, wrong: false };
}

function layout(compact: boolean) {
  const fs = compact ? 17 : 13;
  const W = compact ? 560 : 900;
  const H = compact ? 252 : 112;
  const x0 = compact ? 46 : 44;
  const per = compact ? 10 : N;
  const dx = ((compact ? 514 : 856) - x0 - 14) / (per - 1);
  const lane = compact ? 84 : 68;
  const lane2 = 200;
  return { fs, W, H, x0, dx, per, lane, lane2 };
}

type Strings = {
  road: string;
  control: string;
  settings: Record<Setting, string>;
  captions: Record<Setting, string>;
  drive: string;
  driveEnd: string;
  again: string;
  odd: string;
  onTheSpot: string;
  units: string;
  wrongLabel: string;
  settledLabel: string;
  vNothing: (u: number) => string;
  vMost: string;
  vSome: (u: number) => string;
  vMid: (k: number) => string;
  aria: (k: number, s: string, u: number, w: number) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    road: "twenty situations down one road",
    control: "how much was settled in advance",
    settings: { nothing: "nothing", some: "some", most: "most" },
    captions: {
      nothing: "search every step, as MuZero does",
      some: "a bit of both, as Dyna does",
      most: "act on reflex, as Dreamer does",
    },
    drive: "Drive",
    driveEnd: "Drive to the end",
    again: "Start again",
    odd: "not like the others",
    onTheSpot: "worked out on the spot",
    units: "thinking units spent",
    wrongLabel: "handled wrongly",
    settledLabel: "settled in advance",
    vNothing: (u) =>
      `It thought at all twenty and got all twenty right. That is ${u} units for a road that was mostly ordinary.`,
    vMost:
      "Eighteen instant answers and two prepared for a different question. Nothing in there knew it was guessing.",
    vSome: (u) =>
      `It only stopped to think at the two that were not ordinary. ${u} units, nothing wrong.`,
    vMid: (k) => `${k} of twenty. Press Drive.`,
    aria: (k, s, u, w) =>
      `An illustrative road of twenty situations, two of them not like the others. Settled in advance: ${s}. ${k} of twenty driven, ${u} thinking units spent, ${w} handled wrongly.`,
  },
  zh: {
    road: "一条路上的二十个情形",
    control: "有多少是提前定好的",
    settings: { nothing: "不提前定", some: "定一部分", most: "大部分提前定" },
    captions: {
      nothing: "每一步都搜索，像 MuZero 那样",
      some: "两边各来一点，像 Dyna 那样",
      most: "靠反射行动，像 Dreamer 那样",
    },
    drive: "开",
    driveEnd: "一直开到底",
    again: "重新开",
    odd: "跟别的不一样",
    onTheSpot: "当场现算的情形",
    units: "花掉的思考单位",
    wrongLabel: "处理错了的",
    settledLabel: "提前定好的程度",
    vNothing: (u) => `二十个它都想过，二十个都对。为一条大体上很普通的路，花了 ${u} 个单位。`,
    vMost: "十八个当场就答上了，另外两个拿到的是为别的问题准备的答案。这里面没有任何东西知道自己在猜。",
    vSome: (u) => `它只在那两个不普通的地方停下来想过。${u} 个单位，没有一个处理错。`,
    vMid: (k) => `二十个里走了 ${k} 个。按「开」。`,
    aria: (k, s, u, w) =>
      `一条示意性的路，上面有二十个情形，其中两个跟别的不一样。提前定好的程度：${s}。二十个里已走过 ${k} 个，花掉 ${u} 个思考单位，${w} 个处理错了。`,
  },
};

export function SettledInAdvance() {
  const [setting, setSetting] = useState<Setting>("nothing");
  const [k, setK] = useState(0);
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const L = layout(compact);
  const fs = L.fs;

  const choose = (s: Setting) => {
    setSetting(s);
    setK(0);
  };

  const done = Array.from({ length: k }, (_, i) => outcome(i, setting));
  const spot = done.filter((d) => d.thought).length;
  const units = done.reduce((a, d) => a + d.units, 0);
  const wrong = done.filter((d) => d.wrong).length;

  const verdict =
    k < N
      ? T.vMid(k)
      : setting === "nothing"
        ? T.vNothing(units)
        : setting === "most"
          ? T.vMost
          : T.vSome(units);

  const slot = (i: number) => {
    const c = compact ? i % L.per : i;
    const y = compact && i >= L.per ? L.lane2 : L.lane;
    return { x: L.x0 + c * L.dx, y };
  };
  const rows = compact ? [L.lane, L.lane2] : [L.lane];
  const fade = still ? undefined : "opacity 200ms ease, fill 200ms ease";
  const car = slot(Math.min(k, N - 1));

  return (
    <div>
      <div ref={ref} className="px-4 pt-5 md:px-8">
        <svg
          viewBox={`0 0 ${L.W} ${L.H}`}
          className="block w-full"
          role="img"
          aria-label={T.aria(k, T.settings[setting], units, wrong)}
        >
          <text
            x={L.x0 - 14}
            y={fs * 1.5}
            className="font-mono"
            fontSize={fs}
            letterSpacing="1"
            fill="var(--ink-muted)"
          >
            {T.road}
          </text>

          {rows.map((y) => (
            <line
              key={y}
              x1={L.x0 - 14}
              y1={y}
              x2={L.x0 + (L.per - 1) * L.dx + 14}
              y2={y}
              stroke="var(--rule-strong)"
              strokeWidth="1"
            />
          ))}

          {Array.from({ length: N }, (_, i) => {
            const p = slot(i);
            const odd = ODD.includes(i);
            const seen = i < k;
            const o = outcome(i, setting);
            return (
              <g key={i} style={{ transition: fade }}>
                {!seen && !odd && (
                  <line
                    x1={p.x}
                    y1={p.y - 5}
                    x2={p.x}
                    y2={p.y + 5}
                    stroke="var(--rule-strong)"
                    strokeWidth="1.4"
                  />
                )}
                {!seen && odd && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="6"
                    fill="var(--paper-raised)"
                    stroke="var(--ink-muted)"
                    strokeWidth="1.4"
                  />
                )}
                {seen && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={o.wrong ? 7.5 : 5.5}
                    fill={o.wrong ? "none" : o.thought ? "var(--imagine)" : "var(--actual)"}
                    stroke={o.wrong ? "var(--imagine)" : "none"}
                    strokeWidth={o.wrong ? 2.6 : 0}
                  />
                )}
                {seen && odd && (
                  <text
                    x={p.x}
                    y={p.y + fs * 2.2}
                    textAnchor="middle"
                    className="font-mono"
                    fontSize={fs * 0.92}
                    fill="var(--ink-muted)"
                  >
                    {T.odd}
                  </text>
                )}
              </g>
            );
          })}

          {/* the car, the only thing that moves */}
          <path
            d={`M ${car.x - 7} ${car.y - 26} L ${car.x + 7} ${car.y - 26} L ${car.x} ${car.y - 14} Z`}
            fill="var(--actual)"
          />
        </svg>
      </div>

      <div
        data-print-hide
        className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-4 border-t border-rule px-5 py-4 md:px-8"
      >
        <div className="basis-full">
          <p className="label mb-2">{T.control}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {SETTINGS.map((s) => (
              <div key={s}>
                <button
                  type="button"
                  aria-pressed={setting === s}
                  onClick={() => choose(s)}
                  className={`label h-9 w-full border px-5 transition-colors ${
                    setting === s
                      ? "border-imagine bg-imagine !text-paper"
                      : "border-rule-strong bg-paper !text-ink hover:border-ink"
                  }`}
                >
                  {T.settings[s]}
                </button>
                <p className="label mt-1 !normal-case !tracking-normal !text-[0.72rem]">
                  {T.captions[s]}
                </p>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setK((v) => Math.min(N, v + 1))}
          disabled={k >= N}
          className="label h-9 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-50"
        >
          {T.drive}
        </button>
        <button
          type="button"
          onClick={() => setK(N)}
          disabled={k >= N}
          className="label h-9 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-50"
        >
          {T.driveEnd}
        </button>
        <button
          type="button"
          onClick={() => setK(0)}
          disabled={k === 0}
          className="label h-9 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-50"
        >
          {T.again}
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
          [T.onTheSpot, String(spot)],
          [T.units, String(units)],
          [T.wrongLabel, String(wrong)],
          [T.settledLabel, T.settings[setting]],
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
