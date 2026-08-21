"use client";

import { useState } from "react";
import { useT } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * Rollouts do not fail all at once, and knowing the order is more useful than
 * knowing the average error.
 *
 * The horizons here are illustrative of the ordering rather than measurements
 * of any named system, and the figure says so. What is not illustrative is the
 * shape: the properties that go first are the ones nothing is holding in place,
 * and the ones that survive longest are the ones a per-frame loss happens to
 * reward.
 *
 * That ordering is why "average pixel error stays low" and "the rollout is
 * still usable" are different claims.
 */

const PROPS = [
  { key: "colour", at: 900 },
  { key: "texture", at: 620 },
  { key: "layout", at: 240 },
  { key: "count", at: 120 },
  { key: "physics", at: 70 },
  { key: "identity", at: 40 },
] as const;

const MAX = 1000;

export function WhatBreaks() {
  const t = useT();
  const { ref } = useCompact(520);
  const [n, setN] = useState(30);
  const broken = PROPS.filter((p) => n >= p.at).length;

  return (
    <div>
      <div ref={ref} className="px-5 pt-6 md:px-8">
        <div className="space-y-2.5">
          {[...PROPS]
            .sort((a, b) => a.at - b.at)
            .map((p) => {
              const gone = n >= p.at;
              return (
                <div key={p.key} className="grid grid-cols-[minmax(0,1fr)_5.5rem] items-center gap-3">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`label !text-[0.62rem] ${gone ? "!text-ink-faint" : "!text-ink"}`}>
                        {t(`wb.${p.key}`)}
                      </span>
                      <span className="label tnum !text-[0.58rem] !text-ink-faint">
                        {t("wb.holdsTo", { n: String(p.at) })}
                      </span>
                    </div>
                    <div className="mt-1 h-3 bg-rule">
                      <div className="h-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (p.at / MAX) * 100)}%`,
                          background: gone ? "var(--rule-strong)" : "var(--actual)",
                        }} />
                    </div>
                  </div>
                  <span className={`label !text-[0.58rem] ${gone ? "!text-imagine" : "!text-ink-faint"}`}>
                    {t(gone ? "wb.gone" : "wb.holding")}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      <div data-print-hide className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-full flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[16rem]">
          <span className="label whitespace-nowrap">{t("wb.steps")}</span>
          <input type="range" min={1} max={MAX} value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="h-1 min-w-[7rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-14 text-right !text-ink">{n}</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("wb.brokenCount")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{broken} / {PROPS.length}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("wb.stillLooks")}</p>
          <p className="mt-1 text-[0.98rem] leading-snug text-ink">
            {t(broken === 0 ? "wb.v.fine" : broken < 4 ? "wb.v.looksOk" : "wb.v.gone")}
          </p>
        </div>
      </div>
    </div>
  );
}
