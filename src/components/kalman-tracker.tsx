"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useId, useMemo, useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * The Kalman filter, 1960, doing the one half of the job it does.
 *
 * A plane flies a smooth path. A radar reports its position every other second
 * with noise on top. A real constant-velocity Kalman filter (predict, then
 * correct) keeps a running estimate of position and velocity, and a covariance
 * that draws as a band. The reader can make the radar noisier, or withhold the
 * blips for a stretch and watch the estimate coast on the dynamics alone while
 * the band opens. Nothing in here asks what an action would do, and the one
 * control that asks is disabled on purpose: that is the chapter's point.
 *
 * Units are illustrative. One drawing unit is ten metres, one step is one
 * second, so the plane is doing about a hundred metres a second.
 */

const N = 80;
const W = 900;
const H = 300;
const X0 = 60;
const X1 = 840;
const BLIP_EVERY = 2;
const SHADOW: [number, number] = [36, 56];
const M_PER_UNIT = 10;
/** process noise: how much the filter lets the velocity wander per step */
const Q_ACCEL = 0.2;
const BAND_CAP = 140;

type Vec4 = [number, number, number, number];
type Mat = number[][];

const truth = (i: number): [number, number] => {
  const u = i / N;
  return [X0 + (X1 - X0) * u, 150 + 62 * Math.sin(u * Math.PI * 2 * 0.85 + 0.4)];
};

/**
 * Seeded integer hash, so the blips are the same on the server, on the client
 * and on reload. Integer arithmetic rather than a sin() trick: the last bits
 * of sin() differ between engines, which hydration then complains about.
 */
function hash(n: number) {
  let t = (Math.imul(n, 0x9e3779b1) + 1) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function gauss(i: number) {
  const u1 = Math.max(hash(i * 2 + 1), 1e-9);
  const u2 = hash(i * 2 + 2);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

const mul = (A: Mat, B: Mat): Mat =>
  A.map((row) => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));
const transpose = (A: Mat): Mat => A[0].map((_, j) => A.map((row) => row[j]));
const add = (A: Mat, B: Mat): Mat => A.map((row, i) => row.map((v, j) => v + B[i][j]));

const F: Mat = [
  [1, 0, 1, 0],
  [0, 1, 0, 1],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
];
const Q: Mat = [
  [Q_ACCEL / 4, 0, Q_ACCEL / 2, 0],
  [0, Q_ACCEL / 4, 0, Q_ACCEL / 2],
  [Q_ACCEL / 2, 0, Q_ACCEL, 0],
  [0, Q_ACCEL / 2, 0, Q_ACCEL],
];
const I4: Mat = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
];

type Step = {
  i: number;
  truth: [number, number];
  blip: [number, number] | null;
  /** null until the first blip has arrived */
  est: Vec4 | null;
  /** position covariance, the top-left 2x2 of P */
  cov: [number, number, number] | null;
};

/**
 * Runs the whole flight once. The filter is standard: predict with the
 * constant-velocity model, correct against the blip when there is one.
 */
function simulate(sigma: number, shadow: boolean): Step[] {
  const steps: Step[] = [];
  let x: Vec4 | null = null;
  let P: Mat = I4;
  const R2 = sigma * sigma;
  for (let i = 0; i <= N; i++) {
    const tp = truth(i);
    const inShadow = shadow && i >= SHADOW[0] && i <= SHADOW[1];
    const hasBlip = i % BLIP_EVERY === 0 && !inShadow;
    const z: [number, number] | null = hasBlip
      ? [tp[0] + sigma * gauss(i), tp[1] + sigma * gauss(i + 1000)]
      : null;

    if (x === null) {
      if (z) {
        // first blip: a position, and a velocity of zero that it does not believe
        x = [z[0], z[1], 0, 0];
        P = [
          [R2, 0, 0, 0],
          [0, R2, 0, 0],
          [0, 0, 225, 0],
          [0, 0, 0, 225],
        ];
      }
    } else {
      // predict
      x = [x[0] + x[2], x[1] + x[3], x[2], x[3]];
      P = add(mul(mul(F, P), transpose(F)), Q);
      // correct
      if (z) {
        const y = [z[0] - x[0], z[1] - x[1]];
        const S = [
          [P[0][0] + R2, P[0][1]],
          [P[1][0], P[1][1] + R2],
        ];
        const det = S[0][0] * S[1][1] - S[0][1] * S[1][0];
        const Si = [
          [S[1][1] / det, -S[0][1] / det],
          [-S[1][0] / det, S[0][0] / det],
        ];
        const PHt = P.map((row) => [row[0], row[1]]);
        const K = mul(PHt, Si);
        x = x.map((v, r) => v + K[r][0] * y[0] + K[r][1] * y[1]) as Vec4;
        const KH = K.map((row) => [-row[0], -row[1], 0, 0]);
        P = mul(add(I4, KH), P);
      }
    }
    steps.push({
      i,
      truth: tp,
      blip: z,
      est: x ? ([...x] as Vec4) : null,
      cov: x ? [P[0][0], P[0][1], P[1][1]] : null,
    });
  }
  return steps;
}

