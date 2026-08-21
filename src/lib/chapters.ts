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
      "A model trained on the truth at every step gets its own last answer instead the moment you run it. What carries the past forward, and why the headline accuracy number measures the wrong job.",
    demo: "One model, two ways of running it: corrected every step, or left to eat its own output.",
    minutes: 11,
    status: "ready",
  },
  {
    n: 6,
    slug: "dreaming",
    title: "Learning in a Dream",
    blurb:
      "A month of robot time becomes a day if the practice happens inside the model. What that exchange rate really costs, and why the fix for an agent exploiting its own dream is to make the dream worse on purpose.",
    demo: "Turn the uncertainty in the dream up and down, and watch both scores fail at opposite ends.",
    minutes: 10,
    status: "ready",
  },
  {
    n: 7,
    slug: "jepa",
    title: "The Case Against Generation",
    blurb:
      "When the future is genuinely open, the best possible pixel prediction is a picture of something that cannot happen. The case for predicting descriptions instead, and the bill that arrives with it.",
    demo: "Two possible futures, and the smear that scores better than either of them.",
    minutes: 10,
    status: "ready",
  },
  {
    n: 8,
    slug: "video-worlds",
    title: "Video as World Simulator",
    blurb:
      "Add one input to a video model and it stops being a video. What scaling that bought, and why matching physics across the range you trained on is not the same as having the rule.",
    demo: "One start, three futures, chosen by which key you hold.",
    minutes: 10,
    status: "ready",
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
  dynamics: {
    title: "动力学",
    blurb: "一个在训练时每一步都拿到真相的模型，一上线拿到的就是它自己上一次的答案。是什么把过去带着往前走，以及为什么那个头条准确率数字量的是另一份工作。",
    demo: "同一个模型，两种跑法：每步都被纠正，或者放开去吃自己的输出。",
  },
  dreaming: {
    title: "在梦里学习",
    blurb: "如果练习发生在模型里面，一个月的机器人时间就变成一天。这笔汇率真正的代价是什么，以及为什么「智能体在利用自己的梦」的解法是故意把梦弄差。",
    demo: "把梦里的不确定性调高调低，看着两条分数在两端各自失败。",
  },
  jepa: {
    title: "反对生成的理由",
    blurb: "当未来真的还没定时，可能最好的像素预测是一张不可能发生的画面。改成预测描述的理由，以及随之而来的那张账单。",
    demo: "两个可能的未来，以及那团比它们俩得分都高的糊影。",
  },
  "video-worlds": {
    title: "视频作为世界模拟器",
    blurb: "给一个视频模型加上一个输入，它就不再是视频了。把这件事放大买到了什么，以及为什么「在训练过的范围里符合物理」和「掌握了那条规律」不是一回事。",
    demo: "一个起点，三个未来，取决于你按住哪个键。",
  },
  "whats-broken": { title: "哪些地方还不行", blurb: "长时程漂移、物体恒存性、反事实，以及评测问题。", demo: "" },
};

export function chapterText(locale: string, slug: string) {
  const base = CHAPTERS.find((c) => c.slug === slug)!;
  if (locale === "zh" && CHAPTERS_ZH[slug]) {
    return { ...base, ...CHAPTERS_ZH[slug] };
  }
  return base;
}
