"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * A cache and a recipe, asked the same question.
 *
 * The question is the braking car's: at this speed, brake how far from the
 * wall? The cache is three entries settled in advance, one per speed seen in
 * training. The recipe is a short working that squares the speed and divides
 * by a constant, and can answer a speed it has never met. Press a seen speed
 * and both agree, the cache first. Press an unseen one and the cache hands
 * back its nearest entry while the recipe works out a fresh answer. Every
 * number here is illustrative: the constant is made up and the distances are
 * only roughly quadratic.
 */

const SPEEDS = [30, 40, 50, 60, 80, 100] as const;
type Speed = (typeof SPEEDS)[number];
/** the three entries the cache was given, speed to braking distance in metres */
const CACHE: Partial<Record<Speed, number>> = { 30: 6, 40: 10, 50: 15 };
/** the recipe's made-up constant: v squared over this lands on 6, 10, 15, 22, 39, 61 */
const K = 164;
const RECIPE_STEPS = 4;
const STEP_MS = 420;

const recipe = (v: number) => Math.round((v * v) / K);
const nearest = (v: number): Speed => {
  const seen = (Object.keys(CACHE).map(Number) as Speed[]);
  return seen.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
};

const TEXT = {
  en: {
    speeds: "speed, km/h",
    seen: "seen in training",
    cache: "cache",
    recipe: "recipe",
    nearestTag: "nearest entry",
    answer: "answer",
    working: "working",
    cacheAnswer: "cache answer",
    cacheTime: "cache time",
    recipeAnswer: "recipe answer",
    recipeTime: "recipe time",
    difference: "difference",
    oneStep: "1 step",
    nSteps: `${RECIPE_STEPS} steps`,
    idle: "Press a speed.",
    busy: "The cache has answered. The recipe is still working.",
    seenVerdict: "Both agree, and the cache got there first.",
    unseenVerdict: (v: number, near: number) =>
      `The cache handed back its entry for ${near}. The recipe worked out ${v}. Only one of them knew the question had changed.`,
    speedButton: (v: number, seen: boolean) => `${v} km/h${seen ? ", seen in training" : ""}`,
    aria: (v: Speed | null, c: number | null, r: number | null, unseen: boolean, near: number) =>
      v === null
        ? "A cache of three braking distances for 30, 40 and 50 km/h, and a recipe that squares the speed and divides by a constant. No speed pressed yet. Illustrative numbers, roughly quadratic."
        : `At ${v} km/h the cache answers ${c} m${unseen ? `, from its nearest entry at ${near} km/h` : ""}, and the recipe ${r === null ? "is still working" : `works out ${r} m`}. Illustrative numbers, roughly quadratic.`,
  },
  zh: {
    speeds: "车速，公里/小时",
    seen: "训练时见过",
    cache: "缓存",
    recipe: "算法",
    nearestTag: "最近的条目",
    answer: "答案",
    working: "推算",
    cacheAnswer: "缓存答案",
    cacheTime: "缓存耗时",
    recipeAnswer: "算法答案",
    recipeTime: "算法耗时",
    difference: "相差",
    oneStep: "1 步",
    nSteps: `${RECIPE_STEPS} 步`,
    idle: "按一个车速。",
    busy: "缓存已经作答。算法还在推算。",
    seenVerdict: "两者一致，而缓存先到。",
    unseenVerdict: (v: number, near: number) =>
      `缓存交回了它为 ${near} 存的条目。算法算出了 ${v} 的答案。只有一个知道问题已经变了。`,
    speedButton: (v: number, seen: boolean) => `${v} 公里/小时${seen ? "，训练时见过" : ""}`,
    aria: (v: Speed | null, c: number | null, r: number | null, unseen: boolean, near: number) =>
      v === null
        ? "一份存着 30、40、50 公里/小时三条刹车距离的缓存，和一个把车速平方、再除以一个常数的算法。还没有按下车速。数字均为示意，大致按平方增长。"
        : `在 ${v} 公里/小时，缓存答 ${c} 米${unseen ? `，取自它最近的条目 ${near} 公里/小时` : ""}，算法${r === null ? "还在推算" : `算出 ${r} 米`}。数字均为示意，大致按平方增长。`,
  },
};

