"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState, type KeyboardEvent as RKeyboardEvent } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * Elman's hidden units, sorted into groups nobody asked for.
 *
 * Twenty-four words, each a dot placed by the network's internal state for it.
 * Before training the placement is a seeded scatter. After training the dots
 * move to a hierarchy: verbs apart from nouns, and inside the nouns the animate
 * ones apart from the inanimate, with humans and animals, food and objects,
 * nudged apart in turn. The dots stay --ink in both states, because the network
 * was never given a category; the dashed hulls and their labels are the
 * reader's, drawn afterwards. Positions are illustrative, not Elman's.
 */

type Group = "verb" | "human" | "animal" | "food" | "object";
type Word = { w: string; zh: string; g: Group };

const WORDS: Word[] = [
  { w: "eat", zh: "吃", g: "verb" },
  { w: "sleep", zh: "睡", g: "verb" },
  { w: "break", zh: "打破", g: "verb" },
  { w: "smash", zh: "砸碎", g: "verb" },
  { w: "see", zh: "看见", g: "verb" },
  { w: "chase", zh: "追", g: "verb" },
  { w: "think", zh: "思考", g: "verb" },
  { w: "exist", zh: "存在", g: "verb" },
  { w: "man", zh: "男人", g: "human" },
  { w: "woman", zh: "女人", g: "human" },
  { w: "boy", zh: "男孩", g: "human" },
  { w: "girl", zh: "女孩", g: "human" },
  { w: "cat", zh: "猫", g: "animal" },
  { w: "dog", zh: "狗", g: "animal" },
  { w: "mouse", zh: "老鼠", g: "animal" },
  { w: "lion", zh: "狮子", g: "animal" },
  { w: "bread", zh: "面包", g: "food" },
  { w: "cookie", zh: "饼干", g: "food" },
  { w: "sandwich", zh: "三明治", g: "food" },
  { w: "glass", zh: "玻璃杯", g: "object" },
  { w: "plate", zh: "盘子", g: "object" },
  { w: "rock", zh: "石头", g: "object" },
  { w: "book", zh: "书", g: "object" },
  { w: "car", zh: "汽车", g: "object" },
];

const VERBS = WORDS.map((x, i) => (x.g === "verb" ? i : -1)).filter((i) => i >= 0);
const ANIMATE = WORDS.map((x, i) => (x.g === "human" || x.g === "animal" ? i : -1)).filter((i) => i >= 0);
const INANIMATE = WORDS.map((x, i) => (x.g === "food" || x.g === "object" ? i : -1)).filter((i) => i >= 0);
const NOUNS = [...ANIMATE, ...INANIMATE];

/** A fixed scramble of the 24 grid cells, so the untrained scatter mixes the categories. */
const SCRAMBLE = [14, 3, 21, 8, 17, 0, 11, 22, 5, 19, 2, 13, 9, 23, 6, 16, 1, 20, 12, 4, 18, 10, 7, 15];

/**
 * Seeded fraction in [0, 1). Integer arithmetic only: Math.sin of a large
 * argument differs in its last digits between engines, and the server and the
 * client have to agree on every coordinate or hydration complains.
 */
