"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * Two training runs, both ending at a loss of zero.
 *
 * A pixel loss of zero means the frame was predicted, and there is nothing
 * more to say. An embedding loss of zero is two numbers wearing one face: the
 * descriptions may still tell left from right, or they may all have become the
 * same point. The curve is identical either way. Only a probe, a test of what
 * the embeddings can do, tells the two apart. The curves and clouds are
 * illustrative.
 */

type Text = {
  pixel: string; embed: string; loss: string; steps: string;
  predicted: string; actual: string; frameLine: string;
  learned: string; collapsed: string; lossZero: string; left: string; right: string;
  sameCurve: string; probeYes: string; probeNo: string; illustrative: string;
  btnPixel: string; btnEmbed: string; btnProbe: string; probeHint: string; reset: string;
  v0: string; v1: string; v2: string; v3: string;
  rLossPixel: string; rLossEmbed: string; rTells: string; everything: string; nothing: string; notYet: string;
  ariaPixel: string; ariaEmbed: string; ariaHidden: string; ariaProbed: string;
};

const TEXT: LocaleText<Text> = {
  en: {
    pixel: "pixel loss",
    embed: "embedding loss",
    loss: "loss",
    steps: "training steps",
    predicted: "predicted",
    actual: "actual",
    frameLine: "loss 0 = the frame was predicted",
    learned: "learned something",
    collapsed: "collapsed",
    lossZero: "loss 0",
    left: "left turns",
    right: "right turns",
    sameCurve: "the curve looked the same in both cases",
    probeYes: "left from right: yes",
    probeNo: "left from right: no",
    illustrative: "curves are illustrative",
    btnPixel: "Reveal the pixel run",
    btnEmbed: "Reveal the embedding run",
    btnProbe: "Probe it",
    probeHint: "test what the embeddings can do",
    reset: "Reset",
    v0: "Both curves reach zero. Press Reveal.",
    v1: "A pixel loss of zero means one thing: the frame was predicted.",
    v2: "An embedding loss of zero can mean two things, and the curve cannot tell you which.",
    v3: "Only testing what the embeddings can do tells them apart.",
    rLossPixel: "pixel loss at the end",
    rLossEmbed: "embedding loss at the end",
    rTells: "what that zero tells you",
    everything: "everything",
    nothing: "nothing on its own",
    notYet: "not yet revealed",
    ariaPixel: "Pixel loss falling to zero over training. Revealed: a predicted frame and the actual frame, identical. Loss 0 means the frame was predicted.",
    ariaEmbed: "Embedding loss falling to zero over training. Revealed: two states with the same loss of zero, one where the descriptions form two groups, left turns and right turns, and one where every description sits on the same spot.",
    ariaHidden: "A loss curve falling to zero over training. Not yet revealed.",
    ariaProbed: "A probe line separates the two groups in the first cloud and cannot separate anything in the collapsed one.",
  },
};

