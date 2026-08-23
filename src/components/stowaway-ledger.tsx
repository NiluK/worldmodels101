"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText } from "@/lib/locale-text";

/**
 * The stowaways, written up as a ledger.
 *
 * Four rows, one per find in the chapter. The manifest columns (who, asked to,
 * instrument) are always readable. The fourth column, what the predictor had
 * to carry to do the job, starts covered, because none of it was on the
 * manifest. Opening the hold reveals it a row at a time.
 */

const ROWS = 4;
const STAGGER_MS = 250;

type Row = { who: string; asked: string; instrument: string; carried: string };

const TEXT: Record<
  string,
  {
    colWho: string;
    colAsked: string;
    colInstrument: string;
    colCarried: string;
    rows: Row[];
    inHold: string;
    open: string;
    close: string;
    rowsOpen: string;
    nOf: (n: number) => string;
    verdictClosed: string;
    verdictPart: string;
    verdictFull: string;
    aria: (n: number) => string;
    openRow: (who: string) => string;
    closeRow: (who: string) => string;
  }
> = {
  en: {
    colWho: "Year and who",
    colAsked: "Asked to",
    colInstrument: "Instrument",
    colCarried: "Had to carry",
    rows: [
      {
        who: "Opening: the ball",
        asked: "say where the ball will be",
        instrument: "two photographs",
        carried: "direction and speed",
      },
      {
        who: "1948, Claude Shannon",
        asked: "send a message cheaply",
        instrument: "a pencil and probabilities (the maths of information)",
        carried: "how likely each next symbol is",
      },
      {
        who: "1990, Jeffrey Elman",
        asked: "guess the next word",
        instrument: "look at the network's internal states and group them",
        carried: "grammar (nouns and verbs, animate and inanimate)",
      },
      {
        who: "2022, Kenneth Li and colleagues",
        asked: "guess the next legal Othello move",
        instrument: "a probe trained to read one fact out of the activations",
        carried: "the whole board",
      },
    ],
    inHold: "in the hold",
    open: "Open the hold",
    close: "Close the hold",
    rowsOpen: "Rows open",
    nOf: (n) => `${n} of ${ROWS}`,
    verdictClosed: "The manifest lists what each one was asked for. Nothing else is written down.",
    verdictPart: "Open the rest.",
    verdictFull: "None of these was asked for. None of the jobs could be done without them.",
    aria: (n) =>
      `A ledger of four rows: what each system was asked to do, the instrument used to look, and what it had to carry. ${n} of ${ROWS} rows of the Had to carry column are open.`,
    openRow: (who) => `Open the hold for ${who}`,
    closeRow: (who) => `Close the hold for ${who}`,
  },
};

/** Hairline hatch in --rule: the cover over the hold. */
const HATCH: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(135deg, var(--rule) 0, var(--rule) 1px, transparent 1px, transparent 7px)",
};

