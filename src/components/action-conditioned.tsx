"use client";

import { useState } from "react";
import { useT } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * The move that turns a video model into something you can steer.
 *
 * Same model, same opening frames. What changes is that each generated frame
 * is conditioned on an action as well as on the frames before it, so the same
 * start has as many continuations as there are things you could do.
 *
 * Turn the conditioning off and the three rows become identical, which is the
 * point: without an action input there is only one future on offer, and it is
 * whichever one the model finds most likely.
 */

const FW = 88;
const FH = 62;
const PROMPT = 2;
const GEN = 4;

/** a horizon and a landmark, drawn from a heading */
function Frame({ heading, dim = false }: { heading: number; dim?: boolean }) {
  const cx = FW / 2 - heading * 26;
  return (
    <svg viewBox={`0 0 ${FW} ${FH}`} className="block w-full" aria-hidden>
      <rect width={FW} height={FH} fill="var(--paper-sunk)" />
      <line x1={0} y1={FH * 0.62} x2={FW} y2={FH * 0.62} stroke="var(--ink)" strokeWidth="1"
        opacity={dim ? 0.25 : 0.45} />
      {/* the landmark, which is the only thing that tells you where you are looking */}
      <rect x={cx - 7} y={FH * 0.62 - 20} width={14} height={20} fill="var(--imagine)"
        opacity={dim ? 0.3 : 0.9} />
      <circle cx={FW - 16} cy={14} r={5} fill="var(--ink)" opacity={dim ? 0.14 : 0.22} />
    </svg>
  );
}

const ROWS = [
  { key: "left", turn: -0.34 },
  { key: "straight", turn: 0 },
  { key: "right", turn: 0.34 },
];

export function ActionConditioned() {
  const t = useT();
  const { ref, compact } = useCompact(520);
  const [on, setOn] = useState(true);

  return (
    <div>
      <div ref={ref} className="px-5 pt-6 md:px-8">
        <div className="space-y-3">
          {ROWS.map((r) => (
            <div key={r.key} className="flex items-center gap-3">
              <span className={`label w-16 shrink-0 !text-[0.58rem] ${compact ? "hidden" : ""}`}>
                {t(on ? `ac.${r.key}` : "ac.none")}
              </span>
              <div className="flex flex-1 gap-1.5">
                {Array.from({ length: PROMPT + GEN }, (_, i) => {
                  const generated = i >= PROMPT;
                  // heading only moves once generation starts, and only if an action is fed in
                  const steps = generated ? i - PROMPT + 1 : 0;
                  const heading = on ? steps * r.turn : steps * 0.06;
                  return (
                    <span key={i} className={`flex-1 ${generated ? "" : "opacity-100"}`}
                      style={generated ? undefined : { outline: "1px solid var(--rule-strong)" }}>
                      <Frame heading={heading} dim={!generated} />
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-3">
          <span className="label !text-[0.56rem] !text-ink-faint">
            {t("ac.given")}
          </span>
          <span className="label !text-[0.56rem] !text-ink-faint">{t("ac.made")}</span>
        </div>
      </div>

      <div data-print-hide className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <div role="group" aria-label={t("ac.action")} className="flex">
          {[true, false].map((v) => {
            const active = on === v;
            return (
              <button
                key={String(v)}
                type="button"
                onClick={() => setOn(v)}
                aria-pressed={active}
                className={`label border px-5 py-2 transition-colors ${
                  active
                    ? "border-imagine bg-imagine !text-paper"
                    : "border-rule-strong bg-paper !text-ink hover:border-ink"
                } ${v ? "" : "-ml-px"}`}
              >
                {t(v ? "ac.condOn" : "ac.condOff")}
              </button>
            );
          })}
        </div>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {t(on ? "ac.note.on" : "ac.note.off")}
        </p>
      </div>
    </div>
  );
}
