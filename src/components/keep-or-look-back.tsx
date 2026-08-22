"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * Keep or look back.
 *
 * Six facts arrive one at a time and a question comes last. A summary with
 * room for three has to decide what to keep as each fact arrives, before it
 * knows the question. A window keeps all six and puts off the decision until
 * the read. Neither rule is the point; the point is that whatever throws
 * things away cannot see the future. Illustrative throughout.
 */

type Mode = "summary" | "window";

const N = 6;
const ROOM = 3;
/** the fact each question asks about, 0-based */
const QS = [0, 2, 5] as const;
const PLAY_MS = 550;

const TEXT = {
  en: {
    facts: ["door open", "ball rolling", "key is red", "light off", "box heavy", "dog outside"],
    questions: ["Is the door open?", "What colour is the key?", "Is the dog outside?"],
    stream: "facts, in order of arrival",
    questionSoon: "question, at the end",
    summaryTitle: "summary, room for three",
    rule: "rule: drop the oldest",
    windowTitle: "window, all six kept",
    lookBack: "look back",
    modeSummary: "carry a summary",
    modeWindow: "keep a window",
    question: "question",
    play: "Play",
    step: "Step",
    reset: "Reset",
    kept: "kept",
    keptSummary: "3 of 6",
    keptWindow: "6 of 6",
    work: "work per step",
    workSummary: "the same every step",
    workWindow: "grows with the length",
    before: "Pick a question, then press Play.",
    midSummary: (n: number) =>
      n <= ROOM
        ? `${n} of 6 arrived. The summary still has room.`
        : `${n} of 6 arrived. No room, so the oldest went.`,
    midWindow: (n: number) => `${n} of 6 arrived. The window keeps every one.`,
    hit: "The fact was still in the summary. This time it kept the right three.",
    miss: (n: number) =>
      `The summary dropped that fact when fact ${n} arrived. It had no way to know you would ask.`,
    window: "The window looked back and found it. It paid by keeping all six.",
    aria: (mode: string, n: number, verdict: string) =>
      `Six facts arrive one at a time, ${n} so far, ${mode}. ${verdict}`,
  },
  zh: {
    facts: ["门开着", "球在滚", "钥匙是红的", "灯关了", "箱子很重", "狗在外面"],
    questions: ["门开着吗？", "钥匙是什么颜色？", "狗在外面吗？"],
    stream: "事实，按到来顺序",
    questionSoon: "问题，最后到来",
    summaryTitle: "摘要，只放得下三条",
    rule: "规则：丢掉最旧的",
    windowTitle: "窗口，六条全留",
    lookBack: "回看",
    modeSummary: "带着摘要",
    modeWindow: "保留窗口",
    question: "问题",
    play: "播放",
    step: "单步",
    reset: "重置",
    kept: "保留",
    keptSummary: "六条里的三条",
    keptWindow: "六条全部",
    work: "每步的工作量",
    workSummary: "每一步都一样",
    workWindow: "随长度增长",
    before: "先选一个问题，再按播放。",
    midSummary: (n: number) =>
      n <= ROOM ? `六条到了 ${n} 条。摘要还有空位。` : `六条到了 ${n} 条。没有空位，最旧的那条出去了。`,
    midWindow: (n: number) => `六条到了 ${n} 条。窗口每一条都留着。`,
    hit: "那条事实还在摘要里。这一次它留对了三条。",
    miss: (n: number) => `第 ${n} 条到来时，摘要丢掉了那条事实。它无从知道你会问这个。`,
    window: "窗口回头看了一眼，找到了。代价是六条全留着。",
    aria: (mode: string, n: number, verdict: string) =>
      `六条事实依次到来，目前到了 ${n} 条，${mode}。${verdict}`,
  },
};

