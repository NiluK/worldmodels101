"use client";

import { useCallback, useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * The thesis, and you are the one driving it.
 *
 * One small world, one set of controls, five panels answering at the same
 * time. Move, and the renderer redraws a frame, the simulator answers a
 * distance, the dynamics model rolls a short state forward, the representation
 * lands somewhere else in its space, and a probe reads your heading out of a
 * network that was never told about heading. Same input, same name, five
 * different kinds of answer: that is the whole argument of the site, and it
 * only lands if the reader is the one making it happen.
 *
 * It walks itself until you touch it, which is the invitation. Every number
 * that reaches an attribute is rounded: an unrounded sine differs in its last
 * bit between the server build and the browser and hydrates as a mismatch.
 */

type Strings = {
  renderer: string; simulator: string; dynamics: string;
  representation: string; implicit: string;
  rendererOut: string; simulatorOut: string; dynamicsOut: string;
  representationOut: string; implicitOut: string;
  left: string; forward: string; right: string;
  hint: string; taken: string; shared: string;
  wall: (m: string) => string;
  heading: string;
  aria: (h: number) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    renderer: "Renderer", simulator: "Simulator", dynamics: "Dynamics Model",
    representation: "Representation", implicit: "Implicit Model",
    rendererOut: "a frame", simulatorOut: "a distance", dynamicsOut: "a short state",
    representationOut: "a place", implicitOut: "structure, read out",
    left: "Turn left", forward: "Step", right: "Turn right",
    hint: "It is walking itself. Take over with the buttons or the arrow keys.",
    taken: "One move, five answers, and no two of them are in the same units.",
    shared: "all five are called a world model",
    wall: (m) => `wall in ${m} m`,
    heading: "heading, read out",
    aria: (h) =>
      `A small world you can walk through, facing ${h} degrees, answered at once by five systems that all get called a world model: a rendered frame, a queried distance, a short state rolled forward, a place in an embedding space, and a heading read out of a network by a probe.`,
  },
  zh: {
    renderer: "渲染器", simulator: "仿真器", dynamics: "动力学模型",
    representation: "表征", implicit: "内隐模型",
    rendererOut: "一帧画面", simulatorOut: "一个距离", dynamicsOut: "一个短状态",
    representationOut: "一个位置", implicitOut: "被读出来的结构",
    left: "左转", forward: "走一步", right: "右转",
    hint: "它自己在走。用按钮或者方向键接管。",
    taken: "一个动作，五个回答，而它们的单位没有两个是一样的。",
    shared: "这五种都被叫做世界模型",
    wall: (m) => `${m} 米处有墙`,
    heading: "读出来的朝向",
    aria: (h) =>
      `一个你可以走进去的小世界，此刻朝向 ${h} 度，同时由五个都被叫做世界模型的系统作答：一帧渲染出来的画面、一个查询得到的距离、一个往前推的短状态、嵌入空间里的一个位置，以及探针从网络里读出来的朝向。`,
  },
};

/** the world: # is wall, . is floor */
const MAP = [
  "########",
  "#..#...#",
  "#..#.#.#",
  "#....#.#",
  "#.##...#",
  "########",
];
const MW = 8;
const MH = 6;
const wallAt = (x: number, y: number) =>
  x < 0 || y < 0 || x >= MW || y >= MH || MAP[Math.floor(y)][Math.floor(x)] === "#";
/** keep a body's worth of clearance, so you cannot end up nose against a wall */
const CLEAR = 0.3;
const blocked = (x: number, y: number) =>
  wallAt(x + CLEAR, y) || wallAt(x - CLEAR, y) || wallAt(x, y + CLEAR) || wallAt(x, y - CLEAR);

const PW = 188;
const PH = 116;
const GAP = 15;
const RAYS = 26;
const FOV = 1.05;
const STEP = 0.34;
const TURN = Math.PI / 8;

const r = (n: number) => Number(n.toFixed(2));

/** march until something solid, in world units */
function cast(px: number, py: number, ang: number) {
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  for (let d = 0.02; d < 9; d += 0.02) {
    if (wallAt(px + dx * d, py + dy * d)) return d;
  }
  return 9;
}

type Pose = { x: number; y: number; a: number };

