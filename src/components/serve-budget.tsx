"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useT } from "./locale-provider";

/**
 * Where the half second goes.
 *
 * The chapter opens by claiming that past a certain speed, reacting stops
 * being an option. This is that claim as a budget you can run out of. Drag the
 * serve up and the arrival line walks left into the returner's timeline until
 * the reactive plan no longer fits inside it.
 *
 * The colour language is the site's: slate is what actually happened, vermilion
 * is the branch that ran on a prediction instead of on evidence.
 *
 * Numbers: the flight model is one constant fitted so that a 190 km/h serve
 * gives the returner about half a second, which is the figure usually quoted. The two
 * returner budgets are illustrative rather than measured, except the 177 ms
 * movement onset, which is not.
 */

const W = 900;
const H = 436;
const SCENE_H = 186;   // court view sits above the budget
const T0 = -220; // ms, before contact
const T1 = 1120;
const PAD_L = 150;
const PAD_R = 26;

/** baseline to baseline on a full-size court */
const COURT_M = 23.77;
/** average speed over the flight as a fraction of the speed off the racket */
const DECAY = 0.887;
const flightMs = (kmh: number) => (COURT_M / (DECAY * (kmh / 3.6))) * 1000;

/** watch the ball, work out what to do, then move. */
const REACT = [
  { from: 0, to: 180, key: "serve.watch" },
  { from: 180, to: 350, key: "serve.decide" },
  { from: 350, to: 670, key: "serve.swing" },
];
/** the decision was made off the toss, so the body goes at the physical floor. */
const EARLY = [
  { from: -220, to: 0, key: "serve.readToss" },
  { from: 177, to: 497, key: "serve.swingEarly" },
];
const REACT_END = 670;
const EARLY_END = 497;

const x = (ms: number) => PAD_L + ((ms - T0) / (T1 - T0)) * (W - PAD_L - PAD_R);

/* ---------- the court, seen from above ---------- */
const CT = { x0: 44, x1: 856, y0: 26, y1: 158 };
const SERVER_X = CT.x0 + 28;
const RETURN_X = CT.x1 - 34;
const EARLY_X = RETURN_X - 42;      // the two returners stand side by side
const NET_X = (CT.x0 + CT.x1) / 2;
const MID_Y = (CT.y0 + CT.y1) / 2;
const START_Y = CT.y1 - 20;         // both start here, so the comparison is fair
const TARGET_Y = CT.y0 + 22;        // and the serve goes here
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** a racket: strung head plus a handle, pointing along `rot` degrees. */
function Racket({ cx, cy, rot, tone }: { cx: number; cy: number; rot: number; tone: string }) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
      <line x1={0} y1={0} x2={0} y2={10} stroke={tone} strokeWidth="2" strokeLinecap="round" />
      <ellipse cx={0} cy={-5.5} rx={5.6} ry={7.6} fill="none" stroke={tone} strokeWidth="1.8" />
      <line x1={-3.6} y1={-5.5} x2={3.6} y2={-5.5} stroke={tone} strokeWidth="0.5" opacity={0.65} />
      <line x1={0} y1={-12.5} x2={0} y2={1.5} stroke={tone} strokeWidth="0.5" opacity={0.65} />
    </g>
  );
}

/** one returner sliding across court, as fast as their own budget allows. */
function Returner({ onset, span, now, tone, cx }:
  { onset: number; span: number; now: number; tone: string; cx: number }) {
  const y = START_Y + (TARGET_Y - START_Y) * clamp01((now - onset) / span);
  return (
    <g>
      <line x1={cx} y1={START_Y} x2={cx} y2={y} stroke={tone} strokeWidth="1"
        strokeDasharray="2 3" opacity={0.5} />
      <circle cx={cx} cy={START_Y} r={2} fill={tone} opacity={0.4} />
      <circle cx={cx} cy={y} r={5} fill={tone} />
      <Racket cx={cx - 12} cy={y} rot={-26} tone={tone} />
    </g>
  );
}

type Seg = { from: number; to: number; key: string };

