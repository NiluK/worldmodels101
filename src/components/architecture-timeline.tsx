"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useCompact } from "./use-compact";
import { useT, useLocale } from "./locale-provider";

/**
 * One architecture, assembled across sixty years.
 *
 * Each era switches parts on, relabels them, or retargets the prediction. Parts
 * that do not exist yet stay as dashed outlines rather than being faded out:
 * dimming text below full opacity drops it under AA, and "not invented yet" is
 * a shape distinction, not a brightness one.
 */

type NodeId = "obs" | "enc" | "lat" | "dyn" | "dec" | "pred" | "ctl";

const NODES: Record<NodeId, { x: number; y: number; w: number; key: string }> = {
  obs:  { x: 8,   y: 40,  w: 128, key: "arch.observation" },
  enc:  { x: 158, y: 40,  w: 118, key: "arch.encoder" },
  lat:  { x: 298, y: 40,  w: 118, key: "arch.latent" },
  dyn:  { x: 438, y: 40,  w: 128, key: "arch.dynamics" },
  dec:  { x: 588, y: 40,  w: 118, key: "arch.decoder" },
  pred: { x: 728, y: 40,  w: 138, key: "arch.prediction" },
  ctl:  { x: 438, y: 168, w: 128, key: "arch.controller" },
};

const FLOW: [NodeId, NodeId][] = [
  ["obs", "enc"], ["enc", "lat"], ["lat", "dyn"], ["dyn", "dec"], ["dec", "pred"],
];

type Era = {
  when: string;
  who: string;
  on: NodeId[];
  labels?: Partial<Record<NodeId, string>>;
  /** the part this era actually contributed */
  focus: NodeId[];
  note: string;
};

const ERAS_EN_NOTES = [
  "Recover a hidden state from noisy measurements by running a forward model and correcting it against what you observe. The dynamics are supplied, not learned, and nothing here asks what happens if I act.",
  "One network models the world, another chooses actions, and the first predicts what the second's choices will do. Dyna adds the other half: plan inside the learned model, not only in the world.",
  "An encoder squeezes each frame to a short list of numbers, a recurrent dynamics model predicts where those numbers go next, and a small controller is trained almost entirely inside the model's own rollouts.",
  "The dynamics move fully into latent space and are learned straight from pixels. Planning happens there too, and Dreamer trains behaviour across long imagined trajectories rather than single steps.",
  "The prediction target moves off the pixels. Predict a summary of the next frame instead of the frame, and the decoder stops being necessary, which is exactly why the forecast can be thrown away and the features kept.",
  "The decoder becomes the product. Scale it far enough and the output is no longer a predicted frame but an environment you can steer. That is where the word arrived at its newest and loudest meaning.",
];

/** Era copy per locale. Labels are dictionary keys so the diagram stays in step. */
const ERA_TEXT: Record<string, Record<string, { who: string; note: string }>> = {
  en: {
    "1960": { who: "Rudolf Kalman", note: ERAS_EN_NOTES[0] },
    "1990": { who: "Jürgen Schmidhuber · Richard Sutton", note: ERAS_EN_NOTES[1] },
    "2018": { who: "David Ha & Jürgen Schmidhuber", note: ERAS_EN_NOTES[2] },
    "2018–19": { who: "PlaNet · Dreamer", note: ERAS_EN_NOTES[3] },
    "2023–25": { who: "I-JEPA · V-JEPA 2", note: ERAS_EN_NOTES[4] },
    "2024–26": { who: "Genie · Cosmos · Marble", note: ERAS_EN_NOTES[5] },
  },
  zh: {
    "1960": {
      who: "鲁道夫·卡尔曼",
      note: "通过运行一个前向模型、并用观测到的结果去修正它，从带噪声的测量里恢复出隐藏状态。动力学是给定的，不是学出来的，而且这里没有任何东西会问「如果我采取行动会怎样」。",
    },
    "1990": {
      who: "Jürgen Schmidhuber · Richard Sutton",
      note: "一个网络给世界建模，另一个选择动作，而前者预测后者的选择会带来什么。Dyna 补上了另一半：不只在世界里规划，也在学出来的模型里规划。",
    },
    "2018": {
      who: "David Ha 与 Jürgen Schmidhuber",
      note: "一个编码器把每一帧压成一小串数字，一个循环动力学模型预测这串数字接下来往哪走，还有一个几乎完全在模型自己的推演里训练出来的小控制器。",
    },
    "2018–19": {
      who: "PlaNet · Dreamer",
      note: "动力学彻底搬进潜在空间，并且直接从像素里学出来。规划也发生在那里，而 Dreamer 是跨越长长一段想象出来的轨迹去训练行为，而不是只看一步。",
    },
    "2023–25": {
      who: "I-JEPA · V-JEPA 2",
      note: "预测目标从像素上移开。预测的是下一帧的摘要而不是这一帧本身，于是解码器不再必要，而这正是预测可以被丢掉、特征却留下来的原因。",
    },
    "2024–26": {
      who: "Genie · Cosmos · Marble",
      note: "解码器变成了产品本身。把它放大到足够程度，输出就不再是一帧预测，而是一个你可以操控、可以走进去的环境，这个词也就抵达了它最新、也最喧闹的含义。",
    },
  },
};