export function FiveAnswers() {
  const { ref, compact } = useCompact(720);
  const still = !!useReducedMotion();
  const locale = useLocale();
  const T = pickText(TEXT, locale);

  const [pose, setPose] = useState<Pose>({ x: 1.5, y: 1.5, a: 0 });
  const [taken, setTaken] = useState(false);
  const step = useCallback((turn: number, walk: boolean) => {
    setPose((p) => {
      const a = p.a + turn;
      if (!walk) return { ...p, a };
      const nx = p.x + Math.cos(a) * STEP;
      const ny = p.y + Math.sin(a) * STEP;
      if (blocked(nx, ny)) return { ...p, a };
      return { x: nx, y: ny, a };
    });
  }, []);

  const drive = useCallback(
    (turn: number, walk: boolean) => {
      setTaken(true);
      step(turn, walk);
    },
    [step],
  );

  // it walks itself until someone takes over, which is the invitation. All of
  // it happens inside the updater so the timer never needs the current pose.
  useEffect(() => {
    if (taken || still) return;
    const id = window.setInterval(() => {
      setPose((p) => {
        // turn early, and toward whichever side has more room, so it wanders
        // the room instead of grinding along a wall
        if (cast(p.x, p.y, p.a) < 1.3) {
          const room = cast(p.x, p.y, p.a + 1.2) - cast(p.x, p.y, p.a - 1.2);
          return { ...p, a: p.a + TURN * (room > 0 ? 1.2 : -1.2) };
        }
        const a = p.a + Math.sin(p.x * 1.7 + p.y * 2.3) * 0.04;
        const nx = p.x + Math.cos(a) * STEP;
        const ny = p.y + Math.sin(a) * STEP;
        return blocked(nx, ny) ? { ...p, a: a + TURN } : { x: nx, y: ny, a };
      });
    }, 110);
    return () => window.clearInterval(id);
  }, [taken, still]);

  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (k === "ArrowLeft") drive(-TURN, false);
    else if (k === "ArrowRight") drive(TURN, false);
    else if (k === "ArrowUp") drive(0, true);
    else return;
    e.preventDefault();
  };

  const deg = ((Math.round((pose.a * 180) / Math.PI) % 360) + 360) % 360;
  const ahead = cast(pose.x, pose.y, pose.a);

  const pw = compact ? 118 : PW;
  const ph = compact ? 73 : PH;
  const sc = pw / PW;
  const cols = compact ? 2 : 5;
  const labelH = compact ? 40 : 44;
  const rows = Math.ceil(5 / cols);
  const W = cols * pw + (cols - 1) * GAP;
  const H = rows * (ph + labelH) - (compact ? 6 : 0);

  const panels = [
    { key: "renderer", out: "rendererOut", draw: <Renderer pose={pose} /> },
    { key: "simulator", out: "simulatorOut", draw: <Simulator pose={pose} ahead={ahead} T={T} /> },
    { key: "dynamics", out: "dynamicsOut", draw: <Dynamics pose={pose} /> },
    { key: "representation", out: "representationOut", draw: <Representation pose={pose} /> },
    { key: "implicit", out: "implicitOut", draw: <Implicit pose={pose} T={T} /> },
  ] as const;

  return (
    <div ref={ref} className="border-y border-rule bg-paper-raised">
      <div className="mx-auto max-w-[84rem] px-6 py-7 md:px-10">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full focus:outline-none"
          role="img"
          aria-label={T.aria(deg)}
          tabIndex={0}
          onKeyDown={onKey}
        >
          {panels.map(({ key, out, draw }, i) => {
            const x = (i % cols) * (pw + GAP);
            const y = Math.floor(i / cols) * (ph + labelH);
            const clip = `fa-${key}`;
            return (
              <g key={key} transform={`translate(${x} ${y})`}>
                <clipPath id={clip}>
                  <rect x={0} y={0} width={pw} height={ph} />
                </clipPath>
                <rect
                  x={0.5} y={0.5} width={pw - 1} height={ph - 1}
                  fill="var(--paper)" stroke="var(--rule)" strokeWidth={1}
                />
                {/* clip outside, scale inside: a transform on the clipped
                    element scales its clip rect with it */}
                <g clipPath={`url(#${clip})`}>
                  <g transform={sc === 1 ? undefined : `scale(${r(sc)})`}>{draw}</g>
                </g>
                <text
                  x={0} y={ph + (compact ? 16 : 17)}
                  className="font-mono" fontSize={compact ? 10 : 11}
                  letterSpacing="0.1em" fill="var(--ink)"
                >
                  {T[key as keyof Strings].toString().toUpperCase()}
                </text>
                <text
                  x={0} y={ph + (compact ? 31 : 33)}
                  fontFamily="var(--font-body)" fontSize={compact ? 11 : 12}
                  fill="var(--ink-muted)"
                >
                  {T[out as keyof Strings].toString()}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
          <button
            type="button"
            onClick={() => drive(-TURN, false)}
            className="label h-10 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink"
          >
            {T.left}
          </button>
          <button
            type="button"
            onClick={() => drive(0, true)}
            className="label h-10 border border-imagine bg-imagine px-5 !text-paper transition-colors hover:border-ink hover:bg-ink"
          >
            {T.forward}
          </button>
          <button
            type="button"
            onClick={() => drive(TURN, false)}
            className="label h-10 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink"
          >
            {T.right}
          </button>
          <p className="label basis-full text-center !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
            {taken ? T.taken : T.hint}
          </p>
        </div>

        <p className="label mt-4 text-center !text-ink-muted">{T.shared}</p>
      </div>
    </div>
  );
}

/** pixels: the frame you would see from where you stand */
function Renderer({ pose }: { pose: Pose }) {
  const bands = Array.from({ length: RAYS }, (_, i) => {
    const ang = pose.a + (i / (RAYS - 1) - 0.5) * FOV;
    const d = cast(pose.x, pose.y, ang) * Math.cos(ang - pose.a);
    const h = Math.min(PH - 8, 74 / Math.max(d, 0.22));
    return { x: r((i * PW) / RAYS), w: r(PW / RAYS + 0.6), h: r(h), o: r(Math.max(0.1, 0.46 - d * 0.05)) };
  });
  return (
    <>
      <rect x={0} y={PH / 2} width={PW} height={PH / 2} fill="var(--imagine)" opacity={0.07} />
      {bands.map((b, i) => (
        <rect
          key={i} x={b.x} y={r(PH / 2 - b.h / 2)} width={b.w} height={b.h}
          fill="var(--imagine)" opacity={b.o}
        />
      ))}
    </>
  );
}

/** structure: a thing another program can put a question to */
function Simulator({ pose, ahead, T }: { pose: Pose; ahead: number; T: Strings }) {
  const c = 18;
  const ox = (PW - MW * c) / 2;
  const oy = (PH - MH * c) / 2 - 6;
  const px = r(ox + pose.x * c);
  const py = r(oy + pose.y * c);
  const hit = Math.min(ahead, 9);
  return (
    <>
      {MAP.flatMap((row, y) =>
        row.split("").map((ch, x) =>
          ch === "#" ? (
            <rect
              key={`${x}-${y}`} x={ox + x * c} y={oy + y * c} width={c} height={c}
              fill="var(--actual)" opacity={0.14}
            />
          ) : null,
        ),
      )}
      <line
        x1={px} y1={py}
        x2={r(px + Math.cos(pose.a) * hit * c)} y2={r(py + Math.sin(pose.a) * hit * c)}
        stroke="var(--actual)" strokeWidth={1} strokeDasharray="3 2" opacity={0.8}
      />
      <circle cx={px} cy={py} r={3.4} fill="var(--actual)" />
      <text
        x={PW / 2} y={PH - 7} textAnchor="middle"
        className="font-mono" fontSize={10} fill="var(--ink-muted)"
      >
        {T.wall(hit.toFixed(1))}
      </text>
    </>
  );
}

/** a short state, and the same state rolled forward under more of the same */
function Dynamics({ pose }: { pose: Pose }) {
  const nums = [pose.x, pose.y, ((pose.a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)];
  const future: Pose[] = [];
  let p = { ...pose };
  for (let i = 0; i < 5; i++) {
    const nx = p.x + Math.cos(p.a) * STEP;
    const ny = p.y + Math.sin(p.a) * STEP;
    p = blocked(nx, ny) ? { ...p, a: p.a + TURN } : { x: nx, y: ny, a: p.a };
    future.push({ ...p });
  }
  const c = 13;
  const ox = 26;
  const oy = 52;
  return (
    <>
      {nums.map((n, i) => (
        <g key={i}>
          <rect x={22 + i * 50} y={18} width={44} height={20} fill="var(--actual)" opacity={0.1} />
          <text
            x={44 + i * 50} y={32} textAnchor="middle"
            className="font-mono" fontSize={10} fill="var(--ink)"
          >
            {n.toFixed(2)}
          </text>
        </g>
      ))}
      <circle cx={r(ox + pose.x * c)} cy={r(oy + pose.y * c)} r={3} fill="var(--actual)" />
      {future.map((f, i) => (
        <circle
          key={i} cx={r(ox + f.x * c)} cy={r(oy + f.y * c)} r={2.4}
          fill="var(--imagine)" opacity={r(0.75 - i * 0.11)}
        />
      ))}
    </>
  );
}

/** a place: two views that look alike land near each other */
function Representation({ pose }: { pose: Pose }) {
  const centres = [
    [54, 42], [132, 40], [94, 86],
  ] as const;
  // which third of the room you are in decides the cluster; heading nudges you inside it
  const region = pose.x < 3 ? 0 : pose.y < 2.6 ? 1 : 2;
  const [cx, cy] = centres[region];
  const dx = Math.cos(pose.a) * 13;
  const dy = Math.sin(pose.a) * 9;
  return (
    <>
      {centres.map(([x, y], c) =>
        Array.from({ length: 7 }, (_, i) => {
          const a = i * 0.9 + c * 2;
          const rad = 9 + ((i * 5) % 12);
          return (
            <circle
              key={`${c}-${i}`}
              cx={r(x + Math.cos(a) * rad)} cy={r(y + Math.sin(a) * rad * 0.7)}
              r={2.2} fill="var(--actual)" opacity={c === region ? 0.5 : 0.22}
            />
          );
        }),
      )}
      <circle cx={r(cx + dx)} cy={r(cy + dy)} r={5} fill="none" stroke="var(--imagine)" strokeWidth={1.4} />
      <circle cx={r(cx + dx)} cy={r(cy + dy)} r={2} fill="var(--imagine)" />
    </>
  );
}

/** nothing is run here: a probe reads a heading the network was never given */
function Implicit({ pose, T }: { pose: Pose; T: Strings }) {
  const cols = [34, 66, 98];
  return (
    <>
      {cols.map((x, c) =>
        Array.from({ length: 4 }, (_, i) => {
          const act = Math.sin(pose.x * 1.7 + pose.y * 2.1 + pose.a * 1.3 + c * 1.4 + i * 0.9) * 0.5 + 0.5;
          return (
            <circle
              key={`${c}-${i}`} cx={x} cy={26 + i * 18} r={3.4}
              fill="var(--ink)" opacity={r(0.14 + act * 0.5)}
            />
          );
        }),
      )}
      {cols.slice(0, 2).map((x, c) =>
        Array.from({ length: 4 }, (_, i) =>
          Array.from({ length: 4 }, (_, j) => (
            <line
              key={`${c}-${i}-${j}`}
              x1={x} y1={26 + i * 18} x2={cols[c + 1]} y2={26 + j * 18}
              stroke="var(--ink)" strokeWidth={0.4} opacity={0.07}
            />
          )),
        ),
      )}
      <line x1={102} y1={62} x2={122} y2={62} stroke="var(--imagine)" strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />
      <circle cx={148} cy={54} r={17} fill="none" stroke="var(--imagine)" strokeWidth={1} opacity={0.45} />
      <line
        x1={148} y1={54}
        x2={r(148 + Math.cos(pose.a) * 15)} y2={r(54 + Math.sin(pose.a) * 15)}
        stroke="var(--imagine)" strokeWidth={1.6}
      />
      <text
        x={144} y={92} textAnchor="middle"
        className="font-mono" fontSize={7.5} fill="var(--ink-muted)"
      >
        {T.heading}
      </text>
    </>
  );
}