const W = 440;
const H = 322;
/** the curve: same shape in both panels, which is the point */
const CURVE = (() => {
  const pts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const x = 48 + (i / 60) * 368;
    const y = 110 - 88 * Math.exp(-i / 11);
    pts.push(`${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(" ");
})();

/** a small frame: sky, road, a block on the road; identical for predicted and actual */
const FRAME: string[][] = [
  ["s", "s", "s", "s", "s", "s"],
  ["r", "r", "r", "r", "r", "r"],
  ["r", "r", "c", "c", "r", "r"],
  ["r", "r", "r", "r", "r", "r"],
];
const CELL: Record<string, string> = { s: "var(--paper-sunk)", r: "var(--rule)", c: "var(--rule-strong)" };

/** fixed jitter so the clouds are the same on every visit */
const LEFT_GROUP: [number, number][] = [[-14, -8], [-4, 6], [8, -12], [2, 14], [-12, 10], [12, 4]];
const RIGHT_GROUP: [number, number][] = [[-10, 6], [6, -10], [14, 8], [-2, -2], [-14, -12], [4, 12]];
const PILE: [number, number][] = [[0, 0], [1, -1], [-1, 1], [1, 1], [-1, -1], [0, 2], [2, 0], [-2, 0], [0, -2], [1, 2], [-2, 1], [2, -1]];

type Last = "none" | "pixel" | "embed" | "probe";

export function TwoZeroLosses() {
  const still = useReducedMotion();
  const { ref, compact } = useCompact(640);
  const k = compact ? 1.65 : 1;
  const locale = useLocale();
  const T = pickText(TEXT, locale);

  const [pixelOpen, setPixelOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [probed, setProbed] = useState(false);
  const [last, setLast] = useState<Last>("none");

  const revealPixel = () => { setPixelOpen(true); setLast("pixel"); };
  const revealEmbed = () => { setEmbedOpen(true); setLast("embed"); };
  const probe = () => { setProbed(true); setLast("probe"); };
  const reset = () => { setPixelOpen(false); setEmbedOpen(false); setProbed(false); setLast("none"); };

  const verdict = last === "probe" ? T.v3 : last === "embed" ? T.v2 : last === "pixel" ? T.v1 : T.v0;

  const fade = { initial: { opacity: still ? 1 : 0 }, animate: { opacity: 1 }, transition: { duration: still ? 0 : 0.35 } };
  const fs = 11 * k;
  const fsSmall = 10 * k;

  const curve = (title: string) => (
    <g>
      <text x={48} y={12} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-muted)">
        {title.toUpperCase()}
      </text>
      <line x1={48} y1={22} x2={48} y2={110} stroke="var(--rule-strong)" strokeWidth="1" />
      <line x1={48} y1={110} x2={416} y2={110} stroke="var(--rule-strong)" strokeWidth="1" />
      <text x={42} y={114} textAnchor="end" className="font-mono tnum" fontSize={fsSmall} fill="var(--ink-muted)">0</text>
      <text x={416} y={124} textAnchor="end" className="font-mono" fontSize={fsSmall} fill="var(--ink-faint)">
        {T.steps}
      </text>
      <path d={CURVE} fill="none" stroke="var(--actual)" strokeWidth="2" strokeLinecap="round" />
      <circle cx={416} cy={110} r="3.5" fill="var(--actual)" />
    </g>
  );

  const frame = (x: number, y: number, label: string, color: string) => (
    <g>
      <text x={x + 60} y={y - 8} textAnchor="middle" className="font-mono" fontSize={fsSmall} fill={color}>{label}</text>
      {FRAME.map((row, r) =>
        row.map((c, i) => (
          <rect key={`${r}-${i}`} x={x + i * 20} y={y + r * 20} width={20} height={20} fill={CELL[c]} />
        )),
      )}
      <rect x={x} y={y} width={120} height={80} fill="none" stroke={color} strokeWidth="1.5" />
    </g>
  );

  const dots = (cx: number, cy: number, pts: [number, number][], hollow = false) =>
    pts.map(([dx, dy], i) => (
      <circle key={i} cx={cx + dx} cy={cy + dy} r="4" fill={hollow ? "var(--paper-raised)" : "var(--actual)"}
        stroke="var(--actual)" strokeWidth="1.5" />
    ));

  const pixelAria = pixelOpen ? T.ariaPixel : T.ariaHidden;
  const embedAria = embedOpen ? `${T.ariaEmbed}${probed ? ` ${T.ariaProbed}` : ""}` : T.ariaHidden;

  return (
    <div>
      <div ref={ref} className={`grid gap-x-6 px-4 pt-5 md:px-8 ${compact ? "grid-cols-1 gap-y-2" : "grid-cols-2"}`}>
        {/* pixel run */}
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={pixelAria}>
          {curve(T.pixel)}
          {pixelOpen && (
            <motion.g {...fade}>
              {frame(70, 156, T.predicted, "var(--imagine)")}
              {frame(250, 156, T.actual, "var(--actual)")}
              <text x={W / 2} y={266} textAnchor="middle" className="font-mono tnum" fontSize={fs} fill="var(--ink)">
                {T.frameLine}
              </text>
            </motion.g>
          )}
        </svg>

        {/* embedding run */}
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={embedAria}>
          {curve(T.embed)}
          {embedOpen && (
            <motion.g {...fade}>
              {/* (i) learned something: two groups */}
              <text x={110} y={148} textAnchor="middle" className="font-mono" fontSize={fsSmall} fill="var(--ink-muted)">
                {T.learned}
              </text>
              {dots(70, 200, LEFT_GROUP)}
              {dots(150, 200, RIGHT_GROUP, true)}
              {!compact && (
                <>
                  <text x={70} y={238} textAnchor="middle" className="font-mono" fontSize={fsSmall} fill="var(--ink-faint)">{T.left}</text>
                  <text x={150} y={238} textAnchor="middle" className="font-mono" fontSize={fsSmall} fill="var(--ink-faint)">{T.right}</text>
                </>
              )}
              <text x={110} y={262} textAnchor="middle" className="font-mono tnum" fontSize={fs} fill="var(--ink)">{T.lossZero}</text>

              {/* (ii) collapsed: the same points on one spot */}
              <text x={330} y={148} textAnchor="middle" className="font-mono" fontSize={fsSmall} fill="var(--ink-muted)">
                {T.collapsed}
              </text>
              {dots(330, 200, PILE)}
              <text x={330} y={262} textAnchor="middle" className="font-mono tnum" fontSize={fs} fill="var(--ink)">{T.lossZero}</text>

              <text x={W / 2} y={310} textAnchor="middle" className="font-mono" fontSize={fsSmall} fill="var(--ink-faint)">
                {T.sameCurve}
              </text>

              {probed && (
                <motion.g {...fade}>
                  <line x1={110} y1={160} x2={110} y2={244} stroke="var(--ink)" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1={330} y1={160} x2={330} y2={244} stroke="var(--ink)" strokeWidth="1" strokeDasharray="3 3" />
                  <text x={110} y={283} textAnchor="middle" className="font-mono" fontSize={fsSmall} fill="var(--ink)">{T.probeYes}</text>
                  <text x={330} y={283} textAnchor="middle" className="font-mono" fontSize={fsSmall} fill="var(--imagine)">{T.probeNo}</text>
                </motion.g>
              )}
            </motion.g>
          )}
        </svg>
      </div>
      <p className="label px-4 pb-3 pt-1 md:px-8 !text-ink-faint">{T.illustrative}</p>

      <div data-print-hide className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <button type="button" onClick={revealPixel} aria-pressed={pixelOpen}
          className={`border px-5 py-2 transition-colors ${
            pixelOpen ? "border-imagine bg-imagine text-paper" : "border-rule-strong bg-paper text-ink hover:border-ink"
          }`}>
          <span className={`label whitespace-nowrap ${pixelOpen ? "!text-paper" : ""}`}>{T.btnPixel}</span>
        </button>
        <button type="button" onClick={revealEmbed} aria-pressed={embedOpen}
          className={`border px-5 py-2 transition-colors ${
            embedOpen ? "border-imagine bg-imagine text-paper" : "border-rule-strong bg-paper text-ink hover:border-ink"
          }`}>
          <span className={`label whitespace-nowrap ${embedOpen ? "!text-paper" : ""}`}>{T.btnEmbed}</span>
        </button>
        {embedOpen && (
          <span className="flex items-center gap-3">
            <button type="button" onClick={probe} aria-pressed={probed}
              className={`border px-5 py-2 transition-colors ${
                probed ? "border-imagine bg-imagine text-paper" : "border-rule-strong bg-paper text-ink hover:border-ink"
              }`}>
              <span className={`label whitespace-nowrap ${probed ? "!text-paper" : ""}`}>{T.btnProbe}</span>
            </button>
            <span className="label">{T.probeHint}</span>
          </span>
        )}
        {(pixelOpen || embedOpen) && (
          <button type="button" onClick={reset} className="border border-rule-strong bg-paper px-4 py-1.5 text-ink transition-colors hover:border-ink">
            <span className="label whitespace-nowrap">{T.reset}</span>
          </button>
        )}
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">{verdict}</p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-2 md:grid-cols-4">
        {[
          [T.rLossPixel, "0"],
          [T.rTells, pixelOpen ? T.everything : T.notYet],
          [T.rLossEmbed, "0"],
          [T.rTells, embedOpen ? T.nothing : T.notYet],
        ].map(([key, v], i) => (
          <div key={i} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{key}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
