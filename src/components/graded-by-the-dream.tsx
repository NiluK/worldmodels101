"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useCompact } from "./use-compact";
import { useLocale } from "./locale-provider";
import { pickText, type LocaleText } from "@/lib/locale-text";

/**
 * Who signed the policy's marks.
 *
 * Training rounds are free and the model writes every one of them, so the
 * vermilion column runs away down the page. A check in the world costs two
 * thousand real steps and comes in far lower, and it barely moves, because the
 * exploit the policy learned is still in the weights. The figure is about the
 * length of the column and the price of the one mark that was a test.
 *
 * Illustrative: every mark and the two thousand step price. Real: the claim,
 * that the policy is graded by the model the whole way through and that a
 * dream score is an untested claim until somebody runs it out there.
 */

const MODEL_MARKS = [61, 74, 83, 89, 93, 95, 96, 97, 98, 98];
const WORLD_FIRST = 34;
const WORLD_STEP = 2;
const WORLD_CAP = 44;
const CHECK_COST = 2000;

const modelMark = (n: number) =>
  MODEL_MARKS[Math.min(n, MODEL_MARKS.length - 1)];
const worldMark = (n: number) =>
  Math.min(WORLD_CAP, WORLD_FIRST + n * WORLD_STEP);
const grouped = (n: number) =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

type Mark = {
  id: number;
  kind: "model" | "world";
  round: number;
  value: number;
};

type Text = {
  train: string;
  check: string;
  clear: string;
  modelRow: (n: number) => string;
  modelRowShort: (n: number) => string;
  worldRow: string;
  worldRowShort: string;
  byModel: string;
  byWorld: string;
  spent: string;
  empty: string;
  v0: string;
  vModel: (n: number) => string;
  vFirst: string;
  vMore: string;
  aria: (m: number, w: number) => string;
};

const TEXT: LocaleText<Text> = {
  en: {
    train: "Train another round",
    check: "Check in the world",
    clear: "Clear the sheet",
    modelRow: (n) => `round ${n}, marked by the model`,
    modelRowShort: (n) => `round ${n}, model`,
    worldRow: "run in the world",
    worldRowShort: "world",
    byModel: "Marks written by the model",
    byWorld: "Marks written by the world",
    spent: "Real steps spent checking",
    empty: "no marks yet",
    v0: "An empty sheet. The first mark decides who is doing the marking.",
    vModel: (n) =>
      `${n} marks so far, all of them written by the thing being examined.`,
    vFirst:
      "The one mark the model did not write came in at 34. It cost two thousand real steps, and it is the only one that was a test.",
    vMore:
      "The world's marks have moved a little. They are still nowhere near the model's, and they are still the only ones that cost anything.",
    aria: (m, w) =>
      `A mark sheet for the policy, holding ${m} marks written by the model and ${w} written by the world.`,
  },
};

export function GradedByTheDream() {
  const locale = useLocale();
  const T = pickText(TEXT, locale);
  const { ref, compact } = useCompact(520);
  const still = useReducedMotion();

  const [marks, setMarks] = useState<Mark[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  const models = marks.filter((m) => m.kind === "model").length;
  const worlds = marks.length - models;

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: still ? "auto" : "smooth" });
  }, [marks.length, still]);

  const add = (kind: "model" | "world") =>
    setMarks((prev) => {
      const n = prev.filter((m) => m.kind === kind).length;
      const value = kind === "model" ? modelMark(n) : worldMark(n);
      return [...prev, { id: prev.length + 1, kind, round: n + 1, value }];
    });

  const verdict =
    marks.length === 0
      ? T.v0
      : worlds === 0
        ? T.vModel(models)
        : worlds === 1
          ? T.vFirst
          : T.vMore;

  return (
    <div>
      <div ref={ref} className="px-5 pt-6 md:px-8">
        <div
          ref={scroller}
          className="mx-auto max-h-[24rem] max-w-[34rem] overflow-y-auto border border-rule bg-paper"
        >
          {marks.length === 0 ? (
            <p className="label px-4 py-5 !text-ink-faint">{T.empty}</p>
          ) : (
            <ol aria-label={T.aria(models, worlds)}>
              {marks.map((m) => {
                const label =
                  m.kind === "model"
                    ? compact
                      ? T.modelRowShort(m.round)
                      : T.modelRow(m.round)
                    : compact
                      ? T.worldRowShort
                      : T.worldRow;
                const tone =
                  m.kind === "model" ? "var(--imagine)" : "var(--actual)";
                return (
                  <motion.li
                    key={m.id}
                    initial={still ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.22 }}
                    className="flex items-baseline justify-between gap-4 border-b border-rule px-4 py-2 last:border-b-0"
                  >
                    <span
                      className="label !text-[0.62rem]"
                      style={{ color: tone }}
                    >
                      {label}
                    </span>
                    <span
                      className="tnum shrink-0 text-[0.98rem]"
                      style={{ color: tone }}
                    >
                      {m.value}
                    </span>
                  </motion.li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      <div
        data-print-hide
        className="mt-5 flex flex-col gap-3 border-t border-rule px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 md:px-8"
      >
        <button
          type="button"
          onClick={() => add("model")}
          className="label h-9 border border-imagine bg-imagine px-5 !text-paper transition-colors"
        >
          {T.train}
        </button>
        <button
          type="button"
          onClick={() => add("world")}
          className="label h-9 border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink"
        >
          {T.check}
        </button>
        <button
          type="button"
          onClick={() => setMarks([])}
          className="label h-9 self-start border border-rule-strong bg-paper px-4 !text-ink transition-colors hover:border-ink sm:ml-auto"
        >
          {T.clear}
        </button>
        <p
          className="label sm:basis-full !normal-case !tracking-normal !text-[0.8rem]"
          aria-live="polite"
        >
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-rule bg-rule sm:grid-cols-3">
        {[
          [T.byModel, String(models)],
          [T.byWorld, String(worlds)],
          [T.spent, grouped(worlds * CHECK_COST)],
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
