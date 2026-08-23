"use client";

import { useState } from "react";
import { useT } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * The same message, written down by predictors of increasing quality.
 *
 * A symbol you expected costs almost nothing to send; a symbol you did not
 * costs a lot. So the length of the shortest message you can write is a
 * measurement of how well you predicted, and improving the predictor and
 * improving the compressor are the same job.
 *
 * The bits per character are published estimates for English, not numbers this
 * component derived: Shannon's own experiments put a good human predictor near
 * the bottom of this range, and modern language models sit around there too.
 * The figure says so, because a made-up number would undercut the only point
 * it is making.
 */

const SENTENCE = "predict the next thing and check what actually arrived";
const N = SENTENCE.length;

/** model strength -> bits per character, and what kind of model that is */
const LEVELS = [
  { bpc: 4.76, key: "none" },     // 27 equally likely symbols
  { bpc: 4.07, key: "letter" },   // letter frequencies alone
  { bpc: 3.36, key: "bigram" },   // one letter of context
  { bpc: 2.77, key: "trigram" },  // two letters of context
  { bpc: 1.75, key: "word" },     // words and grammar
  { bpc: 1.05, key: "strong" },   // a good predictor, human or machine
];

export function PredictionCompression() {
  const t = useT();
  const { ref, compact } = useCompact(520);
  const [lvl, setLvl] = useState(0);
  const level = LEVELS[lvl];
  const bits = Math.round(N * level.bpc);
  const naive = Math.round(N * LEVELS[0].bpc);

  return (
    <div>
      <div ref={ref} className="px-5 pt-8 md:px-8">
        <p className="text-center font-mono text-[clamp(0.72rem,2vw,0.95rem)] text-ink">
          {SENTENCE}
        </p>

        {/* every level drawn at once, so the shrinking is the picture */}
        <div className="mt-8 flex flex-col gap-2">
          {LEVELS.map((l, i) => {
            const on = i === lvl;
            return (
              <button
                key={l.key}
                onClick={() => setLvl(i)}
                className="group grid grid-cols-[7.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-left max-sm:grid-cols-[minmax(0,1fr)_3.6rem]"
              >
                <span className={`label !text-[0.62rem] ${on ? "!text-ink" : ""} max-sm:hidden`}>
                  {t(`pc.${l.key}`)}
                </span>
                <span className="block h-5 bg-rule">
                  <span
                    className="block h-full transition-all duration-300"
                    style={{
                      width: `${(l.bpc / LEVELS[0].bpc) * 100}%`,
                      background: on ? "var(--imagine)" : "var(--actual)",
                      opacity: on ? 1 : 0.34,
                    }}
                  />
                </span>
                <span className={`label tnum text-right !text-[0.62rem] ${on ? "!text-ink" : ""}`}>
                  {Math.round(N * l.bpc)} {compact ? "b" : t("pc.bits")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div data-print-hide className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-full flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[16rem]">
          <span className="label whitespace-nowrap">{t("pc.strength")}</span>
          <input type="range" min={0} max={LEVELS.length - 1} value={lvl}
            onChange={(e) => setLvl(Number(e.target.value))}
            className="h-1 min-w-[7rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
        </label>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]">{t(`pc.${level.key}.note`)}</p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("pc.perChar")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{level.bpc.toFixed(2)}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("pc.message")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{bits} {t("pc.bits")}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("pc.saved")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">
            {lvl === 0 ? "–" : `${Math.round((1 - bits / naive) * 100)}%`}
          </p>
        </div>
      </div>
    </div>
  );
}
