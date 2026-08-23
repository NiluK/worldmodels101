import { CHAPTER_TEXT_BY_LOCALE } from "./chapter-text";
export type Chapter = {
  n: number;
  slug: string;
  title: string;
  /** The one-line promise: what you can do after reading it. */
  blurb: string;
  /** The interactive artifact that carries the chapter. */
  demo: string;
  minutes: number;
  status: "ready" | "drafting" | "planned";
};

export const CHAPTERS: Chapter[] = [
  {
    n: 1,
    slug: "what-people-mean",
    title: "What Is a World Model?",
    blurb:
      "The phrase has covered at least five different machines since 2018, and the people using it rarely say which. A field guide to the five, where each came from, and the one test that separates them.",
    demo: "The map: five definitions of the term, and the question that tells them apart.",
    minutes: 28,
    status: "ready",
  },
  {
    n: 2,
    slug: "the-idea",
    title: "How Do World Models Work?",
    blurb:
      "A model you can run forward lets you try an action before paying for it. That is the oldest idea in the field and still the best one. The trouble is that a search good enough to find the best plan is also good enough to find the places where the model is wrong. Nobody has engineered that away.",
    demo: "A gap in traffic, two cars and a wall, and a planner that gets worse the harder it searches.",
    minutes: 25,
    status: "ready",
  },
  {
    n: 3,
    slug: "prediction",
    title: "Why Is Prediction the Same as Learning?",
    blurb:
      "Ask something to predict what comes next and it has no choice but to build whatever the next moment depends on. Jeffrey Elman showed it with words in 1990. Claude Shannon had already shown that the same loop, read the other way, is compression.",
    demo: "One frame, then two: watch the futures still open collapse as evidence arrives.",
    minutes: 16,
    status: "ready",
  },
  {
    n: 4,
    slug: "latents",
    title: "What Is Latent Space?",
    blurb:
      "A camera measures tens of thousands of numbers and the decision needs two or three. What happens at the squeeze between them, and why that narrow point sets the ceiling on everything downstream.",
    demo: "Drag a point through a two-number space and watch the room it decodes to.",
    minutes: 11,
    status: "ready",
  },
  {
    n: 5,
    slug: "dynamics",
    title: "What Is a Dynamics Model?",
    blurb:
      "In training, the model is handed the truth at every step. The moment you deploy it, it gets its own last answer instead. What carries the past forward, and why the headline accuracy number measures a job the model will never be asked to do.",
    demo: "One model, two ways of running it: corrected every step, or left to eat its own output.",
    minutes: 15,
    status: "ready",
  },
  {
    n: 6,
    slug: "dreaming",
    title: "Can an AI Learn Inside Its Own World Model?",
    blurb:
      "A month of robot time becomes a day if the practice happens inside the model. That has been the pitch since Dyna, and Dreamer made it work. What the exchange rate costs, and why the fix for an agent that exploits its own dream is to make the dream worse on purpose.",
    demo: "Turn the uncertainty in the dream up and down, and watch both scores fail at opposite ends.",
    minutes: 13,
    status: "ready",
  },
  {
    n: 7,
    slug: "jepa",
    title: "What Is JEPA, and Why Not Predict Pixels?",
    blurb:
      "When a deterministic pixel predictor meets an open future, its best answer can be a picture of something that cannot happen. Yann LeCun's case against generation, what sampling fixes, what embeddings avoid, and what each still owes.",
    demo: "Two possible futures, and the smear that scores better than either of them.",
    minutes: 12,
    status: "ready",
  },
  {
    n: 8,
    slug: "video-worlds",
    title: "Are Video Models World Simulators?",
    blurb:
      "Add an action input to a video model and it is steerable in principle. From Genie to Genie 3: how to tell conditioning from control, what scaling bought, and why fitting physics is not the same as having the rule.",
    demo: "One start, three futures, chosen by which key you hold.",
    minutes: 13,
    status: "ready",
  },
  {
    n: 9,
    slug: "whats-broken",
    title: "What Is Still Broken in World Models?",
    blurb:
      "Scenes do not fail all at once, and different systems fail under different contracts. The closing argument: what to test, which benchmark claims compose, and which do not.",
    demo: "Drag out to a thousand steps and read which properties have already gone.",
    minutes: 11,
    status: "ready",
  },
];

export const READY = CHAPTERS.filter((c) => c.status === "ready");
export const getChapter = (slug: string) => CHAPTERS.find((c) => c.slug === slug);
export const TOTAL_MINUTES = CHAPTERS.reduce((a, c) => a + c.minutes, 0);

/** Chapter titles and blurbs in Simplified Chinese. */

export function chapterText(locale: string, slug: string) {
  const base = CHAPTERS.find((c) => c.slug === slug)!;
  const translated = CHAPTER_TEXT_BY_LOCALE[locale]?.[slug];
  return translated ? { ...base, ...translated } : base;
}
