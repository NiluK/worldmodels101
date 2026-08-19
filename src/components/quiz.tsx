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
    why: "Turning away does not delete furniture. The chair is part of what is actually there, and simply not part of what you can currently see. Every hard problem in this course lives in that gap.",
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
    why: "Each imagined state becomes the input to the next prediction, so mistakes are built on. Nothing dramatic happens at any single step, which is exactly what makes it hard to catch.",
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
    stem: "Given the current sensor reading and a motor command you are considering, it returns the sensor reading you would get next. A search loop calls it a few thousand times a second.",
    answer: "dynamics",
    why: "Small, fast, and useful only because you can roll it forward under actions nobody has taken yet. Fidelity is beside the point; searchability is the whole point.",
  },
  {
    kind: "choice",
    stem: "Why does the Kalman filter count as ancestry rather than as one of the five?",
    options: [
      "It is too old to count",
      "Its dynamics are supplied rather than learned",
      "It estimates state but is never asked what happens if you act",
      "It only works on linear systems",
    ],
    answer: 2,
    why: "It does half the job beautifully: work out a hidden state from noisy measurements. What it never does is answer what-if, and conditioning on actions is what makes the rest of these useful for choosing.",
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
    why: "The trap. Being aimed at robots suggests a Simulator, but the output is still video, with no geometry anyone can collide against. What a system is for is a weaker clue than what it hands you. Not a complete answer either: a large platform can ship several interfaces, so the real question is which one you are about to build against.",
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
    why: "Not scepticism for its own sake. Some claims you can open and verify, like a mesh you can load; others you can only receive. Knowing which is which is part of reading this field.",
  },
];