function hash(n: number) {
  let x = (n + 1) * 0x9e3779b1;
  x = Math.imul(x ^ (x >>> 15), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

/** Three decimals in unit space is under a tenth of a pixel, and keeps the markup stable. */
const r2 = (v: number) => Math.round(v * 1000) / 1000;

/** Unit-square positions for the untrained network: a 6 by 4 grid, scrambled and jittered. */
const BEFORE: [number, number][] = WORDS.map((_, i) => {
  const cell = SCRAMBLE[i];
  const c = cell % 6;
  const r = Math.floor(cell / 6);
  return [
    r2((c + 0.5) / 6 + (hash(i * 2) - 0.5) * 0.11),
    r2((r + 0.5) / 4 + (hash(i * 2 + 1) - 0.5) * 0.16),
  ];
});

/** Where each sub-group lands after training, in unit-square coordinates. */
const CENTRES: Record<Group, [number, number]> = {
  verb: [0.16, 0.5],
  human: [0.54, 0.24],
  animal: [0.82, 0.24],
  food: [0.55, 0.74],
  object: [0.81, 0.74],
};

const AFTER: [number, number][] = (() => {
  const seen: Record<Group, number> = { verb: 0, human: 0, animal: 0, food: 0, object: 0 };
  const counts: Record<Group, number> = { verb: 0, human: 0, animal: 0, food: 0, object: 0 };
  for (const w of WORDS) counts[w.g]++;
  return WORDS.map((w, i) => {
    const n = seen[w.g]++;
    const rows = Math.ceil(counts[w.g] / 2);
    const [cx, cy] = CENTRES[w.g];
    const dx = ((n % 2) - 0.5) * (w.g === "verb" ? 0.07 : 0.075);
    const dy = (Math.floor(n / 2) - (rows - 1) / 2) * (w.g === "verb" ? 0.11 : 0.1);
    return [
      r2(cx + dx + (hash(100 + i) - 0.5) * 0.03),
      r2(cy + dy + (hash(200 + i) - 0.5) * 0.03),
    ];
  });
})();

const TEXT = {
  en: {
    before: "Before training",
    after: "After training",
    switchLabel: "After training",
    hint: "Hover or tap a dot, or focus the figure and use the arrow keys.",
    groups: "Groups you can see",
    word: "Word",
    noWord: "none yet",
    verbs: "verbs",
    nouns: "nouns",
    animate: "animate",
    inanimate: "inanimate",
    vBefore: "Twenty-four words, placed at random. Nothing to read yet.",
    vAfter: "The words sorted themselves. The labels round the groups are mine; the network was given none of them.",
    aria: (after: boolean, word: string | null) =>
      `Twenty-four words drawn as dots. ${
        after
          ? "After training: the dots have sorted into verbs on the left and nouns on the right, and inside the nouns the animate ones sit apart from the inanimate."
          : "Before training: the dots are scattered with no order."
      }${word ? ` Selected word: ${word}.` : ""}`,
  },
  zh: {
    before: "训练前",
    after: "训练后",
    switchLabel: "训练后",
    hint: "悬停或点按一个点，或让图获得焦点后用方向键。",
    groups: "你能看出的分组",
    word: "词",
    noWord: "还没有",
    verbs: "动词",
    nouns: "名词",
    animate: "有生命",
    inanimate: "无生命",
    vBefore: "二十四个词，随机摆放。还没有什么可读。",
    vAfter: "这些词自己排好了。圈住各组的标签是我加的；网络一个都没有得到。",
    aria: (after: boolean, word: string | null) =>
      `二十四个词画成点。${
        after
          ? "训练后：点分成了左边的动词和右边的名词，名词里有生命的又和无生命的分开。"
          : "训练前：点散乱地摆着，没有次序。"
      }${word ? `选中的词：「${word}」。` : ""}`,
  },
};

export function WordClusters() {
  const locale = useLocale();
  const s = TEXT[locale as keyof typeof TEXT] ?? TEXT.en;
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const k = compact ? 1.65 : 1;

  const [after, setAfter] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const shown = hover ?? pinned;

  const W = compact ? 560 : 900;
  const H = compact ? 500 : 400;
  const PAD = compact ? 36 : 44;
  const R = compact ? 9 : 5.5;
  const px = (u: number) => Math.round((PAD + u * (W - 2 * PAD)) * 10) / 10;
  const py = (u: number) => Math.round((PAD + u * (H - 2 * PAD)) * 10) / 10;

  const pos = (after ? AFTER : BEFORE).map(([x, y]) => [px(x), py(y)] as [number, number]);

  /** Hulls are bounding boxes of the trained positions, so they follow the dots. */
  const hull = (ids: number[], pad: number) => {
    const xs = ids.map((i) => px(AFTER[i][0]));
    const ys = ids.map((i) => py(AFTER[i][1]));
    const x = Math.min(...xs) - pad;
    const y = Math.min(...ys) - pad;
    return { x, y, w: Math.max(...xs) - x + pad, h: Math.max(...ys) - y + pad };
  };
  const inner = compact ? 34 : 28;
  const hulls = [
    { id: "verbs", label: s.verbs, box: hull(VERBS, inner) },
    { id: "animate", label: s.animate, box: hull(ANIMATE, inner) },
    { id: "inanimate", label: s.inanimate, box: hull(INANIMATE, inner) },
    { id: "nouns", label: s.nouns, box: hull(NOUNS, inner + 26 * k) },
  ];

  const wordOf = (i: number | null) =>
    i === null ? null : locale === "zh" ? `${WORDS[i].w} ${WORDS[i].zh}` : WORDS[i].w;

  const onKey = (e: RKeyboardEvent<SVGSVGElement>) => {
    const n = WORDS.length;
    const cur = pinned ?? -1;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (cur + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (cur - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else if (e.key === "Escape") next = null;
    else return;
    e.preventDefault();
    setPinned(next);
  };

  const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];
  const move = { duration: still ? 0 : 0.6, ease };

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[var(--imagine)]"
          role="img"
          tabIndex={0}
          aria-label={s.aria(after, wordOf(shown))}
          onKeyDown={onKey}
          onClick={() => setPinned(null)}
        >
          {/* the reader's hulls: dashed, hairline, and only after training */}
          {hulls.map(({ id, label, box }) => (
            <motion.g
              key={id}
              initial={false}
              animate={{ opacity: after ? 1 : 0 }}
              transition={{ duration: still ? 0 : 0.4, delay: after && !still ? 0.35 : 0 }}
              style={{ pointerEvents: "none" }}
            >
              <rect
                x={box.x} y={box.y} width={box.w} height={box.h}
                rx={compact ? 22 : 18}
                fill="none" stroke="var(--rule-strong)" strokeWidth="1" strokeDasharray="4 4"
              />
              <text
                x={box.x + 12}
                y={id === "verbs" || id === "nouns" ? box.y - 7 : box.y + 12 * k + 2}
                className="font-mono" fontSize={10 * k} letterSpacing="1.5"
                fill="var(--ink-faint)"
              >
                {label}
              </text>
            </motion.g>
          ))}

          {/* one dot per word; --ink in both states, the network was told no category */}
          {WORDS.map((w, i) => {
            const [x, y] = pos[i];
            const on = shown === i;
            return (
              <g key={w.w}>
                <motion.circle
                  initial={false}
                  animate={{ cx: x, cy: y }}
                  transition={move}
                  r={on ? R * 1.35 : R}
                  fill={on ? "var(--imagine)" : "var(--ink)"}
                  stroke="var(--paper)"
                  strokeWidth={1.5}
                  style={{ pointerEvents: "none" }}
                />
                {/* a larger, invisible target so a finger can land on it */}
                <motion.circle
                  initial={false}
                  animate={{ cx: x, cy: y }}
                  transition={move}
                  r={compact ? 22 : 14}
                  fill="transparent"
                  style={{ cursor: "pointer" }}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPinned((p) => (p === i ? null : i));
                  }}
                />
              </g>
            );
          })}

          {/* the word, beside its dot, on whichever side has the fewest neighbours */}
          {shown !== null && (() => {
            const [x, y] = pos[shown];
            const label = wordOf(shown) ?? "";
            const fs = 15 * k;
            const tw = Array.from(label).reduce((a, ch) => a + (/[\u3000-\u9fff]/.test(ch) ? 1 : 0.55), 0) * fs;
            const gap = R + 9;
            const spots: { x: number; y: number; anchor: "start" | "end" | "middle"; box: [number, number, number, number] }[] = [
              { x: x + gap, y: y + fs * 0.32, anchor: "start", box: [x + gap, y - fs / 2, x + gap + tw, y + fs / 2] },
              { x: x - gap, y: y + fs * 0.32, anchor: "end", box: [x - gap - tw, y - fs / 2, x - gap, y + fs / 2] },
              { x, y: y - gap + fs * 0.1, anchor: "middle", box: [x - tw / 2, y - gap - fs * 0.7, x + tw / 2, y - gap + fs * 0.1] },
              { x, y: y + gap + fs * 0.8, anchor: "middle", box: [x - tw / 2, y + gap, x + tw / 2, y + gap + fs] },
            ];
            const cost = (b: [number, number, number, number]) => {
              const out = b[0] < 4 || b[1] < 4 || b[2] > W - 4 || b[3] > H - 4 ? 100 : 0;
              return out + pos.reduce((n, [qx, qy], j) =>
                n + (j !== shown && qx > b[0] - R && qx < b[2] + R && qy > b[1] - R && qy < b[3] + R ? 1 : 0), 0);
            };
            const spot = spots.reduce((best, sp) => (cost(sp.box) < cost(best.box) ? sp : best), spots[0]);
            return (
              <motion.text
                key={shown}
                initial={false}
                animate={{ attrX: spot.x, attrY: spot.y }}
                transition={move}
                textAnchor={spot.anchor}
                fontFamily="var(--font-body)"
                fontSize={fs}
                fill="var(--ink)"
                stroke="var(--paper-raised)"
                strokeWidth={4 * k}
                paintOrder="stroke"
                strokeLinejoin="round"
                style={{ pointerEvents: "none" }}
              >
                {label}
              </motion.text>
            );
          })()}
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`label ${after ? "" : "!text-ink"}`}>{s.before}</span>
          <button
            type="button"
            role="switch"
            aria-checked={after}
            aria-label={s.switchLabel}
            onClick={() => setAfter((a) => !a)}
            className={`relative h-6 w-11 border transition-colors ${
              after ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"
            }`}
          >
            <span
              className={`absolute top-[3px] h-4 w-4 transition-all ${
                after ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"
              }`}
            />
          </button>
          <span className={`label ${after ? "!text-ink" : ""}`}>{s.after}</span>
        </div>

        <p className="label !normal-case !tracking-normal !text-[0.8rem]">
          {after ? s.vAfter : s.vBefore}
        </p>
        <p className="label !normal-case !tracking-normal basis-full !text-[0.75rem] !text-ink-faint">
          {s.hint}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        {[
          [s.groups, after ? "4" : "0"],
          [s.word, wordOf(shown) ?? s.noWord],
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
