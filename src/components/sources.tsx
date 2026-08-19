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
  { t: "Dyna: an Integrated Architecture for Learning, Planning and Reacting", a: "Sutton, 1991", u: "https://mlanthology.org/icml/1990/sutton1990icml-integrated/", n: "Planning defined as computation over a learned model, and the loop that interleaves it with real experience." },
  { t: "World Models", a: "Ha & Schmidhuber, 2018", u: "https://arxiv.org/abs/1803.10122", n: "Encoder, dynamics, controller, with the policy trained almost entirely inside the model's rollouts." },
  { t: "Learning Latent Dynamics for Planning from Pixels (PlaNet)", a: "Hafner et al., 2018", u: "https://arxiv.org/abs/1811.04551", n: "Planning by search over action sequences in a learned latent space, which is Figure 2.2 in its real form." },
  { t: "Dream to Control (Dreamer)", a: "Hafner et al., 2019", u: "https://arxiv.org/abs/1912.01603", n: "Behaviour learned from long imagined rollouts rather than single-step lookahead." },
  { t: "When to Trust Your Model: Model-Based Policy Optimization", a: "Janner et al., 2019", u: "https://arxiv.org/abs/1906.08253", n: "Short rollouts as a direct answer to exploitation: the model is trusted only as far as it has earned." },
  { t: "Benchmarking Model-Based Reinforcement Learning", a: "Wang et al., 2019", u: "https://arxiv.org/abs/1907.02057", n: "Where model-based methods actually win and lose, including how often the planner exploits the model." },
  { t: "MOPO: Model-based Offline Policy Optimization", a: "Yu et al., 2020", u: "https://arxiv.org/abs/2005.13239", n: "Pessimism made explicit: penalise reward by model uncertainty so the planner stops being rewarded for going somewhere unknown." },
];

export function SourceListFor({ chapter = 1 }: { chapter?: number }) {
  const rows = chapter === 2 ? SOURCES_CH2 : SOURCES_CH1;
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
            <span className="text-[0.88rem] leading-relaxed text-ink-muted">{s.n}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

export function SourceList({ chapter = 1 }: { chapter?: number }) {
  return <SourceListFor chapter={chapter} />;
}
