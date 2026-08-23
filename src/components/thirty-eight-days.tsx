"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * The Atari bill, in days.
 *
 * Two published numbers: about fifty million frames per game, which is roughly
 * thirty eight days of play, against the two hours the human tester got. The
 * two hours is the tick you can barely see at the left edge, and that is the
 * figure's first point.
 *
 * Everything else is a conversion and is labelled as one. Where the play has
 * to happen decides what thirty eight days costs on a wall clock, and carrying
 * a model moves most of the play off the world and onto a processor, which is
 * cheaper and not free.
 */

const PLAY_DAYS = 38;
const REAL_WITH_MODEL = 4;
/** 2 hours as a fraction of 38 days: the tick is meant to be almost invisible */
const HUMAN_FRACTION = 2 / (PLAY_DAYS * 24);
/** illustrative: an emulator runs about this much faster than real time */
const EMULATOR_SPEED = 300;
/** illustrative: an arm needs picking up, so wall clock runs longer than the play */
const ARM_OVERHEAD = 2.4;

type Strings = {
  head1: string;
  head2: string;
  head2Short: string;
  human: string;
  humanShort: string;
  realLabel: string;
  imaginedLabel: string;
  computing: (phrase: string) => string;
  clockLabel: string;
  whereLabel: string;
  places: [string, string, string];
  notes: [string, string, string];
  carry: string;
  mistakes: [string, string, string];
  reads: [string, string, string, string];
  days: (n: number) => string;
  aboutDays: (n: number) => string;
  hours: (n: number) => string;
  minutes: (n: number) => string;
  months: (n: number) => string;
  noJunction: (d: number) => string;
  split: (real: number, imagined: number) => string;
  v: [string, string, string];
  vModel: string;
  join: string;
  aria: (verdict: string) => string;
};

const TEXT: LocaleText<Strings> = {
  en: {
    head1: "38 days of play",
    head2: "published: about fifty million frames of each game",
    head2Short: "published: about 50 million frames",
    human: "what the human tester got: 2 hours, published",
    humanShort: "the tester got 2 hours",
    realLabel: "real contact",
    imaginedLabel: "played inside the model",
    computing: (p) => `${p} of computing time`,
    clockLabel: "wall clock where you put it",
    whereLabel: "where the play happens",
    places: ["an emulator", "a robot arm", "the junction"],
    notes: [
      "about 300 times faster than real time, and nothing wears out",
      "real time, plus picking it up again, and something wears out",
      "real time, and a wrong forecast is a collision you do not get to undo",
    ],
    carry: "carry a model",
    mistakes: ["nothing", "a reset", "a collision"],
    reads: ["play needed", "real contact", "wall clock where you put it", "what one mistake costs"],
    days: (n) => `${n} days`,
    aboutDays: (n) => `about ${n} days`,
    hours: (n) => `about ${n} hours`,
    minutes: (n) => `about ${n} minutes`,
    months: (n) => `about ${n} months`,
    noJunction: (d) => `you do not get ${d} days of this`,
    split: (r, i) => `${r} days real, ${i} imagined`,
    v: [
      "In an emulator, 38 days of play is an afternoon. This is why the Atari results happened in a simulator.",
      "On an arm, 38 days of play is a quarter of a year and a maintenance schedule.",
      "Nobody gets 38 days of misjudging junctions. The bill cannot be paid in this currency.",
    ],
    vModel:
      "Four days of real contact and the rest imagined. The imagined part still costs computing time.",
    join: " ",
    aria: (verdict) =>
      `One bar, 38 days of play, with a tick at 2 hours for the human tester. Those two figures are published; the conversions to wall clock are illustrative. ${verdict}`,
  },
};

/** wall clock hours for a given place and a given amount of real play */
function wallHours(place: number, realDays: number) {
  if (place === 0) return (realDays * 24) / EMULATOR_SPEED;
  if (place === 1) return realDays * 24 * ARM_OVERHEAD;
  return realDays * 24;
}

function phrase(h: number, s: Strings) {
  if (h < 1) return s.minutes(Math.max(5, Math.round((h * 60) / 5) * 5));
  if (h < 36) return s.hours(Math.round(h));
  const d = h / 24;
  if (d < 45) return s.aboutDays(Math.round(d));
  return s.months(Math.round(d / 30.4));
}

