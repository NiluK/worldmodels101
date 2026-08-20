"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useT } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * The chapter's punchline, as a formula and as a shape.
 *
 * Two scoring functions over the same set of actions. Almost everywhere they
 * agree, which is why the model looks good on average. In one narrow place the
 * model has a spike the world does not, because that is where it had least to
 * learn from. The best action according to the model and the best action in
 * fact are therefore two different actions, and an optimiser is a machine for
 * finding the first one.
 *
 * Scrub the action axis: the two readings only come apart at the spike.
 */

const W = 900;
const H = 268;
const PAD = { l: 56, r: 26, t: 22, b: 44 };
const PX = (a: number) => PAD.l + a * (W - PAD.l - PAD.r);
const PY = (v: number) => PAD.t + (1 - v) * (H - PAD.t - PAD.b);

const bump = (a: number, c: number, w: number, h: number) => h * Math.exp(-((a - c) ** 2) / (2 * w * w));

/** what actually happens: one broad, honest optimum */
const real = (a: number) => bump(a, 0.34, 0.16, 0.78) + bump(a, 0.76, 0.1, 0.16) + 0.06;
/** what the model believes: the same, plus a spike where it had no data */
const model = (a: number) => real(a) + bump(a, 0.83, 0.038, 0.78);

const SAMPLES = 220;
const curve = (f: (a: number) => number) =>
  Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const a = i / SAMPLES;
    return `${i ? "L" : "M"} ${PX(a).toFixed(1)} ${PY(f(a)).toFixed(1)}`;
  }).join(" ");

const argmaxOf = (f: (a: number) => number) => {
  let best = 0;
  for (let i = 0; i <= SAMPLES; i++) if (f(i / SAMPLES) > f(best / SAMPLES)) best = i;
  return best / SAMPLES;
};

export function ArgmaxMismatch() {
  const t = useT();
  const still = useReducedMotion();
  const aModel = useMemo(() => argmaxOf(model), []);
  const aReal = useMemo(() => argmaxOf(real), []);
  const [a, setA] = useState(aModel);
  const { ref, compact } = useCompact();
  const fs = compact ? 17 : 10;

  const enter = (i: number) =>
    still
      ? {}
      : {
          initial: { opacity: 0, y: 8 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "0px 0px -15% 0px" },
          transition: { duration: 0.5, delay: 0.12 * i, ease: [0.16, 1, 0.3, 1] as const },
        };

  const gap = model(a) - real(a);

  return (
    <div>
      {/* the formula */}
      <div className="px-5 pt-10 md:px-8">
        <div
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-[clamp(0.95rem,2.4vw,1.3rem)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <motion.span {...enter(0)} style={{ color: "var(--imagine)" }}>
            <span className="italic">arg max</span>
            <sub className="text-[0.6em] not-italic"> a</sub>{" "}
            {t("am.modelScore")}
          </motion.span>
          <motion.span {...enter(1)} className="px-1 text-ink-muted" aria-label={t("am.notEqual")}>
            &#8800;
          </motion.span>
          <motion.span {...enter(2)} style={{ color: "var(--actual)" }}>
            <span className="italic">arg max</span>
            <sub className="text-[0.6em] not-italic"> a</sub>{" "}
            {t("am.realScore")}
          </motion.span>
        </div>
        <motion.p {...enter(3)}
          className="mx-auto mt-4 max-w-[52ch] text-center text-[0.95rem] leading-relaxed text-ink-muted">
          {t("am.unless")}
        </motion.p>
      </div>

      <div ref={ref} className="px-4 pt-8 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={t("am.aria")}>
          <line x1={PAD.l} y1={PY(0)} x2={W - PAD.r} y2={PY(0)} stroke="var(--rule)" strokeWidth="1" />

          {/* the two scoring functions */}
          <path d={curve(real)} fill="none" stroke="var(--actual)" strokeWidth="2.5" />
          <path d={curve(model)} fill="none" stroke="var(--imagine)" strokeWidth="2.5"
            strokeDasharray="6 4" />

          {/* where each one peaks */}
          {[
            { at: aReal, f: real, tone: "var(--actual)", key: "am.bestReal" },
            { at: aModel, f: model, tone: "var(--imagine)", key: "am.bestModel" },
          ].map((m) => (
            <g key={m.key}>
              <line x1={PX(m.at)} y1={PY(m.f(m.at))} x2={PX(m.at)} y2={PY(0)} stroke={m.tone}
                strokeWidth="1" strokeDasharray="2 4" opacity={0.7} />
              <circle cx={PX(m.at)} cy={PY(m.f(m.at))} r={5.5} fill={m.tone}
                stroke="var(--paper)" strokeWidth="2" />
              <text x={PX(m.at)} y={PY(m.f(m.at)) - 13} textAnchor="middle" className="font-mono" fontSize={fs} fill={m.tone}>
                {t(m.key)}
              </text>
            </g>
          ))}

          {/* the scrubber */}
          <line x1={PX(a)} y1={PAD.t - 6} x2={PX(a)} y2={PY(0)} stroke="var(--ink)" strokeWidth="1.5" />
          <circle cx={PX(a)} cy={PY(model(a))} r={4} fill="var(--imagine)" />
          <circle cx={PX(a)} cy={PY(real(a))} r={4} fill="var(--actual)" />

          <text x={PAD.l} y={H - 14} className="font-mono" fontSize={fs} fill="var(--ink-faint)">
            {t("am.axis")}
          </text>
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-[18rem] flex-1 items-center gap-3">
          <span className="label whitespace-nowrap">{t("am.pick")}</span>
          <input type="range" min={0} max={1000} value={Math.round(a * 1000)}
            onChange={(e) => setA(Number(e.target.value) / 1000)}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
        </label>
        <p className="label !normal-case !tracking-normal !text-[0.8rem]">
          {gap > 0.12 ? t("am.diverged") : t("am.agree")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label" style={{ color: "var(--imagine)" }}>{t("am.modelSays")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{model(a).toFixed(2)}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label" style={{ color: "var(--actual)" }}>{t("am.reallyGet")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{real(a).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
