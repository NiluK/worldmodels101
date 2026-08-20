"use client";

import { motion, useReducedMotion } from "motion/react";
import { DEFINITIONS, definitionText } from "@/lib/definitions";
import { useLocale, useT } from "./locale-provider";

/**
 * What each definition actually hands you, drawn at a size you can read.
 *
 * The map above sorts the five by how abstract the predicted object is, but it
 * says so in words. This says it in pictures: a raster, a mesh, a short vector,
 * a cloud of embeddings, and a probe reading a network that was never given a
 * board. Vermilion is always the predicted thing, so the five read as one set.
 *
 * Left to right is the same axis as the map, which is why the panels are not
 * reordered or wrapped out of sequence above the fifth.
 */

const ink = "var(--ink-muted)";
const hot = "var(--imagine)";
const cool = "var(--actual)";

function Renderer() {
  return (
    <svg viewBox="0 0 120 90" className="w-full" aria-hidden>
      <rect x="6" y="8" width="108" height="74" stroke={ink} strokeWidth="1.5" fill="none" />
      {Array.from({ length: 8 }, (_, c) =>
        Array.from({ length: 6 }, (_, r) => (
          <rect key={`${c}-${r}`} x={11 + c * 12.5} y={13 + r * 11} width={11} height={9.5}
            fill={c >= 6 ? hot : ink} opacity={c >= 6 ? (c === 6 ? 0.55 : 1) : 0.2 + r * 0.05} />
        )),
      )}
    </svg>
  );
}

function Simulator() {
  return (
    <svg viewBox="0 0 120 90" className="w-full" aria-hidden>
      {/* a box in three-quarter view: the thing another program can open */}
      <path d="M26 66 L26 34 L62 20 L98 34 L98 66 L62 80 Z" stroke={ink} strokeWidth="1.5" fill="none" />
      <path d="M26 34 L62 48 L98 34 M62 48 L62 80" stroke={ink} strokeWidth="1" fill="none" opacity={0.55} />
      {/* the collider: invisible in the render, present in the export */}
      <path d="M20 70 L20 30 L62 14 L104 30 L104 70 L62 86 Z" stroke={hot} strokeWidth="1.5"
        strokeDasharray="4 3" fill="none" />
      {[[26, 34], [62, 20], [98, 34], [62, 48], [26, 66], [98, 66], [62, 80]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={2} fill={ink} />
      ))}
    </svg>
  );
}

function Dynamics() {
  return (
    <svg viewBox="0 0 120 90" className="w-full" aria-hidden>
      {/* a short vector, and the next one predicted from it */}
      {[0, 1].map((col) =>
        Array.from({ length: 5 }, (_, i) => (
          <rect key={`${col}-${i}`} x={col ? 74 : 20} y={16 + i * 12} width={26} height={9}
            fill={col ? hot : cool} opacity={col ? 0.35 + i * 0.13 : 0.3 + i * 0.14} />
        )),
      )}
      <path d="M52 44 L68 44" stroke={ink} strokeWidth="1.5" />
      <path d="M64 40 L69 44 L64 48" stroke={ink} strokeWidth="1.5" fill="none" />
      <text x={33} y={86} className="font-mono" fontSize="9" fill={ink}>z</text>
      <text x={82} y={86} className="font-mono" fontSize="9" fill={hot}>z&#39;</text>
    </svg>
  );
}

function Representation() {
  /** fixed offsets so the cloud is the same cloud on every render */
  const pts: [number, number][] = [
    [22, 30], [34, 52], [28, 68], [46, 24], [52, 44], [44, 66], [62, 34],
    [58, 58], [70, 72], [76, 30], [84, 50], [92, 66], [100, 38], [66, 20],
  ];
  return (
    <svg viewBox="0 0 120 90" className="w-full" aria-hidden>
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.2} fill={ink} opacity={0.42} />
      ))}
      {/* the masked piece, predicted as a point rather than redrawn */}
      <rect x={70} y={40} width={30} height={30} stroke={ink} strokeWidth="1"
        strokeDasharray="3 3" fill="none" opacity={0.6} />
      <circle cx={85} cy={55} r={5} fill={hot} />
      <line x1={52} y1={44} x2={80} y2={55} stroke={hot} strokeWidth="1.2" strokeDasharray="3 3" />
    </svg>
  );
}

function Implicit() {
  return (
    <svg viewBox="0 0 120 90" className="w-full" aria-hidden>
      {/* a net nobody handed a board to */}
      {[0, 1, 2].map((c) =>
        Array.from({ length: 4 }, (_, r) => (
          <circle key={`${c}-${r}`} cx={22 + c * 20} cy={20 + r * 17} r={3} fill={ink} opacity={0.4} />
        )),
      )}
      {[0, 1].map((c) =>
        Array.from({ length: 4 }, (_, r) =>
          Array.from({ length: 4 }, (_, r2) => (
            <line key={`${c}-${r}-${r2}`} x1={22 + c * 20} y1={20 + r * 17}
              x2={42 + c * 20} y2={20 + r2 * 17} stroke={ink} strokeWidth="0.4" opacity={0.16} />
          )),
        ),
      )}
      {/* the probe, and what it read out */}
      <line x1={62} y1={45} x2={82} y2={45} stroke={hot} strokeWidth="1.4" strokeDasharray="3 2" />
      <rect x={84} y={28} width={30} height={30} stroke={hot} strokeWidth="1.4" fill="none" />
      {[0, 1, 2].map((c) =>
        [0, 1, 2].map((r) => (
          <rect key={`b${c}-${r}`} x={86 + c * 10} y={30 + r * 10} width={8} height={8}
            fill={(c + r) % 2 ? hot : "none"} opacity={0.5} />
        )),
      )}
    </svg>
  );
}

const ART: Record<string, () => React.ReactElement> = {
  renderer: Renderer,
  simulator: Simulator,
  dynamics: Dynamics,
  representation: Representation,
  implicit: Implicit,
};

export function OutputGallery() {
  const t = useT();
  const locale = useLocale();
  const still = useReducedMotion();

  return (
    <div className="grid grid-cols-1 gap-px bg-rule sm:grid-cols-2 lg:grid-cols-5">
      {DEFINITIONS.map((d, i) => {
        const Art = ART[d.id];
        const text = definitionText(locale, d.id);
        const off = d.id === "implicit";
        return (
          <motion.div
            key={d.id}
            className="flex flex-col bg-paper px-5 py-6 md:px-4"
            initial={still ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -12% 0px" }}
            transition={{ duration: 0.45, delay: still ? 0 : i * 0.07, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mx-auto w-full max-w-[13rem]">
              <Art />
            </div>
            <p className="label mt-4 !text-[0.6rem]">
              {off ? t("map.offAxis") : t("map.predicts", { x: text.predicts })}
            </p>
            <p className="display mt-1.5 text-[1.15rem] leading-tight">{text.name}</p>
            <p className="mt-2 text-[0.85rem] leading-relaxed text-ink-muted">
              {t(`gallery.${d.id}`)}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
