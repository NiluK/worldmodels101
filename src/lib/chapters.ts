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
      "A model you can run forward lets you try an action before paying for it. The trouble is that a search good enough to find the best plan is also good enough to find the places the model is wrong.",
    demo: "Half a second to return a serve, two cars and a wall, and a planner that gets worse the harder it searches.",
    minutes: 14,
    status: "ready",
  },
  {
    n: 3,
    slug: "prediction",
    title: "Prediction as Learning",
    blurb:
      "Ask something to predict what comes next and it has no choice but to build whatever the next moment depends on. The same loop, read a second way, turns out to be compression.",
    demo: "One frame, then two: watch the futures still open collapse as evidence arrives.",
    minutes: 12,
    status: "ready",
  },
  {
    n: 4,
    slug: "latents",
    title: "Latent Space",
    blurb:
      "A camera measures tens of thousands of numbers. The decision needs two or three. What happens at the squeeze in between, and why that narrow point sets the ceiling on everything after it.",
    demo: "Drag a point through a two-number space and watch the room it decodes to.",
    minutes: 11,
    status: "ready",
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
    blurb: "一个能往前推演的模型，让你在真的付出代价之前先把一个动作试一遍。麻烦在于：一个强到能找出最佳方案的搜索，也强到能找出模型出错的地方。",
    demo: "半秒钟接一记发球，两辆车和一堵墙，还有一个搜索越卖力、结果越差的规划器。",
  },
  prediction: {
    title: "预测即学习",
    blurb: "让一个东西去预测接下来会发生什么，它就不得不把「下一刻取决于什么」造出来。同一个循环换个角度读，原来就是压缩。",
    demo: "先一帧，再两帧：看着仍然可能的未来随着证据到来而收窄。",
  },
  latents: {
    title: "潜在空间",
    blurb: "摄像机测量几万个数字，而这个决定只需要两三个。中间那道收窄口发生了什么，以及为什么那个窄点给它后面的一切定了上限。",
    demo: "在一个两个数字的空间里拖一个点，看着它解码出来的房间。",
  },
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
