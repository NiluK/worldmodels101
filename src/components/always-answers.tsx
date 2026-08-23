"use client";

import { useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * The answer arrives whatever you ask, and nothing on it says which case you
 * were in.
 *
 * Three questions: a speed the footage had, one just past it, one nothing like
 * it. The answer card is drawn from one code path for all three, down to the
 * confidence bar, which is a constant. Only the slate ghost underneath, which
 * you would not have at the time, says when the answer was wrong.
 *
 * The switch adds the flag the margin note asks for. It changes nothing about
 * the prediction; it only tells you when not to act on it.
 */

type Q = 0 | 1 | 2;

/** illustrative: speeds, outcomes and the confidence mark are all invented */
const SPEED = [26, 38, 90];
/** where the model says the two balls end up, on a 440 unit track */
const PRED: [number, number][] = [
  [228, 300],
  [232, 318],
  [240, 350],
];
/** where they actually end up */
const ACT: [number, number][] = [
  [228, 300],
  [220, 286],
  [130, 262],
];

const W = 440;
const HQ = 96;
const HA = 128;
const BALL1 = 70;
const BALL2 = 250;
const ROW = 44;
const GHOST = 88;

type Strings = {
  question: string;
  answer: string;
  qName: [string, string, string];
  ask: (v: number) => string;
  worldDoes: string;
  confidence: string;
  banner: string;
  flag: string;
  answerCell: string;
  answerValue: string;
  confCell: string;
  confValue: string;
  warnCell: string;
  warnNone: string;
  warnOut: string;
  verdict: [string, string, string];
  flagLine: string;
  hint: string;
  ariaQ: (v: number) => string;
  ariaA: (name: string, flagged: boolean) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    question: "The question",
    answer: "The answer",
    qName: ["A speed the footage had", "Just past the footage", "Nothing like the footage"],
    ask: (v) => `What happens if it comes in at ${v} m/s`,
    worldDoes: "what the world does",
    confidence: "The model's own confidence",
    banner: "I have never seen anything like this",
    flag: "The system says when it is outside its data",
    answerCell: "The answer",
    answerValue: "Given",
    confCell: "The model's own confidence",
    confValue: "High",
    warnCell: "Warning",
    warnNone: "None",
    warnOut: "Outside my data",
    verdict: [
      "Inside the footage, and it is right. Nothing on the card tells you that.",
      "A little past the footage and a little wrong. The card looks exactly the same.",
      "Nothing like the footage, and the answer is wrong. Same card, same confidence, no warning.",
    ],
    flagLine:
      "With the flag on you would have known not to act on this. Nobody is rewarded for building the flag.",
    hint: "Three questions. Left and right arrow keys change the question.",
    ariaQ: (v) => `Two balls, one coming in at ${v} metres per second towards the other.`,
    ariaA: (name, flagged) =>
      `The model's answer to ${name.toLowerCase()}, drawn in vermilion, with what the world does in slate underneath. ${
        flagged ? "A warning says the question is outside the training data." : "There is no warning."
      }`,
  },
  zh: {
    question: "问题",
    answer: "答案",
    qName: ["素材里出现过的速度", "刚刚越过素材的速度", "和素材毫不相干的速度"],
    ask: (v) => `如果它以 ${v} 米每秒撞过来，会怎么样`,
    worldDoes: "世界实际做的事",
    confidence: "模型自称的把握",
    banner: "这样的东西我从没见过",
    flag: "系统会说出自己何时越出了数据",
    answerCell: "答案",
    answerValue: "已给出",
    confCell: "模型自称的把握",
    confValue: "很高",
    warnCell: "警告",
    warnNone: "没有",
    warnOut: "越出了我的数据",
    verdict: [
      "在素材之内，答得也对。卡片上没有任何东西告诉你这一点。",
      "刚越过素材一点点，也就错了一点点。卡片看上去一模一样。",
      "和素材毫不相干，答案是错的。同样的卡片，同样的把握，没有警告。",
    ],
    flagLine: "旗标打开时，你就会知道别按这个答案去行动。可是没有人会因为做出这个旗标而得到奖励。",
    hint: "三个问题。左右方向键可以切换。",
    ariaQ: (v) => `两个球，其中一个以每秒 ${v} 米的速度撞向另一个。`,
    ariaA: (name, flagged) =>
      `模型对「${name}」的回答，用朱红画出，下方用青灰画出世界实际做的事。${
        flagged ? "一条警告说这个问题越出了训练数据。" : "没有任何警告。"
      }`,
  },
};

