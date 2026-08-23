"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * Scheduled sampling, as a dial.
 *
 * Ten training steps in a row. Each input is either the recorded truth (slate)
 * or the model's own last answer (vermilion), and the slider sets how many are
 * vermilion. The pattern for a given share is fixed, so dragging never
 * flickers. Under the inputs, the model's outputs sit a little above a faint
 * truth line, and further above it after a vermilion input: the model is
 * seeing its own mistakes. "Run the schedule" raises the share over seven
 * rounds the way Bengio did. Counts are literal; everything else is
 * illustrative.
 */

/** the order in which cells turn vermilion as the share rises (1-indexed) */
const ORDER = [2, 5, 8, 3, 7, 10, 4, 9, 6, 1];
/** the schedule, one stop per round */
const SCHEDULE = [0, 10, 20, 35, 50, 60, 70];
const STEP_MS = 400;
const N = 10;

type Run = { round: number; live: boolean };

const TEXT: LocaleText<{
  inputs: string; outputs: string; fromTruth: string; fromModel: string; truthLine: string;
  share: string; run: string; next: string; reset: string;
  round: (n: number, of: number) => string;
  read: [string, string, string];
  ofTen: (n: number) => string;
  practised: [string, string, string];
  v0: string; v1: string; v2: string; vRun: string;
  aria: (truth: number, own: number, share: number) => string;
}> = {
  en: {
    inputs: "inputs",
    outputs: "the model's output",
    fromTruth: "from the recorded truth",
    fromModel: "the model's own last answer",
    truthLine: "truth",
    share: "Share of own answers",
    run: "Run the schedule",
    next: "Next round",
    reset: "Reset",
    round: (n, of) => `round ${n} of ${of}`,
    read: ["Inputs from the truth", "Inputs from the model", "What the model has practised"],
    ofTen: (n) => `${n} of ${N}`,
    practised: ["never recovering", "recovering a little", "recovering often"],
    v0: "This is teacher forcing. The model has never once been handed its own mistake.",
    v1: "Some inputs are now its own answers, so it is practising on the run it will be asked for.",
    v2: "Most inputs are its own answers. The run it trains on now looks like the run it will be deployed on.",
    vRun: "Raising the share as training goes on is the schedule in scheduled sampling.",
    aria: (truth, own, share) =>
      `Ten training inputs. ${truth} from the recorded truth, ${own} from the model's own last answer. Share ${share} percent.`,
  },
  zh: {
    inputs: "输入",
    outputs: "模型的输出",
    fromTruth: "来自记录的真值",
    fromModel: "模型自己的上一个答案",
    truthLine: "真值",
    share: "自己答案的占比",
    run: "运行计划",
    next: "下一轮",
    reset: "重置",
    round: (n, of) => `第 ${n} 轮，共 ${of} 轮`,
    read: ["来自真值的输入", "来自模型的输入", "模型练过什么"],
    ofTen: (n) => `${N} 个中的 ${n} 个`,
    practised: ["从未练过恢复", "练过一点恢复", "经常练习恢复"],
    v0: "这就是教师强制。模型从来没有被递过一次自己的错误。",
    v1: "一部分输入现在是它自己的答案，于是它是在将来会被要求跑的那种运行上练习。",
    v2: "大多数输入都是它自己的答案。它训练时的运行，现在看起来像部署时的运行了。",
    vRun: "随着训练推进逐步提高这个占比，就是计划采样里的「计划」。",
    aria: (truth, own, share) =>
      `十个训练输入。${truth} 个来自记录的真值，${own} 个来自模型自己的上一个答案。占比 ${share}%。`,
  },
};

