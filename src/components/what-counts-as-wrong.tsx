"use client";

import { useId, useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * Two scales that disagree about the same pair of frames.
 *
 * What happened on the left, what the model said on the right, and one change
 * between them. A pixel scale charges by how many pixels moved, so every leaf
 * landing somewhere else, or the whole frame sliding a twentieth of its width,
 * costs a fortune. A description of the same scene is close to invariant to
 * both and is not invariant to where the car ahead is, which is the one change
 * that would alter what you do.
 *
 * Both scales are illustrative and the aria-label says so. What is not
 * illustrative is the shape of the disagreement: a squared pixel error is
 * dominated by how many pixels changed.
 */

type Change = "leaves" | "shift" | "car";

const W = 300;
const H = 200;
const HZ = 74;
const LEAF_COUNT = 15;
/** the whole frame slides by at most a twentieth of its width */
const MAX_SHIFT = W / 20;

function leaves(seed: number) {
  let s = seed;
  const rnd = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  return Array.from({ length: LEAF_COUNT }, () => {
    const a = rnd() * Math.PI * 2;
    const r = 8 + Math.sqrt(rnd()) * 22;
    return { x: 50 + Math.cos(a) * r, y: 46 + Math.sin(a) * r * 0.92, r: 1.5 + rnd() * 1.1 };
  });
}
const LEAVES_A = leaves(19730411);
const LEAVES_B = leaves(88214507);

const saturate = (a: number, rate: number) =>
  (1 - Math.exp(-rate * a)) / (1 - Math.exp(-rate));

const PIXEL: Record<Change, (a: number) => number> = {
  leaves: (a) => 70 * saturate(a, 3),
  shift: (a) => 95 * saturate(a, 4),
  car: (a) => 12 * Math.pow(a, 1.15),
};
const DESC: Record<Change, (a: number) => number> = {
  leaves: (a) => 4 * a,
  shift: (a) => 6 * a,
  car: (a) => 80 * saturate(a, 2.2),
};

type Strings = {
  happened: string;
  said: string;
  pixel: string;
  description: string;
  howMuch: string;
  bLeaves: string;
  bShift: string;
  bCar: string;
  cChange: string;
  nLeaves: string;
  nShift: string;
  nCar: string;
  vZero: string;
  vLeaves: string;
  vShift: string;
  vCar: string;
  vBoth: string;
  /** what goes between the change line and the closing one; zh needs nothing */
  sep: string;
  note: string;
  aria: (name: string, amount: number, px: number, ds: number) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    happened: "what happened",
    said: "what the model said",
    pixel: "pixel error",
    description: "description distance",
    howMuch: "how much",
    bLeaves: "The leaves land somewhere else",
    bShift: "The whole frame shifts sideways",
    bCar: "The car ahead moves into your lane",
    cChange: "Change",
    nLeaves: "the leaves",
    nShift: "the frame shifts",
    nCar: "the car",
    vZero: "The two frames are the same. Both scales read zero.",
    vLeaves:
      "Every leaf is somewhere else. Nobody could have called where they went and nothing you would do about the road depends on it, and the pixel scale charges the most for it.",
    vShift: "The whole frame has moved across. Every pixel is wrong and nothing about the road is.",
    vCar: "The car ahead has moved into your lane. A few hundred pixels changed, what you would do changed completely, and the pixel scale barely notices.",
    vBoth: "The two scales are not measuring the same thing.",
    sep: " ",
    note: "both scales are illustrative",
    aria: (name, amount, px, ds) =>
      `Two road frames, what happened and what the model said. The change is ${name}, at ${amount} out of 10. Pixel error ${px} of 100, description distance ${ds} of 100, both illustrative.`,
  },
  zh: {
    happened: "实际发生的",
    said: "模型说的",
    pixel: "像素误差",
    description: "描述距离",
    howMuch: "改动幅度",
    bLeaves: "叶子落到了别处",
    bShift: "整幅画面横移",
    bCar: "前车并进你的车道",
    cChange: "改动",
    nLeaves: "叶子",
    nShift: "画面横移",
    nCar: "前车",
    vZero: "两帧完全一样，两把尺子都读作零。",
    vLeaves:
      "每一片叶子都落在了别处。谁也说不准它们会落到哪里，你在这条路上的任何做法都不取决于此，而像素这把尺子恰恰为它收费最多。",
    vShift: "整幅画面横移了。每一个像素都错了，而这条路上没有任何东西错。",
    vCar: "前车并进了你的车道。变的不过几百个像素，你要做的事却完全变了，而像素这把尺子几乎没有反应。",
    vBoth: "这两把尺子量的根本不是同一件事。",
    sep: "",
    note: "两把尺子都仅为示意",
    aria: (name, amount, px, ds) =>
      `两帧道路画面：实际发生的，和模型说的。改动是${name}，幅度为 10 里的 ${amount}。像素误差 100 里的 ${px}，描述距离 100 里的 ${ds}，两者都仅为示意。`,
  },
};

