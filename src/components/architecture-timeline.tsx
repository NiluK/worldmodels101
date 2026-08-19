"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

/**
 * One architecture, assembled across sixty years.
 *
 * Each era switches parts on, relabels them, or retargets the prediction. Parts
 * that do not exist yet stay as dashed outlines rather than being faded out:
 * dimming text below full opacity drops it under AA, and "not invented yet" is
 * a shape distinction, not a brightness one.
 */

type NodeId = "obs" | "enc" | "lat" | "dyn" | "dec" | "pred" | "ctl";

const NODES: Record<NodeId, { x: number; y: number; w: number; label: string }> = {
  obs:  { x: 8,   y: 40,  w: 128, label: "Observation" },
  enc:  { x: 158, y: 40,  w: 118, label: "Encoder" },
  lat:  { x: 298, y: 40,  w: 118, label: "Latent" },
  dyn:  { x: 438, y: 40,  w: 128, label: "Dynamics" },
  dec:  { x: 588, y: 40,  w: 118, label: "Decoder" },
  pred: { x: 728, y: 40,  w: 138, label: "Prediction" },
  ctl:  { x: 438, y: 168, w: 128, label: "Controller" },
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

const ERAS: Era[] = [
  {
    when: "1960", who: "Kalman",
    on: ["obs", "lat", "dyn", "dec", "pred"],
    labels: { lat: "State estimate", dyn: "Dynamics (given)" },
    focus: ["lat"],
    note: "Recover a hidden state from noisy measurements by running a forward model and correcting it against what you observe. The dynamics are supplied, not learned, and nothing here asks what happens if I act.",
  },
  {
    when: "1990", who: "Schmidhuber · Sutton",
    on: ["obs", "lat", "dyn", "dec", "pred", "ctl"],
    labels: { dyn: "Dynamics (learned)" },
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
    labels: { dyn: "Latent dynamics", pred: "Imagined rollout" },
    focus: ["dyn", "pred"],
    note: "The dynamics move fully into latent space and are learned straight from pixels. Planning happens there too, and Dreamer trains behaviour across long imagined trajectories rather than single steps.",
  },
  {
    when: "2023–25", who: "I-JEPA · V-JEPA 2",
    on: ["obs", "enc", "lat", "dyn", "pred", "ctl"],
    labels: { pred: "Predicted embedding" },
    focus: ["dec", "pred"],
    note: "The prediction target moves off the pixels. Predict a summary of the next frame instead of the frame, and the decoder stops being necessary, which is exactly why the forecast can be thrown away and the features kept.",
  },
  {
    when: "2024–26", who: "Genie · Cosmos · Marble",
    on: ["obs", "enc", "lat", "dyn", "dec", "pred"],
    labels: { dec: "Decoder", pred: "A world you can enter" },
    focus: ["dec", "pred"],
    note: "The decoder becomes the product. Scale it far enough and the output is no longer a predicted frame but an environment you can steer. That is where the word arrived at its newest and loudest meaning.",
  },
];

export function ArchitectureTimeline() {
  const still = useReducedMotion();
  const [i, setI] = useState(0);
  const era = ERAS[i];
  const on = (id: NodeId) => era.on.includes(id);
  const hot = (id: NodeId) => era.focus.includes(id);

  return (
    <div>
      <div className="overflow-x-auto px-5 pt-6 md:px-8">
        <svg viewBox="0 0 880 250" className="block w-full min-w-[620px]" role="img"
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
            className="font-mono" fontSize="10" letterSpacing="1"
            fill={on("ctl") ? "var(--imagine)" : "var(--ink-faint)"}>
            action
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
                  fontFamily="var(--font-body)" fontSize="14.5"
                  fill={live ? "var(--ink)" : "var(--ink-faint)"}>
                  {era.labels?.[id] ?? n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* the scrubber */}
      <div className="mt-2 flex flex-wrap gap-px border-t border-rule bg-rule px-0">
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
              {e.who}
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
          {era.note}
        </motion.p>
      </div>
    </div>
  );
}
