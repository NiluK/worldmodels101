"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useReducedMotion } from "motion/react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * The bench, not the model.
 *
 * A row of test scenes ordered by speed. The shaded ones are the speeds the
 * training footage covered. Scoring the covered bench gives a clean sheet;
 * widening the bench past where the footage ends fails every new scene. The
 * model is the same object in both cases, which is the only thing the figure
 * is trying to say, so "the model: unchanged" sits in the readouts as a
 * constant beside two numbers that move.
 *
 * The errors are a table rather than a formula: a formula invites the reader
 * to read a law out of a picture that is meant to be illustrative.
 */

type Scene = { speed: number; err: number; inside: boolean };

const COVERED_LO = 18;
const COVERED_HI = 34;
const STEP_MS = 60;

const scene = (speed: number, err: number): Scene => ({
  speed,
  err,
  inside: speed >= COVERED_LO && speed <= COVERED_HI,
});

/** eight scenes at speeds the footage covered */
const INSIDE: Scene[] = [
  scene(18, 2), scene(20, 1), scene(23, 3), scene(25, 2),
  scene(27, 4), scene(29, 2), scene(32, 3), scene(34, 2),
];

/** the same eight, plus three slower and three faster than anything in the footage */
const BEYOND: Scene[] = [
  scene(10, 44), scene(13, 31), scene(16, 20),
  ...INSIDE,
  scene(42, 24), scene(52, 41), scene(64, 60),
];

type Bench = "inside" | "beyond";

type Text = {
  benchLabel: string;
  benchInside: string;
  benchBeyond: string;
  score: string;
  covered: string;
  unit: string;
  rScenes: string;
  rPassed: string;
  rModel: string;
  unchanged: string;
  ofN: (a: number, b: number) => string;
  pass: string;
  fail: string;
  unscored: string;
  tile: (speed: number, state: string) => string;
  v0: string;
  vInside: string;
  vBeyond: string;
  vTileIn: (err: number) => string;
  vTileOut: (err: number) => string;
  vTileUnscored: string;
  groupAria: string;
};

const TEXT: LocaleText<Text> = {
  en: {
    benchLabel: "the bench",
    benchInside: "the same place as the footage",
    benchBeyond: "past where the footage ends",
    score: "Score it",
    covered: "the speeds the footage covered",
    unit: "m/s",
    rScenes: "scenes on the bench",
    rPassed: "passed",
    rModel: "the model",
    unchanged: "unchanged",
    ofN: (a, b) => `${a} of ${b}`,
    pass: "passed",
    fail: "failed",
    unscored: "not scored yet",
    tile: (speed, state) => `${speed} metres per second, ${state}`,
    v0: "One model and a bench of scenes. Score it.",
    vInside: "Eight out of eight. On this bench the model has the rule.",
    vBeyond:
      "Fourteen scenes, six of them past where the footage ends, and it failed all six. The model did not change; the bench did.",
    vTileIn: (err) => `This scene sits inside the footage. Off by ${err} per cent, which is what passing looks like.`,
    vTileOut: (err) =>
      `This speed is past anything in the footage. Off by ${err} per cent, and no bench built from the footage would have asked it.`,
    vTileUnscored: "That scene has not been scored yet. Press Score it.",
    groupAria: "the bench, one button per scene, ordered by speed",
  },
  zh: {
    benchLabel: "测试台",
    benchInside: "和素材同一个范围",
    benchBeyond: "素材结束之后",
    score: "打分",
    covered: "素材覆盖到的速度",
    unit: "米/秒",
    rScenes: "测试台上的场景",
    rPassed: "通过",
    rModel: "模型",
    unchanged: "没有变",
    ofN: (a, b) => `${a} / ${b}`,
    pass: "通过",
    fail: "未通过",
    unscored: "还没有打分",
    tile: (speed, state) => `每秒 ${speed} 米，${state}`,
    v0: "一个模型，一排测试场景。给它打分。",
    vInside: "八比八全对。在这台测试上，模型掌握了规则。",
    vBeyond: "十四个场景，其中六个的速度超出素材的范围，这六个它全错了。模型没有变，变的是测试台。",
    vTileIn: (err) => `这个场景落在素材范围之内。误差 ${err}%，这就是通过的样子。`,
    vTileOut: (err) => `这个速度超出了素材里的任何一个。误差 ${err}%，而任何按素材搭出来的测试台都不会问到它。`,
    vTileUnscored: "这个场景还没有打分。按「打分」。",
    groupAria: "测试台，每个场景一个按钮，按速度排列",
  },
};