/** the same road scene twice: road, markings, kerb, a tree with leaves, a car ahead */
function Scene({
  ink,
  leafT,
  shiftX,
  carT,
  clip,
}: {
  ink: string;
  leafT: number;
  shiftX: number;
  carT: number;
  clip: string;
}) {
  const carX = 182 - carT * 62;
  const carY = 122 + carT * 8;
  const carW = 26 + carT * 5;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-hidden>
      <defs>
        <clipPath id={clip}>
          <rect width={W} height={H} />
        </clipPath>
      </defs>
      <rect width={W} height={H} fill="var(--paper-sunk)" />
      <g clipPath={`url(#${clip})`} transform={`translate(${shiftX.toFixed(2)} 0)`}>
        <line x1={-W} y1={HZ} x2={W * 2} y2={HZ} stroke={ink} strokeWidth="1" opacity="0.5" />

        {/* road, kerbs and the markings down the middle */}
        <path d={`M 26 ${H} L 132 ${HZ} L 168 ${HZ} L 274 ${H}`} fill="none" stroke={ink} strokeWidth="1.2" />
        <path d={`M 12 ${H} L 126 ${HZ}`} fill="none" stroke={ink} strokeWidth="0.8" opacity="0.6" />
        <path d={`M 288 ${H} L 174 ${HZ}`} fill="none" stroke={ink} strokeWidth="0.8" opacity="0.6" />
        {[0.04, 0.24, 0.42, 0.58, 0.71, 0.82].map((d) => {
          const d2 = Math.min(d + 0.1 * (1 - d), 0.95);
          return (
            <line
              key={d}
              x1={150}
              y1={H - (H - HZ) * d}
              x2={150}
              y2={H - (H - HZ) * d2}
              stroke={ink}
              strokeWidth={3.4 * (1 - d) + 0.6}
            />
          );
        })}

        {/* the tree at the left edge, and its leaves */}
        <rect x={46} y={62} width={6} height={34} fill={ink} opacity="0.55" />
        <circle cx={50} cy={46} r={30} fill="none" stroke={ink} strokeWidth="0.9" opacity="0.45" />
        {LEAVES_A.map((a, i) => {
          const b = LEAVES_B[i];
          return (
            <circle
              key={i}
              cx={a.x + (b.x - a.x) * leafT}
              cy={a.y + (b.y - a.y) * leafT}
              r={a.r + (b.r - a.r) * leafT}
              fill={ink}
            />
          );
        })}

        {/* the car ahead, in the next lane until it is not */}
        <g>
          <rect
            x={carX - carW / 2}
            y={carY - 13}
            width={carW}
            height={22}
            fill="none"
            stroke={ink}
            strokeWidth="1.3"
          />
          <path
            d={`M ${carX - carW / 2 + 4} ${carY - 13} L ${carX - carW / 2 + 7} ${carY - 21} L ${
              carX + carW / 2 - 7
            } ${carY - 21} L ${carX + carW / 2 - 4} ${carY - 13}`}
            fill="none"
            stroke={ink}
            strokeWidth="1"
          />
        </g>
      </g>
    </svg>
  );
}

