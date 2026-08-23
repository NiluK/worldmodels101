"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";

/**
 * State against observation.
 *
 * A room seen from above, a camera in the middle with a wedge of view. Every
 * object is still drawn when the camera looks away, only thinner: it has not
 * stopped existing, it has stopped being visible. The ball keeps rolling
 * whether or not the wedge covers it, which is the whole point of the
 * "step time" button: the state changes, and the last observation does not.
 */

const W = 560;
const H = 400;
const ROOM = { x: 20, y: 20, w: 520, h: 360 };
const CAM = { x: 280, y: 200 };
const HALF_FOV = 35;
/** ball track along the bottom of the room, in SVG units; metres are (x - 20) / 65 */
const BALL_Y = 340;
const BALL_XS = [500, 435, 370, 305, 240, 175, 110];

type Id = "chair" | "ball" | "cupboard" | "table";
const ORDER: Id[] = ["chair", "ball", "cupboard", "table"];
const FIXED: Record<Exclude<Id, "ball">, { x: number; y: number }> = {
  chair: { x: 120, y: 90 },
  cupboard: { x: 60, y: 230 },
  table: { x: 440, y: 90 },
};

const TEXT = {
  en: {
    chair: "chair", ball: "ball", cupboard: "cupboard", table: "table",
    chairFact: "here", tableFact: "here",
    cupboardFact: "open",
    ballLeft: "rolling left, at {m} m", ballRight: "rolling right, at {m} m",
    unknown: "?",
    state: "State", stateNote: "what is there",
    obs: "Observation", obsNote: "what the camera sees now",
    turn: "Turn the camera", step: "Step time",
    heading: "Heading", inView: "In view", time: "Time step",
    ofFour: "{n} of 4",
    count: ["All four things are in view.", "One of four things is out of view. It is still there.",
      "Two of four things are out of view. They are still there.",
      "Three of four things are out of view. They are still there.",
      "All four things are out of view. They are still there."],
    moved: "The ball moved while you were turned away. The state changed; your last observation did not.",
    aria: "A room seen from above with a chair, a rolling ball, a cupboard and a table. The camera points at {deg} degrees and can see: {seen}.",
    nothing: "nothing",
  },
  zh: {
    chair: "椅子", ball: "球", cupboard: "橱柜", table: "桌子",
    chairFact: "在这里", tableFact: "在这里",
    cupboardFact: "开着",
    ballLeft: "向左滚动，位于 {m} 米处", ballRight: "向右滚动，位于 {m} 米处",
    unknown: "？",
    state: "状态", stateNote: "实际存在的东西",
    obs: "观测", obsNote: "摄像机此刻看到的东西",
    turn: "转动摄像机", step: "时间前进一步",
    heading: "朝向", inView: "在视野内", time: "时间步",
    ofFour: "{n} / 4",
    count: ["四件东西都在视野里。", "四件东西中有一件不在视野里。它仍然在那里。",
      "四件东西中有两件不在视野里。它们仍然在那里。",
      "四件东西中有三件不在视野里。它们仍然在那里。",
      "四件东西都不在视野里。它们仍然在那里。"],
    moved: "你转开的时候球动了。状态变了，你上一次的观测没有变。",
    aria: "从上方俯视的房间，里面有椅子、一个滚动的球、橱柜和桌子。摄像机朝向 {deg} 度，能看到：{seen}。",
    nothing: "什么都看不到",
  },
};

const pol = (deg: number, r: number) => ({
  x: CAM.x + r * Math.cos((deg * Math.PI) / 180),
  y: CAM.y + r * Math.sin((deg * Math.PI) / 180),
});

function inWedge(heading: number, p: { x: number; y: number }) {
  const a = (Math.atan2(p.y - CAM.y, p.x - CAM.x) * 180) / Math.PI;
  const d = Math.abs(((a - heading + 540) % 360) - 180);
  return d <= HALF_FOV;
}

function ballOf(step: number) {
  const period = (BALL_XS.length - 1) * 2;
  const i = step % period;
  const idx = i < BALL_XS.length ? i : period - i;
  return { x: BALL_XS[idx], left: i < BALL_XS.length - 1 };
}

