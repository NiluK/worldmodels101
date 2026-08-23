"use client";

import { useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * The truce, measured rather than asserted.
 *
 * Janner's rule is not "keep it short", it is "find out how short". So the
 * reader sets the tolerance and the figure hands back the horizon, which is
 * the inverse of the chapter 1 slider.
 *
 * The second thing on the chart is why the truce is permanent. Error
 * compounds geometrically, so the horizon goes with the logarithm of the model
 * accuracy: a model ten times better does not buy ten times the stretch, it
 * buys about sixteen more steps. Both curves are illustrative; the shape of
 * the return is not.
 */

/** how much of the error already accumulated gets stretched at each step */
const AMP = 1.12;
const MAX_K = 40;
const MAX_ERR = 70;

const MODELS = [
  { key: "asIs", e: 1.0 },
  { key: "twice", e: 0.5 },
  { key: "tenTimes", e: 0.1 },
] as const;

type ModelKey = (typeof MODELS)[number]["key"];

const errAt = (k: number, e: number) => (e * (AMP ** k - 1)) / (AMP - 1);
/** the largest whole k whose accumulated error is still inside the tolerance */
const horizon = (tol: number, e: number) =>
  Math.max(0, Math.min(MAX_K, Math.floor(Math.log(1 + (tol * (AMP - 1)) / e) / Math.log(AMP))));

type Strings = {
  xAxis: string;
  yAxis: string;
  tolerance: string;
  tolShort: string;
  trusted: string;
  model: (k: ModelKey) => string;
  steps: (n: number) => string;
  units: (n: number) => string;
  stepsYouGet: string;
  atTen: string;
  vBase: (k: number) => string;
  vLoose: string;
  vTen: (d: number) => string;
  vTwice: (d: number) => string;
  aria: (tol: number, model: string, k: number, ten: number) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    xAxis: "steps you ask for",
    yAxis: "how far off the model is",
    tolerance: "how wrong you are willing to be",
    tolShort: "tolerance",
    trusted: "the stretch you can trust",
    model: (k) => ({ asIs: "as it is", twice: "twice as good", tenTimes: "ten times as good" })[k],
    steps: (n) => `${n} steps`,
    units: (n) => `${n} units`,
    stepsYouGet: "steps you get",
    atTen: "steps you get at ten times the model",
    vBase: (k) =>
      `At this tolerance the model is worth trusting for ${k} steps. That is the number Janner's truce is made of.`,
    vLoose: "Twice the tolerance did not buy twice the horizon, because the error compounds.",
    vTen: (d) => `Ten times the model bought ${d} more steps, not ten times as many. The horizon is bought slowly.`,
    vTwice: (d) =>
      `Twice the model bought ${d} more steps. The stretch you can trust grows far slower than the model improves.`,
    aria: (tol, model, k, ten) =>
      `A chart of accumulated error against rollout length for three models. The selected model is ${model}. With a tolerance of ${tol} units it can be trusted for ${k} steps, against ${ten} steps for a model ten times better.`,
  },
  zh: {
    xAxis: "你要求的步数",
    yAxis: "模型偏得有多远",
    tolerance: "你愿意错到什么程度",
    tolShort: "容忍度",
    trusted: "你可以信任的那一段",
    model: (k) => ({ asIs: "就是现在这样", twice: "好两倍", tenTimes: "好十倍" })[k],
    steps: (n) => `${n} 步`,
    units: (n) => `${n} 个单位`,
    stepsYouGet: "你能拿到的步数",
    atTen: "模型好十倍时能拿到的步数",
    vBase: (k) => `在这个容忍度下，模型值得信任 ${k} 步。詹纳的这条休战协议，做出来就是这个数字。`,
    vLoose: "容忍度翻倍并没有让可信的步数翻倍，因为误差是复利式累积的。",
    vTen: (d) => `模型好十倍，只多买到 ${d} 步，而不是十倍的步数。这段可信区间是很慢才买得到的。`,
    vTwice: (d) => `模型好两倍，多买到 ${d} 步。可以信任的那一段，增长得远比模型的进步要慢。`,
    aria: (tol, model, k, ten) =>
      `一张累积误差随展开步数变化的图，画了三个模型。当前选中的是「${model}」。在容忍度为 ${tol} 个单位时，它可以被信任 ${k} 步，而好十倍的模型是 ${ten} 步。`,
  },
};