/** 95% ellipse of a 2x2 covariance: semi-axes and angle in degrees */
function ellipse([a, b, c]: [number, number, number]) {
  const m = (a + c) / 2;
  const d = Math.sqrt(((a - c) / 2) ** 2 + b * b);
  const l1 = Math.max(m + d, 0);
  const l2 = Math.max(m - d, 0);
  return {
    rx: 2 * Math.sqrt(l1),
    ry: 2 * Math.sqrt(l2),
    deg: (0.5 * Math.atan2(2 * b, a - c) * 180) / Math.PI,
  };
}

/** two decimals is plenty for an SVG attribute, and it keeps SSR and client strings identical */
const f2 = (n: number) => n.toFixed(2);
const fmtM = (units: number) => String(Math.round((units * M_PER_UNIT) / 10) * 10);
const fmtSpeed = (units: number) => String(Math.round((units * M_PER_UNIT) / 5) * 5);

type Text = Record<
  | "truePath"
  | "blips"
  | "estimate"
  | "band"
  | "shadow"
  | "time"
  | "noise"
  | "dropBlips"
  | "play"
  | "pause"
  | "toEnd"
  | "whatIf"
  | "whatIfNote"
  | "rBlip"
  | "rEst"
  | "rBand"
  | "rSpeed"
  | "units"
  | "pm"
  | "speed"
  | "none"
  | "v0"
  | "vCoast"
  | "vBack"
  | "vExact"
  | "vBetter"
  | "vEarly"
  | "aria",
  string
>;

const TEXT: Record<"en" | "zh", Text> = {
  en: {
    truePath: "true path",
    blips: "radar blips",
    estimate: "estimate",
    band: "95% band",
    shadow: "radar shadow",
    time: "Time",
    noise: "Radar noise",
    dropBlips: "Drop the blips for a stretch",
    play: "Play",
    pause: "Pause",
    toEnd: "Show the whole run",
    whatIf: "What if I turn left?",
    whatIfNote: "A Kalman filter has no answer. It estimates what is there; it never asks what an action would do.",
    rBlip: "Latest blip off by",
    rEst: "Estimate off by",
    rBand: "Band, 95%",
    rSpeed: "Speed, estimate / true",
    units: "{n} m",
    pm: "±{n} m",
    speed: "{a} / {b} m/s",
    none: "no blip yet",
    v0: "One blip so far: the filter has a rough position and no velocity at all.",
    vCoast: "No blips for a while: the estimate is coasting on the dynamics alone and the band is opening.",
    vBack: "The blips are back and the band is closing again.",
    vExact: "The radar is nearly exact, so the filter has little to add and mostly repeats it.",
    vBetter: "The band is tighter than the radar's scatter: the filter trusts its own dynamics as much as the radar, and it carries a speed it never measured.",
    vEarly: "Early yet: the filter is still working out a velocity from the first few blips.",
    aria: "A plane on a smooth path with noisy radar blips scattered around it. At step {t} the Kalman estimate is {e} m from the plane and the latest blip is {b} m off.",
  },
  zh: {
    truePath: "真实航迹",
    blips: "雷达回波",
    estimate: "估计",
    band: "95% 不确定带",
    shadow: "雷达盲区",
    time: "时间",
    noise: "雷达噪声",
    dropBlips: "中途停掉一段回波",
    play: "播放",
    pause: "暂停",
    toEnd: "显示整段",
    whatIf: "如果我向左转呢？",
    whatIfNote: "卡尔曼滤波器没有答案。它估计的是有什么在那里，从不去问一个动作会带来什么。",
    rBlip: "最新回波偏差",
    rEst: "估计偏差",
    rBand: "不确定带，95%",
    rSpeed: "速度：估计 / 真实",
    units: "{n} 米",
    pm: "±{n} 米",
    speed: "{a} / {b} 米每秒",
    none: "还没有回波",
    v0: "目前只有一个回波：滤波器大致知道飞机在哪，对它的速度一无所知。",
    vCoast: "有一阵子没有回波了：估计只靠动力学在滑行，不确定带正在张开。",
    vBack: "回波回来了，不确定带又在收拢。",
    vExact: "雷达几乎精确，滤波器没什么可补的，基本上只是复述它。",
    vBetter: "不确定带比雷达的散布更窄：滤波器对自己的动力学和对雷达一样信任，而且它带着一个从未测量过的速度。",
    vEarly: "还早：滤波器还在从最初几个回波里算出一个速度。",
    aria: "一架飞机沿平滑航迹飞行，周围散布着带噪声的雷达回波。第 {t} 步时，卡尔曼估计距飞机 {e} 米，最新回波偏差 {b} 米。",
  },
};

