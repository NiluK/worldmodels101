"use client";

import { useState } from "react";
import { useT } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * What a pixel loss is forced to predict when the future is genuinely open.
 *
 * Minimising squared error over a set of possible outcomes gives you their
 * average. So when two futures are equally likely, the best possible pixel
 * prediction is literally both of them at half strength: a picture of
 * something that will never happen, and which scores better than either of
 * the things that actually can.
 *
 * The middle panel is not an artistic impression of blur. It is the two
 * futures drawn at their probabilities, which is the average, which is the
 * optimum.
 */

const W = 200;
const H = 150;

function Scene({ up, opacity = 1, ghost = false }: { up: number; opacity?: number; ghost?: boolean }) {
  // the ball leaves the fork and goes one way or the other
  const y = up ? 42 : 108;
  return (
    <g opacity={opacity}>
      <path d={`M 24 75 L 92 75`} stroke="var(--ink)" strokeWidth="1.4" opacity={0.4} />
      <path d={`M 92 75 L 168 ${y}`} stroke="var(--ink)" strokeWidth="1.4"
        opacity={ghost ? 0.25 : 0.4} strokeDasharray={ghost ? "3 3" : undefined} />
      <circle cx={168} cy={y} r={11} fill="var(--imagine)" />
    </g>
  );
}

/** Hoisted so the panels are not recreated on every drag of the slider. */
function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-hidden>
        <rect width={W} height={H} fill="var(--paper-sunk)" />
        {children}
      </svg>
      <p className="label mt-2 !text-[0.58rem]">{label}</p>
    </div>
  );
}

export function PixelBlur() {
  const t = useT();
  const { compact, ref } = useCompact(520);
  const [p, setP] = useState(50); // chance the ball goes up
  const q = p / 100;

  return (
    <div>
      <div ref={ref} className={`grid gap-4 px-5 pt-6 md:px-8 ${compact ? "grid-cols-1" : "grid-cols-3"}`}>
        <Panel label={t("pb.up", { p: String(p) })}>
          <Scene up={1} />
        </Panel>
        <Panel label={t("pb.best")}>
          <Scene up={1} opacity={q} ghost />
          <Scene up={0} opacity={1 - q} ghost />
        </Panel>
        <Panel label={t("pb.down", { p: String(100 - p) })}>
          <Scene up={0} />
        </Panel>
      </div>

      <div data-print-hide className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-[18rem] flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          <span className="label whitespace-nowrap">{t("pb.chance")}</span>
          <span className="flex min-w-[12rem] flex-1 items-center gap-3">
            <input type="range" min={0} max={100} value={p}
              onChange={(e) => {setP(Number(e.target.value)); }}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
            <span className="label tnum w-12 text-right !text-ink">{p}%</span>
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("pb.q")}</p>
          <p className="mt-1 text-[0.98rem] leading-snug text-ink">
            {t(p > 88 || p < 12 ? "pb.a.sure" : "pb.a.blur")}
          </p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("pb.scoreQ")}</p>
          <p className="mt-1 text-[0.98rem] leading-snug text-ink">{t("pb.scoreA")}</p>
        </div>
      </div>
    </div>
  );
}
