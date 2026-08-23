"use client";

import { useReducedMotion } from "motion/react";
import { useState } from "react";
import { Room, ROOM_W, ROOM_H } from "./latent-room";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * Two situations that lead to different outcomes, landing on one point.
 *
 * The corridors are identical except for which way the ball is rolling, and
 * that difference is a few pixels of arrow. A squeeze scored on redrawing the
 * frame has no reason to keep it, so A and B land on the same point and the
 * redraw still looks fine. Scored on the next frame instead, the direction is
 * the one thing that decides the answer, so the two land apart.
 *
 * Everything here is illustrative: the coordinates are chosen, not learned.
 */

type Scene = "A" | "B";
type Score = "redraw" | "predict";

type Text = {
  sceneA: string; sceneB: string; pad: string; redraw: string; redrawFine: string;
  pressA: string; pressB: string; scoredOn: string; onRedraw: string; onPredict: string;
  question: string; cannotTell: string; left: string; right: string; pressFirst: string;
  land: string; samePoint: string; twoPoints: string; pressBoth: string;
  vBefore: string; vRedraw: string; vPredict: string;
  aria: (pressed: string, scoring: string, landing: string) => string;
  ariaNone: string; ariaSame: string; ariaApart: string; ariaOne: string;
};

const TEXT: LocaleText<Text> = {
  en: {
    sceneA: "corridor A", sceneB: "corridor B", pad: "where it lands",
    redraw: "redraw", redrawFine: "redraw: fine",
    pressA: "Press A", pressB: "Press B",
    scoredOn: "Scored on", onRedraw: "redrawing the frame", onPredict: "predicting the next frame",
    question: "Which way will the ball go?",
    cannotTell: "cannot tell from here", left: "left", right: "right", pressFirst: "press a corridor first",
    land: "Where the two land", samePoint: "the same point", twoPoints: "two points apart",
    pressBoth: "press both to see",
    vBefore: "Press A, then B, and watch the square.",
    vRedraw: "Two futures, one point. Nothing after the squeeze can tell them apart, and the redraw looked fine.",
    vPredict: "Scored on what comes next, the squeeze had to keep the direction, so the two land apart.",
    aria: (pressed, scoring, landing) =>
      `Two corridors, A and B, identical except that the ball rolls left in A and right in B. ${pressed} Scored on ${scoring}. ${landing}`,
    ariaNone: "Nothing pressed yet.", ariaOne: "Only one corridor has been pressed so far.",
    ariaSame: "A and B land on the same point.", ariaApart: "A and B land on two separate points.",
  },
};

/** the corridor both scenes share */
const CORRIDOR: [number, number] = [0.5, 0.5];
const BALL = { x: ROOM_W / 2, y: ROOM_H * 0.8, r: 8 };

/** where each scene lands, illustrative: [depth-like, offset-like] in 0..1 */
const LANDING: Record<Score, Record<Scene, [number, number]>> = {
  redraw: { A: [0.5, 0.5], B: [0.5, 0.5] },
  predict: { A: [0.5, 0.24], B: [0.5, 0.76] },
};

function Corridor({ scene, arrow }: { scene: Scene; arrow: boolean }) {
  const dir = scene === "A" ? -1 : 1;
  const x0 = BALL.x + dir * (BALL.r + 4);
  const x1 = x0 + dir * 22;
  return (
    <svg viewBox={`0 0 ${ROOM_W} ${ROOM_H}`} className="block w-full" aria-hidden>
      <rect width={ROOM_W} height={ROOM_H} fill="var(--paper-sunk)" />
      <Room z={CORRIDOR} />
      <circle cx={BALL.x} cy={BALL.y} r={BALL.r} fill="var(--ink)" />
      {/* the only difference between the two scenes, and it is a few pixels */}
      {arrow && (
        <g stroke="var(--imagine)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1={x0} y1={BALL.y} x2={x1} y2={BALL.y} />
          <path d={`M ${x1 - dir * 6} ${BALL.y - 5} L ${x1} ${BALL.y} L ${x1 - dir * 6} ${BALL.y + 5}`} />
        </g>
      )}
    </svg>
  );
}

