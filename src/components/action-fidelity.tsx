"use client";

import { useState } from "react";
import { useT } from "./locale-provider";

const W = 660;
const H = 280;
const COMMANDS = [-1, 0, 1] as const;

/** Action conditioning is an input contract; controllability is an empirical result. */
export function ActionFidelity() {
  const t = useT();
  const [fidelity, setFidelity] = useState(62);
  const f = fidelity / 100;
  const separation = f * 86;

  return (
    <div>
      <div className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={t("af.aria", { n: fidelity })}>
          {COMMANDS.map((command, row) => {
            const centre = 55 + row * 82;
            const end = centre + command * separation;
            return (
              <g key={command}>
                <line x1="116" y1={centre} x2="610" y2={centre} stroke="var(--rule)" strokeWidth="1" />
                <path d={`M 116 ${centre} C 300 ${centre}, 430 ${centre}, 595 ${end}`} fill="none" stroke="var(--imagine)" strokeWidth="2.5" />
                <circle cx="595" cy={end} r="6" fill="var(--imagine)" />
                <text x="20" y={centre + 4} className="font-mono" fontSize="10" fill="var(--ink-muted)">{t(`af.command.${row}`)}</text>
                <text x="614" y={end + 4} textAnchor="end" className="font-mono" fontSize="9" fill="var(--imagine)">{command === 0 ? "0" : `${command > 0 ? "+" : "−"}${Math.round(Math.abs(end - centre))}`}</text>
              </g>
            );
          })}
          <text x="116" y="18" className="font-mono" fontSize="9" fill="var(--ink-faint)">{t("af.sameStart")}</text>
          <text x="610" y="18" textAnchor="end" className="font-mono" fontSize="9" fill="var(--ink-faint)">{t("af.realized")}</text>
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-[min(18rem,100%)] flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          <span className="label basis-full whitespace-nowrap sm:basis-auto">{t("af.fidelity")}</span>
          <input type="range" min={0} max={100} step={1} value={fidelity}
            onChange={(e) => {setFidelity(Number(e.target.value)); }}
            className="h-1 flex-1 cursor-pointer appearance-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-10 text-right !text-ink">{fidelity}%</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        <Stat label={t("af.input")} value={t("af.input.yes")} />
        <Stat label={t("af.separation")} value={`${Math.round(separation * 2)} px`} />
        <Stat label={t("af.verdict")} value={t(fidelity < 25 ? "af.v.ignored" : fidelity < 75 ? "af.v.weak" : "af.v.strong")} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="bg-paper px-5 py-3 md:px-8"><p className="label">{label}</p><p className="mt-1 text-[0.94rem] leading-snug text-ink">{value}</p></div>;
}
