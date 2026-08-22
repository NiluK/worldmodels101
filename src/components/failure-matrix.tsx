"use client";

import { useState } from "react";
import { useT } from "./locale-provider";

const CONTRACTS = ["renderer", "simulator", "dynamics", "representation", "implicit"] as const;
const RISKS = ["persistence", "action", "horizon", "target", "verification"] as const;
type Level = 0 | 1 | 2 | 3;

const MATRIX: Record<(typeof CONTRACTS)[number], Level[]> = {
  renderer: [3, 3, 3, 2, 3],
  simulator: [1, 2, 2, 2, 1],
  dynamics: [2, 3, 3, 2, 2],
  representation: [0, 1, 1, 3, 3],
  implicit: [0, 0, 0, 2, 3],
};

/** Chapter 1's taxonomy crossed with Chapter 9's failure questions. */
export function FailureMatrix() {
  const t = useT();
  const [selected, setSelected] = useState<(typeof CONTRACTS)[number]>("renderer");
  const levels = MATRIX[selected];
  const worst = levels.indexOf(Math.max(...levels) as Level);

  return (
    <div>
      <div className="px-4 pt-6 md:px-8">
        <div>
          <div className="grid grid-cols-[minmax(0,1fr)_repeat(5,minmax(2.2rem,1fr))] gap-px bg-rule sm:grid-cols-[10rem_repeat(5,minmax(6rem,1fr))]">
            <div className="bg-paper-raised p-3" />
            {RISKS.map((risk) => <div key={risk} className="bg-paper-raised p-3"><span className="label !text-[0.58rem]">{t(`fm.risk.${risk}`)}</span></div>)}
            {CONTRACTS.map((contract) => (
              <MatrixRow key={contract} contract={contract} active={selected === contract} onSelect={() => setSelected(contract)} levels={MATRIX[contract]} t={t} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-rule px-5 py-5 md:px-8">
        <p className="label">{t("fm.askFirst", { system: t(`fm.contract.${selected}`) })}</p>
        <p className="mt-2 max-w-[58ch] text-[1rem] leading-relaxed text-ink">{t(`fm.question.${RISKS[worst]}`)}</p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        <Stat label={t("fm.contract")} value={t(`fm.contract.${selected}`)} />
        <Stat label={t("fm.binding")} value={t(`fm.risk.${RISKS[worst]}`)} />
      </div>
    </div>
  );
}

function MatrixRow({ contract, active, onSelect, levels, t }: { contract: string; active: boolean; onSelect: () => void; levels: Level[]; t: (key: string, vars?: Record<string, string | number>) => string }) {
  return (
    <>
      <button onClick={onSelect} className={`p-3 text-left transition-colors ${active ? "bg-ink" : "bg-paper hover:bg-paper-raised"}`}>
        <span className={`label !text-[0.62rem] ${active ? "!text-paper" : ""}`}>{t(`fm.contract.${contract}`)}</span>
      </button>
      {levels.map((level, index) => (
        <button key={index} onClick={onSelect} aria-label={`${t(`fm.contract.${contract}`)}: ${t(`fm.level.${level}`)}`}
          className={`flex items-center justify-center p-3 transition-colors ${active ? "bg-paper-raised" : "bg-paper"}`}>
          <span className="block h-3 w-full max-w-20 bg-rule">
            <span className="block h-full transition-all" style={{ width: `${(level / 3) * 100}%`, background: level === 3 ? "var(--imagine)" : level === 2 ? "var(--actual)" : "var(--rule-strong)" }} />
          </span>
        </button>
      ))}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="bg-paper px-5 py-3 md:px-8"><p className="label">{label}</p><p className="mt-1 text-[0.98rem] text-ink">{value}</p></div>;
}
