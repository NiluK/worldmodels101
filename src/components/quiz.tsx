"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { DEFINITIONS, definitionText } from "@/lib/definitions";
import { useLocale, useT } from "./locale-provider";
import { DefinitionGlyph } from "./definition-glyph";
import { QUIZ_BY_LOCALE } from "./quiz/index";

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
export type Q = Classify | Choice;

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
  const en: Record<number, Q[]> = {
    1: QUESTIONS_EN,
    2: QUESTIONS_CH2,
    3: QUESTIONS_CH3,
    4: QUESTIONS_CH4,
    5: QUESTIONS_CH5,
    6: QUESTIONS_CH6,
    7: QUESTIONS_CH7,
    8: QUESTIONS_CH8,
    9: QUESTIONS_CH9,
  };
  const set = QUIZ_BY_LOCALE[locale]?.[chapter] ?? en[chapter] ?? en[1];
  return chapter >= 5 ? rotateLaterChoices(set, chapter) : set;
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
    why: "It sounds careful, and it conflates the two things you were trying to tell apart.",
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
    why: "A learned transition model is trustworthy over some horizon, and part of the engineering is knowing how long that is.",
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
