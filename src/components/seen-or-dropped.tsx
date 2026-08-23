"use client";

import { useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * The squeeze as a one way door.
 *
 * One frame from a driving game, the thirty two numbers it was crushed to, and
 * the steering that reads only those numbers. Change the bend or the car and
 * some of the numbers move, and the steering moves with them. Reshuffle the
 * gravel or reshape the cloud and the picture is plainly different while not
 * one number moves, so nothing after the squeeze ever hears about it.
 *
 * What is dropped here is the arrangement of high frequency detail: which
 * grains, which outline. Not the amount of gravel and not the brightness of
 * the sky. Thirty two is Ha and Schmidhuber's number; the bars, which of them
 * move, and the steering values are all illustrative.
 */

type Change = "none" | "bend" | "car" | "gravel" | "cloud";

const FW = 640;
const FH = 240;
const HZ = 88;

/** the fixed height pattern: the same thirty two bars on every render */
const BARS = [
  0.42, 0.71, 0.28, 0.55, 0.83, 0.36, 0.62, 0.19, 0.74, 0.47, 0.31, 0.88, 0.24, 0.66, 0.52, 0.39,
  0.77, 0.22, 0.58, 0.45, 0.69, 0.33, 0.81, 0.27, 0.6, 0.5, 0.35, 0.72, 0.41, 0.64, 0.29, 0.56,
];

/** which bars move, fixed per change so the same press draws the same thing */
const MOVES: Record<Change, Record<number, number>> = {
  none: {},
  bend: { 3: 0.22, 9: -0.16, 14: 0.29, 21: 0.13, 27: -0.21 },
  car: { 6: 0.25, 17: -0.14, 25: 0.19 },
  gravel: {},
  cloud: {},
};

const STEERING: Record<Change, number> = { none: 0, bend: 0.3, car: -0.2, gravel: 0, cloud: 0 };

/** depth 0 at the bottom edge, 1 at the horizon */
const depthY = (d: number) => FH - (FH - HZ) * d;
/** linear against a linear depth, so the road edges come out straight */
const halfWidth = (d: number) => 210 - 194 * d;
const centreX = (d: number, bend: number, shift: number) => 320 + shift + bend * Math.pow(d, 2.2);

/** two fixed scatters of the same size: the same gravel, every grain somewhere else */
function scatter(seed: number, count: number) {
  let s = seed;
  const rnd = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  return Array.from({ length: count }, () => ({
    side: rnd() < 0.5 ? -1 : 1,
    d: Math.pow(rnd(), 0.7) * 0.84,
    u: 0.06 + rnd() * 0.86,
    j: (rnd() - 0.5) * 5,
  }));
}
const GRAVEL_A = scatter(20180501, 34);
const GRAVEL_B = scatter(77123409, 34);

/** two cloud outlines, near enough the same area of sky */
const CLOUD_A = [
  { x: 128, y: 46, r: 16 },
  { x: 152, y: 37, r: 20 },
  { x: 180, y: 45, r: 14 },
  { x: 158, y: 52, r: 15 },
];
const CLOUD_B = [
  { x: 126, y: 41, r: 19 },
  { x: 150, y: 49, r: 15 },
  { x: 176, y: 39, r: 17 },
  { x: 148, y: 33, r: 13 },
];

type Strings = {
  frameLabel: string;
  numbersLabel: string;
  steeringLabel: string;
  bend: string;
  car: string;
  gravel: string;
  cloud: string;
  putBack: string;
  ofN: (n: number) => string;
  cChange: string;
  cMoved: string;
  cSteering: string;
  nameNone: string;
  nameBend: string;
  nameCar: string;
  nameGravel: string;
  nameCloud: string;
  unchanged: string;
  vNone: string;
  vBend: string;
  vCar: string;
  vGravel: string;
  vCloud: string;
  note: string;
  aria: (c: Change) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    frameLabel: "the frame",
    numbersLabel: "the thirty two numbers",
    steeringLabel: "steering",
    bend: "Move the bend",
    car: "Move the car towards the kerb",
    gravel: "Reshuffle the gravel",
    cloud: "Change the shape of the cloud",
    putBack: "Put it back",
    ofN: (n) => `${n} of 32`,
    cChange: "Change",
    cMoved: "Numbers that moved",
    cSteering: "Steering",
    nameNone: "none",
    nameBend: "the bend",
    nameCar: "the car",
    nameGravel: "the gravel",
    nameCloud: "the cloud",
    unchanged: "unchanged",
    vNone: "This is the frame as it was recorded. Pick a change and watch the thirty two numbers.",
    vBend: "The bend moved. Five of the thirty two numbers moved with it, and the steering followed.",
    vCar: "The car is nearer the kerb. Three numbers moved, and the steering followed.",
    vGravel:
      "Every grain of gravel is somewhere else and the frame plainly looks different. Not one of the thirty two numbers moved, so nothing after the squeeze can tell.",
    vCloud:
      "The cloud is a different shape. Not one number moved, and the steering has not heard about it.",
    note: "the numbers are illustrative",
    aria: (c) => {
      const scene =
        c === "bend"
          ? "the bend further up moved the other way"
          : c === "car"
            ? "the car moved towards the kerb"
            : c === "gravel"
              ? "the gravel reshuffled"
              : c === "cloud"
                ? "the cloud a different shape"
                : "as it was recorded";
      const n = Object.keys(MOVES[c]).length;
      return `A driving frame with ${scene}. ${
        n === 0
          ? "None of the thirty two numbers moved and the steering is unchanged."
          : `${n} of the thirty two numbers moved and the steering moved with them.`
      }`;
    },
  },
};