export function StateObservation() {
  const locale = useLocale();
  const s = TEXT[locale] ?? TEXT.en;
  const still = useReducedMotion();
  /** stack the table under the drawing below 720px; enlarge SVG type below 480px */
  const { ref, compact: stack } = useCompact(720);
  const { ref: innerRef, compact } = useCompact(480);
  const k = compact ? 2 : 1;

  const [heading, setHeading] = useState(30);
  const [step, setStep] = useState(0);
  /** the ball's time step when the camera last had it in view, null if never */
  const [seenAt, setSeenAt] = useState<number | null>(0);
  const [moved, setMoved] = useState(false);

  const ball = ballOf(step);
  const pos: Record<Id, { x: number; y: number }> = { ...FIXED, ball: { x: ball.x, y: BALL_Y } };
  const seen = (h: number, id: Id) => inWedge(h, pos[id]);
  const visible = ORDER.filter((id) => seen(heading, id));
  const hidden = 4 - visible.length;

  const turn = (h: number) => {
    const ballNow = inWedge(h, pos.ball);
    if (ballNow && seenAt !== null && seenAt !== step) setMoved(true);
    if (ballNow) setSeenAt(step);
    if (!ballNow) setMoved(false);
    setHeading(h);
  };
  const stepTime = () => {
    const next = step + 1;
    const b = ballOf(next);
    if (inWedge(heading, { x: b.x, y: BALL_Y })) { setSeenAt(next); setMoved(false); }
    setStep(next);
  };

  const metres = ((ball.x - 20) / 65).toFixed(1);
  const fact: Record<Id, string> = {
    chair: s.chairFact,
    table: s.tableFact,
    cupboard: s.cupboardFact,
    ball: (ball.left ? s.ballLeft : s.ballRight).replace("{m}", metres),
  };

  const a0 = pol(heading - HALF_FOV, 600);
  const a1 = pol(heading + HALF_FOV, 600);
  const wedge = `M ${CAM.x} ${CAM.y} L ${a0.x.toFixed(1)} ${a0.y.toFixed(1)} A 600 600 0 0 1 ${a1.x.toFixed(1)} ${a1.y.toFixed(1)} Z`;
  const stroke = (id: Id) => (seen(heading, id) ? "var(--ink)" : "var(--rule-strong)");
  const sw = (id: Id) => (seen(heading, id) ? 1.6 : 0.75);
  const fs = 10.5 * k;

  return (
    <div ref={ref}>
      <div ref={innerRef} className={`flex ${stack ? "flex-col" : "flex-row items-stretch"}`}>
        <div className={`${stack ? "" : "w-[58%] border-r border-rule"} px-4 pt-5 pb-4 md:px-6`}>
          <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
            aria-label={s.aria.replace("{deg}", String(heading))
              .replace("{seen}", visible.length ? visible.map((id) => s[id]).join(", ") : s.nothing)}>
            <defs>
              <clipPath id="so-room"><rect x={ROOM.x} y={ROOM.y} width={ROOM.w} height={ROOM.h} /></clipPath>
            </defs>
            <rect x={ROOM.x} y={ROOM.y} width={ROOM.w} height={ROOM.h} fill="var(--paper-sunk)" stroke="var(--rule-strong)" strokeWidth="1.2" />
            <path d={wedge} fill="var(--imagine-soft)" clipPath="url(#so-room)" />
            <path d={wedge} fill="none" stroke="var(--imagine)" strokeWidth="1" strokeDasharray="3 3" clipPath="url(#so-room)" />

            {/* chair: seat and back */}
            <g stroke={stroke("chair")} strokeWidth={sw("chair")} fill={seen(heading, "chair") ? "var(--paper-raised)" : "none"}>
              <rect x={FIXED.chair.x - 16} y={FIXED.chair.y - 14} width={32} height={32} />
              <rect x={FIXED.chair.x - 18} y={FIXED.chair.y - 22} width={36} height={8} />
            </g>
            <text x={FIXED.chair.x} y={FIXED.chair.y + 38} textAnchor="middle" className="font-mono" fontSize={fs} fill="var(--ink-muted)">{s.chair}</text>

            {/* table */}
            <rect x={FIXED.table.x - 42} y={FIXED.table.y - 26} width={84} height={52}
              stroke={stroke("table")} strokeWidth={sw("table")} fill={seen(heading, "table") ? "var(--paper-raised)" : "none"} />
            <text x={FIXED.table.x} y={FIXED.table.y + 44} textAnchor="middle" className="font-mono" fontSize={fs} fill="var(--ink-muted)">{s.table}</text>

            {/* cupboard against the left wall, door swung open into the room */}
            <g stroke={stroke("cupboard")} strokeWidth={sw("cupboard")} fill={seen(heading, "cupboard") ? "var(--paper-raised)" : "none"}>
              <rect x={ROOM.x} y={FIXED.cupboard.y - 40} width={30} height={80} />
              <line x1={ROOM.x + 30} y1={FIXED.cupboard.y - 40} x2={ROOM.x + 82} y2={FIXED.cupboard.y - 6} />
            </g>
            <text x={ROOM.x + 40} y={FIXED.cupboard.y + 56} className="font-mono" fontSize={fs} fill="var(--ink-muted)">{s.cupboard}</text>

            {/* ball, with its direction of travel */}
            <motion.circle cy={BALL_Y} r="10" animate={{ cx: ball.x }} initial={false}
              transition={{ duration: still ? 0 : 0.35, ease: "easeOut" }}
              stroke={stroke("ball")} strokeWidth={sw("ball")} fill={seen(heading, "ball") ? "var(--ink)" : "none"} />
            <motion.line y1={BALL_Y} y2={BALL_Y} initial={false}
              animate={{ x1: ball.x + (ball.left ? -16 : 16), x2: ball.x + (ball.left ? -40 : 40) }}
              transition={{ duration: still ? 0 : 0.35, ease: "easeOut" }}
              stroke={stroke("ball")} strokeWidth={sw("ball")} />
            <motion.path initial={false} transition={{ duration: still ? 0 : 0.35, ease: "easeOut" }}
              animate={{ d: ball.left
                ? `M ${ball.x - 33} ${BALL_Y - 5} L ${ball.x - 40} ${BALL_Y} L ${ball.x - 33} ${BALL_Y + 5}`
                : `M ${ball.x + 33} ${BALL_Y - 5} L ${ball.x + 40} ${BALL_Y} L ${ball.x + 33} ${BALL_Y + 5}` }}
              fill="none" stroke={stroke("ball")} strokeWidth={sw("ball")} />
            <motion.text y={BALL_Y + 26} textAnchor="middle" className="font-mono" fontSize={fs} fill="var(--ink-muted)"
              initial={false} animate={{ x: ball.x }} transition={{ duration: still ? 0 : 0.35, ease: "easeOut" }}>{s.ball}</motion.text>

            {/* camera */}
            <circle cx={CAM.x} cy={CAM.y} r="9" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.6" />
            <line x1={CAM.x} y1={CAM.y} x2={pol(heading, 22).x} y2={pol(heading, 22).y} stroke="var(--ink)" strokeWidth="2" />
          </svg>
        </div>

        <div className="flex-1 px-5 py-4 md:px-6">
          <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-2 text-[0.88rem] leading-snug">
            <span />
            <div><p className="label !text-ink">{s.state}</p><p className="mt-0.5 text-[0.75rem] text-ink-muted">{s.stateNote}</p></div>
            <div><p className="label !text-ink">{s.obs}</p><p className="mt-0.5 text-[0.75rem] text-ink-muted">{s.obsNote}</p></div>
            {ORDER.map((id) => (
              <div key={id} className="contents">
                <span className="label pt-[2px]">{s[id]}</span>
                <span className="tnum text-ink">{fact[id]}</span>
                <span className={`tnum ${seen(heading, id) ? "text-ink" : "text-ink-faint"}`}>
                  {seen(heading, id) ? fact[id] : s.unknown}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div data-print-hide className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className={compact
          ? "flex basis-full flex-wrap items-center gap-x-3 gap-y-2"
          : "flex min-w-[12rem] flex-1 items-center gap-3"}>
          <span className={compact ? "label basis-full" : "label whitespace-nowrap"}>{s.turn}</span>
          <input type="range" min={0} max={359} value={heading}
            onChange={(e) => turn(Number(e.target.value))}
            className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-12 text-right !text-ink">{heading}°</span>
        </label>
        <button type="button" onClick={stepTime}
          className="label border border-rule-strong bg-paper px-3 py-1.5 !text-ink hover:border-ink">
          {s.step}
        </button>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]">
          {moved ? s.moved : s.count[hidden]}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [s.heading, `${heading}°`],
          [s.inView, s.ofFour.replace("{n}", String(visible.length))],
          [s.time, String(step)],
        ].map(([kk, v]) => (
          <div key={kk} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{kk}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