export function SamePointTwoFutures() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const { ref, compact } = useCompact(640);
  const still = useReducedMotion();
  const [pressed, setPressed] = useState<Scene | null>(null);
  const [seen, setSeen] = useState<Set<Scene>>(() => new Set());
  const [score, setScore] = useState<Score>("redraw");

  const press = (s: Scene) => {
    setPressed(s);
    setSeen((prev) => (prev.has(s) ? prev : new Set(prev).add(s)));
  };

  const both = seen.has("A") && seen.has("B");
  const other: Scene | null = pressed === "A" ? "B" : pressed === "B" ? "A" : null;
  const point = pressed ? LANDING[score][pressed] : null;
  const ghost = both && other ? LANDING[score][other] : null;
  const answer = !pressed ? T.pressFirst : score === "redraw" ? T.cannotTell : pressed === "A" ? T.left : T.right;
  const landing = !both ? T.pressBoth : score === "redraw" ? T.samePoint : T.twoPoints;
  const verdict = !both ? T.vBefore : score === "redraw" ? T.vRedraw : T.vPredict;

  const ariaPressed = pressed
    ? `Corridor ${pressed} is pressed.`
    : T.ariaNone;
  const ariaLanding = !both ? (pressed ? T.ariaOne : "") : score === "redraw" ? T.ariaSame : T.ariaApart;
  const aria = T.aria(ariaPressed, score === "redraw" ? T.onRedraw : T.onPredict, ariaLanding);

  const dotStyle = (z: [number, number]): React.CSSProperties => ({
    left: `${z[1] * 100}%`,
    top: `${(1 - z[0]) * 100}%`,
    transition: still ? "none" : "left 320ms ease, top 320ms ease",
  });

  const btn = (active: boolean) =>
    `border px-4 py-1.5 transition-colors ${
      active ? "border-imagine bg-imagine text-paper" : "border-rule-strong bg-paper text-ink hover:border-ink"
    }`;

  return (
    <div>
      <div ref={ref} role="img" aria-label={aria}
        className={`grid gap-6 px-5 pt-6 md:px-8 ${compact ? "grid-cols-1" : "grid-cols-[minmax(0,1fr)_minmax(0,12rem)_minmax(0,1fr)] items-start"}`}>
        {/* the two situations */}
        <div className={`grid gap-4 ${compact ? "grid-cols-2" : "grid-cols-1"}`}>
          {(["A", "B"] as const).map((s) => (
            <div key={s}
              className={`border transition-colors ${pressed === s ? "border-imagine" : "border-rule"}`}>
              <Corridor scene={s} arrow />
              <span className={`label block px-2 py-1.5 !text-[0.58rem] ${pressed === s ? "!text-imagine" : ""}`}>
                {s === "A" ? T.sceneA : T.sceneB}
              </span>
            </div>
          ))}
        </div>

        {/* the space the squeeze lands in */}
        <div className={compact ? "mx-auto w-full max-w-[14rem]" : ""}>
          <div className="relative aspect-square w-full border border-rule-strong bg-paper">
            {[0.25, 0.5, 0.75].map((g) => (
              <span key={g}>
                <span className="absolute left-0 right-0 h-px bg-rule" style={{ top: `${g * 100}%` }} />
                <span className="absolute bottom-0 top-0 w-px bg-rule" style={{ left: `${g * 100}%` }} />
              </span>
            ))}
            {ghost && (
              <span className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-actual opacity-50"
                style={dotStyle(ghost)} />
            )}
            {point && (
              <span className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-actual"
                style={dotStyle(point)} />
            )}
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <p className="label !text-[0.58rem]">{T.pad}</p>
            <p className="label tnum !text-ink">{point ? `${point[0].toFixed(2)}, ${point[1].toFixed(2)}` : "·"}</p>
          </div>
        </div>

        {/* what comes back out, which is fine either way */}
        <div className={compact ? "mx-auto w-full max-w-[18rem]" : ""}>
          <div className="border border-rule">
            {pressed ? (
              <Corridor scene={pressed} arrow={false} />
            ) : (
              <svg viewBox={`0 0 ${ROOM_W} ${ROOM_H}`} className="block w-full" aria-hidden>
                <rect width={ROOM_W} height={ROOM_H} fill="var(--paper-sunk)" />
              </svg>
            )}
            <span className="label block px-2 py-1.5 !text-[0.58rem]">{pressed ? T.redrawFine : T.redraw}</span>
          </div>
        </div>
      </div>

      <div data-print-hide className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-center gap-2">
          {(["A", "B"] as const).map((s) => (
            <button key={s} type="button" onClick={() => press(s)} aria-pressed={pressed === s}
              className={btn(pressed === s)}>
              <span className={`label ${pressed === s ? "!text-paper" : ""}`}>{s === "A" ? T.pressA : T.pressB}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="label whitespace-nowrap">{T.scoredOn}</span>
          {(["redraw", "predict"] as const).map((s) => (
            <button key={s} type="button" onClick={() => setScore(s)} aria-pressed={score === s}
              className={btn(score === s)}>
              <span className={`label !normal-case !tracking-normal ${score === s ? "!text-paper" : ""}`}>
                {s === "redraw" ? T.onRedraw : T.onPredict}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{T.question}</p>
          <p className="mt-1 text-[0.98rem] leading-snug text-ink">{answer}</p>
        </div>
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{T.land}</p>
          <p className="mt-1 text-[0.98rem] leading-snug text-ink">{landing}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center border-t border-rule px-5 py-4 md:px-8">
        <p className="label max-w-[62ch] !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">{verdict}</p>
      </div>
    </div>
  );
}
