"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import type { Locale } from "@/lib/i18n";

/**
 * Teacher forcing, drawn as the arrows that feed each step.
 *
 * Five steps, two rows. The top row is the recording. The bottom row is what
 * the model says. The only thing the switch changes is where each model cell
 * gets its input from: the recording (training) or the model's own previous
 * cell (in use). The model itself is identical in both, with the identical
 * small bias at every step. All values are illustrative.
 */

type Text = {
  truthRow: string; modelRow: [string, string]; training: string; inUse: string;
  step: string; reset: string; rMiss: string; rFrom: string;
  fromRecording: string; fromModel: string;
  vTrain0: string; vTrain5: string; vUse0: string; vUse5: string;
  ariaTrain: string; ariaUse: string; ariaStepped: string;
};

const TEXT: Record<Locale, Text> = {
  en: {
    truthRow: "recorded truth",
    modelRow: ["the model's", "output"],
    training: "training",
    inUse: "in use",
    step: "Step",
    reset: "Reset",
    rMiss: "miss at t=5",
    rFrom: "where each input comes from",
    fromRecording: "the recording",
    fromModel: "the model's last answer",
    vTrain0: "Every input is the recorded truth.",
    vTrain5: "Each step is a little off, and none of it carries. This is the run that gets scored.",
    vUse0: "Only the first input is the truth. After that the model feeds itself.",
    vUse5: "The first small miss rode into every later step. This is the run that gets deployed.",
    ariaTrain: "Five steps. Each model cell is fed by the recorded truth from the step before, so every miss stays small.",
    ariaUse: "Five steps. Only the first model cell is fed by the truth; each later one is fed by the model's own previous output, so the miss grows step by step.",
    ariaStepped: "Stepped to t={n} of 5.",
  },
  zh: {
    truthRow: "记录下来的真值",
    modelRow: ["模型的", "输出"],
    training: "训练",
    inUse: "使用中",
    step: "走一步",
    reset: "重置",
    rMiss: "t=5 时的偏差",
    rFrom: "每一步的输入来自哪里",
    fromRecording: "记录",
    fromModel: "模型上一步的答案",
    vTrain0: "每一步的输入都是记录下来的真值。",
    vTrain5: "每一步都有一点偏差，但没有一点会被带下去。被打分的就是这一趟。",
    vUse0: "只有第一个输入是真值。之后模型吃的都是自己的输出。",
    vUse5: "第一个小偏差被带进了之后的每一步。被部署的就是这一趟。",
    ariaTrain: "五步。每个模型格子的输入都来自前一步记录下来的真值，所以每一步的偏差都很小。",
    ariaUse: "五步。只有第一个模型格子的输入来自真值，之后每个格子的输入都是模型自己上一步的输出，所以偏差一步步变大。",
    ariaStepped: "已走到 t={n}，共 5 步。",
  },
};

/** the recording: a plain rising value, t = 0 to 5 */
const TRUTH = [10, 16, 22, 28, 34, 40];
/** the model is the true step with a fixed small bias on top */
const BIAS = 1.08;
const RISE = 6;

/** training: every input is the truth, so m_t = f(truth at t-1) */
const TRAIN = TRUTH.slice(1).map((v) => v * BIAS);
/** in use: every input after the first is the model's own last answer */
const USE = TRUTH.slice(1).reduce<number[]>((acc, _, i) => {
  const prev = i === 0 ? TRUTH[0] : acc[i - 1];
  return [...acc, (prev + RISE) * BIAS];
}, []);

const W = 720;
const S = 76;
const PITCH = 116;
const X0 = 20;
const VMAX = 56;
const INSET = 8;
const BAR_W = 26;
const cx = (i: number) => X0 + i * PITCH + S / 2;
const hOf = (v: number) => ((S - 2 * INSET) * v) / VMAX;

