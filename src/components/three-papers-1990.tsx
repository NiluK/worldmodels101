"use client";

import { useReducedMotion } from "motion/react";
import { useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import type { Locale } from "@/lib/i18n";

/**
 * Three papers from 1990 and 1991, drawn as three small loops.
 *
 * Each card is one system: a world, a learned model of what happens next, and
 * a third thing that uses the model to decide. The loops differ in how the
 * third thing is fed (a prediction, imagined experience, a plan), which is the
 * honest reason the papers look different. The switch dims everything except
 * the two boxes every card has, and the difference goes away.
 */

type Dir = "up" | "down" | "left" | "right";
type Part = "model" | "user" | "other";

type Arrow = {
  d: string;
  end: [number, number];
  dir: Dir;
  /** key into T.arrow; a label with two words may wrap onto a second line */
  label: string;
  at: [number, number];
  anchor?: "start" | "middle" | "end";
  part: Part;
};

type Card = {
  id: "schmidhuber" | "sutton" | "thrun";
  user: "chooser" | "learner" | "planner";
  arrows: Arrow[];
};

const W = 300;
const H = 176;
/** world on the left, model top right, the third thing bottom right */
const WORLD = { x: 10, y: 64, w: 80, h: 34 };
const MODEL = { x: 180, y: 12, w: 110, h: 34 };
const USER = { x: 180, y: 120, w: 110, h: 34 };

const CARDS: Card[] = [
  {
    id: "schmidhuber",
    user: "chooser",
    arrows: [
      { d: `M ${WORLD.x + 40} ${WORLD.y} V 29 H ${MODEL.x - 2}`, end: [MODEL.x, 29], dir: "right",
        label: "real", at: [(WORLD.x + 40 + MODEL.x) / 2, 24], part: "other" },
      { d: `M ${MODEL.x + 30} ${MODEL.y + MODEL.h} V ${USER.y - 2}`, end: [MODEL.x + 30, USER.y], dir: "down",
        label: "predict", at: [MODEL.x + 24, 90], anchor: "end", part: "user" },
      { d: `M ${USER.x + 70} ${USER.y} V ${MODEL.y + MODEL.h + 2}`, end: [USER.x + 70, MODEL.y + MODEL.h], dir: "up",
        label: "choice", at: [USER.x + 76, 90], anchor: "start", part: "other" },
      { d: `M ${USER.x} ${USER.y + 17} H ${WORLD.x + 40} V ${WORLD.y + WORLD.h + 2}`, end: [WORLD.x + 40, WORLD.y + WORLD.h], dir: "up",
        label: "act", at: [(WORLD.x + 40 + USER.x) / 2, USER.y + 30], part: "other" },
    ],
  },
  {
    id: "sutton",
    user: "learner",
    arrows: [
      { d: `M ${WORLD.x + 40} ${WORLD.y} V 29 H ${MODEL.x - 2}`, end: [MODEL.x, 29], dir: "right",
        label: "real", at: [(WORLD.x + 40 + MODEL.x) / 2, 24], part: "other" },
      { d: `M ${MODEL.x + 30} ${MODEL.y + MODEL.h} V ${USER.y - 2}`, end: [MODEL.x + 30, USER.y], dir: "down",
        label: "imagined", at: [MODEL.x + 24, 86], anchor: "end", part: "user" },
      { d: `M ${USER.x} ${USER.y + 10} H ${WORLD.x + 40} V ${WORLD.y + WORLD.h + 2}`, end: [WORLD.x + 40, WORLD.y + WORLD.h], dir: "up",
        label: "act", at: [(WORLD.x + 40 + USER.x) / 2, USER.y + 5], part: "other" },
      { d: `M ${WORLD.x + 20} ${WORLD.y + WORLD.h} V 166 H ${USER.x + 55} V ${USER.y + USER.h + 2}`, end: [USER.x + 55, USER.y + USER.h], dir: "up",
        label: "real", at: [(WORLD.x + 20 + USER.x + 55) / 2, 162], part: "other" },
    ],
  },
  {
    id: "thrun",
    user: "planner",
    arrows: [
      { d: `M ${WORLD.x + 40} ${WORLD.y} V 29 H ${MODEL.x - 2}`, end: [MODEL.x, 29], dir: "right",
        label: "real", at: [(WORLD.x + 40 + MODEL.x) / 2, 24], part: "other" },
      { d: `M ${MODEL.x + 55} ${MODEL.y + MODEL.h} V ${USER.y - 2}`, end: [MODEL.x + 55, USER.y], dir: "down",
        label: "predict", at: [MODEL.x + 49, 90], anchor: "end", part: "user" },
      { d: `M ${USER.x} ${USER.y + 17} H ${WORLD.x + 40} V ${WORLD.y + WORLD.h + 2}`, end: [WORLD.x + 40, WORLD.y + WORLD.h], dir: "up",
        label: "act", at: [(WORLD.x + 40 + USER.x) / 2, USER.y + 30], part: "other" },
    ],
  },
];

function head([x, y]: [number, number], dir: Dir) {
  const s = 5;
  switch (dir) {
    case "right": return `M ${x} ${y} l ${-s} ${-s / 2} v ${s} z`;
    case "left": return `M ${x} ${y} l ${s} ${-s / 2} v ${s} z`;
    case "down": return `M ${x} ${y} l ${-s / 2} ${-s} h ${s} z`;
    case "up": return `M ${x} ${y} l ${-s / 2} ${s} h ${s} z`;
  }
}

type Text = {
  who: Record<Card["id"], string>;
  when: Record<Card["id"], string>;
  title: Record<Card["id"], string>;
  box: Record<"world" | "model" | Card["user"], string>;
  arrow: Record<string, string>;
  does: Record<Card["id"], string>;
  uses: Record<Card["id"], string>;
  doesHead: string;
  usesHead: string;
  toggle: string;
  vOn: string;
  vOff: string;
  vPicked: string;
  aria: (who: string, user: string) => string;
};

const TEXT: Record<Locale, Text> = {
  en: {
    who: {
      schmidhuber: "Jürgen Schmidhuber",
      sutton: "Richard Sutton",
      thrun: "Sebastian Thrun, Knut Möller and Alexander Linden",
    },
    when: { schmidhuber: "1990", sutton: "1991", thrun: "1990" },
    title: {
      schmidhuber: "Making the World Differentiable (technical report FKI-126-90)",
      sutton: "Dyna, an Integrated Architecture for Learning, Planning and Reacting",
      thrun: "Planning with an Adaptive World Model",
    },
    box: { world: "world", model: "model", chooser: "chooser", learner: "learner", planner: "planner" },
    arrow: { real: "real experience", imagined: "imagined\nexperience", predict: "predict", act: "act", choice: "choice" },
    does: {
      schmidhuber: "One network learns to predict what the world will do next.",
      sutton: "It makes up experience of its own, beside the real kind.",
      thrun: "It learns what the system's actions do, and keeps adapting.",
    },
    uses: {
      schmidhuber: "A second network chooses actions. The first tells it what each choice would lead to.",
      sutton: "A learning agent that practises partly on real experience and partly on what the model made up.",
      thrun: "A planner. It runs the model forward to choose better actions.",
    },
    doesHead: "What the model does",
    usesHead: "What uses it",
    toggle: "Show the shared shape",
    vOn: "Three papers, one shape: a learned model, and something else that uses it.",
    vOff: "Three different systems from the same period. Pick one.",
    vPicked: "One of the three. The switch shows what they share.",
    aria: (who, user) => `${who}: a loop of world, learned model and ${user}, drawn as boxes and arrows.`,
  },
  zh: {
    who: {
      schmidhuber: "Jürgen Schmidhuber",
      sutton: "Richard Sutton",
      thrun: "Sebastian Thrun、Knut Möller 与 Alexander Linden",
    },
    when: { schmidhuber: "1990", sutton: "1991", thrun: "1990" },
    title: {
      schmidhuber: "Making the World Differentiable (technical report FKI-126-90)",
      sutton: "Dyna, an Integrated Architecture for Learning, Planning and Reacting",
      thrun: "Planning with an Adaptive World Model",
    },
    box: { world: "世界", model: "模型", chooser: "选择器", learner: "学习者", planner: "规划器" },
    arrow: { real: "真实经验", imagined: "想象的\n经验", predict: "预测", act: "行动", choice: "选择" },
    does: {
      schmidhuber: "一个网络学着预测世界接下来会做什么。",
      sutton: "它在真实经验之外，自己编出经验来。",
      thrun: "它学会自己的动作会带来什么，并且随经验不断调整。",
    },
    uses: {
      schmidhuber: "第二个网络负责选动作。第一个告诉它每个选择会导向什么。",
      sutton: "一个学习的智能体，一部分靠真实经验练习，一部分靠模型编出来的经验练习。",
      thrun: "一个规划器。它把模型往前推演，以选出更好的动作。",
    },
    doesHead: "模型做什么",
    usesHead: "谁使用它",
    toggle: "显示共同的形状",
    vOn: "三篇论文，一个形状：一个学出来的模型，加上另一个使用它的东西。",
    vOff: "同一时期的三个不同系统。挑一个。",
    vPicked: "三个之一。打开开关，看它们共有的部分。",
    aria: (who, user) => `${who}：由世界、学出来的模型和${user}组成的一个环，画成方框和箭头。`,
  },
};

function Schematic({ card, T, shared, big, k }: { card: Card; T: Text; shared: boolean; big: boolean; k: number }) {
  const user = T.box[card.user];
  const boxStroke = (p: Part) => {
    if (!shared) return p === "model" ? "var(--imagine)" : p === "user" ? "var(--actual)" : "var(--ink)";
    return p === "other" ? "var(--rule-strong)" : "var(--imagine)";
  };
  const lineStroke = (p: Part) =>
    shared ? (p === "user" ? "var(--imagine)" : "var(--rule-strong)") : "var(--ink-muted)";
  const textFill = (p: Part) => (shared && p === "other" ? "var(--ink-faint)" : "var(--ink)");
  const fill = (p: Part) => (shared && p !== "other" ? "var(--imagine-soft)" : "none");
  const box = (b: typeof WORLD, p: Part, label: string) => (
    <g>
      <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={fill(p)} stroke={boxStroke(p)}
        strokeWidth={shared && p !== "other" ? 1.8 : 1} strokeDasharray={shared && p === "other" ? "3 3" : undefined} />
      <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 4} textAnchor="middle" fontSize={11 * k}
        fill={textFill(p)} style={{ fontFamily: "var(--font-body)", fontStyle: "italic" }}>
        {label}
      </text>
    </g>
  );
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={T.aria(T.who[card.id], user)}>
      {card.arrows.map((a) => (
        <g key={a.label + a.d}>
          <g opacity={shared && a.part !== "user" ? 0.6 : 1}>
            <path d={a.d} fill="none" stroke={lineStroke(a.part)} strokeWidth={shared && a.part === "user" ? 1.6 : 1} />
            <path d={head(a.end, a.dir)} fill={lineStroke(a.part)} />
          </g>
          {big && (
            <text x={a.at[0]} y={a.at[1]} textAnchor={a.anchor ?? "middle"} fontSize={8.5 * k} letterSpacing="0.5"
              className="font-mono" fill={shared && a.part !== "user" ? "var(--ink-faint)" : "var(--ink-muted)"}>
              {T.arrow[a.label].split("\n").map((line, i) => (
                <tspan key={i} x={a.at[0]} dy={i ? 11 * k : 0}>{line}</tspan>
              ))}
            </text>
          )}
        </g>
      ))}
      {box(WORLD, "other", T.box.world)}
      {box(MODEL, "model", T.box.model)}
      {box(USER, "user", user)}
    </svg>
  );
}

