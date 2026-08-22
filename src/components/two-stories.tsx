"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * Two stories about where the plane is, and the one that replaces them.
 *
 * Physics predicts a position and is unsure by some amount; the radar hands
 * back a blip and is unsure by another. Both are Gaussians on one axis. Their
 * product is a third Gaussian that sits between them and is narrower than
 * either, and how far it leans toward the radar is the Kalman gain. "Correct"
 * makes the product the next physics story, then predicts it forward so the
 * width opens again: predict, correct, repeat.
 *
 * Positions are in metres and illustrative. The two sliders set the widths.
 */

const H = 280;
const X0 = 40;
const BASE = 212;
const PEAK = 160;
const SPAN = 100;
const SAMPLES = 80;
const DRIFT = 15;
const Q = 5;
const BLIPS = [9, -7, 6, -10, 8, -5];
const SIG_MIN = 2;
const SIG_MAX = 20;

const TEXT = {
  en: {
    physics: "physics",
    radar: "radar",
    product: "new belief",
    axis: "position, m",
    sure: "how sure is physics",
    noise: "radar noise",
    correct: "Correct",
    reset: "Reset",
    gain: "Kalman gain K",
    mean: "new mean",
    width: "new width",
    step: (n: number) => `step ${n}: corrected, then predicted ahead`,
    low: "The radar is the noisier story, so the filter mostly keeps the physics prediction.",
    mid: "The two stories are about equally trustworthy, and the new belief sits between them.",
    high: "The radar is sharp, so the filter leans on the reading.",
    narrower: "The product is narrower than either parent.",
    aria: (p: number, r: number, m: number, k: string) =>
      `Two bell curves on a position axis, physics centred at ${p} m and radar at ${r} m, and their product centred at ${m} m. Kalman gain ${k}.`,
  },
  zh: {
    physics: "物理",
    radar: "雷达",
    product: "新的信念",
    axis: "位置（米）",
    sure: "物理有多确定",
    noise: "雷达噪声",
    correct: "修正",
    reset: "重置",
    gain: "卡尔曼增益 K",
    mean: "新的均值",
    width: "新的宽度",
    step: (n: number) => `第 ${n} 步：先修正，再向前预测`,
    low: "雷达是更嘈杂的那个故事，所以滤波器基本保留物理预测。",
    mid: "两个故事差不多同样可信，新的信念落在两者之间。",
    high: "雷达很锐利，所以滤波器倚重这次读数。",
    narrower: "乘积比两条母曲线都更窄。",
    aria: (p: number, r: number, m: number, k: string) =>
      `位置轴上的两条钟形曲线，物理以 ${p} 米为中心，雷达以 ${r} 米为中心，它们的乘积以 ${m} 米为中心。卡尔曼增益 ${k}。`,
  },
};

const INITIAL = { step: 0, origin: 0, mp: 38, mr: 62, sp: 8, sr: 8 };

