"use client";

import { useMemo, useState } from "react";

/**
 * Compounding error, made draggable.
 *
 * Two trajectories from the same starting state: one under the real dynamics,
 * one under a model that is very slightly wrong. At H=1 you cannot tell them
 * apart. The whole point is that nothing goes wrong at any single step; the
 * error is the accumulation, so the only way to see it is to keep going.
 */

const STEPS = 60;
const W = 900;
const H_PX = 260;
const FLOOR = H_PX - 26;
const DX = (W - 60) / STEPS;

/** true dynamics vs a model that is off by a few percent */
const TRUE = { g: 1.55, rest: 0.86 };
const MODEL = { g: 1.4, rest: 0.92 };

function roll({ g, rest }: { g: number; rest: number }) {
  const pts: [number, number][] = [];
  let x = 30;
  let y = 40;
  let vy = 0;
  for (let i = 0; i <= STEPS; i++) {
    pts.push([x, y]);
    vy += g;
    y += vy;
    x += DX;
    if (y > FLOOR) {
      y = FLOOR;
      vy = -vy * rest;
    }
  }
  return pts;
}

const path = (pts: [number, number][]) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

export function HorizonSlider() {
  const [h, setH] = useState(1);
  const actual = useMemo(() => roll(TRUE), []);
  const imagined = useMemo(() => roll(MODEL), []);

  const a = actual[h];
  const m = imagined[h];
  const gap = Math.hypot(a[0] - m[0], a[1] - m[1]);
  // in step-widths, so the number means something without a unit
  const gapSteps = gap / DX;

  /**
   * Bouncing is periodic, so the two paths keep re-crossing and the gap at any
   * one step is a poor summary. The curve below shows every step, and the worst
   * gap so far is what a planner would actually care about.
   */
  const gaps = useMemo(
    () => actual.map((pt, i) => Math.hypot(pt[0] - imagined[i][0], pt[1] - imagined[i][1]) / DX),
    [actual, imagined],
  );
  const worst = Math.max(...gaps.slice(0, h + 1));
  const gapMax = Math.max(...gaps);

  return (
    <div>
      <div className="overflow-x-auto px-5 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H_PX}`} className="block w-full min-w-[560px]" role="img"
          aria-label={`Two trajectories from one starting state. After ${h} steps the model is ${gapSteps.toFixed(1)} step-widths away from the truth.`}>
          <defs>
            <pattern id="hgrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M30 0 L0 0 0 30" fill="none" stroke="var(--rule)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={W} height={H_PX} fill="url(#hgrid)" opacity="0.55" />
          <line x1="0" y1={FLOOR + 8} x2={W} y2={FLOOR + 8} stroke="var(--rule-strong)" strokeWidth="1" />

          {/* what actually happens */}
          <path d={path(actual.slice(0, h + 1))} fill="none"
            stroke="var(--actual)" strokeWidth="2.5" strokeLinecap="round" />
          {/* what the model believes happens */}
          <path d={path(imagined.slice(0, h + 1))} fill="none"
            stroke="var(--imagine)" strokeWidth="2.5" strokeDasharray="5 5" strokeLinecap="round" />

          {/* the gap between them at this horizon */}
          {gap > 3 && (
            <line x1={a[0]} y1={a[1]} x2={m[0]} y2={m[1]}
              stroke="var(--imagine)" strokeWidth="1.2" strokeDasharray="2 3" />
          )}
          <circle cx={a[0]} cy={a[1]} r="6" fill="var(--actual)" stroke="var(--paper)" strokeWidth="2" />
          <circle cx={m[0]} cy={m[1]} r="6" fill="var(--imagine)" stroke="var(--paper)" strokeWidth="2" />
        </svg>
      </div>

      {/* how the gap actually behaves: growing, but not smoothly */}
      <div className="overflow-x-auto px-5 md:px-8">
        <svg viewBox={`0 0 ${W} 74`} className="block w-full min-w-[560px]" aria-hidden="true">
          <line x1="30" y1="62" x2={W - 30} y2="62" stroke="var(--rule-strong)" strokeWidth="1" />
          <text x="30" y="14" className="font-mono" fontSize="10" letterSpacing="1" fill="var(--ink-faint)">
            gap, every step
          </text>
          <path
            d={gaps
              .map((g, i) => `${i ? "L" : "M"} ${(30 + i * DX).toFixed(1)} ${(62 - (g / gapMax) * 44).toFixed(1)}`)
              .join(" ")}
            fill="none" stroke="var(--rule-strong)" strokeWidth="1.2"
          />
          <path
            d={gaps.slice(0, h + 1)
              .map((g, i) => `${i ? "L" : "M"} ${(30 + i * DX).toFixed(1)} ${(62 - (g / gapMax) * 44).toFixed(1)}`)
              .join(" ")}
            fill="none" stroke="var(--imagine)" strokeWidth="2"
          />
          <circle cx={30 + h * DX} cy={62 - (gaps[h] / gapMax) * 44} r="4" fill="var(--imagine)" />
        </svg>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-[18rem] flex-1 items-center gap-3">
          <span className="label whitespace-nowrap">Horizon H</span>
          <input
            type="range"
            min={1}
            max={STEPS}
            value={h}
            onChange={(e) => setH(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-12 text-right !text-ink">{h}</span>
        </label>

        <p className="label !normal-case !tracking-normal !text-[0.8rem]">
          {worst < 0.4
            ? "Indistinguishable so far."
            : worst < 1.5
              ? "Drifting apart."
              : worst < 3.5
                ? "Visibly different futures."
                : "One bounced a step late, and they never recovered."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          ["Steps predicted", String(h)],
          ["Gap right now", `${gapSteps.toFixed(1)} step-widths`],
          ["Worst gap so far", `${worst.toFixed(1)} step-widths`],
        ].map(([k, v]) => (
          <div key={k} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{k}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
