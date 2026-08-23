"use client";

import { useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * Who labelled it.
 *
 * Two ways of training, side by side. On the left every example has a tag box
 * that a person has to fill in, so the labels bill grows with the data. On the
 * right the tag box for each frame is simply the next frame of the same
 * recording, and nobody writes anything down. The slider sets the amount of
 * data; the switch says which side is training and lifts that panel. The
 * counts are illustrative and shown rounded.
 */

type Side = "person" | "recording";

/** slider stops: 10, 100, 1k, 10k, 100k, 1M */
const LEVELS = 6;

type Strings = {
  person: string;
  recording: string;
  counter: (n: string) => string;
  nextFrame: string;
  bill: string;
  amount: string;
  whichSide: string;
  sideName: Record<Side, string>;
  examples: string;
  labels: string;
  paid: string;
  budget: string;
  nobody: string;
  verdict: Record<Side, string>;
  words: string[];
  amounts: string[];
  aria: (side: string, n: string) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    person: "Labelled by a person",
    recording: "Labelled by the recording",
    counter: (n) => `labels written by a person: ${n}`,
    nextFrame: "the answer is the next frame",
    bill: "labels bill",
    amount: "Amount of data",
    whichSide: "Which side is training",
    sideName: { person: "person", recording: "recording" },
    examples: "Examples",
    labels: "Labels a person wrote",
    paid: "Who paid",
    budget: "somebody's budget",
    nobody: "nobody",
    verdict: {
      person: "Every example cost somebody a label. The dataset is the size of the budget.",
      recording: "The next frame is the label. Any recording of anything is already a training set.",
    },
    words: ["cat", "dog", "car"],
    amounts: ["10", "100", "1k", "10k", "100k", "1M"],
    aria: (side, n) =>
      `Two ways of training on ${n} examples. Labelled by a person: a person wrote ${n} labels. Labelled by the recording: the answer is the next frame, and a person wrote none. The ${side} side is training.`,
  },
};

const W = 360;

/** a small arrowhead pointing along +x (rotate for other directions) */
function Head({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return (
    <path
      d={`M ${x - 4} ${y - 3} L ${x} ${y} L ${x - 4} ${y + 3}`}
      fill="none"
      stroke="var(--ink-muted)"
      strokeWidth="1"
      transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}
    />
  );
}

function Panel({
  side,
  level,
  compact,
  T,
}: {
  side: Side;
  level: number;
  compact: boolean;
  T: Strings;
}) {
  const k = compact ? 1.5 : 1;
  const n = compact ? 4 : 6;
  const padL = 8;
  const billW = 90;
  const stripW = W - padL - billW;
  const slot = stripW / n;
  const fs = compact ? 34 : 28; // frame size
  const y0 = 14;
  const ty = y0 + fs + 18; // tag box top
  const th = 24; // tag box height
  const tw = 20 + 3 * 6.2 * k; // tag box width, room for a three-letter word
  const H = ty + th + 46;
  const lineY = ty + th + 17;
  const footY = H - 9;

  const person = side === "person";
  const amount = T.amounts[level - 1];

  // the bill bar
  const bx = W - 58;
  const bw = 20;
  const yb = ty + th;
  const hmax = yb - 28;
  const bh = person ? (level / LEVELS) * hmax : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => {
        const cx = padL + slot * i + slot / 2;
        const fx = cx - fs / 2;
        const tx = cx - tw / 2;
        const nextCx = cx + slot;
        return (
          <g key={i}>
            {/* the example */}
            <rect x={fx} y={y0} width={fs} height={fs} fill="var(--paper-sunk)" stroke="var(--rule-strong)" strokeWidth="1" />
            {/* frame to tag box */}
            <line x1={cx} y1={y0 + fs} x2={cx} y2={ty} stroke="var(--rule-strong)" strokeWidth="1" />
            {/* the tag box, where the answer goes */}
            <rect x={tx} y={ty} width={tw} height={th} fill="var(--paper)" stroke="var(--rule-strong)" strokeWidth="1" />

            {person ? (
              <g>
                {/* a person, writing the answer */}
                <circle cx={tx + 8} cy={ty + 8.5} r="2.6" fill="none" stroke="var(--ink)" strokeWidth="1.1" />
                <line x1={tx + 8} y1={ty + 11.2} x2={tx + 8} y2={ty + 19} stroke="var(--ink)" strokeWidth="1.1" />
                <text x={tx + 15} y={ty + th / 2 + 3.5 * k} className="font-mono" fontSize={10 * k} fill="var(--ink)">
                  {T.words[i % T.words.length]}
                </text>
              </g>
            ) : (
              <g>
                {/* the recording itself: frame k to frame k+1 */}
                {i < n - 1 && (
                  <g>
                    <line x1={fx + fs + 2} y1={y0 + fs / 2} x2={nextCx - fs / 2 - 2} y2={y0 + fs / 2} stroke="var(--ink-muted)" strokeWidth="1" />
                    <Head x={nextCx - fs / 2 - 2} y={y0 + fs / 2} />
                  </g>
                )}
                {/* the tag box is simply the next frame */}
                {i < n - 1 ? (
                  <g>
                    <path
                      d={`M ${tx + tw} ${ty + th / 2} H ${nextCx - fs / 2 + 7} V ${y0 + fs + 6}`}
                      fill="none" stroke="var(--ink-muted)" strokeWidth="1"
                    />
                    <Head x={nextCx - fs / 2 + 7} y={y0 + fs + 5} rot={-90} />
                  </g>
                ) : (
                  <g>
                    <line x1={tx + tw} y1={ty + th / 2} x2={tx + tw + 16} y2={ty + th / 2} stroke="var(--ink-muted)" strokeWidth="1" />
                    <Head x={tx + tw + 16} y={ty + th / 2} />
                  </g>
                )}
              </g>
            )}
          </g>
        );
      })}

      {!person && (
        <text x={padL} y={lineY} className="font-mono" fontSize={9.5 * k} fill="var(--ink-muted)">
          {T.nextFrame}
        </text>
      )}

      {/* the bill: how many labels a person had to write */}
      <line x1={bx - 8} y1={yb} x2={bx + bw + 8} y2={yb} stroke="var(--rule-strong)" strokeWidth="1" />
      {person && bh > 0 && (
        <rect x={bx} y={yb - bh} width={bw} height={bh} fill="var(--imagine)" />
      )}
      <text
        x={bx + bw / 2}
        y={yb - bh - 5}
        textAnchor="middle"
        className="font-mono tnum"
        fontSize={10 * k}
        fill={person ? "var(--imagine)" : "var(--ink-muted)"}
      >
        {person ? amount : "0"}
      </text>
      <text x={bx + bw / 2} y={yb + 9.5 * k + 4} textAnchor="middle" className="font-mono" fontSize={9.5 * k} fill="var(--ink-muted)">
        {T.bill}
      </text>

      {/* the counter */}
      <text x={padL} y={footY} className="font-mono tnum" fontSize={9.5 * k} fill="var(--ink)">
        {T.counter(person ? amount : "0")}
      </text>
    </svg>
  );
}

