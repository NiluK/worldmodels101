"use client";

import { useState } from "react";
import { useT } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * What imagination actually buys, and what it charges.
 *
 * The loop is: act in the world, use what you collected to fit a model, then
 * train the behaviour inside that model, then go back out. Turning the
 * imagination ratio up buys down the one budget that is genuinely scarce, which
 * is contact with the world, and spends a budget that is not, which is compute.
 *
 * The arithmetic is exact and deliberately unflattering: the total experience
 * is held fixed, so raising the ratio does not conjure learning out of nothing.
 * It moves where the steps come from, and the cost moves with them.
 */

const TOTAL = 2_000_000; // steps of experience the learner needs, from anywhere
const REAL_COST = 1;     // seconds of wall clock per real step, robot-ish
const IMAG_COST = 0.0006;

const fmt = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(Math.round(n));

const hours = (s: number) =>
  s >= 86400 ? `${(s / 86400).toFixed(1)} d` : s >= 3600 ? `${(s / 3600).toFixed(1)} h` : `${Math.round(s / 60)} min`;

export function DreamBudget() {
  const t = useT();
  const { ref } = useCompact(520);
  const [ratio, setRatio] = useState(20);

  const real = Math.round(TOTAL / (1 + ratio));
  const imagined = TOTAL - real;
  const wall = real * REAL_COST + imagined * IMAG_COST;
  const allReal = TOTAL * REAL_COST;

  const bars = [
    { key: "real", v: real, tone: "var(--actual)" },
    { key: "imagined", v: imagined, tone: "var(--imagine)" },
  ];

  return (
    <div>
      <div ref={ref} className="px-5 pt-6 md:px-8">
        <div className="space-y-4">
          {bars.map((b) => (
            <div key={b.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="label !text-[0.62rem]" style={{ color: b.tone }}>
                  {t(`db.${b.key}`)}
                </span>
                <span className="label tnum !text-ink">{fmt(b.v)}</span>
              </div>
              <div className="mt-1.5 h-4 bg-rule">
                <div className="h-full transition-all duration-300"
                  style={{ width: `${(b.v / TOTAL) * 100}%`, background: b.tone }} />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-[0.9rem] leading-relaxed text-ink-muted">
          {t("db.note", { total: fmt(TOTAL) })}
        </p>
      </div>

      <div data-print-hide className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-full flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[16rem]">
          <span className="label whitespace-nowrap">{t("db.ratio")}</span>
          <input type="range" min={0} max={200} value={ratio}
            onChange={(e) => setRatio(Number(e.target.value))}
            className="h-1 min-w-[7rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-12 text-right !text-ink">{ratio}:1</span>
        </label>
        <p className="label !normal-case !tracking-normal !text-[0.8rem]">
          {t(ratio === 0 ? "db.v.none" : ratio < 30 ? "db.v.some" : "db.v.lots")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("db.contact")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{hours(real * REAL_COST)}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("db.wall")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{hours(wall)}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("db.versus")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{hours(allReal)}</p>
        </div>
      </div>
    </div>
  );
}
