"use client";

import { useMemo, useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * Pessimism as a charge on the model's score.
 *
 * The same two curves as ArgmaxMismatch (Figure 2.16): the world's score and
 * the model's, which agree except for one narrow spike where the model had
 * nothing to learn from. A third curve, drawn as a strip along the floor, says
 * how unsure the model is at each action: near zero where the data was, high
 * around the spike, with a shoulder between the hill and the spike where the
 * data was thinner. The penalised score is raw minus penalty times uncertainty.
 * Raise the penalty and the spike is docked until the favourite action moves
 * back onto the broad hill; keep raising it and honest actions are charged too.
 *
 * Illustrative. The uncertainty curve is made up and stands in for ensemble
 * disagreement or any other estimate.
 */

const W = 900;
const H = 268;
const PAD = { l: 56, r: 26, t: 22, b: 44 };
const PX = (a: number) => PAD.l + a * (W - PAD.l - PAD.r);
const PY = (v: number) => PAD.t + (1 - v) * (H - PAD.t - PAD.b);
const STRIP = 34;

const bump = (a: number, c: number, w: number, h: number) => h * Math.exp(-((a - c) ** 2) / (2 * w * w));

/** what actually happens: one broad, honest optimum (copied from ArgmaxMismatch) */
const real = (a: number) => bump(a, 0.34, 0.16, 0.78) + bump(a, 0.76, 0.1, 0.16) + 0.06;
/** what the model believes: the same, plus a spike where it had no data */
const model = (a: number) => real(a) + bump(a, 0.83, 0.038, 0.78);
/** how unsure the model is: a bump at the spike, a shoulder where the data thinned, scaled to peak at 1 */
const rawUnsure = (a: number) => bump(a, 0.83, 0.045, 1) + bump(a, 0.6, 0.16, 1);

const SAMPLES = 220;
const UMAX = Math.max(...Array.from({ length: SAMPLES + 1 }, (_, i) => rawUnsure(i / SAMPLES)));
const unsure = (a: number) => rawUnsure(a) / UMAX;
const penalised = (p: number) => (a: number) => model(a) - p * unsure(a);

const curve = (f: (a: number) => number, y: (v: number) => number = PY) =>
  Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const a = i / SAMPLES;
    return `${i ? "L" : "M"} ${PX(a).toFixed(1)} ${y(f(a)).toFixed(1)}`;
  }).join(" ");

const argmaxOf = (f: (a: number) => number) => {
  let best = 0;
  for (let i = 0; i <= SAMPLES; i++) if (f(i / SAMPLES) > f(best / SAMPLES)) best = i;
  return best / SAMPLES;
};

/** the strip along the floor, closed back along the axis so it can be filled */
const STRIP_PATH = `${curve(unsure, (v) => PY(0) - v * STRIP)} L ${PX(1).toFixed(1)} ${PY(0)} L ${PX(0).toFixed(1)} ${PY(0)} Z`;

const TEXT: LocaleText<{
  penalty: string; axis: string; unsure: string; world: string; raw: string; docked: string;
  favourite: string; inWorld: string; v0: string; vSome: string; vMoved: string; vHigh: string;
  rFav: string; rModel: string; rWorld: string; aria: (p: string, a: string) => string;
}> = {
  en: {
    penalty: "Penalty",
    axis: "every action you could take",
    unsure: "where the model is unsure",
    world: "the world",
    raw: "the model, raw",
    docked: "the model, after the charge",
    favourite: "favourite",
    inWorld: "in the world",
    v0: "No charge. The model's favourite is the spike: 0.97 in imagination and 0.20 in the world.",
    vSome: "Docked a little, but not enough. The spike is still the favourite.",
    vMoved: "The spike has been docked for being uncertain, and the favourite is back on the hill the world agrees with.",
    vHigh: "Now honest actions are being charged too, and the favourite drifts off the best of them.",
    rFav: "Model's favourite action",
    rModel: "What it scores in the model",
    rWorld: "What it scores in the world",
    aria: (p, a) =>
      `Three scoring curves over the same set of actions: the world's, the model's raw score with its spike, and the model's score after a penalty of ${p} times a made-up uncertainty, drawn as a strip along the floor. The penalised favourite is at action ${a}.`,
  },
  zh: {
    penalty: "惩罚",
    axis: "你能采取的每一个动作",
    unsure: "模型没把握的地方",
    world: "真实世界",
    raw: "模型，原始分",
    docked: "模型，扣罚之后",
    favourite: "最中意",
    inWorld: "真实世界里",
    v0: "不收费。模型最中意的是那个尖峰：想象中 0.97，真实世界里 0.20。",
    vSome: "扣了一点，但还不够。尖峰仍是它的最爱。",
    vMoved: "尖峰因为没把握而被扣了分，最中意的动作回到了真实世界也认可的宽坡上。",
    vHigh: "现在老实的动作也在被收费，最中意的动作正偏离其中最好的那一个。",
    rFav: "模型最中意的动作",
    rModel: "模型里的得分",
    rWorld: "真实世界里的得分",
    aria: (p, a) =>
      `同一组动作上的三条打分曲线：真实世界的、模型带尖峰的原始分、以及扣掉 ${p} 倍虚构不确定度之后的模型分，不确定度画成沿底边的一条浅带。扣罚后最中意的动作在 ${a}。`,
  },
};

