"use client";

import { useState } from "react";
import { useT } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * What "it learned physics" can be checked to mean.
 *
 * The model here is fitted, by least squares, to the true behaviour over one
 * band of launch speeds. Inside that band it is right to within a few per
 * cent, and anyone testing it there would conclude it had the rule. It does
 * not have the rule: it has a straight line through the part of the curve it
 * was shown, and outside the band it is wrong by tens of per cent.
 *
 * That is the honest shape of the emergent-physics question. It is not "does
 * it know", which cannot be tested. It is "does it hold up where it has not
 * been", which can.
 */

const G = 9.81;
const W = 620;
const H = 250;
const PAD = { l: 46, r: 24, t: 24, b: 44 };

const TRAIN = [18, 34] as const;
/** true horizontal range of a projectile launched at forty-five degrees */
const truth = (v: number) => (v * v) / G;

/** a straight line fitted to the truth across the training band, and nothing else */
const MODEL = (() => {
  const vs = Array.from({ length: 17 }, (_, i) => TRAIN[0] + (i * (TRAIN[1] - TRAIN[0])) / 16);
  const n = vs.length;
  const sx = vs.reduce((a, v) => a + v, 0);
  const sy = vs.reduce((a, v) => a + truth(v), 0);
  const sxx = vs.reduce((a, v) => a + v * v, 0);
  const sxy = vs.reduce((a, v) => a + v * truth(v), 0);
  const m = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return { m, c: (sy - m * sx) / n };
})();
const model = (v: number) => MODEL.c + MODEL.m * v;

const V0 = 10;
const V1 = 70;
const MAXY = truth(V1);
const px = (v: number) => PAD.l + ((v - V0) / (V1 - V0)) * (W - PAD.l - PAD.r);
const py = (y: number) => PAD.t + (1 - Math.max(0, y) / MAXY) * (H - PAD.t - PAD.b);
const curve = (f: (v: number) => number) =>
  Array.from({ length: 121 }, (_, i) => {
    const v = V0 + ((V1 - V0) * i) / 120;
    return `${i ? "L" : "M"} ${px(v).toFixed(1)} ${py(f(v)).toFixed(1)}`;
  }).join(" ");

export function EmergentPhysics() {
  const t = useT();
  const { ref, compact } = useCompact(520);
  const fs = compact ? 16 : 10;
  const [v, setV] = useState(26);
  const inBand = v >= TRAIN[0] && v <= TRAIN[1];
  const err = (Math.abs(model(v) - truth(v)) / truth(v)) * 100;

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={t("ep.aria", { v: String(v), e: err.toFixed(0) })}>
          {/* the band it was shown */}
          <rect x={px(TRAIN[0])} y={PAD.t} width={px(TRAIN[1]) - px(TRAIN[0])}
            height={H - PAD.t - PAD.b} fill="var(--actual)" opacity={0.09} />
          <text x={(px(TRAIN[0]) + px(TRAIN[1])) / 2} y={PAD.t - 8} textAnchor="middle"
            className="font-mono" fontSize={fs} fill="var(--actual)">
            {t("ep.band")}
          </text>

          <line x1={PAD.l} y1={py(0)} x2={W - PAD.r} y2={py(0)} stroke="var(--rule)" strokeWidth="1" />
          <path d={curve(truth)} fill="none" stroke="var(--actual)" strokeWidth="2.6" />
          <path d={curve(model)} fill="none" stroke="var(--imagine)" strokeWidth="2.2"
            strokeDasharray="5 4" />

          <line x1={px(v)} y1={PAD.t} x2={px(v)} y2={py(0)} stroke="var(--ink)" strokeWidth="1.3" />
          <circle cx={px(v)} cy={py(truth(v))} r={4.5} fill="var(--actual)" />
          <circle cx={px(v)} cy={py(Math.max(0, model(v)))} r={4.5} fill="var(--imagine)" />

          <text x={PAD.l} y={H - 12} className="font-mono" fontSize={fs} fill="var(--ink-faint)">
            {t("ep.axis")}
          </text>
          <text x={W - PAD.r} y={H - 12} textAnchor="end" className="font-mono" fontSize={fs}
            fill="var(--ink-faint)">
            {t("ep.faster")}
          </text>
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-full flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[18rem]">
          <span className="label whitespace-nowrap">{t("ep.speed")}</span>
          <input type="range" min={V0} max={V1} value={v}
            onChange={(e) => setV(Number(e.target.value))}
            className="h-1 min-w-[7rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-16 text-right !text-ink">{v} m/s</span>
        </label>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]">
          {t(inBand ? "ep.inside" : "ep.outside")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label" style={{ color: "var(--actual)" }}>{t("ep.true")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{truth(v).toFixed(0)} m</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label" style={{ color: "var(--imagine)" }}>{t("ep.says")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{Math.max(0, model(v)).toFixed(0)} m</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("ep.off")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{err.toFixed(0)}%</p>
        </div>
      </div>
    </div>
  );
}
