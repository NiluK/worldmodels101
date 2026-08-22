"use client";

import { useState, type KeyboardEvent } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";

/**
 * Five sentences, one blank each. The reader guesses, then presses Reveal.
 *
 * Each sentence is chosen so that the next word turns on something that was
 * never set as a task: a fact, a translation, how things behave, a summary,
 * arithmetic. The figure makes one claim visible: the target decides the
 * machine, because the next word sometimes depends on those things.
 */

type Item = {
  /** an optional line of context shown above the sentence */
  setup?: string;
  before: string;
  answer: string;
  after?: string;
  tag: string;
};

type Strings = {
  items: Item[];
  prev: string;
  next: string;
  reveal: string;
  revealed: string;
  goTo: (n: number) => string;
  sentence: string;
  ofN: (n: number, total: number) => string;
  dependedOn: string;
  tryFirst: string;
  verdictBefore: string;
  verdictAfter: (tag: string) => string;
  note: string;
  ariaBlank: string;
  ariaHidden: string;
  ariaShown: (tag: string) => string;
};

const TEXT: Record<"en" | "zh", Strings> = {
  en: {
    items: [
      { before: "The capital of France is", answer: "Paris", after: ".", tag: "a fact about the world" },
      { before: "In French, thank you is", answer: "merci", after: ".", tag: "a translation" },
      { before: "She dropped the glass and it", answer: "broke", after: ".", tag: "how things behave" },
      {
        setup: "Sales were down a third this year.",
        before: "He read the whole report, and the short version is: sales",
        answer: "fell",
        after: ".",
        tag: "a summary of what came before",
      },
      { before: "Two plus two is", answer: "four", after: ".", tag: "arithmetic" },
    ],
    prev: "Previous",
    next: "Next",
    reveal: "Reveal",
    revealed: "Revealed",
    goTo: (n) => `Sentence ${n}`,
    sentence: "Sentence",
    ofN: (n, total) => `${n} of ${total}`,
    dependedOn: "What the next word depended on",
    tryFirst: "try it yourself first",
    verdictBefore: "Fill the blank in your head, then press Reveal.",
    verdictAfter: (tag) =>
      `Nobody set this as a task. The next word depended on ${tag}, so the predictor had to have it.`,
    note: "GPT-2 was trained only to predict the next word.",
    ariaBlank: "blank",
    ariaHidden: "Not yet revealed. Press Enter to reveal.",
    ariaShown: (tag) => `The next word depended on ${tag}.`,
  },
  zh: {
    items: [
      { before: "法国的首都是", answer: "巴黎", after: "。", tag: "一个关于世界的事实" },
      { before: "法语里，谢谢是", answer: "merci", after: "。", tag: "一次翻译" },
      { before: "她把玻璃杯掉在地上，杯子", answer: "碎了", after: "。", tag: "事物的行为方式" },
      {
        setup: "今年销售额下降了三分之一。",
        before: "他读完了整份报告，一句话概括就是：销售额",
        answer: "下降了",
        after: "。",
        tag: "对前文的概括",
      },
      { before: "二加二等于", answer: "四", after: "。", tag: "算术" },
    ],
    prev: "上一句",
    next: "下一句",
    reveal: "揭晓",
    revealed: "已揭晓",
    goTo: (n) => `第 ${n} 句`,
    sentence: "句子",
    ofN: (n, total) => `第 ${n} 句，共 ${total} 句`,
    dependedOn: "下一个词取决于什么",
    tryFirst: "先自己试试",
    verdictBefore: "先在心里把空填上，再按「揭晓」。",
    verdictAfter: (tag) => `没有人把这设成一项任务。下一个词取决于${tag}，所以预测器不得不掌握它。`,
    note: "GPT-2 只被训练做一件事：预测下一个词。",
    ariaBlank: "空白",
    ariaHidden: "尚未揭晓。按回车键揭晓。",
    ariaShown: (tag) => `下一个词取决于${tag}。`,
  },
};

const COUNT = TEXT.en.items.length;

