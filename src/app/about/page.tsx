import type { Metadata } from "next";
import Link from "next/link";
import { CHAPTERS } from "@/lib/chapters";

export const metadata: Metadata = {
  title: "About",
  description:
    "What World Models 101 is, who it's for, how it's built, and how to correct it.",
};

const READING = [
  {
    label: "Craik, 1943",
    title: "The Nature of Explanation",
    note: "Where the 'small-scale model' framing comes from. Short, and still the clearest statement of the premise.",
  },
  {
    label: "Sutton, 1991",
    title: "Dyna: an integrated architecture for learning, planning and reacting",
    note: "Learning from real experience and imagined experience in the same loop.",
  },
  {
    label: "Ha & Schmidhuber, 2018",
    title: "World Models",
    note: "The paper that gave the field its name in its current sense. Encoder, dynamics, controller.",
  },
  {
    label: "LeCun, 2022",
    title: "A Path Towards Autonomous Machine Intelligence",
    note: "The position paper behind JEPA and the argument against pixel-space prediction.",
  },
];

export default function About() {
  return (
    <div className="track pt-16 pb-8 md:pt-24">
      <h1 className="display text-[clamp(2.6rem,8vw,5rem)] leading-[0.92]">About</h1>

      <div className="prose mt-12">
        <p className="text-[1.25rem] leading-[1.5]">
          World Models 101 is a free primer on how machines learn to predict
          what happens next. It exists because the literature on this is
          excellent and almost entirely unreadable unless you already know it.
        </p>

        <h2>The shape of it</h2>
        <p>
          {CHAPTERS.length} chapters, each built around something you can
          manipulate rather than something you have to take on faith. Where a
          concept has an interactive form, it gets one; where it does not, it
          gets a figure and a paragraph that says what the figure means. The
          order is pedagogical rather than chronological: ideas arrive
          when you need them, not when they were published.
        </p>
        <p>
          Chapters are released as they are finished. The{" "}
          <Link href="/#chapters">contents page</Link> marks what is live, what
          is being drafted, and what is still an outline. Nothing is paywalled
          and nothing will be.
        </p>

        <h2>What it assumes</h2>
        <p>
          That you are comfortable with a gradient, a probability distribution,
          and matrix multiplication. That you have trained a neural network at
          least once, even if only a small one. It does <em>not</em> assume any
          reinforcement learning. The RL you need is introduced where it
          is needed and no earlier.
        </p>

        <h2>Corrections</h2>
        <p>
          Technical writing on a moving field is wrong at a steady rate. If you
          find an error (a misattributed idea, a broken derivation, a
          demo that lies about what the underlying method does) the
          correction is genuinely welcome and will be credited. Open an issue,
          or write to the address below.
        </p>

        <h2>Where the ideas come from</h2>
      </div>

      <ul className="mt-8 border-t border-ink">
        {READING.map((r) => (
          <li key={r.title} className="border-b border-rule py-5">
            <p className="label">{r.label}</p>
            <p className="mt-1.5 text-[1.05rem]">{r.title}</p>
            <p className="mt-1.5 max-w-[54ch] text-[0.92rem] leading-relaxed text-ink-muted">
              {r.note}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-8 font-mono text-[0.78rem] leading-relaxed text-ink-muted">
        A full reading path lands with the final chapter.
      </p>
    </div>
  );
}