export function ThirtyEightDays() {
  const still = useReducedMotion();
  const locale = useLocale();
  const s = pickText(TEXT, locale);
  const { ref, compact } = useCompact(600);

  const [place, setPlace] = useState(0);
  const [model, setModel] = useState(false);

  const realDays = model ? REAL_WITH_MODEL : PLAY_DAYS;
  const imaginedDays = PLAY_DAYS - realDays;
  const clock =
    place === 2 ? s.noJunction(realDays) : phrase(wallHours(place, realDays), s);
  const computing = s.computing(phrase((imaginedDays * 24) / EMULATOR_SPEED, s));
  const verdict = [s.v[place], model ? s.vModel : ""].filter(Boolean).join(s.join);

  const fs = compact ? 17 : 11;
  const W = compact ? 560 : 900;
  const L = compact ? 16 : 40;
  const R = compact ? 16 : 40;
  const barW = W - L - R;
  const barY = compact ? 104 : 74;
  const barH = compact ? 52 : 44;
  const tickX = L + barW * HUMAN_FRACTION;
  const splitX = L + barW * (realDays / PLAY_DAYS);
  const H = compact ? 330 : 232;
  const clockY = compact ? 304 : 208;

  const cellW = barW / PLAY_DAYS;

  return (
    <div>
      <div ref={ref} className="px-4 pt-6 md:px-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={s.aria(verdict)}>
          <text x={L} y={fs * 1.6} className="font-mono" fontSize={fs} letterSpacing="1" fill="var(--ink)">
            {s.head1}
          </text>
          <text x={L} y={fs * 3.1} className="font-mono" fontSize={fs} fill="var(--ink-faint)">
            {compact ? s.head2Short : s.head2}
          </text>

          {/* the bar: 38 day cells when there is room, one length of days when there is not */}
          {compact ? (
            <>
              <rect x={L} y={barY} width={barW} height={barH} fill="var(--actual)" />
              {model && (
                <rect x={splitX} y={barY} width={L + barW - splitX} height={barH} fill="var(--imagine)" />
              )}
            </>
          ) : (
            Array.from({ length: PLAY_DAYS }, (_, i) => (
              <rect
                key={i}
                x={L + i * cellW}
                y={barY}
                width={Math.max(1, cellW - 1.6)}
                height={barH}
                fill={model && i >= REAL_WITH_MODEL ? "var(--imagine)" : "var(--actual)"}
              />
            ))
          )}

          {/* two hours, at the left edge, which is the point */}
          <line x1={tickX} y1={barY - 22} x2={tickX} y2={barY + barH + 6}
            stroke="var(--ink)" strokeWidth="1.4" />
          <text x={tickX + 8} y={barY - 24} className="font-mono" fontSize={fs} fill="var(--ink)">
            {compact ? s.humanShort : s.human}
          </text>

          {/* what the two parts of the bar are */}
          <text x={L} y={barY + barH + fs * 1.9} className="font-mono" fontSize={fs} fill="var(--actual)">
            {s.realLabel} {s.days(realDays)}
          </text>
          {model && (
            <>
              <text x={compact ? L : Math.max(splitX, L + 230)} y={barY + barH + fs * (compact ? 3.2 : 1.9)}
                className="font-mono" fontSize={fs} fill="var(--imagine)">
                {s.imaginedLabel} {s.days(imaginedDays)}
              </text>
              <text x={compact ? L : Math.max(splitX, L + 230)} y={barY + barH + fs * (compact ? 4.5 : 3.2)}
                className="font-mono" fontSize={fs} fill="var(--ink-faint)">
                {computing}
              </text>
            </>
          )}

          {/* the clock */}
          <text x={L} y={clockY - fs * 2.6} className="font-mono" fontSize={fs} letterSpacing="1"
            fill="var(--ink-faint)">
            {s.clockLabel}
          </text>
          <text x={L} y={clockY} className="font-mono tnum" fontSize={fs * (compact ? 1.45 : 2.2)}
            fill="var(--ink)">
            {clock}
          </text>
        </svg>
      </div>

      <div data-print-hide className="mt-2 flex flex-col gap-4 border-t border-rule px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="label whitespace-nowrap">{s.whereLabel}</span>
          <div className="flex flex-wrap gap-2">
            {s.places.map((p, i) => (
              <button
                key={p}
                type="button"
                aria-pressed={i === place}
                onClick={() => setPlace(i)}
                className={`label h-9 border px-5 transition-colors ${
                  i === place
                    ? "border-imagine bg-imagine !text-paper"
                    : "border-rule-strong bg-paper !text-ink hover:border-ink"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <span className="label !normal-case !tracking-normal">{s.notes[place]}</span>
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <span className="label">{s.carry}</span>
          <button
            type="button"
            role="switch"
            aria-checked={model}
            aria-label={s.carry}
            onClick={() => setModel((v) => !v)}
            className={`relative h-6 w-11 border transition-colors ${
              model ? "border-imagine bg-imagine" : "border-rule-strong bg-paper"
            }`}
          >
            <span
              className={`absolute top-[3px] h-4 w-4 transition-all ${
                model ? "left-[25px] bg-paper" : "left-[3px] bg-rule-strong"
              }`}
            />
          </button>
        </label>

        <motion.p
          key={verdict}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: still ? 0 : 0.2 }}
          aria-live="polite"
          className="label max-w-[62ch] !normal-case !tracking-normal !text-[0.8rem]"
        >
          {verdict}
        </motion.p>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-rule bg-rule sm:grid-cols-4">
        {[
          [s.reads[0], model ? s.split(realDays, imaginedDays) : s.days(PLAY_DAYS)],
          [s.reads[1], s.days(realDays)],
          [s.reads[2], clock],
          [s.reads[3], s.mistakes[place]],
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
