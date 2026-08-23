"use client";

import { useReducedMotion } from "motion/react";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { pickText } from "@/lib/locale-text";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";

/**
 * Same loop, three targets.
 *
 * The loop is drawn once and never changes. Only the word after "guess the
 * next" changes, and with it the panel underneath: what the machine is asked
 * to produce and where its capacity ends up. The bars are shapes, not
 * measurements; nothing here prints a percentage.
 */

type Target = "pixel" | "word" | "state";
const TARGETS: Target[] = ["pixel", "word", "state"];

const TEXT = {
  en: {
    look: "look", guess: "guess the next", compare: "compare", adjust: "adjust",
    unchanged: "nothing else in the loop changed",
    target: { pixel: "pixel", word: "word", state: "compact state" },
    machine: { pixel: "a renderer", word: "a language model", state: "a dynamics model" },
    capacity: "where the capacity goes",
    comesOut: "what comes out",
    leaves: "leaves", rest: "sky, trunk, ball",
    leafNote: "most of the pixels, hardest to call",
    grammar: "grammar", facts: "facts about the world",
    few: "the few numbers that matter",
    search: "a planner can search this",
    sentence: "The cat sat on the",
    now: "now", next: "next",
    rTarget: "Target", rOut: "What comes out", rWhere: "Where the capacity went",
    where: { pixel: "the leaves", word: "grammar and facts", state: "the few numbers that matter" },
    verdict: {
      pixel: "Leaves are hard and they are most of the picture, so that is where the capacity goes. That is the leaf problem.",
      word: "The next word turns on grammar and on facts, so that is what gets built.",
      state: "A short list of numbers, and the next one. A planner can search this.",
    },
    aria: (t: string, m: string, v: string) =>
      `The prediction loop drawn once: look, guess the next ${t}, compare, adjust. What comes out is ${m}. ${v}`,
  },
  zh: {
    look: "看", guess: "猜下一个", compare: "比对", adjust: "调整",
    unchanged: "循环里别的什么都没变",
    target: { pixel: "像素", word: "词", state: "紧凑状态" },
    machine: { pixel: "一台渲染器", word: "一个语言模型", state: "一个动力学模型" },
    capacity: "容量花在哪里",
    comesOut: "得到什么",
    leaves: "树叶", rest: "天空、树干、球",
    leafNote: "占了大半像素，也最难猜",
    grammar: "语法", facts: "关于世界的事实",
    few: "真正要紧的几个数",
    search: "规划器可以在这里搜索",
    sentence: "那只猫坐在",
    now: "现在", next: "下一步",
    rTarget: "目标", rOut: "得到什么", rWhere: "容量去了哪里",
    where: { pixel: "树叶", word: "语法和事实", state: "要紧的那几个数" },
    verdict: {
      pixel: "树叶难猜，而且占了画面的大半，所以容量都花在那里。这就是树叶问题。",
      word: "下一个词取决于语法和事实，所以建起来的就是这两样。",
      state: "一小串数字，以及下一串。规划器可以在这里搜索。",
    },
    aria: (t: string, m: string, v: string) =>
      `预测循环只画一次：看，猜下一个${t}，比对，调整。得到的是${m}。${v}`,
  },
} satisfies Partial<Record<Locale, unknown>>;

/* The four boxes, wide and compact share them; only the panel re-flows. */
const W = 900;
const BOX = { look: [40, 120], guess: [200, 300], compare: [540, 130], adjust: [710, 130] } as const;
const BOX_Y = 16, BOX_H = 56, MID = BOX_Y + BOX_H / 2;

const NOW = ["0.42", "-1.10", "0.07", "2.35", "-0.58", "1.02", "0.00", "-0.31"];
const NEXT = ["0.44", "-1.08", "0.09", "2.31", "-0.55", "1.04", "0.01", "-0.29"];

/* 12 by 9 stand-in for a frame: sky, a trunk, a big speckled leaf region, one ball */
const COLS = 12, ROWS = 9, CELL = 15;
function cellFill(r: number, c: number) {
  if (r === 7 && c === 9) return "var(--ball)";
  if (r >= 4 && (c === 5 || c === 6)) return "var(--terrain-4)";
  const leaf = r >= 1 && r <= 5 && c >= 2 && c <= 9 && !((r === 1 || r === 5) && (c === 2 || c === 9));
  if (leaf) return `var(--terrain-${1 + ((r * 7 + c * 13) % 3)})`;
  return r < 2 ? "var(--paper-sunk)" : "var(--rule)";
}

