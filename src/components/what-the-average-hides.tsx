"use client";

import { useEffect, useRef, useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * The report format, not the machine.
 *
 * Two models with the same average error over a thousand steps. Leave the
 * report on one number and the two cards are identical, which is the point:
 * there is nothing in them to choose between. Switch the report to one horizon
 * per property and the same two models come apart, because a per-frame average
 * melts six failures into one figure and hides the order they happened in.
 *
 * The profiles are invented, but their shape is not: colour and texture outlast
 * identity and physics in both, which is what a per-frame loss pays for.
 */

type Prop = "identity" | "physics" | "action" | "layout" | "texture" | "colour";

const ORDER: Prop[] = ["identity", "physics", "action", "layout", "texture", "colour"];

/** illustrative horizons, in steps, for two models that report the same average */
const HORIZON: Record<Prop, { a: number; b: number }> = {
  identity: { a: 400, b: 45 },
  physics: { a: 60, b: 520 },
  action: { a: 110, b: 90 },
  layout: { a: 250, b: 300 },
  texture: { a: 640, b: 700 },
  colour: { a: 900, b: 880 },
};

const RUN = 1000;
const AVG = "0.08";

/** bottom lane is the property that went first, so the markers read as a stair */
const LANES = [...ORDER].sort((p, q) => HORIZON[p].a + HORIZON[p].b - HORIZON[q].a - HORIZON[q].b);

type Mode = "average" | "horizon";

/** mono advances at 0.6em, Han at 1em: enough to mask a label's own ground */
function textWidth(str: string, fs: number) {
  let units = 0;
  for (const ch of str) units += ch.charCodeAt(0) > 0x2e80 ? 1.667 : 1;
  return units * fs * 0.6;
}

type Strings = {
  modelA: string;
  modelB: string;
  reportLabel: string;
  modeAverage: string;
  modeHorizon: string;
  avgLong: string;
  avgShort: string;
  stepsAxis: string;
  name: Record<Prop, string>;
  avgCell: string;
  differCell: string;
  differValue: string;
  toldCell: string;
  toldValue: string;
  verdictAverage: string;
  verdictNone: string;
  verdictIdentity: string;
  verdictPhysics: string;
  verdictOther: (name: string, a: number, b: number, longer: string) => string;
  ariaAverage: string;
  ariaHorizon: (card: string, list: string) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    modelA: "Model A",
    modelB: "Model B",
    reportLabel: "Report",
    modeAverage: "One average number",
    modeHorizon: "One horizon per property",
    avgLong: "Average error over a thousand steps",
    avgShort: "Average error",
    stepsAxis: "steps",
    name: {
      identity: "Identity",
      physics: "Physics",
      action: "Action fidelity",
      layout: "Layout",
      texture: "Texture",
      colour: "Colour",
    },
    avgCell: "Average error, both models",
    differCell: "Properties where they differ",
    differValue: "6 of 6",
    toldCell: "What the average told you",
    toldValue: "Nothing about which one to plan inside",
    verdictAverage:
      "One number each, and it is the same number. Nothing here tells you which one to plan inside.",
    verdictNone: "Same average, two different machines. Pick a property.",
    verdictIdentity:
      "Identity: A held it for 400 steps, B for 45. The average said they were the same.",
    verdictPhysics: "Physics: B held it for 520 steps, A for 60. The average said that too.",
    verdictOther: (name, a, b, longer) =>
      `${name}: A held it for ${a} steps, B for ${b}. ${longer} held it longer.`,
    ariaAverage: `Two report cards, model A and model B. Each holds one number, an average error of ${AVG} over ${RUN} steps, and nothing else.`,
    ariaHorizon: (card, list) => `${card}, a ruler of ${RUN} steps. ${list}.`,
  },
  zh: {
    modelA: "模型 A",
    modelB: "模型 B",
    reportLabel: "报告方式",
    modeAverage: "一个平均数",
    modeHorizon: "每项属性一个步长",
    avgLong: "一千步上的平均误差",
    avgShort: "平均误差",
    stepsAxis: "步",
    name: {
      identity: "身份",
      physics: "物理",
      action: "动作保真度",
      layout: "布局",
      texture: "纹理",
      colour: "颜色",
    },
    avgCell: "两个模型的平均误差",
    differCell: "两者表现不同的属性",
    differValue: "6 项，共 6 项",
    toldCell: "平均数告诉了你什么",
    toldValue: "关于该在哪一个里面做规划，它什么都没说",
    verdictAverage: "各一个数，而且是同一个数。这里没有任何东西告诉你该在哪一个里面做规划。",
    verdictNone: "同样的平均数，两台不同的机器。挑一项属性看看。",
    verdictIdentity: "身份：A 撑了 400 步，B 只撑了 45 步。平均数说它们一样。",
    verdictPhysics: "物理：B 撑了 520 步，A 只撑了 60 步。平均数也是这么说的。",
    verdictOther: (name, a, b, longer) =>
      `${name}：A 撑了 ${a} 步，B 撑了 ${b} 步。${longer} 撑得更久。`,
    ariaAverage: `两张报告卡，模型 A 与模型 B。每张只有一个数：一千步上的平均误差 ${AVG}，再没有别的。`,
    ariaHorizon: (card, list) => `${card}，一把一千步的标尺。${list}。`,
  },
};

