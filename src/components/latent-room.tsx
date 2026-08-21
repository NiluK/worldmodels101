"use client";

import { useRef, useState } from "react";
import { useT } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * Latent space as a place you can move around in.
 *
 * The decoder here is real, not a mock: two numbers go in, and everything in
 * the drawing is computed from them. That is the whole claim of the chapter
 * made checkable. The picture has tens of thousands of pixels; the description
 * that produced it has two.
 *
 * The two axes were chosen to be the things a decision actually turns on: how
 * far away the wall is, and where the way through it is. Nothing else about
 * the room is represented, because nothing else would change what you do.
 */

export const ROOM_W = 340;
export const ROOM_H = 220;

/** z = [depth 0..1, offset 0..1] -> a first-person view of a room */
export function Room({
  z, tone = "var(--ink)", opacity = 1, label,
}: {
  z: [number, number];
  tone?: string;
  opacity?: number;
  label?: string;
}) {
  const [depth, off] = z;
  // far wall shrinks towards the vanishing point as depth grows
  const k = 0.16 + depth * 0.5;
  const cx = ROOM_W / 2;
  const cy = ROOM_H / 2;
  const w = ROOM_W * (1 - k) * 0.5;
  const h = ROOM_H * (1 - k) * 0.5;
  const L = cx - w / 2, R = cx + w / 2, T = cy - h / 2, B = cy + h / 2;
  // the way through, somewhere along the far wall
  const gapW = w * 0.26;
  const gapX = L + gapW / 2 + off * (w - gapW) - gapW / 2;

  return (
    <g opacity={opacity}>
      {/* the corners of the room, receding */}
      {([[0, 0, L, T], [ROOM_W, 0, R, T], [0, ROOM_H, L, B], [ROOM_W, ROOM_H, R, B]] as const).map(
        ([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={tone} strokeWidth="1"
            opacity={0.34} />
        ),
      )}
      <rect x={L} y={T} width={w} height={h} fill="none" stroke={tone} strokeWidth="1.6" />
      {/* the gap: the only thing in here you could walk through */}
      <rect x={gapX} y={B - h * 0.44} width={gapW} height={h * 0.44}
        fill="var(--imagine)" opacity={0.85} />
      {label && (
        <text x={8} y={16} className="font-mono" fontSize="10" fill="var(--ink-faint)">
          {label}
        </text>
      )}
    </g>
  );
}

export function LatentRoom() {
  const t = useT();
  const { ref } = useCompact(520);
  const padRef = useRef<HTMLDivElement>(null);
  const [z, setZ] = useState<[number, number]>([0.45, 0.62]);
  const [drag, setDrag] = useState(false);

  const move = (e: React.PointerEvent) => {
    const el = padRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    setZ([1 - y, x]);
  };

  return (
    <div>
      <div ref={ref} className="grid gap-6 px-5 pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,15rem)] md:px-8">
        <div>
          <svg viewBox={`0 0 ${ROOM_W} ${ROOM_H}`} className="block w-full" role="img"
            aria-label={t("lr.aria", { d: z[0].toFixed(2), o: z[1].toFixed(2) })}>
            <rect width={ROOM_W} height={ROOM_H} fill="var(--paper-sunk)" />
            <Room z={z} />
          </svg>
          <p className="label mt-3 !text-[0.6rem]">{t("lr.decoded")}</p>
        </div>

        {/* the space itself */}
        <div>
          <div
            ref={padRef}
            onPointerDown={(e) => { setDrag(true); e.currentTarget.setPointerCapture(e.pointerId); move(e); }}
            onPointerMove={(e) => drag && move(e)}
            onPointerUp={() => setDrag(false)}
            className="relative aspect-square w-full cursor-crosshair border border-rule-strong bg-paper touch-none"
          >
            {[0.25, 0.5, 0.75].map((g) => (
              <span key={g}>
                <span className="absolute left-0 right-0 h-px bg-rule" style={{ top: `${g * 100}%` }} />
                <span className="absolute bottom-0 top-0 w-px bg-rule" style={{ left: `${g * 100}%` }} />
              </span>
            ))}
            <span
              className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-imagine"
              style={{ left: `${z[1] * 100}%`, top: `${(1 - z[0]) * 100}%` }}
            />
          </div>
          <p className="label mt-2 !text-[0.6rem]">{t("lr.pad")}</p>
          <dl className="mt-4 space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="label !text-[0.6rem]">{t("lr.z1")}</dt>
              <dd className="label tnum !text-ink">{z[0].toFixed(2)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="label !text-[0.6rem]">{t("lr.z2")}</dt>
              <dd className="label tnum !text-ink">{z[1].toFixed(2)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("lr.picture")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{(ROOM_W * ROOM_H).toLocaleString("en-GB")}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("lr.description")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">2</p>
        </div>
      </div>
    </div>
  );
}
