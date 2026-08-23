"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { useLocale } from "./locale-provider";
import { useCompact } from "./use-compact";

/**
 * Two targets for the same hidden block.
 *
 * Predict the pixels and you need a decoder to turn the prediction back into a
 * picture, and the loss is a pixel error. Predict the summary (an embedding)
 * and there is nothing to turn back: the prediction is compared with another
 * summary. In both cases the encoder is what you keep. The decoder in the
 * first case is built for training and then discarded; in the second it was
 * never built.
 */

type Mode = "pixels" | "summary";

const TEXT = {
  en: {
    target: "Target",
    pixels: "pixels",
    summary: "summary",
    predict: "Predict",
    image: "image, one block hidden",
    encoder: "encoder",
    decoder: "decoder",
    prediction: "prediction",
    reference: "target",
    lossPixels: "loss: pixel error",
    lossSummary: "loss: distance between two summaries",
    keep: "what you keep after training",
    thrown: "built, then thrown away",
    never: "never built",
    promptPixels: "One block is hidden. Predict its pixels.",
    promptSummary: "One block is hidden. Predict its summary.",
    verdict: "Same encoder, different target. One of them never needed a decoder.",
    cellTarget: "Target",
    cellLoss: "Loss",
    cellDecoder: "Decoder",
    pixelsTarget: "the missing pixels",
    summaryTarget: "a summary of the missing piece",
    pixelError: "pixel error",
    distance: "distance between two summaries",
    ariaPixels: (n: number) =>
      `A small image with one block hidden. The encoder feeds a decoder, which redraws the block as a blurry patch, ${n} of 9 cells filled in. The loss is a pixel error. The decoder is built for training, then thrown away.`,
    ariaSummary: (n: number) =>
      `A small image with one block hidden. The encoder predicts a short bar of eight numbers, ${n} of 8 filled in, compared with the target summary. The loss is the distance between two summaries. No decoder is built.`,
  },
};
type Text = (typeof TEXT)["en"];

/* ---------- the image stand-in: a disc on a horizon, 10 by 8 ---------- */

const COLS = 10;
const ROWS = 8;
const CELL = 22;
const MASK = { c0: 3, r0: 2, n: 3 };

/** Brightness of a cell as ink opacity, 0 is paper and 1 is ink. */
function px(c: number, r: number) {
  const d = Math.hypot(c + 0.5 - 6.5, r + 0.5 - 4.2);
  if (d < 2.3) return 0.88;
  if (r >= 6) return 0.42 + (r - 6) * 0.12;
  return 0.1 + r * 0.025;
}

/** The best a pixel loss can do for a block it cannot see: a blurred average. */
function blurred(c: number, r: number) {
  let sum = 0;
  let n = 0;
  for (let dc = -1; dc <= 1; dc++)
    for (let dr = -1; dr <= 1; dr++) {
      const cc = c + dc;
      const rr = r + dr;
      if (cc < 0 || rr < 0 || cc >= COLS || rr >= ROWS) continue;
      sum += px(cc, rr);
      n++;
    }
  return sum / n;
}

/* illustrative embeddings: a target summary and a prediction a little off it */
const TGT = [0.55, 0.8, 0.3, 0.65, 0.2, 0.7, 0.45, 0.6];
const PRD = [0.5, 0.72, 0.36, 0.6, 0.28, 0.66, 0.5, 0.55];

const PATCH = MASK.n * CELL; // 66

function Box({ x, y, w, h, label, fs, dashed, crossed }:
  { x: number; y: number; w: number; h: number; label: string; fs: number; dashed?: boolean; crossed?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="var(--paper)"
        stroke={dashed ? "var(--rule-strong)" : "var(--ink)"} strokeWidth="1.2"
        strokeDasharray={dashed ? "4 4" : undefined} />
      <text x={x + w / 2} y={y + h / 2 + fs * 0.36} textAnchor="middle" className="font-mono"
        fontSize={fs} fill={dashed ? "var(--ink-faint)" : "var(--ink)"}>{label}</text>
      {crossed && (
        <g stroke="var(--imagine)" strokeWidth="1.6">
          <line x1={x + 6} y1={y + 6} x2={x + w - 6} y2={y + h - 6} />
          <line x1={x + w - 6} y1={y + 6} x2={x + 6} y2={y + h - 6} />
        </g>
      )}
    </g>
  );
}

