"use client";

import { useState } from "react";
import { useT } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * What survives the squeeze.
 *
 * The scene is generated from six numbers, ordered by how much a decision
 * turns on them. The bottleneck keeps the first k and throws the rest away,
 * and the drawing is rebuilt from only what got through.
 *
 * The ordering is the honest part and the point of the figure: the first two
 * decide what you do, and the last three are the leaves. A squeeze is only
 * useful if the thing being squeezed out is the thing that did not matter,
 * which is a property of the encoder, not of the width.
 */

const W = 400;
const H = 250;

/** every factor of the scene, most decision-relevant first */
const FACTORS = ["depth", "gap", "tilt", "clutter", "grain", "light"] as const;
const Z = [0.55, 0.7, 0.42, 0.68, 0.5, 0.35];
/** what a factor falls back to once it has been squeezed out */
const FALLBACK = [0.5, 0.5, 0.5, 0, 0, 0.5];

export function Bottleneck() {
  const t = useT();
  const { ref } = useCompact(520);
  const [k, setK] = useState(2);
  const z = Z.map((v, i) => (i < k ? v : FALLBACK[i]));
  const [depth, gap, tilt, clutter, grain, light] = z;

  const s = 0.16 + depth * 0.5;
  const cx = W / 2, cy = H / 2;
  const w = W * (1 - s) * 0.5, h = H * (1 - s) * 0.5;
  const L = cx - w / 2, R = cx + w / 2, T = cy - h / 2, B = cy + h / 2;
  const gw = w * 0.26;
  const gx = L + gap * (w - gw);
  const rot = (tilt - 0.5) * 9;

  return (
    <div>
      <div ref={ref} className="grid gap-6 px-5 pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,13rem)] md:px-8">
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
            aria-label={t("bn.aria", { k: String(k) })}>
            <rect width={W} height={H} fill="var(--paper-sunk)" opacity={0.35 + light * 0.5} />
            <g transform={`rotate(${rot} ${cx} ${cy})`}>
              {([[0, 0, L, T], [W, 0, R, T], [0, H, L, B], [W, H, R, B]] as const).map(
                ([x1, y1, x2, y2], i) => (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink)"
                    strokeWidth="1" opacity={0.3} />
                ),
              )}
              <rect x={L} y={T} width={w} height={h} fill="none" stroke="var(--ink)" strokeWidth="1.6" />
              <rect x={gx} y={B - h * 0.44} width={gw} height={h * 0.44} fill="var(--imagine)"
                opacity={0.85} />
              {/* the leaves: detail that costs pixels and changes nothing */}
              {clutter > 0 &&
                Array.from({ length: Math.round(clutter * 26) }, (_, i) => (
                  <circle key={i} cx={30 + ((i * 71) % (W - 60))} cy={H - 18 - ((i * 37) % 40)}
                    r={1.6} fill="var(--ink)" opacity={0.35} />
                ))}
              {grain > 0 &&
                Array.from({ length: Math.round(grain * 40) }, (_, i) => (
                  <rect key={i} x={((i * 53) % W)} y={((i * 97) % H)} width={2} height={2}
                    fill="var(--ink)" opacity={0.14} />
                ))}
            </g>
          </svg>
        </div>

        <ul className="space-y-1.5 self-start">
          {FACTORS.map((f, i) => {
            const kept = i < k;
            return (
              <li key={f} className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 ${kept ? "bg-imagine" : "bg-rule-strong"}`} />
                <span className={`label !text-[0.6rem] ${kept ? "!text-ink" : ""}`}>{t(`bn.${f}`)}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div data-print-hide className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-full flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[16rem]">
          <span className="label whitespace-nowrap">{t("bn.width")}</span>
          <input type="range" min={0} max={6} value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="h-1 min-w-[7rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-8 text-right !text-ink">{k}</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("bn.canYouAct")}</p>
          <p className="mt-1 text-[0.98rem] leading-snug text-ink">
            {t(k === 0 ? "bn.act.0" : k === 1 ? "bn.act.1" : "bn.act.2")}
          </p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("bn.spent")}</p>
          <p className="mt-1 text-[0.98rem] leading-snug text-ink">
            {t(k <= 2 ? "bn.spent.lean" : "bn.spent.leaves")}
          </p>
        </div>
      </div>
    </div>
  );
}
