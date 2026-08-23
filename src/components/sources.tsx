"use client";

import { useLocale } from "./locale-provider";
const SOURCES_CH1 = [
  { t: "A Functional Taxonomy of World Models", a: "World Labs, 2026", u: "https://www.worldlabs.ai/blog/taxonomy-of-world-models", n: "First-party renderer/simulator/planner split, derived from the agent loop." },
  { t: "A New Approach to Linear Filtering and Prediction Problems", a: "Kalman, 1960", u: "https://doi.org/10.1115/1.3662552", n: "The hidden-state ancestor. Paywalled." },
  { t: "Making the World Differentiable: On Using Self-Supervised Fully Recurrent Neural Networks for Dynamic Reinforcement Learning and Planning in Non-Stationary Environments (FKI-126-90)", a: "Schmidhuber, 1990", u: "https://people.idsia.ch/~juergen/world-models-planning-curiosity-fki-1990.html", n: "A recurrent model predicting the consequences of a controller's actions." },
  { t: "World Models", a: "Ha & Schmidhuber, 2018", u: "https://arxiv.org/abs/1803.10122", n: "The paper that popularised the modern label." },
  { t: "Learning Latent Dynamics for Planning from Pixels (PlaNet)", a: "Hafner et al., 2018", u: "https://arxiv.org/abs/1811.04551", n: "Raw pixels to stochastic latent state to online planning." },
  { t: "Dream to Control (Dreamer)", a: "Hafner et al., 2019", u: "https://arxiv.org/abs/1912.01603", n: "Behaviour learned from multi-step latent imagination." },
  { t: "I-JEPA", a: "Assran et al., 2023", u: "https://arxiv.org/abs/2301.08243", n: "Predicting representations of masked regions, not pixels." },
  { t: "V-JEPA 2", a: "Meta AI, 2025", u: "https://ai.meta.com/blog/v-jepa-2-world-model-benchmarks/", n: "Action-free pre-training, then action-conditioned control." },
  { t: "Genie: Generative Interactive Environments", a: "Bruce et al., 2024", u: "https://arxiv.org/abs/2402.15391", n: "Action-controllable generated environments." },
  { t: "Genie 3", a: "Google DeepMind, 2025", u: "https://deepmind.google/blog/genie-3-a-new-frontier-for-world-models/", n: "Reports recalling previously seen detail over multi-minute interaction." },
  { t: "Marble", a: "World Labs, 2025", u: "https://www.worldlabs.ai/blog/marble-world-model", n: "Gaussian splats plus collider meshes: an explicit structural export." },
  { t: "Cosmos", a: "NVIDIA", u: "https://www.nvidia.com/en-us/ai/cosmos/", n: "A boundary case: predictive video worlds beside explicit simulation." },
  { t: "Emergent World Representations", a: "Li et al., 2022", u: "https://arxiv.org/abs/2210.13382", n: "Board state found and causally manipulated inside Othello-GPT." },
  { t: "Othello-GPT has a linear emergent world representation", a: "Nanda et al., 2023", u: "https://arxiv.org/abs/2309.00941", n: "The follow-up that sharpened the finding." },
];