export function ThreeTargets() {
  const T = pickText(TEXT, useLocale());
  const still = useReducedMotion();
  const { ref, compact } = useCompact(620);
  const k = compact ? 1.65 : 1;
  const [target, setTarget] = useState<Target>("pixel");

  /* panel geometry: picture region centred on cx; bar region at bx..bx+bw */
  const H = compact ? 560 : 350;
  const cx = compact ? 450 : 220;
  const picTop = 140;
  const bx = compact ? 40 : 440, bw = compact ? 820 : 420;
  const titleY = compact ? 370 : 150, barY = titleY + 30, barH = 26;
  const labelY = barY + barH + 22, noteY = labelY + 28, machY = compact ? 530 : 318;
  /* the state lists need more room between columns when the type is enlarged */
  const sp = compact ? 1.8 : 1, row = 15 * k;
  const treeX = compact ? cx + 150 * sp : cx, treeY = compact ? picTop + 30 : picTop + 24 + 8 * row + 4;

  const segs: { w: number; fill: string; stroke?: string }[] =
    target === "pixel"
      ? [
          { w: 0.74, fill: "var(--imagine)" },
          { w: 0.09, fill: "var(--rule)" },
          { w: 0.1, fill: "var(--rule-strong)" },
          { w: 0.07, fill: "var(--ink-faint)" },
        ]
      : target === "word"
        ? [
            { w: 0.55, fill: "var(--imagine)" },
            { w: 0.45, fill: "var(--imagine-soft)", stroke: "var(--imagine)" },
          ]
        : [{ w: 0.28, fill: "var(--imagine)" }];
  const starts = segs.reduce<number[]>((acc, s, i) => [...acc, (acc[i - 1] ?? 0) + (i ? segs[i - 1].w : 0)], []);
  /* A CSS transition rather than a scripted one: the segments are drawn at
     their final size on first paint, and only the change between targets is
     eased. Under reduced motion they simply jump. */
  const ease = still ? undefined : "x 0.5s cubic-bezier(0.16, 1, 0.3, 1), width 0.5s cubic-bezier(0.16, 1, 0.3, 1)";

  const mono = { className: "font-mono", fontSize: 10 * k, letterSpacing: 1, fill: "var(--ink-muted)" };
  const arrow = (x1: number, x2: number) => (
    <line x1={x1} y1={MID} x2={x2} y2={MID} stroke="var(--ink-muted)" strokeWidth="1.2" markerEnd="url(#tt-ar)" />
  );

  return (
    <div>
      <div ref={ref} className="px-4 pt-5 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={T.aria(T.target[target], T.machine[target], T.verdict[target])}>
          <defs>
            <marker id="tt-ar" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6" fill="none" stroke="var(--ink-muted)" strokeWidth="1.2" />
            </marker>
          </defs>

          {/* the loop, drawn once */}
          {(Object.keys(BOX) as (keyof typeof BOX)[]).map((id) => {
            const [x, w] = BOX[id];
            return (
              <g key={id}>
                <rect x={x} y={BOX_Y} width={w} height={BOX_H} fill="var(--paper)" stroke="var(--ink)" strokeWidth="1" />
                {id === "guess" ? (
                  <>
                    <text x={x + w / 2} y={MID - 5} textAnchor="middle" fontFamily="var(--font-body)" fontSize={14 * k} fill="var(--ink)">{T.guess}</text>
                    <text x={x + w / 2} y={MID + 17} textAnchor="middle" fontFamily="var(--font-body)" fontSize={14 * k} fontStyle="italic" fill="var(--imagine)">{T.target[target]}</text>
                  </>
                ) : (
                  <text x={x + w / 2} y={MID + 5} textAnchor="middle" fontFamily="var(--font-body)" fontSize={14 * k} fill="var(--ink)">{T[id]}</text>
                )}
              </g>
            );
          })}
          {arrow(164, 194)}
          {arrow(504, 534)}
          {arrow(674, 704)}
          <path d={`M 775 ${BOX_Y + BOX_H} V 98 H 100 V ${BOX_Y + BOX_H + 8}`} fill="none"
            stroke="var(--ink-muted)" strokeWidth="1.2" markerEnd="url(#tt-ar)" />
          <text x={437} y={114} textAnchor="middle" {...mono}>{T.unchanged}</text>

          {/* the picture region: what the target is */}
          {target === "pixel" && (
            <g transform={`translate(${cx - (COLS * CELL) / 2} ${picTop + 12})`}>
              {Array.from({ length: ROWS }, (_, r) =>
                Array.from({ length: COLS }, (_, c) => (
                  <rect key={`${r}-${c}`} x={c * CELL} y={r * CELL} width={CELL} height={CELL}
                    fill={cellFill(r, c)} stroke={r === 7 && c === 9 ? "var(--ink)" : "var(--paper)"} strokeWidth="0.8" />
                )),
              )}
              <rect x={0} y={0} width={COLS * CELL} height={ROWS * CELL} fill="none" stroke="var(--rule-strong)" strokeWidth="1" />
              {!compact && <text x={COLS * CELL / 2} y={ROWS * CELL + 22} textAnchor="middle" {...mono}>12 × 9</text>}
            </g>
          )}
          {target === "word" && (
            <g>
              <text x={cx - 20} y={picTop + 80} textAnchor="end" fontFamily="var(--font-body)" fontSize={22 * k} fill="var(--ink)">{T.sentence}</text>
              <line x1={cx - 8} y1={picTop + 84} x2={cx + 110} y2={picTop + 84} stroke="var(--imagine)" strokeWidth="2" />
            </g>
          )}
          {target === "state" && (
            <g>
              {[NOW, NEXT].map((col, i) => {
                const x = cx + (i ? 30 : -110) * sp;
                return (
                  <g key={i}>
                    <text x={x} y={picTop + 4} {...mono}>{i ? T.next : T.now}</text>
                    {col.map((v, j) => (
                      <text key={j} x={x + 40 * sp} y={picTop + 24 + j * row} textAnchor="end" className="font-mono tnum"
                        fontSize={11.5 * k} fill={i ? "var(--imagine)" : "var(--ink)"}>{v}</text>
                    ))}
                  </g>
                );
              })}
              <line x1={cx - 52 * sp} y1={picTop + 18 + 3.5 * row} x2={cx + 18 * sp} y2={picTop + 18 + 3.5 * row} stroke="var(--ink-muted)" strokeWidth="1.2" markerEnd="url(#tt-ar)" />
              {/* a tiny tree: a planner can search this. Under the lists on a
                  wide column, beside them when the enlarged type needs the height. */}
              <g transform={`translate(${treeX} ${treeY}) scale(${compact ? 1.4 : 1})`} stroke="var(--ink-muted)" strokeWidth="1.2" fill="var(--paper)">
                <path d="M0 0 L-30 40 M0 0 L0 40 M0 0 L30 40" />
                <circle cx={0} cy={0} r={4} fill="var(--imagine)" stroke="var(--imagine)" />
                <circle cx={-30} cy={40} r={4} /><circle cx={0} cy={40} r={4} /><circle cx={30} cy={40} r={4} />
              </g>
              <text x={treeX} y={treeY + (compact ? 90 : 62)} textAnchor="middle" {...mono}>{T.search}</text>
            </g>
          )}

          {/* the capacity bar */}
          <text x={bx} y={titleY} {...mono}>{T.capacity}</text>
          <rect x={bx} y={barY} width={bw} height={barH} fill="none" stroke="var(--rule)" strokeWidth="1" />
          {segs.map((s, i) => (
            <rect key={i} x={bx + starts[i] * bw} y={barY} width={s.w * bw} height={barH}
              fill={s.fill} stroke={s.stroke ?? "var(--paper)"} strokeWidth="1" style={{ transition: ease }} />
          ))}
          {target === "pixel" && (
            <>
              <text x={bx} y={labelY} {...mono} fill="var(--imagine)">{T.leaves}</text>
              <text x={bx + bw} y={labelY} textAnchor="end" {...mono}>{T.rest}</text>
              <text x={bx} y={noteY} fontFamily="var(--font-body)" fontSize={13 * k} fill="var(--ink-muted)">{T.leafNote}</text>
            </>
          )}
          {target === "word" && (
            <>
              <text x={bx} y={labelY} {...mono} fill="var(--imagine)">{T.grammar}</text>
              <text x={bx + bw} y={labelY} textAnchor="end" {...mono} fill="var(--imagine)">{T.facts}</text>
            </>
          )}
          {target === "state" && <text x={bx} y={labelY} {...mono} fill="var(--imagine)">{T.few}</text>}
          <text x={bx} y={machY - 20} {...mono}>{T.comesOut}</text>
          <text x={bx} y={machY} fontFamily="var(--font-body)" fontSize={18 * k} fill="var(--ink)">{T.machine[target]}</text>
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex flex-wrap gap-2" role="group" aria-label={T.rTarget}>
          {TARGETS.map((m) => (
            <button key={m} type="button" aria-pressed={target === m} onClick={() => setTarget(m)}
              className={`border px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] transition-colors ${
                target === m ? "border-imagine bg-imagine text-paper" : "border-rule-strong bg-paper text-ink-muted hover:border-ink hover:text-ink"
              }`}>
              {T.target[m]}
            </button>
          ))}
        </div>
        <p className="label max-w-[52ch] !normal-case !tracking-normal !text-[0.8rem]">{T.verdict[target]}</p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.rTarget, T.target[target]],
          [T.rOut, T.machine[target]],
          [T.rWhere, T.where[target]],
        ].map(([label, v]) => (
          <div key={label} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{label}</p>
            <p className="mt-1 text-[0.98rem] text-ink">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