function layout(compact: boolean) {
  const fs = compact ? 17 : 10.5;
  const W = compact ? 560 : 900;
  const padL = compact ? 38 : 46;
  const padR = compact ? 22 : 34;
  const padT = compact ? 34 : 26;
  const padB = Math.round(fs * 3 + 18);
  const H = compact ? 320 : 300;
  return {
    fs,
    W,
    H,
    padL,
    padR,
    padT,
    padB,
    plotH: H - padT - padB,
    xAt: (k: number) => padL + (k / MAX_K) * (W - padL - padR),
    yAt: (v: number) => H - padB - (Math.min(v, MAX_ERR) / MAX_ERR) * (H - padT - padB),
  };
}

/** the curve, sampled finely enough that the bend reads, clipped at the top */
function curvePath(L: ReturnType<typeof layout>, e: number) {
  const pts: string[] = [];
  for (let i = 0; i <= MAX_K * 4; i++) {
    const k = i / 4;
    const v = errAt(k, e);
    pts.push(`${i ? "L" : "M"} ${L.xAt(k).toFixed(1)} ${L.yAt(v).toFixed(1)}`);
    if (v > MAX_ERR) break;
  }
  return pts.join(" ");
}

/** where a curve leaves the top of the chart, so its label can sit there */
const exitK = (e: number) => Math.log(1 + (MAX_ERR * (AMP - 1)) / e) / Math.log(AMP);

