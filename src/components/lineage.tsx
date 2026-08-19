const STOPS = [
  { when: "1960", who: "Kalman", what: "Hidden-state estimation from noisy observations", note: "An ancestor, not a member: a state estimator, not a learned action-conditioned model." },
  { when: "1990–91", who: "Schmidhuber · Sutton", what: "Recurrent model + controller; Dyna interleaves learning and planning", note: "Prediction gets tied to action for the first time." },
  { when: "2018", who: "World Models · PlaNet", what: "Learned latent dynamics from pixels", note: "Ha & Schmidhuber name it; PlaNet plans online in latent space." },
  { when: "2019–20", who: "Dreamer", what: "Behaviour learned from latent imagination", note: "The policy is trained almost entirely inside the model." },
  { when: "2023–25", who: "JEPA · V-JEPA 2", what: "Prediction moves into representation space", note: "The forecast becomes scaffolding; the features are the product." },
  { when: "2024–26", who: "Genie · Cosmos · Marble", what: "Generated interactive and spatial worlds", note: "The term travels to systems that output pixels and geometry." },
  { when: "2026", who: "Taxonomies appear", what: "Because the meanings have collided", note: "World Labs publishes a functional taxonomy of its own product category.", terminal: true },
];

export function Lineage() {
  return (
    <ol className="relative">
      <span aria-hidden className="absolute left-[7px] top-2 bottom-2 w-px bg-rule-strong sm:left-[calc(7rem+7px)]" />
      {STOPS.map((s) => (
        <li key={s.when} className="relative grid grid-cols-1 gap-x-6 gap-y-1.5 py-6 pl-8 pr-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:pl-0 sm:pr-6">
          <span
            aria-hidden
            className={`absolute left-0 top-[1.45rem] h-[15px] w-[15px] border-2 sm:left-[7rem] ${
              s.terminal ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"
            }`}
          />
          <span className="label tnum sm:text-right sm:pr-6">{s.when}</span>
          <div className="sm:pl-8">
            <p className="font-mono text-[0.78rem] uppercase tracking-[0.12em] text-imagine">{s.who}</p>
            <p className="mt-1 text-[1.02rem] leading-snug">{s.what}</p>
            <p className="mt-1 text-[0.9rem] leading-relaxed text-ink-muted">{s.note}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

const SOURCES = [
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

export function SourceList() {
  return (
    <ol className="border-t border-ink">
      {SOURCES.map((s) => (
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
