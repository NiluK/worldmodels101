"use client";

import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * The bill for experience.
 *
 * Two illustrative learning curves against environment steps: a model-free
 * agent that climbs slowly and ends high, and a model-based one that climbs
 * fast and plateaus a little lower, because a learned model is a ceiling as
 * well as a shortcut. Pick what one step costs and how long you can pay for,
 * and the shaded region is the experience you can afford. The question the
 * figure answers is which agent is ahead at the edge of the budget. In a
 * simulator that is the model-free one. On a robot the budget runs out before
 * its curve gets going, and that is the whole case for carrying a model.
 *
 * Nothing here is measured. The curves are shapes, not data.
 */

/** log10 of the axis range: a hundred steps to a billion */
const U0 = 2;
const U1 = 9;

/** the curves, as functions of log10(steps) */
const modelFree = (u: number) => 0.96 / (1 + Math.exp(-(u - 6.0) * 1.6));
const modelBased = (u: number) => 0.82 / (1 + Math.exp(-(u - 4.0) * 2.0));
const badModel = (u: number) => 0.34 / (1 + Math.exp(-(u - 4.0) * 2.0));

/** where the slow climber overtakes the fast one, by bisection */
function crossover() {
  let lo = 5, hi = U1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (modelFree(mid) < modelBased(mid)) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
const CROSS = crossover();

/**
 * The drawing is laid out twice: a wide box for the column, and a squarer,
 * narrower one for phones, where a 900-unit viewBox would shrink every label
 * below legibility. Type is scaled up as well, and the margins grow with it.
 */
function layout(compact: boolean) {
  const fs = compact ? 17 : 10.5;
  const W = compact ? 560 : 900;
  const H = compact ? 330 : 320;
  const L = compact ? 50 : 46;
  const R = compact ? 20 : 22;
  const T = fs + 16;
  const B = fs * 2.6 + 16;
  const PW = W - L - R;
  const PH = H - T - B;
  const xOf = (u: number) => L + ((Math.min(U1, Math.max(U0, u)) - U0) / (U1 - U0)) * PW;
  const yOf = (s: number) => T + PH - s * PH;
  const curve = (f: (u: number) => number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 140; i++) {
      const u = U0 + ((U1 - U0) * i) / 140;
      pts.push(`${i ? "L" : "M"} ${xOf(u).toFixed(1)} ${yOf(f(u)).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  return { fs, W, H, L, R, T, B, PW, PH, xOf, yOf, curve };
}

/** seconds per step, illustrative, one per stop on the cost control */
const COSTS = [2e-4, 0.07, 3, 3600];

/** the budget slider runs over log10(seconds), an hour to a year */
const HOUR = 3600;
const YEAR = 365 * 24 * HOUR;
const BUDGET_MIN = Math.log10(HOUR);
const BUDGET_MAX = Math.log10(YEAR);

type Strings = {
  cost: string;
  stops: { name: string; price: string; bill: string }[];
  budget: string;
  bill: (dur: string, bill: string) => string;
  badModel: string;
  legend: [string, string, string];
  score: string;
  steps: string;
  stepsShort: string;
  cross: string;
  budgetMark: string;
  ticks: string[];
  read: [string, string, string];
  beyond: string;
  join: string;
  verdict: { free: string; model: string; starved: string; even: string; bad: string };
  one: (n: number, unit: "hour" | "day" | "week" | "month" | "year") => string;
  count: (n: number) => string;
  aria: (bill: string, steps: string, mf: string, mb: string, verdict: string) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    cost: "what one step costs",
    stops: [
      { name: "simulated frames", price: "thousands a second", bill: "simulator time" },
      { name: "a game at human speed", price: "about fifteen a second", bill: "game time" },
      { name: "a robot arm", price: "a few seconds each, plus resets", bill: "robot time" },
      { name: "a lab experiment", price: "about an hour each", bill: "lab time" },
    ],
    budget: "budget",
    bill: (dur, bill) => `${dur} of ${bill}`,
    badModel: "show a bad model",
    legend: ["model-free", "model-based", "model-based, bad model"],
    score: "task score",
    steps: "experience, in environment steps",
    stepsShort: "steps",
    cross: "crossover",
    budgetMark: "budget",
    ticks: ["100", "1k", "10k", "100k", "1M", "10M", "100M", "1B"],
    read: ["affordable steps", "model-free score at budget", "model-based score at budget"],
    beyond: ", past the right edge of the chart",
    join: " ",
    verdict: {
      free: "At these prices you can afford to be model-free. More play beats a model, and the model's ceiling starts to show.",
      model: "The budget runs out before the model-free curve gets going. This is the case for a model.",
      starved: "Almost nothing has been learned by the time the budget runs out. The model is ahead, but both are near the floor.",
      even: "Near the crossover neither design has much on the other.",
      bad: "With a bad model the fast start stalls low. A model only pays if it is good where you go.",
    },
    one: (n, unit) => {
      const single = { hour: "an hour", day: "a day", week: "a week", month: "a month", year: "a year" }[unit];
      return n === 1 ? single : `${n} ${unit}s`;
    },
    count: (n) => {
      if (n < 1000) return `about ${Math.round(n).toLocaleString("en")}`;
      const [v, unit] =
        n < 1e6 ? [n / 1e3, "thousand"] : n < 1e9 ? [n / 1e6, "million"] : [n / 1e9, "billion"];
      return `about ${Number(v.toPrecision(2))} ${unit}`;
    },
    aria: (bill, steps, mf, mb, verdict) =>
      `Two illustrative learning curves against environment steps, model-free and model-based. With ${bill} you can afford ${steps} steps. At that budget the model-free agent scores ${mf} and the model-based agent ${mb}, out of 1. ${verdict}`,
  },
};

/** seconds to a rounded phrase: "a day", "3 weeks", "a year" */
function duration(sec: number, s: Strings) {
  const h = sec / HOUR;
  if (h < 22) return s.one(Math.max(1, Math.round(h)), "hour");
  const d = h / 24;
  if (d < 6.5) return s.one(Math.max(1, Math.round(d)), "day");
  const w = d / 7;
  if (w < 4.3) return s.one(Math.max(1, Math.round(w)), "week");
  const mo = d / 30.4;
  if (mo < 11.5) return s.one(Math.max(1, Math.round(mo)), "month");
  return s.one(1, "year");
}

export function ExperienceBill() {
  const still = useReducedMotion();
  const locale = useLocale();
  const s = pickText(TEXT, locale);
  const { ref, compact } = useCompact(560);

  const [cost, setCost] = useState(2);
  const [budget, setBudget] = useState(BUDGET_MIN + (BUDGET_MAX - BUDGET_MIN) * 0.62);
  const [showBad, setShowBad] = useState(false);

  const g = useMemo(() => layout(compact), [compact]);
  const paths = useMemo(
    () => ({ free: g.curve(modelFree), model: g.curve(modelBased), bad: g.curve(badModel) }),
    [g],
  );
  const { fs, W, H, L, T, PW, PH, xOf, yOf } = g;

  const seconds = Math.pow(10, budget);
  const steps = seconds / COSTS[cost];
  const u = Math.log10(Math.max(1, steps));
  const beyond = u > U1;
  const edge = xOf(u);
  const mf = modelFree(Math.min(u, U1));
  const mb = modelBased(Math.min(u, U1));
  const bad = badModel(Math.min(u, U1));

  const kind =
    mb < 0.25 && mf < 0.25 ? "starved" : Math.abs(mf - mb) < 0.05 ? "even" : mf > mb ? "free" : "model";
  const verdict = s.verdict[kind] + (showBad && kind === "model" ? s.join + s.verdict.bad : "");

  const bill = s.bill(duration(seconds, s), s.stops[cost].bill);
  const stepsText = s.count(steps);
  const fmt = (v: number) => v.toFixed(1);

  const ticks = s.ticks.map((label, i) => ({ label, u: U0 + i }))
    .filter((_, i) => !compact || i % 2 === 0);
  const labelLeft = edge > L + PW * 0.6;

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={s.aria(bill, stepsText, fmt(mf), fmt(mb), verdict)}>
          <defs>
            <clipPath id="xb-afford">
              <rect x={L} y={0} width={Math.max(0, edge - L)} height={H} />
            </clipPath>
          </defs>

          {/* what the budget buys */}
          <rect x={L} y={T} width={Math.max(0, edge - L)} height={PH} fill="var(--paper-sunk)" />

          {/* axes */}
          <line x1={L} y1={T + PH} x2={L + PW} y2={T + PH} stroke="var(--rule-strong)" strokeWidth="1" />
          <line x1={L} y1={T} x2={L} y2={T + PH} stroke="var(--rule-strong)" strokeWidth="1" />
          {[0, 0.5, 1].map((v) => (
            <g key={v}>
              <line x1={L} y1={yOf(v)} x2={L + PW} y2={yOf(v)} stroke="var(--rule)" strokeWidth="1" />
              <text x={L - 6} y={yOf(v) + fs * 0.35} textAnchor="end" className="font-mono"
                fontSize={fs} fill="var(--ink-faint)">{v === 0.5 ? "0.5" : v}</text>
            </g>
          ))}
          {ticks.map(({ label, u: tu }) => (
            <g key={label}>
              <line x1={xOf(tu)} y1={T + PH} x2={xOf(tu)} y2={T + PH + 4} stroke="var(--rule-strong)" strokeWidth="1" />
              <text x={xOf(tu)} y={T + PH + 6 + fs} textAnchor="middle" className="font-mono"
                fontSize={fs} fill="var(--ink-faint)">{label}</text>
            </g>
          ))}
          <text x={L} y={T - 9} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-faint)">
            {s.score}
          </text>
          <text x={L + PW} y={T + PH + 10 + fs * 2.3} textAnchor="end" className="font-mono"
            fontSize={fs} letterSpacing="1" fill="var(--ink-faint)">
            {compact ? s.stepsShort : s.steps}
          </text>

          {/* the crossover: from here on, play wins */}
          <line x1={xOf(CROSS)} y1={T} x2={xOf(CROSS)} y2={T + PH} stroke="var(--rule-strong)" strokeWidth="1" strokeDasharray="2 4" />
          <text x={xOf(CROSS) - 5} y={T + fs} textAnchor="end" className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-faint)">
            {s.cross}
          </text>

          {/* the curves, full length but faint beyond the budget */}
          {showBad && (
            <path d={paths.bad} fill="none" stroke="var(--imagine)" strokeWidth="1.4" strokeDasharray="3 5" opacity="0.4" />
          )}
          <path d={paths.free} fill="none" stroke="var(--ink)" strokeWidth="2.2" opacity="0.22" />
          <path d={paths.model} fill="none" stroke="var(--imagine)" strokeWidth="2.2" opacity="0.22" />
          <g clipPath="url(#xb-afford)">
            {showBad && (
              <path d={paths.bad} fill="none" stroke="var(--imagine)" strokeWidth="1.6" strokeDasharray="3 5" opacity="0.7" />
            )}
            <path d={paths.free} fill="none" stroke="var(--ink)" strokeWidth="2.4" />
            <path d={paths.model} fill="none" stroke="var(--imagine)" strokeWidth="2.4" />
          </g>

          {/* the edge of the budget */}
          <line x1={edge} y1={T} x2={edge} y2={T + PH} stroke="var(--ink)" strokeWidth="1.2" />
          <text x={edge + (labelLeft ? -6 : 6)} y={T + PH - 7} textAnchor={labelLeft ? "end" : "start"}
            className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink)">
            {s.budgetMark}
          </text>
          {showBad && <circle cx={edge} cy={yOf(bad)} r={4} fill="var(--paper)" stroke="var(--imagine)" strokeWidth="1.5" />}
          <circle cx={edge} cy={yOf(mf)} r={mf >= mb ? 6 : 4.5} fill="var(--ink)" stroke="var(--paper)" strokeWidth="2" />
          <circle cx={edge} cy={yOf(mb)} r={mb > mf ? 6 : 4.5} fill="var(--imagine)" stroke="var(--paper)" strokeWidth="2" />

          {/* legend, top left, where both curves are still on the floor */}
          {[
            { label: s.legend[0], stroke: "var(--ink)", dash: undefined, on: true },
            { label: s.legend[1], stroke: "var(--imagine)", dash: undefined, on: true },
            { label: s.legend[2], stroke: "var(--imagine)", dash: "3 5", on: showBad },
          ].filter((l) => l.on).map((l, i) => (
            <g key={l.label} transform={`translate(${L + 14}, ${T + 14 + i * (fs + 8)})`}>
              <line x1={0} y1={0} x2={22} y2={0} stroke={l.stroke} strokeWidth="2.2" strokeDasharray={l.dash} />
              <text x={30} y={fs * 0.36} className="font-mono" fontSize={fs} fill="var(--ink-muted)">{l.label}</text>
            </g>
          ))}
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-col gap-4 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="label whitespace-nowrap">{s.cost}</span>
          <div className="flex flex-wrap gap-2">
            {s.stops.map((stop, i) => (
              <button
                key={stop.name}
                onClick={() => setCost(i)}
                aria-pressed={i === cost}
                className={`border px-5 py-2 font-mono text-[0.7rem] transition-colors ${
                  i === cost
                    ? "border-imagine bg-imagine text-paper"
                    : "border-rule-strong bg-paper text-ink hover:border-ink"
                }`}
              >
                {stop.name}
              </button>
            ))}
          </div>
          <span className="label !normal-case !tracking-normal">{s.stops[cost].price}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <label className="flex min-w-[min(16rem,100%)] flex-1 flex-wrap items-center gap-x-3 gap-y-2">
            <span className="label whitespace-nowrap">{s.budget}</span>
            <input
              type="range"
              min={BUDGET_MIN}
              max={BUDGET_MAX}
              step={0.02}
              value={budget}
              onChange={(e) => {
                setBudget(Number(e.target.value));
              }}
              aria-valuetext={bill}
              className="h-1 min-w-[8rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
            />
            <span className="label min-w-[11rem] whitespace-nowrap !normal-case !tracking-normal !text-ink">{bill}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <span className="label">{s.badModel}</span>
            <button
              role="switch"
              aria-checked={showBad}
              onClick={() => setShowBad((v) => !v)}
              className={`relative h-6 w-11 border transition-colors ${
                showBad ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"
              }`}
            >
              <span
                className={`absolute top-[3px] h-4 w-4 transition-all ${
                  showBad ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"
                }`}
              />
            </button>
          </label>
        </div>

        <motion.p
          key={kind + (showBad ? "b" : "")}
          initial={still ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="label max-w-[62ch] !normal-case !tracking-normal !text-[0.8rem]"
        >
          {verdict}
        </motion.p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [s.read[0], beyond ? stepsText + s.beyond : stepsText],
          [s.read[1], fmt(mf)],
          [s.read[2], fmt(mb)],
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
