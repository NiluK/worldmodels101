export type Definition = {
  id: string;
  name: string;
  /** What the thing actually predicts. Orders the map, left to right. */
  predicts: string;
  /** One-line definition. */
  gloss: string;
  /** The question that tells you whether someone means this one. */
  test: string;
  systems: string[];
  /** Who uses the word this way. */
  camp: string;
  chapter: number;
  /**
   * Sourced either from the lab that built the system or from the researcher
   * who authored the work, speaking. Every id is checked against YouTube's
   * oEmbed endpoint for channel and title before it ships; commentary
   * reuploads are rejected.
   */
  video: {
    id: string;
    title: string;
    source: string;
    /**
     * A demo's thumbnail IS the content, so use it. A lecture's thumbnail is
     * whatever slide the frame grab landed on, which is arbitrary at best and
     * actively misleading at worst, so talks get a designed card instead.
     */
    kind: "demo" | "talk";
  };
};

/**
 * The five things people mean by "world model".
 *
 * Called definitions rather than senses throughout. "Definition" is the correct
 * linguistic term for a distinct meaning of a word, but this chapter is about
 * observation and perception, so "the five senses" reads as a pun nobody
 * wrote. Not "components" either: these do not assemble into one system, and
 * the encoder/dynamics/controller trio in Chapter 2 already owns that word., ordered by how abstract the
 * predicted object is: pixels, then geometry, then compact state, then
 * embeddings. The fifth is not a system you run at all, which is why it sits
 * off the axis.
 */
export const DEFINITIONS: Definition[] = [
  {
    id: "renderer",
    name: "The Renderer",
    predicts: "Pixels",
    gloss:
      "An action-conditioned generator of observations. You press a key, it produces the next frames. Persistence, where it exists, is learned through generation rather than guaranteed by explicit geometric state.",
    test:
      "Ask what holds the room together. If the answer is that the model learned to keep producing it, rather than that there is geometry, you are looking at a renderer.",
    systems: ["Genie 3", "Sora", "GameNGen"],
    camp: "Generative video labs",
    chapter: 8,
    video: {
      id: "PDKhUknuQDg",
      title: "Genie 3: Creating dynamic worlds that you can navigate in real-time",
      source: "Google DeepMind",
      kind: "demo",
    },
  },
  {
    id: "simulator",
    name: "The Simulator",
    predicts: "Geometry & physics",
    gloss:
      "A queryable world structure (geometry, physical state, dynamics) where persistence is part of the contract rather than an emergent property.",
    test:
      "Could something compute against it? Collision meshes, physics, a scene you can export. Structure you can interrogate, not merely look at.",
    systems: ["Marble", "NVIDIA Cosmos *"],
    camp: "Spatial-intelligence and robotics labs. (*) Cosmos straddles this and the Renderer: NVIDIA describes Cosmos Predict as generative video, with Omniverse supplying explicit simulation.",
    chapter: 8,
    video: {
      id: "UslQB4LUueI",
      title: "Introducing Marble by World Labs",
      source: "World Labs",
      kind: "demo",
    },
  },
  {
    id: "dynamics",
    name: "The Dynamics Model",
    predicts: "Compact state",
    gloss:
      "A compact model of next state and reward under actions, learned so that something else can search inside it. The classical model-based definition, and the one the term was coined for.",
    test:
      "Can you roll it forward under actions nobody has taken yet, and search over them? That is the job this one exists to do.",
    systems: ["Dreamer", "PlaNet", "Ha & Schmidhuber"],
    camp: "Reinforcement learning and control theory. Named for what it models, not for the policy that uses it: in Ha and Schmidhuber\u2019s architecture the controller is a separate module from the model.",
    chapter: 2,
    video: {
      id: "oDlBtTcX0g0",
      title: "Dreamer 4: diamonds from offline experience",
      source: "Danijar Hafner",
      kind: "demo",
    },
  },
  {
    id: "representation",
    name: "The Representation",
    predicts: "Embeddings",
    gloss:
      "Prediction of embeddings rather than observations, where the forecast is often training scaffolding and the learned features are the product.",
    test:
      "Is the prediction discarded once training ends? If the artefact you keep is a representation, this is the definition being used.",
    systems: ["V-JEPA 2", "I-JEPA"],
    camp: "Self-supervised representation learning",
    chapter: 7,
    video: {
      id: "yUmDRxV0krg",
      title: "Self-Supervised Learning, JEPA, World Models, and the future of AI",
      source: "Yann LeCun · Harvard CMSA",
      kind: "talk",
    },
  },
  {
    id: "implicit",
    name: "The Implicit Model",
    predicts: "Nothing. It is found, not run",
    gloss:
      "A claim about structure found inside a network trained for something else. There is no world-model interface to call; the assertion is about what a probe can recover from activations.",
    test:
      "Is the claim about what a system does, or about what is inside it? Only this definition is about the inside.",
    systems: ["Othello-GPT", "“does GPT have a world model?”"],
    camp: "Mechanistic interpretability",
    chapter: 9,
    video: {
      id: "n6Dcl6Uf73s",
      title: "A Whirlwind Tour of Mechanistic Interpretability",
      source: "Neel Nanda · metauni",
      kind: "talk",
    },
  },
];

