"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import Link from "next/link";
import { useState } from "react";
import { SENSES } from "@/lib/definitions";
import { VideoFigure, NoVideo } from "./video-figure";
import { DefinitionGlyph } from "./definition-glyph";

/**
 * The disambiguator.
 *
 * Four of the five definitions are systems you can run, ordered by how abstract the
 * thing they predict is. The fifth is a claim about what is inside a network,
 * so it sits off the axis rather than at one end of it — the point being that
 * it is not a competing answer to the same question.
 */
export function DefinitionMap() {
  const still = useReducedMotion();
  const [open, setOpen] = useState<string | null>(null);
  const runnable = SENSES.filter((s) => s.id !== "implicit");
  const implicit = SENSES.find((s) => s.id === "implicit")!;
  const active = SENSES.find((s) => s.id === open) ?? null;

  return (
    <div className="border border-ink bg-paper-raised">
      <div className="ticks" />

      <div className="px-5 pt-6 md:px-8">
        <p className="label">
          Systems you can run, ordered by what they predict
        </p>
      </div>

      {/* the axis */}
      <div className="relative mt-6 px-5 md:px-8">
        <div className="grid grid-cols-2 gap-px bg-rule md:grid-cols-4">
          {runnable.map((s) => {
            const on = open === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setOpen(on ? null : s.id)}
                aria-expanded={on}
                className={`group relative flex flex-col gap-2 p-4 text-left transition-colors ${
                  on ? "bg-paper" : "bg-paper-raised hover:bg-paper"
                }`}
              >
                <span
                  className={`h-2 w-full transition-colors ${
                    on ? "bg-imagine" : "bg-rule-strong group-hover:bg-actual"
                  }`}
                />
                <DefinitionGlyph definition={s.id} size={34} className="mt-1" />
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-muted">
                  Predicts {s.predicts}
                </span>
                <span
                  className={`display text-[1.45rem] leading-none transition-colors ${
                    on ? "text-imagine" : ""
                  }`}
                >
                  {s.name}
                </span>
                <span className="mt-1 font-mono text-[0.7rem] leading-relaxed text-ink-muted">
                  {s.systems.join(" · ")}
                </span>
              </button>
            );
          })}
        </div>

        <p className="label mt-3 !text-[0.6rem]">
          More concrete &nbsp;&larr;&nbsp;&nbsp; what gets predicted
          &nbsp;&nbsp;&rarr;&nbsp; more abstract
        </p>
      </div>

      {/* the one that is not on the axis at all */}
      <div className="mt-8 px-5 md:px-8">
        <div className="border-t border-dashed border-rule-strong pt-5">
          <p className="label">Not a system you run</p>
          <button
            onClick={() => setOpen(open === implicit.id ? null : implicit.id)}
            aria-expanded={open === implicit.id}
            className={`group mt-3 flex w-full flex-col gap-2 border p-4 text-left transition-colors md:w-1/2 ${
              open === implicit.id
                ? "border-imagine bg-paper"
                : "border-rule bg-paper-raised hover:bg-paper"
            }`}
          >
            <DefinitionGlyph definition={implicit.id} size={34} />
            <span
              className={`display text-[1.45rem] leading-none transition-colors ${
                open === implicit.id ? "text-imagine" : ""
              }`}
            >
              {implicit.name}
            </span>
            <span className="font-mono text-[0.7rem] leading-relaxed text-ink-muted">
              {implicit.systems.join(" · ")}
            </span>
          </button>
        </div>
      </div>

      {/* detail */}
      <div className="mt-6 border-t border-rule bg-paper px-5 py-6 md:px-8">
        <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={active?.id ?? "empty"}
          initial={still ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={still ? { opacity: 1 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
        {active ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)]">
            <div className="border border-rule bg-paper-raised">
              {"id" in active.video ? (
                <VideoFigure
                  id={active.video.id}
                  title={active.video.title}
                  source={active.video.source}
                />
              ) : (
                <NoVideo reason={active.video.none} />
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_13rem]">
            <div>
              <p className="text-[1.05rem] leading-relaxed">{active.gloss}</p>
              <p className="mt-4 border-l-2 border-actual pl-4 text-[0.95rem] leading-relaxed text-ink-muted">
                <span className="label !text-actual">How to tell</span>
                <br />
                {active.test}
              </p>
            </div>
            <dl className="space-y-4 self-start border-l border-rule pl-6 max-md:border-l-0 max-md:pl-0">
              <div>
                <dt className="label">Who talks this way</dt>
                <dd className="mt-1 text-[0.92rem]">{active.camp}</dd>
              </div>
              <div>
                <dt className="label">Covered in</dt>
                <dd className="mt-1 text-[0.92rem]">
                  <Link
                    href="/#chapters"
                    className="underline decoration-imagine decoration-2 underline-offset-4 hover:bg-imagine hover:text-paper"
                  >
                    Chapter {String(active.chapter).padStart(2, "0")}
                  </Link>
                </dd>
              </div>
            </dl>
            </div>
          </div>
        ) : (
          <p className="text-ink-muted">
            Five things the phrase is used to mean. Four of them are systems you
            can run; the fifth is a claim about what is inside one. Pick any of
            them.
          </p>
        )}
        </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