export function KeepOrLookBack() {
  const locale = useLocale();
  const T = locale === "zh" ? TEXT.zh : TEXT.en;
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);

  const [mode, setMode] = useState<Mode>("summary");
  const [q, setQ] = useState(0);
  /** 0 = nothing yet, 1..6 = facts arrived, 7 = the question has been delivered */
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const arrived = Math.min(step, N);
  const asked = step > N;
  const need = QS[q];
  /** with the drop-the-oldest rule, the box holds the newest three */
  const kept = (i: number) => i >= arrived - ROOM;
  const dropped = (i: number) => i < arrived && !kept(i);
  /** the fact whose arrival pushed fact i out, 1-based */
  const droppedAt = need + ROOM + 1;
  const hit = mode === "window" || kept(need);

  /** the auto-run: one arrival per tick until the question has landed */
  const running = playing && !asked;
  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setStep((s) => s + 1), PLAY_MS);
    return () => window.clearTimeout(id);
  }, [running, step]);

  const advance = () => setStep((s) => Math.min(s + 1, N + 1));
  const reset = () => {
    setPlaying(false);
    setStep(0);
  };
  const play = () => {
    if (asked) return reset();
    if (still) return setStep(N + 1);
    advance();
    setPlaying(true);
  };

  const verdict = !asked
    ? step === 0
      ? T.before
      : mode === "summary"
        ? T.midSummary(arrived)
        : T.midWindow(arrived)
    : mode === "window"
      ? T.window
      : hit
        ? T.hit
        : T.miss(droppedAt);

  /* ---------- geometry ---------- */
  /* compact: the six cards fold into two rows of three, so the labels stay legible */
  const W = compact ? 404 : 900;
  const H = compact ? 312 : 236;
  const k = compact ? 1.2 : 1;
  const card = compact
    ? { x0: 20, y: 18, w: 116, h: 40, pitch: 128, rowPitch: 52, cols: 3 }
    : { x0: 20, y: 26, w: 96, h: 46, pitch: 112, rowPitch: 0, cols: N };
  const cardX = (i: number) => card.x0 + (i % card.cols) * card.pitch;
  const cardY = (i: number) => card.y + Math.floor(i / card.cols) * card.rowPitch;
  const cx = (i: number) => cardX(i) + card.w / 2;
  const qBox = compact ? { x: 20, y: 144, w: 372, h: 38 } : { x: 706, y: 26, w: 174, h: 46 };
  const box = compact ? { x: 20, y: 198, w: 372, h: 102 } : { x: 20, y: 116, w: 348, h: 100 };
  const slot = compact
    ? { x0: box.x + 12, y: box.y + 30, w: 112, h: 40, pitch: 118 }
    : { x0: box.x + 14, y: box.y + 30, w: 96, h: 46, pitch: 112 };
  const win = compact
    ? { x: 12, y: 14, w: 388, h: 104 }
    : { x: 14, y: 20, w: card.x0 + 5 * card.pitch + card.w - 8, h: 58 };
  const fs = compact ? 14 : 12;
  const fsTiny = compact ? 11 : 10;
  const fade = still ? false : { opacity: 0 };

  const factCard = (i: number, x: number, y: number, w: number, h: number, faint: boolean, hot: boolean) => {
    const label = T.facts[i];
    const ls = [label];
    const fill = faint ? "var(--paper)" : "var(--actual-soft)";
    const stroke = hot ? "var(--imagine)" : faint ? "var(--ink-faint)" : "var(--actual)";
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke}
          strokeWidth={hot ? 2 : 1.2} strokeDasharray={faint && hot ? "4 3" : undefined} />
        {ls.map((l, j) => (
          <text key={j} x={x + w / 2} textAnchor="middle"
            y={y + h / 2 + (j - (ls.length - 1) / 2) * fs * 1.25 + fs * 0.36}
            className="font-mono" fontSize={fs} fill={faint ? "var(--ink-faint)" : "var(--ink)"}>
            {l}
          </text>
        ))}
        {faint && (
          <line x1={x + 6} y1={y + h / 2} x2={x + w - 6} y2={y + h / 2}
            stroke="var(--ink-faint)" strokeWidth="1.4" />
        )}
        <text x={x + 5} y={y + 10} className="font-mono" fontSize={compact ? 9 : 8.5} fill="var(--ink-faint)">
          {i + 1}
        </text>
      </g>
    );
  };

  const modeWord = mode === "summary" ? T.modeSummary : T.modeWindow;

  return (
    <div>
      <div ref={ref} className="px-4 pt-5 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={T.aria(modeWord, arrived, verdict)}>
          <defs>
            <marker id="kolb-ar" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--imagine)" strokeWidth="1.3" />
            </marker>
            <marker id="kolb-ar-ink" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--ink-muted)" strokeWidth="1.3" />
            </marker>
          </defs>

          {!compact && (
            <text x={card.x0} y={14} className="font-mono" fontSize={fsTiny * k} letterSpacing="1"
              fill="var(--ink-faint)">
              {T.stream}
            </text>
          )}

          {/* the window: a dashed outline around the whole stream */}
          {mode === "window" && (
            <g>
              <rect x={win.x} y={win.y} width={win.w} height={win.h} fill="none"
                stroke="var(--rule-strong)" strokeWidth="1" strokeDasharray="4 4" />
              <text x={win.x} y={win.y + win.h + 18} className="font-mono" fontSize={fsTiny * k}
                letterSpacing="1" fill="var(--ink-muted)">
                {T.windowTitle}
              </text>
            </g>
          )}

          {/* the stream */}
          {Array.from({ length: N }, (_, i) => {
            const x = cardX(i);
            const y = cardY(i);
            if (i >= arrived) {
              return (
                <rect key={i} x={x} y={y} width={card.w} height={card.h} fill="none"
                  stroke="var(--rule)" strokeWidth="1" strokeDasharray="3 4" />
              );
            }
            const faint = mode === "summary" && dropped(i);
            const hot = asked && i === need && (mode === "window" || faint);
            return (
              <motion.g key={i} initial={fade} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                {factCard(i, x, y, card.w, card.h, faint, hot)}
              </motion.g>
            );
          })}

          {/* the question, last in the stream */}
          {asked ? (
            <motion.g initial={fade} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <rect x={qBox.x} y={qBox.y} width={qBox.w} height={qBox.h} fill="var(--paper)"
                stroke="var(--ink)" strokeWidth="1.2" />
              <text x={qBox.x + qBox.w / 2} y={qBox.y + qBox.h / 2 + fs * 0.36} textAnchor="middle"
                className="font-mono" fontSize={fs} fill="var(--ink)">
                {T.questions[q]}
              </text>
            </motion.g>
          ) : (
            <g>
              <rect x={qBox.x} y={qBox.y} width={qBox.w} height={qBox.h} fill="none"
                stroke="var(--rule-strong)" strokeWidth="1" strokeDasharray="3 4" />
              <text x={qBox.x + qBox.w / 2} y={qBox.y + qBox.h / 2 + fsTiny * 0.36} textAnchor="middle"
                className="font-mono" fontSize={fsTiny * k} fill="var(--ink-faint)">
                {T.questionSoon}
              </text>
            </g>
          )}

          {/* summary mode: the box with three slots */}
          {mode === "summary" && (
            <g>
              <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="var(--paper-sunk)"
                stroke="var(--rule-strong)" strokeWidth="1" />
              <text x={box.x + 12} y={box.y + 18} className="font-mono" fontSize={fsTiny * k}
                letterSpacing="1" fill="var(--ink-muted)">
                {T.summaryTitle}
              </text>
              <text x={compact ? box.x + 12 : box.x + box.w - 12} y={compact ? box.y + box.h - 12 : box.y + 18}
                textAnchor={compact ? "start" : "end"} className="font-mono" fontSize={fsTiny * k}
                letterSpacing="1" fill="var(--ink-faint)">
                {T.rule}
              </text>
              {Array.from({ length: ROOM }, (_, s) => {
                const x = slot.x0 + s * slot.pitch;
                /* fact i lives in slot i mod 3, so the newest lands on the oldest */
                const held = [...Array(arrived).keys()].filter((i) => i % ROOM === s).pop();
                if (held === undefined || !kept(held)) {
                  return (
                    <rect key={s} x={x} y={slot.y} width={slot.w} height={slot.h} fill="none"
                      stroke="var(--rule-strong)" strokeWidth="1" strokeDasharray="3 4" />
                  );
                }
                return (
                  <motion.g key={`${s}-${held}`} initial={fade} animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}>
                    {factCard(held, x, slot.y, slot.w, slot.h, false, asked && held === need)}
                  </motion.g>
                );
              })}
              {/* the question is put to the summary */}
              {asked && (compact ? (
                <line x1={qBox.x + qBox.w / 2} y1={qBox.y + qBox.h} x2={qBox.x + qBox.w / 2} y2={box.y - 4}
                  stroke="var(--ink-muted)" strokeWidth="1.2" markerEnd="url(#kolb-ar-ink)" />
              ) : (
                <path d={`M ${qBox.x + qBox.w / 2} ${qBox.y + qBox.h} V ${box.y + box.h / 2} H ${box.x + box.w + 6}`}
                  fill="none" stroke="var(--ink-muted)" strokeWidth="1.2" markerEnd="url(#kolb-ar-ink)" />
              ))}
            </g>
          )}

          {/* window mode: look back from the question to the card */}
          {mode === "window" && asked && (
            <g>
              {compact ? (
                cardY(need) > card.y ? (
                  <line x1={cx(need)} y1={qBox.y} x2={cx(need)} y2={cardY(need) + card.h + 6}
                    stroke="var(--imagine)" strokeWidth="1.4" markerEnd="url(#kolb-ar)" />
                ) : (
                  <path d={`M ${qBox.x} ${qBox.y + qBox.h / 2} H 5 V 7 H ${cx(need)} V ${card.y - 6}`}
                    fill="none" stroke="var(--imagine)" strokeWidth="1.4" markerEnd="url(#kolb-ar)" />
                )
              ) : (
                <path
                  d={`M ${qBox.x + qBox.w / 2} ${qBox.y + qBox.h} V 150 H ${cx(need)} V ${card.y + card.h + 6}`}
                  fill="none" stroke="var(--imagine)" strokeWidth="1.4" markerEnd="url(#kolb-ar)" />
              )}
              <text
                x={compact ? (cardY(need) > card.y ? cx(need) - 8 : qBox.x + qBox.w) : (qBox.x + qBox.w / 2 + cx(need)) / 2}
                y={compact ? qBox.y - 6 : 144}
                textAnchor={compact ? "end" : "middle"} className="font-mono" fontSize={fsTiny * k}
                letterSpacing="1" fill="var(--imagine)">
                {T.lookBack}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-center gap-2">
          {(["summary", "window"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}
              className={`border px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] transition-colors ${
                mode === m
                  ? "border-imagine bg-imagine text-paper"
                  : "border-rule-strong bg-paper text-ink-muted hover:border-ink hover:text-ink"
              }`}>
              {m === "summary" ? T.modeSummary : T.modeWindow}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="label">{T.question}</span>
          {T.questions.map((label, i) => (
            <button key={i} type="button" aria-pressed={q === i} onClick={() => setQ(i)}
              className={`border px-3 py-1.5 font-mono text-[0.7rem] tracking-[0.02em] transition-colors ${
                q === i
                  ? "border-imagine bg-imagine text-paper"
                  : "border-rule-strong bg-paper text-ink-muted hover:border-ink hover:text-ink"
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={advance} disabled={asked || running}
            className="label h-9 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-60">
            {T.step}
          </button>
          <button type="button" onClick={play} disabled={running}
            className="label h-9 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-60">
            {asked ? T.reset : T.play}
          </button>
        </div>

        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        {[
          [T.kept, mode === "summary" ? T.keptSummary : T.keptWindow],
          [T.work, mode === "summary" ? T.workSummary : T.workWindow],
        ].map(([a, b]) => (
          <div key={a} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{a}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
