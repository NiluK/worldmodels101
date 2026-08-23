"use client";

import { useState } from "react";
import { useT } from "./locale-provider";
import { useCompact } from "./use-compact";
import { useSweep } from "./use-sweep";
import { PlayButton } from "./play-button";

/**
 * The same model, run two ways.
 *
 * Training hands the model the true previous state at every step, so its
 * mistakes never get to feed anything. Deployment hands it its own last answer,
 * so they feed everything. The model is identical in both lines here, with the
 * identical per-step bias; the only difference is what it was given to start
 * each step from.
 *
 * That gap is the whole chapter, and it is the reason a model can look
 * excellent during training and come apart the moment it is asked to run.
 */

const W = 660;
const H = 320;
const STEPS = 50;

/** the world: a point going round, losing a little speed */
const TURN = 0.19;
const DECAY = 0.994;

function step(p: [number, number], turn: number, decay: number): [number, number] {
  const [x, y] = p;
  const c = Math.cos(turn), s = Math.sin(turn);
  return [(x * c - y * s) * decay, (x * s + y * c) * decay];
}

/**
 * The view scales to whatever the current run needs, so the drawing stays
 * legible at every slider position instead of being sized for the worst case
 * and tiny everywhere else. It is a view transform, not a change to the data.
 */
const fit = (pts: [number, number][][]) => {
  const r = Math.max(1, ...pts.flat().map(([x, y]) => Math.hypot(x, y)));
  return (H / 2 - 26) / r;
};
const path = (pts: [number, number][], k: number) =>
  pts
    .map(([x, y], i) => `${i ? "L" : "M"} ${(W / 2 + x * k).toFixed(1)} ${(H / 2 + y * k).toFixed(1)}`)
    .join(" ");

/** truth, plus the same flawed model run corrected and run loose */
function rollouts(n: number, biasPct: number) {
  // the model is wrong about the turn and about the decay, so its mistakes
  // change the shape of the path rather than only the position along it
  const bt = 1 + biasPct / 100;
  const bd = 1 + biasPct / 220;
  const real: [number, number][] = [[1, 0]];
  for (let i = 0; i < n; i++) real.push(step(real[i], TURN, DECAY));

  // corrected: every step starts from the true state
  const forced: [number, number][] = [real[0]];
  for (let i = 0; i < n; i++) forced.push(step(real[i], TURN * bt, DECAY * bd));

  // loose: every step starts from its own last answer
  const free: [number, number][] = [real[0]];
  for (let i = 0; i < n; i++) free.push(step(free[i], TURN * bt, DECAY * bd));

  const gap = (a: [number, number][], b: [number, number][]) =>
    Math.hypot(a[a.length - 1][0] - b[b.length - 1][0], a[a.length - 1][1] - b[b.length - 1][1]);
  return { real, forced, free, forcedGap: gap(real, forced), freeGap: gap(real, free) };
}

export function FreeRunning() {
  const t = useT();
  const { ref, compact } = useCompact(520);
  const fs = compact ? 16 : 10;
  const [n, setN] = useState(30);
  const [bias, setBias] = useState(4);
  const nSweep = useSweep({ value: n, min: 4, max: STEPS, step: 1, setValue: setN });
  const { real, forced, free, forcedGap, freeGap } = rollouts(n, bias);
  const k = fit([real, forced, free]);

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={t("fr.aria", { n: String(n), b: String(bias) })}>
          <path d={path(real, k)} fill="none" stroke="var(--actual)" strokeWidth="2.6" />
          <path d={path(free, k)} fill="none" stroke="var(--imagine)" strokeWidth="2"
            strokeDasharray="5 4" />
          {/* drawn last so it is not buried under the line it is being compared to */}
          <path d={path(forced, k)} fill="none" stroke="var(--ink-muted)" strokeWidth="1.4"
            strokeDasharray="2 3" />
          {[[real, "var(--actual)"], [forced, "var(--ink-muted)"], [free, "var(--imagine)"]].map(
            ([p, c], i) => {
              const pts = p as [number, number][];
              const e = pts[pts.length - 1];
              return (
                <circle key={i} cx={W / 2 + e[0] * k} cy={H / 2 + e[1] * k} r={4.5}
                  fill={c as string} stroke="var(--paper-raised)" strokeWidth="1.5" />
              );
            },
          )}
          <text x={16} y={22} className="font-mono" fontSize={fs} fill="var(--actual)">
            {t("fr.real")}
          </text>
          <text x={16} y={22 + fs * 1.6} className="font-mono" fontSize={fs} fill="var(--ink-muted)">
            {t("fr.forced")}
          </text>
          <text x={16} y={22 + fs * 3.2} className="font-mono" fontSize={fs} fill="var(--imagine)">
            {t("fr.free")}
          </text>
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-full flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[18rem]">
          <span className="label whitespace-nowrap">{t("fr.steps")}</span>
          <input type="range" min={4} max={STEPS} value={n}
            onChange={(e) => { nSweep.stop(); setN(Number(e.target.value)); }}
            className="h-1 min-w-[7rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-9 text-right !text-ink">{n}</span>
          <PlayButton playing={nSweep.playing} onClick={nSweep.toggle} />
        </label>
        <label className="flex min-w-full flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[18rem]">
          <span className="label whitespace-nowrap">{t("fr.bias")}</span>
          <input type="range" min={1} max={8} value={bias}
            onChange={(e) => {setBias(Number(e.target.value)); }}
            className="h-1 min-w-[7rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-10 text-right !text-ink">{bias}%</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("fr.offForced")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{forcedGap.toFixed(3)}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("fr.offFree")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{freeGap.toFixed(3)}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("fr.ratio")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">
            {forcedGap > 1e-6 ? `${(freeGap / forcedGap).toFixed(0)}×` : "–"}
          </p>
        </div>
      </div>
    </div>
  );
}