const SOURCES_CH2 = [
  { t: "World Models", a: "Ha & Schmidhuber, 2018", u: "https://arxiv.org/abs/1803.10122", n: "Encoder, latent dynamics, tiny controller, and the experiments where the controller is trained inside the model's own generated environment before being moved back." },
  { t: "Learning Latent Dynamics for Planning from Pixels (PlaNet)", a: "Hafner et al., 2018", u: "https://arxiv.org/abs/1811.04551", n: "Stochastic latent dynamics learned from images, then searched over at decision time. Figure 2.3 in its real form." },
  { t: "Dream to Control (Dreamer)", a: "Hafner et al., 2019", u: "https://arxiv.org/abs/1912.01603", n: "Actor and critic trained on imagined latent trajectories, so no expensive search has to run at the moment of acting." },
  { t: "Mastering diverse control tasks through world models (DreamerV3)", a: "Hafner et al., Nature 2025", u: "https://www.nature.com/articles/s41586-025-08744-2", n: "One algorithm and one hyperparameter setting across more than 150 tasks. The strongest recent evidence for the imagination branch." },
  { t: "Mastering Atari, Go, chess and shogi by planning with a learned model (MuZero)", a: "Schrittwieser et al., 2020", u: "https://arxiv.org/abs/1911.08265", n: "The clearest proof that planning needs no reconstruction of observations. The model learns only what the search consumes." },
  { t: "TD-MPC2: Scalable, Robust World Models for Continuous Control", a: "Hansen, Su & Wang, 2024", u: "https://arxiv.org/abs/2310.16828", n: "Decoder-free latent dynamics with local trajectory optimisation, scaled to a single multi-task agent across 104 control tasks." },
  { t: "Deep RL in a Handful of Trials using Probabilistic Dynamics Models (PETS)", a: "Chua et al., 2018", u: "https://arxiv.org/abs/1805.12114", n: "Ensembles and trajectory sampling: the standard attempt to make uncertainty part of the plan rather than an afterthought." },
  { t: "Dyna: an Integrated Architecture for Learning, Planning and Reacting", a: "Sutton, 1991", u: "https://mlanthology.org/icml/1990/sutton1990icml-integrated/", n: "Planning defined as computation over a learned model, and the loop that interleaves it with real experience." },
  { t: "Making the World Differentiable: On Using Self-Supervised Fully Recurrent Neural Networks for Dynamic Reinforcement Learning and Planning in Non-Stationary Environments (FKI-126-90)", a: "Schmidhuber, 1990", u: "https://people.idsia.ch/~juergen/world-models-planning-curiosity-fki-1990.html", n: "The controller and the world model kept as separate objects, which is the distinction this chapter opens on." },
  { t: "Planning with an Adaptive World Model", a: "Thrun, Möller & Linden, 1990", u: "https://papers.nips.cc/paper_files/paper/1990/hash/9be40cee5b0eee1462c82c6964087ff9-Abstract.html", n: "A learned world model built through interaction and then chained to optimise future actions, twenty-eight years before the label stuck." },
  { t: "When to Trust Your Model: Model-Based Policy Optimization", a: "Janner et al., 2019", u: "https://arxiv.org/abs/1906.08253", n: "Short rollouts branched from real states, as a direct answer to compounding error and exploitation. The title is the chapter's question." },
  { t: "Benchmarking Model-Based Reinforcement Learning", a: "Wang et al., 2019", u: "https://arxiv.org/abs/1907.02057", n: "Where model-based methods actually win and lose, and where the planning horizon dilemma gets named and measured." },
  { t: "Calibrated Model-Based Deep Reinforcement Learning", a: "Malik et al., 2019", u: "https://arxiv.org/abs/1906.08312", n: "The warning underneath every uncertainty method: the uncertainty estimate can itself be wrong, and calibrating it changes planning results." },
  { t: "MOPO: Model-based Offline Policy Optimization", a: "Yu et al., 2020", u: "https://arxiv.org/abs/2005.13239", n: "Pessimism made explicit. Penalise predicted reward by model uncertainty, so an unfamiliar shortcut has to pay for being unfamiliar." },
];

/**
 * The notes, in Chinese. Titles and author lines stay in the original: they are
 * what you type into a search box, and translating them would make the source
 * harder to find rather than easier.
 */
