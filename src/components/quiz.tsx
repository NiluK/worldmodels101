"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { DEFINITIONS, definitionText } from "@/lib/definitions";
import { useLocale, useT } from "./locale-provider";
import { DefinitionGlyph } from "./definition-glyph";

/**
 * Classification drill for the one skill the chapter claims to teach.
 *
 * Every system here is deliberately NOT one already named in the text, so it
 * tests whether the reader can place something new rather than remember a
 * label. Two of them are traps: the giveaway points at the wrong answer, and
 * the explanation says which cue misled you.
 */

type Classify = { kind: "classify"; stem: string; answer: string; why: string };
type Choice = { kind: "choice"; stem: string; options: string[]; answer: number; why: string };
type Q = Classify | Choice;

/**
 * Two kinds of question, interleaved. The classification items test whether the
 * map transfers to systems the chapter never named; the rest test the ideas the
 * figures were built to teach, which classification alone would miss.
 */
const QUESTIONS_EN: Q[] = [
  {
    kind: "classify",
    stem: "It takes one photo of a kitchen and returns a mesh you can import into a game engine, with collision volumes on the worktops.",
    answer: "simulator",
    why: "Something else can open it and compute against it. Collision volumes are the giveaway: they exist for a physics engine to bump into, not for you to look at.",
  },
  {
    kind: "choice",
    stem: "You are watching a camera feed of a room. There is a chair behind the camera. Where does that chair sit?",
    options: [
      "Outside the state, because nothing can see it",
      "In the state but not the observation",
      "In the observation but not the state",
      "In neither, until the camera turns",
    ],
    answer: 1,
    why: "Turning away does not delete furniture. The chair is part of what is there, just not part of what you can currently see. The gap between those two is where most of the hard problems in this course come from.",
  },
  {
    kind: "classify",
    stem: "You hold a key and it streams video of a city that has never existed, a frame at a time, reacting to which way you steer.",
    answer: "renderer",
    why: "The output is the picture. It may well stay consistent as you drive, but nothing underneath is obliged to, and there is no city to hand anyone.",
  },
  {
    kind: "choice",
    stem: "A system keeps the room consistent when you turn away and turn back. What has that proved?",
    options: [
      "It is storing the room",
      "It is not storing the room",
      "Nothing on its own",
      "It must be a Simulator",
    ],
    answer: 2,
    why: "There are two ways to pass that test, and from the outside they are identical. You can keep the room, or you can be very good at redrawing it. The result is the same, so the result cannot tell you which.",
  },
  {
    kind: "classify",
    stem: "It is trained only to predict the next move in chess games. Researchers later probe it and find it tracks where the pieces are.",
    answer: "implicit",
    why: "Nobody built a chess model here and nobody can run one. The claim is about structure found inside a network trained for something else, which is a claim of a different kind from all the others.",
  },
  {
    kind: "choice",
    stem: "A model is slightly wrong at every step. You feed its own output back in twenty times. What happens to the error?",
    options: [
      "It stays about the same",
      "It roughly doubles",
      "It grows, unevenly, and can end up somewhere else entirely",
      "It cancels out over enough steps",
    ],
    answer: 2,
    why: "Each imagined state becomes the input to the next prediction, so mistakes are built on. Nothing dramatic happens at any single step, which is what makes it hard to catch.",
  },
  {
    kind: "classify",
    stem: "It hides part of a video and learns to predict a summary of the hidden part. Once trained, the predictions are thrown away and the rest is bolted onto a robot.",
    answer: "representation",
    why: "The forecast was scaffolding. What survives training is the way it learned to describe things, which is the product.",
  },
  {
    kind: "choice",
    stem: "Going from predicting one step to predicting H steps, what does NOT get bigger?",
    options: [
      "The stretch of future you are asking for",
      "The number of actions you have to supply",
      "What you are given to start from",
      "The number of ways it can go wrong",
    ],
    answer: 2,
    why: "However far ahead you ask, you are still standing in exactly one place with one observation of it. The question grows; the evidence does not.",
  },
  {
    kind: "classify",
    stem: "Given a compact state, a few numbers describing the scene, and a motor command you are considering, it returns the compact state you would be in next. A search loop calls it a few hundred times per decision.",
    answer: "dynamics",
    why: "It hands you state rather than a picture, and you can roll it forward under actions nobody has taken yet. That is the Dynamics Model's contract, and the search loop is what it is for. Had it returned the next sensor reading instead, you would be looking at a Renderer.",
  },
  {
    kind: "choice",
    stem: "Why does the Kalman filter count as ancestry rather than as one of the five?",
    options: [
      "It is too old to count",
      "Its dynamics are supplied rather than learned, and it never compares actions to choose one",
      "It cannot take a control input at all",
      "It only works on linear systems",
    ],
    answer: 1,
    why: "It does half the job well: work out a hidden state from noisy measurements, and it will even propagate a control input you hand it. What it never does is learn the dynamics or weigh one action against another, and those are what make the rest of these useful for choosing. Linearity is a detail of the original, not the reason.",
  },
  {
    kind: "choice",
    stem: "One era in the history removed a part instead of adding one. Which, and why?",
    options: [
      "The encoder, because pixels stopped mattering",
      "The decoder, because the prediction target moved off the pixels",
      "The controller, because planning was abandoned",
      "The dynamics, because they became implicit",
    ],
    answer: 1,
    why: "JEPA predicts a summary of the next frame rather than the frame, so nothing needs to turn the prediction back into pixels. That is the same reason the forecast can be discarded and the features kept.",
  },
  {
    kind: "classify",
    stem: "A lab generates photorealistic video of motorway driving to train a self-driving stack. It is marketed for robotics.",
    answer: "renderer",
    why: "This is the trap. Being aimed at robots suggests a Simulator, but the output is still video, with no geometry anyone can collide against. What a system is for is a weaker clue than what it hands you. Even that is not a complete answer, because a large platform can ship several interfaces, so the question is which one you are about to build against.",
  },
  {
    kind: "choice",
    stem: "A lab reports its system stays coherent for several minutes. You cannot run it yourself. How should that sit in your notes?",
    options: [
      "As a fact, since they built it",
      "As reported, not checked",
      "As false until proven",
      "As irrelevant to the category",
    ],
    answer: 1,
    why: "This is not scepticism for its own sake. Some claims you can open and verify, like a mesh you can load; others you can only receive. Knowing which is which is part of reading this field.",
  },
];

/**
 * One place to look up a question set, so adding a chapter is a row rather than
 * another layer of nested ternary. Resolved inside the function because the
 * question arrays are declared further down the file, and a module-level map
 * would reference them before they exist.
 *
 * Falling back to English is deliberate: a chapter whose translation has not
 * landed should still show its own questions rather than another chapter's.
 */
function questionsFor(chapter: number, locale: string): Q[] {
  const sets: Record<number, { en: Q[]; zh?: Q[] }> = {
    1: { en: QUESTIONS_EN, zh: QUESTIONS_ZH },
    2: { en: QUESTIONS_CH2, zh: QUESTIONS_CH2_ZH },
    3: { en: QUESTIONS_CH3, zh: QUESTIONS_CH3_ZH },
    4: { en: QUESTIONS_CH4, zh: QUESTIONS_CH4_ZH },
    5: { en: QUESTIONS_CH5, zh: QUESTIONS_CH5_ZH },
    6: { en: QUESTIONS_CH6, zh: QUESTIONS_CH6_ZH },
    7: { en: QUESTIONS_CH7, zh: QUESTIONS_CH7_ZH },
    8: { en: QUESTIONS_CH8, zh: QUESTIONS_CH8_ZH },
    9: { en: QUESTIONS_CH9, zh: QUESTIONS_CH9_ZH },
  };
  const set = sets[chapter] ?? sets[1];
  const questions = (locale === "zh" && set.zh) || set.en;
  return chapter >= 5 ? rotateLaterChoices(questions, chapter) : questions;
}

/** Keep readers from learning that the second option is usually right. */
const CHOICE_ROTATIONS: Record<number, number[]> = {
  5: [0, 2, 3, 1, 3, 2, 3, 0],
  6: [1, 3, 2, 0, 1, 3, 2, 0],
  7: [2, 2, 0, 1, 3, 2, 0, 1],
  8: [2, 2, 1, 0, 2, 3, 1, 0],
  9: [3, 1, 2, 0, 3, 1, 2, 0],
};

function rotateLaterChoices(questions: Q[], chapter: number): Q[] {
  const rotations = CHOICE_ROTATIONS[chapter] ?? [];
  return questions.map((question, index) => {
    if (question.kind !== "choice") return question;
    const shift = (rotations[index] ?? 0) % question.options.length;
    if (shift === 0) return question;
    return {
      ...question,
      options: [...question.options.slice(-shift), ...question.options.slice(0, -shift)],
      answer: (question.answer + shift) % question.options.length,
    };
  });
}

