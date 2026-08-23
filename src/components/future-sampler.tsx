"use client";

import { useMemo, useState } from "react";
import { useT } from "./locale-provider";

const SAMPLE_COUNT = 12;

function sample(seed: number, probability: number) {
  let x = (seed + 1) * 2654435761;
  return Array.from({ length: SAMPLE_COUNT }, () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 4294967296 < probability ? -1 : 1;
  });
}

/** Deterministic regression returns the mean. A stochastic model returns a distribution. */
export function FutureSampler() {
  const t = useT();
  const [probability, setProbability] = useState(50);
  const [mode, setMode] = useState<"mean" | "samples">("mean");
  const [seed, setSeed] = useState(0);
  const p = probability / 100;
  const draws = useMemo(() => sample(seed, p), [seed, p]);
  const mean = 1 - 2 * p;

  return (
    <div>
      <div className="px-5 pt-6 md:px-8">
        <div className="flex flex-wrap gap-2" data-print-hide>
          {(["mean", "samples"] as const).map((key) => (
            <button key={key} onClick={() => {setMode(key); }} className={`border px-3 py-1.5 transition-colors ${mode === key ? "border-ink bg-ink" : "border-rule-strong hover:border-ink"}`}>
              <span className={`label !text-[0.6rem] ${mode === key ? "!text-paper" : ""}`}>{t(`fs.${key}`)}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 grid min-h-56 grid-cols-3 gap-px bg-rule">
          {mode === "mean" ? (
            <>
              <FutureCell direction={-1} label={t("fs.left")} />
              <FutureCell direction={mean} label={t("fs.average")} ghost />
              <FutureCell direction={1} label={t("fs.right")} />
            </>
          ) : (
            <div className="col-span-3 grid grid-cols-4 gap-px bg-rule sm:grid-cols-6">
              {draws.map((direction, index) => <FutureCell compact key={`${seed}-${index}`} direction={direction} label={String(index + 1).padStart(2, "0")} />)}
            </div>
          )}
        </div>
      </div>

      <div data-print-hide className="mt-6 flex flex-wrap items-center gap-3 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-[15rem] flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          <span className="label whitespace-nowrap">{t("fs.leftChance")}</span>
          <input type="range" min={5} max={95} value={probability}
            onChange={(e) => {setProbability(Number(e.target.value)); }}
            className="h-1 min-w-[7rem] flex-1 cursor-pointer appearance-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-10 text-right !text-ink">{probability}%</span>
        </label>
        {mode === "samples" && <button onClick={() => setSeed((n) => n + 1)} className="border border-ink bg-ink px-3 py-2"><span className="label !text-paper">{t("fs.draw")}</span></button>}
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        <Stat label={t("fs.sharp")} text={t(mode === "mean" && p > 0.15 && p < 0.85 ? "fs.sharp.no" : "fs.sharp.yes")} />
        <Stat label={t("fs.uncertainty")} text={t(mode === "samples" ? "fs.uncertainty.kept" : "fs.uncertainty.lost")} />
      </div>
    </div>
  );
}

function FutureCell({ direction, label, ghost = false, compact = false }: { direction: number; label: string; ghost?: boolean; compact?: boolean }) {
  const y = 50 + direction * 28;
  return (
    <div className={`relative bg-paper ${compact ? "h-28" : "h-56"}`}>
      <svg viewBox="0 0 180 120" className="h-full w-full" aria-hidden>
        <path d={`M 22 60 C 65 60, 96 60, 150 ${y}`} fill="none" stroke={ghost ? "var(--imagine)" : "var(--actual)"} strokeWidth={ghost ? 5 : 2.5} opacity={ghost ? 0.35 : 1} />
        <circle cx="150" cy={y} r={ghost ? 10 : 6} fill={ghost ? "var(--imagine)" : "var(--actual)"} opacity={ghost ? 0.35 : 1} />
      </svg>
      <span className="label absolute bottom-2 left-3 !text-[0.56rem]">{label}</span>
    </div>
  );
}

function Stat({ label, text }: { label: string; text: string }) {
  return <div className="bg-paper px-5 py-3 md:px-8"><p className="label">{label}</p><p className="mt-1 text-[0.96rem] leading-snug text-ink">{text}</p></div>;
}
