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
export const CHAPTERS_ZH: Record<string, { title: string; blurb: string; demo: string }> = {
  "what-people-mean": {
    title: "什么是世界模型？",
    blurb: "自 2018 年起，这个词至少涵盖五种不同的机器，而人们很少说清自己指的是哪一种。这是给这五种的一份指南：各自从哪里来，以及能把它们分开的那一个测试。",
    demo: "地图：这个词的五种定义，以及能把它们分开的那个问题。",
  },
  "the-idea": {
    title: "世界模型是怎么工作的？",
    blurb: "一个能往前推演的模型，让你在真的付出代价之前先把一个动作试一遍。这是这个领域最老的想法，也仍然是最好的那个。麻烦在于，一个强到能找出最佳方案的搜索，也强到能找出模型出错的地方，而这一点至今没有人从工程上消掉。",
    demo: "车流里的一个空档，两辆车和一堵墙，还有一个搜索越卖力、结果越差的规划器。",
  },
  prediction: {
    title: "为什么预测就是学习？",
    blurb: "让一个东西去预测接下来会发生什么，它就不得不把「下一刻取决于什么」造出来。Jeffrey Elman 在 1990 年用词语证明了这一点，而在那之前，Claude Shannon 已经证明同一个循环换个角度读就是压缩。",
    demo: "先一帧，再两帧：看着仍然可能的未来随着证据到来而收窄。",
  },
  latents: {
    title: "什么是潜在空间？",
    blurb: "摄像机测量几万个数字，而这个决定只需要两三个。中间那道收窄口发生了什么，以及为什么那个窄点给它后面的一切定了上限。",
    demo: "在一个两个数字的空间里拖一个点，看着它解码出来的房间。",
  },
  dynamics: {
    title: "什么是动力学模型？",
    blurb: "一个在训练时每一步都拿到真相的模型，一上线拿到的就是它自己上一次的答案。是什么把过去带着往前走，以及为什么那个头条准确率数字量的是另一份工作。",
    demo: "同一个模型，两种跑法：每步都被纠正，或者放开去吃自己的输出。",
  },
  dreaming: {
    title: "AI 能在自己的世界模型里学习吗？",
    blurb: "如果练习发生在模型里面，一个月的机器人时间就变成一天。从 Dyna 起这就是卖点，而 Dreamer 让它真的成立。这笔汇率的代价是什么，以及为什么「智能体在利用自己的梦」的解法是故意把梦弄差。",
    demo: "把梦里的不确定性调高调低，看着两条分数在两端各自失败。",
  },
  jepa: {
    title: "什么是 JEPA？为什么不预测像素？",
    blurb: "当确定性像素预测器遇上开放的未来，最优解可能是一张不可能发生的画面。Yann LeCun 对生成式做法的那套指控、采样修好什么、嵌入避开什么，以及两者各自欠下的账。",
    demo: "两个可能的未来，以及那团比它们俩得分都高的糊影。",
  },
  "video-worlds": {
    title: "视频模型是世界模拟器吗？",
    blurb: "给视频模型加上动作输入，只是让它原则上可以被操控。从 Genie 到 Genie 3：怎样区分条件与控制、放大买到了什么，以及为什么拟合物理不等于掌握规律。",
    demo: "一个起点，三个未来，取决于你按住哪个键。",
  },
  "whats-broken": {
    title: "世界模型还有哪些地方不行？",
    blurb: "场景不是一下子全垮的，不同系统也会在不同契约下失败。到这里做一次总整理：该测什么、哪些基准结论能合起来、哪些不能。",
    demo: "把滑块拖到一千步，看看哪些性质已经没了。",
  },
};

export function chapterText(locale: string, slug: string) {
  const base = CHAPTERS.find((c) => c.slug === slug)!;
  if (locale === "zh" && CHAPTERS_ZH[slug]) {
    return { ...base, ...CHAPTERS_ZH[slug] };
  }
  return base;
}
