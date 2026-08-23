"use client";

import { useState, type KeyboardEvent } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * Where along a clip the steering-wheel test fails.
 *
 * One route with a junction in it, and the same test run at six moments. Two
 * bars per moment: how far apart the two commands should have come out, and
 * how far apart they did. In the corridor both bars are short, so obedience is
 * cheap and means nothing. At the junction the first bar is the longest in the
 * figure and the second is almost nothing.
 *
 * The strip of six mini pairs at the bottom is both the summary and the
 * control: the anti-correlation is the finding, and it should be legible
 * without stepping through.
 */

const MOMENTS = 6;
const JUNCTION = 3;

/** dots along the route, in drawing units; moment 4 sits at the junction */
const DOTS: [number, number][] = [
  [100, 118],
  [205, 118],
  [330, 118],
  [470, 118],
  [565, 44],
  [672, 44],
];

/** the route is drawn in 720-unit coordinates and squeezed horizontally when
 *  the viewBox is narrower, so the narrow version gets bigger type on screen */
const ROUTE = ["M 40 118 L 470 118", "M 470 118 L 470 44 L 690 44", "M 470 118 L 470 172"];
const squeeze = (d: string, k: number) =>
  d.replace(/([ML]) (-?[\d.]+) (-?[\d.]+)/g, (_m, c, x, y) => `${c} ${(Number(x) * k).toFixed(1)} ${y}`);

/** on one shared scale: what the two commands should have separated by, and what they did */
const SHOULD = [0.18, 0.15, 0.2, 1, 0.16, 0.14];
const DID = [0.17, 0.14, 0.19, 0.04, 0.15, 0.13];

type Pt = [number, number];
const poly = (pts: Pt[]) => pts.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");

/** the two commanded paths and their slate ghosts, drawn from the panel's origin */
function detail(i: number, ox: number, oy: number) {
  if (i === JUNCTION) {
    return {
      ghostL: [[ox, oy], [ox + 46, oy], [ox + 46, oy - 52], [ox + 150, oy - 52]] as Pt[],
      ghostR: [[ox, oy], [ox + 46, oy], [ox + 46, oy + 52], [ox + 150, oy + 52]] as Pt[],
      askL: [[ox, oy], [ox + 150, oy - 4]] as Pt[],
      askR: [[ox, oy], [ox + 150, oy + 2]] as Pt[],
    };
  }
  return {
    ghostL: [[ox, oy], [ox + 150, oy - 18]] as Pt[],
    ghostR: [[ox, oy], [ox + 150, oy + 18]] as Pt[],
    askL: [[ox, oy], [ox + 150, oy - 16]] as Pt[],
    askR: [[ox, oy], [ox + 150, oy + 17]] as Pt[],
  };
}

type Text = {
  ghosts: string;
  on: string;
  off: string;
  given: string;
  askedLeft: string;
  askedRight: string;
  shouldBar: string;
  didBar: string;
  strip: string;
  rMoment: string;
  rStake: string;
  rObeyed: string;
  stakeNone: string;
  stakeAll: string;
  obeyYes: string;
  obeyNo: string;
  ofN: (a: number, b: number) => string;
  momentN: (n: number) => string;
  vCorridor: string;
  vJunction: string;
  keyHelp: string;
  aria: (n: number) => string;
};

const TEXT: LocaleText<Text> = {
  en: {
    ghosts: "show the ghosts",
    on: "on",
    off: "off",
    given: "given",
    askedLeft: "asked for left",
    askedRight: "asked for right",
    shouldBar: "how far apart they should have come out",
    didBar: "how far apart they did",
    strip: "every moment, both bars",
    rMoment: "moment",
    rStake: "at stake here",
    rObeyed: "obeyed",
    stakeNone: "almost nothing",
    stakeAll: "the whole route",
    obeyYes: "yes, and it did not matter",
    obeyNo: "no",
    ofN: (a, b) => `${a} of ${b}`,
    momentN: (n) => `moment ${n}`,
    vCorridor: "It obeys here. Both commands end up in the same corridor, so obeying cost it nothing.",
    vJunction:
      "This is the moment worth steering, and the two commands came out on top of each other. The test is hardest to pass exactly where passing it matters.",
    keyHelp: "the route. The left and right arrow keys step between moments.",
    aria: (n) =>
      n === JUNCTION + 1
        ? `A route with a T junction, six moments marked along it, moment ${n} selected. Moment ${n} is the junction: the two commands should have come out far apart and came out on top of each other.`
        : `A route with a T junction, six moments marked along it, moment ${n} selected. Moment ${n} is in a corridor: the two commands should have come out close together and did.`,
  },
};

