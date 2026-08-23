"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * One phrase, three papers, three jobs.
 *
 * A card set rather than a diagram, because the three papers are not a system
 * and drawing arrows between them would invent a lineage the chapter does not
 * claim. Clicking a card says what that model was for; the modern line pairs
 * each paper with a system from this chapter doing the same job, and only that.
 *
 * Every name, title and year is from the chapter, so nothing here is
 * illustrative.
 */

const CARDS = [
  { title: "Making the World Differentiable", now: "Dreamer, 2019" },
  { title: "Planning with an Adaptive World Model", now: "PlaNet, 2018 and MuZero, 2020" },
  { title: "Dyna, an Integrated Architecture for Learning, Planning and Reacting", now: "MBPO, 2019" },
] as const;

type Strings = {
  who: [string, string, string];
  short: [string, string, string];
  jobs: [string, string, string];
  jobsVerdict: [string, string, string];
  said: [string, string, string];
  nowLabel: string;
  showNow: string;
  hideNow: string;
  groupLabel: string;
  reads: [string, string, string, string];
  none: string;
  vNone: string;
  vSelected: (author: string, job: string) => string;
  vNow: string;
  join: string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    who: ["Schmidhuber, 1990", "Thrun, Möller and Linden, 1990", "Sutton, 1991"],
    short: ["Schmidhuber", "Thrun", "Sutton"],
    jobs: ["push a gradient through it", "search inside it", "make experience from it"],
    jobsVerdict: ["pushed a gradient through", "searched inside", "made experience from"],
    said: [
      "One network predicted what the other network's actions would lead to, and the prediction is what the chooser was improved against.",
      "The system learned what its actions did by trying them, then ran that knowledge forward to pick better ones.",
      "The model made up experience, and the agent learned from the made up experience as well as the real kind.",
    ],
    nowLabel: "now",
    showNow: "Who does this now",
    hideNow: "Hide",
    groupLabel: "Three papers from 1990 and 1991, each using the phrase world model for a different job.",
    reads: ["papers", "years apart", "jobs for one phrase", "selected"],
    none: "none",
    vNone: "One phrase, printed on three papers within a year of each other.",
    vSelected: (author, job) => `${author}'s model was there to be ${job}.`,
    vNow: "Three jobs then, the same three jobs now. Nobody has added a fourth.",
    join: " ",
  },
  zh: {
    who: ["Schmidhuber，1990", "Thrun、Möller 与 Linden，1990", "Sutton，1991"],
    short: ["Schmidhuber", "Thrun", "Sutton"],
    jobs: ["把梯度推过去", "在里面搜索", "从它那里造出经验"],
    jobsVerdict: ["把梯度推过去", "在里面搜索", "从它那里造出经验"],
    said: [
      "一个网络预测另一个网络选出的动作会导向什么，而做选择的那个，正是拿这份预测来改进的。",
      "这个系统靠亲自去试，学会自己的动作会带来什么，再把这份知识往前推演，挑出更好的动作。",
      "模型编出经验来，智能体既从编出来的经验里学，也从真实的那一种里学。",
    ],
    nowLabel: "现在",
    showNow: "现在谁在做这件事",
    hideNow: "收起",
    groupLabel: "1990 与 1991 年的三篇论文，同一个说法在每篇里做的是不同的活。",
    reads: ["论文", "相隔年数", "一个说法的用法", "已选"],
    none: "无",
    vNone: "一个说法，印在相隔不到一年的三篇论文上。",
    vSelected: (author, job) => `${author} 的模型，是拿来${job}的。`,
    vNow: "当年是这三种用法，如今还是这三种。没有人加出第四种。",
    join: "",
  },
};

export function OneNameThreeJobs() {
  const still = useReducedMotion();
  const locale = useLocale();
  const s = pickText(TEXT, locale);
  const { ref, compact } = useCompact(640);

  const [selected, setSelected] = useState<number | null>(null);
  const [showNow, setShowNow] = useState(false);

  const verdict = [
    selected === null ? s.vNone : s.vSelected(s.short[selected], s.jobsVerdict[selected]),
    showNow ? s.vNow : "",
  ]
    .filter(Boolean)
    .join(s.join);

  return (
    <div>
      <div
        ref={ref}
        role="group"
        aria-label={s.groupLabel}
        className={`grid gap-px bg-rule ${compact ? "grid-cols-1" : "grid-cols-3"}`}
      >
        {CARDS.map((card, i) => {
          const on = selected === i;
          return (
            <button
              key={card.title}
              type="button"
              aria-pressed={on}
              onClick={() => setSelected((v) => (v === i ? null : i))}
              className={`flex flex-col gap-2 px-5 py-5 text-left transition-colors md:px-6 ${
                on ? "bg-paper-raised" : "bg-paper hover:bg-paper-raised"
              }`}
            >
              <span className={`label ${on ? "!text-ink" : ""}`}>{s.who[i]}</span>
              <span className="font-body text-[0.95rem] italic leading-snug text-ink">
                {card.title}
              </span>
              <span className="label !normal-case !tracking-normal !text-[0.8rem] !text-imagine">
                {s.jobs[i]}
              </span>
              {showNow && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: still ? 0 : 0.2 }}
                  className="font-mono text-[0.72rem] tracking-wide text-ink-muted"
                >
                  {s.nowLabel} {card.now}
                </motion.span>
              )}
              {on && (
                <motion.span
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: still ? 0 : 0.2 }}
                  className="block overflow-hidden border-t border-rule pt-2 text-[0.88rem] leading-relaxed text-ink-muted"
                >
                  {s.said[i]}
                </motion.span>
              )}
            </button>
          );
        })}
      </div>

      <div data-print-hide className="flex flex-col gap-4 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={showNow}
            onClick={() => setShowNow((v) => !v)}
            className={`border px-3 py-1.5 font-mono text-[0.7rem] transition-colors ${
              showNow
                ? "border-imagine bg-imagine text-paper"
                : "border-rule-strong bg-paper text-ink hover:border-ink"
            }`}
          >
            {showNow ? s.hideNow : s.showNow}
          </button>
        </div>

        <motion.p
          key={verdict}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: still ? 0 : 0.2 }}
          aria-live="polite"
          className="label max-w-[62ch] !normal-case !tracking-normal !text-[0.8rem]"
        >
          {verdict}
        </motion.p>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-rule bg-rule sm:grid-cols-4">
        {[
          [s.reads[0], "3"],
          [s.reads[1], "1"],
          [s.reads[2], "3"],
          [s.reads[3], selected === null ? s.none : s.short[selected]],
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
