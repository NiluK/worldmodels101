"use client";

import { useLocale } from "./locale-provider";
import { NOTE_BY_LOCALE } from "./source-notes";
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
  { t: "Language Models Represent Space and Time", a: "Gurnee & Tegmark, 2023", u: "https://arxiv.org/abs/2310.02207", n: "Probes recovering place and date from a language model, and the paper the argument over this sense of the term formed around." },
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
              {NOTE_BY_LOCALE[locale]?.[s.u] ?? s.n}
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