const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));

export function KalmanTracker() {
  const locale = useLocale();
  const s: Text = TEXT[locale as keyof typeof TEXT] ?? TEXT.en;
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const k = compact ? 1.65 : 1;
  const noteId = useId();

  const [sigma, setSigma] = useState(25);
  const [shadow, setShadow] = useState(false);
  const [t, setT] = useState(N);
  const [playing, setPlaying] = useState(false);

  const steps = useMemo(() => simulate(sigma, shadow), [sigma, shadow]);

  // Play advances one step per tick. It is a plain interval rather than rAF so
  // a tick is a discrete event and the slider is always the same thing by hand.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setT((v) => {
        if (v >= N) {
          window.clearInterval(id);
          setPlaying(false);
          return v;
        }
        return v + 1;
      });
    }, 70);
    return () => window.clearInterval(id);
  }, [playing]);

  const play = () => {
    if (still) {
      setT(N);
      return;
    }
    if (playing) {
      setPlaying(false);
      return;
    }
    if (t >= N) setT(0);
    setPlaying(true);
  };

  const now = steps[t];
  const seen = steps.slice(0, t + 1);
  const blipsSeen = seen.filter((st) => st.blip);
  const lastBlip = blipsSeen[blipsSeen.length - 1];
  const sinceBlip = lastBlip ? t - lastBlip.i : t;

  const estErr = now.est ? Math.hypot(now.est[0] - now.truth[0], now.est[1] - now.truth[1]) : null;
  const blipErr = lastBlip?.blip
    ? Math.hypot(lastBlip.blip[0] - lastBlip.truth[0], lastBlip.blip[1] - lastBlip.truth[1])
    : null;
  const ell = now.cov ? ellipse(now.cov) : null;
  const estSpeed = now.est ? Math.hypot(now.est[2], now.est[3]) : null;
  const tNow = Math.max(t, 1);
  const prev = truth(tNow - 1);
  const cur = truth(tNow);
  const trueSpeed = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);

  /** steps without a blip immediately before step i */
  const gapBefore = (i: number) => {
    let j = i - 1;
    while (j >= 0 && !steps[j].blip) j--;
    return i - j - 1;
  };
  /** did a long silence end within the last few blips */
  const justBack = blipsSeen.slice(-3).some((st) => gapBefore(st.i) >= 6);

  const verdict = (() => {
    if (blipsSeen.length < 2) return s.v0;
    if (sinceBlip >= 4) return s.vCoast;
    if (justBack) return s.vBack;
    if (sigma < 10) return s.vExact;
    if (blipsSeen.length < 6) return s.vEarly;
    if (ell && ell.rx < sigma * 1.25) return s.vBetter;
    return s.vEarly;
  })();

  /** the band: ±2σ across the estimated track at every step so far */
  const bandPath = (() => {
    const up: string[] = [];
    const down: string[] = [];
    for (const st of seen) {
      if (!st.est || !st.cov) continue;
      const [px, py, vx, vy] = st.est;
      const sp = Math.hypot(vx, vy);
      const nx = sp > 0.3 ? -vy / sp : 0;
      const ny = sp > 0.3 ? vx / sp : 1;
      const [a, b, c] = st.cov;
      const w = Math.min(2 * Math.sqrt(Math.max(a * nx * nx + 2 * b * nx * ny + c * ny * ny, 0)), BAND_CAP);
      up.push(`${(px + nx * w).toFixed(1)} ${(py + ny * w).toFixed(1)}`);
      down.push(`${(px - nx * w).toFixed(1)} ${(py - ny * w).toFixed(1)}`);
    }
    if (up.length < 2) return "";
    return `M ${up.join(" L ")} L ${down.reverse().join(" L ")} Z`;
  })();

  const line = (pts: [number, number][]) =>
    pts.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

  const heading = (Math.atan2(cur[1] - prev[1], cur[0] - prev[0]) * 180) / Math.PI;
  const shadowX = [truth(SHADOW[0])[0], truth(SHADOW[1])[0]];
  const fs = 10 * k;

  const ariaLabel = fill(s.aria, {
    t,
    e: estErr === null ? "?" : fmtM(estErr),
    b: blipErr === null ? "?" : fmtM(blipErr),
  });

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={ariaLabel}>
          <defs>
            <pattern id="kfgrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M30 0 L0 0 0 30" fill="none" stroke="var(--rule)" strokeWidth="1" />
            </pattern>
            <clipPath id="kfclip">
              <rect width={W} height={H} />
            </clipPath>
          </defs>
          <rect width={W} height={H} fill="url(#kfgrid)" opacity="0.55" />

          {/* the stretch with no radar */}
          {shadow && (
            <g>
              <rect x={f2(shadowX[0])} y={0} width={f2(shadowX[1] - shadowX[0])} height={H - 36} fill="var(--paper-sunk)" opacity="0.9" />
              {!compact && (
                <text x={f2((shadowX[0] + shadowX[1]) / 2)} y={22} textAnchor="middle" className="font-mono"
                  fontSize={fs} letterSpacing="1" fill="var(--ink-faint)">
                  {s.shadow}
                </text>
              )}
            </g>
          )}

          {/* legend */}
          <g className="font-mono" fontSize={fs} letterSpacing="1">
            <line x1={X0} y1={H - 20} x2={X0 + 18} y2={H - 20} stroke="var(--actual)" strokeWidth="1.5" />
            <text x={X0 + 24} y={H - 16} fill="var(--actual)">{s.truePath}</text>
            <circle cx={X0 + (compact ? 190 : 130)} cy={H - 20} r="2.5" fill="var(--ink-faint)" />
            <text x={X0 + (compact ? 200 : 140)} y={H - 16} fill="var(--ink-faint)">{s.blips}</text>
            <line x1={X0 + (compact ? 390 : 250)} y1={H - 20} x2={X0 + (compact ? 408 : 268)} y2={H - 20} stroke="var(--imagine)" strokeWidth="2" />
            <text x={X0 + (compact ? 414 : 274)} y={H - 16} fill="var(--imagine)">{s.estimate}</text>
            {!compact && (
              <>
                <rect x={X0 + 360} y={H - 26} width={18} height={12} fill="var(--imagine)" opacity="0.14" />
                <text x={X0 + 384} y={H - 16} fill="var(--ink-muted)">{s.band}</text>
              </>
            )}
          </g>

          <g clipPath="url(#kfclip)">
            {/* uncertainty band, then the estimate on top of it */}
            {bandPath && <path d={bandPath} fill="var(--imagine)" opacity="0.14" />}

            {/* what really happened */}
            <path d={line(seen.map((st) => st.truth))} fill="none" stroke="var(--actual)" strokeWidth="1.5" />

            {/* what the radar said */}
            {blipsSeen.map((st) => (
              <circle key={st.i} cx={f2(st.blip![0])} cy={f2(st.blip![1])} r="2.5" fill="var(--ink-faint)" />
            ))}

            {/* what the filter believes */}
            <path d={line(seen.filter((st) => st.est).map((st) => [st.est![0], st.est![1]]))}
              fill="none" stroke="var(--imagine)" strokeWidth="2" strokeLinejoin="round" />

            {/* the 95% ellipse right now */}
            {now.est && ell && (
              <ellipse cx={f2(now.est[0])} cy={f2(now.est[1])} rx={f2(Math.min(ell.rx, BAND_CAP))} ry={f2(Math.min(ell.ry, BAND_CAP))}
                transform={`rotate(${ell.deg.toFixed(1)} ${now.est[0].toFixed(1)} ${now.est[1].toFixed(1)})`}
                fill="none" stroke="var(--imagine)" strokeWidth="1" strokeDasharray="3 3" />
            )}

            {/* the latest blip, ringed */}
            {lastBlip?.blip && (
              <circle cx={f2(lastBlip.blip[0])} cy={f2(lastBlip.blip[1])} r="5.5" fill="none" stroke="var(--ink-faint)" strokeWidth="1" />
            )}

            {/* the plane itself */}
            <g transform={`translate(${now.truth[0].toFixed(1)} ${now.truth[1].toFixed(1)}) rotate(${heading.toFixed(1)})`}>
              <path d="M 9 0 L -6 -5 L -3 0 L -6 5 Z" fill="var(--paper)" stroke="var(--actual)" strokeWidth="1.5" strokeLinejoin="round" />
            </g>
            {now.est && (
              <circle cx={f2(now.est[0])} cy={f2(now.est[1])} r="4.5" fill="var(--imagine)" stroke="var(--paper)" strokeWidth="1.5" />
            )}
          </g>
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-[16rem] flex-1 items-center gap-3">
          <span className="label whitespace-nowrap">{s.time}</span>
          <input
            type="range"
            min={0}
            max={N}
            value={t}
            onChange={(e) => { setPlaying(false); setT(Number(e.target.value)); }}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-10 text-right !text-ink">{t}</span>
        </label>

        <button
          onClick={play}
          className={`border px-4 py-1.5 transition-colors ${
            playing ? "border-imagine bg-imagine text-paper" : "border-rule-strong bg-paper text-ink hover:border-ink"
          }`}
        >
          <span className={`label ${playing ? "!text-paper" : ""}`}>
            {still ? s.toEnd : playing ? s.pause : s.play}
          </span>
        </button>

        <label className="flex min-w-[16rem] flex-1 items-center gap-3">
          <span className="label whitespace-nowrap">{s.noise}</span>
          <input
            type="range"
            min={4}
            max={60}
            step={1}
            value={sigma}
            onChange={(e) => setSigma(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-16 whitespace-nowrap text-right !text-ink">{fill(s.units, { n: fmtM(sigma) })}</span>
        </label>

        <label className="flex cursor-pointer items-center gap-3">
          <span className="label">{s.dropBlips}</span>
          <button
            role="switch"
            aria-checked={shadow}
            onClick={() => setShadow((v) => !v)}
            className={`relative h-6 w-11 border transition-colors ${
              shadow ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"
            }`}
          >
            <span
              className={`absolute top-[3px] h-4 w-4 transition-all ${
                shadow ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"
              }`}
            />
          </button>
        </label>
      </div>

      <div data-print-hide className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <button
          disabled
          aria-disabled="true"
          aria-describedby={noteId}
          title={s.whatIfNote}
          className="cursor-not-allowed border border-dashed border-rule-strong bg-paper px-4 py-1.5 opacity-60"
        >
          <span className="label">{s.whatIf}</span>
        </button>
        <p id={noteId} className="label max-w-[48ch] !normal-case !tracking-normal !text-[0.8rem]">
          {s.whatIfNote}
        </p>
      </div>

      <div className="flex flex-wrap items-center border-t border-rule px-5 py-4 md:px-8">
        <p className="label !normal-case !tracking-normal !text-[0.8rem]">{verdict}</p>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-rule bg-rule xl:grid-cols-4">
        {[
          [s.rBlip, blipErr === null ? s.none : fill(s.units, { n: fmtM(blipErr) })],
          [s.rEst, estErr === null ? s.none : fill(s.units, { n: fmtM(estErr) })],
          [s.rBand, ell ? fill(s.pm, { n: fmtM(ell.rx) }) : s.none],
          [s.rSpeed, estSpeed === null ? s.none : fill(s.speed, { a: fmtSpeed(estSpeed), b: fmtSpeed(trueSpeed) })],
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
