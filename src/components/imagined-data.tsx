"use client";

import { useState } from "react";
import { useT } from "./locale-provider";

const TOTAL = 100;

/**
 * Imagined transitions are not exchangeable with real ones. This toy ledger
 * discounts synthetic experience as model error and rollout depth rise. The
 * discount is illustrative, not an estimator; its purpose is to make the
 * hidden assumption in "twenty imagined for one real" visible.
 */
export function ImaginedData() {
  const t = useT();
  const [share, setShare] = useState(70);
  const [error, setError] = useState(6);
  const real = TOTAL - share;
  const reliability = Math.exp(-(error / 100) * (1 + share / 18));
  const usefulDream = share * reliability;
  const useful = real + usefulDream;
  const contactCost = real;
  const computeCost = share * 0.08;
  const verdict = useful > 82 ? "id.v.good" : useful > 58 ? "id.v.thin" : "id.v.bad";

  return (
    <div>
      <div className="px-5 pt-7 md:px-8">
        <div className="space-y-5">
          <Ledger label={t("id.nominal")} value={100} tone="var(--ink-muted)" suffix="100" />
          <Ledger label={t("id.real")} value={real} tone="var(--actual)" suffix={real.toFixed(0)} />
          <Ledger label={t("id.dreamUseful")} value={usefulDream} tone="var(--imagine)" suffix={usefulDream.toFixed(0)} />
          <Ledger label={t("id.effective")} value={useful} tone="var(--ink)" suffix={useful.toFixed(0)} />
        </div>
        <p className="mt-6 max-w-[58ch] text-[0.94rem] leading-relaxed text-ink-muted">{t(verdict)}</p>
      </div>

      <div data-print-hide className="mt-6 grid grid-cols-1 gap-4 border-t border-rule px-5 py-4 md:grid-cols-2 md:px-8">
        <label className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="label whitespace-nowrap">{t("id.share")}</span>
          <input type="range" min={0} max={98} value={share} onChange={(e) => setShare(Number(e.target.value))}
            className="h-1 min-w-[7rem] flex-1 cursor-pointer appearance-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-10 text-right !text-ink">{share}%</span>
        </label>
        <label className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="label whitespace-nowrap">{t("id.error")}</span>
          <input type="range" min={0} max={18} value={error} onChange={(e) => setError(Number(e.target.value))}
            className="h-1 min-w-[7rem] flex-1 cursor-pointer appearance-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-10 text-right !text-ink">{error}%</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        <Stat label={t("id.reliability")} value={`${(reliability * 100).toFixed(0)}%`} />
        <Stat label={t("id.contactCost")} value={contactCost.toFixed(0)} />
        <Stat label={t("id.computeCost")} value={computeCost.toFixed(1)} />
      </div>
    </div>
  );
}

function Ledger({ label, value, tone, suffix }: { label: string; value: number; tone: string; suffix: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="label !text-[0.62rem]">{label}</span>
        <span className="label tnum !text-ink">{suffix}</span>
      </div>
      <div className="mt-1.5 h-4 bg-rule">
        <div className="h-full transition-[width] duration-300" style={{ width: `${Math.max(0, Math.min(100, value)).toFixed(2)}%`, background: tone }} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="bg-paper px-5 py-3 md:px-8"><p className="label">{label}</p><p className="tnum mt-1 text-[0.98rem] text-ink">{value}</p></div>;
}
