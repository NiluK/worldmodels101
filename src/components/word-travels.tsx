"use client";

import { useMemo, useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { useSweep } from "./use-sweep";
import { PlayButton } from "./play-button";
import { pickText } from "@/lib/locale-text";

/**
 * How one phrase was reached from four directions.
 *
 * Four traditions, one year axis. Each lane carries the papers the chapter
 * names, and the guide under each lane bends toward a single point at the
 * right edge labelled with the phrase itself. Scrubbing the year redraws the
 * map as it stood then: for most of the decade only one lane has anything on
 * it, and the lanes only visibly converge after 2022, which is the chapter's
 * claim in one picture. It is a map, not data: nothing here counts papers.
 */

type LaneId = "rl" | "rep" | "gen" | "interp";

type Milestone = {
  id: string;
  /** fractional, so that two papers in one year do not sit on top of each other */
  year: number;
  lane: LaneId | "all";
  /** desktop label placement */
  side: "a" | "b";
  anchor?: "start" | "middle" | "end";
  dx?: number;
};

const LANES: LaneId[] = ["rl", "rep", "gen", "interp"];

/** Date order. Positions within a year are layout, not chronology. */
const MILESTONES: Milestone[] = [
  { id: "dqn",       year: 2013.5,  lane: "rl",     side: "b" },
  { id: "wm",        year: 2018.15, lane: "rl",     side: "a" },
  { id: "planet",    year: 2018.85, lane: "rl",     side: "b" },
  { id: "dreamer",   year: 2019.6,  lane: "rl",     side: "a" },
  { id: "lecun",     year: 2022.3,  lane: "rep",    side: "a" },
  { id: "othello",   year: 2022.6,  lane: "interp", side: "b" },
  { id: "ijepa",     year: 2023.4,  lane: "rep",    side: "b" },
  { id: "nanda",     year: 2023.5,  lane: "interp", side: "a" },
  { id: "sora",      year: 2024.05, lane: "gen",    side: "a", anchor: "end", dx: 2 },
  { id: "genie",     year: 2024.3,  lane: "gen",    side: "b" },
  { id: "gamengen",  year: 2024.7,  lane: "gen",    side: "a" },
  { id: "cosmos",    year: 2025.05, lane: "gen",    side: "b" },
  { id: "dreamerv3", year: 2025.3,  lane: "rl",     side: "a" },
  { id: "vjepa2",    year: 2025.45, lane: "rep",    side: "a" },
  { id: "genie3",    year: 2025.5,  lane: "gen",    side: "a", anchor: "start", dx: 8 },
  { id: "marble",    year: 2025.9,  lane: "gen",    side: "b" },
  { id: "taxonomy",  year: 2026.7,  lane: "all",    side: "a" },
];

const Y0 = 2012.6;
const Y1 = 2026.7;
const YEAR_MIN = 2013;
const YEAR_MAX = 2026;

type MsText = { name: string; short: string; who: string; what: string; meant: string; hands: string };

const MS_TEXT: Record<string, Record<string, MsText>> = {
  en: {
    dqn: {
      name: "DQN", short: "DQN", who: "DeepMind, 2013",
      what: "Learned Atari games from pixels with no model of the game at all. Model-free had the momentum.",
      meant: "Nothing. It did not use the phrase. It is here as the contrast.",
      hands: "A policy, and no model.",
    },
    wm: {
      name: "World Models", short: "World Models", who: "David Ha and Jürgen Schmidhuber, 2018",
      what: "An encoder, a dynamics model and a small controller trained almost entirely inside the model's own imagined rollouts.",
      meant: "A learned model of what happens next, good enough to train inside.",
      hands: "Compact state: thirty-two numbers a frame.",
    },
    planet: {
      name: "PlaNet", short: "PlaNet", who: "Danijar Hafner and colleagues, 2018",
      what: "Learned latent dynamics straight from pixels, then planned in latent space, trying many action sequences at every step.",
      meant: "Latent dynamics you can search inside.",
      hands: "Compact state.",
    },
    dreamer: {
      name: "Dreamer", short: "Dreamer", who: "Danijar Hafner and colleagues, 2019",
      what: "Dream to Control: learned its behaviour from futures imagined inside the model instead of searching at every step.",
      meant: "Latent dynamics you can learn behaviour from.",
      hands: "Compact state.",
    },
    lecun: {
      name: "A Path Towards Autonomous Machine Intelligence", short: "LeCun", who: "Yann LeCun, Meta, 2022",
      what: "A position paper arguing that predicting every pixel of the next frame is the wrong job, because most pixels are detail nobody can predict.",
      meant: "A predictor of summaries, with no decoder.",
      hands: "An argument, and a plan for embeddings.",
    },
    othello: {
      name: "Othello-GPT", short: "Othello-GPT", who: "Kenneth Li and colleagues, 2022",
      what: "A small model trained only to predict legal Othello moves, never shown a board. A probe could read the board out of it, and intervening on it changed the moves.",
      meant: "A model of the world that grew inside a system trained for another job.",
      hands: "A claim about the inside of a network.",
    },
    ijepa: {
      name: "I-JEPA", short: "I-JEPA", who: "Mahmoud Assran and colleagues, Meta, 2023",
      what: "Hides part of an image and predicts the embedding of the missing piece. It does not redraw the pixels.",
      meant: "Predict the summary of what is missing, then throw the prediction away.",
      hands: "Embeddings.",
    },
    nanda: {
      name: "Othello-GPT has a linear emergent world representation", short: "Nanda", who: "Neel Nanda and colleagues, 2023",
      what: "The board was there in a form plain enough for the simplest probe, once you asked for mine and theirs instead of black and white.",
      meant: "The same claim, now readable by a linear probe.",
      hands: "A claim about the inside of a network.",
    },
    sora: {
      name: "Sora", short: "Sora", who: "OpenAI, February 2024",
      what: "A video generator, published with a report titled Video generation models as world simulators.",
      meant: "A video generator that behaves like a simulator.",
      hands: "Pixels.",
    },
    genie: {
      name: "Genie", short: "Genie", who: "Jake Bruce and colleagues, DeepMind, February 2024",
      what: "Learned its own set of actions from unlabelled internet video of games, and let you play what it drew.",
      meant: "A world you can walk through, learned from video.",
      hands: "Pixels you can steer.",
    },
    gamengen: {
      name: "GameNGen", short: "GameNGen", who: "Dani Valevski and colleagues, Google, 2024",
      what: "Draws frames of DOOM, each from the frames before it and the player's inputs, at about twenty frames a second on one TPU.",
      meant: "A game drawn frame by frame, fast enough to play.",
      hands: "Pixels.",
    },
    cosmos: {
      name: "Cosmos", short: "Cosmos", who: "NVIDIA, January 2025",
      what: "Open-sourced, physically-aware video built as training data for robots and self-driving cars. The 3D simulator, Omniverse, is a different product.",
      meant: "Video with physics in it. NVIDIA calls the video part generative video.",
      hands: "Pixels.",
    },
    dreamerv3: {
      name: "DreamerV3", short: "DreamerV3", who: "Danijar Hafner and colleagues, Nature, 2025",
      what: "One set of settings across more than 150 tasks, which is as close to a dynasty as this field gets.",
      meant: "The same latent dynamics, six years on.",
      hands: "Compact state.",
    },
    vjepa2: {
      name: "V-JEPA 2", short: "V-JEPA 2", who: "Meta, 2025",
      what: "Pre-trained on more than a million hours of video with no actions, then post-trained with actions for model-predictive control. Reported driving a Franka arm in a lab it never saw.",
      meant: "Embeddings first, and a dynamics model grown on top.",
      hands: "Embeddings, and a model you can plan in.",
    },
    genie3: {
      name: "Genie 3", short: "Genie 3", who: "DeepMind, 2025",
      what: "Reported to generate interactive video at 720p and 24 frames a second, coherent for several minutes, taking plain-language instructions mid-session.",
      meant: "A world you can walk through that holds together for minutes.",
      hands: "Pixels. Persistence is learned, not stored.",
    },
    marble: {
      name: "Marble", short: "Marble", who: "World Labs, November 2025",
      what: "Takes text, an image or a rough 3D layout and hands back Gaussian splats for the look and triangle meshes for the structure, collider meshes included.",
      meant: "Structure you can query: a world another program can open.",
      hands: "Geometry.",
    },
    taxonomy: {
      name: "A Functional Taxonomy of World Models", short: "world model", who: "World Labs, June 2026",
      what: "A paper to sort the mess. The dictionaries begin.",
      meant: "All of the above, sorted by what each system predicts.",
      hands: "A dictionary.",
    },
  },
};

const UI: Record<string, {
  lane: Record<LaneId, string>;
  laneShort: Record<LaneId, string>;
  phrase: string;
  year: string;
  earlier: string;
  later: string;
  hint: string;
  sep: string;
  meant: string;
  hands: string;
  verdict: string[];
  aria: (year: number, shown: number, verdict: string, sel: string) => string;
}> = {
  en: {
    lane: {
      rl: "Reinforcement learning and control",
      rep: "Self-supervised representation",
      gen: "Generative video and spatial",
      interp: "Interpretability",
    },
    laneShort: { rl: "RL and control", rep: "Representation", gen: "Video and spatial", interp: "Interpretability" },
    phrase: "world model",
    year: "Year",
    earlier: "Earlier",
    later: "Later",
    hint: "Drag the year, or click a dot.",
    sep: ". ",
    meant: "What they meant by the phrase",
    hands: "What it hands you",
    verdict: [
      "One tradition uses the phrase, and it means a learned transition function.",
      "Three papers in two years settle the reinforcement learning reading.",
      "One reading, settled. Nobody else has reached for the term yet.",
      "Three readings now, not yet in conflict.",
      "Four, and the outputs have started to look alike.",
      "Four traditions, one phrase. From outside the term looks confused.",
      "The labs start publishing dictionaries.",
    ],
    aria: (year, shown, verdict, sel) =>
      `Four traditions on a year axis from 2013 to ${year}, ${shown} milestones shown, each lane bending toward one point labelled world model. ${verdict} Selected: ${sel}.`,
  },
};

function verdictIndex(year: number) {
  if (year <= 2017) return 0;
  if (year <= 2019) return 1;
  if (year <= 2021) return 2;
  if (year <= 2023) return 3;
  if (year === 2024) return 4;
  if (year === 2025) return 5;
  return 6;
}

/**
 * How far a lane has bent toward the shared point. Nothing moves before 2022,
 * and the ease-in keeps the lanes apart through 2025 so the labels there
 * still have room; they only meet at the far edge.
 */
function bend(year: number) {
  const s = Math.min(1, Math.max(0, (year - 2022) / (Y1 - 2022)));
  return s * s;
}

function geometry(compact: boolean) {
  const W = compact ? 600 : 960;
  const left = compact ? 16 : 24;
  const xEnd = compact ? 516 : 870;
  const laneY: Record<LaneId, number> = compact
    ? { rl: 56, rep: 166, gen: 276, interp: 386 }
    : { rl: 46, rep: 126, gen: 206, interp: 286 };
  const center = compact ? 221 : 166;
  const axisY = compact ? 436 : 322;
  const H = compact ? 462 : 346;
  const x = (year: number) => left + ((year - Y0) / (Y1 - Y0)) * (xEnd - left);
  const y = (lane: LaneId | "all", year: number) =>
    lane === "all" ? center : laneY[lane] + (center - laneY[lane]) * bend(year);
  return { W, H, left, xEnd, laneY, center, axisY, x, y };
}

export function WordTravels() {
  const locale = useLocale();
  const ui = pickText(UI, locale);
  const text = pickText(MS_TEXT, locale);
  const { ref, compact } = useCompact(620);
  const k = compact ? 1.65 : 1;
  const g = useMemo(() => geometry(compact), [compact]);

  const [year, setYear] = useState(YEAR_MAX);
  const [sel, setSel] = useState("wm");

  const shown = MILESTONES.filter((m) => Math.floor(m.year) <= year);
  const selected = MILESTONES.find((m) => m.id === sel) ?? MILESTONES[0];
  const selText = text[selected.id] ?? MS_TEXT.en[selected.id];
  const verdict = ui.verdict[verdictIndex(year)];
  const selIdx = MILESTONES.indexOf(selected);

  /** Scrubbing back past the selected paper hands the card to the newest one left. */
  const changeYear = (yr: number) => {
    setYear(yr);
    if (Math.floor(selected.year) > yr) {
      const left = MILESTONES.filter((m) => Math.floor(m.year) <= yr);
      if (left.length) setSel(left[left.length - 1].id);
    }
  };
  const sweep = useSweep({ value: year, min: YEAR_MIN, max: YEAR_MAX, step: 1, setValue: changeYear });
  const step = (d: 1 | -1) => {
    const next = MILESTONES[selIdx + d];
    if (!next) return;
    sweep.stop();
    setSel(next.id);
    const ny = Math.floor(next.year);
    if (ny > year) setYear(ny);
  };

  // lanes are drawn only as far as the chosen year
  const cutYear = year >= YEAR_MAX ? Y1 : year + 1;
  const lanePath = (lane: LaneId) => {
    const pts: string[] = [];
    for (let yr = Y0; yr <= cutYear + 1e-6; yr += 0.1) {
      const yy = Math.min(yr, cutYear);
      pts.push(`${pts.length ? "L" : "M"} ${g.x(yy).toFixed(1)} ${g.y(lane, yy).toFixed(1)}`);
    }
    return pts.join(" ");
  };

  const ticks = compact ? [2013, 2019, 2025] : [2013, 2016, 2019, 2022, 2025];
  const r = compact ? 6 : 5;
  const ariaSel = `${selText.name}, ${selText.who}`;

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg
          viewBox={`0 0 ${g.W} ${g.H}`}
          className="block w-full"
          role="img"
          aria-label={ui.aria(year, shown.length, verdict, ariaSel)}
        >
          {/* year axis */}
          <line x1={g.left} y1={g.axisY} x2={g.xEnd + (compact ? 0 : 10)} y2={g.axisY}
            stroke="var(--rule-strong)" strokeWidth="1" />
          {ticks.map((yr) => (
            <g key={yr}>
              <line x1={g.x(yr)} y1={g.axisY} x2={g.x(yr)} y2={g.axisY + 5} stroke="var(--rule-strong)" strokeWidth="1" />
              <text x={g.x(yr)} y={g.axisY + 16 * k} textAnchor="middle" className="font-mono tnum"
                fontSize={10 * k} letterSpacing="1" fill="var(--ink-faint)">
                {yr}
              </text>
            </g>
          ))}

          {/* lane labels and guides */}
          {LANES.map((lane) => (
            <g key={lane}>
              <text x={g.left} y={g.laneY[lane] - 14 * k} className="font-mono"
                fontSize={10 * k} letterSpacing="1" fill="var(--ink-faint)">
                {(compact ? ui.laneShort : ui.lane)[lane]}
              </text>
              <path d={lanePath(lane)} fill="none" stroke="var(--rule-strong)" strokeWidth="1" />
            </g>
          ))}

          {/* the scrub line */}
          {year < YEAR_MAX && (
            <line x1={g.x(cutYear)} y1={g.laneY.rl - 24 * k} x2={g.x(cutYear)} y2={g.axisY}
              stroke="var(--imagine)" strokeWidth="1" strokeDasharray="2 4" />
          )}

          {/* the shared point, and its name */}
          {year >= YEAR_MAX && (
            <text
              x={g.xEnd + 12}
              y={compact ? g.center - 6 : g.center + 4.5}
              fontFamily="var(--font-body)" fontStyle="italic" fontSize={13 * k}
              fill={sel === "taxonomy" ? "var(--imagine)" : "var(--ink)"}
            >
              {compact
                ? ui.phrase.split(" ").map((w, i) => (
                    <tspan key={w} x={g.xEnd + 12} dy={i ? 15 * k : 0}>{w}</tspan>
                  ))
                : ui.phrase}
            </text>
          )}

          {/* milestones */}
          {shown.map((m) => {
            const cx = g.x(m.year);
            const cy = g.y(m.lane, m.year);
            const on = m.id === sel;
            const tx = text[m.id] ?? MS_TEXT.en[m.id];
            const showLabel = m.id !== "taxonomy" && (!compact || on);
            // compact shows one label, the selected one, and keeps it clear of the lane label
            const above = m.side === "a" && !compact;
            return (
              <g key={m.id} onClick={() => setSel(m.id)} style={{ cursor: "pointer" }}>
                <circle cx={cx} cy={cy} r={r + 8} fill="transparent" />
                {on && (
                  <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="var(--imagine)" strokeWidth="1.2" />
                )}
                <circle cx={cx} cy={cy} r={r}
                  fill={on ? "var(--imagine)" : "var(--ink)"}
                  stroke="var(--paper)" strokeWidth="1.5" />
                {showLabel && (
                  <text
                    x={cx + (m.dx ?? 0) * k}
                    y={above ? cy - 9 * k : cy + 17 * k}
                    textAnchor={m.anchor ?? "middle"}
                    fontFamily="var(--font-body)" fontSize={12.5 * k}
                    fill={on ? "var(--imagine)" : "var(--ink-muted)"}
                    stroke="var(--paper-raised)" strokeWidth={3 * k} paintOrder="stroke" strokeLinejoin="round"
                  >
                    {tx.short}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* the scrubber */}
      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-[min(18rem,100%)] flex-1 items-center gap-3">
          <span className="label whitespace-nowrap">{ui.year}</span>
          <input
            type="range"
            min={YEAR_MIN}
            max={YEAR_MAX}
            step={1}
            value={year}
            onChange={(e) => {
              sweep.stop();
              changeYear(Number(e.target.value));
            }}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-12 text-right !text-ink">{year}</span>
        </label>

        <PlayButton playing={sweep.playing} onClick={sweep.toggle} />

        <div className="flex gap-px">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={selIdx === 0}
            className="label border border-rule-strong bg-paper px-3 py-1.5 !text-ink hover:border-ink disabled:cursor-default disabled:opacity-40 disabled:hover:border-rule-strong"
          >
            {ui.earlier}
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={selIdx === MILESTONES.length - 1}
            className="label border border-rule-strong bg-paper px-3 py-1.5 !text-ink hover:border-ink disabled:cursor-default disabled:opacity-40 disabled:hover:border-rule-strong"
          >
            {ui.later}
          </button>
        </div>

        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]">
          {verdict}
          <span className="ml-2 hidden text-ink-faint sm:inline">{ui.hint}</span>
        </p>
      </div>

      {/* the card */}
      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">
            <span className="tnum">{Math.floor(selected.year)}</span>
            {" · "}
            {selected.lane === "all" ? ui.phrase : ui.laneShort[selected.lane]}
          </p>
          <p className="mt-1 text-[0.98rem] text-ink">{selText.name}</p>
          <p className="mt-1 text-[0.85rem] leading-relaxed text-ink-muted">
            {selText.who}{ui.sep}{selText.what}
          </p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{ui.meant}</p>
          <p className="mt-1 text-[0.85rem] leading-relaxed text-ink-muted">{selText.meant}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{ui.hands}</p>
          <p className="mt-1 text-[0.85rem] leading-relaxed text-ink">{selText.hands}</p>
        </div>
      </div>
    </div>
  );
}