const ERAS: Era[] = [
  {
    when: "1960", who: "Kalman",
    on: ["obs", "lat", "dyn", "dec", "pred"],
    labels: { lat: "arch.stateEstimate", dyn: "arch.dynamicsGiven" },
    focus: ["lat"],
    note: "Recover a hidden state from noisy measurements by running a forward model and correcting it against what you observe. The dynamics are supplied, not learned, and nothing here asks what happens if I act.",
  },
  {
    when: "1990", who: "Schmidhuber · Sutton",
    on: ["obs", "lat", "dyn", "dec", "pred", "ctl"],
    labels: { dyn: "arch.dynamicsLearned" },
    focus: ["ctl", "dyn"],
    note: "One network models the world, another chooses actions, and the first predicts what the second's choices will do. Dyna adds the other half: plan inside the learned model, not only in the world.",
  },
  {
    when: "2018", who: "Ha & Schmidhuber",
    on: ["obs", "enc", "lat", "dyn", "dec", "pred", "ctl"],
    focus: ["enc"],
    note: "An encoder squeezes each frame to a short list of numbers, a recurrent dynamics model predicts where those numbers go next, and a small controller is trained almost entirely inside the model's own rollouts.",
  },
  {
    when: "2018–19", who: "PlaNet · Dreamer",
    on: ["obs", "enc", "lat", "dyn", "dec", "pred", "ctl"],
    labels: { dyn: "arch.latentDynamics", pred: "arch.imaginedRollout" },
    focus: ["dyn", "pred"],
    note: "The dynamics move fully into latent space and are learned straight from pixels. Planning happens there too, and Dreamer trains behaviour across long imagined trajectories rather than single steps.",
  },
  {
    when: "2023–25", who: "I-JEPA · V-JEPA 2",
    on: ["obs", "enc", "lat", "dyn", "pred", "ctl"],
    labels: { pred: "arch.predEmbedding" },
    focus: ["dec", "pred"],
    note: "The prediction target moves off the pixels. Predict a summary of the next frame instead of the frame, and the decoder stops being necessary, which is exactly why the forecast can be thrown away and the features kept.",
  },
  {
    when: "2024–26", who: "Genie · Cosmos · Marble",
    on: ["obs", "enc", "lat", "dyn", "dec", "pred"],
    labels: { dec: "arch.decoder", pred: "arch.aWorld" },
    focus: ["dec", "pred"],
    note: "The decoder becomes the product. Scale it far enough and the output is no longer a predicted frame but an environment you can steer. That is where the word arrived at its newest and loudest meaning.",
  },
];

