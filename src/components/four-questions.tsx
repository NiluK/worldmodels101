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
                    className={`flex w-full items-start gap-3 border px-5 py-2 text-left text-[0.9rem] leading-snug transition-colors ${
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
                className={`border px-5 py-2 transition-colors ${
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
