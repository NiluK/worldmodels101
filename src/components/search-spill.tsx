import { DefinitionGlyph } from "./definition-glyph";

/**
 * What you actually get when you search the phrase, laid out as the thing it
 * describes. Each row is one of the five definitions, so the reader meets the
 * taxonomy as a list of real artefacts they can go and open before it is ever
 * presented as a taxonomy.
 */
const RESULTS = [
  {
    definition: "renderer",
    what: "A DeepMind demo where somebody walks through a generated landscape with the arrow keys.",
    href: "https://deepmind.google/blog/genie-3-a-new-frontier-for-world-models/",
    cite: "Genie 3 · Google DeepMind",
    turns: "Renderer",
  },
  {
    definition: "representation",
    what: "A Meta paper about predicting video embeddings that never shows you a video.",
    href: "https://ai.meta.com/blog/v-jepa-2-world-model-benchmarks/",
    cite: "V-JEPA 2 · Meta AI",
    turns: "Representation",
  },
  {
    definition: "simulator",
    what: "A 3-D environment you can load straight into Blender.",
    href: "https://www.worldlabs.ai/blog/marble-world-model",
    cite: "Marble · World Labs",
    turns: "Simulator",
  },
  {
    definition: "controller",
    what: "A reinforcement learning result from 2018 about a car in a racing game.",
    href: "https://worldmodels.github.io/",
    cite: "World Models · Ha & Schmidhuber",
    turns: "Controller",
  },
  {
    definition: "implicit",
    what: "An argument, conducted mostly at volume, about whether a language model that has never seen a chessboard has one inside it anyway.",
    href: "https://arxiv.org/abs/2210.13382",
    cite: "Emergent World Representations · Li et al.",
    turns: "Implicit Model",
  },
];

export function SearchSpill() {
  return (
    <div className="border border-rule bg-paper-raised">
      <div className="flex items-center gap-3 border-b border-rule px-5 py-3">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="6.5" cy="6.5" r="4.75" stroke="var(--ink-muted)" strokeWidth="1.6" />
          <path d="M10 10 L14.5 14.5" stroke="var(--ink-muted)" strokeWidth="1.6" strokeLinecap="square" />
        </svg>
        <span className="font-mono text-[0.8rem] text-ink">&ldquo;world model&rdquo;</span>
        <span className="label ml-auto">5 incompatible answers</span>
      </div>

      <ol>
        {RESULTS.map((r) => (
          <li key={r.definition} className="group border-b border-rule last:border-b-0">
            <a
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-paper"
            >
              <DefinitionGlyph definition={r.definition} size={32} className="mt-0.5 shrink-0" />

              <span className="min-w-0 flex-1">
                <span className="block text-[1rem] leading-snug">{r.what}</span>
                <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-mono text-[0.72rem] text-imagine underline decoration-imagine/40 underline-offset-2 group-hover:decoration-imagine">
                    {r.cite}
                  </span>
                  <span aria-hidden className="text-[0.7rem] text-ink-faint">&#8599;</span>
                </span>
              </span>

              <span className="hidden shrink-0 pt-0.5 text-right sm:block">
                <span className="label !text-[0.6rem]">Turns out to be</span>
                <span className="mt-1 block font-mono text-[0.72rem] text-ink-muted transition-colors group-hover:text-imagine">
                  {r.turns}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
