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
    title: "What People Mean",
    blurb:
      "The phrase now covers at least five different things, and the people using it rarely say which. A field guide to telling them apart before you read another paper about them.",
    demo: "The map: five definitions of the term, and the question that tells them apart.",
    minutes: 13,
    status: "ready",
  },
  {
    n: 2,
    slug: "the-idea",
    title: "The Idea",
    blurb:
      "The oldest of the five definitions, and the one closest to the term's early use in control. What a dynamics model actually is, what having one buys you, and why a better model has never removed the problem of deciding when to trust it.",
    demo: "Two cars and one wall, then a planner that gets worse the harder it searches.",
    minutes: 13,
    status: "ready",
  },
  {
    n: 3,
    slug: "prediction",
    title: "Prediction as Learning",
    blurb:
      "Guess the next thing, check, adjust. Why that loop is enough to extract structure from raw experience, and why compression and prediction turn out to be the same problem.",
    demo: "Train a next-state predictor live and watch its loss surface find the physics.",
    minutes: 14,
    status: "drafting",
  },
  {
    n: 4,
    slug: "latents",
    title: "Latent Space",
    blurb:
      "You cannot predict pixels and you should not try. Encoders, bottlenecks, and the move from what the world looks like to what state it is in.",
    demo: "Drag a point through a 2-D latent space and watch the world it decodes to.",
    minutes: 15,
    status: "planned",
  },
  {
    n: 5,
    slug: "dynamics",
    title: "Dynamics",
    blurb:
      "The transition model: given where we are and what we do, where do we end up? RNNs, state-space models, transformers, and the compounding error that eventually eats them all.",
    demo: "Roll out an imagined trajectory against the real one and watch them peel apart.",
    minutes: 16,
    status: "planned",
  },
  {
    n: 6,
    slug: "dreaming",
    title: "Learning in a Dream",
    blurb:
      "Once you have a simulator, you can practise inside it. Policy learning in imagination, why it is so sample-efficient, and how agents learn to exploit the bugs in their own dreams.",
    demo: "An agent trained only in the dream, dropped into the real environment.",
    minutes: 15,
    status: "planned",
  },
  {
    n: 7,
    slug: "jepa",
    title: "The Case Against Generation",
    blurb:
      "Predicting every pixel means spending capacity on the position of every leaf. The argument for predicting in representation space, and what JEPA actually changes.",
    demo: "The same ambiguous future scored by pixel loss and by representation loss.",
    minutes: 14,
    status: "planned",
  },
  {
    n: 8,
    slug: "video-worlds",
    title: "Video as World Simulator",
    blurb:
      "Sora, Genie, GameNGen, Cosmos. What happens when you scale generative video until it becomes controllable, and what 'emergent physics' does and does not mean.",
    demo: "Action-conditioned rollout: hold a key, steer a generated world.",
    minutes: 16,
    status: "planned",
  },
  {
    n: 9,
    slug: "whats-broken",
    title: "What's Broken",
    blurb:
      "Long-horizon drift, object permanence, counterfactuals, and the fact that nobody agrees how to evaluate any of this. The honest state of the field.",
    demo: "A drift meter: watch a state-of-the-art rollout lose the plot over 1,000 steps.",
    minutes: 13,
    status: "planned",
  },
];

export const READY = CHAPTERS.filter((c) => c.status === "ready");
export const getChapter = (slug: string) => CHAPTERS.find((c) => c.slug === slug);
export const TOTAL_MINUTES = CHAPTERS.reduce((a, c) => a + c.minutes, 0);


/** Chapter titles and blurbs in Simplified Chinese. */
export const CHAPTERS_ZH: Record<string, { title: string; blurb: string; demo: string }> = {
  "what-people-mean": {
    title: "人们说的是什么",
    blurb: "这个词如今至少涵盖五种不同的东西，而使用它的人很少说清是哪一种。在你读下一篇相关论文之前，先用这份指南把它们分开。",
    demo: "地图：这个词的五种定义，以及能把它们分开的那个问题。",
  },
  "the-idea": {
    title: "这个想法",
    blurb: "五种定义中最古老的一种，也是最贴近这个词在控制领域早期用法的一种。动力学模型到底是什么，有了它能换来什么，以及为什么把模型做得更好，从来没能消除“什么时候该相信它”这个问题。",
    demo: "两辆车和一堵墙，然后是一个搜索越卖力、结果越差的规划器。",
  },
  prediction: { title: "预测即学习", blurb: "猜下一个东西，检验，修正。", demo: "" },
  latents: { title: "潜在空间", blurb: "你没法预测像素，也不该去预测。", demo: "" },
  dynamics: { title: "动力学", blurb: "转移模型，以及最终吞掉它们的累积误差。", demo: "" },
  dreaming: { title: "在梦里学习", blurb: "有了模拟器，你就可以在里面练习。", demo: "" },
  jepa: { title: "反对生成的理由", blurb: "在表征空间里预测，而不是在像素空间里。", demo: "" },
  "video-worlds": { title: "视频作为世界模拟器", blurb: "当生成式视频被推到可控为止。", demo: "" },
  "whats-broken": { title: "哪些地方还不行", blurb: "长时程漂移、物体恒存性、反事实，以及评测问题。", demo: "" },
};

export function chapterText(locale: string, slug: string) {
  const base = CHAPTERS.find((c) => c.slug === slug)!;
  if (locale === "zh" && CHAPTERS_ZH[slug]) {
    return { ...base, ...CHAPTERS_ZH[slug] };
  }
  return base;
}