/** the recorded view: road, markings, bonnet, verge, one cloud */
function Frame({ change }: { change: Change }) {
  const bend = change === "bend" ? -46 : 42;
  const shift = change === "car" ? 26 : 0;
  const gravel = change === "gravel" ? GRAVEL_B : GRAVEL_A;
  const cloud = change === "cloud" ? CLOUD_B : CLOUD_A;

  const steps = 22;
  const ds = Array.from({ length: steps + 1 }, (_, n) => n / steps);
  const left = ds.map((d) => [centreX(d, bend, shift) - halfWidth(d), depthY(d)] as const);
  const right = ds.map((d) => [centreX(d, bend, shift) + halfWidth(d), depthY(d)] as const);
  const road = [
    ...left.map(([x, y], n) => `${n ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`),
    ...[...right].reverse().map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`),
    "Z",
  ].join(" ");

  const dashes = [0.14, 0.3, 0.44, 0.56, 0.66, 0.75, 0.83];

  return (
    <svg viewBox={`0 0 ${FW} ${FH}`} className="block w-full" aria-hidden>
      <rect width={FW} height={HZ} fill="var(--paper-sunk)" />
      <rect y={HZ} width={FW} height={FH - HZ} fill="var(--terrain-2)" opacity="0.5" />
      <rect y={HZ} width={FW} height={26} fill="var(--terrain-1)" opacity="0.5" />
      <line x1="0" y1={HZ} x2={FW} y2={HZ} stroke="var(--rule-strong)" strokeWidth="1" />

      {/* one cloud, flat fill and a hairline */}
      <g>
        {cloud.map((c, n) => (
          <circle key={n} cx={c.x} cy={c.y} r={c.r} fill="var(--paper)" />
        ))}
        {cloud.map((c, n) => (
          <circle
            key={`o${n}`}
            cx={c.x}
            cy={c.y}
            r={c.r}
            fill="none"
            stroke="var(--rule)"
            strokeWidth="0.8"
          />
        ))}
      </g>

      <path d={road} fill="var(--paper)" stroke="var(--rule-strong)" strokeWidth="1.2" />

      {/* lane markings down the middle */}
      {dashes.map((d, n) => {
        const d2 = Math.min(d + 0.075 * (1 - d), 0.96);
        return (
          <line
            key={n}
            x1={centreX(d, bend, shift)}
            y1={depthY(d)}
            x2={centreX(d2, bend, shift)}
            y2={depthY(d2)}
            stroke="var(--ink-muted)"
            strokeWidth={5 * (1 - d) + 0.8}
            strokeLinecap="butt"
          />
        );
      })}

      {/* gravel on the verge either side */}
      {gravel.map((g, n) => {
        const c = centreX(g.d, bend, shift);
        const edge = c + g.side * halfWidth(g.d);
        const outer = g.side < 0 ? -12 : FW + 12;
        const x = edge + (outer - edge) * g.u;
        const y = depthY(g.d) + g.j * (1 - g.d);
        if (x < 1 || x > FW - 1 || y < HZ + 2) return null;
        return (
          <circle
            key={n}
            cx={x.toFixed(1)}
            cy={y.toFixed(1)}
            r={(1 + 1.4 * (1 - g.d)).toFixed(2)}
            fill="var(--terrain-4)"
          />
        );
      })}

      {/* the car's own bonnet, near the bottom edge */}
      <g>
        <path
          d={`M ${64 + shift * 0.3} ${FH} L ${64 + shift * 0.3} 228 Q ${320 + shift * 0.3} 188 ${
            576 + shift * 0.3
          } 228 L ${576 + shift * 0.3} ${FH} Z`}
          fill="var(--paper-sunk)"
          stroke="var(--ink)"
          strokeWidth="1.2"
        />
        <line
          x1={320 + shift * 0.3}
          y1={196}
          x2={320 + shift * 0.3}
          y2={FH}
          stroke="var(--rule-strong)"
          strokeWidth="0.8"
        />
      </g>
    </svg>
  );
}

export function SeenOrDropped() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const { ref, compact } = useCompact(560);
  const [change, setChange] = useState<Change>("none");

  const moves = MOVES[change];
  const movedCount = Object.keys(moves).length;
  const steer = STEERING[change];

  const verdict =
    change === "none"
      ? T.vNone
      : change === "bend"
        ? T.vBend
        : change === "car"
          ? T.vCar
          : change === "gravel"
            ? T.vGravel
            : T.vCloud;

  const name =
    change === "none"
      ? T.nameNone
      : change === "bend"
        ? T.nameBend
        : change === "car"
          ? T.nameCar
          : change === "gravel"
            ? T.nameGravel
            : T.nameCloud;

  const signed = `${steer > 0 ? "+" : ""}${steer.toFixed(1)}`;

  const btn = (active: boolean) =>
    `label h-9 border px-4 transition-colors ${
      active
        ? "border-imagine bg-imagine !text-paper"
        : "border-rule-strong bg-paper !text-ink hover:border-ink"
    }`;

  const BW = 320;
  const BH = 56;
  const base = 46;
  const maxH = 36;
  const pitch = (BW - 12) / 32;

  return (
    <div>
      <div ref={ref} role="img" aria-label={T.aria(change)} className="px-5 pt-6 md:px-8">
        <p className="label mb-2">{T.frameLabel}</p>
        <Frame change={change} />

        <p className="label mb-1 mt-5">{T.numbersLabel}</p>
        <div className={`flex gap-4 ${compact ? "flex-col items-start" : "items-end"}`}>
          <svg viewBox={`0 0 ${BW} ${BH}`} className="block w-full flex-1" aria-hidden>
            <line x1="6" y1={base} x2={BW - 6} y2={base} stroke="var(--rule)" strokeWidth="1" />
            {BARS.map((h, n) => {
              const d = moves[n] ?? 0;
              const hNew = Math.max(0.06, Math.min(1, h + d));
              const yOld = base - h * maxH;
              const yNew = base - hNew * maxH;
              const x = 6 + n * pitch + pitch / 2 - 2.6;
              const lowTop = Math.max(yOld, yNew);
              return (
                <g key={n}>
                  <rect
                    x={x}
                    y={lowTop}
                    width={5.2}
                    height={base - lowTop}
                    fill="var(--ink-muted)"
                  />
                  {d !== 0 && (
                    <>
                      <rect
                        x={x}
                        y={Math.min(yOld, yNew)}
                        width={5.2}
                        height={Math.abs(yOld - yNew)}
                        fill="var(--imagine)"
                        opacity={d > 0 ? 1 : 0.35}
                      />
                      <rect x={x - 0.8} y={yNew - 1.6} width={6.8} height={1.8} fill="var(--imagine)" />
                    </>
                  )}
                </g>
              );
            })}
          </svg>
          <p className={`label tnum shrink-0 ${movedCount ? "!text-imagine" : ""}`}>
            {T.ofN(movedCount)}
          </p>
        </div>

        <p className="label mb-2 mt-5">{T.steeringLabel}</p>
        <div className="flex max-w-[18rem] items-center gap-3">
          <span className="relative h-px flex-1 bg-rule-strong">
            <span className="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-rule" />
            <span
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${50 + steer * 46}%`,
                background: steer === 0 ? "var(--ink-muted)" : "var(--imagine)",
              }}
            />
          </span>
          <span
            className={`label tnum w-10 shrink-0 text-right ${steer === 0 ? "" : "!text-imagine"}`}
          >
            {signed}
          </span>
        </div>
        <p className="label mt-3 text-right !text-[0.6rem] !text-ink-faint">{T.note}</p>
      </div>

      <div
        data-print-hide
        className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8"
      >
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["bend", T.bend],
              ["car", T.car],
              ["gravel", T.gravel],
              ["cloud", T.cloud],
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
        <button
          type="button"
          className="label h-9 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink"
          onClick={() => setChange("none")}
        >
          {T.putBack}
        </button>
        <p
          aria-live="polite"
          className="label basis-full !normal-case !tracking-normal !text-[0.8rem]"
        >
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.cChange, name],
          [T.cMoved, T.ofN(movedCount)],
          [T.cSteering, steer === 0 ? `${signed} ${T.unchanged}` : signed],
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