export function PredictTheSummary() {
  const locale = useLocale();
  const s: Text = TEXT[locale as keyof typeof TEXT] ?? TEXT.en;
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const uid = useId();
  const [mode, setMode] = useState<Mode>("pixels");
  const [filled, setFilled] = useState(0);
  const timers = useRef<number[]>([]);

  const n = mode === "pixels" ? 9 : 8;
  const done = filled >= n;

  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  useEffect(() => clear, []);

  // The click is the event: under reduced motion the final state lands at
  // once; otherwise the prediction fills in over a few timeouts, not rAF.
  const predict = () => {
    clear();
    if (still) { setFilled(n); return; }
    setFilled(0);
    for (let i = 1; i <= n; i++) timers.current.push(window.setTimeout(() => setFilled(i), 90 * i));
  };
  const switchTo = (m: Mode) => { clear(); setMode(m); setFilled(0); };

  /* ---------- layout: one row when wide, three rows when compact ---------- */
  const W = compact ? 460 : 900;
  const H = compact ? 560 : 330;
  const fs = compact ? 12.5 : 11;
  const bfs = compact ? 14 : 13;
  const img = { x: 20, y: 36 };
  const L = compact
    ? { enc: { x: 300, y: 100, w: 130, h: 52 }, dec: { x: 20, y: 266, w: 120, h: 52 },
        pred: { x: 190, y: 259 }, tgt: { x: 320, y: 259 }, lossY: 362,
        keepY: 420, kEnc: { x: 20, y: 438, w: 120, h: 40 }, kDec: { x: 190, y: 438, w: 120, h: 40 }, kNoteY: 506 }
    : { enc: { x: 284, y: 100, w: 100, h: 52 }, dec: { x: 428, y: 100, w: 100, h: 52 },
        pred: { x: 572, y: 93 }, tgt: { x: 698, y: 93 }, lossY: 206,
        keepY: 262, kEnc: { x: 284, y: 250, w: 100, h: 40 }, kDec: { x: 428, y: 250, w: 100, h: 40 }, kNoteY: 275 };
  const encMidY = L.enc.y + L.enc.h / 2;
  const predMidY = L.pred.y + PATCH / 2;
  const decMidY = L.dec.y + L.dec.h / 2;
  const arrow = `url(#${uid}-arrow)`;

  // encoder to decoder (or, with no decoder, straight on to the prediction)
  const encOut = compact
    ? `M ${L.enc.x + L.enc.w / 2} ${L.enc.y + L.enc.h} V 226 H ${mode === "pixels" ? L.dec.x + L.dec.w / 2 : L.pred.x + PATCH / 2} V ${(mode === "pixels" ? L.dec.y : L.pred.y) - 3}`
    : `M ${L.enc.x + L.enc.w} ${encMidY} H ${(mode === "pixels" ? L.dec.x : L.pred.x) - 3}`;

  const prompt = mode === "pixels" ? s.promptPixels : s.promptSummary;
  const aria = mode === "pixels" ? s.ariaPixels(Math.min(filled, 9)) : s.ariaSummary(Math.min(filled, 8));

  return (
    <div>
      <div ref={ref} className="px-4 pt-4 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={aria}>
          <defs>
            <pattern id={`${uid}-hatch`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--ink-faint)" strokeWidth="1.2" />
            </pattern>
            <marker id={`${uid}-arrow`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--ink)" />
            </marker>
          </defs>

          {/* the image, with one block hidden */}
          <text x={img.x} y={img.y - 12} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-faint)">{s.image}</text>
          <rect x={img.x} y={img.y} width={COLS * CELL} height={ROWS * CELL} fill="var(--paper)" />
          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              const hidden = c >= MASK.c0 && c < MASK.c0 + MASK.n && r >= MASK.r0 && r < MASK.r0 + MASK.n;
              return hidden ? null : (
                <rect key={`${c}-${r}`} x={img.x + c * CELL} y={img.y + r * CELL} width={CELL} height={CELL}
                  fill="var(--ink)" opacity={px(c, r)} />
              );
            }),
          )}
          <rect x={img.x + MASK.c0 * CELL} y={img.y + MASK.r0 * CELL} width={PATCH} height={PATCH}
            fill={`url(#${uid}-hatch)`} stroke="var(--ink)" strokeWidth="1.2" />
          <rect x={img.x} y={img.y} width={COLS * CELL} height={ROWS * CELL} fill="none" stroke="var(--rule-strong)" strokeWidth="1" />

          {/* encoder, always */}
          <path d={`M ${img.x + COLS * CELL} ${encMidY} H ${L.enc.x - 3}`} fill="none" stroke="var(--ink)" strokeWidth="1.2" markerEnd={arrow} />
          <Box {...L.enc} label={s.encoder} fs={bfs} />
          <path d={encOut} fill="none" stroke="var(--ink)" strokeWidth="1.2" markerEnd={arrow} />

          {/* decoder, only when the target is pixels */}
          {mode === "pixels" && (
            <>
              <Box {...L.dec} label={s.decoder} fs={bfs} />
              <path d={`M ${L.dec.x + L.dec.w} ${decMidY} H ${L.pred.x - 3}`} fill="none" stroke="var(--ink)" strokeWidth="1.2" markerEnd={arrow} />
            </>
          )}

          {/* the prediction and the thing it is scored against */}
          {mode === "pixels" ? (
            <>
              {Array.from({ length: 9 }, (_, i) => {
                const c = MASK.c0 + (i % 3);
                const r = MASK.r0 + Math.floor(i / 3);
                return (
                  <g key={i}>
                    {i < filled && (
                      <rect x={L.pred.x + (i % 3) * CELL} y={L.pred.y + Math.floor(i / 3) * CELL} width={CELL} height={CELL}
                        fill="var(--imagine)" opacity={blurred(c, r)} />
                    )}
                    <rect x={L.tgt.x + (i % 3) * CELL} y={L.tgt.y + Math.floor(i / 3) * CELL} width={CELL} height={CELL}
                      fill="var(--ink)" opacity={px(c, r)} />
                  </g>
                );
              })}
              <rect x={L.pred.x} y={L.pred.y} width={PATCH} height={PATCH} fill="none" stroke="var(--imagine)" strokeWidth="1.2"
                strokeDasharray={done ? undefined : "4 4"} />
              <rect x={L.tgt.x} y={L.tgt.y} width={PATCH} height={PATCH} fill="none" stroke="var(--rule-strong)" strokeWidth="1" />
            </>
          ) : (
            <>
              {PRD.map((v, i) => (
                <g key={i}>
                  {i < filled ? (
                    <rect x={L.pred.x + i * 8.5} y={L.pred.y + PATCH - v * 62} width={6} height={v * 62} fill="var(--imagine)" />
                  ) : (
                    <line x1={L.pred.x + i * 8.5 + 3} y1={L.pred.y + PATCH} x2={L.pred.x + i * 8.5 + 3} y2={L.pred.y + PATCH - 6}
                      stroke="var(--imagine)" strokeWidth="1" strokeDasharray="2 2" />
                  )}
                  <rect x={L.tgt.x + i * 8.5} y={L.tgt.y + PATCH - TGT[i] * 62} width={6} height={TGT[i] * 62} fill="var(--ink-faint)" />
                </g>
              ))}
              <line x1={L.pred.x - 2} y1={L.pred.y + PATCH} x2={L.pred.x + PATCH + 2} y2={L.pred.y + PATCH} stroke="var(--rule-strong)" strokeWidth="1" />
              <line x1={L.tgt.x - 2} y1={L.tgt.y + PATCH} x2={L.tgt.x + PATCH + 2} y2={L.tgt.y + PATCH} stroke="var(--rule-strong)" strokeWidth="1" />
            </>
          )}
          <text x={L.pred.x + PATCH / 2} y={L.pred.y + PATCH + 16} textAnchor="middle" className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--imagine)">{s.prediction}</text>
          <text x={L.tgt.x + PATCH / 2} y={L.tgt.y + PATCH + 16} textAnchor="middle" className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-faint)">{s.reference}</text>
          {/* the loss sits between the two */}
          <line x1={L.pred.x + PATCH + 8} y1={predMidY} x2={L.tgt.x - 8} y2={predMidY} stroke="var(--ink-faint)" strokeWidth="1" strokeDasharray="2 3" />
          <text x={(L.pred.x + L.tgt.x + PATCH) / 2} y={L.lossY} textAnchor="middle" className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-muted)">
            {mode === "pixels" ? s.lossPixels : s.lossSummary}
          </text>

          {/* what survives training */}
          <line x1={20} y1={L.keepY - 26} x2={W - 20} y2={L.keepY - 26} stroke="var(--rule)" strokeWidth="1" />
          <text x={20} y={L.keepY + (compact ? 0 : 13)} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink-faint)">{s.keep}</text>
          <Box {...L.kEnc} label={s.encoder} fs={bfs} />
          <Box {...L.kDec} label={mode === "pixels" ? s.decoder : s.never} fs={bfs} dashed={mode === "summary"} crossed={mode === "pixels"} />
          {mode === "pixels" && (
            <text x={compact ? L.kDec.x : L.kDec.x + L.kDec.w + 16} y={L.kNoteY} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--imagine)">
              {s.thrown}
            </text>
          )}
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <span className="label">{s.target}</span>
          <div role="group" aria-label={s.target} className="flex">
            {(["pixels", "summary"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => switchTo(m)}
                className={`label h-9 border px-5 transition-colors ${
                  mode === m ? "border-imagine bg-imagine !text-paper" : "-ml-px border-rule-strong bg-paper !text-ink hover:border-ink"
                }`}>
                {m === "pixels" ? s.pixels : s.summary}
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={predict}
          className="label h-9 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink">
          {s.predict}
        </button>
        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {done ? s.verdict : prompt}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [s.cellTarget, mode === "pixels" ? s.pixelsTarget : s.summaryTarget],
          [s.cellLoss, mode === "pixels" ? s.pixelError : s.distance],
          [s.cellDecoder, mode === "pixels" ? s.thrown : s.never],
        ].map(([k, v]) => (
          <div key={k} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{k}</p>
            <p className="mt-1 text-[0.98rem] text-ink">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