export function WhereTrustRunsOut() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const { ref, compact } = useCompact(600);
  const L = layout(compact);

  const [tol, setTol] = useState(10);
  const [model, setModel] = useState<ModelKey>("asIs");

  const e = MODELS.find((m) => m.key === model)?.e ?? 1;
  const k = horizon(tol, e);
  const kBase = horizon(tol, 1.0);
  const kTen = horizon(tol, 0.1);

  const verdict =
    model === "tenTimes"
      ? T.vTen(k - kBase)
      : model === "twice"
        ? T.vTwice(k - kBase)
        : tol >= 30
          ? T.vLoose
          : T.vBase(k);

  const xTicks = compact ? [0, 20, 40] : [0, 10, 20, 30, 40];
  const yTicks = [0, 10, 20, 30, 40, 50, 60, 70];
  const tolY = L.yAt(tol);
  const kX = L.xAt(k);

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg
          viewBox={`0 0 ${L.W} ${L.H}`}
          className="block w-full"
          role="img"
          aria-label={T.aria(tol, T.model(model), k, kTen)}
        >
          <defs>
            <clipPath id="wtro-plot">
              <rect x={L.padL} y={L.padT} width={L.W - L.padL - L.padR} height={L.plotH} />
            </clipPath>
          </defs>

          {/* the stretch you can trust */}
          {k > 0 && (
            <rect
              x={L.padL}
              y={L.padT}
              width={kX - L.padL}
              height={L.plotH}
              fill="var(--actual-soft)"
              opacity="0.45"
              className="transition-[width] duration-200 motion-reduce:transition-none"
            />
          )}

          {/* grid */}
          {yTicks.map((v) => (
            <line key={v} x1={L.padL} y1={L.yAt(v)} x2={L.W - L.padR} y2={L.yAt(v)} stroke="var(--rule)" strokeWidth="1" />
          ))}
          {xTicks.map((v) => (
            <line
              key={v}
              x1={L.xAt(v)}
              y1={L.padT}
              x2={L.xAt(v)}
              y2={L.H - L.padB}
              stroke="var(--rule)"
              strokeWidth="1"
            />
          ))}

          <g clipPath="url(#wtro-plot)">
            {/* the two models you did not pick, as outlines */}
            {MODELS.filter((m) => m.key !== model).map((m) => (
              <g key={m.key}>
                <path d={curvePath(L, m.e)} fill="none" stroke="var(--rule-strong)" strokeWidth="1.2" />
                {!compact &&
                  (() => {
                    const ex = Math.min(MAX_K, exitK(m.e));
                    const end = ex > MAX_K * 0.7;
                    return (
                      <text
                        x={L.xAt(ex) + (end ? -8 : 8)}
                        y={L.padT + L.fs + 2}
                        textAnchor={end ? "end" : "start"}
                        className="font-mono"
                        fontSize={L.fs}
                        fill="var(--ink-faint)"
                      >
                        {T.model(m.key)}
                      </text>
                    );
                  })()}
              </g>
            ))}
            {/* the one you did */}
            <path d={curvePath(L, e)} fill="none" stroke="var(--imagine)" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* the tolerance, and where the curve crosses it */}
          <line
            x1={L.padL}
            y1={tolY}
            x2={L.W - L.padR}
            y2={tolY}
            stroke="var(--actual)"
            strokeWidth="1.6"
            strokeDasharray="6 4"
          />
          {!compact && (
            <text
              x={L.W - L.padR - 6}
              y={tolY - 7}
              textAnchor="end"
              className="font-mono"
              fontSize={L.fs}
              letterSpacing="1"
              fill="var(--actual)"
            >
              {T.tolerance}
            </text>
          )}
          {k > 0 && (
            <>
              <line x1={kX} y1={tolY} x2={kX} y2={L.H - L.padB} stroke="var(--actual)" strokeWidth="1.6" />
              <circle cx={kX} cy={tolY} r="4.5" fill="var(--actual)" />
              <text
                x={kX + (compact ? 14 : 10)}
                y={tolY + L.fs + 8}
                className="font-mono tnum"
                fontSize={L.fs * 1.15}
                fill="var(--actual)"
              >
                {T.steps(k)}
              </text>
            </>
          )}
          {k > 2 && !compact && (
            <text
              x={L.padL + 6}
              y={L.padT + L.fs + 6}
              className="font-mono"
              fontSize={L.fs}
              letterSpacing="1"
              fill="var(--ink-faint)"
            >
              {T.trusted}
            </text>
          )}

          {/* axes */}
          <line x1={L.padL} y1={L.H - L.padB} x2={L.W - L.padR} y2={L.H - L.padB} stroke="var(--rule-strong)" strokeWidth="1" />
          <line x1={L.padL} y1={L.padT} x2={L.padL} y2={L.H - L.padB} stroke="var(--rule-strong)" strokeWidth="1" />
          {(compact ? [0, 60] : [0, 20, 40, 60]).map((v) => (
            <text
              key={`y${v}`}
              x={L.padL - 6}
              y={L.yAt(v) + L.fs * 0.36}
              textAnchor="end"
              className="font-mono tnum"
              fontSize={L.fs}
              fill="var(--ink-faint)"
            >
              {v}
            </text>
          ))}
          {xTicks.map((v) => (
            <text
              key={v}
              x={L.xAt(v)}
              y={L.H - L.padB + L.fs + 8}
              textAnchor="middle"
              className="font-mono tnum"
              fontSize={L.fs}
              fill="var(--ink-faint)"
            >
              {v}
            </text>
          ))}
          <text
            x={L.W - L.padR}
            y={L.H - L.padB + L.fs * 2.4 + 8}
            textAnchor="end"
            className="font-mono"
            fontSize={L.fs}
            letterSpacing="1"
            fill="var(--ink-faint)"
          >
            {T.xAxis}
          </text>
          <text
            x={L.padL}
            y={L.padT - 8}
            className="font-mono"
            fontSize={L.fs}
            letterSpacing="1"
            fill="var(--ink-faint)"
          >
            {T.yAxis}
          </text>
        </svg>
      </div>

      <div
        data-print-hide
        className="mt-2 flex flex-col gap-4 border-t border-rule px-5 py-4 md:px-8"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <label className="flex min-w-[min(18rem,100%)] flex-1 flex-wrap items-center gap-x-3 gap-y-2">
            <span className="label">{T.tolerance}</span>
            <input
              type="range"
              min={1}
              max={60}
              step={1}
              value={tol}
              onChange={(ev) => setTol(Number(ev.target.value))}
              aria-valuetext={T.units(tol)}
              className="h-1 min-w-[8rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
            />
            <span className="label tnum w-10 text-right !text-ink">{tol}</span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {MODELS.map((m) => (
              <button
                key={m.key}
                type="button"
                aria-pressed={model === m.key}
                onClick={() => setModel(m.key)}
                className={`label h-9 border px-5 transition-colors ${
                  model === m.key
                    ? "border-imagine bg-imagine !text-paper"
                    : "border-rule-strong bg-paper !text-ink-muted hover:border-ink hover:!text-ink"
                }`}
              >
                {T.model(m.key)}
              </button>
            ))}
          </div>
        </div>
        <p className="label max-w-[64ch] !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.tolShort, T.units(tol)],
          [T.stepsYouGet, String(k)],
          [T.atTen, String(kTen)],
        ].map(([label, value]) => (
          <div key={label} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{label}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