function Ball({
  x,
  y,
  r,
  stroke,
  fill,
}: {
  x: number;
  y: number;
  r: number;
  stroke: string;
  fill: string;
}) {
  return <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth="1.6" />;
}

/** a short arrow from x to x + dx, pointing the way the ball went */
function Arrow({ x, y, dx, colour }: { x: number; y: number; dx: number; colour: string }) {
  const end = x + dx;
  const head = dx > 0 ? -5 : 5;
  return (
    <g stroke={colour} fill="none" strokeWidth="1.4">
      <line x1={x} y1={y} x2={end} y2={y} />
      <path d={`M ${end} ${y} L ${end + head} ${y - 3.5} M ${end} ${y} L ${end + head} ${y + 3.5}`} />
    </g>
  );
}

export function AlwaysAnswers() {
  const locale = useLocale();
  const s = pickText(TEXT, locale);
  const { ref, compact } = useCompact(620);
  const k = compact ? 1.5 : 1;
  const [q, setQ] = useState<Q>(0);
  const [flag, setFlag] = useState(false);

  const flagged = flag && q > 0;
  const [p1, p2] = PRED[q];
  const [a1, a2] = ACT[q];
  const speed = SPEED[q];
  const arrow = Math.min(60, 18 + speed * 0.5);

  const step = (delta: number) => setQ((prev) => (((prev + delta + 3) % 3) as Q));

  const cardHead = (title: string, note?: string) => (
    <div className="flex items-baseline gap-3 border-b border-rule px-4 py-2">
      <span className="label">{title}</span>
      {note ? <span className="label !normal-case !tracking-normal">{note}</span> : null}
    </div>
  );

  return (
    <div>
      <div
        ref={ref}
        tabIndex={0}
        role="group"
        aria-label={s.hint}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            step(1);
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            step(-1);
          }
        }}
        className={`grid items-stretch gap-3 px-4 pt-6 pb-2 md:px-8 ${
          compact ? "grid-cols-1" : "grid-cols-[1fr_auto_1fr]"
        }`}
      >
        <div className="flex min-w-0 flex-col border border-rule bg-paper">
          {cardHead(s.question)}
          <svg
            viewBox={`0 0 ${W} ${HQ}`}
            className="block w-full"
            role="img"
            aria-label={s.ariaQ(speed)}
          >
            <line
              x1={12}
              y1={ROW + 26}
              x2={W - 12}
              y2={ROW + 26}
              stroke="var(--rule-strong)"
              strokeWidth="1"
            />
            <Arrow x={BALL1 - arrow} y={ROW} dx={arrow - 22} colour="var(--actual)" />
            <Ball x={BALL1} y={ROW} r={16} stroke="var(--ink)" fill="var(--paper)" />
            <Ball x={BALL2} y={ROW} r={16} stroke="var(--ink)" fill="var(--paper)" />
          </svg>

          {/* the question in words, outside the drawing so it never scales away */}
          <p className="label mt-auto border-t border-rule px-4 py-3 !normal-case !tracking-normal">
            <span className="tnum">{s.ask(speed)}</span>
          </p>
        </div>

        <div className="flex items-center justify-center" aria-hidden="true">
          <svg
            viewBox="0 0 34 34"
            className={compact ? "h-6 w-6 rotate-90" : "h-6 w-6"}
            fill="none"
            stroke="var(--rule-strong)"
            strokeWidth="1.2"
          >
            <line x1="2" y1="17" x2="30" y2="17" />
            <path d="M30 17 L24 13 M30 17 L24 21" />
          </svg>
        </div>

        <div className="flex min-w-0 flex-col border border-rule bg-paper">
          {flagged ? (
            <p className="label border-b border-rule bg-paper-sunk px-4 py-2 !normal-case !tracking-normal">
              {s.banner}
            </p>
          ) : null}
          {cardHead(s.answer)}
          <svg
            viewBox={`0 0 ${W} ${HA}`}
            className="block w-full"
            role="img"
            aria-label={s.ariaA(s.qName[q], flagged)}
          >
            {/* what the model says happens */}
            <Ball x={p1} y={ROW} r={16} stroke="var(--imagine)" fill="var(--paper)" />
            <Ball x={p2} y={ROW} r={16} stroke="var(--imagine)" fill="var(--paper)" />
            <Arrow x={p1 + 19} y={ROW} dx={16} colour="var(--imagine)" />
            <Arrow x={p2 + 19} y={ROW} dx={26} colour="var(--imagine)" />

            {/* what actually happens, small, slate, and directly underneath */}
            <line
              x1={p1}
              y1={ROW + 18}
              x2={a1}
              y2={GHOST - 11}
              stroke="var(--rule)"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
            <line
              x1={p2}
              y1={ROW + 18}
              x2={a2}
              y2={GHOST - 11}
              stroke="var(--rule)"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
            <Ball x={a1} y={GHOST} r={10} stroke="var(--actual)" fill="var(--actual-soft)" />
            <Ball x={a2} y={GHOST} r={10} stroke="var(--actual)" fill="var(--actual-soft)" />
            <text
              x={12}
              y={HA - 8}
              className="font-mono"
              fontSize={11 * k}
              fill="var(--actual)"
            >
              {s.worldDoes}
            </text>
          </svg>

          {/* the constant that carries the point: the same bar every time */}
          <div className="mt-auto border-t border-rule px-4 py-3">
            <p className="label !normal-case !tracking-normal">{s.confidence}</p>
            <div className="mt-2 h-[6px] w-full bg-rule">
              <div className="h-full w-[72%] bg-imagine" />
            </div>
          </div>
        </div>
      </div>

      <div
        data-print-hide
        className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8"
      >
        <div className="flex flex-wrap gap-2">
          {s.qName.map((name, i) => {
            const on = q === i;
            return (
              <button
                key={name}
                type="button"
                aria-pressed={on}
                onClick={() => setQ(i as Q)}
                className={`border px-3 py-1.5 transition-colors ${
                  on
                    ? "border-imagine bg-imagine text-paper"
                    : "border-rule-strong bg-paper text-ink hover:border-ink"
                }`}
              >
                <span className={`label !text-[0.62rem] ${on ? "!text-paper" : "!text-ink"}`}>
                  {name}
                </span>
              </button>
            );
          })}
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <span className="label">{s.flag}</span>
          <button
            type="button"
            role="switch"
            aria-checked={flag}
            onClick={() => setFlag((v) => !v)}
            className={`relative h-6 w-11 border transition-colors ${
              flag ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"
            }`}
          >
            <span
              className={`absolute top-[3px] h-4 w-4 transition-all ${
                flag ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"
              }`}
            />
          </button>
        </label>

        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {s.verdict[q]}
          {flagged ? ` ${s.flagLine}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [s.answerCell, s.answerValue],
          [s.confCell, s.confValue],
          [s.warnCell, flagged ? s.warnOut : s.warnNone],
        ].map(([label, value]) => (
          <div key={label} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{label}</p>
            <p className="mt-1 text-[0.9rem] leading-snug text-ink">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
