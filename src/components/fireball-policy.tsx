"use client";

import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * The fireball policy, as a toy.
 *
 * Two copies of the same small game: fireballs fall down fixed columns and a
 * square at the bottom steps left and right to avoid them. The right panel is
 * the real game, which spawns a fireball every tick no matter what. The left
 * panel is a dream of it with one quirk: if the agent has sat in the far left
 * column for the last few ticks, the dream stops spawning fireballs at all.
 *
 * Train the policy in the dream and it finds the quirk, because a dream with
 * no fireballs is the cheapest score on offer. Copy the same policy into the
 * real game and the fireballs keep coming. The quirk, the scores and the game
 * are invented; the finding is Ha and Schmidhuber's (World Models, 2018).
 * Nothing here reproduces their exploit, it only stands in for it.
 */

const COLS = 5;
const ROWS = 6;          // rows a fireball falls through before it reaches the agent
const TICKS = 20;        // one episode, and the visible maximum score
const START = 2;         // the agent starts in the middle column
const PARK = 3;          // ticks parked far left before the dream's quirk kicks in
const SEED = 10;
/** fixed spawn columns, one per tick, the same in both worlds */
const SPAWN = [2, 4, 1, 0, 3, 0, 2, 0, 4, 1, 0, 3, 0, 2, 0, 1, 4, 0, 3, 0];
/** how strongly each training round leans on "go left and stay there" */
const ROUNDS_LEFT = [0, 0.45, 0.8, 1];
const LAST = ROUNDS_LEFT.length - 1;

const TICK_MS = 40;
const PAUSE_MS = 220;
const REAL_MS = 70;

const W = 320;
const H = 210;
const COL_W = W / COLS;
const TOP = 24;
const ROW_H = (H - TOP - 4) / (ROWS + 1);

type Ball = { col: number; row: number };
type Frame = {
  tick: number;
  col: number;
  balls: Ball[];
  score: number;
  spawned: number;
  hit: boolean;
};
type Run = { frames: Frame[]; i: number };
type DreamRun = Run & { round: number };
type Policy = "dodge" | "left";

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

/**
 * One episode. `left` is the chance, each tick, that the policy steps toward
 * the far left column instead of dodging; 0 is the untrained policy and 1 is
 * the one training ends on. The dodge itself is deliberately poor: it steps
 * sideways when a fireball is close above, without looking where it steps.
 */
function simulate(world: "dream" | "real", left: number, seed: number): Frame[] {
  const r = rng(seed);
  const frames: Frame[] = [{ tick: 0, col: START, balls: [], score: 0, spawned: 0, hit: false }];
  let col = START;
  let balls: Ball[] = [];
  let score = 0;
  let spawned = 0;
  const hist: number[] = [];
  const sideways = () => {
    let m = r() < 0.5 ? -1 : 1;
    if (col + m < 0 || col + m >= COLS) m = -m;
    return m;
  };
  for (let t = 1; t <= TICKS; t++) {
    let move = 0;
    if (r() < left) {
      move = col > 0 ? -1 : 0;
    } else {
      const threat = balls.filter((b) => b.col === col).reduce((m, b) => Math.min(m, ROWS - b.row), 99);
      if (threat <= 3) move = sideways();
      else if (r() < 0.35) move = sideways();
    }
    col += move;
    balls = balls.map((b) => ({ col: b.col, row: b.row + 1 }));
    const hit = balls.some((b) => b.row === ROWS && b.col === col);
    balls = balls.filter((b) => b.row <= ROWS);
    if (!hit) score++;
    hist.push(col);
    const parked = hist.length >= PARK && hist.slice(-PARK).every((c) => c === 0);
    if (!hit && !(world === "dream" && parked)) {
      balls.push({ col: SPAWN[(t - 1) % SPAWN.length], row: 0 });
      spawned++;
    }
    frames.push({ tick: t, col, balls, score, spawned, hit });
    if (hit) break;
  }
  return frames;
}

const DREAM_ROUNDS = ROUNDS_LEFT.map((p) => simulate("dream", p, SEED));
const REAL_DODGE = simulate("real", 0, SEED);
const REAL_LEFT = simulate("real", 1, SEED);

const EN = {
  dream: "Inside the dream",
  real: "The real game",
  policy: "Policy",
  policies: ["dodge", "dodge, leaning left", "mostly far left", "sit far left"],
  round: (r: number) => `round ${r} of ${ROUNDS_LEFT.length}`,
  tick: (t: number) => `tick ${t} of ${TICKS}`,
  hit: "hit",
  notRun: "not yet run",
  train: "Train in the dream",
  run: "Run in the real game",
  reset: "Reset",
  scoreDream: "Score in the dream",
  scoreReal: "Score in the real game",
  spawned: "Fireballs spawned: dream / real",
  v0: "Untrained policy. It dodges badly in both places.",
  vTraining: "Training. Each round the policy keeps whatever scored well in the dream.",
  v1: "In the dream the agent found a way of moving that stops the fireballs. Excellent in there.",
  v2: "Same moves, real game: the fireballs kept coming, because the game never agreed to stop.",
  aria: (where: string, pol: string, f: Frame) =>
    `${where}. Policy: ${pol}. Tick ${f.tick} of ${TICKS}, score ${f.score} of ${TICKS}, ${f.spawned} fireballs spawned${f.hit ? ", the agent was hit" : ""}.`,
  ariaIdle: (where: string) => `${where}. Not yet run.`,
};