export function ThreePapers1990() {
  const locale = useLocale();
  const T = TEXT[locale] ?? TEXT.en;
  const { ref, compact } = useCompact(720);
  const still = useReducedMotion();
  const [picked, setPicked] = useState<Card["id"] | null>(null);
  const [shared, setShared] = useState(false);

  const cols = compact
    ? undefined
    : CARDS.map((c) => (c.id === picked ? "1.8fr" : "1fr")).join(" ");

  return (
    <div ref={ref}>
      <div
        className={`grid gap-px bg-rule ${compact ? "grid-cols-1" : ""}`}
        style={{
          gridTemplateColumns: cols,
          transition: still || compact ? undefined : "grid-template-columns 320ms ease",
        }}
      >
        {CARDS.map((c) => {
          const on = c.id === picked;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => setPicked(c.id)}
              onFocus={() => setPicked(c.id)}
              className={`flex min-w-0 flex-col items-stretch bg-paper-raised px-5 pt-5 pb-4 text-left outline-none transition-colors focus-visible:bg-paper ${
                on ? "bg-paper" : "hover:bg-paper"
              }`}
            >
              <p className="label">
                {T.who[c.id]} <span className="tnum !text-ink">{T.when[c.id]}</span>
              </p>
              <p className="mt-1 text-[0.82rem] italic leading-snug text-ink-muted">{T.title[c.id]}</p>
              <div className={`mt-3 ${compact ? "mx-auto w-full max-w-[22rem]" : ""}`}>
                <Schematic card={c} T={T} shared={shared} big={on || compact || !picked} k={compact ? 1.3 : 1} />
              </div>
              {on && (
                <dl className="mt-2 grid gap-2 text-[0.82rem] leading-snug text-ink">
                  <div>
                    <dt className="label">{T.doesHead}</dt>
                    <dd className="mt-0.5">{T.does[c.id]}</dd>
                  </div>
                  <div>
                    <dt className="label">{T.usesHead}</dt>
                    <dd className="mt-0.5">{T.uses[c.id]}</dd>
                  </div>
                </dl>
              )}
            </button>
          );
        })}
      </div>

      <div data-print-hide className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <span className="label">{T.toggle}</span>
          <button
            type="button"
            role="switch"
            aria-checked={shared}
            aria-label={T.toggle}
            onClick={() => setShared((v) => !v)}
            className={`relative h-6 w-11 border transition-colors ${
              shared ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"
            }`}
          >
            <span
              className={`absolute top-[3px] h-4 w-4 transition-all ${
                shared ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"
              }`}
            />
          </button>
        </div>
        <p className="label !normal-case !tracking-normal !text-[0.8rem]">
          {shared ? T.vOn : picked ? T.vPicked : T.vOff}
        </p>
      </div>
    </div>
  );
}