export function TwoStories() {
  const locale = useLocale();
  const T = TEXT[locale] ?? TEXT.en;
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  // A narrower viewBox when compact, so the curves and type keep their size.
  const W = compact ? 560 : 900;
  const X1 = W - 40;
  const k = compact ? 1.5 : 1;

  const [s, setS] = useState(INITIAL);
  const [collapsed, setCollapsed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const vp = s.sp * s.sp;
  const vr = s.sr * s.sr;
  const gain = vp / (vp + vr);
  const mNew = s.mp + gain * (s.mr - s.mp);
  const sNew = Math.sqrt((vp * vr) / (vp + vr));

  const x = (pos: number) => X0 + ((pos - s.origin) / SPAN) * (X1 - X0);
  const curve = (mu: number, sigma: number, close = false) => {
    const pts: string[] = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const pos = s.origin + (i / SAMPLES) * SPAN;
      const y = BASE - PEAK * Math.exp(-((pos - mu) ** 2) / (2 * sigma * sigma));
      pts.push(`${i ? "L" : "M"} ${x(pos).toFixed(1)} ${y.toFixed(1)}`);
    }
    return close ? `${pts.join(" ")} L ${X1} ${BASE} L ${X0} ${BASE} Z` : pts.join(" ");
  };

  // While "collapsed", the physics story is the product: that is the correct step.
  const phys = collapsed ? { mu: mNew, sigma: sNew } : { mu: s.mp, sigma: s.sp };
  const tr = { duration: still ? 0 : 0.6, ease: "easeInOut" as const };

  const next = (st: typeof INITIAL) => {
    const m = st.mp + (st.sp ** 2 / (st.sp ** 2 + st.sr ** 2)) * (st.mr - st.mp);
    const sig = Math.sqrt((st.sp ** 2 * st.sr ** 2) / (st.sp ** 2 + st.sr ** 2));
    const sp = Math.min(SIG_MAX, Math.max(SIG_MIN, Math.round(Math.hypot(sig, Q) * 2) / 2));
    const mp = m + DRIFT;
    return {
      step: st.step + 1,
      origin: st.origin + DRIFT,
      mp,
      mr: mp + BLIPS[st.step % BLIPS.length],
      sp,
      sr: st.sr,
    };
  };

  const correct = () => {
    if (collapsed) return;
    if (still) { setS(next); return; }
    setCollapsed(true);
    timer.current = setTimeout(() => {
      setS(next);
      setCollapsed(false);
    }, 700);
  };

  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    setCollapsed(false);
    setS(INITIAL);
  };

  const verdict = gain < 0.3 ? T.low : gain <= 0.7 ? T.mid : T.high;
  const narrower = sNew < Math.min(s.sp, s.sr);
  const fs = 10.5 * k;

  // On a narrow figure the slider name takes its own line above the track.
  const sliderRow = compact
    ? "flex basis-full flex-wrap items-center gap-x-3 gap-y-2"
    : "flex min-w-[18rem] flex-1 items-center gap-3";
  const sliderName = compact ? "label basis-full" : "label whitespace-nowrap";

  const ticks = [
    { pos: phys.mu, colour: "var(--actual)", label: T.physics, row: 0 },
    { pos: s.mr, colour: "var(--rule-strong)", label: T.radar, row: 0 },
    { pos: mNew, colour: "var(--imagine)", label: T.product, row: 1 },
  ];

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full"
          role="img"
          aria-label={T.aria(Math.round(s.mp), Math.round(s.mr), Math.round(mNew), gain.toFixed(2))}
        >
          <line x1={X0} y1={BASE} x2={X1} y2={BASE} stroke="var(--rule-strong)" strokeWidth="1" />
          {[0, 50, 100].map((d) =>
            compact && d === 50 ? null : (
              <text key={d} x={x(s.origin + d)} y={BASE + 14 * k} textAnchor="middle"
                className="font-mono tnum" fontSize={fs} fill="var(--ink-faint)">
                {s.origin + d}
              </text>
            ),
          )}
          <text x={X1} y={14 * k} textAnchor="end" className="font-mono" fontSize={fs}
            letterSpacing="1" fill="var(--ink-faint)">
            {T.axis}
          </text>
          {s.step > 0 && !compact && (
            <text x={X0} y={14 * k} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-faint)">
              {T.step(s.step)}
            </text>
          )}

          {/* the product, filled: the new belief */}
          <motion.path initial={false} animate={{ d: curve(mNew, sNew, true), opacity: collapsed ? 0 : 1 }}
            transition={tr} fill="var(--imagine-soft)" stroke="none" />
          {/* physics: the story from the last position and speed */}
          <motion.path initial={false} animate={{ d: curve(phys.mu, phys.sigma) }} transition={tr}
            fill="none" stroke="var(--actual)" strokeWidth="2.2" />
          {/* radar: the blip and its noise */}
          <motion.path initial={false} animate={{ d: curve(s.mr, s.sr), opacity: collapsed ? 0.3 : 1 }}
            transition={tr} fill="none" stroke="var(--rule-strong)" strokeWidth="2.2" strokeDasharray="6 4" />
          <motion.path initial={false} animate={{ d: curve(mNew, sNew), opacity: collapsed ? 0 : 1 }}
            transition={tr} fill="none" stroke="var(--imagine)" strokeWidth="2.4" />

          {/* the three means as ticks under the axis */}
          {ticks.map((tk) => (
            <motion.g key={tk.label} initial={false} animate={{ x: x(tk.pos) }} transition={tr}>
              <line x1={0} y1={BASE - 6} x2={0} y2={BASE + 6} stroke={tk.colour} strokeWidth="2" />
              <text x={0} y={BASE + 27 * k + tk.row * 14 * k} textAnchor="middle" className="font-mono"
                fontSize={fs} letterSpacing="1" fill={tk.colour}>
                {tk.label}
              </text>
            </motion.g>
          ))}
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className={sliderRow}>
          <span className={sliderName}>{T.sure}</span>
          <input type="range" min={SIG_MIN} max={SIG_MAX} step={0.5} value={SIG_MAX + SIG_MIN - s.sp}
            onChange={(e) => setS({ ...s, sp: SIG_MAX + SIG_MIN - Number(e.target.value) })}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-12 whitespace-nowrap text-right !normal-case !text-ink">{s.sp} m</span>
        </label>
        <label className={sliderRow}>
          <span className={sliderName}>{T.noise}</span>
          <input type="range" min={SIG_MIN} max={SIG_MAX} step={0.5} value={s.sr}
            onChange={(e) => setS({ ...s, sr: Number(e.target.value) })}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-12 whitespace-nowrap text-right !normal-case !text-ink">{s.sr} m</span>
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={correct} disabled={collapsed}
            className="label h-10 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-60">
            {T.correct}
          </button>
          {s.step > 0 && (
            <button type="button" onClick={reset}
              className="label h-10 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink">
              {T.reset}
            </button>
          )}
        </div>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}{narrower ? `${locale === "zh" ? "" : " "}${T.narrower}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.gain, gain.toFixed(2)],
          [T.mean, `${mNew.toFixed(1)} m`],
          [T.width, `σ ${sNew.toFixed(1)} m`],
        ].map(([label, v]) => (
          <div key={label} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{label}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
