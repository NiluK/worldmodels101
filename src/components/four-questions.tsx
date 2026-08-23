"use client";

import { useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText } from "@/lib/locale-text";

/**
 * Four questions, put to three made-up launch posts.
 *
 * The reader picks a post and presses each question. Where the post answers
 * it, the words that answer it light up; where it does not, the button says so
 * and the counter does not move. The most exciting post answers the fewest.
 * Everything here is invented and the small print says so.
 */

const QUESTIONS = ["output", "actions", "horizon", "measure"] as const;
type Q = (typeof QUESTIONS)[number];

/** full: answered. partial: the words are there but the question is not. none: not stated. */
type Answer = { span: number | null; status: "full" | "partial" | "none"; note?: string };

type Post = {
  name: string;
  spans: string[];
  answers: Record<Q, Answer>;
  verdict: string;
};

type Text = {
  question: Record<Q, string>;
  posts: Post[];
  madeUp: string;
  smallPrint: string;
  post: string;
  partly: string;
  notStated: string;
  answered: string;
  ofFour: (n: number) => string;
  note: string;
  pressOne: string;
  pressEach: string;
  ariaCard: (name: string) => string;
};

const TEXT: Record<string, Text> = {
  en: {
    question: {
      output: "What does it output?",
      actions: "Can you roll it forward under actions nobody took?",
      horizon: "Over what horizon does it hold up, and who measured that?",
      measure: "Which measure is the claim using, and what does it ignore?",
    },
    posts: [
      {
        name: "Orrery",
        spans: [
          "Orrery generates ",
          "minutes",
          " of coherent, ",
          "explorable video",
          " from a single prompt. ",
          "Walk anywhere",
          " and the world stays with you. Better than anything we have shipped.",
        ],
        answers: {
          output: { span: 3, status: "full", note: "pictures" },
          actions: { span: 5, status: "partial", note: "implied, not stated as a test" },
          horizon: { span: 1, status: "partial", note: "by whom: not stated" },
          measure: { span: null, status: "none", note: "\"better\", with no measure named" },
        },
        verdict: "One of four. This is a demo, and the caption told you so.",
      },
      {
        name: "Ledger",
        spans: [
          "Ledger predicts a ",
          "64-number latent state",
          " from camera frames and a robot's ",
          "commanded joint torques",
          ". On our held-out tasks, planning inside it stays useful for ",
          "about 12 steps before replanning",
          ", measured by ",
          "task success against a ground-truth simulator",
          ".",
        ],
        answers: {
          output: { span: 1, status: "full", note: "a compact state" },
          actions: { span: 3, status: "full", note: "the commands are named" },
          horizon: { span: 5, status: "full", note: "by whom: the team, by task success against a ground-truth simulator" },
          measure: { span: 7, status: "full", note: "what it ignores: a good policy can hide a bad model" },
        },
        verdict: "Four of four. You can decide whether to build on it.",
      },
      {
        name: "Quarry",
        spans: [
          "Quarry exports a ",
          "textured mesh with collision geometry",
          " from one photo, and scored top of ",
          "a public geometry benchmark",
          ".",
        ],
        answers: {
          output: { span: 1, status: "full", note: "a structure" },
          actions: { span: null, status: "none", note: "nothing is rolled forward" },
          horizon: { span: null, status: "none", note: "not applicable to a static export, and the post does not claim one" },
          measure: { span: 3, status: "full", note: "what it ignores: anything that moves" },
        },
        verdict: "Two of four, and the two it skips do not apply to a static export. Ask them anyway.",
      },
    ],
    madeUp: "(made up)",
    smallPrint: "The posts and systems are made up.",
    post: "Post",
    partly: "partly",
    notStated: "not stated",
    answered: "Answered",
    ofFour: (n) => `${n} of 4`,
    note: "Note",
    pressOne: "Press a question.",
    pressEach: "Press each question.",
    ariaCard: (name) => `A made-up launch post for a system called ${name}.`,
  },
  zh: {
    question: {
      output: "它输出什么？",
      actions: "能不能在没人做过的动作下把它往前推演？",
      horizon: "它能在多长的时间跨度上站得住，又是谁测的？",
      measure: "这个说法用的是哪种度量，又忽略了什么？",
    },
    posts: [
      {
        name: "Orrery",
        spans: [
          "Orrery 只需一句提示，就能生成",
          "数分钟",
          "连贯的",
          "可探索视频",
          "。",
          "随便往哪里走",
          "，世界都跟着你。比我们发布过的任何东西都好。",
        ],
        answers: {
          output: { span: 3, status: "full", note: "图片" },
          actions: { span: 5, status: "partial", note: "有所暗示，但没有说是测过的" },
          horizon: { span: 1, status: "partial", note: "谁测的：没有说" },
          measure: { span: null, status: "none", note: "只说「更好」，没有点名任何度量" },
        },
        verdict: "四问答一。这是一个演示，说明文字也这么告诉你了。",
      },
      {
        name: "Ledger",
        spans: [
          "Ledger 从相机画面和机器人的",
          "指令关节力矩",
          "预测出一个",
          "64 个数的潜在状态",
          "。在我们的留出任务上，在它内部做规划",
          "大约能用 12 步，然后需要重新规划",
          "，衡量方式是",
          "对照真值模拟器的任务成功率",
          "。",
        ],
        answers: {
          output: { span: 3, status: "full", note: "一个紧凑状态" },
          actions: { span: 1, status: "full", note: "指令被点了名" },
          horizon: { span: 5, status: "full", note: "谁测的：团队自己，用对照真值模拟器的任务成功率" },
          measure: { span: 7, status: "full", note: "它忽略了什么：一个好策略可以掩盖一个坏模型" },
        },
        verdict: "四问全答。你可以自己决定要不要在它上面继续盖。",
      },
      {
        name: "Quarry",
        spans: [
          "Quarry 从一张照片导出",
          "带碰撞几何的贴图网格",
          "，并在",
          "一个公开几何基准",
          "上拿到了第一。",
        ],
        answers: {
          output: { span: 1, status: "full", note: "一种结构" },
          actions: { span: null, status: "none", note: "没有任何东西被往前推演" },
          horizon: { span: null, status: "none", note: "对静态导出不适用，帖子也没有这样声称" },
          measure: { span: 3, status: "full", note: "它忽略了什么：任何会动的东西" },
        },
        verdict: "四问答二，漏掉的两问对静态导出并不适用。还是要问。",
      },
    ],
    madeUp: "（虚构）",
    smallPrint: "这些帖子和系统都是虚构的。",
    post: "帖子",
    partly: "部分",
    notStated: "没有说明",
    answered: "已回答",
    ofFour: (n) => `${n}／4`,
    note: "备注",
    pressOne: "按一个问题。",
    pressEach: "把每个问题都按一遍。",
    ariaCard: (name) => `一篇虚构的发布帖，介绍一个叫 ${name} 的系统。`,
  },
};