export function WhoLabelledIt() {
  const [level, setLevel] = useState(3);
  const [side, setSide] = useState<Side>("person");
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const { ref, compact } = useCompact(560);

  const amount = T.amounts[level - 1];
  const person = side === "person";
  const toggle = () => setSide((s) => (s === "person" ? "recording" : "person"));

  const panel = (which: Side) => {
    const active = which === side;
    return (
      <div
        className={`border p-3 transition-colors motion-reduce:transition-none ${
          active ? "border-imagine bg-imagine-soft" : "border-rule bg-paper"
        }`}
      >
        <p className={`label ${active ? "!text-ink" : ""}`}>{which === "person" ? T.person : T.recording}</p>
        <div className={`mt-2 transition-opacity motion-reduce:transition-none ${active ? "" : "opacity-60"}`}>
          <Panel side={which} level={level} compact={compact} T={T} />
        </div>
      </div>
    );
  };

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 pb-5 md:px-8">
        <div
          role="img"
          aria-label={T.aria(T.sideName[side], amount)}
          className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-2"}`}
        >
          {panel("person")}
          {panel("recording")}
        </div>
      </div>

      <div data-print-hide className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule px-5 py-4 md:px-8">
        <label className="flex min-w-[min(18rem,100%)] flex-1 items-center gap-3">
          <span className="label whitespace-nowrap">{T.amount}</span>
          <input
            type="range"
            min={1}
            max={LEVELS}
            step={1}
            value={level}
            onChange={(e) => {
              setLevel(Number(e.target.value));
            }}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-rule-strong accent-[var(--imagine)]"
          />
          <span className="label tnum w-12 text-right !normal-case !text-ink">{amount}</span>
        </label>


        <label className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-2">
          <span className="label whitespace-nowrap">{T.whichSide}</span>
          <span className="flex items-center gap-3">
            <span className={`label whitespace-nowrap ${person ? "!text-ink" : ""}`}>{T.sideName.person}</span>
            <button
              type="button"
              role="switch"
              aria-checked={!person}
              aria-label={T.whichSide}
              onClick={toggle}
              className={`relative h-6 w-11 border transition-colors motion-reduce:transition-none ${
                !person ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"
              }`}
            >
              <span
                className={`absolute top-[3px] h-4 w-4 transition-all motion-reduce:transition-none ${
                  !person ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"
                }`}
              />
            </button>
            <span className={`label whitespace-nowrap ${person ? "" : "!text-ink"}`}>{T.sideName.recording}</span>
          </span>
        </label>

        <p className="label basis-full !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {T.verdict[side]}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.examples, amount],
          [T.labels, person ? amount : "0"],
          [T.paid, person ? T.budget : T.nobody],
        ].map(([k, v]) => (
          <div key={k} className="bg-paper px-5 py-3 md:px-8">
            <p className="label">{k}</p>
            <p className="tnum mt-1 text-[0.98rem] text-ink">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
