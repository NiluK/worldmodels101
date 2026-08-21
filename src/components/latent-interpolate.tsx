"use client";

import { useState } from "react";
import { Room, ROOM_W, ROOM_H } from "./latent-room";
import { useT } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * The argument for having a latent space at all, in one control.
 *
 * Both rows are honest. The top row is what averaging two pictures actually
 * does: both rooms, faintly, at once. It is not a room, and no amount of
 * blending will make it one. The bottom row averages the two numbers instead
 * and decodes the result, which is a room, because every point in that space
 * is one.
 *
 * A space where the midpoint of two valid things is itself a valid thing is
 * the property being paid for. Pixels do not have it.
 */

const A: [number, number] = [0.16, 0.12];
const B: [number, number] = [0.82, 0.9];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Hoisted so the panels keep their identity across every drag of the slider. */
function Panel({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div>
      <svg viewBox={`0 0 ${ROOM_W} ${ROOM_H}`} className="block w-full" aria-hidden>
        <rect width={ROOM_W} height={ROOM_H} fill="var(--paper-sunk)" />
        {children}
      </svg>
      <p className="label mt-2 !text-[0.58rem]">{label}</p>
    </div>
  );
}

export function LatentInterpolate() {
  const t = useT();
  const { ref, compact } = useCompact(520);
  const [m, setM] = useState(0.5);
  const mid: [number, number] = [lerp(A[0], B[0], m), lerp(A[1], B[1], m)];

  return (
    <div>
      <div ref={ref} className="space-y-6 px-5 pt-6 md:px-8">
        <div className={`grid gap-4 ${compact ? "grid-cols-1" : "grid-cols-3"}`}>
          <Panel label={t("li.a")}><Room z={A} /></Panel>
          <Panel label={t("li.pixel")}>
            {/* what averaging two pictures really gives you */}
            <Room z={A} opacity={1 - m} />
            <Room z={B} opacity={m} />
          </Panel>
          <Panel label={t("li.b")}><Room z={B} /></Panel>
        </div>

        <div className={`grid gap-4 ${compact ? "grid-cols-1" : "grid-cols-3"}`}>
          {!compact && <div />}
          <Panel label={t("li.latent")}><Room z={mid} /></Panel>
          {!compact && <div />}
        </div>
      </div>

      <div data-print-hide className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-full flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:min-w-[16rem]">
          <span className="label whitespace-nowrap">{t("li.blend")}</span>
          <input type="range" min={0} max={100} value={Math.round(m * 100)}
            onChange={(e) => setM(Number(e.target.value) / 100)}
            className="h-1 min-w-[7rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-12 text-right !text-ink">{Math.round(m * 100)}%</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("li.pixelQ")}</p>
          <p className="mt-1 text-[0.98rem] leading-snug text-ink">
            {m > 0.04 && m < 0.96 ? t("li.pixelNo") : t("li.pixelYes")}
          </p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("li.latentQ")}</p>
          <p className="mt-1 text-[0.98rem] leading-snug text-ink">{t("li.latentYes")}</p>
        </div>
      </div>
    </div>
  );
}