type Strings = typeof EN;

const TEXT: Record<"en" | "zh", Strings> = {
  en: EN,
  zh: {
    dream: "梦里",
    real: "真实游戏",
    policy: "策略",
    policies: ["躲避", "躲避，偏向左边", "大多待在最左", "停在最左列"],
    round: (r: number) => `第 ${r} 轮，共 ${ROUNDS_LEFT.length} 轮`,
    tick: (t: number) => `第 ${t} 步，共 ${TICKS} 步`,
    hit: "被击中",
    notRun: "尚未运行",
    train: "在梦里训练",
    run: "在真实游戏里运行",
    reset: "重置",
    scoreDream: "梦里的得分",
    scoreReal: "真实游戏的得分",
    spawned: "生成的火球：梦 / 真实",
    v0: "未训练的策略。在两边都躲得很差。",
    vTraining: "正在训练。每一轮，策略都会留下在梦里得分高的动作。",
    v1: "在梦里，智能体找到了一种让火球不再出现的走法。在里面表现极好。",
    v2: "同样的动作，放到真实游戏里：火球照样来，因为游戏从没答应过停火。",
    aria: (where: string, pol: string, f: Frame) =>
      `${where}。策略：${pol}。第 ${f.tick} 步，共 ${TICKS} 步，得分 ${f.score} / ${TICKS}，生成了 ${f.spawned} 个火球${f.hit ? "，智能体被击中" : ""}。`,
    ariaIdle: (where: string) => `${where}。尚未运行。`,
  },
};

const finalDream = (): DreamRun => ({ round: 0, frames: DREAM_ROUNDS[0], i: DREAM_ROUNDS[0].length - 1 });
const finalReal = (): Run => ({ frames: REAL_DODGE, i: REAL_DODGE.length - 1 });