export function TeacherForcingLoop() {
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const k = compact ? 1.65 : 1;
  const locale = useLocale();
  const T = TEXT[locale] ?? TEXT.en;
  const uid = useId();
  const [inUse, setInUse] = useState(false);
  const [t, setT] = useState(0);

  const model = inUse ? USE : TRAIN;
  const done = t >= 5;
  const missAt5 = model[4] - TRUTH[5];
  const verdict = inUse ? (done ? T.vUse5 : T.vUse0) : done ? T.vTrain5 : T.vTrain0;

  const GAP = compact ? 54 : 70;
  const TRUTH_Y = 30;
  const TRUTH_B = TRUTH_Y + S;
  const MODEL_Y = TRUTH_B + GAP;
  const MODEL_B = MODEL_Y + S;
  const H = MODEL_B + 34;
  const midY = MODEL_Y + S / 2;

  const toggle = () => { setInUse((v) => !v); setT(0); };
  const press = () => setT((v) => (v >= 5 ? 0 : v + 1));

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={`${inUse ? T.ariaUse : T.ariaTrain} ${T.ariaStepped.replace("{n}", String(t))}`}>
          <defs>
            <marker id={`${uid}-a`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--actual)" strokeWidth="1.3" />
            </marker>
            <marker id={`${uid}-i`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--imagine)" strokeWidth="1.3" />
            </marker>
          </defs>

          <text x={X0} y={TRUTH_Y - 10} className="font-mono" fontSize={10 * k} letterSpacing="1" fill="var(--actual)">
            {T.truthRow}
          </text>
          {/* the model row has no t=0 cell, so its label sits in that empty column */}
          <text x={X0} y={midY - 4 * k} className="font-mono" fontSize={10 * k} letterSpacing={compact ? 0 : 1} fill="var(--ink-muted)">
            <tspan x={X0}>{T.modelRow[0]}</tspan>
            <tspan x={X0} dy={14 * k}>{T.modelRow[1]}</tspan>
          </text>

          {/* the recording, t = 0 to 5 */}
          {TRUTH.map((v, i) => (
            <g key={`tr${i}`}>
              <rect x={X0 + i * PITCH} y={TRUTH_Y} width={S} height={S} fill="none" stroke="var(--actual)" strokeWidth="1.2" />
              <rect x={cx(i) - BAR_W / 2} y={TRUTH_B - INSET - hOf(v)} width={BAR_W} height={hOf(v)} fill="var(--actual)" />
              <text x={cx(i)} y={MODEL_B + 22} textAnchor="middle" className="font-mono" fontSize={10 * k} letterSpacing="1" fill="var(--ink-muted)">
                {`t=${i}`}
              </text>
            </g>
          ))}

          {/* where each model cell gets its input */}
          {model.map((_, j) => {
            const i = j + 1;
            const fromModel = inUse && i > 1;
            const stepped = i <= t;
            const dash = stepped ? undefined : "4 4";
            return fromModel ? (
              <line key={`ar${i}`}
                x1={X0 + (i - 1) * PITCH + S + 2} y1={midY} x2={X0 + i * PITCH - 4} y2={midY}
                stroke="var(--imagine)" strokeWidth={stepped ? 1.8 : 1.2} strokeDasharray={dash}
                markerEnd={`url(#${uid}-i)`} />
            ) : (
              <line key={`ar${i}`}
                x1={cx(i - 1)} y1={TRUTH_B + 2} x2={cx(i)} y2={MODEL_Y - 4}
                stroke="var(--actual)" strokeWidth={stepped ? 1.8 : 1.2} strokeDasharray={dash}
                markerEnd={`url(#${uid}-a)`} />
            );
          })}

          {/* the model's output, t = 1 to 5 */}
          {model.map((m, j) => {
            const i = j + 1;
            const stepped = i <= t;
            const x = X0 + i * PITCH;
            const base = MODEL_B - INSET;
            const truthTop = base - hOf(TRUTH[i]);
            const barTop = base - hOf(m);
            return (
              <g key={`md${i}`}>
                <rect x={x} y={MODEL_Y} width={S} height={S} fill="none"
                  stroke={stepped ? "var(--ink)" : "var(--rule-strong)"} strokeWidth="1.2" />
                {stepped && (
                  <>
                    <motion.rect
                      key={`${inUse}-${i}`}
                      x={cx(i) - BAR_W / 2} y={barTop} width={BAR_W} height={hOf(m)}
                      fill="var(--imagine)"
                      initial={still ? false : { scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      style={{ transformOrigin: `${cx(i)}px ${base}px` }}
                    />
                    {/* the truth for this step, and how far the bar overshoots it */}
                    <line x1={x + INSET} y1={truthTop} x2={x + S - INSET} y2={truthTop}
                      stroke="var(--actual)" strokeWidth="1.2" strokeDasharray="2 3" />
                    <line x1={cx(i) + BAR_W / 2 + 7} y1={truthTop} x2={cx(i) + BAR_W / 2 + 7} y2={barTop}
                      stroke="var(--imagine)" strokeWidth="1.4" />
                    <line x1={cx(i) + BAR_W / 2 + 4} y1={barTop} x2={cx(i) + BAR_W / 2 + 10} y2={barTop}
                      stroke="var(--imagine)" strokeWidth="1.4" />
                    <line x1={cx(i) + BAR_W / 2 + 4} y1={truthTop} x2={cx(i) + BAR_W / 2 + 10} y2={truthTop}
                      stroke="var(--imagine)" strokeWidth="1.4" />
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex cursor-pointer items-center gap-3">
          <span className={`label ${inUse ? "" : "!text-ink"}`}>{T.training}</span>
          <button
            type="button"
            role="switch"
            aria-checked={inUse}
            aria-label={T.inUse}
            onClick={toggle}
            className={`relative h-6 w-11 border transition-colors ${
              inUse ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"
            }`}
          >
            <span className={`absolute top-[3px] h-4 w-4 transition-all ${
              inUse ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"
            }`} />
          </button>
          <span className={`label ${inUse ? "!text-ink" : ""}`}>{T.inUse}</span>
        </label>
        <button
          type="button"
          onClick={press}
          className="label h-10 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink"
        >
          {done ? T.reset : T.step}
        </button>
        <span className="label tnum">{t}/5</span>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        {[
          [T.rMiss, missAt5.toFixed(1)],
          [T.rFrom, inUse ? T.fromModel : T.fromRecording],
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