export function CacheOrRecipe() {
  const locale = useLocale();
  const T = locale === "zh" ? TEXT.zh : TEXT.en;
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);

  const [speed, setSpeed] = useState<Speed | null>(null);
  /** how many lines of the recipe's working are visible, 0 to RECIPE_STEPS */
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (speed === null || stage >= RECIPE_STEPS) return;
    const id = window.setTimeout(() => setStage((s) => s + 1), STEP_MS);
    return () => window.clearTimeout(id);
  }, [speed, stage]);

  const ask = (v: Speed) => {
    setSpeed(v);
    setStage(still ? RECIPE_STEPS : 1);
  };

  const seen = speed !== null && speed in CACHE;
  const near = speed === null ? 50 : nearest(speed);
  const cacheAnswer = speed === null ? null : CACHE[near]!;
  const done = speed !== null && stage >= RECIPE_STEPS;
  const recipeAnswer = speed === null ? null : recipe(speed);
  const shownRecipe = done ? recipeAnswer : null;
  const diff = cacheAnswer !== null && shownRecipe !== null ? Math.abs(shownRecipe - cacheAnswer) : null;

  const verdict =
    speed === null ? T.idle : !done ? T.busy : seen ? T.seenVerdict : T.unseenVerdict(speed, near);

  /* ---------- geometry ---------- */
  const W = compact ? 360 : 520;
  const H = compact ? 468 : 250;
  const cacheBox = compact ? { x: 16, y: 12, w: 328, h: 216 } : { x: 10, y: 10, w: 244, h: 230 };
  const recipeBox = compact ? { x: 16, y: 240, w: 328, h: 216 } : { x: 266, y: 10, w: 244, h: 230 };
  const fs = 13;
  const fsTiny = 10;
  const rowH = 28;

  /** the four visible lines of the recipe's working, for the pressed speed */
  const lines =
    speed === null
      ? []
      : [
          `v = ${speed}`,
          `v × v = ${speed * speed}`,
          `${speed * speed} ÷ ${K} = ${((speed * speed) / K).toFixed(1)}`,
          `≈ ${recipeAnswer} m`,
        ];

  const aria = T.aria(speed, cacheAnswer, shownRecipe, speed !== null && !seen, near);

  return (
    <div>
      <div ref={ref} className={`flex gap-4 px-4 pt-5 md:px-8 ${compact ? "flex-col" : "flex-row items-start"}`}>
        {/* the questions: six speeds, three of them seen in training */}
        <div data-print-hide className="shrink-0">
          <p className="label mb-2">{T.speeds}</p>
          <div role="group" aria-label={T.speeds}
            className={`flex gap-1 ${compact ? "flex-row flex-wrap" : "flex-col"}`}>
            {SPEEDS.map((v) => {
              const isSeen = v in CACHE;
              const active = speed === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => ask(v)}
                  aria-pressed={active}
                  aria-label={T.speedButton(v, isSeen)}
                  className={`tnum flex items-center gap-2 border px-3 py-1 font-mono text-[0.8rem] transition-colors ${
                    active
                      ? "border-imagine bg-imagine text-paper"
                      : "border-rule-strong bg-paper text-ink hover:border-ink"
                  }`}
                >
                  <span className="w-7 text-right">{v}</span>
                  <span
                    aria-hidden="true"
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      isSeen ? (active ? "bg-paper" : "bg-[var(--actual)]") : "bg-transparent"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <p className="mt-2 flex items-center gap-2 text-[0.72rem] text-ink-muted">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--actual)]" />
            {T.seen}
          </p>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}
          className={`block w-full min-w-0 ${compact ? "mx-auto max-w-[26rem]" : ""}`}>
          {/* the cache: three entries, settled before any question arrived */}
          <g>
            <rect x={cacheBox.x} y={cacheBox.y} width={cacheBox.w} height={cacheBox.h}
              fill="var(--paper)" stroke="var(--actual)" strokeWidth="1.3" />
            <text x={cacheBox.x + 14} y={cacheBox.y + 22} className="font-mono" fontSize={fsTiny}
              letterSpacing="1.5" fill="var(--actual)">
              {T.cache.toUpperCase()}
            </text>
            {(Object.keys(CACHE).map(Number) as Speed[]).map((v, i) => {
              const y = cacheBox.y + 38 + i * (rowH + 6);
              const hit = speed !== null && near === v;
              return (
                <g key={v}>
                  <rect x={cacheBox.x + 14} y={y} width={cacheBox.w - 28} height={rowH}
                    fill={hit ? (seen ? "var(--actual-soft)" : "var(--imagine-soft)") : "var(--paper-sunk)"}
                    stroke={hit ? (seen ? "var(--actual)" : "var(--imagine)") : "var(--rule)"}
                    strokeWidth={hit ? 1.4 : 1} />
                  <text x={cacheBox.x + 26} y={y + rowH / 2 + fs * 0.36} className="font-mono tnum"
                    fontSize={fs} fill="var(--ink)">
                    {v} km/h
                  </text>
                  <text x={cacheBox.x + cacheBox.w - 26} y={y + rowH / 2 + fs * 0.36} textAnchor="end"
                    className="font-mono tnum" fontSize={fs} fill="var(--ink)">
                    {CACHE[v]} m
                  </text>
                  {hit && !seen && (
                    <text x={cacheBox.x + cacheBox.w - 68} y={y + rowH / 2 + fsTiny * 0.36}
                      textAnchor="end" className="font-mono" fontSize={9.5} letterSpacing="0.8"
                      fill="var(--imagine-on-soft)">
                      {T.nearestTag.toUpperCase()}
                    </text>
                  )}
                </g>
              );
            })}
            {/* the cache's answer, at once */}
            {(() => {
              const y = cacheBox.y + cacheBox.h - 50;
              return (
                <g>
                  <rect x={cacheBox.x + 14} y={y} width={cacheBox.w - 28} height={34}
                    fill={speed === null ? "var(--paper)" : seen ? "var(--paper)" : "var(--imagine-soft)"}
                    stroke={speed === null ? "var(--rule)" : seen ? "var(--actual)" : "var(--imagine)"}
                    strokeWidth="1" strokeDasharray={speed === null ? "3 3" : undefined} />
                  <text x={cacheBox.x + 26} y={y + 17 + fsTiny * 0.36} className="font-mono"
                    fontSize={fsTiny} letterSpacing="1.5" fill="var(--ink-muted)">
                    {T.answer.toUpperCase()}
                  </text>
                  {cacheAnswer !== null && (
                    <text x={cacheBox.x + cacheBox.w - 26} y={y + 17 + fs * 0.4} textAnchor="end"
                      className="font-mono tnum" fontSize={fs + 2}
                      fill={seen ? "var(--ink)" : "var(--imagine-on-soft)"}>
                      {cacheAnswer} m
                    </text>
                  )}
                </g>
              );
            })()}
          </g>

          {/* the recipe: a short working, built only once the question is known */}
          <g>
            <rect x={recipeBox.x} y={recipeBox.y} width={recipeBox.w} height={recipeBox.h}
              fill="var(--paper)" stroke="var(--imagine)" strokeWidth="1.3" />
            <text x={recipeBox.x + 14} y={recipeBox.y + 22} className="font-mono" fontSize={fsTiny}
              letterSpacing="1.5" fill="var(--imagine)">
              {T.recipe.toUpperCase()}
            </text>
            <text x={recipeBox.x + recipeBox.w - 14} y={recipeBox.y + 22} textAnchor="end"
              className="font-mono" fontSize={fsTiny} letterSpacing="1.5" fill="var(--ink-muted)">
              {`v × v ÷ ${K}`}
            </text>
            {Array.from({ length: RECIPE_STEPS }, (_, i) => {
              const y = recipeBox.y + 38 + i * 30;
              const shown = i < stage && lines[i] !== undefined;
              return (
                <g key={i}>
                  <line x1={recipeBox.x + 14} y1={y + 20} x2={recipeBox.x + recipeBox.w - 14} y2={y + 20}
                    stroke="var(--rule)" strokeWidth="1" />
                  <text x={recipeBox.x + 14} y={y + 9 + fs * 0.36} className="font-mono tnum" fontSize={fsTiny}
                    fill="var(--ink-faint)">
                    {i + 1}
                  </text>
                  {shown && (
                    <text x={recipeBox.x + 32} y={y + 9 + fs * 0.36} className="font-mono tnum" fontSize={fs}
                      fill={i === RECIPE_STEPS - 1 ? "var(--imagine)" : "var(--ink)"}>
                      {lines[i]}
                    </text>
                  )}
                </g>
              );
            })}
            {(() => {
              const y = recipeBox.y + recipeBox.h - 50;
              return (
                <g>
                  <rect x={recipeBox.x + 14} y={y} width={recipeBox.w - 28} height={34}
                    fill="var(--paper)"
                    stroke={done ? "var(--imagine)" : "var(--rule)"}
                    strokeWidth="1" strokeDasharray={done ? undefined : "3 3"} />
                  <text x={recipeBox.x + 26} y={y + 17 + fsTiny * 0.36} className="font-mono"
                    fontSize={fsTiny} letterSpacing="1.5" fill="var(--ink-muted)">
                    {(speed !== null && !done ? T.working : T.answer).toUpperCase()}
                  </text>
                  {shownRecipe !== null && (
                    <text x={recipeBox.x + recipeBox.w - 26} y={y + 17 + fs * 0.4} textAnchor="end"
                      className="font-mono tnum" fontSize={fs + 2} fill="var(--ink)">
                      {shownRecipe} m
                    </text>
                  )}
                </g>
              );
            })()}
          </g>
        </svg>
      </div>

      <div data-print-hide className="mt-4 border-t border-rule px-5 py-4 md:px-8">
        <p className="label !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-rule bg-rule sm:grid-cols-5">
        {[
          [T.cacheAnswer, cacheAnswer === null ? "·" : `${cacheAnswer} m`],
          [T.cacheTime, speed === null ? "·" : T.oneStep],
          [T.recipeAnswer, shownRecipe === null ? "·" : `${shownRecipe} m`],
          [T.recipeTime, speed === null ? "·" : T.nSteps],
          [T.difference, diff === null ? "·" : `${diff} m`],
        ].map(([k, v], i) => (
          <div key={k} className={`bg-paper px-5 py-3 md:px-8 ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}>
            <p className="label">{k}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