function QuizInteractive({ chapter }: { chapter: number }) {
  const locale = useLocale();
  const t = useT();
  const QUESTIONS = questionsFor(chapter, locale);
  const still = useReducedMotion();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = QUESTIONS[i];
  const revealed = picked !== null;
  const right = picked === q.answer;

  function choose(id: string | number) {
    if (revealed) return;
    setPicked(id);
    if (id === q.answer) setScore((s) => s + 1);
  }

  function next() {
    if (i + 1 >= QUESTIONS.length) setDone(true);
    else {
      setI(i + 1);
      setPicked(null);
    }
  }

  function restart() {
    setI(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }

  if (done) {
    return (
      <div className="px-5 py-12 text-center md:px-8">
        <p className="label">{t("quiz.scored")}</p>
        <p className="display mt-3 text-[clamp(3rem,9vw,5rem)] leading-none tnum">
          {score}<span className="text-ink-faint">/{QUESTIONS.length}</span>
        </p>
        <p className="mx-auto mt-6 max-w-[46ch] text-[1rem] leading-relaxed text-ink-muted">
          {t(
            `quiz.verdict.ch${chapter >= 1 && chapter <= 9 ? chapter : 1}.${
              score === QUESTIONS.length ? "all" : score >= QUESTIONS.length - 3 ? "most" : "few"
            }`,
          )}
        </p>
        <button
          onClick={restart}
          className="mt-8 border border-ink bg-ink px-5 py-2.5 text-paper transition-colors hover:border-imagine hover:bg-imagine"
        >
          <span className="label !text-paper">{t("quiz.again")}</span>
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 border-b border-rule px-5 py-3 md:px-8">
        <span className="label tnum">
          {t("quiz.of", { i: i + 1, n: QUESTIONS.length })}
        </span>
        <span aria-hidden className="flex flex-1 gap-1">
          {QUESTIONS.map((_, n) => (
            <span
              key={n}
              className={`h-1 flex-1 ${n < i ? "bg-imagine" : n === i ? "bg-ink" : "bg-rule"}`}
            />
          ))}
        </span>
        <span className="label tnum">{t("quiz.score", { n: score })}</span>
      </div>

      <div className="px-5 py-7 md:px-8">
        <p className="max-w-[58ch] text-[1.12rem] leading-relaxed text-ink">{q.stem}</p>
        <p className="label mt-5">
          {q.kind === "classify" ? t("quiz.which") : t("quiz.pick")}
        </p>

        {q.kind === "classify" ? (
          <div className="mt-3 grid grid-cols-1 gap-px bg-rule sm:grid-cols-2 lg:grid-cols-5">
            {DEFINITIONS.map((d) => {
              const isAnswer = d.id === q.answer;
              const isPick = d.id === picked;
              const mark = revealed && isAnswer ? "correct" : revealed && isPick ? "wrong" : null;
              return (
                <button
                  key={d.id}
                  onClick={() => choose(d.id)}
                  disabled={revealed}
                  aria-pressed={isPick}
                  className={`flex items-start gap-3 p-3 text-left transition-colors sm:flex-col sm:gap-2 ${
                    mark === "correct"
                      ? "bg-actual-soft"
                      : mark === "wrong"
                        ? "bg-imagine-soft"
                        : "bg-paper-raised hover:bg-paper disabled:hover:bg-paper-raised"
                  }`}
                >
                  <DefinitionGlyph definition={d.id} size={26} className="shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-[0.98rem] leading-tight">{definitionText(locale, d.id).name}</span>
                    {mark && (
                      <span
                        className={`label mt-1 block !text-[0.58rem] ${
                          mark === "correct" ? "!text-actual" : "!text-imagine-on-soft"
                        }`}
                      >
                        {mark === "correct" ? t("quiz.correct") : t("quiz.yours")}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-px bg-rule">
            {q.options.map((opt, n) => {
              const isAnswer = n === q.answer;
              const isPick = n === picked;
              const mark = revealed && isAnswer ? "correct" : revealed && isPick ? "wrong" : null;
              return (
                <button
                  key={opt}
                  onClick={() => choose(n)}
                  disabled={revealed}
                  aria-pressed={isPick}
                  className={`flex items-baseline gap-3 px-4 py-3 text-left transition-colors ${
                    mark === "correct"
                      ? "bg-actual-soft"
                      : mark === "wrong"
                        ? "bg-imagine-soft"
                        : "bg-paper-raised hover:bg-paper disabled:hover:bg-paper-raised"
                  }`}
                >
                  {/* --ink-muted drops to ~4.2:1 once a row is tinted */}
                  <span
                    className={`label shrink-0 !text-[0.62rem] ${mark ? "!text-ink" : ""}`}
                  >
                    {String.fromCharCode(97 + n)}
                  </span>
                  <span className="flex-1 text-[0.98rem] leading-snug">{opt}</span>
                  {mark && (
                    <span
                      className={`label shrink-0 !text-[0.58rem] ${
                        mark === "correct" ? "!text-actual" : "!text-imagine-on-soft"
                      }`}
                    >
                      {mark === "correct" ? t("quiz.correct") : t("quiz.yoursShort")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          {revealed && (
            <motion.div
              key={i}
              initial={still ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="mt-6 border-l-2 pl-4"
              style={{ borderColor: right ? "var(--actual)" : "var(--imagine)" }}
            >
              <p className="label" style={{ color: right ? "var(--actual)" : "var(--imagine)" }}>
                {right ? t("quiz.right") : t("quiz.wrong")}
              </p>
              <p className="mt-2 max-w-[58ch] text-[0.98rem] leading-relaxed text-ink-muted">
                {q.why}
              </p>
              <button
                onClick={next}
                className="mt-5 border border-ink bg-ink px-5 py-2 text-paper transition-colors hover:border-imagine hover:bg-imagine"
              >
                <span className="label !text-paper">
                  {i + 1 >= QUESTIONS.length ? t("quiz.seeScore") : t("quiz.next")}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


/**
 * The printed form. Buttons and a running score mean nothing on paper, so the
 * whole set is laid out with its answers, which is what a reader can actually
 * use away from the screen.
 */
function QuizPrinted({ chapter }: { chapter: number }) {
  const locale = useLocale();
  const t = useT();
  const QUESTIONS = questionsFor(chapter, locale);
  return (
    <ol className="px-5 py-6 md:px-8">
      {QUESTIONS.map((q, n) => {
        const answer =
          q.kind === "classify"
            ? definitionText(locale, q.answer).name
            : `${String.fromCharCode(97 + q.answer)}. ${q.options[q.answer]}`;
        return (
          <li key={q.stem} className="mb-7 last:mb-0">
            <p className="text-[1rem] leading-relaxed">
              <span className="label mr-2 !text-[0.62rem]">{n + 1}</span>
              {q.stem}
            </p>

            {q.kind === "choice" ? (
              <ul className="mt-2 ml-6 list-none">
                {q.options.map((opt, i) => (
                  <li key={opt} className="text-[0.92rem] leading-snug text-ink-muted">
                    <span className="font-mono text-[0.75rem]">
                      {String.fromCharCode(97 + i)}.
                    </span>{" "}
                    {opt}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 ml-6 font-mono text-[0.75rem] text-ink-muted">
                {DEFINITIONS.map((d) => definitionText(locale, d.id).name).join(" · ")}
              </p>
            )}

            <p className="mt-2 ml-6 border-l-2 border-actual pl-3 text-[0.9rem] leading-relaxed text-ink-muted">
              <span className="label !text-actual">{t("quiz.answer")}</span> {answer}. {q.why}
            </p>
          </li>
        );
      })}
    </ol>
  );
}


/** Same thirteen items in Simplified Chinese, in the same order. */
const QUESTIONS_ZH: Q[] = [
  {
    kind: "classify",
    stem: "它接收一张厨房的照片，输出一个可以导入游戏引擎的网格，台面上还带有碰撞体。",
    answer: "simulator",
    why: "别的程序可以打开它并对它做计算。碰撞体就是关键线索：它们存在是为了让物理引擎去碰撞，而不是为了给你看。",
  },
  {
    kind: "choice",
    stem: "你正在看一个房间的摄像头画面。摄像头背后有一把椅子。这把椅子在哪里？",
    options: [
      "不在状态里，因为没有任何东西看得见它",
      "在状态里，但不在观测里",
      "在观测里，但不在状态里",
      "两者都不在，直到摄像头转过去",
    ],
    answer: 1,
    why: "转过身并不会让家具消失。椅子是存在的东西的一部分，只是不属于你此刻能看到的部分。这门课里大多数难题，都来自这两者之间的那道缝隙。",
  },
  {
    kind: "classify",
    stem: "你按住一个键，它就一帧一帧地生成一座从未存在过的城市的视频，并根据你转向的方向作出反应。",
    answer: "renderer",
    why: "它的输出就是画面。开车过程中画面也许一直保持一致，但底下没有任何东西必须如此，也没有一座城市可以交给别人。",
  },
  {
    kind: "choice",
    stem: "你转过身再转回来，某个系统让房间保持了原样。这证明了什么？",
    options: [
      "它把房间存了下来",
      "它没有把房间存下来",
      "单凭这一点什么也证明不了",
      "它一定是仿真器",
    ],
    answer: 2,
    why: "通过这个测试有两条路，而从外面看它们一模一样。你可以把房间保存下来，也可以把它重画得非常准。结果相同，所以结果本身没法告诉你是哪一条。",
  },
  {
    kind: "classify",
    stem: "它只被训练来预测国际象棋对局中的下一步棋。研究者后来用探针检查，发现它在内部记录了棋子的位置。",
    answer: "implicit",
    why: "这里没有人造出一个下棋模型，也没有人能运行一个。这个断言讲的是在为别的任务训练出来的网络内部发现了什么结构，和其他几种断言在性质上就不同。",
  },
  {
    kind: "choice",
    stem: "一个模型每一步都稍微错一点。你把它自己的输出重新喂回去二十次。误差会怎样？",
    options: [
      "基本保持不变",
      "大约翻一倍",
      "会增长，而且不均匀，最后可能到完全不同的地方",
      "步数够多以后会互相抵消",
    ],
    answer: 2,
    why: "每一个想象出来的状态都会成为下一次预测的输入，于是错误被叠在错误上面。任何单独一步都没有出什么大事，这就是它难以察觉的原因。",
  },
  {
    kind: "classify",
    stem: "它遮住视频的一部分，学着预测被遮住那部分的一个摘要。训练完成后，预测被丢掉，剩下的部分被装到一个机器人上。",
    answer: "representation",
    why: "那个预测只是脚手架。训练结束后留下来的，是它学会的描述事物的方式，那才是产物。",
  },
  {
    kind: "choice",
    stem: "从预测一步变成预测 H 步，什么东西没有变大？",
    options: [
      "你要问的那一段未来",
      "你必须提供的动作数量",
      "你出发时手里已有的东西",
      "可能出错的方式的数量",
    ],
    answer: 2,
    why: "无论你问多远，你仍然只站在一个地方，只有关于它的一次观测。问题变大了，证据没有。",
  },
  {
    kind: "classify",
    stem: "给定一个紧凑状态（几个描述场景的数字）和一个你正在考虑的电机指令，它返回你接下来会处于的紧凑状态。一个搜索循环每做一次决定要调用它几百次。",
    answer: "dynamics",
    why: "它交给你的是状态而不是画面，而且你可以在没人执行过的动作下把它往前推。这正是动力学模型的契约，搜索循环就是它存在的目的。如果它返回的是下一个传感器读数，你看到的就是渲染器。",
  },
  {
    kind: "choice",
    stem: "为什么卡尔曼滤波器算作前身，而不算五种定义中的一种？",
    options: [
      "它太老了，不算数",
      "它的动力学是给定的而不是学出来的，而且它从不比较动作来做选择",
      "它完全不能接受控制输入",
      "它只适用于线性系统",
    ],
    answer: 1,
    why: "它把一半的工作做得很好：从带噪声的测量里算出隐藏状态，你给它一个控制输入，它也会往前推演。它从不做的是学习动力学，或者在两个动作之间权衡，而那正是让其余几种定义能用来做选择的东西。线性只是最初版本的一个细节，不是原因。",
  },
  {
    kind: "choice",
    stem: "历史上有一个阶段是拿掉了一个部件，而不是加上一个。是哪一个，为什么？",
    options: [
      "编码器，因为像素不再重要了",
      "解码器，因为预测目标从像素上移开了",
      "控制器，因为规划被放弃了",
      "动力学，因为它变成隐式的了",
    ],
    answer: 1,
    why: "JEPA 预测的是下一帧的摘要而不是这一帧本身，所以不再需要什么东西把预测变回像素。这也正是预测可以被丢掉、特征却留下来的原因。",
  },
  {
    kind: "classify",
    stem: "某个实验室生成高速公路驾驶的逼真视频，用来训练自动驾驶系统。它的宣传定位是机器人方向。",
    answer: "renderer",
    why: "这就是那个陷阱。面向机器人听起来像仿真器，但它的输出仍然是视频，没有任何人可以撞上去的几何结构。一个系统是给谁用的，是比它交给你什么更弱的线索。就连这条线索也不是完整答案，因为一个大平台可以同时提供好几个接口，所以问题是你即将对着哪一个接口开发。",
  },
  {
    kind: "choice",
    stem: "某个实验室称他们的系统能保持数分钟的一致性。你自己没法运行它。这条信息应该怎么记？",
    options: [
      "当作事实，毕竟是他们造的",
      "当作对方的报告，而不是已经核实过的结论",
      "在被证明之前当作假的",
      "与分类无关，可以忽略",
    ],
    answer: 1,
    why: "这不是为了怀疑而怀疑。有些说法你可以自己打开验证，比如一个能加载的网格；有些你只能接收。分清哪些是哪些，是读这个领域的一部分。",
  },
];


/** Chapter 2: the Dynamics Model in depth. All concept questions; classifying
    is Chapter 1's job and repeating it here would test the wrong thing. */
const QUESTIONS_CH9: Q[] = [
  {
    kind: "choice",
    stem: "Why is one average error insufficient as a long-rollout report?",
    options: [
      "Averages are always misleading",
      "Different properties can fail at different horizons, and an average hides which contract was lost",
      "The error is measured in the wrong units",
      "Rollouts are too short to average over",
    ],
    answer: 1,
    why: "There is no universal failure order. The point is to report separate horizons for identity, physics, control and appearance instead of allowing one strong dimension to conceal another.",
  },
  {
    kind: "choice",
    stem: "A rollout still looks completely fine in any single frame. What does that tell you?",
    options: [
      "It is still usable",
      "Very little. Most of the pixels are surfaces and light, and nothing in a per-frame loss is watching whether objects stayed themselves",
      "The model has learned physics",
      "The horizon has not been reached",
    ],
    answer: 1,
    why: "This is how the subject fools you, and it is why demos are weaker evidence than they feel.",
  },
  {
    kind: "choice",
    stem: "Why is object permanence fragile in a renderer with no exposed object store?",
    options: [
      "The models are too small",
      "Identity is carried implicitly by predictor state rather than enforced by a persistent record",
      "Occlusion is computationally expensive",
      "Training data lacks occluded objects",
    ],
    answer: 1,
    why: "A structured simulator may store objects explicitly. In the renderer case, identity can drift gradually because persistence is an inferred behaviour rather than an inspectable record.",
  },
  {
    kind: "choice",
    stem: "You ask a model what would have happened if you had acted differently. What have you got?",
    options: [
      "A fact about the world",
      "An answer that is true inside the model, with nothing in it indicating whether the model had data there",
      "A proof",
      "Nothing, models cannot answer that",
    ],
    answer: 1,
    why: "Where the model has data the two are close. Where it does not, they are not, and the model answers with equal confidence either way.",
  },
  {
    kind: "choice",
    stem: "Short rollouts, replanning and starting from real states all work. What do they have in common?",
    options: [
      "They make the model more accurate",
      "They are all ways of not needing the model to be right for very long",
      "They only apply to robotics",
      "They remove the need for a policy",
    ],
    answer: 1,
    why: "Read uncharitably, the whole toolkit is an admission. The horizon over which a model holds up is the number that decides what you can build.",
  },
  {
    kind: "choice",
    stem: "Why does downstream task success not settle which model is better?",
    options: [
      "Tasks are too easy",
      "It scores the model and the policy together, so a good policy hides a bad model",
      "It cannot be measured reliably",
      "It only works in simulation",
    ],
    answer: 1,
    why: "It looks like the honest answer and it conflates the two things you were trying to tell apart.",
  },
  {
    kind: "choice",
    stem: "A benchmark winner is best on geometry but mediocre on action fidelity. What is the first thing to ask?",
    options: [
      "How large is it",
      "Which measure, and what does that measure ignore",
      "What hardware it runs on",
      "How long it trained for",
    ],
    answer: 1,
    why: "Benchmarks such as PlayWorld make useful dimensions explicit. They do not remove the need to say which contract matters for the intended use or how competing dimensions were combined.",
  },
  {
    kind: "choice",
    stem: "Across the whole course, which single question does the most work on an unfamiliar system?",
    options: [
      "How many parameters does it have",
      "What does it output, and can you roll it forward under actions nobody took",
      "Is it open source",
      "Does it use a transformer",
    ],
    answer: 1,
    why: "The first half decides what it can be used for. The second decides whether it can support a decision. Almost everything else follows, and neither depends on knowing the architecture.",
  },
];

const QUESTIONS_CH9_ZH: Q[] = [
  {
    kind: "choice",
    stem: "为什么一个平均误差不足以报告长推演？",
    options: ["平均值总是误导人的", "不同性质可能在不同的时程坏掉，而平均值藏住了丢掉的是哪份契约", "误差的单位不对", "推演太短，平均不出来"],
    answer: 1,
    why: "不存在普遍的失败顺序。重点是分别报告身份、物理、控制和外观的时程，不让一个强项遮住另一个弱项。",
  },
  {
    kind: "choice",
    stem: "一段推演单看任何一帧都还完全没问题。这说明了什么？",
    options: ["它还能用", "说明不了多少。大部分像素是表面和光，而逐帧损失里没有任何东西在盯着物体有没有还是它自己", "模型学会了物理", "还没到时程上限"],
    answer: 1,
    why: "这个主题就是这样骗到你的，也是为什么演示作为证据比它给人的感觉要弱。",
  },
  {
    kind: "choice",
    stem: "为什么物体恒存对没有暴露物体存储的渲染器格外脆弱？",
    options: ["模型太小了", "身份由预测器状态隐式携带，而不是由持久记录强制", "遮挡的计算开销很大", "训练数据里缺少被遮挡的物体"],
    answer: 1,
    why: "结构化仿真器可以显式存物体；对渲染器来说，持久性是推断出的行为而不是可检查的记录，所以身份可能逐渐漂掉。",
  },
  {
    kind: "choice",
    stem: "你问模型「如果当时做了别的会怎样」。你拿到的是什么？",
    options: ["一个关于世界的事实", "一个在模型内部为真的答案，而且里面没有任何东西提示模型在那里有没有数据", "一个证明", "什么也没有，模型答不了这种问题"],
    answer: 1,
    why: "在模型有数据的地方两者接近，没数据的地方就不接近，而模型两种情况下都同样自信地作答。",
  },
  {
    kind: "choice",
    stem: "短推演、重新规划、从真实状态出发，这些都管用。它们的共同点是什么？",
    options: ["它们让模型更准", "它们都是「让你不需要模型正确太久」的办法", "它们只适用于机器人", "它们去掉了对策略的需要"],
    answer: 1,
    why: "往刻薄了读，这整套工具就是一句承认。模型能撑住的那段时程，正是决定你能造出什么的那个数字。",
  },
  {
    kind: "choice",
    stem: "为什么下游任务成功率定不了「哪个模型更好」？",
    options: ["任务太简单", "它把模型和策略一起打分，于是一个好策略能盖住一个差模型", "它没法可靠地测量", "它只在模拟里有效"],
    answer: 1,
    why: "它看起来像是那个诚实的答案，而它恰好把你本想分开的那两样东西混在了一起。",
  },
  {
    kind: "choice",
    stem: "一个基准赢家的几何最好，动作保真度却一般。第一句该问什么？",
    options: ["它有多大", "用的是哪个尺度，而那个尺度忽略了什么", "它跑在什么硬件上", "它训练了多久"],
    answer: 1,
    why: "PlayWorld 一类基准会把有用维度分开。它们不会替你决定具体用途重视哪份契约，也不会自动给互相竞争的维度一个合并规则。",
  },
  {
    kind: "choice",
    stem: "面对一个不熟悉的系统，整门课里哪一个问题最顶用？",
    options: ["它有多少参数", "它输出什么，以及你能不能在没人执行过的动作下把它往前推", "它开不开源", "它用不用 transformer"],
    answer: 1,
    why: "前半句决定了它能被用来干什么，后半句决定了它撑不撑得起一个决定。几乎其他一切都由此而来，而这两者都不需要你知道架构。",
  },
];

const QUESTIONS_CH8: Q[] = [
  {
    kind: "choice",
    stem: "What change makes a video model capable of being steered, without proving that it will obey?",
    options: [
      "More parameters",
      "Conditioning each generated frame on an action as well as on the frames before it",
      "Higher resolution",
      "A longer context window",
    ],
    answer: 1,
    why: "Action conditioning supplies the interface. Controllability still has to be tested by varying the action from the same start and measuring whether the requested futures separate.",
  },
  {
    kind: "choice",
    stem: "A generated room stays as you left it when you turn back. What can you conclude about its memory?",
    options: [
      "It must contain exportable geometry",
      "It has no memory of any kind",
      "Some internal state supports persistence, but the behaviour does not reveal whether it is a scene graph, context or another mechanism",
      "It must use a separate object database",
    ],
    answer: 2,
    why: "Behaviour establishes persistence, not implementation. Genie 3 is reported to refer back to its trajectory, while exposing no persistent geometry or object store to inspect.",
  },
  {
    kind: "choice",
    stem: "Dropped objects in generated video accelerate downwards, and nobody supplied gravity. What does that establish?",
    options: [
      "The model has learned the law of gravity",
      "That the regularity is in the training footage, and reproducing it is required to predict the footage well",
      "The model contains a physics engine",
      "Nothing at all",
    ],
    answer: 1,
    why: "The observation is real. The question is whether reproducing a regularity across the range you trained on amounts to having the rule, and the observation alone does not settle it.",
  },
  {
    kind: "choice",
    stem: "In Figure 8.7, the model is within a few per cent across the band it was trained on. Why is that not evidence it has the rule?",
    options: [
      "The measurement is unreliable",
      "Matching inside the band is equally consistent with having learned the answers to the questions it was asked",
      "A few per cent is too large an error",
      "The band was too narrow",
    ],
    answer: 1,
    why: "Having the rule and having a fit through the sampled region only come apart outside the band, and outside is where nobody tests because there is no footage to compare against.",
  },
  {
    kind: "choice",
    stem: "Why is a generated video world the wrong shape for an agent to plan inside?",
    options: [
      "It is not accurate enough",
      "Planning means running the model many times over, and a frame is the opposite of a compact state",
      "It cannot be conditioned on actions",
      "It has no reward signal",
    ],
    answer: 1,
    why: "A planner needs to try many action sequences and score them cheaply. These models are expensive to run and produce frames rather than something small to reason over.",
  },
  {
    kind: "choice",
    stem: "What are generated worlds unambiguously good for right now?",
    options: [
      "Replacing physics engines",
      "Producing training data and being a place you can move around in",
      "Long-horizon planning",
      "Compressing video",
    ],
    answer: 1,
    why: "They avoid real-world contact, reset instantly and produce broad variation, while still costing compute. No other approach in this course gives you an actual picture to walk into.",
  },
  {
    kind: "choice",
    stem: "Why does a wrong answer from one of these systems feel more convincing than a wrong number?",
    options: [
      "The errors are smaller",
      "It arrives as something that looks like a photograph",
      "The models are better calibrated",
      "It usually is not wrong",
    ],
    answer: 1,
    why: "The extrapolation problem here is the ordinary problem with any fitted function. What is different is how persuasive the output is when it fails.",
  },
  {
    kind: "choice",
    stem: "A system improves its geometry score but loses action fidelity. Is it better overall?",
    options: [
      "Yes, geometry is the only objective measure",
      "Not without a declared use case or rule for combining the dimensions",
      "No, action fidelity always dominates",
      "Yes, any benchmark gain establishes overall progress",
    ],
    answer: 1,
    why: "Benchmarks now measure several useful dimensions. The unresolved part is how to combine them when systems and applications value different contracts.",
  },
];

const QUESTIONS_CH8_ZH: Q[] = [
  {
    kind: "choice",
    stem: "哪一个改动能让视频模型具备被操控的可能，却不能证明它会听话？",
    options: ["更多参数", "让每一帧的生成同时以一个动作、以及之前那些帧为条件", "更高的分辨率", "更长的上下文窗口"],
    answer: 1,
    why: "动作条件提供的是接口。可控性仍要固定起点、只改变动作，再测所要求的未来是否真的分开。",
  },
  {
    kind: "choice",
    stem: "你转回身，生成出来的房间还是离开时的样子。关于它的记忆，你能推出什么？",
    options: ["里面一定有可导出的几何结构", "它没有任何形式的记忆", "某种内部状态支撑着持久性，但这个行为看不出它是场景图、上下文还是别的机制", "它一定用了单独的物体数据库"],
    answer: 2,
    why: "这个行为证明了持久性，没有证明实现方式。据称 Genie 3 会参照此前轨迹，但没有暴露可检查的持久几何结构或物体存储。",
  },
  {
    kind: "choice",
    stem: "生成视频里掉落的物体会向下加速，而没有人提供过重力。这确立了什么？",
    options: ["模型学会了万有引力定律", "这个规律就在训练素材里，而要把素材预测好就必须复现它", "模型里含着一个物理引擎", "什么也没确立"],
    answer: 1,
    why: "这个观察是真的。问题在于：在你训练过的范围里复现一个规律，算不算掌握了那条规律；而光凭这个观察定不下来。",
  },
  {
    kind: "choice",
    stem: "图 8.7 里，模型在它训练过的那一段范围里误差只有几个百分点。为什么这不算它掌握了规律的证据？",
    options: ["测量不可靠", "在范围里对得上，同样也与「它记住了被问过那些问题的答案」相容", "几个百分点的误差太大了", "那段范围太窄"],
    answer: 1,
    why: "「掌握规律」和「在采样过的区域里拟合得好」只有在范围之外才分得开，而范围之外正是没人去测的地方，因为那里没有素材可以对照。",
  },
  {
    kind: "choice",
    stem: "为什么生成视频世界的形状不适合智能体在里面做规划？",
    options: ["它不够准", "规划意味着把模型跑很多遍，而一帧画面是「紧凑状态」的反面", "它没法以动作为条件", "它没有奖励信号"],
    answer: 1,
    why: "规划器需要便宜地试很多条动作序列并打分。这些模型跑起来很贵，而且产出的是画面，不是一个小到可以推理的东西。",
  },
  {
    kind: "choice",
    stem: "目前生成出来的世界，毫无争议地擅长什么？",
    options: ["取代物理引擎", "产出训练数据，以及当一个你可以在里面走动的地方", "长时程规划", "压缩视频"],
    answer: 1,
    why: "它们避开真实世界接触、能瞬间重置并产出广泛变体，但仍然要付计算代价。而且这门课里没有别的路数能给你一张真正能走进去的画面。",
  },
  {
    kind: "choice",
    stem: "为什么这类系统给出的错误答案，比一个错误的数字更让人信服？",
    options: ["它的误差更小", "它是以一张长得像照片的东西的形式出现的", "这些模型的置信度校准得更好", "它通常并没有错"],
    answer: 1,
    why: "这里的外推问题就是任何拟合函数都会有的普通问题。不一样的地方在于：它失败的时候，输出有多有说服力。",
  },
  {
    kind: "choice",
    stem: "一个系统的几何分数提高了，动作保真度却下降了。它综合来看更好吗？",
    options: ["是，几何是唯一客观尺度", "除非先声明用途或给出合并各维度的规则，否则答不了", "不是，动作保真度永远更重要", "是，任何基准上涨都证明综合进步"],
    answer: 1,
    why: "现在的基准已经能测几个有用维度。没解决的是：当不同系统和用途重视不同契约时，该怎么把它们合起来。",
  },
];

const QUESTIONS_CH7: Q[] = [
  {
    kind: "choice",
    stem: "A deterministic predictor uses squared pixel error and a car turns left or right with equal probability. What is its optimum?",
    options: [
      "The left turn",
      "The right turn",
      "The average of the two, which is a picture of neither",
      "Whichever was more common in training",
    ],
    answer: 2,
    why: "Squared error over a set of outcomes is minimised by their mean. Committing to one turn is punished half the time; the smear is punished a little all the time, and that wins.",
  },
  {
    kind: "choice",
    stem: "A stochastic video model now draws sharp left and right turns instead of their blur. What has it fixed, and what has it not?",
    options: [
      "It has learned which turn the real car will choose",
      "It fixed the impossible average but still has to represent probabilities and decision risk",
      "It removed the need for a pixel target",
      "It proved embedding prediction is unnecessary",
    ],
    answer: 1,
    why: "Sampling is a real solution to blur: each draw can be plausible. It does not identify which draw reality will select or tell a planner how to value the distribution.",
  },
  {
    kind: "choice",
    stem: "A leaf at the edge of the frame moves unpredictably. Why does a pixel-predicting model spend capacity on it?",
    options: [
      "Leaves are important for scene understanding",
      "The leaf is made of pixels, and pixels are what the model is marked on",
      "It cannot tell leaves from cars",
      "The encoder forces it to",
    ],
    answer: 1,
    why: "Nothing tells the objective which pixels matter. Hard-to-predict and irrelevant is the worst combination, and it is most of the frame.",
  },
  {
    kind: "choice",
    stem: "What does predicting an embedding rather than a picture do to the leaf problem?",
    options: [
      "It makes the leaf easier to predict",
      "If a detail does not survive the encoding, nothing downstream is graded on it",
      "It moves the problem to the decoder",
      "Nothing, the leaf is still in the input",
    ],
    answer: 1,
    why: "The description was never obliged to record which way the leaf went, so the model is not punished for failing to say.",
  },
  {
    kind: "choice",
    stem: "Predicting pixels has one large virtue that predicting embeddings gives up. What is it?",
    options: [
      "It is faster to compute",
      "The target is fixed: the model cannot make the next frame easier",
      "It needs less data",
      "It generalises better",
    ],
    answer: 1,
    why: "The moment the target is produced by a network that is also being trained, the target can move, and there is a way to make it move somewhere very convenient.",
  },
  {
    kind: "choice",
    stem: "What is collapse?",
    options: [
      "The loss diverging to infinity",
      "Every input encoding to the same description, so the prediction is always right and the representation says nothing",
      "The model forgetting earlier training",
      "Gradients vanishing in deep layers",
    ],
    answer: 1,
    why: "It is a perfect score obtained by learning nothing, and it is the cheapest solution available unless something is specifically stopping it.",
  },
  {
    kind: "choice",
    stem: "In Figure 7.6, the run with the safeguard has a worse loss. What does that tell you?",
    options: [
      "The safeguard is badly tuned",
      "An embedding loss is no longer a number you can read off as quality",
      "The model needs more training",
      "The safeguard should be removed once training stabilises",
    ],
    answer: 1,
    why: "A pixel loss of zero means the frame was predicted. An embedding loss of zero might mean everything or nothing, and the number cannot tell you which.",
  },
  {
    kind: "choice",
    stem: "Does this argument show that generating pixels is a mistake?",
    options: [
      "Yes, it is strictly worse",
      "No. It is a bad way to get a compact state to act on, and the only way anyone has to get an actual picture",
      "Yes, except for very short videos",
      "No, because collapse makes embeddings unusable",
    ],
    answer: 1,
    why: "The two goals were never the same goal, and most of the confusion here is people comparing systems built for different ones.",
  },
];

const QUESTIONS_CH7_ZH: Q[] = [
  {
    kind: "choice",
    stem: "一个确定性预测器使用像素平方误差，而汽车以相同概率左转或右转。它的最优解是什么？",
    options: ["左转", "右转", "两者的平均，也就是一张哪个都不是的画面", "训练里更常见的那一个"],
    answer: 2,
    why: "在一组结果上的平方误差由它们的均值最小化。笃定地选一边有一半时间会被重罚；糊影是一直被罚一点点，而后者赢了。",
  },
  {
    kind: "choice",
    stem: "一个随机视频模型现在能分别采样清晰的左转和右转，不再输出糊影。它修好了什么，又没修好什么？",
    options: ["它已经知道真实汽车会选哪边", "它修好了不可能的平均画面，但仍要表达概率与决策风险", "它不再需要像素目标", "它证明了嵌入预测没有必要"],
    answer: 1,
    why: "采样是对模糊问题的真正解法：每次抽样都可以合理。但它不会指出现实会选哪一次，也不会替规划器给整个分布定价。",
  },
  {
    kind: "choice",
    stem: "画面边缘一片叶子的动向无法预测。为什么预测像素的模型还要在它身上花容量？",
    options: ["叶子对理解场景很重要", "叶子是由像素构成的，而像素正是模型被打分的东西", "它分不清叶子和汽车", "编码器逼它这么做"],
    answer: 1,
    why: "没有任何东西告诉这个目标哪些像素才要紧。「难预测又不相关」是最糟的组合，而它占了画面的大部分。",
  },
  {
    kind: "choice",
    stem: "改成预测嵌入而不是画面，对叶子问题有什么影响？",
    options: ["它让叶子更好预测了", "如果某个细节没挺过编码，后面就没有东西会因为它被打分", "它把问题挪给了解码器", "没有影响，叶子还在输入里"],
    answer: 1,
    why: "那份描述从来没有义务记下叶子往哪边动，所以模型也不会因为说不出而被罚。",
  },
  {
    kind: "choice",
    stem: "预测像素有一个大优点，是预测嵌入放弃掉的。是什么？",
    options: ["算得更快", "目标是固定的：模型没法让下一帧变简单", "需要的数据更少", "泛化更好"],
    answer: 1,
    why: "一旦目标是由一个同样在被训练的网络产生的，目标就会动，而且存在一条把它挪到非常方便的位置的路。",
  },
  {
    kind: "choice",
    stem: "什么是塌缩？",
    options: ["损失发散到无穷", "所有输入都编码成同一份描述，于是预测永远正确，而表征什么也没说", "模型忘掉了早先的训练", "深层里梯度消失"],
    answer: 1,
    why: "那是一个「什么都没学」换来的满分，而且除非有东西专门去拦，它就是最省事的那个解。",
  },
  {
    kind: "choice",
    stem: "图 7.6 里，开了防护的那一次损失更差。这说明了什么？",
    options: ["防护没调好", "嵌入损失已经不再是一个可以直接当成质量读出来的数字", "模型还需要更多训练", "训练稳定之后就该把防护去掉"],
    answer: 1,
    why: "像素损失为零意味着那一帧被预测出来了。嵌入损失为零可能意味着什么都懂，也可能什么都不懂，而这个数字说不清是哪种。",
  },
  {
    kind: "choice",
    stem: "这个论点是不是说明了「生成像素」是个错误？",
    options: ["是，它严格更差", "不是。想拿一个可以据以行动的紧凑状态，它是个糟糕的办法；而想拿一张真正的画面，它是目前唯一的办法", "是，除了很短的视频以外", "不是，因为塌缩让嵌入没法用"],
    answer: 1,
    why: "这两个目标从来就不是同一个目标，而这里大部分的混乱都是有人在拿为不同目标造出来的系统互相比较。",
  },
];

const QUESTIONS_CH6: Q[] = [
  {
    kind: "choice",
    stem: "Training inside a model changes the exchange rate on which resource?",
    options: [
      "Memory, which becomes cheaper",
      "Contact with the world, which is replaced in part by model compute",
      "Model accuracy, which improves for free",
      "The number of parameters needed",
    ],
    answer: 1,
    why: "The learner still needs its experience. What changes is where the steps come from and which budget pays for them.",
  },
  {
    kind: "choice",
    stem: "A dashboard counts 90 imagined and 10 real transitions as 100 training examples. What is missing from that ledger?",
    options: [
      "Imagined transitions cannot be stored",
      "A reliability discount for model error and distance from a real state",
      "The policy's parameter count",
      "A requirement that both sources use the same batch size",
    ],
    answer: 1,
    why: "Rows are exchangeable to the logger, not to the learner. Synthetic experience inherits the model's blind spots, and that debt compounds along a rollout.",
  },
  {
    kind: "choice",
    stem: "What does the second lap of the loop fix that the first cannot?",
    options: [
      "It makes the model smaller",
      "A better policy visits new places, producing the data the first model was missing",
      "It removes the need for a decoder",
      "It shortens the rollouts",
    ],
    answer: 1,
    why: "A model fitted to the flailing of an untrained agent is only good where an untrained agent goes. The model gets better because the policy does, and the other way round.",
  },
  {
    kind: "choice",
    stem: "A policy trained inside a model is graded by what?",
    options: [
      "The world",
      "The model, and nothing else, for the whole of training",
      "A held-out test set from the real environment",
      "A human evaluator",
    ],
    answer: 1,
    why: "It has no access to the world during training, so it has no way to tell a genuinely good action from one that merely looks good to the marker.",
  },
  {
    kind: "choice",
    stem: "David Ha and Jürgen Schmidhuber's agent found a way of moving that stopped its dream producing fireballs. What kind of failure is that?",
    options: [
      "A bug in the training code",
      "The policy maximising the score the model hands it, which is exactly what it was asked to do",
      "The model being too small",
      "Insufficient exploration",
    ],
    answer: 1,
    why: "Nothing went wrong. Those were the cheapest points available inside the model, and the policy was thorough.",
  },
  {
    kind: "choice",
    stem: "How is this different from a planner exploiting a model at decision time?",
    options: [
      "It is the same problem with a different name",
      "A plan can be inspected and overruled; a trained policy walks out with the exploit already in its weights",
      "Planners are not affected by model error",
      "Policies are easier to correct afterwards",
    ],
    answer: 1,
    why: "That difference is what makes the dream version harder to catch. There is no plan sitting there to look at.",
  },
  {
    kind: "choice",
    stem: "Why deliberately add uncertainty to a model you worked hard to make accurate?",
    options: [
      "To speed up training",
      "So a trick that only works when the model rolls one particular way stops being worth building on",
      "To reduce memory use",
      "To make the model smaller",
    ],
    answer: 1,
    why: "If the policy is exploiting a quirk, the fix is to make the quirk unreliable rather than to make the model better.",
  },
  {
    kind: "choice",
    stem: "Both ends of the uncertainty dial fail. How?",
    options: [
      "Both ends make training unstable",
      "A confident dream gets exploited; a dream with too much noise has no task left in it to learn",
      "Low settings are slow, high settings are fast",
      "Only the high end fails",
    ],
    answer: 1,
    why: "The useful setting is a hump rather than a direction: a narrow band where neither failure has taken over.",
  },
];

const QUESTIONS_CH6_ZH: Q[] = [
  {
    kind: "choice",
    stem: "在模型里面训练，改变的是哪种资源的汇率？",
    options: ["内存，它变便宜了", "和世界的接触；其中一部分改由模型计算来付", "模型精度，它免费变好了", "所需的参数量"],
    answer: 1,
    why: "学习者仍然需要它那份经验。变的是这些步从哪儿来，以及由哪份预算付账。",
  },
  {
    kind: "choice",
    stem: "一个仪表盘把 90 次想象转移和 10 次真实转移记成 100 个训练样本。这本账漏了什么？",
    options: ["想象转移没法保存", "要按模型误差以及离真实状态多远，给可靠性打折", "策略的参数量", "两种来源必须使用同样的批量大小"],
    answer: 1,
    why: "对日志来说每一行都一样，对学习者不是。合成经验继承模型的盲点，而且这笔债会沿推演累积。",
  },
  {
    kind: "choice",
    stem: "循环的第二圈修好了第一圈修不了的什么？",
    options: ["它把模型变小了", "更好的策略会去新的地方，产生第一个模型缺的那份数据", "它去掉了对解码器的需要", "它缩短了推演"],
    answer: 1,
    why: "拟合在「未训练的智能体乱扑腾」之上的模型，只在那种智能体会去的地方管用。模型变好是因为策略变好，反过来也一样。",
  },
  {
    kind: "choice",
    stem: "一个在模型里面训练的策略，是被什么打分的？",
    options: ["世界", "模型，而且整个训练过程中只有模型", "来自真实环境的一份留出测试集", "一位人类评估者"],
    answer: 1,
    why: "它在训练期间接触不到世界，所以没法把「真正好的动作」和「只是在批改者眼里好看的动作」分开。",
  },
  {
    kind: "choice",
    stem: "David Ha 与 Jürgen Schmidhuber 的智能体找到了一种移动方式，让它的梦不再产生火球。这是哪一类失败？",
    options: ["训练代码里的 bug", "策略在最大化模型交给它的分数，而这正是它被要求做的事", "模型太小了", "探索不足"],
    answer: 1,
    why: "什么岔子都没出。那些是模型里面最便宜的分数，而这个策略很彻底。",
  },
  {
    kind: "choice",
    stem: "这和「规划器在决策时利用模型」有什么不同？",
    options: ["是同一个问题换了个名字", "方案可以被查看和否决；而训练出来的策略走出来时，漏洞已经在它的权重里了", "规划器不受模型误差影响", "策略事后更容易纠正"],
    answer: 1,
    why: "正是这个差别让梦里那个版本更难被抓住。没有一份摆在那儿可以看的方案。",
  },
  {
    kind: "choice",
    stem: "为什么要给一个你费劲做准的模型故意加上不确定性？",
    options: ["为了加快训练", "好让一个只有在模型碰巧那样掷一次时才管用的把戏，不再值得往上搭房子", "为了减少内存占用", "为了把模型做小"],
    answer: 1,
    why: "如果策略在利用某个怪癖，解法是让这个怪癖变得不可靠，而不是把模型做得更好。",
  },
  {
    kind: "choice",
    stem: "不确定性旋钮的两端都会失败。怎么个失败法？",
    options: ["两端都让训练不稳", "笃定的梦会被利用；噪声太大的梦里已经没有任务可学了", "低端慢，高端快", "只有高端会失败"],
    answer: 1,
    why: "有用的设置是一个峰而不是一个方向：那条「两种失败都还没占上风」的窄带。",
  },
];

const QUESTIONS_CH5: Q[] = [
  {
    kind: "choice",
    stem: "A transition model reports a very low average one-step error. Why does that number not tell you what you want to know?",
    options: [
      "It was probably measured wrong",
      "You will use it many steps at a time, and after the first step it is fed its own answer rather than the truth",
      "One-step errors are always understated",
      "Averages hide outliers",
    ],
    answer: 1,
    why: "The measurement is honest. It is a measurement of a job the model will never be asked to do.",
  },
  {
    kind: "choice",
    stem: "In the figure, the corrected line and the free-running line come from the same model with the same per-step bias. Why do they end up so far apart?",
    options: [
      "The free-running one accumulates a larger bias",
      "One is given the true previous state at every step, so its mistakes never feed anything",
      "The corrected one uses a different model",
      "Random noise differs between the runs",
    ],
    answer: 1,
    why: "Correction resets the input to the truth every step, so error cannot compound. Nothing about the model changed between the two lines.",
  },
  {
    kind: "choice",
    stem: "What is teacher forcing?",
    options: [
      "Training on data labelled by a larger model",
      "Showing the model the true previous value at each training step, because that is what the recording contains",
      "Forcing the model to use a fixed learning rate",
      "Training only on the hardest examples",
    ],
    answer: 1,
    why: "It makes training stable, and it also means the model is never once asked to recover from being slightly wrong, which is the only thing it will have to do later.",
  },
  {
    kind: "choice",
    stem: "A sequence is longer than the transformer's context window. Which statement is accurate?",
    options: [
      "Attention can still read every earlier step exactly",
      "The model must discard, compress or retrieve beyond the window; attention only postponed the decision",
      "Only recurrent models have a finite memory",
      "A longer sequence changes accuracy but not compute",
    ],
    answer: 1,
    why: "Attention avoids squeezing the past into one fixed state, but only inside a finite context. Its weighted read also compresses the available steps for the current prediction.",
  },
  {
    kind: "choice",
    stem: "For a short sequence, which is cheaper per step?",
    options: [
      "Always the summary",
      "Always attention",
      "Attention, until the sequence gets long enough to cross over",
      "They are identical",
    ],
    answer: 2,
    why: "Updating a summary costs the same whatever the length, so it only wins once the sequence is long. Below the crossover, looking at everything is the cheaper option.",
  },
  {
    kind: "choice",
    stem: "Why carry a deterministic part and a stochastic part in the state at the same time?",
    options: [
      "To use more parameters",
      "Deterministic alone cannot represent real uncertainty; stochastic alone struggles to remember, because noise enters at every step",
      "To make the model differentiable",
      "To support larger batches",
    ],
    answer: 1,
    why: "Each one fails alone, and in a different direction. A ball's motion belongs in the first; whether the door opens belongs in the second.",
  },
  {
    kind: "choice",
    stem: "Two models tie on one-step error along a demonstrated path. After a small perturbation, only one returns. What did the original test miss?",
    options: [
      "The models' parameter counts",
      "Recovery behaviour on states created by the model or by disturbances",
      "The camera resolution",
      "Whether the transition is deterministic",
    ],
    answer: 1,
    why: "One-step testing on the centre line never visits the states deployment creates after a mistake. Recovery is a separate behaviour and must be trained or tested off that line.",
  },
  {
    kind: "choice",
    stem: "What do scheduled sampling, rollout-level training, short horizons and replanning have in common?",
    options: [
      "They fix the mismatch",
      "They all make the model more accurate per step",
      "None removes the mismatch; each limits how much damage it does",
      "They only apply to recurrent models",
    ],
    answer: 2,
    why: "The honest summary is that a learned transition model is trustworthy over some horizon, and part of the engineering is knowing how long that is.",
  },
];

const QUESTIONS_CH5_ZH: Q[] = [
  {
    kind: "choice",
    stem: "一个转移模型报告说自己的平均单步误差非常低。为什么这个数字并不能告诉你你想知道的事？",
    options: [
      "它多半量错了",
      "你会一次用它很多步，而从第一步之后，喂给它的就是它自己的答案，不是真相",
      "单步误差总是被低估",
      "平均值掩盖了异常值",
    ],
    answer: 1,
    why: "这个测量是诚实的。它测的是一份这个模型永远不会被要求做的工作。",
  },
  {
    kind: "choice",
    stem: "图里那条被纠正的线和那条自己跑的线，来自同一个模型、同一个每步偏差。为什么最后差这么远？",
    options: [
      "自己跑的那条积累了更大的偏差",
      "其中一条在每一步都被给了真实的上一个状态，所以它的错误从来没机会去喂任何东西",
      "被纠正的那条用的是另一个模型",
      "两次运行的随机噪声不同",
    ],
    answer: 1,
    why: "纠正会在每一步把输入重置回真相，于是误差没法复利。两条线之间，模型本身什么都没变。",
  },
  {
    kind: "choice",
    stem: "什么是教师强制？",
    options: [
      "在更大的模型标注的数据上训练",
      "训练时每一步都把真实的上一个值展示给模型，因为记录里装的就是这个",
      "强制模型使用固定学习率",
      "只在最难的样本上训练",
    ],
    answer: 1,
    why: "它让训练更稳，同时也意味着模型一次都没有被要求过从「有点偏」里恢复，而那恰恰是它之后唯一要做的事。",
  },
  {
    kind: "choice",
    stem: "一段序列已经长过 transformer 的上下文窗口。哪句话准确？",
    options: ["注意力仍能逐字读取所有早先步骤", "模型必须在窗口之外丢弃、压缩或检索；注意力只是推迟了这次决定", "只有循环模型的记忆是有限的", "序列变长只影响准确率，不影响计算量"],
    answer: 1,
    why: "注意力不必把过去挤进一个固定状态，但这只在有限上下文之内成立。为当前预测做的加权读取本身也在压缩可见步骤。",
  },
  {
    kind: "choice",
    stem: "对一个短序列来说，哪一种每步更便宜？",
    options: ["永远是摘要", "永远是注意力", "注意力，直到序列长到越过交叉点为止", "两者一样"],
    answer: 2,
    why: "更新一份摘要的开销不随长度变化，所以它只有在序列够长时才占优。在交叉点以下，全都看一遍是更便宜的那个选项。",
  },
  {
    kind: "choice",
    stem: "为什么要在状态里同时带一个确定的部分和一个随机的部分？",
    options: [
      "为了用更多参数",
      "只有确定的部分表示不了真正的不确定性；只有随机的部分则很难记住东西，因为每一步都在注入噪声",
      "为了让模型可导",
      "为了支持更大的批量",
    ],
    answer: 1,
    why: "单独留任何一个都会失败，而且失败的方向不同。球的运动属于前者；门会不会开属于后者。",
  },
  {
    kind: "choice",
    stem: "两个模型在演示轨迹上的单步误差相同。受到一点扰动后，只有一个会回来。原来的测试漏掉了什么？",
    options: ["模型的参数量", "模型自己的误差或外界扰动产生的状态上的恢复行为", "摄像机分辨率", "转移是不是确定性的"],
    answer: 1,
    why: "只沿中心线做单步测试，永远不会访问上线后一次小错会产生的状态。恢复是另一种行为，必须在那条线之外训练或检验。",
  },
  {
    kind: "choice",
    stem: "计划采样、整段推演训练、短时程、重新规划，这四者的共同点是什么？",
    options: ["它们修好了这个错配", "它们都让模型每一步更准", "没有一个消除了这个错配；每一个都只是限制它能造成多大破坏", "它们只适用于循环模型"],
    answer: 2,
    why: "诚实的总结是：一个学出来的转移模型只在某个时程内值得信任，而工程的一部分就是知道那个时程有多长。",
  },
];

const QUESTIONS_CH4: Q[] = [
  {
    kind: "choice",
    stem: "A camera hands you tens of thousands of numbers per frame. Deciding whether to walk forward needs two or three. What is the bottleneck for?",
    options: [
      "Making the model smaller so it runs faster",
      "Forcing everything through a narrow opening, so what survives is what the pictures were actually made of",
      "Removing noise from the camera",
      "Compressing the file on disk",
    ],
    answer: 1,
    why: "Speed and file size are side effects. The reason to squeeze is that succeeding at the squeeze requires recovering the things that generated the picture in the first place.",
  },
  {
    kind: "choice",
    stem: "Nobody hand-picks what the short list should contain. Why does it end up holding the right things anyway?",
    options: [
      "The architecture has one unit per concept",
      "If the pictures were generated by a few things changing, recovering those things is the cheapest way to rebuild them",
      "The training labels say so",
      "The decoder is told the answer",
    ],
    answer: 1,
    why: "The ordering falls out of the pressure rather than being designed. That is the appeal, and also why the ordering is only roughly the one you wanted.",
  },
  {
    kind: "choice",
    stem: "Average two pictures of two different rooms. What do you get?",
    options: [
      "A room halfway between them",
      "Both rooms at once, faintly, which is not a room",
      "The first room",
      "An empty picture",
    ],
    answer: 1,
    why: "This is what pixel-space blending does. It is the clearest reason to want a space where the point between two valid things is itself valid.",
  },
  {
    kind: "choice",
    stem: "Average the two short descriptions instead, then decode. What do you get?",
    options: [
      "The same ghost",
      "A room, because every point in that space decodes to one",
      "Nothing, the numbers do not add",
      "A picture of both rooms side by side",
    ],
    answer: 1,
    why: "Prediction, planning and search all involve moving somewhere you have not been. That only works if the places in between mean something.",
  },
  {
    kind: "choice",
    stem: "Why is the noise in a variational autoencoder not just a nuisance?",
    options: [
      "It makes training faster",
      "It hides the training data",
      "Blurring where each picture lands forces neighbouring points to decode to similar things",
      "It reduces the number of parameters",
    ],
    answer: 2,
    why: "Smoothness is the property that makes the space navigable. Without it you have a lookup table with extra steps.",
  },
  {
    kind: "choice",
    stem: "Which of these is NOT what makes a compact description a good one?",
    options: [
      "It keeps what the future turns on",
      "Nearby points mean nearby things",
      "It is as small as possible",
      "It is easy to step forward in time",
    ],
    answer: 2,
    why: "A single number is very small and useless. Small is a consequence of keeping the right things, never the goal on its own.",
  },
  {
    kind: "choice",
    stem: "A description is scored on how well it can rebuild the camera image. What can go wrong?",
    options: [
      "Nothing, that is exactly the right test",
      "It spends itself on whatever occupies the most pixels, which is usually not what the decision turns on",
      "It becomes too small to be useful",
      "It stops being differentiable",
    ],
    answer: 1,
    why: "Reconstruction is a proxy. Texture and weather are most of the pixels; the small fast object you needed to avoid is not.",
  },
  {
    kind: "choice",
    stem: "Why is the width of the bottleneck an uncomfortable place to put an important decision?",
    options: [
      "It is hard to tune",
      "Everything after it works only from the short list, so whatever was dropped is gone, and it was dropped before anyone knew the task",
      "It uses too much memory",
      "It has to be chosen before training",
    ],
    answer: 1,
    why: "The loss is not recoverable downstream. A part of the system with no idea what is coming sets the ceiling on everything after it.",
  },
];

const QUESTIONS_CH4_ZH: Q[] = [
  {
    kind: "choice",
    stem: "摄像机每一帧交给你几万个数字，而决定要不要往前走只需要两三个。瓶颈是干什么用的？",
    options: [
      "把模型做小，让它跑得更快",
      "逼着所有东西挤过一个窄口，于是活下来的正是画面真正由什么构成的",
      "去掉摄像机的噪点",
      "把文件在硬盘上压小",
    ],
    answer: 1,
    why: "速度和体积都是副作用。之所以要挤，是因为想挤过去就必须把「一开始生成这张画面的那些东西」还原出来。",
  },
  {
    kind: "choice",
    stem: "没有人手工挑选那串短数字里该装什么。为什么它最后还是装了对的东西？",
    options: [
      "架构里每个概念有一个单元",
      "如果这些画面本来就由少数几样东西的变化产生，那么还原这几样就是重建它们最省事的办法",
      "训练标注里写了",
      "解码器被告知了答案",
    ],
    answer: 1,
    why: "这个排序是被压力逼出来的，不是设计出来的。这既是它吸引人的地方，也是为什么这个排序只是「大致」是你想要的那个。",
  },
  {
    kind: "choice",
    stem: "把两个不同房间的两张画面平均一下。你会得到什么？",
    options: ["一个介于两者中间的房间", "两个房间同时淡淡地叠在一起，那不是房间", "第一个房间", "一张空白画面"],
    answer: 1,
    why: "这就是像素空间里做混合得到的结果。它也是最能说明「为什么你想要一个『两个有效点之间也有效』的空间」的理由。",
  },
  {
    kind: "choice",
    stem: "改成把两份简短描述平均一下，再解码。你会得到什么？",
    options: ["同一个幽灵", "一个房间，因为那个空间里的每个点都解码成一个房间", "什么都没有，这些数字加不起来", "一张两个房间并排的画面"],
    answer: 1,
    why: "预测、规划和搜索都要走到没去过的地方。只有当中间那些位置是有意义的，这件事才成立。",
  },
  {
    kind: "choice",
    stem: "变分自编码器里的噪声，为什么不只是个麻烦？",
    options: ["它让训练更快", "它把训练数据藏起来", "把每张画面的落点弄模糊，会逼着相邻的点解码出相似的东西", "它减少了参数量"],
    answer: 2,
    why: "平滑是让这个空间能被走通的那个性质。没有它，你手上就是一张多绕了几道弯的查找表。",
  },
  {
    kind: "choice",
    stem: "以下哪一条**不是**「一份好的紧凑描述」的标准？",
    options: ["它留住了未来所取决于的东西", "相邻的点意味着相邻的东西", "它尽可能地小", "它容易在时间上往前推"],
    answer: 2,
    why: "一个数字非常小，也非常没用。小是「留住了对的东西」的结果，从来不是目标本身。",
  },
  {
    kind: "choice",
    stem: "一份描述是按「它能多好地重建摄像机画面」来打分的。这会出什么问题？",
    options: ["不会出问题，这正是对的检验", "它会把自己花在占像素最多的东西上，而那通常不是决定所取决于的东西", "它会小到没法用", "它会变得不可导"],
    answer: 1,
    why: "重建只是个替身。纹理和天气占了大部分像素；那个你需要避开的、又小又快的东西并不占。",
  },
  {
    kind: "choice",
    stem: "为什么「瓶颈有多宽」是一个放置重要决定的尴尬位置？",
    options: [
      "它很难调",
      "它后面的一切都只靠那串短数字，所以被丢掉的就没了，而丢它的时候还没人知道任务是什么",
      "它占太多内存",
      "它必须在训练前定好",
    ],
    answer: 1,
    why: "这个损失在下游补不回来。一个完全不知道接下来是什么任务的部件，给它后面的一切定了上限。",
  },
];

const QUESTIONS_CH3: Q[] = [
  {
    kind: "choice",
    stem: "One photograph of a ball in flight. What can you not work out from it?",
    options: [
      "Where the ball is",
      "How big the ball is",
      "Which way it is going and how fast",
      "What colour it is",
    ],
    answer: 2,
    why: "Direction and speed are not in any single frame. They exist in the relationship between frames, which is the kind of thing a predictor has to build for itself.",
  },
  {
    kind: "choice",
    stem: "Why is next-thing prediction so much cheaper to train on than labelled data?",
    options: [
      "The models are smaller",
      "The answer is already in the recording, so nobody has to write labels",
      "It needs less computing time",
      "It converges in fewer steps",
    ],
    answer: 1,
    why: "Every moment is the answer to the moment before. That turns any recording of anything into a training set, and removes the step where a person has to annotate a million examples.",
  },
  {
    kind: "choice",
    stem: "Jeffrey Elman's network was trained only to predict the next word, and its internal states sorted themselves into nouns, verbs, animate and inanimate. Why?",
    options: [
      "Those categories were in the training labels",
      "The architecture had one unit per category",
      "A word's category is what its next word depends on, so the categories were the cheapest way to be less wrong",
      "It memorised the corpus",
    ],
    answer: 2,
    why: "Nothing supplied the categories. Prediction rewards whatever makes the next thing less surprising, and for words that is grammatical category.",
  },
  {
    kind: "choice",
    stem: "A probe finds board state inside a network trained only on legal Othello moves. What turns that from a curiosity into a finding?",
    options: [
      "The probe is very accurate",
      "The network was large",
      "Changing that internal board changes the moves the network then makes",
      "The board can be drawn as a picture",
    ],
    answer: 2,
    why: "Accuracy alone could be a coincidence in the numbers. Intervening on the representation and watching behaviour follow is what shows the network is using it.",
  },
  {
    kind: "choice",
    stem: "Under a good predictor, a symbol you were confident about and got right costs almost nothing to send. Why?",
    options: [
      "It can be left out of the message",
      "The cost of a symbol is set by the probability you gave it",
      "Common symbols are stored in a table",
      "The receiver guesses it and does not need the message",
    ],
    answer: 1,
    why: "Claude Shannon made the price exact. High probability means a short code, which is why a better predictor is a better compressor.",
  },
  {
    kind: "choice",
    stem: "What does the compression view say about memorising the training data?",
    options: [
      "It is the best available strategy",
      "It is the expensive option: a lookup table of everything is enormous and useless on anything new",
      "It compresses better than any rule",
      "It is what all learning does",
    ],
    answer: 1,
    why: "The short message comes from finding the rule that generated the data and keeping that instead. Memorising is what compression penalises.",
  },
  {
    kind: "choice",
    stem: "Same loop, different target: predict the next pixel, or the next word, or the next compact state. What does that choice change?",
    options: [
      "Nothing, the loop is what matters",
      "Only how long training takes",
      "What the system ends up good at, and what its capacity gets spent on",
      "Whether the method counts as self-supervised",
    ],
    answer: 2,
    why: "Predict every pixel and most of the capacity goes to leaves, because that is where most of the pixels are. Picking the target is the design decision that matters most.",
  },
  {
    kind: "choice",
    stem: "A model has very low error predicting the next frame of a recording. What does that alone not tell you?",
    options: [
      "That it saw the recording",
      "What it would predict if you acted differently, and how it behaves outside what it recorded",
      "That its error was measured correctly",
      "That the recording was long enough",
    ],
    answer: 1,
    why: "Being unsurprised by what you happened to record is a weaker claim than it sounds, and saying what comes next is not the same as saying what would come next under a different action.",
  },
];

const QUESTIONS_CH3_ZH: Q[] = [
  {
    kind: "choice",
    stem: "一张球在飞行中的照片。有什么是你从它推不出来的？",
    options: ["球在哪里", "球有多大", "它往哪个方向走、走得多快", "它是什么颜色"],
    answer: 2,
    why: "方向和速度不在任何单独一帧里。它们存在于帧与帧之间的关系中，而这是预测器不得不自己造出来的那类东西。",
  },
  {
    kind: "choice",
    stem: "为什么「预测下一个东西」比用标注数据训练便宜那么多？",
    options: [
      "模型更小",
      "答案本来就在记录里，没有人需要写标注",
      "它需要的计算时间更少",
      "它收敛需要的步数更少",
    ],
    answer: 1,
    why: "每一刻都是上一刻的答案。这把任何东西的任何记录都变成了训练集，也去掉了「得有人标注一百万个样本」这一步。",
  },
  {
    kind: "choice",
    stem: "Jeffrey Elman 的网络只被训练去预测下一个词，而它的内部状态自己分成了名词、动词、有生命与无生命。为什么？",
    options: [
      "这些类别本来就在训练标注里",
      "架构里每个类别有一个单元",
      "一个词的类别正是它的下一个词所依赖的东西，所以这些类别是「少犯错」最省事的办法",
      "它把语料背了下来",
    ],
    answer: 2,
    why: "没有任何东西提供过这些类别。预测奖励的是任何能让下一刻更不意外的东西，对词来说，那就是语法类别。",
  },
  {
    kind: "choice",
    stem: "探针在一个只用合法黑白棋着法训练的网络里找到了棋盘状态。是什么让它从一件趣闻变成一个发现？",
    options: [
      "探针非常准",
      "网络很大",
      "改动那个内部棋盘，网络接下来走的棋也跟着变",
      "棋盘可以画成一张图",
    ],
    answer: 2,
    why: "光是准，有可能只是数字里的巧合。对表征做干预、再看到行为跟着改变，才说明网络在用它。",
  },
  {
    kind: "choice",
    stem: "在一个好的预测器下，一个你很有把握而且猜对了的符号，发送起来几乎不花钱。为什么？",
    options: [
      "它可以从消息里省掉",
      "一个符号的代价由你给它的概率决定",
      "常见符号被存在一张表里",
      "接收方自己猜就行，不需要消息",
    ],
    answer: 1,
    why: "香农把这个价格写精确了。概率高就意味着码长短，这也是为什么更好的预测器就是更好的压缩器。",
  },
  {
    kind: "choice",
    stem: "从压缩的角度看，「把训练数据背下来」是怎么回事？",
    options: [
      "这是能用的最好策略",
      "这是贵的那个选项：把一切都记下来的查找表既庞大又对新东西没用",
      "它比任何规律压得都好",
      "所有学习做的都是这件事",
    ],
    answer: 1,
    why: "短消息来自「找出生成数据的规律，然后只留下它」。背，恰恰是压缩要惩罚的东西。",
  },
  {
    kind: "choice",
    stem: "同一个循环，不同的目标：预测下一个像素、下一个词，或者下一个紧凑状态。这个选择改变了什么？",
    options: [
      "什么也没变，重要的是那个循环",
      "只改变训练要多久",
      "改变这个系统最后擅长什么，以及它的容量花在哪里",
      "改变这套方法算不算自监督",
    ],
    answer: 2,
    why: "去预测每一个像素，容量大半会花在树叶上，因为那里才是大部分像素。挑目标是这里最要紧的设计决定。",
  },
  {
    kind: "choice",
    stem: "一个模型在预测某段记录的下一帧时误差非常低。单凭这一点，什么是它没告诉你的？",
    options: [
      "它见过这段记录",
      "如果你做了别的动作它会预测什么，以及它在录下来的范围之外会怎么样",
      "误差是不是量对了",
      "这段记录是不是够长",
    ],
    answer: 1,
    why: "对你碰巧录下来的东西不感到意外，是个比听起来弱得多的论断；而说出接下来会发生什么，也不等于说出在另一个动作下会发生什么。",
  },
];

const QUESTIONS_CH2: Q[] = [
  {
    kind: "choice",
    stem: "Below the tuned speed in the braking demo, the fixed-trigger car and the model car behave identically. What does that establish?",
    options: [
      "The dynamics model is not doing anything",
      "A cached rule can be entirely sufficient inside the conditions it was prepared for",
      "Model-based control only matters at high speed",
      "Model-free systems cannot use velocity",
    ],
    answer: 1,
    why: "The model does not win everywhere. Inside the range where a cached answer is still correct, recomputing it buys you nothing except the cost of recomputing it.",
  },
  {
    kind: "choice",
    stem: "A recurrent policy maps observations and memory straight to actions, but holds no learned transition function you can roll forward under actions it has not taken. Is it model-based?",
    options: [
      "Yes, because it has memory",
      "Yes, because every large network contains a model",
      "No",
      "Only if its policy is stochastic",
    ],
    answer: 2,
    why: "Memory and complexity do not by themselves make a callable dynamics model. The missing contract is the ability to predict consequences under hypothetical actions.",
  },
  {
    kind: "choice",
    stem: "A system encodes a camera frame into 512 numbers, rolls those numbers forward under 500 candidate action sequences, and picks the best. It never decodes a future image. Does it qualify?",
    options: [
      "No, because a world model has to predict pixels",
      "Yes, because its learned state can be rolled forward under actions",
      "Only if the 512 numbers correspond to named physical quantities",
      "Only if the predictions are deterministic",
    ],
    answer: 1,
    why: "PlaNet, MuZero and TD-MPC2 are the counterexamples to the idea that a useful world model has to reproduce the future visually. Decision-relevant latent dynamics are enough.",
  },
  {
    kind: "choice",
    stem: "Dreamer trains an actor on trajectories generated by its world model, then the actor picks an action directly. No large search runs at that instant. Has the world model stopped counting?",
    options: [
      "Yes, because planning has to happen at inference time",
      "No, the dynamics still generated action-conditioned imagined experience",
      "Yes, unless the actor reconstructs the pixels",
      "It depends only on the size of the actor",
    ],
    answer: 1,
    why: "Online search is one use of an iterable dynamics model, not the definition of one. Dreamer spends the model earlier, during training, rather than at the moment of acting.",
  },
  {
    kind: "choice",
    stem: "In the exploitation figure the planner gets worse after you raise its search budget. What happened?",
    options: [
      "The optimiser became less accurate",
      "The world became harder",
      "Better optimisation found a model error that weaker search had missed",
      "Long plans are always worse than short plans",
    ],
    answer: 2,
    why: "The optimiser got better at maximising the score the model hands it. The mistake was assuming that score stayed faithful to reality everywhere the search could reach.",
  },
  {
    kind: "choice",
    stem: "Why can short model rollouts help?",
    options: [
      "Neural networks cannot make more than a few predictions",
      "They limit how long model error and distribution shift can accumulate before real data returns",
      "Short horizons make the model exact",
      "They eliminate uncertainty",
    ],
    answer: 1,
    why: "This is the motivation behind MBPO's short rollouts branched from real states. Use the model enough to gain synthetic experience, not so far that accumulated bias swamps it.",
  },
  {
    kind: "choice",
    stem: "Five models in an ensemble all agree a shortcut is safe. What has that proved?",
    options: [
      "The shortcut is safe",
      "The probability of failure is zero",
      "Only that these five agree; a shared blind spot is still possible",
      "That more models were unnecessary",
    ],
    answer: 2,
    why: "Disagreement is a useful uncertainty signal, which is what PETS exploits. But learned uncertainty can itself be miscalibrated, and models trained on the same biased data can be confidently wrong together.",
  },
  {
    kind: "choice",
    stem: "Your model says: if you had braked one second earlier, you would have stopped before the wall. What exactly do you have?",
    options: [
      "Proof of what the physical world would truly have done",
      "A model-relative prediction under a hypothetical action",
      "A recording of the alternative history",
      "A causal conclusion independent of hidden variables",
    ],
    answer: 1,
    why: "This is the useful sense of what if in model-based control. It lets you compare actions before taking them, and its authority reaches exactly as far as the learned model does.",
  },
];
const QUESTIONS_CH2_ZH: Q[] = [
  {
    kind: "choice",
    stem: "在刹车演示里，速度低于调校值时，固定触发的那辆车和带模型的那辆车行为完全一样。这说明了什么？",
    options: [
      "动力学模型什么也没干",
      "在一条缓存规则当初被准备好的条件范围内，它完全够用",
      "基于模型的控制只在高速时才有意义",
      "无模型的系统用不了速度信息",
    ],
    answer: 1,
    why: "模型并不是到处都赢。在缓存下来的答案仍然正确的那个范围里，重算一遍除了重算的开销之外什么也换不来。",
  },
  {
    kind: "choice",
    stem: "一个循环策略把观测和记忆直接映射成动作，但它内部没有一个可以在「没执行过的动作」下往前推的转移函数。它是基于模型的吗？",
    options: [
      "是，因为它有记忆",
      "是，因为任何大网络内部都含着一个模型",
      "不是",
      "只有当它的策略是随机的时候才算",
    ],
    answer: 2,
    why: "记忆和复杂度本身并不构成一个可以调用的动力学模型。缺的那份契约，是在假设性动作下预测后果的能力。",
  },
  {
    kind: "choice",
    stem: "某个系统把一帧摄像头画面编码成 512 个数，在这些数上把 500 条候选动作序列各推一遍，然后挑出最好的。它从不解码出未来的图像。它算数吗？",
    options: [
      "不算，因为世界模型必须预测像素",
      "算，因为它学出来的状态可以在动作条件下往前推演",
      "只有当这 512 个数对应到有名字的物理量时才算",
      "只有当预测是确定性的时候才算",
    ],
    answer: 1,
    why: "PlaNet、MuZero 和 TD-MPC2 正是「有用的世界模型必须在视觉上复现未来」这个想法的反例。与决策相关的潜在动力学就够了。",
  },
  {
    kind: "choice",
    stem: "Dreamer 用它的世界模型生成的轨迹训练一个 actor，然后由 actor 直接选动作。那一刻并没有大规模搜索在跑。世界模型就不算数了吗？",
    options: [
      "不算了，因为规划必须发生在推理时",
      "还算，因为动力学仍然生成了动作条件下的想象经验",
      "不算了，除非 actor 把像素重建出来",
      "这只取决于 actor 有多大",
    ],
    answer: 1,
    why: "在线搜索只是一个可推演动力学模型的用法之一，而不是它的定义。Dreamer 把模型的开销花在更早的训练阶段，而不是动手的那一刻。",
  },
  {
    kind: "choice",
    stem: "在模型利用那幅图里，把搜索预算调高之后规划器反而变差了。发生了什么？",
    options: [
      "优化器变得不准了",
      "世界变难了",
      "更好的优化找到了弱搜索错过的那个模型错误",
      "长方案总是比短方案差",
    ],
    answer: 2,
    why: "优化器只是更擅长把模型给出的分数拉高了。错的是那个假设：这个分数在搜索能够到的每一个地方，都还忠实于现实。",
  },
  {
    kind: "choice",
    stem: "为什么短的模型推演会有帮助？",
    options: [
      "神经网络做不了几步以上的预测",
      "它限制了模型误差和分布偏移在真实数据回来之前能累积多久",
      "短视野让模型变精确",
      "它消除了不确定性",
    ],
    answer: 1,
    why: "这正是 MBPO 那种「从真实状态出发的短推演」的动机：用模型用到足以拿到合成经验，但别用到让累积偏差压倒一切。",
  },
  {
    kind: "choice",
    stem: "集成里的五个模型都认为某条捷径是安全的。这证明了什么？",
    options: [
      "这条捷径是安全的",
      "失败的概率为零",
      "只证明了这五个意见一致；共享的盲点仍然可能存在",
      "证明了不需要更多模型",
    ],
    answer: 2,
    why: "分歧是有用的不确定性信号，PETS 用的就是它。但学出来的不确定性本身可能没校准好，在同样有偏的数据上训练出来的模型也可能一起自信地出错。",
  },
  {
    kind: "choice",
    stem: "你的动力学模型说：如果你早一秒刹车，你会在撞墙之前停住。你手里拿到的到底是什么？",
    options: [
      "物理世界真正会怎么做的证明",
      "在一个假设性动作下、相对于模型而言的预测",
      "那条平行历史的录像",
      "一个与隐藏变量无关的因果结论",
    ],
    answer: 1,
    why: "这就是基于模型的控制里「如果」有用的那层意思。它让你在动手之前比较不同动作，而它的权威只延伸到那个学出来的模型所及之处。",
  },
];

export function Quiz({ chapter = 1 }: { chapter?: number }) {
  return (
    <>
      <div className="screen-only">
        <QuizInteractive chapter={chapter} />
      </div>
      <div className="print-only">
        <QuizPrinted chapter={chapter} />
      </div>
    </>
  );
}
