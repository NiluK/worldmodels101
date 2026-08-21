"use client";

import { useState } from "react";
import { useT } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * The trade every sequence model makes.
 *
 * A recurrent model carries one fixed summary and updates it. The cost of a
 * step never changes, no matter how long the sequence gets, and the price is
 * that everything has to fit in that summary: anything it did not keep is
 * gone.
 *
 * Attention keeps every step and looks back over all of them. Nothing has to
 * be thrown away, and the price is that both the memory and the work per step
 * grow with how much there is to look at.
 *
 * The numbers are the actual scaling, computed from the width and the length
 * rather than asserted. Neither column is the winner; they are the two ends of
 * one trade.
 */

const D = 256; // width of the state, the same for both

const fmt = (n: number) =>
  n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n.toLocaleString("en-GB");

export function MemoryTrade() {
  const t = useT();
  const { ref } = useCompact(520);
  const [pow, setPow] = useState(7); // sequence length as a power of two
  const n = 2 ** pow;

  const rows = [
    {
      key: "carried",
      rec: fmt(D),
      att: fmt(n * D),
      note: "mt.carried.note",
    },
    {
      key: "perStep",
      rec: fmt(D * D),
      att: fmt(n * D),
      note: "mt.perStep.note",
    },
    {
      key: "reach",
      rec: t("mt.reach.rec"),
      att: t("mt.reach.att"),
      note: "mt.reach.note",
      words: true,
    },
  ];

  return (
    <div>
      <div ref={ref} className="px-5 pt-6 md:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,7rem)_minmax(0,7rem)] gap-x-4 gap-y-3">
          <span />
          <span className="label !text-[0.6rem]" style={{ color: "var(--actual)" }}>
            {t("mt.recurrent")}
          </span>
          <span className="label !text-[0.6rem]" style={{ color: "var(--imagine)" }}>
            {t("mt.attention")}
          </span>

          {rows.map((r) => (
            <span key={r.key} className="contents">
              <span className="border-t border-rule pt-3">
                <span className="label !text-[0.62rem] !text-ink">{t(`mt.${r.key}`)}</span>
                <span className="mt-1 block text-[0.82rem] leading-snug text-ink-muted">
                  {t(r.note)}
                </span>
              </span>
              <span className={`border-t border-rule pt-3 ${r.words ? "text-[0.9rem] leading-snug" : "tnum text-[1.05rem]"}`}
                style={{ color: "var(--actual)" }}>
                {r.rec}
              </span>
              <span className={`border-t border-rule pt-3 ${r.words ? "text-[0.9rem] leading-snug" : "tnum text-[1.05rem]"}`}
                style={{ color: "var(--imagine)" }}>
                {r.att}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div data-print-hide className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-full flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[16rem]">
          <span className="label whitespace-nowrap">{t("mt.length")}</span>
          <input type="range" min={3} max={13} value={pow}
            onChange={(e) => setPow(Number(e.target.value))}
            className="h-1 min-w-[7rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-14 text-right !text-ink">{fmt(n)}</span>
        </label>
        <p className="label !normal-case !tracking-normal !text-[0.8rem]">
          {t(pow <= 6 ? "mt.short" : pow <= 10 ? "mt.mid" : "mt.long")}
        </p>
      </div>

      <div className="border-t border-rule px-5 py-3 md:px-8">
        <p className="label">{t("mt.width", { d: String(D) })}</p>
      </div>
    </div>
  );
}
