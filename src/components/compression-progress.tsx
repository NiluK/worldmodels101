"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * Compression progress as a drive.
 *
 * Three things a learner could look at: static, a pattern it already knows,
 * and a pattern it is still learning. The bar is how short the learner can
 * write down what it has seen so far; the reward at each step is how much
 * shorter it just got. Static never shortens, the known pattern is already
 * short, so neither pays. All the reward is in the middle one, and it runs out.
 * Every number here is illustrative: the curves are shapes, not measurements.
 */

const STEPS = 12;
type Tile = "static" | "known" | "learning";
const TILES: Tile[] = ["static", "known", "learning"];

const W = 900;
const H = 200;
const X0 = 40;
const X1 = W - 40;
const TRACK = X1 - X0;
const BAR_Y = 30;
const BAR_H = 26;
const BASE = 172;
const TICK_MAX = 56;

/** sizes at steps 0..12, in illustrative units out of 100 */
function sizes(tile: Tile): number[] {
  const out: number[] = [];
  for (let s = 0; s <= STEPS; s++) {
    if (tile === "static") out.push(100);
    else if (tile === "known") out.push(15);
    else {
      const k = 0.32;
      const a = Math.exp(-k * s);
      const b = Math.exp(-k * STEPS);
      out.push(Math.round(20 + 80 * ((a - b) / (1 - b))));
    }
  }
  return out;
}

/** seeded dots for the static tile, so server and client draw the same noise */
function noise(n: number) {
  let seed = 7;
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) pts.push([next() * 60, next() * 40]);
  return pts;
}

const TEXT = {
  en: {
    static: "Static",
    known: "A pattern it knows",
    learning: "A pattern it is learning",
    watch: "Watch",
    watchAgain: "Watch again",
    step: "Step",
    barLabel: "how short it can write it down",
    rewardLabel: "reward this step",
    stepOf: "Step",
    stepVal: (n: number) => `${n} of ${STEPS}`,
    size: "Compressed size",
    sizeVal: (n: number) => `${n} of 100`,
    reward: "Reward this step",
    v0: "Press Watch. The learner will look twelve times.",
    vStatic: "It never gets shorter. Nothing to learn, so nothing to be curious about.",
    vKnown: "Already short. Nothing left to learn here either.",
    vLearning: "Shorter than a moment ago. That drop is the reward.",
    vDone: "The curve has flattened. The reward has run out, and it is time to look somewhere new.",
    aria: (tile: string, n: number, size: number, reward: number) =>
      `Looking at ${tile}. Step ${n} of ${STEPS}. The learner can write down what it has seen in ${size} of 100 units. Reward this step: ${reward}.`,
  },
  zh: {
    static: "静态噪声",
    known: "它已认识的图案",
    learning: "它正在学的图案",
    watch: "观看",
    watchAgain: "再看一次",
    step: "走一步",
    barLabel: "它能写得多短",
    rewardLabel: "这一步的奖励",
    stepOf: "步数",
    stepVal: (n: number) => `第 ${n} 步，共 ${STEPS} 步`,
    size: "压缩后的大小",
    sizeVal: (n: number) => `${n} / 100`,
    reward: "这一步的奖励",
    v0: "按下「观看」，学习者会看十二次。",
    vStatic: "它从不会变短。没有什么可学，也就没有什么值得好奇。",
    vKnown: "本来就很短。这里也没有什么可学的了。",
    vLearning: "比刚才短了一点。那一段下降就是奖励。",
    vDone: "曲线已经走平。奖励用尽了，该去别处看看了。",
    aria: (tile: string, n: number, size: number, reward: number) =>
      `正在看${tile}。第 ${n} 步，共 ${STEPS} 步。学习者能把看到的东西写成 100 中的 ${size}。这一步的奖励：${reward}。`,
  },
} as const;

function Thumb({ tile }: { tile: Tile }) {
  const dots = useMemo(() => noise(110), []);
  return (
    <svg viewBox="0 0 60 40" className="block h-10 w-[60px]" aria-hidden="true">
      <rect width="60" height="40" fill="var(--paper-sunk)" />
      {tile === "static" &&
        dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.1" fill="var(--ink-faint)" />)}
      {tile === "known" &&
        Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={2 + i * 8.5} y="0" width="4" height="40" fill="var(--ink-faint)" />
        ))}
      {tile === "learning" &&
        Array.from({ length: 7 }, (_, i) => {
          const x = 4 + i * 8.5;
          return (
            <path
              key={i}
              d={`M ${x - 4} 0 Q ${x + 10} 20 ${x - 4} 40`}
              fill="none"
              stroke="var(--ink-faint)"
              strokeWidth="3.5"
            />
          );
        })}
    </svg>
  );
}

