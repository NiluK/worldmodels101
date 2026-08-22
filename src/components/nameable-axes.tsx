"use client";

import { useId, useRef, useState } from "react";
import { Room, ROOM_W, ROOM_H } from "./latent-room";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * Higgins's test, with the beta dial added.
 *
 * The room is drawn from two factors, how far the wall is and how bright the
 * room is. The pad on the right has two axes, and the question is whether
 * either of them means one of those two things. At low pressure the pad's axes
 * sit at 45 degrees to the factors: move along axis 1 and both depth and
 * brightness change. Turning the pressure up eases the rotation to zero, so
 * axis 1 becomes depth and axis 2 becomes brightness, and at the same time the
 * room blurs, because the same paper shows that cost. Everything here is
 * illustrative, including the shape of the easing and the amount of blur.
 */

const TEXT = {
  en: {
    axis1: "axis 1",
    axis2: "axis 2",
    depth: "depth",
    light: "light",
    room: "The room, redrawn from the two numbers",
    pad: "Drag the point, or use the arrow keys",
    pressure: "Pressure (beta)",
    whatAxis1: "What axis 1 changes",
    a1Tangled: "depth and brightness",
    a1Mostly: "mostly depth",
    a1Only: "depth only",
    sharpness: "Sharpness",
    sharp: "sharp",
    softer: "softer",
    soft: "soft",
    vTangled: "Turn one number and two things change. Neither axis has a name yet.",
    vMiddle: "The axes are lining up, and the room is starting to go soft.",
    vHigh: "One number, one thing. You can name the axes now, and you paid for it in focus.",
    padAria: "Two latent numbers. Arrow keys move the point.",
    aria: (p: string, a1: string, s: string) =>
      `A room drawn from two numbers. Pressure ${p}. Axis 1 changes ${a1}. The room is ${s}.`,
  },
  zh: {
    axis1: "轴 1",
    axis2: "轴 2",
    depth: "深度",
    light: "亮度",
    room: "由两个数重新画出的房间",
    pad: "拖动这个点，或用方向键",
    pressure: "压力（beta）",
    whatAxis1: "轴 1 改变什么",
    a1Tangled: "深度和亮度",
    a1Mostly: "主要是深度",
    a1Only: "只有深度",
    sharpness: "清晰度",
    sharp: "清晰",
    softer: "稍软",
    soft: "模糊",
    vTangled: "转动一个数，两样东西一起变。两条轴都还没有名字。",
    vMiddle: "两条轴正在对齐，房间也开始变软。",
    vHigh: "一个数，一样东西。现在可以给轴起名字了，代价是清晰度。",
    padAria: "两个潜变量。用方向键移动这个点。",
    aria: (p: string, a1: string, s: string) =>
      `由两个数画出的房间。压力 ${p}。轴 1 改变${a1}。房间${s}。`,
  },
} as const;

const MAX_P = 4;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Rotation between the pad's axes and the factors, 45 degrees at no pressure, easing to 0. */
const angleFor = (p: number) => (Math.PI / 4) * (1 - p / MAX_P) ** 2;