/** Two layouts: a wide box for the column, a narrower one for phones with larger type. */
function layout(compact: boolean) {
  const fs = compact ? 17 : 10.5;
  const W = compact ? 560 : 900;
  const pad = compact ? 16 : 24;
  const gap = compact ? 6 : 10;
  const cellW = (W - 2 * pad - (N - 1) * gap) / N;
  const labelY = fs + 8;
  const legendY = compact ? labelY + fs + 10 : labelY;
  const inY = (compact ? legendY + fs + 8 : legendY) + 12;
  const inH = compact ? 44 : 40;
  const numY = inY + inH + fs + 4;
  const outLabelY = numY + fs + 16;
  const outTop = outLabelY + 10;
  const outH = compact ? 72 : 64;
  const base = outTop + outH;
  const truthY = base - outH * 0.5;
  const H = base + 12;
  const xOf = (i: number) => pad + i * (cellW + gap);
  return { fs, W, H, pad, cellW, labelY, legendY, inY, inH, numY, outLabelY, base, truthY, outH, xOf };
}

export function ScheduledSamplingDial() {
  const locale = useLocale();
  const s = pickText(TEXT, locale);
  const still = useReducedMotion();
  const { ref, compact } = useCompact(600);
  const L = layout(compact);

  const [share, setShare] = useState(0);
  const [run, setRun] = useState<Run | null>(null);
  const last = SCHEDULE.length - 1;

  // while the schedule is live, one stop every STEP_MS; the timer is the only animation here
  useEffect(() => {
    if (!run?.live) return;
    const id = window.setTimeout(() => {
      setRun((r) => (!r ? r : r.round >= last ? { round: last, live: false } : { round: r.round + 1, live: true }));
    }, STEP_MS);
    return () => window.clearTimeout(id);
  }, [run, last]);

  const shown = run ? SCHEDULE[run.round] : share;
  const own = Math.round((shown / 100) * N);
  const ownSet = new Set(ORDER.slice(0, own));
  const scheduling = run !== null && (run.live || run.round < last);
  const verdict = scheduling ? s.vRun : shown === 0 ? s.v0 : shown < 50 ? s.v1 : s.v2;
  const practised = shown === 0 ? s.practised[0] : shown < 50 ? s.practised[1] : s.practised[2];

  const pressRun = () => {
    if (still) {
      setRun((r) => (!r || r.round >= last ? { round: 0, live: false } : { round: r.round + 1, live: false }));
    } else if (!run?.live) {
      setRun({ round: 0, live: true });
    }
  };
  const reset = () => { setRun(null); setShare(0); };
  const barW = L.cellW * 0.44;
  const miss = (i: number) => (ownSet.has(i + 1) ? L.outH * 0.3 : L.outH * 0.12);

  return (
    <div>
      <div ref={ref} className="px-4 pt-5 md:px-8">
        <svg viewBox={`0 0 ${L.W} ${L.H}`} className="block w-full" role="img"
          aria-label={s.aria(N - own, own, shown)}>
          <text x={L.pad} y={L.labelY} className="font-mono" fontSize={L.fs} letterSpacing="1" fill="var(--ink-muted)">
            {s.inputs}
          </text>
          {/* legend: slate is the recording, vermilion is the model's own last answer */}
          {(() => {
            const items = [
              { fill: "var(--actual)", text: s.fromTruth },
              { fill: "var(--imagine)", text: s.fromModel },
            ];
            const est = (t: string) => t.length * L.fs * (locale === "zh" ? 1.05 : 0.62) + L.fs * 1.4 + 22;
            let x = compact ? L.pad : L.W - L.pad - items.reduce((a, it) => a + est(it.text), 0);
            return items.map((it, i) => {
              const gx = x;
              if (!compact) x += est(it.text);
              return (
                <g key={it.text} transform={`translate(${gx}, ${L.legendY + (compact ? i * (L.fs + 8) : 0)})`}>
                  <rect x={0} y={-L.fs * 0.85} width={L.fs} height={L.fs} fill={it.fill} />
                  <text x={L.fs + 7} y={0} className="font-mono" fontSize={L.fs} fill="var(--ink-muted)">{it.text}</text>
                </g>
              );
            });
          })()}

          {/* the ten inputs */}
          {Array.from({ length: N }, (_, i) => (
            <g key={i}>
              <rect x={L.xOf(i)} y={L.inY} width={L.cellW} height={L.inH}
                fill={ownSet.has(i + 1) ? "var(--imagine)" : "var(--actual)"}
                className="transition-[fill] duration-200 motion-reduce:transition-none" />
              <text x={L.xOf(i) + L.cellW / 2} y={L.numY} textAnchor="middle" className="font-mono tnum"
                fontSize={L.fs} fill="var(--ink-faint)">{i + 1}</text>
            </g>
          ))}

          {/* the model's outputs, a little above the truth line, more so after a vermilion input */}
          <text x={L.pad} y={L.outLabelY} className="font-mono" fontSize={L.fs} letterSpacing="1" fill="var(--ink-muted)">
            {s.outputs}
          </text>
          <line x1={L.pad} y1={L.base} x2={L.W - L.pad} y2={L.base} stroke="var(--rule-strong)" strokeWidth="1" />
          <line x1={L.pad} y1={L.truthY} x2={L.W - L.pad} y2={L.truthY}
            stroke="var(--ink-faint)" strokeWidth="1" strokeDasharray="3 4" />
          <g transform={`translate(${L.W - L.pad}, ${L.outLabelY})`}>
            <text x={0} y={0} textAnchor="end" className="font-mono" fontSize={L.fs} fill="var(--ink-faint)">{s.truthLine}</text>
            <line x1={-(s.truthLine.length * L.fs * (locale === "zh" ? 1.05 : 0.62) + 8)} y1={-L.fs * 0.35}
              x2={-(s.truthLine.length * L.fs * (locale === "zh" ? 1.05 : 0.62) + 30)} y2={-L.fs * 0.35}
              stroke="var(--ink-faint)" strokeWidth="1" strokeDasharray="3 4" />
          </g>
          {Array.from({ length: N }, (_, i) => (
            <rect key={i} x={L.xOf(i) + (L.cellW - barW) / 2} y={L.truthY - miss(i)}
              width={barW} height={L.base - L.truthY + miss(i)} fill="var(--imagine)"
              className="transition-[y,height] duration-200 motion-reduce:transition-none" />
          ))}
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-col gap-4 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <label className="flex min-w-[14rem] flex-1 flex-wrap items-center gap-x-3 gap-y-2">
            <span className="label whitespace-nowrap">{s.share}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={shown % 10 === 0 ? 10 : 5}
              value={shown}
              disabled={run?.live ?? false}
              onChange={(e) => { setRun(null); setShare(Number(e.target.value)); }}
              aria-valuetext={`${shown}%`}
              className="h-1 min-w-[8rem] flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)] disabled:cursor-default"
            />
            <span className="label tnum w-12 text-right !text-ink">{shown}%</span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={pressRun}
              disabled={run?.live ?? false}
              className={`border px-3 py-1.5 font-mono text-[0.7rem] transition-colors ${
                run?.live ? "border-imagine bg-imagine text-paper" : "border-rule-strong bg-paper text-ink hover:border-ink"
              }`}
            >
              {still && run && run.round < last ? s.next : s.run}
            </button>
            <button
              onClick={reset}
              className="border border-rule-strong bg-paper px-3 py-1.5 font-mono text-[0.7rem] text-ink transition-colors hover:border-ink"
            >
              {s.reset}
            </button>
            {run && (
              <span className="label tnum" aria-live="polite">{s.round(run.round + 1, SCHEDULE.length)}</span>
            )}
          </div>
        </div>

        <p className="label max-w-[62ch] !normal-case !tracking-normal !text-[0.8rem]">{verdict}</p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [s.read[0], s.ofTen(N - own)],
          [s.read[1], s.ofTen(own)],
          [s.read[2], practised],
        ].map(([k, v]) => (
          <div key={k} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{k}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