const NONE_PRESSED: Record<Q, boolean> = { output: false, actions: false, horizon: false, measure: false };

export function FourQuestions() {
  const locale = useLocale();
  const t = pickText(TEXT, locale);
  const { ref, compact } = useCompact(600);
  const [postIdx, setPostIdx] = useState(0);
  const [pressed, setPressed] = useState<Record<Q, boolean>>(NONE_PRESSED);
  const [active, setActive] = useState<Q | null>(null);

  const post = t.posts[postIdx];
  const answered = QUESTIONS.filter((q) => pressed[q] && post.answers[q].status === "full").length;
  const allPressed = QUESTIONS.every((q) => pressed[q]);
  const activeSpan = active === null ? null : post.answers[active].span;

  const pickPost = (i: number) => {
    setPostIdx(i);
    setPressed(NONE_PRESSED);
    setActive(null);
  };
  const ask = (q: Q) => {
    setPressed((p) => ({ ...p, [q]: true }));
    setActive(q);
  };

  return (
    <div>
      <div ref={ref} className="px-5 pt-6 md:px-8">
        <div className={`grid gap-6 ${compact ? "grid-cols-1" : "grid-cols-2"}`}>
          {/* the post */}
          <div role="group" aria-label={t.ariaCard(post.name)} className="border border-rule bg-paper p-5">
            <p className="text-[1.15rem] leading-tight text-ink">{post.name}</p>
            <p className="label mt-1 !text-[0.6rem]">{t.madeUp}</p>
            <p className="mt-4 text-[0.98rem] leading-relaxed text-ink">
              {post.spans.map((s, i) => {
                const isActive = i === activeSpan;
                const wasAsked = QUESTIONS.some((q) => pressed[q] && post.answers[q].span === i);
                if (isActive) {
                  return (
                    <mark key={i} className="bg-imagine-soft px-0.5 text-ink">{s}</mark>
                  );
                }
                if (wasAsked) {
                  return (
                    <span key={i} className="underline decoration-rule-strong decoration-dotted underline-offset-4">{s}</span>
                  );
                }
                return <span key={i}>{s}</span>;
              })}
            </p>
          </div>

          {/* the four questions */}
          <ol className="flex flex-col gap-2">
            {QUESTIONS.map((q) => {
              const a = post.answers[q];
              const isActive = active === q;
              const was = pressed[q];
              return (
                <li key={q} className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => ask(q)}
                    aria-pressed={isActive}
                    className={`flex w-full items-start gap-3 border px-3 py-2 text-left text-[0.9rem] leading-snug transition-colors ${
                      isActive
                        ? "border-imagine bg-imagine text-paper"
                        : "border-rule-strong bg-paper text-ink hover:border-ink"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-[0.35em] block h-2.5 w-2.5 shrink-0 border ${
                        isActive
                          ? "border-paper bg-paper"
                          : was
                            ? "border-ink bg-ink"
                            : "border-rule-strong"
                      }`}
                    />
                    <span>{t.question[q]}</span>
                  </button>
                  {was && a.status !== "full" && (
                    <span className={`label pl-3 !text-[0.6rem] ${a.status === "none" ? "!text-imagine" : ""}`}>
                      {a.status === "none" ? t.notStated : t.partly}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
        <p className="label mt-4 !text-[0.6rem]">{t.smallPrint}</p>
      </div>

      <div data-print-hide className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <span className="label whitespace-nowrap">{t.post}</span>
          <div className="flex flex-wrap gap-2">
            {t.posts.map((p, i) => (
              <button
                key={p.name}
                type="button"
                onClick={() => pickPost(i)}
                aria-pressed={i === postIdx}
                className={`border px-3 py-1.5 transition-colors ${
                  i === postIdx ? "border-imagine bg-imagine text-paper" : "border-rule-strong bg-paper text-ink hover:border-ink"
                }`}
              >
                <span className={`label !text-[0.6rem] ${i === postIdx ? "!text-paper" : "!text-ink"}`}>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="label !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {allPressed ? post.verdict : t.pressEach}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-[10rem_minmax(0,1fr)]">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t.answered}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{t.ofFour(answered)}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t.note}</p>
          <p className="mt-1 text-[0.98rem] text-ink">
            {active === null ? t.pressOne : (post.answers[active].note ?? "")}
          </p>
        </div>
      </div>
    </div>
  );
}