export function ArchitectureTimeline() {
  const still = useReducedMotion();
  const { ref, compact } = useCompact(620);
  const k = compact ? 1.65 : 1;
  const [i, setI] = useState(0);
  const t = useT();
  const locale = useLocale();
  const era = ERAS[i];
  const eraText = ERA_TEXT[locale]?.[era.when] ?? ERA_TEXT.en[era.when];
  const on = (id: NodeId) => era.on.includes(id);
  const hot = (id: NodeId) => era.focus.includes(id);

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox="0 0 880 250" className="block w-full" role="img"
          aria-label={`Architecture as of ${era.when}: ${era.note}`}>
          <defs>
            <marker id="ar" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6" fill="none" stroke="var(--ink-muted)" strokeWidth="1.3" />
            </marker>
          </defs>

          {FLOW.map(([a, b]) => {
            const live = on(a) && on(b);
            const A = NODES[a], B = NODES[b];
            return (
              <motion.line
                key={`${a}-${b}`}
                x1={A.x + A.w + 4} y1={A.y + 26} x2={B.x - 6} y2={B.y + 26}
                stroke="var(--ink-muted)"
                strokeWidth={live ? 1.4 : 1}
                strokeDasharray={live ? "0" : "3 4"}
                markerEnd={live ? "url(#ar)" : undefined}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            );
          })}

          {/* the action arm: what separates a state estimator from a world model */}
          <motion.path
            d={`M ${NODES.ctl.x + NODES.ctl.w / 2} ${NODES.ctl.y - 6} L ${NODES.ctl.x + NODES.ctl.w / 2} ${NODES.dyn.y + 58}`}
            stroke={on("ctl") ? "var(--imagine)" : "var(--ink-muted)"}
            strokeWidth={on("ctl") ? 1.8 : 1}
            strokeDasharray={on("ctl") ? "0" : "3 4"}
            markerEnd={on("ctl") ? "url(#ar)" : undefined}
            fill="none"
          />
          <text x={NODES.ctl.x + NODES.ctl.w / 2 + 8} y={NODES.dyn.y + 88}
            className="font-mono" fontSize={10 * k} letterSpacing="1"
            fill={on("ctl") ? "var(--imagine)" : "var(--ink-faint)"}>
            {t("arch.action")}
          </text>

          {(Object.keys(NODES) as NodeId[]).map((id) => {
            const n = NODES[id];
            const live = on(id);
            return (
              <g key={id}>
                <motion.rect
                  x={n.x} y={n.y} width={n.w} height={52}
                  fill={hot(id) && live ? "var(--imagine-soft)" : "var(--paper)"}
                  stroke={hot(id) && live ? "var(--imagine)" : live ? "var(--ink)" : "var(--rule-strong)"}
                  strokeWidth={hot(id) && live ? 2 : live ? 1.3 : 1}
                  strokeDasharray={live ? "0" : "4 4"}
                  animate={still ? {} : { scale: hot(id) && live ? 1.02 : 1 }}
                  style={{ transformOrigin: `${n.x + n.w / 2}px ${n.y + 26}px` }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                />
                <text x={n.x + n.w / 2} y={n.y + 31} textAnchor="middle"
                  fontFamily="var(--font-body)" fontSize={14.5 * k}
                  fill={live ? "var(--ink)" : "var(--ink-faint)"}>
                  {era.labels?.[id] ? t(era.labels[id]!) : t(n.key)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* the scrubber */}
      <div data-print-hide className="mt-2 flex flex-wrap gap-px border-t border-rule bg-rule px-0">
        {ERAS.map((e, idx) => (
          <button
            key={e.when}
            onClick={() => setI(idx)}
            aria-pressed={idx === i}
            className={`flex-1 basis-[8rem] px-3 py-3 text-left transition-colors ${
              idx === i ? "bg-paper" : "bg-paper-raised hover:bg-paper"
            }`}
          >
            <span className={`label tnum block ${idx === i ? "!text-imagine" : ""}`}>{e.when}</span>
            <span className={`mt-1 block font-mono text-[0.7rem] leading-snug ${idx === i ? "text-ink" : "text-ink-muted"}`}>
              {(ERA_TEXT[locale] ?? ERA_TEXT.en)[e.when]?.who ?? e.who}
            </span>
          </button>
        ))}
      </div>

      <div className="border-t border-rule bg-paper px-5 py-5 md:px-8">
        <motion.p
          key={era.when}
          initial={still ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="max-w-[62ch] text-[0.98rem] leading-relaxed text-ink-muted"
        >
          {eraText?.note ?? era.note}
        </motion.p>
      </div>
    </div>
  );
}
