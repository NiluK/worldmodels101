"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import Link from "next/link";
import { useState } from "react";
import { DEFINITIONS, definitionText } from "@/lib/definitions";
import { useLocale, useT } from "./locale-provider";
import { localePath } from "@/lib/i18n";
import { VideoFigure } from "./video-figure";
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
  const locale = useLocale();
  const t = useT();
  const [open, setOpen] = useState<string | null>(null);
  const active = DEFINITIONS.find((s) => s.id === open) ?? null;

  return (
    <div className="border border-ink bg-paper-raised">
      <div className="ticks" />

      <div className="px-5 pt-6 md:px-8">
        <p className="label">{t("map.ordered")}</p>
      </div>

      {/*
        All five sit in one row. The fifth is still off the axis, but that is
        carried by a dashed edge and its own tag rather than by exiling it to a
        second block, which left a hole beside it and read as a layout fault.
      */}
      <div className="mt-5 px-5 md:px-8">
        <div className="grid grid-cols-1 gap-px bg-rule sm:grid-cols-2 lg:grid-cols-5">
          {DEFINITIONS.map((d) => {
            const on = open === d.id;
            const off = d.id === "implicit";
            return (
              <button
                key={d.id}
                onClick={() => setOpen(on ? null : d.id)}
                aria-expanded={on}
                className={`group relative flex flex-col gap-2 p-4 text-left transition-colors ${
                  on ? "bg-paper" : "bg-paper-raised hover:bg-paper"
                } ${off ? "lg:border-l lg:border-dashed lg:border-rule-strong lg:pl-5" : ""}`}
              >
                <span
                  className={`h-2 w-full transition-colors ${
                    off
                      ? "border-t-2 border-dashed border-rule-strong bg-transparent"
                      : on
                        ? "bg-imagine"
                        : "bg-rule-strong group-hover:bg-actual"
                  }`}
                />
                <DefinitionGlyph definition={d.id} size={34} className="mt-1" />
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-muted">
                  {off ? t("map.offAxis") : t("map.predicts", { x: definitionText(locale, d.id).predicts })}
                </span>
                <span
                  className={`display text-[1.45rem] leading-none transition-colors ${
                    on ? "text-imagine" : ""
                  }`}
                >
                  {definitionText(locale, d.id).name}
                </span>
                <span className="mt-1 font-mono text-[0.7rem] leading-relaxed text-ink-muted">
                  {d.systems.join(" · ")}
                </span>
              </button>
            );
          })}
        </div>

        {/* the axis label spans only the four that are on it */}
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-5">
          <p className="label !text-[0.6rem] lg:col-span-4">
            {t("map.moreConcrete")} &nbsp;&larr;&nbsp;&nbsp; {t("map.whatGetsPredicted")}
            &nbsp;&nbsp;&rarr;&nbsp; {t("map.moreAbstract")}
          </p>
          <p className="label !text-[0.6rem] !text-ink-faint max-lg:mt-1 lg:pl-5">
            {t("map.notASystem")}
          </p>
        </div>
      </div>

      {/* detail */}
      <div data-print-hide className="mt-6 border-t border-rule bg-paper px-5 py-6 md:px-8">
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
              <VideoFigure
                id={active.video.id}
                title={active.video.title}
                source={active.video.source}
                kind={active.video.kind}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_13rem]">
            <div>
              <p className="text-[1.05rem] leading-relaxed">{definitionText(locale, active.id).gloss}</p>
              <p className="mt-4 border-l-2 border-actual pl-4 text-[0.95rem] leading-relaxed text-ink-muted">
                <span className="label !text-actual">{t("map.howToTell")}</span>
                <br />
                {definitionText(locale, active.id).test}
              </p>
            </div>
            <dl className="space-y-4 self-start border-l border-rule pl-6 max-md:border-l-0 max-md:pl-0">
              <div>
                <dt className="label">{t("map.whoTalks")}</dt>
                <dd className="mt-1 text-[0.92rem]">{definitionText(locale, active.id).camp}</dd>
              </div>
              <div>
                <dt className="label">{t("map.coveredIn")}</dt>
                <dd className="mt-1 text-[0.92rem]">
                  <Link
                    href={localePath(locale, "/#chapters")}
                    className="underline decoration-imagine decoration-2 underline-offset-4 hover:bg-imagine hover:text-paper"
                  >
                    {t("map.chapterN", { n: String(active.chapter).padStart(2, "0") })}
                  </Link>
                </dd>
              </div>
            </dl>
            </div>
          </div>
        ) : (
          <p className="text-ink-muted">
{t("map.idle")}
          </p>
        )}
        </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