function Bar({
  label,
  value,
  tone,
  stacked,
}: {
  label: string;
  value: number;
  tone: string;
  stacked: boolean;
}) {
  const track = (
    <span className="relative h-3 flex-1 bg-paper-sunk">
      <span className="absolute inset-y-0 left-0" style={{ width: `${value}%`, background: tone }} />
    </span>
  );
  if (stacked) {
    return (
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="label !text-[0.62rem]">{label}</span>
          <span className="label tnum !text-ink">{Math.round(value)}</span>
        </div>
        <div className="mt-1 flex">{track}</div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <span className="label w-[9.5rem] shrink-0 !text-[0.62rem]">{label}</span>
      {track}
      <span className="label tnum w-8 shrink-0 text-right !text-ink">{Math.round(value)}</span>
    </div>
  );
}

export function WhatCountsAsWrong() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  /** the observer sees the content box, so 520 is a 640 wide figure minus its padding */
  const { ref, compact } = useCompact(520);
  const uid = useId().replace(/:/g, "");
  const [change, setChange] = useState<Change>("leaves");
  const [amount, setAmount] = useState(10);

  const a = amount / 10;
  const px = PIXEL[change](a);
  const ds = DESC[change](a);

  const name = change === "leaves" ? T.nLeaves : change === "shift" ? T.nShift : T.nCar;
  const line =
    amount === 0
      ? T.vZero
      : `${change === "leaves" ? T.vLeaves : change === "shift" ? T.vShift : T.vCar}${
          amount > 5 ? `${T.sep}${T.vBoth}` : ""
        }`;

  const btn = (active: boolean) =>
    `border px-3.5 py-1.5 text-[0.82rem] transition-colors ${
      active
        ? "border-imagine bg-imagine text-paper"
        : "border-rule-strong bg-paper text-ink hover:border-ink"
    }`;

  return (
    <div>
      <div
        ref={ref}
        role="img"
        aria-label={T.aria(name, amount, Math.round(px), Math.round(ds))}
        className="px-5 pt-6 md:px-8"
      >
        <div className={`grid gap-4 ${compact ? "grid-cols-1" : "grid-cols-2"}`}>
          <div>
            <Scene ink="var(--actual)" leafT={0} shiftX={0} carT={0} clip={`${uid}a`} />
            <p className="label mt-2 !text-[0.62rem]">{T.happened}</p>
          </div>
          <div>
            <Scene
              ink="var(--imagine)"
              leafT={change === "leaves" ? a : 0}
              shiftX={change === "shift" ? a * MAX_SHIFT : 0}
              carT={change === "car" ? a : 0}
              clip={`${uid}b`}
            />
            <p className="label mt-2 !text-[0.62rem] !text-imagine">{T.said}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <Bar label={T.pixel} value={px} tone="var(--ink-muted)" stacked={compact} />
          <Bar label={T.description} value={ds} tone="var(--imagine)" stacked={compact} />
        </div>
        <p className="label mt-3 text-right !text-[0.6rem] !text-ink-faint">{T.note}</p>
      </div>

      <div
        data-print-hide
        className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8"
      >
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["leaves", T.bLeaves],
              ["shift", T.bShift],
              ["car", T.bCar],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={change === id}
              className={btn(change === id)}
              onClick={() => setChange(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="flex min-w-[14rem] flex-1 items-center gap-3">
          <span className="label whitespace-nowrap">{T.howMuch}</span>
          <input
            type="range"
            min={0}
            max={10}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-6 text-right !text-ink">{amount}</span>
        </label>

        <p
          aria-live="polite"
          className="label basis-full !normal-case !tracking-normal !text-[0.8rem]"
        >
          {line}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.cChange, name],
          [T.pixel, String(Math.round(px))],
          [T.description, String(Math.round(ds))],
        ].map(([label, value]) => (
          <div key={label} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{label}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