/** Hoisted so the rows are not remounted on every frame of the playhead. */
function Row({
  y, label, segs, end, late, tone, head, t,
}: {
  y: number; label: string; segs: Seg[]; end: number; late: number; tone: string;
  head: number | null; t: (k: string, v?: Record<string, string>) => string;
}) {
  return (
    <g>
      <text x={PAD_L - 14} y={y + 13} textAnchor="end" className="font-mono" fontSize="11"
        fill="var(--ink-muted)" style={{ letterSpacing: "0.08em" }}>
        {label.toUpperCase()}
      </text>
      {segs.map((s, i) => (
        <g key={s.key + s.from}>
          <rect x={x(s.from)} y={y} width={Math.max(2, x(s.to) - x(s.from))} height={20}
            fill={tone} opacity={head !== null && head < s.to ? 0.26 : 0.82} />
          <text x={x(s.from) + 5} y={y + (i % 2 ? 45 : 34)} className="font-mono" fontSize="9.5"
            fill="var(--ink-faint)">
            {t(s.key)}
          </text>
        </g>
      ))}
      <text x={x(end) + 8} y={y + 14} className="font-mono" fontSize="10"
        fill={late <= 0 ? "var(--ink-muted)" : tone}>
        {late <= 0 ? t("serve.inTime") : t("serve.late", { n: String(late) })}
      </text>
    </g>
  );
}