export function NextWordDepends() {
  const locale = useLocale();
  const T = TEXT[locale === "zh" ? "zh" : "en"];
  const { ref, compact } = useCompact(520);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState<boolean[]>(() => Array(COUNT).fill(false));

  const item = T.items[i];
  const revealed = shown[i];

  const step = (d: number) => setI((n) => Math.min(COUNT - 1, Math.max(0, n + d)));
  const reveal = () =>
    setShown((s) => {
      if (s[i]) return s;
      const next = s.slice();
      next[i] = true;
      return next;
    });

  // Arrow keys step, Enter reveals. A focused button keeps its own Enter, so
  // the handler only takes Enter from the sentence itself.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); return; }
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "BUTTON") {
      e.preventDefault();
      reveal();
    }
  };

  const ariaLabel = [
    `${T.sentence} ${T.ofN(i + 1, COUNT)}.`,
    item.setup ?? "",
    `${item.before} ${revealed ? item.answer : T.ariaBlank}${item.after ?? ""}`,
    revealed ? T.ariaShown(item.tag) : T.ariaHidden,
  ]
    .filter(Boolean)
    .join(" ");

  const btn = "border border-rule-strong bg-paper px-3 py-1.5 font-mono text-[0.7rem] tracking-[0.12em] uppercase text-ink transition-colors hover:border-ink disabled:cursor-default";

  return (
    <div onKeyDown={onKeyDown}>
      <div ref={ref} className="px-5 pt-7 pb-6 md:px-8">
        <div
          role="img"
          tabIndex={0}
          aria-label={ariaLabel}
          className="outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-imagine"
        >
          {item.setup && (
            <p className={`font-body text-ink-muted ${compact ? "text-[1.05rem]" : "text-[1.25rem]"} leading-snug`}>
              {item.setup}
            </p>
          )}
          <p className={`font-body text-ink ${compact ? "text-[1.55rem]" : "text-[2.1rem]"} leading-snug ${item.setup ? "mt-2" : ""}`}>
            {item.before}{" "}
            <span
              className={`inline-block min-w-[3.2ch] border-b-2 border-imagine align-baseline leading-none ${
                revealed ? "text-imagine" : "text-transparent"
              }`}
            >
              {revealed ? item.answer : "    "}
            </span>
            {item.after}
          </p>
        </div>

        <p aria-live="polite" className="mt-5 max-w-[60ch] text-[0.9rem] leading-relaxed text-ink-muted">
          {revealed ? T.verdictAfter(item.tag) : T.verdictBefore}
        </p>
        <p className="label mt-3 !normal-case !tracking-[0.06em] !text-ink-faint">{T.note}</p>
      </div>

      <div data-print-hide className="flex flex-wrap items-center gap-x-3 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <button type="button" onClick={() => step(-1)} disabled={i === 0} className={`${btn} disabled:border-rule disabled:text-ink-faint`}>
          {T.prev}
        </button>
        <div className="flex items-center gap-1.5" role="group">
          {T.items.map((_, n) => (
            <button
              key={n}
              type="button"
              aria-label={T.goTo(n + 1)}
              aria-pressed={n === i}
              onClick={() => setI(n)}
              className={`h-3.5 w-3.5 border transition-colors ${
                n === i
                  ? "border-imagine bg-imagine"
                  : shown[n]
                    ? "border-imagine bg-paper hover:border-ink"
                    : "border-rule-strong bg-paper hover:border-ink"
              }`}
            />
          ))}
        </div>
        <button type="button" onClick={() => step(1)} disabled={i === COUNT - 1} className={`${btn} disabled:border-rule disabled:text-ink-faint`}>
          {T.next}
        </button>
        <button
          type="button"
          onClick={reveal}
          disabled={revealed}
          className={`ml-auto ${btn} ${revealed ? "!border-imagine !bg-imagine !text-paper" : ""}`}
        >
          {revealed ? T.revealed : T.reveal}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        {[
          [T.sentence, T.ofN(i + 1, COUNT)],
          [T.dependedOn, revealed ? item.tag : T.tryFirst],
        ].map(([k, v]) => (
          <div key={k} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{k}</p>
            <p className={`tnum mt-1 text-[0.98rem] ${k === T.dependedOn && revealed ? "text-imagine" : "text-ink"}`}>{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
