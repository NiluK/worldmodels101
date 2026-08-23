"use client";

import { useEffect, useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * The five failures, laid out before the chapter starts.
 *
 * Five cards in the chapter's order, and under them a thin strip of years with
 * one lane per failure. Click a card and the strip fills its dot; the readouts
 * say who ran into it first and when somebody first measured it. Nothing here
 * is illustrative: every name and date is from the chapter text, and the one
 * failure nobody measured is shown as exactly that.
 */

type Id = "persistence" | "action" | "horizon" | "target" | "verification";

const ORDER: Id[] = ["persistence", "action", "horizon", "target", "verification"];

/** years in which the chapter's sources first measured each failure */
const YEARS: Record<Id, number[]> = {
  persistence: [2026],
  action: [2024, 2026],
  horizon: [2019],
  target: [],
  verification: [2022],
};
const Y0 = 2019;
const Y1 = 2026;
const ALL_YEARS = Array.from({ length: Y1 - Y0 + 1 }, (_, i) => Y0 + i);

type Strings = {
  name: Record<Id, string>;
  question: Record<Id, string>;
  who: Record<Id, string>;
  measured: Record<Id, string>;
  verdict: Record<Id | "none", string>;
  whoLabel: string;
  measuredLabel: string;
  pick: string;
  notMeasured: string;
  ariaStrip: string;
  ariaSelected: string;
  ariaNone: string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    name: {
      persistence: "Persistence",
      action: "Action",
      horizon: "Horizon",
      target: "Target",
      verification: "Verification",
    },
    question: {
      persistence: "Does the same object remain itself after it leaves view and returns?",
      action: "Do different commands reliably cause the corresponding different futures?",
      horizon: "How far can it run on its own outputs before the answer stops supporting a decision?",
      target: "What information is the training target allowed to discard or collapse?",
      verification: "What observation could prove the claimed internal model is not there?",
    },
    who: {
      persistence:
        "The people making renderers. It is the failure everyone notices in a demo, and chapter 1's turn-around test was built for it.",
      action: "The people who needed what-if for a decision, meaning control and robotics.",
      horizon:
        "Reinforcement learning. An agent that trusts a bad model loses, and the loss shows up in the score.",
      target:
        "Representation learning, where an embedding can look stable while throwing away the variable the task needed.",
      verification: "Interpretability, the people reading the inside of networks.",
    },
    measured: {
      persistence: "2026, PlayWorld, which scores what happens to objects as they leave and re-enter view.",
      action:
        "2024, Kang and colleagues, testing physical laws inside and outside the training data. 2026, PlayWorld, scoring whether an action does what it should.",
      horizon:
        "2019, Wang and colleagues (Benchmarking Model-Based Reinforcement Learning) and Janner and colleagues (When to Trust Your Model).",
      target: "Not measured (in this chapter's sources).",
      verification:
        "2022, Li and colleagues (Emergent World Representations), with a probe that could have found nothing.",
    },
    verdict: {
      none: "Five failures, five communities. Read the dates from left to right.",
      persistence: "Measured seven years after horizon, and these are the two a renderer hits first.",
      action: "Measured seven years after horizon, and these are the two a renderer hits first.",
      horizon: "Measured first, by the people who had to act on the model's predictions.",
      target: "Nothing in this chapter's sources measures it.",
      verification: "Checked with a probe that could have drawn nothing, which is what makes it a test.",
    },
    whoLabel: "Who ran into it first",
    measuredLabel: "First measured",
    pick: "Click a card above.",
    notMeasured: "not measured",
    ariaStrip: "When each failure was first measured, 2019 to 2026.",
    ariaSelected: "Selected",
    ariaNone: "Nothing selected",
  },
};