const NOTES_ZH: Record<string, string> = {
  "https://www.worldlabs.ai/blog/taxonomy-of-world-models": "第一方给出的渲染器／仿真器／规划器三分法，是从智能体循环推出来的。",
  "https://doi.org/10.1115/1.3662552": "隐藏状态这条线的祖先。需付费。",
  "https://people.idsia.ch/~juergen/world-models-planning-curiosity-fki-1990.html": "把控制器和世界模型当作两个分开的对象，也就是这一章开头讲的那个区分。",
  "https://arxiv.org/abs/1803.10122": "编码器、潜在动力学、紧凑控制器，还包括把策略完全放在模型生成的环境里训练、再搬回真实环境的实验。",
  "https://arxiv.org/abs/1811.04551": "从图像里学出随机潜在动力学，然后在决策时对它做搜索。图 2.4 的真实版本。",
  "https://arxiv.org/abs/1912.01603": "在想象出来的潜在轨迹上训练 actor 和 critic，于是动手的那一刻不必再跑昂贵的搜索。",
  "https://www.nature.com/articles/s41586-025-08744-2": "同一个算法、同一套超参数，跑了 150 多个任务。这是想象这一支目前最强的证据。",
  "https://arxiv.org/abs/1911.08265": "最清楚的一个证明：规划并不需要重建观测。模型只学搜索会消费的那些量。",
  "https://arxiv.org/abs/2310.16828": "没有解码器的潜在动力学，配上局部轨迹优化，扩展到覆盖 104 个控制任务的单个多任务智能体。",
  "https://arxiv.org/abs/1805.12114": "集成加轨迹采样：把不确定性做进规划里，而不是当作事后补丁的标准做法。",
  "https://mlanthology.org/icml/1990/sutton1990icml-integrated/": "把规划定义成在学出来的模型上做计算，以及那个把它和真实经验交织起来的循环。",
  "https://papers.nips.cc/paper_files/paper/1990/hash/9be40cee5b0eee1462c82c6964087ff9-Abstract.html": "通过交互学出一个世界模型，再把它串起来优化未来的动作，比这个标签流行起来早了二十八年。",
  "https://arxiv.org/abs/1906.08253": "从真实状态出发的短推演，直接回应累积误差和模型利用。标题就是这一章的问题。",
  "https://arxiv.org/abs/1907.02057": "基于模型的方法到底在哪里赢、在哪里输，以及「往前看多远」这个两难在哪里被命名和度量。",
  "https://arxiv.org/abs/1906.08312": "每一种不确定性方法底下的那句警告：不确定性估计本身可能就是错的，而校正它会改变规划的结果。",
  "https://arxiv.org/abs/2005.13239": "把悲观写进目标：按模型的不确定性给预测回报打折，于是面生的捷径必须为「面生」付出代价。",
  "https://openreview.net/forum?id=BZ5a1r-kVsf": "整个论点的出处，包括为什么对一个要去行动的系统来说，预测外观是错的活。",
  "https://arxiv.org/abs/2006.07733": "那份缓慢更新的目标副本，以及那个让大家相信「不把东西推开也能避免塌缩」的结果。",
  "https://arxiv.org/abs/2105.04906": "显式的做法：惩罚那些各个分量已经塌掉或互相重复的表征。图 7.6 里那道防护的正经版本。",
  "https://arxiv.org/abs/2304.12210": "一份诚实的综述，包括这个领域有多大一部分是「防止平凡解获胜」的机器。",
  "https://arxiv.org/abs/2111.06377": "值得记住的反例：把被遮住那部分的像素重建出来，结果照样非常好用。",
  "https://arxiv.org/abs/2404.08471": "嵌入预测这个目标最后到底学到了什么，是测出来的，不是断言出来的。",
  "https://arxiv.org/abs/2301.08243": "预测被遮住区域的表征，而不是像素。",
  "https://ai.meta.com/blog/v-jepa-2-world-model-benchmarks/": "先做无动作预训练，再做动作条件下的控制。",
  "https://arxiv.org/abs/2408.14837": "DOOM 被逐帧地从此前的帧和输入里生成出来，快到可以玩。最清楚地说明了这类东西是可玩的，而不只是可看的。",
  "https://arxiv.org/abs/2411.02385": "图 8.7 的实测版本。视频模型在训练分布之内符合物理规律，出了这个范围就不会外推。",
  "https://openai.com/index/video-generation-models-as-world-simulators/": "让「涌现出物理」这个说法进入主流的那份报告。值得读一读它究竟主张了什么、又没主张什么。",
  "https://arxiv.org/abs/2501.03575": "把生成视频当作机器人和车辆的训练数据来造，而这正是这类系统毫无争议地擅长的用途。",
  "https://arxiv.org/abs/2311.17982": "对这个测量问题一次认真的尝试，也很适合用来看清：要拆到多少个互相独立的维度之后，排序才会变得不再显然。",
  "https://arxiv.org/abs/2402.15391": "可以用动作操控的生成环境。",
  "https://deepmind.google/blog/genie-3-a-new-frontier-for-world-models/": "报告称能在多分钟的交互里回想起先前见过的细节。",
  "https://www.worldlabs.ai/blog/marble-world-model": "高斯泼溅加碰撞网格：一次显式的结构导出。",
  "https://www.nvidia.com/en-us/ai/cosmos/": "一个边界案例：预测式视频世界与显式仿真并置。",
  "https://arxiv.org/abs/2210.13382": "在 Othello-GPT 内部找到棋盘状态，并且能对它做因果干预。",
  "https://arxiv.org/abs/2309.00941": "把这个发现进一步锐化的后续工作。",
  "https://arxiv.org/abs/2010.02193": "同一个循环，做到了它开始打败那些直接从环境里学的智能体的规模。",
  "https://arxiv.org/abs/1703.06907": "同一个想法从机器人学那边过来：让模拟器的变化比现实还大，于是没有任何东西能依赖它的某一个版本。",
  "https://arxiv.org/abs/1910.07113": "把随机化推到足以把策略从模拟搬到真实硬件上，以及对这件事代价的一份诚实交代。",
  "https://arxiv.org/abs/1506.03099": "把这个错配点了名，并正面处理：训练时就让模型吃自己的预测，而且随着它变好逐步加量。",
  "https://arxiv.org/abs/1511.06732": "给整段推演打分，而不是给单步打分，好让被优化的东西就是你真正要跑的那个东西。",
  "https://arxiv.org/abs/1706.03762": "另一个答案：别再做摘要了，把每一步都留着，代价是开销随长度增长。",
  "https://arxiv.org/abs/2111.00396": "「做摘要」这条路带着更好的机器回来了，也是状态空间模型重新进入讨论的原因。",
  "https://arxiv.org/abs/2312.00752": "一份会根据自己正在看的东西来决定留什么的摘要，而这正是固定版本做不到的那个让步。",
  "https://doi.org/10.1162/neco.1997.9.8.1735": "那份固定摘要，被做成能比梯度愿意的更久地抓住一些东西。需付费。",
  "https://arxiv.org/abs/1312.6114": "变分自编码器。它加进去的噪声，正是这个空间最后能被走通、而不是变成一堆互不相干的地址的原因。",
  "https://doi.org/10.1126/science.1127647": "在有现代机器撑腰之前的瓶颈论证。需付费。",
  "https://arxiv.org/abs/1711.00937": "当那份简短描述被强制变成少数几个离散符号、而不是连续数字时，会发生什么。",
  "https://openreview.net/forum?id=Sy2fzU9gl": "把瓶颈上的压力调大，坐标轴就开始对上一些你叫得出名字的东西。这篇也很好地展示了那样做的代价。",
  "https://arxiv.org/abs/1606.05579": "「一个好的表征，是它的各个方向都有含义」这个主张，写在这个领域还不拥挤的时候。",
  "https://arxiv.org/abs/1811.12359": "证明一个重要边界：没有归纳偏置，纯无监督的解耦在一般情况下不可识别。瓶颈会施加压力，却不会自动给坐标轴命名。",
  "https://arxiv.org/abs/1610.09038": "不直接安排模型吃多少自己的输出，而是让教师强制和自由运行时的隐藏轨迹彼此相像。恢复能力必须进入训练目标。",
  "https://arxiv.org/abs/1710.11252": "像素预测对模糊问题的真正反驳：学习未来的分布，并从中采样清晰、各自可能的结果。",
  "https://arxiv.org/abs/2608.13552": "面向可交互世界模型的新基准：171 个场景，分别测试几何、交互保真度，以及物体离开和重返视野时的演化。",
  "https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf": "一个符号的代价在这里变成了「你给它的概率」。预测与压缩是同一件事，一切都从这儿开始。",
  "https://doi.org/10.1002/j.1538-7305.1951.tb01366.x": "香农让人坐下来，一个字母一个字母地猜英文。图 3.10 最下面那一行大致就是他测出来的。",
  "https://doi.org/10.1207/s15516709cog1402_1": "训练一个小网络去预测下一个词，然后往里看：名词、动词、有生命与无生命，没有一样是被要求过的。",
  "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf": "把「预测下一个词」放大之后，长出了没有人训练过的能力。这是「目标选择才是那个设计决定」最有力的证据。",
  "http://prize.hutter1.net/": "一项压缩维基百科快照的现金悬赏，理由是：不建模文本的含义，你就压不动它。",
  "https://arxiv.org/abs/1206.5538": "这篇综述梳理了「一个好的学出来的表征是拿来干什么的」，写在预测彻底赢下这场争论之前。",
  "https://people.idsia.ch/~juergen/creativity.html": "把压缩进展本身当作一种驱动力：它不只是衡量模型的尺子，也是跑去看点什么的理由。",
};