export function CompressionProgress() {
  const locale = useLocale();
  const s = TEXT[locale as keyof typeof TEXT] ?? TEXT.en;
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const k = compact ? 1.65 : 1;

  const [tile, setTile] = useState<Tile>("learning");
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const stepRef = useRef(0);

  const go = (n: number) => {
    stepRef.current = n;
    setStep(n);
  };

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const n = Math.min(STEPS, stepRef.current + 1);
      stepRef.current = n;
      setStep(n);
      if (n >= STEPS) {
        window.clearInterval(id);
        setRunning(false);
      }
    }, 300);
    return () => window.clearInterval(id);
  }, [running]);

  const curve = useMemo(() => sizes(tile), [tile]);
  const drops = curve.map((v, i) => (i ? curve[i - 1] - v : 0));
  const size = curve[step];
  const reward = drops[step];
  const maxDrop = Math.max(1, ...sizes("learning").map((v, i, a) => (i ? a[i - 1] - v : 0)));

  const pick = (tl: Tile) => {
    setRunning(false);
    setTile(tl);
    go(0);
  };
  const watch = () => {
    if (still) {
      setRunning(false);
      go(STEPS);
      return;
    }
    go(0);
    setRunning(true);
  };
  const stepOnce = () => {
    setRunning(false);
    go(Math.min(STEPS, stepRef.current + 1));
  };

  const verdict =
    step === 0
      ? s.v0
      : tile === "static"
        ? s.vStatic
        : tile === "known"
          ? s.vKnown
          : step >= STEPS
            ? s.vDone
            : s.vLearning;

  const slot = TRACK / STEPS;
  const barW = (size / 100) * TRACK;

  return (
    <div>
      {/* the three things it could look at */}
      <div className="grid grid-cols-3 gap-px border-b border-rule bg-rule">
        {TILES.map((tl) => {
          const on = tl === tile;
          return (
            <button
              key={tl}
              type="button"
              aria-pressed={on}
              onClick={() => pick(tl)}
              className={`flex flex-col items-start gap-2 px-4 py-4 text-left transition-colors md:flex-row md:items-center md:gap-4 md:px-8 ${
                on ? "bg-paper" : "bg-paper-raised hover:bg-paper"
              }`}
            >
              <span className={`border ${on ? "border-imagine" : "border-rule-strong"}`}>
                <Thumb tile={tl} />
              </span>
              <span className={`label !normal-case !tracking-normal !text-[0.8rem] ${on ? "!text-ink" : ""}`}>
                {s[tl]}
              </span>
            </button>
          );
        })}
      </div>

      <div ref={ref} className="px-4 pt-5 md:px-8">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full"
          role="img"
          aria-label={s.aria(s[tile], step, size, reward)}
        >
          <text x={X0} y={16} className="font-mono" fontSize={10 * k} letterSpacing="1" fill="var(--ink-faint)">
            {s.barLabel}
          </text>
          <rect x={X0} y={BAR_Y} width={TRACK} height={BAR_H} fill="var(--paper-sunk)" stroke="var(--rule-strong)" strokeWidth="1" />
          <motion.rect
            x={X0}
            y={BAR_Y}
            height={BAR_H}
            width={barW}
            fill="var(--ink)"
            initial={false}
            animate={{ width: barW }}
            transition={{ duration: still ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
          />
          <text
            x={X0 + barW + 8}
            y={BAR_Y + BAR_H / 2 + 4 * k}
            className="font-mono tnum"
            fontSize={11 * k}
            fill="var(--ink)"
          >
            {size}
          </text>
          {!compact && (
            <>
              <text x={X0} y={BAR_Y + BAR_H + 14} className="font-mono tnum" fontSize={9} fill="var(--ink-faint)">0</text>
              <text x={X1} y={BAR_Y + BAR_H + 14} textAnchor="end" className="font-mono tnum" fontSize={9} fill="var(--ink-faint)">100</text>
            </>
          )}

          <text x={X0} y={BASE - TICK_MAX - 14} className="font-mono" fontSize={10 * k} letterSpacing="1" fill="var(--ink-faint)">
            {s.rewardLabel}
          </text>
          <line x1={X0} y1={BASE} x2={X1} y2={BASE} stroke="var(--rule-strong)" strokeWidth="1" />
          {Array.from({ length: STEPS }, (_, i) => {
            const n = i + 1;
            const cx = X0 + (n - 0.5) * slot;
            const h = (drops[n] / maxDrop) * TICK_MAX;
            const seen = n <= step;
            const now = n === step;
            return (
              <g key={n}>
                <line x1={cx} y1={BASE} x2={cx} y2={BASE + 4} stroke="var(--rule-strong)" strokeWidth="1" />
                {seen && h > 0 && (
                  <motion.line
                    x1={cx}
                    x2={cx}
                    y1={BASE}
                    stroke="var(--imagine)"
                    strokeWidth={now ? 8 : 5}
                    initial={still ? false : { y2: BASE }}
                    animate={{ y2: BASE - h }}
                    transition={{ duration: still ? 0 : 0.24 }}
                  />
                )}
                {seen && h === 0 && (
                  <circle cx={cx} cy={BASE - 3} r={now ? 3 : 2} fill="var(--imagine)" />
                )}
                {now && (
                  <path d={`M ${cx - 5} ${BASE + 16} L ${cx + 5} ${BASE + 16} L ${cx} ${BASE + 9} Z`} fill="var(--ink)" />
                )}
                {(!compact || n === 1 || n === 6 || n === STEPS) && (
                  <text x={cx} y={H - 4} textAnchor="middle" className="font-mono tnum" fontSize={9 * k} fill={now ? "var(--ink)" : "var(--ink-faint)"}>
                    {n}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={watch}
            className="label border border-imagine bg-imagine px-3 py-1.5 !text-paper transition-colors"
          >
            {step === 0 ? s.watch : s.watchAgain}
          </button>
          <button
            type="button"
            onClick={stepOnce}
            disabled={step >= STEPS}
            className="label border border-rule-strong bg-paper px-3 py-1.5 !text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-50 disabled:hover:border-rule-strong"
          >
            {s.step}
          </button>
        </div>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem] sm:basis-auto sm:flex-1">{verdict}</p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [s.stepOf, s.stepVal(step)],
          [s.size, s.sizeVal(size)],
          [s.reward, String(reward)],
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