export function FireballPolicy() {
  const locale = useLocale();
  const s: Strings = TEXT[locale as keyof typeof TEXT] ?? TEXT.en;
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const k = compact ? 1.65 : 1;

  const [dream, setDream] = useState<DreamRun>(finalDream);
  const [real, setReal] = useState<Run | null>(finalReal);
  const [realPolicy, setRealPolicy] = useState<Policy>("dodge");
  const [trained, setTrained] = useState(false);
  const [training, setTraining] = useState(false);
  const trainedRef = useRef(false);
  const animRef = useRef<{ id: number; finish: () => void } | null>(null);

  /** Stop whatever is animating and show its final state at once. */
  const settle = useCallback(() => {
    const a = animRef.current;
    if (!a) return;
    window.clearTimeout(a.id);
    animRef.current = null;
    a.finish();
  }, []);

  useEffect(() => () => {
    if (animRef.current) window.clearTimeout(animRef.current.id);
  }, []);

  const train = () => {
    settle();
    setReal(null);
    const finish = () => {
      setDream({ round: LAST, frames: DREAM_ROUNDS[LAST], i: DREAM_ROUNDS[LAST].length - 1 });
      trainedRef.current = true;
      setTrained(true);
      setTraining(false);
    };
    if (still) { finish(); return; }
    trainedRef.current = false;
    setTrained(false);
    setTraining(true);
    let r = 0;
    let i = 0;
    setDream({ round: 0, frames: DREAM_ROUNDS[0], i: 0 });
    const step = () => {
      i++;
      let delay = TICK_MS;
      if (i >= DREAM_ROUNDS[r].length) {
        r++;
        i = 0;
        delay = PAUSE_MS;
        if (r > LAST) { animRef.current = null; finish(); return; }
      }
      setDream({ round: r, frames: DREAM_ROUNDS[r], i });
      animRef.current = { id: window.setTimeout(step, delay), finish };
    };
    animRef.current = { id: window.setTimeout(step, TICK_MS), finish };
  };

  const runReal = () => {
    settle();
    const pol: Policy = trainedRef.current ? "left" : "dodge";
    const frames = pol === "left" ? REAL_LEFT : REAL_DODGE;
    setRealPolicy(pol);
    const finish = () => setReal({ frames, i: frames.length - 1 });
    if (still) { finish(); return; }
    let i = 0;
    setReal({ frames, i: 0 });
    const step = () => {
      i++;
      if (i >= frames.length - 1) { animRef.current = null; finish(); return; }
      setReal({ frames, i });
      animRef.current = { id: window.setTimeout(step, REAL_MS), finish };
    };
    animRef.current = { id: window.setTimeout(step, REAL_MS), finish };
  };

  const reset = () => {
    settle();
    trainedRef.current = false;
    setTrained(false);
    setTraining(false);
    setDream(finalDream());
    setReal(finalReal());
    setRealPolicy("dodge");
  };

  const df = dream.frames[dream.i];
  const rf = real ? real.frames[real.i] : null;
  const realDone = real !== null && real.i === real.frames.length - 1;
  const dreamPolicy = s.policies[trained ? LAST : dream.round];
  const currentPolicy = s.policies[trained ? LAST : 0];
  const realPolicyLabel = real ? s.policies[realPolicy === "left" ? LAST : 0] : currentPolicy;

  const verdict = training
    ? s.vTraining
    : !trained
      ? s.v0
      : realPolicy === "left" && realDone
        ? s.v2
        : s.v1;

  return (
    <div>
      <div ref={ref} className={`grid gap-6 px-4 pt-6 md:px-8 ${compact ? "grid-cols-1" : "grid-cols-2"}`}>
        <Panel
          title={s.dream}
          tone="var(--imagine)"
          policy={dreamPolicy}
          frame={df}
          round={training || trained ? dream.round + 1 : null}
          s={s}
          k={k}
        />
        <Panel
          title={s.real}
          tone="var(--actual)"
          policy={realPolicyLabel}
          frame={rf}
          round={null}
          s={s}
          k={k}
        />
      </div>

      <div data-print-hide className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={train}
            className={`label border px-3 py-1.5 transition-colors ${
              trained ? "border-imagine bg-imagine !text-paper" : "border-rule-strong bg-paper !text-ink hover:border-ink"
            }`}
          >
            {s.train}
          </button>
          <button
            type="button"
            onClick={runReal}
            className="label border border-rule-strong bg-paper px-3 py-1.5 !text-ink transition-colors hover:border-ink"
          >
            {s.run}
          </button>
          <button
            type="button"
            onClick={reset}
            className="label border border-rule-strong bg-paper px-3 py-1.5 !text-ink transition-colors hover:border-ink"
          >
            {s.reset}
          </button>
        </div>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem] sm:basis-auto sm:flex-1" aria-live="polite">
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [s.scoreDream, `${df.score} / ${TICKS}`],
          [s.scoreReal, rf ? `${rf.score} / ${TICKS}` : s.notRun],
          [s.spawned, `${df.spawned} / ${rf ? rf.spawned : s.notRun}`],
        ].map(([label, value]) => (
          <div key={label} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{label}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel({
  title, tone, policy, frame, round, s, k,
}: {
  title: string;
  tone: string;
  policy: string;
  frame: Frame | null;
  round: number | null;
  s: Strings;
  k: number;
}) {
  const cx = (col: number) => col * COL_W + COL_W / 2;
  const cy = (row: number) => TOP + row * ROW_H + ROW_H / 2;
  const agentY = cy(ROWS);
  const fs = 7 * k;
  const label = frame ? s.aria(title, policy, frame) : s.ariaIdle(title);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="label" style={{ color: tone }}>{title}</span>
        <span className="label !text-ink">{s.policy}: {policy}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 block w-full" role="img" aria-label={label}>
        {/* the spawn columns */}
        {Array.from({ length: COLS }, (_, c) => (
          <g key={c}>
            <line x1={cx(c)} y1={TOP} x2={cx(c)} y2={agentY - ROW_H / 2}
              stroke="var(--rule)" strokeWidth="1" strokeDasharray="2 4" />
            <line x1={cx(c) - 5} y1={TOP} x2={cx(c) + 5} y2={TOP} stroke="var(--rule-strong)" strokeWidth="1.2" />
          </g>
        ))}
        {/* the floor */}
        <line x1="0" y1={H - 2} x2={W} y2={H - 2} stroke="var(--rule-strong)" strokeWidth="1" />

        {frame ? (
          <>
            {/* the agent, drawn first so a fireball that lands on it sits on top */}
            <rect x={cx(frame.col) - 8} y={agentY - 8} width="16" height="16"
              fill="var(--ink)" />
            {frame.balls.map((b, i) => (
              <circle key={i} cx={cx(b.col)} cy={cy(b.row)} r="7" fill={tone} />
            ))}
            {frame.hit && (
              <circle cx={cx(frame.col)} cy={agentY} r="14" fill="none" stroke={tone} strokeWidth="2" />
            )}
            {/* tick and status */}
            <text x={W - 6} y="12" textAnchor="end" className="font-mono tnum" fontSize={fs}
              letterSpacing="1" fill="var(--ink-muted)">
              {frame.hit ? `${s.tick(frame.tick)} · ${s.hit}` : s.tick(frame.tick)}
            </text>
            {round !== null && (
              <text x="6" y="12" className="font-mono tnum" fontSize={fs} letterSpacing="1" fill={tone}>
                {s.round(round)}
              </text>
            )}
          </>
        ) : (
          <text x={W / 2} y={TOP + (agentY - TOP) / 2} textAnchor="middle" className="font-mono" fontSize={fs * 1.1}
            letterSpacing="1" fill="var(--ink-muted)">
            {s.notRun}
          </text>
        )}
      </svg>
    </div>
  );
}