export function OpenMoments() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const { ref, compact } = useCompact(680);
  const fs = compact ? 13 : 10;
  const W = compact ? 440 : 720;
  const kx = W / 720;

  const [sel, setSel] = useState(0);
  const [ghosts, setGhosts] = useState(true);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setSel((s) => Math.min(MOMENTS - 1, s + 1));
    }
  };

  const atJunction = sel === JUNCTION;

  const panel = { x: compact ? 20 : 40, y: 196, w: compact ? 400 : 330, h: 132 };
  const bars = compact ? { x: 20, y: 356, w: 400 } : { x: 400, y: 210, w: 290 };
  const barH = 14;
  const lab1Y = bars.y + fs;
  const bar1Y = lab1Y + 8;
  const lab2Y = bar1Y + barH + fs + 16;
  const bar2Y = lab2Y + 8;
  const H = compact ? bar2Y + barH + 18 : Math.max(panel.y + panel.h + 18, bar2Y + barH + 18);

  const ox = panel.x + 56;
  const oy = panel.y + panel.h / 2;
  const d = detail(sel, ox, oy);
  const askLEnd = d.askL[d.askL.length - 1];
  const askREnd = d.askR[d.askR.length - 1];

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <div
          tabIndex={0}
          role="group"
          aria-label={T.keyHelp}
          onKeyDown={onKey}
          className="focus-visible:outline-2 focus-visible:outline-imagine"
        >
          <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={T.aria(sel + 1)}>
            {/* the route, top down */}
            <g fill="none" strokeLinejoin="round">
              {ROUTE.map((r) => squeeze(r, kx)).map((p) => (
                <g key={p}>
                  <path d={p} stroke="var(--rule-strong)" strokeWidth="34" />
                  <path d={p} stroke="var(--paper-sunk)" strokeWidth="32" />
                </g>
              ))}
            </g>

            {/* the six moments */}
            {DOTS.map(([x0, y], i) => {
              const x = x0 * kx;
              const on = i === sel;
              return (
                <g key={i} onClick={() => setSel(i)} style={{ cursor: "pointer" }}>
                  {on && (
                    <line
                      x1={x}
                      y1={y - 34}
                      x2={x}
                      y2={y + 34}
                      stroke="var(--imagine)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  )}
                  <circle cx={x} cy={y} r="7" fill={on ? "var(--imagine)" : "var(--paper)"} stroke="var(--ink)" strokeWidth="1.2" />
                  <text
                    x={x}
                    y={y - 14}
                    textAnchor="middle"
                    className="font-mono"
                    fontSize={fs}
                    fill={on ? "var(--imagine)" : "var(--ink-muted)"}
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}

            {/* the selected moment, close up */}
            <rect
              x={panel.x}
              y={panel.y}
              width={panel.w}
              height={panel.h}
              fill="none"
              stroke="var(--rule)"
              strokeWidth="1"
            />
            <text x={panel.x + 8} y={panel.y + fs + 4} className="font-mono" fontSize={fs} fill="var(--ink-faint)">
              {T.momentN(sel + 1)}
            </text>

            {ghosts && (
              <g fill="none" stroke="var(--actual)" strokeWidth="1.4" opacity="0.4">
                <path d={poly(d.ghostL)} />
                <path d={poly(d.ghostR)} />
              </g>
            )}
            <path d={poly(d.askL)} fill="none" stroke="var(--imagine)" strokeWidth="2" strokeDasharray="6 4" />
            <path d={poly(d.askR)} fill="none" stroke="var(--imagine)" strokeWidth="2" />
            <circle cx={ox} cy={oy} r="5" fill="var(--actual)" />
            <text x={ox - 8} y={oy + fs + 8} textAnchor="end" className="font-mono" fontSize={fs} fill="var(--actual)">
              {T.given}
            </text>
            <text x={ox + 156} y={askLEnd[1] - 4} className="font-mono" fontSize={fs} fill="var(--imagine)">
              {T.askedLeft}
            </text>
            <text x={ox + 156} y={askREnd[1] + fs + 4} className="font-mono" fontSize={fs} fill="var(--imagine)">
              {T.askedRight}
            </text>

            {/* the two bars, one shared scale */}
            <text x={bars.x} y={lab1Y} className="font-mono" fontSize={fs} fill="var(--ink-muted)">
              {T.shouldBar}
            </text>
            <rect x={bars.x} y={bar1Y} width={bars.w} height={barH} fill="var(--paper-sunk)" />
            <rect x={bars.x} y={bar1Y} width={SHOULD[sel] * bars.w} height={barH} fill="var(--actual)" />
            <text x={bars.x} y={lab2Y} className="font-mono" fontSize={fs} fill="var(--ink-muted)">
              {T.didBar}
            </text>
            <rect x={bars.x} y={bar2Y} width={bars.w} height={barH} fill="var(--paper-sunk)" />
            <rect x={bars.x} y={bar2Y} width={DID[sel] * bars.w} height={barH} fill="var(--imagine)" />
          </svg>
        </div>
      </div>

      {/* the strip: the summary and the control at once */}
      <div data-print-hide className="px-4 pt-4 md:px-8">
        <p className="label !text-[0.6rem]">{T.strip}</p>
        <div className="mt-2 grid grid-cols-6 gap-1" role="group" aria-label={T.strip}>
          {Array.from({ length: MOMENTS }, (_, i) => {
            const on = i === sel;
            return (
              <button
                key={i}
                type="button"
                aria-pressed={on}
                aria-label={T.momentN(i + 1)}
                onClick={() => setSel(i)}
                className={`border px-2 py-2 transition-colors ${
                  on ? "border-imagine" : "border-rule hover:border-ink"
                }`}
              >
                <svg viewBox="0 0 40 20" className="block w-full" aria-hidden>
                  <rect x="0" y="2" width="40" height="6" fill="var(--paper-sunk)" />
                  <rect x="0" y="2" width={SHOULD[i] * 40} height="6" fill="var(--actual)" />
                  <rect x="0" y="12" width="40" height="6" fill="var(--paper-sunk)" />
                  <rect x="0" y="12" width={DID[i] * 40} height="6" fill="var(--imagine)" />
                </svg>
                <span className={`tnum mt-1 block font-mono text-[0.62rem] ${on ? "text-imagine" : "text-ink-muted"}`}>
                  {i + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        data-print-hide
        className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8"
      >
        <label className="flex cursor-pointer items-center gap-3">
          <span className="label whitespace-nowrap">{T.ghosts}</span>
          <button
            type="button"
            role="switch"
            aria-checked={ghosts}
            aria-label={T.ghosts}
            onClick={() => setGhosts((g) => !g)}
            className={`relative h-6 w-11 shrink-0 border transition-colors ${
              ghosts ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"
            }`}
          >
            <span
              className={`absolute top-[3px] h-4 w-4 transition-all ${
                ghosts ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"
              }`}
            />
          </button>
          <span className="label !text-ink">{ghosts ? T.on : T.off}</span>
        </label>

        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {atJunction ? T.vJunction : T.vCorridor}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.rMoment, T.ofN(sel + 1, MOMENTS)],
          [T.rStake, atJunction ? T.stakeAll : T.stakeNone],
          [T.rObeyed, atJunction ? T.obeyNo : T.obeyYes],
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