export function WhatTheAverageHides() {
  const locale = useLocale();
  const s = pickText(TEXT, locale);
  const { ref, compact } = useCompact(560);
  const [mode, setMode] = useState<Mode>("average");
  const [sel, setSel] = useState<Prop | null>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  /**
   * The ruler is drawn at one unit per CSS pixel, so its mono labels stay
   * 11px whether the two cards sit side by side or stack in a narrow column.
   */
  const cardRef = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(420);
  useEffect(() => {
    // the ruler only exists in horizon mode, so the observer has to follow the mode
    const el = cardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setCw(Math.max(240, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  const move = (delta: number) => {
    const i = sel ? ORDER.indexOf(sel) : -1;
    const next = ORDER[(i + delta + ORDER.length) % ORDER.length];
    setSel(next);
    buttons.current[ORDER.indexOf(next)]?.focus();
  };

  const verdict =
    mode === "average"
      ? s.verdictAverage
      : sel === null
        ? s.verdictNone
        : sel === "identity"
          ? s.verdictIdentity
          : sel === "physics"
            ? s.verdictPhysics
            : s.verdictOther(
                s.name[sel],
                HORIZON[sel].a,
                HORIZON[sel].b,
                HORIZON[sel].a > HORIZON[sel].b ? "A" : "B",
              );

  const ticks = cw < 380 ? [0, 500, RUN] : [0, 250, 500, 750, RUN];
  const fs = 11;
  const laneH = 17;
  const axisY = LANES.length * laneH + 8;
  const H = axisY + 24;
  const x0 = 8;
  const x1 = cw - 10;
  const xOf = (step: number) => x0 + (step / RUN) * (x1 - x0);

  const card = (which: "a" | "b") => {
    const title = which === "a" ? s.modelA : s.modelB;
    const list = ORDER.map((p) => `${s.name[p]} ${HORIZON[p][which]}`).join(", ");
    return (
      <div className="min-w-0 border border-rule bg-paper px-4 py-4">
        <p className="label !text-ink">{title}</p>

        {mode === "average" ? (
          <div className="mt-4">
            <p className="label !normal-case !tracking-normal">{s.avgLong}</p>
            <p className="tnum mt-2 font-mono text-[2rem] leading-none text-ink">{AVG}</p>
            <div className="mt-4 h-[2px] w-full bg-rule">
              <div className="h-full w-[38%] bg-imagine" />
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <p className="label !normal-case !tracking-normal">
              {s.avgShort} <span className="tnum !text-ink">{AVG}</span>
            </p>
            <div ref={which === "a" ? cardRef : undefined} className="mt-2">
              <svg
                viewBox={`0 0 ${cw} ${H}`}
                className="block w-full"
                role="img"
                aria-label={s.ariaHorizon(title, list)}
              >
                {/* every stroke first, so no marker is drawn over a label */}
                {LANES.map((p, lane) => {
                  const x = xOf(HORIZON[p][which]);
                  const y = axisY - 6 - lane * laneH;
                  const on = sel === p;
                  const dim = sel !== null && !on;
                  return (
                    <line
                      key={p}
                      x1={x}
                      y1={axisY}
                      x2={x}
                      y2={y}
                      stroke={dim ? "var(--ink-faint)" : "var(--imagine)"}
                      strokeWidth={on ? 2.4 : 1.4}
                      opacity={dim ? 0.75 : 1}
                    />
                  );
                })}

                {LANES.map((p, lane) => {
                  const step = HORIZON[p][which];
                  const x = xOf(step);
                  const y = axisY - 6 - lane * laneH;
                  const on = sel === p;
                  const dim = sel !== null && !on;
                  const right = x > cw * 0.6;
                  const text = `${s.name[p].toLowerCase()} ${step}`;
                  const tw = textWidth(text, fs);
                  return (
                    <g key={p}>
                      {/* the label crosses other markers, so it carries its own ground */}
                      <rect
                        x={(right ? x - 5 - tw : x + 5) - 2}
                        y={y + 5 - fs}
                        width={tw + 4}
                        height={fs + 2}
                        fill="var(--paper)"
                      />
                      <text
                        x={right ? x - 5 : x + 5}
                        y={y + 4}
                        textAnchor={right ? "end" : "start"}
                        className="font-mono tnum"
                        fontSize={fs}
                        fill={dim ? "var(--ink-faint)" : "var(--ink)"}
                      >
                        {text}
                      </text>
                    </g>
                  );
                })}

                <line
                  x1={x0}
                  y1={axisY}
                  x2={x1}
                  y2={axisY}
                  stroke="var(--rule-strong)"
                  strokeWidth="1"
                />
                {ticks.map((tk) => (
                  <g key={tk}>
                    <line
                      x1={xOf(tk)}
                      y1={axisY}
                      x2={xOf(tk)}
                      y2={axisY + 4}
                      stroke="var(--rule-strong)"
                      strokeWidth="1"
                    />
                    <text
                      x={xOf(tk)}
                      y={axisY + 17}
                      textAnchor={tk === 0 ? "start" : tk === RUN ? "end" : "middle"}
                      className="font-mono tnum"
                      fontSize={10}
                      fill="var(--ink-faint)"
                    >
                      {tk === RUN ? `${tk} ${s.stepsAxis}` : tk}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div
        ref={ref}
        className={`grid gap-4 px-4 pt-6 pb-2 md:px-8 ${compact ? "grid-cols-1" : "grid-cols-2"}`}
        {...(mode === "average" ? { role: "img", "aria-label": s.ariaAverage } : {})}
      >
        {card("a")}
        {card("b")}
      </div>

      <div
        data-print-hide
        className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8"
      >
        <span className="label whitespace-nowrap">{s.reportLabel}</span>
        <div className="flex flex-wrap gap-2">
          {(["average", "horizon"] as Mode[]).map((m) => {
            const on = mode === m;
            return (
              <button
                key={m}
                type="button"
                aria-pressed={on}
                onClick={() => setMode(m)}
                className={`h-9 border px-5 transition-colors ${
                  on
                    ? "border-imagine bg-imagine text-paper"
                    : "border-rule-strong bg-paper text-ink hover:border-ink"
                }`}
              >
                <span className={`label !text-[0.62rem] ${on ? "!text-paper" : "!text-ink"}`}>
                  {m === "average" ? s.modeAverage : s.modeHorizon}
                </span>
              </button>
            );
          })}
        </div>

        <div
          className="flex basis-full flex-wrap gap-2"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
              e.preventDefault();
              move(1);
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
              e.preventDefault();
              move(-1);
            } else if (e.key === "Escape") {
              setSel(null);
            }
          }}
        >
          {ORDER.map((p, i) => {
            const on = sel === p;
            return (
              <button
                key={p}
                type="button"
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                aria-pressed={on}
                onClick={() => setSel(on ? null : p)}
                className={`h-9 border px-5 transition-colors ${
                  on
                    ? "border-imagine bg-imagine text-paper"
                    : "border-rule-strong bg-paper text-ink hover:border-ink"
                }`}
              >
                <span className={`label !text-[0.62rem] ${on ? "!text-paper" : "!text-ink"}`}>
                  {s.name[p]}
                </span>
              </button>
            );
          })}
        </div>

        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [s.avgCell, AVG],
          [s.differCell, s.differValue],
          [s.toldCell, s.toldValue],
        ].map(([label, value]) => (
          <div key={label} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{label}</p>
            <p className="tnum mt-1 text-[0.9rem] leading-snug text-ink">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