const SOURCES_CH3 = [
  { t: "A Mathematical Theory of Communication", a: "Shannon, 1948", u: "https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf", n: "Where the price of a symbol becomes the probability you gave it. Everything about prediction and compression being one job starts here." },
  { t: "Prediction and Entropy of Printed English", a: "Shannon, 1951", u: "https://doi.org/10.1002/j.1538-7305.1951.tb01366.x", n: "Claude Shannon sat people down and had them guess English one letter at a time. The bottom row of Figure 3.10 is roughly what he measured." },
  { t: "Finding Structure in Time", a: "Elman, 1990", u: "https://doi.org/10.1207/s15516709cog1402_1", n: "Train a small network to predict the next word, then look inside: nouns, verbs, animate and inanimate, none of it asked for." },
  { t: "Emergent World Representations", a: "Li et al., 2022", u: "https://arxiv.org/abs/2210.13382", n: "A network given nothing but legal Othello moves, with the board found inside it and causally manipulated." },
  { t: "Othello-GPT has a linear emergent world representation", a: "Nanda et al., 2023", u: "https://arxiv.org/abs/2309.00941", n: "The follow-up that sharpened what the probe was actually reading." },
  { t: "Language Models are Unsupervised Multitask Learners", a: "Radford et al., 2019", u: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf", n: "Next-word prediction, scaled, turning into capabilities nobody trained for. The strongest evidence that the target choice is the design decision." },
  { t: "The Hutter Prize", a: "Hutter, ongoing", u: "http://prize.hutter1.net/", n: "A cash prize for compressing a snapshot of Wikipedia, run on the argument that you cannot squeeze text further without modelling what it means." },
  { t: "Representation Learning: A Review and New Perspectives", a: "Bengio, Courville & Vincent, 2013", u: "https://arxiv.org/abs/1206.5538", n: "The survey that laid out what a good learned representation is for, written before prediction had finished winning the argument." },
  { t: "Formal theory of creativity, fun, and intrinsic motivation", a: "Schmidhuber, 2010", u: "https://people.idsia.ch/~juergen/creativity.html", n: "Compression progress as a drive in its own right: not just a way to measure a model, but a reason to go and look at something." },
];

const SOURCES_CH4 = [
  { t: "Challenging Common Assumptions in the Unsupervised Learning of Disentangled Representations", a: "Locatello et al., 2019", u: "https://arxiv.org/abs/1811.12359", n: "The result that prevents a bottleneck from being magic: without inductive biases, unsupervised disentanglement is impossible in general and the axes are not identifiable." },
  { t: "Auto-Encoding Variational Bayes", a: "Kingma & Welling, 2013", u: "https://arxiv.org/abs/1312.6114", n: "The variational autoencoder. The noise it adds is the reason the space ends up navigable instead of a scatter of unrelated addresses." },
  { t: "Reducing the Dimensionality of Data with Neural Networks", a: "Hinton & Salakhutdinov, 2006", u: "https://doi.org/10.1126/science.1127647", n: "The bottleneck argument before it had modern machinery behind it. Paywalled." },
  { t: "World Models", a: "Ha & Schmidhuber, 2018", u: "https://arxiv.org/abs/1803.10122", n: "Every frame crushed to thirty-two numbers, and everything after that working only from those. The clearest example of the squeeze in a working agent." },
  { t: "Learning Latent Dynamics for Planning from Pixels (PlaNet)", a: "Hafner et al., 2018", u: "https://arxiv.org/abs/1811.04551", n: "Encodes pixels to a compact state and then plans in it, without ever rebuilding a frame in order to decide anything." },
  { t: "Neural Discrete Representation Learning (VQ-VAE)", a: "van den Oord et al., 2017", u: "https://arxiv.org/abs/1711.00937", n: "What happens when the short list is forced to be a handful of discrete symbols rather than continuous numbers." },
  { t: "beta-VAE", a: "Higgins et al., 2017", u: "https://openreview.net/forum?id=Sy2fzU9gl", n: "Turn the pressure on the bottleneck up and the axes start to line up with things you can name. Also a good demonstration of what that costs." },
  { t: "Early Visual Concept Learning with Unsupervised Deep Learning", a: "Higgins et al., 2016", u: "https://arxiv.org/abs/1606.05579", n: "The argument that a good representation is one whose directions mean something, written before it was a crowded field." },
  { t: "Representation Learning: A Review and New Perspectives", a: "Bengio, Courville & Vincent, 2013", u: "https://arxiv.org/abs/1206.5538", n: "Still the best single statement of what a learned representation is supposed to be for, and of how many of these questions were already open." },
];

const SOURCES_CH5 = [
  { t: "Professor Forcing: A New Algorithm for Training Recurrent Networks", a: "Lamb et al., 2016", u: "https://arxiv.org/abs/1610.09038", n: "Aligns hidden-state trajectories under teacher forcing with those produced during free running. A direct attempt to train the recovery behaviour a one-step test never asks for." },
  { t: "Scheduled Sampling for Sequence Prediction with Recurrent Neural Networks", a: "Bengio et al., 2015", u: "https://arxiv.org/abs/1506.03099", n: "The mismatch named and attacked head on: let the model eat its own predictions during training, and raise the dose as it improves." },
  { t: "Sequence Level Training with Recurrent Neural Networks", a: "Ranzato et al., 2015", u: "https://arxiv.org/abs/1511.06732", n: "Score the whole rollout rather than the single step, so the thing being optimised is the thing you will actually run." },
  { t: "Learning Latent Dynamics for Planning from Pixels (PlaNet)", a: "Hafner et al., 2018", u: "https://arxiv.org/abs/1811.04551", n: "The argument for carrying a deterministic part and a stochastic part together, because each one fails alone in a different direction." },
  { t: "Dream to Control (Dreamer)", a: "Hafner et al., 2019", u: "https://arxiv.org/abs/1912.01603", n: "What a latent transition model is for once it works: long imagined rollouts that behaviour can be learned from." },
  { t: "Long Short-Term Memory", a: "Hochreiter & Schmidhuber, 1997", u: "https://doi.org/10.1162/neco.1997.9.8.1735", n: "The fixed summary, made to hold on to things for longer than the gradient wanted it to. Paywalled." },
  { t: "Attention Is All You Need", a: "Vaswani et al., 2017", u: "https://arxiv.org/abs/1706.03762", n: "The other answer: retain the available context and choose what to read at each step, paying a cost that grows with sequence length." },
  { t: "Efficiently Modeling Long Sequences with Structured State Spaces (S4)", a: "Gu et al., 2021", u: "https://arxiv.org/abs/2111.00396", n: "The summary approach returning with better machinery, and the reason state-space models are back in the conversation." },
  { t: "Mamba: Linear-Time Sequence Modeling with Selective State Spaces", a: "Gu & Dao, 2023", u: "https://arxiv.org/abs/2312.00752", n: "A summary that decides what to keep based on what it is looking at, which is the concession the fixed version could not make." },
];

const SOURCES_CH6 = [
  { t: "World Models", a: "Ha & Schmidhuber, 2018", u: "https://arxiv.org/abs/1803.10122", n: "The agent trained entirely inside its own dream, the policy that stopped the dream producing fireballs, and the temperature dial that closed the gap. This chapter in one paper." },
  { t: "Dream to Control (Dreamer)", a: "Hafner et al., 2019", u: "https://arxiv.org/abs/1912.01603", n: "Behaviour learned from long imagined rollouts, with the actor and critic never touching the environment during training." },
  { t: "Mastering Atari with Discrete World Models (DreamerV2)", a: "Hafner et al., 2020", u: "https://arxiv.org/abs/2010.02193", n: "The same loop at a scale where it started beating agents that learn directly from the environment." },
  { t: "Mastering diverse control tasks through world models (DreamerV3)", a: "Hafner et al., Nature 2025", u: "https://www.nature.com/articles/s41586-025-08744-2", n: "One configuration across more than 150 tasks, and the strongest available answer to whether learning in imagination generalises." },
  { t: "Dyna: an Integrated Architecture for Learning, Planning and Reacting", a: "Sutton, 1991", u: "https://mlanthology.org/icml/1990/sutton1990icml-integrated/", n: "The loop itself, thirty years early: act, fit a model, learn from experience the model made up, repeat." },
  { t: "When to Trust Your Model: Model-Based Policy Optimisation", a: "Janner et al., 2019", u: "https://arxiv.org/abs/1906.08253", n: "Short imagined rollouts branched from real states, which is the other way of stopping a policy from leaning on the model too far out." },
  { t: "Domain Randomization for Transferring Deep Neural Networks", a: "Tobin et al., 2017", u: "https://arxiv.org/abs/1703.06907", n: "The same idea arriving from robotics: make the simulator vary more than reality does, so nothing can depend on any one version of it." },
  { t: "Solving Rubik's Cube with a Robot Hand", a: "OpenAI et al., 2019", u: "https://arxiv.org/abs/1910.07113", n: "Randomisation pushed hard enough to carry a policy from simulation onto real hardware, with an account of what that cost." },
];

const SOURCES_CH7 = [
  { t: "Stochastic Variational Video Prediction (SV2P)", a: "Babaeizadeh et al., 2017", u: "https://arxiv.org/abs/1710.11252", n: "The real counterargument to deterministic blur: learn a distribution and draw distinct plausible futures instead of returning their pixelwise mean." },
  { t: "A Path Towards Autonomous Machine Intelligence", a: "LeCun, 2022", u: "https://openreview.net/forum?id=BZ5a1r-kVsf", n: "The position paper the whole argument comes from, including why predicting appearances is the wrong job for a system meant to act." },
  { t: "I-JEPA", a: "Assran et al., 2023", u: "https://arxiv.org/abs/2301.08243", n: "Hide part of an image and predict the embedding of the missing piece rather than redrawing it. The clean statement of the method." },
  { t: "V-JEPA 2", a: "Meta AI, 2025", u: "https://ai.meta.com/blog/v-jepa-2-world-model-benchmarks/", n: "The video version, pre-trained without actions and then post-trained for control, which is where the argument meets a robot." },
  { t: "Bootstrap Your Own Latent (BYOL)", a: "Grill et al., 2020", u: "https://arxiv.org/abs/2006.07733", n: "The slowly-updating target copy, and the result that made people believe you could avoid collapse without pushing things apart." },
  { t: "VICReg", a: "Bardes, Ponce & LeCun, 2021", u: "https://arxiv.org/abs/2105.04906", n: "The explicit approach: penalise a representation whose components have collapsed or duplicated each other. Figure 7.6's safeguard, done properly." },
  { t: "A Cookbook of Self-Supervised Learning", a: "Balestriero et al., 2023", u: "https://arxiv.org/abs/2304.12210", n: "The survey that says how much of this field is machinery for stopping the trivial solution from winning." },
  { t: "Masked Autoencoders Are Scalable Vision Learners", a: "He et al., 2021", u: "https://arxiv.org/abs/2111.06377", n: "The counter-example worth holding on to: reconstruct the pixels of the masked part, and it works very well anyway." },
  { t: "Learning and Leveraging World Models in Visual Representation Learning", a: "Garrido et al., 2024", u: "https://arxiv.org/abs/2404.08471", n: "What the embedding-prediction objective turns out to have learned, tested rather than asserted." },
];

const SOURCES_CH8 = [
  { t: "Genie: Generative Interactive Environments", a: "Bruce et al., 2024", u: "https://arxiv.org/abs/2402.15391", n: "Latent actions learned from unlabelled video, which is the move that turns a video model into somewhere you can be." },
  { t: "Genie 3", a: "Google DeepMind, 2025", u: "https://deepmind.google/blog/genie-3-a-new-frontier-for-world-models/", n: "The reported numbers this chapter quotes: 720p, 24 frames a second, minutes of coherence. A lab report rather than a result anyone outside has repeated." },
  { t: "Diffusion Models Are Real-Time Game Engines (GameNGen)", a: "Valevski et al., 2024", u: "https://arxiv.org/abs/2408.14837", n: "DOOM generated frame by frame from previous frames and inputs, fast enough to play. The clearest demonstration that this is playable rather than merely watchable." },
  { t: "How Far is Video Generation from World Model: A Physical Law Perspective", a: "Kang et al., 2024", u: "https://arxiv.org/abs/2411.02385", n: "The measured version of Figure 8.7. Video models match physical laws within the distribution they were trained on, and do not extrapolate outside it." },
  { t: "Video generation models as world simulators", a: "OpenAI, 2024", u: "https://openai.com/index/video-generation-models-as-world-simulators/", n: "The report that made the emergent-physics claim a mainstream one. Worth reading for exactly what it does and does not assert." },
  { t: "Cosmos World Foundation Model Platform for Physical AI", a: "NVIDIA, 2025", u: "https://arxiv.org/abs/2501.03575", n: "Generated video built as training data for robots and vehicles, which is the use these systems are unambiguously good for." },
  { t: "Cosmos", a: "NVIDIA", u: "https://www.nvidia.com/en-us/ai/cosmos/", n: "The product framing, and a useful boundary case: generative video beside explicit simulation, sold as one platform." },
];

const SOURCES_CH9 = [
  { t: "PlayWorld: A Benchmark for Interactive World Models", a: "Zhang et al., 2026", u: "https://arxiv.org/abs/2608.13552", n: "A current benchmark spanning 171 scenarios and separating geometry, interaction fidelity, and out-of-sight evolution rather than pretending world quality is one number." },
  { t: "How Far is Video Generation from World Model: A Physical Law Perspective", a: "Kang et al., 2024", u: "https://arxiv.org/abs/2411.02385", n: "Physical laws matched inside the training distribution and not extrapolated outside it. The clearest measured statement of the gap this chapter is about." },
  { t: "VBench: Comprehensive Benchmark Suite for Video Generative Models", a: "Huang et al., 2023", u: "https://arxiv.org/abs/2311.17982", n: "A serious attempt at the measurement problem, and useful for seeing how many separate dimensions it takes before the ordering stops being obvious." },
  { t: "Benchmarking Model-Based Reinforcement Learning", a: "Wang et al., 2019", u: "https://arxiv.org/abs/1907.02057", n: "Where model-based methods win and lose, and the discovery that the planning horizon is the number that decides it." },
  { t: "When to Trust Your Model: Model-Based Policy Optimisation", a: "Janner et al., 2019", u: "https://arxiv.org/abs/1906.08253", n: "Short rollouts as an answer to a model you cannot trust for long. The title is this chapter's question." },
  { t: "Emergent World Representations", a: "Li et al., 2022", u: "https://arxiv.org/abs/2210.13382", n: "The strongest available evidence that something structured forms inside a predictor, and a good example of what it takes to show it rather than assert it." },
  { t: "Genie 3", a: "Google DeepMind, 2025", u: "https://deepmind.google/blog/genie-3-a-new-frontier-for-world-models/", n: "Reported coherence over minutes, from the lab that built it. Included as an example of exactly the kind of claim this chapter is asking you to read carefully." },
  { t: "A Path Towards Autonomous Machine Intelligence", a: "LeCun, 2022", u: "https://openreview.net/forum?id=BZ5a1r-kVsf", n: "The most complete statement of what a world model would have to do to be worth the name, which doubles as a list of what is still missing." },
];

export function SourceListFor({ chapter = 1 }: { chapter?: number }) {
  const locale = useLocale();
  const rows =
    chapter === 9
      ? SOURCES_CH9
      : chapter === 8
      ? SOURCES_CH8
      : chapter === 7
      ? SOURCES_CH7
      : chapter === 6
      ? SOURCES_CH6
      : chapter === 5
      ? SOURCES_CH5
      : chapter === 4
      ? SOURCES_CH4
      : chapter === 3
        ? SOURCES_CH3
        : chapter === 2
          ? SOURCES_CH2
          : SOURCES_CH1;
  return (
    <ol className="border-t border-ink">
      {rows.map((s) => (
        <li key={s.u} className="border-b border-rule">
          <a href={s.u} target="_blank" rel="noopener noreferrer"
            className="group flex flex-col gap-1.5 px-5 py-5 transition-colors hover:bg-paper-raised md:px-6">
            <span className="flex flex-wrap items-baseline gap-x-3">
              <span className="text-[1rem] leading-snug group-hover:text-imagine">{s.t}</span>
              <span className="label !text-[0.62rem]">{s.a}</span>
              <span aria-hidden className="text-[0.7rem] text-ink-faint">&#8599;</span>
            </span>
            <span className="text-[0.88rem] leading-relaxed text-ink-muted">
              {(locale === "zh" && NOTES_ZH[s.u]) || s.n}
            </span>
          </a>
        </li>
      ))}
    </ol>
  );
}

export function SourceList({ chapter = 1 }: { chapter?: number }) {
  return <SourceListFor chapter={chapter} />;
}
