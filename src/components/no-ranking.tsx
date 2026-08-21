"use client";

import { useState } from "react";
import { useT } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * Why nobody can tell you which of these is best.
 *
 * Three systems, four ways of scoring them, and a different winner under each.
 * The scores are made up and the figure says so; what is not made up is the
 * structure, which is that these measures genuinely disagree and there is no
 * accepted way to combine them.
 *
 * A leaderboard needs an agreed ordering. This subject does not have one, and
 * that is a statement about the field rather than about any of the systems.
 */

const SYSTEMS = ["a", "b", "c"] as const;
type Metric = { key: string; scores: number[] };
const METRICS: Metric[] = [
  { key: "fidelity", scores: [0.91, 0.62, 0.74] },
  { key: "consistency", scores: [0.44, 0.88, 0.61] },
  { key: "control", scores: [0.55, 0.49, 0.93] },
  { key: "cost", scores: [0.28, 0.71, 0.52] },
];

export function NoRanking() {
  const t = useT();
  const { ref } = useCompact(520);
  const [m, setM] = useState(0);
  const metric = METRICS[m];
  const winner = metric.scores.indexOf(Math.max(...metric.scores));

  return (
    <div>
      <div ref={ref} className="px-5 pt-6 md:px-8">
        <div className="flex flex-wrap gap-2">
          {METRICS.map((x, i) => (
            <button key={x.key} onClick={() => setM(i)}
              className={`border px-3 py-1.5 transition-colors ${i === m ? "border-ink bg-ink" : "border-rule-strong hover:border-ink"}`}>
              <span className={`label !text-[0.6rem] ${i === m ? "!text-paper" : ""}`}>
                {t(`nr.${x.key}`)}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {SYSTEMS.map((sys, i) => {
            const v = metric.scores[i];
            const won = i === winner;
            return (
              <div key={sys}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className={`label !text-[0.62rem] ${won ? "!text-ink" : ""}`}>
                    {t(`nr.sys.${sys}`)}
                  </span>
                  <span className="label tnum !text-ink">{v.toFixed(2)}</span>
                </div>
                <div className="mt-1.5 h-4 bg-rule">
                  <div className="h-full transition-all duration-300"
                    style={{ width: `${v * 100}%`, background: won ? "var(--imagine)" : "var(--actual)" }} />
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-5 text-[0.9rem] leading-relaxed text-ink-muted">{t(`nr.${metric.key}.note`)}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("nr.bestBy")}</p>
          <p className="mt-1 text-[0.98rem] text-ink">{t(`nr.sys.${SYSTEMS[winner]}`)}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("nr.overall")}</p>
          <p className="mt-1 text-[0.98rem] leading-snug text-ink">{t("nr.overallA")}</p>
        </div>
      </div>
    </div>
  );
}