function QuizInteractive({ chapter }: { chapter: number }) {
  const locale = useLocale();
  const t = useT();
  const QUESTIONS =
    chapter === 2 ? QUESTIONS_CH2 : locale === "zh" ? QUESTIONS_ZH : QUESTIONS_EN;
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
          {score === QUESTIONS.length
            ? "Including the trap. What a system is aimed at does not decide the category; what it outputs does."
            : score >= QUESTIONS.length - 3
              ? "Enough to read a paper with. The ones people miss are the trap, and the fact that staying consistent proves nothing on its own."
              : "Worth another pass. Two questions settle most cases: what does it actually output, and what are you given to start from."}
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
  const QUESTIONS =
    chapter === 2 ? QUESTIONS_CH2 : locale === "zh" ? QUESTIONS_ZH : QUESTIONS_EN;
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
    why: "转过身并不会让家具消失。椅子是实际存在的东西的一部分，只是不属于你此刻能看到的部分。这门课里所有困难的问题都住在这道缝隙里。",
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
    why: "每一个想象出来的状态都会成为下一次预测的输入，于是错误被叠在错误上面。任何单独一步都没有出什么大事，而这正是它难以察觉的原因。",
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
    stem: "给定当前的传感器读数和你正在考虑的一个电机指令，它返回你接下来会得到的传感器读数。一个搜索循环每秒调用它几千次。",
    answer: "dynamics",
    why: "小、快，而且它有用只是因为你能在还没执行过的动作下把它往前推演。逼真与否无关紧要；能不能在里面搜索才是全部意义。",
  },
  {
    kind: "choice",
    stem: "为什么卡尔曼滤波器算作前身，而不算五种定义中的一种？",
    options: [
      "它太老了",
      "它的动力学是给定的，不是学出来的",
      "它估计状态，但从来不会被问「如果我采取行动会怎样」",
      "它只适用于线性系统",
    ],
    answer: 2,
    why: "它把一半的工作做得极漂亮：从带噪声的测量里推出隐藏状态。它从来不做的是回答「如果……会怎样」，而以动作为条件正是让其余几种模型可以用来做选择的关键。",
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
    why: "这是陷阱。面向机器人听起来像仿真器，但它的输出仍然是视频，没有任何人可以撞上去的几何结构。一个系统是给谁用的，比它交给你什么要弱得多的线索。也不是完整答案：一个大平台可以同时提供好几个接口，所以真正的问题是你即将对着哪一个接口开发。",
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
const QUESTIONS_CH2: Q[] = [
  {
    kind: "choice",
    stem: "Below about forty on the braking demo, the reflex car and the model car behave identically. What does that tell you?",
    options: [
      "The model is not working yet",
      "A reflex is correct across the range it was tuned in",
      "The model is too slow to matter at low speed",
      "The demo is not sensitive enough",
    ],
    answer: 1,
    why: "A reflex is a cached answer, and inside its range the cache is right. That is why reflexes are everywhere and why most of the time you should not reach for a model at all.",
  },
  {
    kind: "choice",
    stem: "The reflex car fails past its tuned range. What is the worst part of how it fails?",
    options: [
      "It fails gradually, so nobody notices",
      "It fails suddenly, with no internal signal that anything changed",
      "It fails only at very high speed",
      "It brakes too early instead of too late",
    ],
    answer: 1,
    why: "The fixed trigger distance encodes an assumption about speed, and nothing in the controller knows it is making one. The model car slows earlier because its stopping distance grew and it can see that it grew.",
  },
  {
    kind: "choice",
    stem: "Chapter 1 said this category is defined by searchability rather than fidelity. What does that rule out?",
    options: [
      "A model that is fast but approximate",
      "A photorealistic model you cannot roll forward under hypothetical actions",
      "A model that works only in simulation",
      "A model trained on a small dataset",
    ],
    answer: 1,
    why: "Looking right is not the job. If you cannot ask it what happens under an action nobody has taken, you cannot search over actions, and searching over actions is the whole reason to carry it.",
  },
  {
    kind: "choice",
    stem: "In the planner, going from one sampled action sequence to two hundred produces a much better plan. What changed?",
    options: [
      "The model got more accurate",
      "The world became easier",
      "Only the amount of thinking done before acting",
      "The goal moved closer",
    ],
    answer: 2,
    why: "Nothing about the world or the model changed between those two states. A model is what converts extra computation into a better action, which is a trade almost nothing else in control gives you.",
  },
  {
    kind: "choice",
    stem: "Which of these is NOT something having a model buys you?",
    options: [
      "Trying an action before paying for it",
      "Practising where mistakes are free",
      "Asking what would have happened if you had acted differently",
      "A guarantee that the plan will work in the real world",
    ],
    answer: 3,
    why: "The first three are the same capability wearing different clothes: asking questions about situations that have not happened. The fourth is exactly what a model cannot give you, and the rest of the chapter is about why.",
  },
  {
    kind: "choice",
    stem: "In the exploitation demo, raising the search effort makes the real outcome worse. Why?",
    options: [
      "The optimiser is buggy",
      "More samples add noise to the plan",
      "A better search finds where the model is most optimistic, which is often where it is most wrong",
      "The model degrades as it is queried more",
    ],
    answer: 2,
    why: "The optimiser is not fighting you; it is doing exactly what you asked. You told it to find the plan the model scores highest, and the model scores highest in the places it never saw during training.",
  },
  {
    kind: "choice",
    stem: "A learned model is wrong in a way that is worse than being noisy. What is the difference that matters?",
    options: [
      "Its errors are larger than noise",
      "Its errors are structured, concentrated where it saw least during training",
      "Its errors grow over time while noise does not",
      "Noise can be averaged out and model error cannot",
    ],
    answer: 1,
    why: "Random error would be tolerable, because a random search would meet it at random. Structured error is dangerous precisely because a directed search seeks out the optimistic regions, and those are the same regions.",
  },
  {
    kind: "choice",
    stem: "Ensembles, uncertainty penalties, pessimism, short rollouts and trust regions are all versions of one instruction. Which?",
    options: [
      "Make the model more accurate",
      "Collect more real data before planning",
      "Do not let the planner go where the model has not earned confidence",
      "Prefer model-free methods when in doubt",
    ],
    answer: 2,
    why: "All of them constrain where the plan is allowed to look rather than trying to make the model globally right, which nobody knows how to do. Chapter 8 comes back to this as the field's central unfinished business.",
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