/** a miniature scene: two markers and an arrow whose length is the speed */
function MiniScene({ speed }: { speed: number }) {
  const len = 3 + (speed / 64) * 24;
  return (
    <svg viewBox="0 0 40 34" className="block w-full" aria-hidden>
      <line x1="4" y1="28" x2="36" y2="28" stroke="var(--rule)" strokeWidth="1" />
      <circle cx="10" cy="24" r="3" fill="var(--ink)" opacity="0.72" />
      <circle cx="30" cy="24" r="3" fill="var(--ink)" opacity="0.72" />
      <path
        d={`M 10 14 L ${10 + len} 14 M ${10 + len - 4} 11 L ${10 + len} 14 L ${10 + len - 4} 17`}
        fill="none"
        stroke="var(--ink)"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function Mark({ state }: { state: "pass" | "fail" | "none" }) {
  return (
    <svg viewBox="0 0 12 12" className="block h-3 w-3 shrink-0" aria-hidden>
      {state === "pass" && (
        <polyline points="2,6 5,9 10,3" fill="none" stroke="var(--actual)" strokeWidth="1.6" />
      )}
      {state === "fail" && (
        <path d="M3 3 L9 9 M9 3 L3 9" fill="none" stroke="var(--imagine)" strokeWidth="1.6" />
      )}
      {state === "none" && (
        <rect x="2.5" y="2.5" width="7" height="7" fill="none" stroke="var(--rule-strong)" strokeWidth="1" />
      )}
    </svg>
  );
}

export function BandScorecard() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const reduced = useReducedMotion();
  const { ref, compact } = useCompact(620);

  const [bench, setBench] = useState<Bench>("inside");
  const [scored, setScored] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);

  const scenes = bench === "inside" ? INSIDE : BEYOND;
  const n = scenes.length;

  // one tile at a time under motion; Score it already resolved the first
  useEffect(() => {
    if (scored === 0 || scored >= n) return;
    const id = window.setTimeout(() => setScored((s) => Math.min(n, s + 1)), STEP_MS);
    return () => window.clearTimeout(id);
  }, [scored, n]);

  const done = scored >= n;
  const passed = scenes.slice(0, scored).filter((s) => s.inside).length;

  const flip = (b: Bench) => {
    setBench(b);
    setScored(0);
    setSel(null);
  };

  const move = (delta: number) => {
    const next = sel === null ? 0 : Math.min(n - 1, Math.max(0, sel + delta));
    setSel(next);
    tiles.current[next]?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
    else if (e.key === "Escape") setSel(null);
  };

  const perRow = compact ? Math.ceil(n / 2) : n;
  const rows = useMemo(() => {
    const out: number[][] = [];
    for (let i = 0; i < n; i += perRow) out.push(Array.from({ length: Math.min(perRow, n - i) }, (_, k) => i + k));
    return out;
  }, [n, perRow]);
  const firstCoveredRow = rows.findIndex((r) => r.some((i) => scenes[i].inside));

  const picked = sel === null ? null : scenes[sel];
  const verdict =
    picked === null
      ? done
        ? bench === "inside"
          ? T.vInside
          : T.vBeyond
        : T.v0
      : !done
        ? T.vTileUnscored
        : picked.inside
          ? T.vTileIn(picked.err)
          : T.vTileOut(picked.err);

  const stateOf = (i: number, s: Scene) =>
    i >= scored ? T.unscored : s.inside ? `${T.pass}, ${s.err}%` : `${T.fail}, ${s.err}%`;

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <div
          role="group"
          aria-label={T.groupAria}
          onKeyDown={onKey}
          className="grid gap-x-1 gap-y-1"
          style={{
            gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))`,
            maxWidth: `${perRow * 4.75}rem`,
          }}
        >
          {rows.map((row, r) => {
            const covered = row.filter((i) => scenes[i].inside);
            const start = covered.length ? row.indexOf(covered[0]) : 0;
            return (
              <Fragment key={r}>
                {covered.length > 0 && (
                  <div
                    style={{ gridRow: 2 * r + 1, gridColumn: `${start + 1} / span ${covered.length}` }}
                    className="min-w-0"
                  >
                    {r === firstCoveredRow && (
                      <p className="label truncate !text-[0.6rem] !tracking-[0.08em]">{T.covered}</p>
                    )}
                    <div className="mt-1 h-px w-full" style={{ background: "var(--actual)" }} />
                  </div>
                )}
                {row.map((i, c) => {
                  const s = scenes[i];
                  const resolved = i < scored;
                  const on = sel === i;
                  return (
                    <button
                      key={s.speed}
                      ref={(el) => { tiles.current[i] = el; }}
                      type="button"
                      aria-pressed={on}
                      aria-label={T.tile(s.speed, stateOf(i, s))}
                      tabIndex={sel === null ? (i === 0 ? 0 : -1) : on ? 0 : -1}
                      onClick={() => setSel(on ? null : i)}
                      style={{ gridRow: 2 * r + 2, gridColumn: c + 1 }}
                      className={`relative min-w-0 border px-1 py-1.5 transition-colors ${
                        on ? "border-imagine" : "border-rule hover:border-ink"
                      }`}
                    >
                      {s.inside && (
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-0"
                          style={{ background: "var(--actual)", opacity: 0.09 }}
                        />
                      )}
                      <span className="relative block">
                        <MiniScene speed={s.speed} />
                        <span className="tnum mt-1 block truncate text-center font-mono text-[0.58rem] text-ink-muted">
                          {s.speed} {T.unit}
                        </span>
                        <span className="mt-1 flex items-center justify-center gap-1">
                          <Mark state={!resolved ? "none" : s.inside ? "pass" : "fail"} />
                          <span
                            className="tnum font-mono text-[0.58rem]"
                            style={{ color: resolved ? (s.inside ? "var(--actual)" : "var(--imagine)") : "transparent" }}
                          >
                            {resolved ? `${s.err}%` : "0%"}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      </div>

      <div
        data-print-hide
        className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="label">{T.benchLabel}</span>
          <div className="flex flex-wrap gap-px" role="group" aria-label={T.benchLabel}>
            {(["inside", "beyond"] as const).map((b) => (
              <button
                key={b}
                type="button"
                aria-pressed={bench === b}
                onClick={() => flip(b)}
                className={`border px-3 py-1.5 font-mono text-[0.7rem] tracking-[0.06em] transition-colors ${
                  bench === b
                    ? "border-imagine bg-imagine text-paper"
                    : "border-rule-strong bg-paper text-ink hover:border-ink"
                }`}
              >
                {b === "inside" ? T.benchInside : T.benchBeyond}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setScored(reduced ? n : 1)}
          disabled={scored > 0}
          className="border border-rule-strong bg-paper px-4 py-1.5 transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rule-strong"
        >
          <span className="label whitespace-nowrap !text-ink">{T.score}</span>
        </button>

        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.rScenes, String(n)],
          [T.rPassed, T.ofN(passed, n)],
          [T.rModel, T.unchanged],
        ].map(([label, v]) => (
          <div key={label} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{label}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
