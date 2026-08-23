"use client";

import { useState } from "react";
import { useReducedMotion } from "motion/react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * What makes a probe a test: the control, and the size of the probe.
 *
 * The same probe is run against two networks, one trained on Othello moves and
 * one of the same shape that never trained. A straight line reads the board out
 * of the trained network and nothing out of the control, which is a result.
 * A big probe reads a board out of the untrained network too, which means the
 * probe learned the fact itself and the run licenses nothing.
 *
 * Every accuracy here is invented, including the chance level. The point is the
 * shape of the comparison, not the numbers.
 */

type Probe = "line" | "small" | "big";

const PROBES: Probe[] = ["line", "small", "big"];

/** illustrative accuracies: trained network, untrained control */
const SCORE: Record<Probe, { trained: number; control: number }> = {
  line: { trained: 0.92, control: 0.14 },
  small: { trained: 0.96, control: 0.31 },
  big: { trained: 0.98, control: 0.95 },
};
const CHANCE = 0.12;

const W = 520;
const H = 196;
/** the probe glyph grows with the probe, so the choice is visible as a picture */
const SHAPE: Record<Probe, { w: number; h: number; cols: number; rows: number }> = {
  line: { w: 104, h: 0, cols: 0, rows: 0 },
  small: { w: 92, h: 76, cols: 2, rows: 3 },
  big: { w: 160, h: 124, cols: 4, rows: 5 },
};
const CX = 372;
const CY = 92;

type Strings = {
  trainedHead: string;
  controlHead: string;
  controlSub: string;
  controlTag: string;
  probeName: Record<Probe, string>;
  probeGlyph: string;
  run: string;
  notRun: string;
  chance: string;
  trainedCell: string;
  controlCell: string;
  licenceCell: string;
  licence: Record<Probe, string>;
  verdict: Record<Probe | "none", string>;
  aria: (head: string, probe: string, score: string) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    trainedHead: "Trained on Othello moves",
    controlHead: "Never trained",
    controlSub: "same shape, random weights",
    controlTag: "the control",
    probeName: {
      line: "A straight line",
      small: "A small network",
      big: "A big network",
    },
    probeGlyph: "probe",
    run: "Run the probe",
    notRun: "not run",
    chance: "chance",
    trainedCell: "On the trained network",
    controlCell: "On the control",
    licenceCell: "What this licenses",
    licence: {
      line: "The fact is in there",
      small: "Hard to tell",
      big: "Nothing",
    },
    verdict: {
      none: "One probe, two networks, and only one of them was trained. Run it.",
      line: "A straight line reads it out of the trained network and reads nothing out of the control. That is the result.",
      small: "A little better on the trained network, and the control has started to give something up too.",
      big: "The big probe reads it out of a network that never trained, so it learned the fact itself. This is why the probe has to be small.",
    },
    aria: (head, probe, score) =>
      `${head}. A four layer network with its activations, read by ${probe.toLowerCase()}. Accuracy ${score}.`,
  },
  zh: {
    trainedHead: "在黑白棋棋步上训练过",
    controlHead: "从未训练过",
    controlSub: "同样的形状，随机的权重",
    controlTag: "对照组",
    probeName: {
      line: "一条直线",
      small: "一个小网络",
      big: "一个大网络",
    },
    probeGlyph: "探针",
    run: "运行探针",
    notRun: "尚未运行",
    chance: "随机水平",
    trainedCell: "在训练过的网络上",
    controlCell: "在对照组上",
    licenceCell: "这一次运行能支持什么结论",
    licence: {
      line: "那个事实确实在里面",
      small: "不好说",
      big: "什么都支持不了",
    },
    verdict: {
      none: "同一个探针，两个网络，只有其中一个训练过。运行看看。",
      line: "一条直线能从训练过的网络里读出棋盘，从对照组里什么都读不出。这才叫一个结果。",
      small: "在训练过的网络上好了一点，而对照组也开始交出一些东西了。",
      big: "大探针从一个从未训练过的网络里也读出了棋盘，说明这个事实是它自己学会的。这就是探针必须小的原因。",
    },
    aria: (head, probe, score) =>
      `${head}。一个四层网络和它的激活，由${probe}来读。准确率 ${score}。`,
  },
};

/** two fixed activation patterns, so the control does not look like a copy */
const ACTS: Record<"trained" | "control", number[]> = {
  trained: [0.9, 0.35, 0.65, 0.2, 0.8, 0.45],
  control: [0.4, 0.85, 0.25, 0.55, 0.3, 0.7],
};