export function ServeBudget() {
  const t = useT();
  const still = useReducedMotion();
  const [kmh, setKmh] = useState(190);
  const [head, setHead] = useState<number | null>(null);
  const raf = useRef<number | null>(null);

  const arrive = flightMs(kmh);
  const reactLate = Math.round(REACT_END - arrive);
  const earlyLate = Math.round(EARLY_END - arrive);

  const play = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    if (still) {
      setHead(null);
      return;
    }
    const start = performance.now();
    const span = Math.max(arrive, REACT_END) + 120;
    const step = (now: number) => {
      const ms = T0 + ((now - start) / 1400) * (span - T0);
      if (ms >= span) {
        setHead(null);
        raf.current = null;
        return;
      }
      setHead(ms);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  /** the scene needs a time even when it is not playing: rest at the arrival. */
  const shown = head ?? Math.max(arrive, EARLY_END);

  const verdict =
    reactLate <= 0 ? "serve.bothWork" : earlyLate <= 0 ? "serve.onlyEarly" : "serve.neither";

  return (
    <div>
      <div className="overflow-x-auto px-5 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full min-w-[560px]" role="img"
          aria-label={t("serve.aria", { kmh: String(kmh), ms: String(Math.round(arrive)) })}>
          {/* ---------- court ---------- */}
          <rect x={CT.x0} y={CT.y0} width={CT.x1 - CT.x0} height={CT.y1 - CT.y0}
            fill="var(--paper-sunk)" stroke="var(--rule-strong)" strokeWidth="1" />
          <line x1={CT.x0} y1={MID_Y} x2={CT.x1} y2={MID_Y} stroke="var(--rule)" strokeWidth="1" />
          <line x1={NET_X} y1={CT.y0 - 8} x2={NET_X} y2={CT.y1 + 8} stroke="var(--ink-faint)"
            strokeWidth="2" />
          <text x={NET_X} y={CT.y0 - 12} textAnchor="middle" className="font-mono" fontSize="9"
            fill="var(--ink-faint)">{t("serve.net")}</text>

          {/* server, mid-strike */}
          <circle cx={SERVER_X} cy={MID_Y} r={5} fill="var(--ink)" />
          <Racket cx={SERVER_X + 13} cy={MID_Y - 9} rot={40} tone="var(--ink)" />
          <text x={CT.x0} y={CT.y0 - 12} className="font-mono" fontSize="9"
            fill="var(--ink-faint)">{t("serve.server")}</text>

          {/* where the serve is going */}
          <line x1={NET_X} y1={TARGET_Y} x2={CT.x1} y2={TARGET_Y} stroke="var(--rule-strong)"
            strokeWidth="1" strokeDasharray="3 4" opacity={0.6} />

          <Returner onset={350} span={320} now={shown} tone="var(--actual)" cx={RETURN_X} />
          <Returner onset={177} span={320} now={shown} tone="var(--imagine)" cx={EARLY_X} />

          {/* the ball, on its way */}
          {(() => {
            const p = clamp01(shown / arrive);
            const bx = SERVER_X + (RETURN_X - SERVER_X) * p;
            const by = MID_Y + (TARGET_Y - MID_Y) * p;
            const slateY = START_Y + (TARGET_Y - START_Y) * clamp01((arrive - 350) / 320);
            return (
              <>
                <line x1={SERVER_X} y1={MID_Y} x2={bx} y2={by} stroke="var(--ink)"
                  strokeWidth="1" opacity={0.25} />
                {shown >= arrive && slateY - TARGET_Y > 6 && (
                  <>
                    <line x1={RETURN_X} y1={TARGET_Y + 6} x2={RETURN_X} y2={slateY - 7}
                      stroke="var(--actual)" strokeWidth="1" />
                    <text x={RETURN_X + 8} y={(TARGET_Y + slateY) / 2} className="font-mono"
                      fontSize="9" fill="var(--actual)">{t("serve.short")}</text>
                  </>
                )}
                <circle cx={bx} cy={by} r={4.5} fill="var(--ball)" stroke="var(--ink)"
                  strokeWidth="1.2" />
              </>
            );
          })()}

          {/* contact, at time zero */}
          <line x1={x(0)} y1={SCENE_H + 18} x2={x(0)} y2={H - 34} stroke="var(--rule-strong)" strokeWidth="1" />
          <text x={x(0) + 6} y={SCENE_H + 28} className="font-mono" fontSize="9.5" fill="var(--ink-faint)">
            {t("serve.contact")}
          </text>

          {/* the ball */}
          <rect x={x(0)} y={SCENE_H + 52} width={Math.max(2, x(arrive) - x(0))} height={20}
            fill="var(--actual)" opacity={0.26} />
          <text x={PAD_L - 14} y={SCENE_H + 65} textAnchor="end" className="font-mono" fontSize="11"
            fill="var(--ink-muted)" style={{ letterSpacing: "0.08em" }}>
            {t("serve.ball").toUpperCase()}
          </text>
          <line x1={x(arrive)} y1={SCENE_H + 18} x2={x(arrive)} y2={H - 34} stroke="var(--ink)" strokeWidth="1.5" />
          <text x={x(arrive) + 7} y={SCENE_H + 28} className="font-mono" fontSize="10" fill="var(--ink)">
            {t("serve.arrives")}
          </text>
          <text x={x(arrive) - 7} y={SCENE_H + 65} textAnchor="end" className="font-mono tnum" fontSize="9.5"
            fill="var(--ink-muted)">
            {Math.round(arrive)} ms
          </text>

          <Row y={SCENE_H + 104} label={t("serve.react")} segs={REACT} end={REACT_END} late={reactLate}
            tone="var(--actual)" head={head} t={t} />
          <Row y={SCENE_H + 166} label={t("serve.early")} segs={EARLY} end={EARLY_END} late={earlyLate}
            tone="var(--imagine)" head={head} t={t} />

          {/* playhead */}
          {head !== null && (
            <line x1={x(head)} y1={SCENE_H + 18} x2={x(head)} y2={H - 34} stroke="var(--imagine)"
              strokeWidth="1.5" opacity={0.65} />
          )}

          {/* axis */}
          <line x1={PAD_L} y1={H - 26} x2={W - PAD_R} y2={H - 26} stroke="var(--rule)" strokeWidth="1" />
          {[0, 250, 500, 750, 1000].map((ms) => (
            <g key={ms}>
              <line x1={x(ms)} y1={H - 26} x2={x(ms)} y2={H - 21} stroke="var(--rule-strong)" strokeWidth="1" />
              <text x={x(ms)} y={H - 8} textAnchor="middle" className="font-mono tnum" fontSize="9.5"
                fill="var(--ink-faint)">
                {ms}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <button onClick={play}
          className="border border-ink px-4 py-1.5 transition-colors hover:border-imagine hover:text-imagine">
          <span className="label">{t("serve.play")}</span>
        </button>
        <label className="flex min-w-[18rem] flex-1 items-center gap-3">
          <span className="label whitespace-nowrap">{t("serve.speed")}</span>
          <input type="range" min={100} max={230} value={kmh}
            onChange={(e) => setKmh(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]" />
          <span className="label tnum w-20 text-right !text-ink">{kmh} km/h</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("serve.flight")}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{Math.round(arrive)} ms</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{t("serve.verdictLabel")}</p>
          <p className="mt-1 text-[0.98rem] leading-snug text-ink">{t(verdict)}</p>
        </div>
      </div>
    </div>
  );
}