function Tick() {
  return (
    <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" className="mr-1.5 inline-block shrink-0 align-[-1px]">
      <path d="M1.5 5.5 L4 8 L8.5 2" fill="none" stroke="var(--imagine)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StowawayLedger() {
  const still = useReducedMotion();
  const { ref, compact } = useCompact(560);
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const [open, setOpen] = useState<boolean[]>(() => Array(ROWS).fill(false));
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const nOpen = open.filter(Boolean).length;
  const allOpen = nOpen === ROWS;

  const setRow = (i: number, v: boolean) =>
    setOpen((prev) => (prev[i] === v ? prev : prev.map((o, j) => (j === i ? v : o))));

  /** The first covered row opens on the press itself; the rest follow on timers. */
  const openHold = () => {
    clearTimers();
    const covered = open.map((o, i) => (o ? -1 : i)).filter((i) => i >= 0);
    if (still || covered.length === 0) {
      setOpen(Array(ROWS).fill(true));
      return;
    }
    setRow(covered[0], true);
    covered.slice(1).forEach((i, k) => {
      timers.current.push(window.setTimeout(() => setRow(i, true), (k + 1) * STAGGER_MS));
    });
  };

  const closeHold = () => {
    clearTimers();
    setOpen(Array(ROWS).fill(false));
  };

  const toggleRow = (i: number) => setRow(i, !open[i]);

  const verdict = nOpen === 0 ? T.verdictClosed : allOpen ? T.verdictFull : T.verdictPart;

  const holdCell = (i: number) => {
    const row = T.rows[i];
    return open[i] ? (
      <button
        type="button"
        onClick={() => toggleRow(i)}
        aria-pressed="true"
        aria-label={T.closeRow(row.who)}
        className="block w-full px-3 py-3 text-left text-ink"
      >
        <motion.span
          initial={still ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22 }}
          className="inline"
        >
          <Tick />
          {row.carried}
        </motion.span>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => toggleRow(i)}
        aria-pressed="false"
        aria-label={T.openRow(row.who)}
        style={HATCH}
        className="block h-full min-h-[3rem] w-full px-3 py-3 text-left hover:bg-paper"
      >
        <span className="label bg-paper-raised px-1">{T.inHold}</span>
      </button>
    );
  };

  const cell = "px-3 py-3 align-top text-[0.85rem] leading-snug text-ink";

  return (
    <div>
      <div ref={ref} role="region" aria-label={T.aria(nOpen)} className="px-4 pt-5 md:px-8">
        {compact ? (
          <div className="divide-y divide-rule border-y border-rule">
            {T.rows.map((row, i) => (
              <div key={i} className="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-2 py-3 text-[0.85rem] leading-snug text-ink">
                <span className="label self-start pt-0.5">{T.colWho}</span>
                <span>{row.who}</span>
                <span className="label self-start pt-0.5">{T.colAsked}</span>
                <span>{row.asked}</span>
                <span className="label self-start pt-0.5">{T.colInstrument}</span>
                <span>{row.instrument}</span>
                <span className="label self-start pt-0.5">{T.colCarried}</span>
                <span className="border border-rule">{holdCell(i)}</span>
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col style={{ width: "23%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "29%" }} />
              <col style={{ width: "24%" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-rule-strong">
                <th scope="col" className="label px-3 pb-2 text-left font-normal">{T.colWho}</th>
                <th scope="col" className="label px-3 pb-2 text-left font-normal">{T.colAsked}</th>
                <th scope="col" className="label px-3 pb-2 text-left font-normal">{T.colInstrument}</th>
                <th scope="col" className="label px-3 pb-2 text-left font-normal !text-imagine">{T.colCarried}</th>
              </tr>
            </thead>
            <tbody>
              {T.rows.map((row, i) => (
                <tr key={i} className="border-b border-rule last:border-b-0">
                  <td className={cell}>{row.who}</td>
                  <td className={cell}>{row.asked}</td>
                  <td className={cell}>{row.instrument}</td>
                  <td className="h-px border-l border-rule p-0 align-top text-[0.85rem] leading-snug">{holdCell(i)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div data-print-hide className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule px-5 py-4 md:px-8">
        <button
          type="button"
          onClick={allOpen ? closeHold : openHold}
          aria-pressed={allOpen}
          className={`border px-5 py-2 font-mono text-[0.7rem] uppercase tracking-[0.1em] transition-colors ${
            allOpen ? "border-imagine bg-imagine text-paper" : "border-rule-strong bg-paper text-ink hover:border-ink"
          }`}
        >
          {allOpen ? T.close : T.open}
        </button>
        <p className="label !normal-case !tracking-normal !text-[0.8rem]" aria-live="polite">
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule">
        <div className="bg-paper px-5 py-3 md:px-8">
          <p className="label">{T.rowsOpen}</p>
          <p className="tnum mt-1 text-[0.98rem] text-ink">{T.nOf(nOpen)}</p>
        </div>
      </div>
    </div>
  );
}