export const getDefinition = (id: string) => DEFINITIONS.find((s) => s.id === id);


/* ------------------------------------------------------------------------ */
/* Simplified Chinese                                                        */
/*                                                                           */
/* The five names are neologisms in English, so their Chinese forms are      */
/* choices rather than lookups. 仿真器 is used for Simulator instead of      */
/* 模拟器, which in Chinese technical writing more often reads as            */
/* "emulator"; 表征 is the standard rendering of "representation" in ML;     */
/* 内隐 carries the "present but not put there on purpose" sense that        */
/* Implicit needs. A native reviewer should sanity-check these first.        */
/* ------------------------------------------------------------------------ */

type LocalisedDefinition = {
  name: string;
  predicts: string;
  gloss: string;
  test: string;
  camp: string;
};

export const DEFINITIONS_ZH: Record<string, LocalisedDefinition> = {
  renderer: {
    name: "渲染器",
    predicts: "像素",
    gloss:
      "一个以动作为条件的观测生成器。你按一个键，它就生成接下来的画面。就算画面能保持一致，那也是生成过程学出来的，而不是由某个明确的几何结构保证的。",
    test:
      "问问是什么让这个房间保持原样。如果答案是「模型学会了一直把它画出来」，而不是「那里确实有几何结构」，那你看到的就是渲染器。",
    camp: "做生成式视频的实验室",
  },
  simulator: {
    name: "仿真器",
    predicts: "几何与物理",
    gloss:
      "一套可以被查询的世界结构：几何、物理状态、动力学。这里的一致性是合同条款，而不是涌现出来的副产品。",
    test:
      "别的程序能对它做计算吗？碰撞网格、物理、可以导出的场景。是能拿去查询的结构，而不只是能看的画面。",
    camp: "做空间智能和机器人的实验室。（*）Cosmos 横跨这一类和渲染器：英伟达把 Cosmos Predict 描述为生成式视频，而显式仿真由 Omniverse 提供。",
  },
  dynamics: {
    name: "动力学模型",
    predicts: "紧凑状态",
    gloss:
      "一个关于「在某个动作下，下一个状态和回报是什么」的紧凑模型，学它就是为了让别的东西能在里面做搜索。这是经典的基于模型的定义，也是这个词最初被造出来时指的东西。",
    test:
      "你能在还没执行过的动作下把它往前推演，并在这些动作上做搜索吗？这正是它存在的意义。",
    camp:
      "强化学习与控制理论。它的名字取自它建模的对象，而不是使用它的策略：在 Ha 与 Schmidhuber 的架构里，controller 是与模型分开的另一个模块。",
  },
  representation: {
    name: "表征模型",
    predicts: "嵌入向量",
    gloss:
      "预测的是嵌入向量而不是观测本身，而且这个预测往往只是训练时的脚手架，真正留下来的产物是学到的特征。",
    test:
      "训练结束以后，那个预测是不是就被丢掉了？如果你留下来的东西是一套表征，那用的就是这个定义。",
    camp: "自监督表征学习",
  },
  implicit: {
    name: "内隐模型",
    predicts: "什么都不预测，它是被找出来的，不是被运行的",
    gloss:
      "这是一个关于「在为别的任务训练出来的网络内部发现了某种结构」的断言。这里没有一个叫做世界模型的接口可以调用；断言的对象是探针能从激活值里读出什么。",
    test:
      "这个说法讲的是一个系统能做什么，还是它内部有什么？只有这一种定义讲的是内部。",
    camp: "机制可解释性",
  },
};

/** Definition text for a locale, falling back to English. */
export function definitionText(locale: string, id: string): LocalisedDefinition {
  const base = DEFINITIONS.find((d) => d.id === id)!;
  if (locale === "zh" && DEFINITIONS_ZH[id]) return DEFINITIONS_ZH[id];
  return {
    name: base.name,
    predicts: base.predicts,
    gloss: base.gloss,
    test: base.test,
    camp: base.camp,
  };
}
