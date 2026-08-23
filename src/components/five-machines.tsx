"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * The thesis, running five times at once.
 *
 * The hero used to be a ball with a model mispredicting it, which is a good
 * picture of one of the five senses and therefore does the exact thing
 * chapter 1 complains about: it presents a single machine as the whole story.
 * This shows all five going at the same time, each drawing what it actually
 * outputs, under the one name they share. Nothing here is a measurement; they
 * are sketches of five different kinds of answer.
 *
 * Decorative, so there is nothing to press. It animates on a timer rather
 * than a frame loop, which keeps it honest under a headless browser and lets
 * reduced motion simply hold frame zero, a composition that reads on its own.
 */

type Strings = {
  shared: string;
  renderer: string;
  simulator: string;
  dynamics: string;
  representation: string;
  implicit: string;
  rendererOut: string;
  simulatorOut: string;
  dynamicsOut: string;
  representationOut: string;
  implicitOut: string;
  aria: string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    shared: "all five are called a world model",
    renderer: "Renderer",
    simulator: "Simulator",
    dynamics: "Dynamics Model",
    representation: "Representation",
    implicit: "Implicit Model",
    rendererOut: "frames",
    simulatorOut: "geometry",
    dynamicsOut: "a compact state",
    representationOut: "embeddings",
    implicitOut: "structure, found",
    aria: "Five sketches running side by side, each the kind of answer a different system gives while its makers call it a world model: a renderer drawing frames, a simulator holding geometry, a dynamics model rolling a short state forward, a representation sorting embeddings, and structure read out of a network that was trained for something else.",
  },
  zh: {
    shared: "这五种都被叫做世界模型",
    renderer: "渲染器",
    simulator: "仿真器",
    dynamics: "动力学模型",
    representation: "表征",
    implicit: "内隐模型",
    rendererOut: "画面",
    simulatorOut: "几何",
    dynamicsOut: "一个紧凑状态",
    representationOut: "嵌入",
    implicitOut: "被读出来的结构",
    aria: "五幅并排跑着的小图，每一幅都是一种系统给出的答案，而它们的作者都把自己的东西叫做世界模型：渲染器在画帧，仿真器守着几何，动力学模型把一个短状态往前推，表征在给嵌入分组，还有从一个为别的任务训练的网络里读出来的结构。",
  },
};

const TICK = 50;
/**
 * Every computed coordinate and opacity is rounded before it reaches an
 * attribute. Math.sin can differ in its last bit between the Node build and
 * the browser's, and React compares these as strings, so an unrounded value
 * hydrates as a mismatch.
 */
const r = (n: number) => Number(n.toFixed(2));
/** panel geometry, in the wide layout's own units */
const PW = 188;
const PH = 116;
const GAP = 15;

function ridge(t: number, w: number, base: number, amp: number, speed: number, seed: number) {
  const pts: string[] = [];
  for (let x = 0; x <= w; x += 6) {
    const p = (x + t * speed) * 0.03 + seed;
    pts.push(`${x},${r(base + Math.sin(p) * amp + Math.sin(p * 2.3) * amp * 0.4)}`);
  }
  return `${pts.join(" ")} ${w},${PH} 0,${PH}`;
}

/** a renderer answers with pixels: a scene drawn, and drawn again */
function Renderer({ t }: { t: number }) {
  return (
    <>
      <circle cx={38} cy={30} r={11} fill="var(--imagine)" opacity={0.22} />
      <polygon points={ridge(t, PW, 62, 7, 0.5, 0)} fill="var(--imagine)" opacity={0.14} />
      <polygon points={ridge(t, PW, 74, 5, 0.9, 2.1)} fill="var(--imagine)" opacity={0.2} />
      <polygon points={ridge(t, PW, 86, 4, 1.5, 4.4)} fill="var(--imagine)" opacity={0.3} />
      <line
        x1={r((t * 2.2) % PW)}
        y1={6}
        x2={r((t * 2.2) % PW)}
        y2={PH - 6}
        stroke="var(--imagine)"
        strokeWidth={1}
        opacity={0.28}
      />
    </>
  );
}