export function NameableAxes() {
  const locale = useLocale();
  const T = TEXT[locale] ?? TEXT.en;
  const { ref } = useCompact(520);
  const blurId = useId();
  const padRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<[number, number]>([0.58, 0.42]);
  const [pressure, setPressure] = useState(0.5);
  const [drag, setDrag] = useState(false);

  // pad -> factors: a 2 by 2 rotation, so one pad axis mixes the two factors
  // until the pressure has turned the mix out of it
  const th = angleFor(pressure);
  const c = Math.cos(th), s = Math.sin(th);
  const du = pos[0] - 0.5, dv = pos[1] - 0.5;
  const depth = clamp01(0.5 + c * du - s * dv);
  const bright = clamp01(0.5 + s * du + c * dv);
  const blur = (pressure / MAX_P) * 3;

  const band = pressure < 1 ? 0 : pressure <= 2.5 ? 1 : 2;
  const axis1 = [T.a1Tangled, T.a1Mostly, T.a1Only][band];
  const sharp = [T.sharp, T.softer, T.soft][band];
  const verdict = [T.vTangled, T.vMiddle, T.vHigh][band];
  const pLabel = pressure.toFixed(1);

  const move = (e: React.PointerEvent) => {
    const el = padRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos([clamp01((e.clientX - r.left) / r.width), clamp01(1 - (e.clientY - r.top) / r.height)]);
  };
  const onKey = (e: React.KeyboardEvent) => {
    const step = 0.05;
    const d: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step],
    };
    const m = d[e.key];
    if (!m) return;
    e.preventDefault();
    setPos(([u, v]) => [clamp01(u + m[0]), clamp01(v + m[1])]);
  };

  // the factor directions drawn on the pad, in pad units (y down)
  const PAD = 100;
  const half = PAD * 0.7;
  const dir = (dx: number, dy: number) =>
    [50 - dx * half, 50 + dy * half, 50 + dx * half, 50 - dy * half] as const;
  const depthLine = dir(c, -s);
  const lightLine = dir(s, c);

  return (
    <div>
      <div ref={ref} className="grid gap-6 px-5 pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,15rem)] md:px-8">
        <div>
          <svg viewBox={`0 0 ${ROOM_W} ${ROOM_H}`} className="block w-full" role="img"
            aria-label={T.aria(pLabel, axis1, sharp)}>
            <defs>
              <filter id={blurId} x="-5%" y="-5%" width="110%" height="110%">
                <feGaussianBlur stdDeviation={blur} />
              </filter>
            </defs>
            <rect width={ROOM_W} height={ROOM_H} fill="var(--paper-sunk)" />
            <g filter={`url(#${blurId})`}>
              <Room z={[depth, 0.5]} />
            </g>
            {/* the light: an ink wash that thins as the room brightens */}
            <rect width={ROOM_W} height={ROOM_H} fill="var(--ink)" opacity={(1 - bright) * 0.45} />
          </svg>
          <p className="label mt-3 !text-[0.6rem]">{T.room}</p>
        </div>

        <div>
          <div
            ref={padRef}
            tabIndex={0}
            role="group"
            aria-label={T.padAria}
            onKeyDown={onKey}
            onPointerDown={(e) => { setDrag(true); e.currentTarget.setPointerCapture(e.pointerId); move(e); }}
            onPointerMove={(e) => drag && move(e)}
            onPointerUp={() => setDrag(false)}
            onPointerCancel={() => setDrag(false)}
            className="relative aspect-square w-full cursor-crosshair border border-rule-strong bg-paper touch-none focus-visible:outline-2 focus-visible:outline-imagine"
          >
            <svg viewBox={`0 0 ${PAD} ${PAD}`} className="block h-full w-full" aria-hidden>
              {[25, 50, 75].map((g) => (
                <g key={g}>
                  <line x1={0} y1={g} x2={PAD} y2={g} stroke="var(--rule)" strokeWidth="0.5" />
                  <line x1={g} y1={0} x2={g} y2={PAD} stroke="var(--rule)" strokeWidth="0.5" />
                </g>
              ))}
              {/* the two factors, as directions on the pad: they line up with the axes as pressure rises */}
              <line x1={depthLine[0]} y1={depthLine[1]} x2={depthLine[2]} y2={depthLine[3]}
                stroke="var(--imagine)" strokeWidth="0.8" strokeDasharray="2 2" opacity={0.8} />
              <line x1={lightLine[0]} y1={lightLine[1]} x2={lightLine[2]} y2={lightLine[3]}
                stroke="var(--actual)" strokeWidth="0.8" strokeDasharray="2 2" opacity={0.8} />
              <text x={50 + c * 40} y={50 + s * 40 + 3} className="font-mono" fontSize={4.5}
                textAnchor="middle" fill="var(--imagine)">{T.depth}</text>
              <text x={50 + s * 40} y={50 - c * 40 - 2} className="font-mono" fontSize={4.5}
                textAnchor="middle" fill="var(--actual)">{T.light}</text>
              {/* the pad's own axes */}
              <text x={PAD - 2} y={PAD - 2} className="font-mono" fontSize={4.5} textAnchor="end"
                fill="var(--ink-faint)">{T.axis1}</text>
              <text x={2} y={6.5} className="font-mono" fontSize={4.5} fill="var(--ink-faint)">{T.axis2}</text>
            </svg>
            <span
              className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-imagine"
              style={{ left: `${pos[0] * 100}%`, top: `${(1 - pos[1]) * 100}%` }}
            />
          </div>
          <p className="label mt-2 !text-[0.6rem]">{T.pad}</p>
        </div>
      </div>

      <div data-print-hide className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-full flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[16rem]">
          <span className="label whitespace-nowrap">{T.pressure}</span>
          <input type="range" min={0} max={MAX_P} step={0.1} value={pressure}
            onChange={(e) => setPressure(Number(e.target.value))}
            className="h-1 min-w-[7rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-8 text-right !text-ink">{pLabel}</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{T.whatAxis1}</p>
          <p className="mt-1 text-[0.98rem] leading-snug text-ink">{axis1}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{T.sharpness}</p>
          <p className="mt-1 text-[0.98rem] leading-snug text-ink">{sharp}</p>
        </div>
      </div>

      <p className="label border-t border-rule px-5 py-3 !normal-case !tracking-normal !text-[0.8rem] md:px-8">
        {verdict}
      </p>
    </div>
  );
}