export function UncertaintyPenalty() {
  const locale = useLocale();
  const s = pickText(TEXT, locale);
  const { ref, compact } = useCompact();
  const fs = compact ? 17 : 10;
  const [p, setP] = useState(0);

  const aReal = useMemo(() => argmaxOf(real), []);
  /** the two thresholds come from the curves: where the favourite leaves the spike, and where it starts to slip off the hill */
  const { pMove, pDrift } = useMemo(() => {
    let pMove = 1;
    let pDrift = 1;
    for (let i = 0; i <= 100; i++) {
      const q = i / 100;
      const a = argmaxOf(penalised(q));
      if (pMove === 1 && a < 0.6) pMove = q;
      if (pDrift === 1 && a < 0.6 && Math.abs(a - aReal) > 0.02) { pDrift = q; break; }
    }
    return { pMove, pDrift };
  }, [aReal]);

  const score = penalised(p);
  const aFav = argmaxOf(score);
  const verdict = p === 0 ? s.v0 : p < pMove ? s.vSome : p < pDrift ? s.vMoved : s.vHigh;

  return (
    <div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 px-5 pt-5 md:px-8">
        {[
          [s.world, "var(--actual)", "solid"],
          [s.raw, "var(--imagine)", "dotted"],
          [s.docked, "var(--imagine)", "solid"],
        ].map(([name, tone, style]) => (
          <span key={name} className="label flex items-center gap-2 !normal-case !tracking-normal">
            <span aria-hidden="true" className="inline-block w-5 border-t-2"
              style={{ borderColor: tone, borderTopStyle: style as "solid" | "dotted" }} />
            {name}
          </span>
        ))}
      </div>

      <div ref={ref} className="px-4 pt-4 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={s.aria(p.toFixed(2), aFav.toFixed(2))}>
          {/* how unsure the model is, as a strip along the floor */}
          <path d={STRIP_PATH} fill="var(--rule)" opacity={0.7} />
          <path d={curve(unsure, (v) => PY(0) - v * STRIP)} fill="none" stroke="var(--rule-strong)" strokeWidth="1" />
          <line x1={PAD.l} y1={PY(0)} x2={W - PAD.r} y2={PY(0)} stroke="var(--rule)" strokeWidth="1" />

          {/* the world's score, and the model's raw score once the charge has moved it */}
          <path d={curve(real)} fill="none" stroke="var(--actual)" strokeWidth="2.5" />
          {p > 0 && (
            <path d={curve(model)} fill="none" stroke="var(--imagine)" strokeWidth="1.2" strokeDasharray="2 4" opacity={0.8} />
          )}
          {/* the model's score after the charge */}
          <path d={curve(score)} fill="none" stroke="var(--imagine)" strokeWidth="2.5" />

          {/* the favourite, and what the world pays for it */}
          <line x1={PX(aFav)} y1={PY(score(aFav))} x2={PX(aFav)} y2={PY(0)} stroke="var(--imagine)"
            strokeWidth="1.5" />
          <circle cx={PX(aFav)} cy={PY(score(aFav))} r={5.5} fill="var(--imagine)" stroke="var(--paper)" strokeWidth="2" />
          <circle cx={PX(aFav)} cy={PY(real(aFav))} r={5.5} fill="var(--actual)" stroke="var(--paper)" strokeWidth="2" />
          <text x={PX(aFav)} y={PY(score(aFav)) - 13} textAnchor="middle" className="font-mono" fontSize={fs} fill="var(--imagine)">
            {s.favourite}
          </text>
          {!compact && (
            <text x={PX(aFav) + 10} y={PY(real(aFav)) + 4} className="font-mono" fontSize={fs} fill="var(--actual)">
              {s.inWorld}
            </text>
          )}

          {!compact && (
            <text x={W - PAD.r} y={PY(0) - 6} textAnchor="end" className="font-mono" fontSize={fs} fill="var(--ink-faint)">
              {s.unsure}
            </text>
          )}
          <text x={PAD.l} y={H - 14} className="font-mono" fontSize={fs} fill="var(--ink-faint)">
            {s.axis}
          </text>
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-[min(18rem,100%)] flex-1 items-center gap-3">
          <span className="label whitespace-nowrap">{s.penalty}</span>
          <input type="range" min={0} max={100} value={Math.round(p * 100)}
            onChange={(e) => {
              setP(Number(e.target.value) / 100);
            }}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-12 text-right !text-ink">{p.toFixed(2)}</span>
        </label>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]">{verdict}</p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [s.rFav, aFav.toFixed(2), "var(--imagine)"],
          [s.rModel, score(aFav).toFixed(2), "var(--imagine)"],
          [s.rWorld, real(aFav).toFixed(2), "var(--actual)"],
        ].map(([k, v, tone]) => (
          <div key={k} className="bg-paper px-5 py-3 md:px-8">
            <p className="label" style={{ color: tone }}>{k}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
