"use client";

import { useLocale } from "./locale-provider";
const SOURCES_CH1 = [
  { t: "A Functional Taxonomy of World Models", a: "World Labs, 2026", u: "https://www.worldlabs.ai/blog/taxonomy-of-world-models", n: "First-party renderer/simulator/planner split, derived from the agent loop." },
  { t: "A New Approach to Linear Filtering and Prediction Problems", a: "Kalman, 1960", u: "https://doi.org/10.1115/1.3662552", n: "The hidden-state ancestor. Paywalled." },
  { t: "Recurrent world models for planning and curiosity", a: "Schmidhuber, 1990", u: "https://people.idsia.ch/~juergen/world-models-planning-curiosity-fki-1990.html", n: "A recurrent model predicting the consequences of a controller's actions." },
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
  { t: "Learning Latent Dynamics for Planning from Pixels (PlaNet)", a: "Hafner et al., 2018", u: "https://arxiv.org/abs/1811.04551", n: "Stochastic latent dynamics learned from images, then searched over at decision time. Figure 2.2 in its real form." },
  { t: "Dream to Control (Dreamer)", a: "Hafner et al., 2019", u: "https://arxiv.org/abs/1912.01603", n: "Actor and critic trained on imagined latent trajectories, so no expensive search has to run at the moment of acting." },
  { t: "Mastering diverse control tasks through world models (DreamerV3)", a: "Hafner et al., Nature 2025", u: "https://www.nature.com/articles/s41586-025-08744-2", n: "One algorithm and one hyperparameter setting across more than 150 tasks. The strongest recent evidence for the imagination branch." },
  { t: "Mastering Atari, Go, chess and shogi by planning with a learned model (MuZero)", a: "Schrittwieser et al., 2020", u: "https://arxiv.org/abs/1911.08265", n: "The clearest proof that planning needs no reconstruction of observations. The model learns only what the search consumes." },
  { t: "TD-MPC2: Scalable, Robust World Models for Continuous Control", a: "Hansen, Su & Wang, 2024", u: "https://arxiv.org/abs/2310.16828", n: "Decoder-free latent dynamics with local trajectory optimisation, scaled to a single multi-task agent across 104 control tasks." },
  { t: "Deep RL in a Handful of Trials using Probabilistic Dynamics Models (PETS)", a: "Chua et al., 2018", u: "https://arxiv.org/abs/1805.12114", n: "Ensembles and trajectory sampling: the standard attempt to make uncertainty part of the plan rather than an afterthought." },
  { t: "Dyna: an Integrated Architecture for Learning, Planning and Reacting", a: "Sutton, 1991", u: "https://mlanthology.org/icml/1990/sutton1990icml-integrated/", n: "Planning defined as computation over a learned model, and the loop that interleaves it with real experience." },
  { t: "Recurrent world models for planning and curiosity", a: "Schmidhuber, 1990", u: "https://people.idsia.ch/~juergen/world-models-planning-curiosity-fki-1990.html", n: "The controller and the world model kept as separate objects, which is the distinction this chapter opens on." },
  { t: "Planning with an Adaptive World Model", a: "Thrun, Möller & Linden, 1990", u: "https://papers.nips.cc/paper_files/paper/1990/hash/9be40cee5b0eee1462c82c6964087ff9-Abstract.html", n: "A learned world model built through interaction and then chained to optimise future actions, twenty-eight years before the label stuck." },
  { t: "When to Trust Your Model: Model-Based Policy Optimization", a: "Janner et al., 2019", u: "https://arxiv.org/abs/1906.08253", n: "Short rollouts branched from real states, as a direct answer to compounding error and exploitation. The title is the chapter's question." },
  { t: "Benchmarking Model-Based Reinforcement Learning", a: "Wang et al., 2019", u: "https://arxiv.org/abs/1907.02057", n: "Where model-based methods actually win and lose, and where the planning horizon dilemma gets named and measured." },
  { t: "Calibrated Model-Based Deep Reinforcement Learning", a: "Malik et al., 2019", u: "https://arxiv.org/abs/1906.08312", n: "The warning underneath every uncertainty method: the uncertainty estimate can itself be wrong, and calibrating it changes planning results." },
  { t: "MOPO: Model-based Offline Policy Optimization", a: "Yu et al., 2020", u: "https://arxiv.org/abs/2005.13239", n: "Pessimism made explicit. Penalise predicted reward by model uncertainty, so an unfamiliar shortcut has to pay for being unfamiliar." },
  { t: "Quantifying the nature of anticipation in professional tennis", a: "Triolet et al., 2013", u: "https://doi.org/10.1080/02640414.2012.759658", n: "Match analysis placing the earliest possible reaction to the ball around 140 to 160 ms after contact. Paywalled." },
  { t: "The spatiotemporal control of expert tennis players when returning first serves", a: "Navia et al., 2021", u: "https://doi.org/10.1080/02640414.2021.1976484", n: "Where the 177 ms figure in the opening comes from, measured rather than estimated. Paywalled." },
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
  "https://arxiv.org/abs/2301.08243": "预测被遮住区域的表征，而不是像素。",
  "https://ai.meta.com/blog/v-jepa-2-world-model-benchmarks/": "先做无动作预训练，再做动作条件下的控制。",
  "https://arxiv.org/abs/2402.15391": "可以用动作操控的生成环境。",
  "https://deepmind.google/blog/genie-3-a-new-frontier-for-world-models/": "报告称能在多分钟的交互里回想起先前见过的细节。",
  "https://www.worldlabs.ai/blog/marble-world-model": "高斯泼溅加碰撞网格：一次显式的结构导出。",
  "https://www.nvidia.com/en-us/ai/cosmos/": "一个边界案例：预测式视频世界与显式仿真并置。",
  "https://arxiv.org/abs/2210.13382": "在 Othello-GPT 内部找到棋盘状态，并且能对它做因果干预。",
  "https://arxiv.org/abs/2309.00941": "把这个发现进一步锐化的后续工作。",
  "https://arxiv.org/abs/1312.6114": "变分自编码器。它加进去的噪声，正是这个空间最后能被走通、而不是变成一堆互不相干的地址的原因。",
  "https://doi.org/10.1126/science.1127647": "在有现代机器撑腰之前的瓶颈论证。需付费。",
  "https://arxiv.org/abs/1711.00937": "当那份简短描述被强制变成少数几个离散符号、而不是连续数字时，会发生什么。",
  "https://openreview.net/forum?id=Sy2fzU9gl": "把瓶颈上的压力调大，坐标轴就开始对上一些你叫得出名字的东西。这篇也很好地展示了那样做的代价。",
  "https://arxiv.org/abs/1606.05579": "「一个好的表征，是它的各个方向都有含义」这个主张，写在这个领域还不拥挤的时候。",
  "https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf": "一个符号的代价在这里变成了「你给它的概率」。预测与压缩是同一件事，一切都从这儿开始。",
  "https://doi.org/10.1002/j.1538-7305.1951.tb01366.x": "香农让人坐下来，一个字母一个字母地猜英文。图 3.3 最下面那一行大致就是他测出来的。",
  "https://doi.org/10.1207/s15516709cog1402_1": "训练一个小网络去预测下一个词，然后往里看：名词、动词、有生命与无生命，没有一样是被要求过的。",
  "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf": "把「预测下一个词」放大之后，长出了没有人训练过的能力。这是「目标选择才是那个设计决定」最有力的证据。",
  "http://prize.hutter1.net/": "一项压缩维基百科快照的现金悬赏，理由是：不建模文本的含义，你就压不动它。",
  "https://arxiv.org/abs/1206.5538": "这篇综述梳理了「一个好的学出来的表征是拿来干什么的」，写在预测彻底赢下这场争论之前。",
  "https://people.idsia.ch/~juergen/creativity.html": "把压缩进展本身当作一种驱动力：它不只是衡量模型的尺子，也是跑去看点什么的理由。",
  "https://doi.org/10.1080/02640414.2012.759658": "比赛分析，把「最早可能是对球做出的反应」定在击球后大约 140 到 160 毫秒。需付费。",
  "https://doi.org/10.1080/02640414.2021.1976484": "开头那个 177 毫秒的出处，是测出来的，不是估出来的。需付费。",
};