/** a simulator answers with structure: something a program can query */
function Simulator({ t }: { t: number }) {
  const yaw = t * 0.012;
  const cx = PW / 2;
  const cy = 62;
  const s = 30;
  const box: [number, number, number][] = [
    [-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1],
    [-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1],
  ];
  const p = box.map(([x, y, z]) => {
    const rx = x * Math.cos(yaw) - z * Math.sin(yaw);
    const rz = x * Math.sin(yaw) + z * Math.cos(yaw);
    return [r(cx + rx * s), r(cy + y * s * 0.62 + rz * s * 0.3)] as const;
  });
  const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  return (
    <>
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={p[a][0]} y1={p[a][1]} x2={p[b][0]} y2={p[b][1]}
          stroke="var(--actual)" strokeWidth={1.2} opacity={i > 7 ? 0.45 : 0.85}
        />
      ))}
      {p.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.8} fill="var(--actual)" opacity={0.7} />
      ))}
      <line x1={20} y1={100} x2={PW - 20} y2={100} stroke="var(--rule-strong)" strokeWidth={1} opacity={0.5} />
    </>
  );
}

/** a dynamics model answers with a short state, rolled forward under actions */
function Dynamics({ t }: { t: number }) {
  const head = Math.floor(t / 7) % 12;
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => {
        const h = r(10 + (Math.sin(t * 0.05 + i * 1.3) * 0.5 + 0.5) * 22);
        return (
          <rect
            key={i}
            x={26 + i * 14} y={r(40 - h / 2)} width={7} height={h}
            fill={i < 3 ? "var(--actual)" : "var(--imagine)"} opacity={0.75}
          />
        );
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const x = 22 + i * 13;
        const y = r(88 - Math.sin(i * 0.5) * 14);
        const on = i <= head;
        const given = i < 3;
        return (
          <circle
            key={i} cx={x} cy={y} r={given ? 3 : 2.4}
            fill={given ? "var(--actual)" : "var(--imagine)"}
            opacity={on ? (given ? 0.9 : 0.75) : 0.14}
          />
        );
      })}
    </>
  );
}

/** a representation answers with a place: like things land near each other */
function Representation({ t }: { t: number }) {
  const clusters = [
    [52, 44], [130, 38], [92, 88],
  ] as const;
  const probe = clusters[Math.floor(t / 60) % 3];
  return (
    <>
      {clusters.map(([cx, cy], c) =>
        Array.from({ length: 7 }, (_, i) => {
          const a = i * 0.9 + c * 2 + t * 0.006;
          const rad = 10 + ((i * 5) % 13);
          return (
            <circle
              key={`${c}-${i}`}
              cx={r(cx + Math.cos(a) * rad)}
              cy={r(cy + Math.sin(a) * rad * 0.7)}
              r={2.3}
              fill="var(--actual)"
              opacity={0.55}
            />
          );
        }),
      )}
      <circle cx={probe[0]} cy={probe[1]} r={5} fill="none" stroke="var(--imagine)" strokeWidth={1.4} />
      <circle cx={probe[0]} cy={probe[1]} r={2} fill="var(--imagine)" />
    </>
  );
}