export function FiveFailures() {
  const locale = useLocale();
  const s = pickText(TEXT, locale);
  const [sel, setSel] = useState<Id | null>(null);
  const { ref, compact } = useCompact(560);

  /**
   * The strip is drawn at 1 unit per CSS pixel, so its type stays 11px whether
   * the figure is 340 or 1100 wide. A fixed viewBox would shrink the lane
   * names to nothing in the narrow column.
   */
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(300, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  const fs = 11;
  const laneH = 30;
  const top = 4;
  const X0 = 14;
  const X1 = width - 32;
  const markX = width - 14;
  const axisY = top + ORDER.length * laneH + 4;
  const H = axisY + 26;
  const r = 4.5;
  const xOf = (y: number) => X0 + ((y - Y0) / (Y1 - Y0)) * (X1 - X0);
  const nameY = (i: number) => top + i * laneH + fs;
  const dotY = (i: number) => top + i * laneH + 22;

  const selYears = sel ? YEARS[sel] : [];
  const aria =
    s.ariaStrip +
    " " +
    ORDER.map((id) => `${s.name[id]}: ${YEARS[id].join(", ") || s.notMeasured}`).join("; ") +
    ". " +
    (sel ? `${s.ariaSelected}: ${s.name[sel]}.` : `${s.ariaNone}.`);

  return (
    <div>
      <div
        ref={ref}
        className={`grid gap-3 px-4 pt-5 md:px-8 ${compact ? "grid-cols-1" : "grid-cols-2 md:grid-cols-5"}`}
        onKeyDown={(e) => {
          if (e.key === "Escape") setSel(null);
        }}
      >
        {ORDER.map((id, i) => {
          const on = sel === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => setSel(id)}
              onFocus={() => setSel(id)}
              className={`block w-full border px-5 py-3 text-left transition-colors ${
                !compact && i === ORDER.length - 1 ? "col-span-2 md:col-span-1" : ""
              } ${on ? "border-imagine bg-imagine text-paper" : "border-rule-strong bg-paper text-ink hover:border-ink"}`}
            >
              <span className={`label block !tracking-[0.12em] ${on ? "!text-paper" : "!text-ink"}`}>
                {s.name[id]}
              </span>
              <span className={`mt-2 block text-[0.82rem] leading-snug ${on ? "" : "text-ink-muted"}`}>
                {s.question[id]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="px-4 pt-5 pb-1 md:px-8">
        <svg viewBox={`0 0 ${width} ${H}`} className="block w-full" role="img" aria-label={aria}>
          {/* faint year verticals */}
          {ALL_YEARS.map((y) => (
            <line
              key={y}
              x1={xOf(y)}
              y1={top}
              x2={xOf(y)}
              y2={axisY}
              stroke="var(--rule)"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
          ))}

          {ORDER.map((id, i) => {
            const cy = dotY(i);
            const on = sel === id;
            const none = YEARS[id].length === 0;
            return (
              <g key={id}>
                <line x1={X0} y1={cy} x2={markX} y2={cy} stroke="var(--rule)" strokeWidth="1" />
                <text
                  x={X0}
                  y={nameY(i)}
                  className="font-mono"
                  fontSize={fs}
                  letterSpacing="1"
                  fill={on ? "var(--ink)" : "var(--ink-muted)"}
                >
                  {s.name[id].toLowerCase()}
                </text>
                {YEARS[id].map((y) => (
                  <circle
                    key={y}
                    cx={xOf(y)}
                    cy={cy}
                    r={on ? r + 1 : r}
                    fill={on ? "var(--imagine)" : "var(--paper)"}
                    stroke="var(--imagine)"
                    strokeWidth={on ? 0 : 1.2}
                  />
                ))}
                {none && (
                  <>
                    <rect
                      x={markX - r}
                      y={cy - r}
                      width={r * 2}
                      height={r * 2}
                      fill="var(--paper)"
                      stroke="var(--ink-faint)"
                      strokeWidth="1.2"
                    />
                    <text
                      x={markX + r}
                      y={nameY(i)}
                      textAnchor="end"
                      className="font-mono"
                      fontSize={fs}
                      letterSpacing="1"
                      fill="var(--ink-faint)"
                    >
                      {s.notMeasured}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* the axis, and the dates along the bottom */}
          <line x1={X0} y1={axisY} x2={X1} y2={axisY} stroke="var(--rule-strong)" strokeWidth="1" />
          {ALL_YEARS.map((y) => {
            const hit = selYears.includes(y);
            return (
              <g key={y}>
                <line x1={xOf(y)} y1={axisY} x2={xOf(y)} y2={axisY + 4} stroke="var(--rule-strong)" strokeWidth="1" />
                <text
                  x={xOf(y)}
                  y={axisY + 18}
                  textAnchor="middle"
                  className="font-mono tnum"
                  fontSize={fs}
                  fill={hit ? "var(--imagine)" : "var(--ink-faint)"}
                >
                  {y}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="border-t border-rule px-5 py-4 md:px-8">
        <p className="label !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {s.verdict[sel ?? "none"]}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        {[
          [s.whoLabel, sel ? s.who[sel] : s.pick],
          [s.measuredLabel, sel ? s.measured[sel] : s.pick],
        ].map(([label, value]) => (
          <div key={label} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{label}</p>
            <p className={`mt-1 text-[0.9rem] leading-snug ${sel ? "text-ink" : "text-ink-muted"}`}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
