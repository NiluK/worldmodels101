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
    chapter === 2
      ? locale === "zh"
        ? QUESTIONS_CH2_ZH
        : QUESTIONS_CH2
      : locale === "zh"
        ? QUESTIONS_ZH
        : QUESTIONS_EN;
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
            `quiz.verdict.${chapter === 2 ? "ch2" : "ch1"}.${
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
  const QUESTIONS =
    chapter === 2
      ? locale === "zh"
        ? QUESTIONS_CH2_ZH
        : QUESTIONS_CH2
      : locale === "zh"
        ? QUESTIONS_ZH
        : QUESTIONS_EN;
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
    stem: "Below the tuned speed in the braking demo, the fixed-trigger car and the model car behave identically. What does that establish?",
    options: [
      "The dynamics model is not doing anything",
      "A cached rule can be entirely sufficient inside the conditions it was prepared for",
      "Model-based control only matters at high speed",
      "Model-free systems cannot use velocity",
    ],
    answer: 1,
    why: "The point is not that the model wins everywhere. Inside the range where a cached answer is still correct, recomputing it buys you nothing except the cost of recomputing it.",
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
    why: "重点不是模型到处都赢。在缓存下来的答案仍然正确的那个范围里，重算一遍除了重算的开销之外什么也换不来。",
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