const SOURCES_CH3 = [
  { t: "A Mathematical Theory of Communication", a: "Shannon, 1948", u: "https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf", n: "Where the price of a symbol becomes the probability you gave it. Everything about prediction and compression being one job starts here." },
  { t: "Prediction and Entropy of Printed English", a: "Shannon, 1951", u: "https://doi.org/10.1002/j.1538-7305.1951.tb01366.x", n: "Shannon sat people down and had them guess English one letter at a time. The bottom row of Figure 3.3 is roughly what he measured." },
  { t: "Finding Structure in Time", a: "Elman, 1990", u: "https://doi.org/10.1207/s15516709cog1402_1", n: "Train a small network to predict the next word, then look inside: nouns, verbs, animate and inanimate, none of it asked for." },
  { t: "Emergent World Representations", a: "Li et al., 2022", u: "https://arxiv.org/abs/2210.13382", n: "A network given nothing but legal Othello moves, with the board found inside it and causally manipulated." },
  { t: "Othello-GPT has a linear emergent world representation", a: "Nanda et al., 2023", u: "https://arxiv.org/abs/2309.00941", n: "The follow-up that sharpened what the probe was actually reading." },
  { t: "Language Models are Unsupervised Multitask Learners", a: "Radford et al., 2019", u: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf", n: "Next-word prediction, scaled, turning into capabilities nobody trained for. The strongest evidence that the target choice is the design decision." },
  { t: "The Hutter Prize", a: "Hutter, ongoing", u: "http://prize.hutter1.net/", n: "A cash prize for compressing a snapshot of Wikipedia, run on the argument that you cannot squeeze text further without modelling what it means." },
  { t: "Representation Learning: A Review and New Perspectives", a: "Bengio, Courville & Vincent, 2013", u: "https://arxiv.org/abs/1206.5538", n: "The survey that laid out what a good learned representation is for, written before prediction had finished winning the argument." },
  { t: "Formal theory of creativity, fun, and intrinsic motivation", a: "Schmidhuber, 2010", u: "https://people.idsia.ch/~juergen/creativity.html", n: "Compression progress as a drive in its own right: not just a way to measure a model, but a reason to go and look at something." },
];

const SOURCES_CH4 = [
  { t: "Auto-Encoding Variational Bayes", a: "Kingma & Welling, 2013", u: "https://arxiv.org/abs/1312.6114", n: "The variational autoencoder. The noise it adds is the reason the space ends up navigable instead of a scatter of unrelated addresses." },
  { t: "Reducing the Dimensionality of Data with Neural Networks", a: "Hinton & Salakhutdinov, 2006", u: "https://doi.org/10.1126/science.1127647", n: "The bottleneck argument before it had modern machinery behind it. Paywalled." },
  { t: "World Models", a: "Ha & Schmidhuber, 2018", u: "https://arxiv.org/abs/1803.10122", n: "Every frame crushed to thirty-two numbers, and everything after that working only from those. The clearest example of the squeeze in a working agent." },
  { t: "Learning Latent Dynamics for Planning from Pixels (PlaNet)", a: "Hafner et al., 2018", u: "https://arxiv.org/abs/1811.04551", n: "Encodes pixels to a compact state and then plans in it, without ever rebuilding a frame in order to decide anything." },
  { t: "Neural Discrete Representation Learning (VQ-VAE)", a: "van den Oord et al., 2017", u: "https://arxiv.org/abs/1711.00937", n: "What happens when the short list is forced to be a handful of discrete symbols rather than continuous numbers." },
  { t: "beta-VAE", a: "Higgins et al., 2017", u: "https://openreview.net/forum?id=Sy2fzU9gl", n: "Turn the pressure on the bottleneck up and the axes start to line up with things you can name. Also a good demonstration of what that costs." },
  { t: "Early Visual Concept Learning with Unsupervised Deep Learning", a: "Higgins et al., 2016", u: "https://arxiv.org/abs/1606.05579", n: "The argument that a good representation is one whose directions mean something, written before it was a crowded field." },
  { t: "Representation Learning: A Review and New Perspectives", a: "Bengio, Courville & Vincent, 2013", u: "https://arxiv.org/abs/1206.5538", n: "Still the best single statement of what a learned representation is supposed to be for, and of how many of these questions were already open." },
];

export function SourceListFor({ chapter = 1 }: { chapter?: number }) {
  const locale = useLocale();
  const rows =
    chapter === 4
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
