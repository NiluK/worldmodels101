"use client";

import { useEffect, useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import type { Locale } from "@/lib/i18n";

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

const TEXT: Record<Locale, Strings> = {
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
      horizon: "Measured first, by the people who had to act on the model's word.",
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
  zh: {
    name: {
      persistence: "持久性",
      action: "动作",
      horizon: "预测步长",
      target: "训练目标",
      verification: "可验证性",
    },
    question: {
      persistence: "同一个物体离开视野再回来之后，还是它自己吗？",
      action: "不同指令是否稳定地产生各自对应的不同未来？",
      horizon: "它吃着自己的输出能跑多远，答案才不再足以支撑决策？",
      target: "训练目标允许丢掉或塌缩哪些信息？",
      verification: "什么观测能证明它声称拥有的内部模型其实并不存在？",
    },
    who: {
      persistence: "做渲染器的人。这是演示里人人都会注意到的失败，第一章的回头测试就是为它设计的。",
      action: "需要靠「如果这样做会怎样」来做决定的人，也就是控制与机器人学。",
      horizon: "强化学习。相信坏模型的智能体会输，而输掉会直接体现在分数里。",
      target: "表征学习。在那里，一个嵌入可以看上去很稳定，却已经丢掉了任务需要的那个变量。",
      verification: "可解释性研究，也就是读网络内部的人。",
    },
    measured: {
      persistence: "2026 年，PlayWorld，它给物体离开视野又回来之后的表现打分。",
      action:
        "2024 年，Kang 与同事测试了训练数据之内与之外的物理规律。2026 年，PlayWorld 给交互保真度打分：一个动作是否做了它该做的事。",
      horizon:
        "2019 年，Wang 与同事（Benchmarking Model-Based Reinforcement Learning）以及 Janner 与同事（When to Trust Your Model）。",
      target: "未测量（在本章的来源里）。",
      verification: "2022 年，Li 与同事（Emergent World Representations），用的是一个本可能什么都找不到的探针。",
    },
    verdict: {
      none: "五个失败，五个社群。把日期从左读到右。",
      persistence: "比预测步长晚了七年才被测量，而这两个恰恰是渲染器最先撞上的。",
      action: "比预测步长晚了七年才被测量，而这两个恰恰是渲染器最先撞上的。",
      horizon: "最早被测量，测量它的是那些必须按模型的话去行动的人。",
      target: "本章的来源里没有任何东西测量它。",
      verification: "用一个本可能什么都画不出来的探针去检验，这正是它算得上一次测试的原因。",
    },
    whoLabel: "谁最先撞上它",
    measuredLabel: "最早测量",
    pick: "点一张上面的卡片。",
    notMeasured: "未测量",
    ariaStrip: "每个失败最早被测量的年份，2019 至 2026。",
    ariaSelected: "已选",
    ariaNone: "未选择",
  },
};

export function FiveFailures() {
  const locale = useLocale();
  const s = TEXT[locale] ?? TEXT.en;
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
              className={`block w-full border px-3 py-3 text-left transition-colors ${
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