function Glyph({
  probe,
  which,
  label,
  ariaLabel,
  k,
}: {
  probe: Probe;
  which: "trained" | "control";
  label: string;
  ariaLabel: string;
  k: number;
}) {
  const sh = SHAPE[probe];
  const left = CX - sh.w / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={ariaLabel}>
      {/* the network: four hairline layers */}
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={24}
          y={26 + i * 36}
          width={96}
          height={22}
          fill="none"
          stroke="var(--ink)"
          strokeWidth="1"
        />
      ))}

      {/* its activations */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect
          key={i}
          x={140}
          y={24 + i * 26}
          width={20}
          height={20}
          fill="var(--actual)"
          opacity={ACTS[which][i]}
        />
      ))}

      <g stroke="var(--rule-strong)" strokeWidth="1" fill="none">
        <line x1={170} y1={CY} x2={left - 12} y2={CY} />
        <path d={`M ${left - 12} ${CY} L ${left - 19} ${CY - 5} M ${left - 12} ${CY} L ${left - 19} ${CY + 5}`} />
      </g>

      {/* the probe, drawn at the size you chose */}
      {probe === "line" ? (
        <line
          x1={left}
          y1={CY}
          x2={left + sh.w}
          y2={CY}
          stroke="var(--ink)"
          strokeWidth="1.4"
        />
      ) : (
        <g>
          <rect
            x={left}
            y={CY - sh.h / 2}
            width={sh.w}
            height={sh.h}
            fill="none"
            stroke="var(--ink)"
            strokeWidth="1"
          />
          {Array.from({ length: sh.cols }).map((_, c) =>
            Array.from({ length: sh.rows }).map((_, r) => (
              <circle
                key={`${c}-${r}`}
                cx={left + ((c + 1) * sh.w) / (sh.cols + 1)}
                cy={CY - sh.h / 2 + ((r + 1) * sh.h) / (sh.rows + 1)}
                r={3}
                fill="var(--ink)"
              />
            )),
          )}
        </g>
      )}

      <text
        x={CX}
        y={H - 10}
        textAnchor="middle"
        className="font-mono"
        fontSize={12 * k}
        fill="var(--ink-faint)"
      >
        {label}
      </text>
    </svg>
  );
}

export function WhatTheProbeProves() {
  const locale = useLocale();
  const s = pickText(TEXT, locale);
  const { ref, compact } = useCompact(620);
  const k = compact ? 1.65 : 1;
  const still = useReducedMotion();
  const [probe, setProbe] = useState<Probe>("line");
  const [ran, setRan] = useState(false);

  const score = SCORE[probe];
  const shown = (v: number) => (ran ? v.toFixed(2) : s.notRun);

  const panel = (which: "trained" | "control") => {
    const head = which === "trained" ? s.trainedHead : s.controlHead;
    const value = which === "trained" ? score.trained : score.control;
    return (
      <div className="min-w-0 border border-rule bg-paper">
        <div className="border-b border-rule px-4 py-3">
          <p className="label !text-ink">{head}</p>
          {which === "control" ? (
            <p className="label mt-1 !normal-case !tracking-normal !text-[0.7rem]">
              {s.controlSub} <span className="!text-ink-faint">({s.controlTag})</span>
            </p>
          ) : compact ? null : (
            /* keeps the two headers on one baseline when the panels sit side by side */
            <p className="label mt-1 !normal-case !tracking-normal !text-[0.7rem]">&nbsp;</p>
          )}
        </div>

        <div className="px-4 pt-3">
          <Glyph
            probe={probe}
            which={which}
            label={s.probeGlyph}
            k={k}
            ariaLabel={s.aria(head, s.probeName[probe], shown(value))}
          />
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="label !normal-case !tracking-normal">{s.probeName[probe]}</span>
            <span className="label tnum !text-ink">{shown(value)}</span>
          </div>
          <div className="relative mt-2 h-3 w-full bg-rule">
            <div
              className="h-full bg-imagine"
              style={{
                width: `${(ran ? value : 0) * 100}%`,
                transition: `width ${still ? 0 : 400}ms cubic-bezier(0.16, 1, 0.3, 1)`,
              }}
            />
            <span
              className="absolute top-0 h-3 w-px bg-ink"
              style={{ left: `${CHANCE * 100}%` }}
              aria-hidden="true"
            />
          </div>
          <p className="label mt-1 !normal-case !tracking-normal !text-[0.68rem]">
            <span style={{ marginInlineStart: `${CHANCE * 100}%` }}>
              {s.chance} <span className="tnum">{CHANCE.toFixed(2)}</span>
            </span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div
        ref={ref}
        className={`grid gap-4 px-4 pt-6 pb-2 md:px-8 ${compact ? "grid-cols-1" : "grid-cols-2"}`}
      >
        {panel("trained")}
        {panel("control")}
      </div>

      <div
        data-print-hide
        className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8"
      >
        <div className="flex flex-wrap gap-2">
          {PROBES.map((p) => {
            const on = probe === p;
            return (
              <button
                key={p}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setProbe(p);
                  setRan(false);
                }}
                className={`h-9 border px-3 transition-colors ${
                  on
                    ? "border-imagine bg-imagine text-paper"
                    : "border-rule-strong bg-paper text-ink hover:border-ink"
                }`}
              >
                <span className={`label !text-[0.62rem] ${on ? "!text-paper" : "!text-ink"}`}>
                  {s.probeName[p]}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setRan(true)}
          className="h-9 border border-rule-strong bg-paper px-3 text-ink transition-colors hover:border-ink"
        >
          <span className="label !text-[0.62rem] !text-ink">{s.run}</span>
        </button>

        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {ran ? s.verdict[probe] : s.verdict.none}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [s.trainedCell, shown(score.trained)],
          [s.controlCell, shown(score.control)],
          [s.licenceCell, ran ? s.licence[probe] : s.notRun],
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
