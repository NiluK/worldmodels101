"use client";

import { useState } from "react";
import { useT } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * Why you make the dream harder than the world.
 *
 * A policy trained inside a model is free to exploit anything the model gets
 * wrong, and it will, because the model's mistakes are the cheapest score in
 * there. Turning up the uncertainty in the dream takes that away: a quirk that
 * only shows up in one particular rollout stops being reliable enough to build
 * a policy on.
 *
 * Push it too far and there is no task left to learn. So the useful setting is
 * a hump, not a direction.
 *
 * The two curves are the reported shape rather than a simulation of any
 * specific system, and the figure says so. What is not invented is the finding
 * underneath: Ha and Schmidhuber's agent scored far better inside its own dream
 * than in the game, and raising the temperature is what closed the gap.
 */

const W = 620;
const H = 250;
const PAD = { l: 44, r: 24, t: 22, b: 46 };
const PX = (t: number) => PAD.l + t * (W - PAD.l - PAD.r);
const PY = (v: number) => PAD.t + (1 - v) * (H - PAD.t - PAD.b);

/** score inside the dream: falls as the dream gets noisier */
const dream = (t: number) => 0.97 - 0.62 * t * t;
/** score in the world: a hump, because both ends fail for different reasons */
const real = (t: number) => Math.max(0.04, 0.9 * Math.exp(-((t - 0.46) ** 2) / 0.055) + 0.05);

const curve = (f: (t: number) => number) =>
  Array.from({ length: 121 }, (_, i) => {
    const t = i / 120;
    return `${i ? "L" : "M"} ${PX(t).toFixed(1)} ${PY(f(t)).toFixed(1)}`;
  }).join(" ");

export function DreamTemperature() {
  const t = useT();
  const { ref, compact } = useCompact(520);
  const fs = compact ? 16 : 10;
  const [temp, setTemp] = useState(12);
  const x = temp / 100;
  const d = dream(x);
  const r = real(x);

  const verdict = x < 0.2 ? "dt.v.exploit" : x > 0.75 ? "dt.v.noise" : "dt.v.good";

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={t("dt.aria", { t: x.toFixed(2) })}>
          <line x1={PAD.l} y1={PY(0)} x2={W - PAD.r} y2={PY(0)} stroke="var(--rule)" strokeWidth="1" />
          <path d={curve(dream)} fill="none" stroke="var(--imagine)" strokeWidth="2.4"
            strokeDasharray="5 4" />
          <path d={curve(real)} fill="none" stroke="var(--actual)" strokeWidth="2.6" />

          <line x1={PX(x)} y1={PAD.t - 6} x2={PX(x)} y2={PY(0)} stroke="var(--ink)" strokeWidth="1.4" />
          <circle cx={PX(x)} cy={PY(d)} r={4.5} fill="var(--imagine)" />
          <circle cx={PX(x)} cy={PY(r)} r={4.5} fill="var(--actual)" />

          <text x={PAD.l} y={PAD.t - 8} className="font-mono" fontSize={fs} fill="var(--imagine)">
            {t("dt.inDream")}
          </text>
          <text x={PAD.l + (compact ? 300 : 232)} y={PAD.t - 8} className="font-mono" fontSize={fs}
            fill="var(--actual)">
            {t("dt.inWorld")}
          </text>
          <text x={PAD.l} y={H - 14} className="font-mono" fontSize={fs} fill="var(--ink-faint)">
            {t("dt.axisLow")}
          </text>
          <text x={W - PAD.r} y={H - 14} textAnchor="end" className="font-mono" fontSize={fs}
            fill="var(--ink-faint)">
            {t("dt.axisHigh")}
          </text>
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-full flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[18rem]">
          <span className="label whitespace-nowrap">{t("dt.temp")}</span>
          <input type="range" min={0} max={100} value={temp}
            onChange={(e) => setTemp(Number(e.target.value))}
            className="h-1 min-w-[7rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-12 text-right !text-ink">{x.toFixed(2)}</span>
        </label>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]">{t(verdict)}</p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label" style={{ color: "var(--imagine)" }}>{t("dt.inDream")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{d.toFixed(2)}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label" style={{ color: "var(--actual)" }}>{t("dt.inWorld")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{r.toFixed(2)}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("dt.gap")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{(d - r).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