/** an implicit model is not run at all: it is found inside something else */
function Implicit({ t }: { t: number }) {
  const cols = [40, 74, 108];
  return (
    <>
      {cols.map((x, c) =>
        Array.from({ length: 4 }, (_, i) => {
          const y = 26 + i * 18;
          const pulse = Math.sin(t * 0.07 + c * 1.4 + i * 0.8) * 0.5 + 0.5;
          return (
            <circle key={`${c}-${i}`} cx={x} cy={y} r={3.4} fill="var(--ink)" opacity={r(0.15 + pulse * 0.5)} />
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
      <line
        x1={112} y1={62} x2={136} y2={62}
        stroke="var(--imagine)" strokeWidth={1} strokeDasharray="3 3" opacity={0.7}
      />
      {Array.from({ length: 9 }, (_, i) => {
        const gx = 142 + (i % 3) * 12;
        const gy = 44 + Math.floor(i / 3) * 12;
        const lit = (Math.floor(t / 18) + i) % 4 === 0;
        return (
          <rect
            key={i} x={gx} y={gy} width={9} height={9}
            fill={lit ? "var(--imagine)" : "none"}
            stroke="var(--imagine)" strokeWidth={0.8}
            opacity={lit ? 0.75 : 0.3}
          />
        );
      })}
    </>
  );
}

const PANELS = [
  { key: "renderer", out: "rendererOut", Draw: Renderer },
  { key: "simulator", out: "simulatorOut", Draw: Simulator },
  { key: "dynamics", out: "dynamicsOut", Draw: Dynamics },
  { key: "representation", out: "representationOut", Draw: Representation },
  { key: "implicit", out: "implicitOut", Draw: Implicit },
] as const;

export function FiveMachines() {
  const { ref, compact } = useCompact(720);
  const still = !!useReducedMotion();
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const [t, setT] = useState(0);

  useEffect(() => {
    if (still) return;
    const id = window.setInterval(() => setT((v) => v + 1), TICK);
    return () => window.clearInterval(id);
  }, [still]);

  // narrow goes to two columns rather than five thin ones, and the drawings
  // are scaled uniformly: squashing one axis turned the cube into a table.
  const pw = compact ? 118 : PW;
  const ph = compact ? 73 : PH;
  const sc = pw / PW;
  const cols = compact ? 2 : PANELS.length;
  const labelH = compact ? 40 : 44;
  const rows = Math.ceil(PANELS.length / cols);
  const W = cols * pw + (cols - 1) * GAP;
  const H = rows * (ph + labelH) - (compact ? 6 : 0);

  return (
    <div ref={ref} className="border-y border-rule bg-paper-raised">
      <div className="mx-auto max-w-[84rem] px-6 py-7 md:px-10">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={T.aria}>
          {PANELS.map(({ key, out, Draw }, i) => {
            const x = (i % cols) * (pw + GAP);
            const y = Math.floor(i / cols) * (ph + labelH);
            const clip = `fm-${key}`;
            return (
              <g key={key} transform={`translate(${x} ${y})`}>
                <clipPath id={clip}>
                  <rect x={0} y={0} width={pw} height={ph} />
                </clipPath>
                <rect
                  x={0.5} y={0.5} width={pw - 1} height={ph - 1}
                  fill="var(--paper)" stroke="var(--rule)" strokeWidth={1}
                />
                {/* clip on the outer group, scale on the inner: a transform on
                    the clipped element scales its clip rect too, which cropped
                    each drawing to the top-left corner of its panel */}
                <g clipPath={`url(#${clip})`}>
                  <g transform={sc === 1 ? undefined : `scale(${r(sc)})`}>
                    <Draw t={t} />
                  </g>
                </g>
                <text
                  x={0} y={ph + (compact ? 16 : 17)}
                  className="font-mono" fontSize={compact ? 10 : 11}
                  letterSpacing="0.1em" fill="var(--ink)"
                >
                  {T[key as keyof Strings].toUpperCase()}
                </text>
                <text
                  x={0} y={ph + (compact ? 31 : 33)}
                  fontFamily="var(--font-body)" fontSize={compact ? 11 : 12}
                  fill="var(--ink-muted)"
                >
                  {T[out as keyof Strings]}
                </text>
              </g>
            );
          })}
        </svg>

        <p className="label mt-5 text-center !text-ink-muted">{T.shared}</p>
      </div>
    </div>
  );
}
