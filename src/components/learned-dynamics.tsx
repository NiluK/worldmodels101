"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useT } from "./locale-provider";

/**
 * The thing the chapter is about, written down.
 *
 * Same treatment as the transition function: every symbol is paired to a plain
 * reading, and hovering either end lights both. Two additions carry the whole
 * difference between a transition function and a *learned* one: the hat, which
 * says this is an estimate, and the reward term, which is what the planner will
 * end up scoring against.
 *
 * Colour follows the site thesis. Vermilion is what the model produced,
 * slate is what it was given.
 */

type Id = "hat" | "next" | "worth" | "now" | "act";

const TONE: Record<Id, string> = {
  hat: "var(--imagine)",
  next: "var(--imagine)",
  worth: "var(--imagine)",
  now: "var(--actual)",
  act: "var(--ink)",
};

/** Hoisted so the symbols are not remounted whenever the hover changes. */
function Sym({
  id, enter, hot, setHot, label, children,
}: {
  id: Id;
  label: string;
  enter: Record<string, unknown>;
  hot: Id | null;
  setHot: (v: Id | null) => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      {...enter}
      onPointerEnter={() => setHot(id)}
      onPointerLeave={() => setHot(null)}
      onFocus={() => setHot(id)}
      onBlur={() => setHot(null)}
      onClick={() => setHot(hot === id ? null : id)}
      aria-label={label}
      className="relative cursor-pointer bg-transparent"
      style={{ color: TONE[id] }}
    >
      {children}
      <motion.span
        aria-hidden
        className="absolute -bottom-1.5 left-0 right-0 h-[2px]"
        style={{ background: TONE[id] }}
        initial={false}
        animate={{ scaleX: hot === id ? 1 : 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      />
    </motion.button>
  );
}

const SUB = "text-[0.55em] not-italic";

export function LearnedDynamics() {
  const still = useReducedMotion();
  const [hot, setHot] = useState<Id | null>(null);
  const t = useT();

  const enter = (i: number) =>
    still
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "0px 0px -15% 0px" },
          transition: { duration: 0.5, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] as const },
        };

  /** No dimming of the inactive terms: at AA, emphasis has to be added. */
  const punct = (i: number, children: React.ReactNode) => (
    <motion.span {...enter(i)} className="text-ink-muted">
      {children}
    </motion.span>
  );

  return (
    <div className="px-5 py-10 md:px-8 md:py-12">
      <div
        className="flex flex-wrap items-baseline justify-center gap-x-1 text-[clamp(1.7rem,5.2vw,3rem)] leading-none"
        style={{ fontFamily: "var(--font-body)", fontStyle: "italic" }}
      >
        <Sym id="hat" enter={enter(0)} hot={hot} setHot={setHot} label={t("dyn.hat")}>
          {/* the hat as a drawn mark: the combining circumflex sits wherever the
              font feels like, and this one has to land on the bowl of the p. */}
          <span className="relative inline-block leading-none">
            p
            <svg aria-hidden viewBox="0 0 12 7"
              className="absolute left-[0.13em] top-[0.09em] w-[0.46em] not-italic"
              style={{ overflow: "visible" }}>
              <path d="M1.4 5.6 L6 1.4 L10.6 5.6" fill="none" stroke="currentColor"
                strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </Sym>
        {punct(0, "(")}
        <Sym id="next" enter={enter(1)} hot={hot} setHot={setHot} label={t("dyn.next")}>
          z<sub className={SUB}>t+1</sub>
        </Sym>
        {punct(1, <span className="mr-2">,</span>)}
        <Sym id="worth" enter={enter(2)} hot={hot} setHot={setHot} label={t("dyn.worth")}>
          r<sub className={SUB}>t</sub>
        </Sym>
        {punct(3, (
          <span className="mx-3 not-italic md:mx-4" style={{ fontWeight: 300 }} aria-label="given">
            &#8739;
          </span>
        ))}
        <Sym id="now" enter={enter(4)} hot={hot} setHot={setHot} label={t("dyn.now")}>
          z<sub className={SUB}>t</sub>
        </Sym>
        {punct(4, <span className="mr-2">,</span>)}
        <Sym id="act" enter={enter(5)} hot={hot} setHot={setHot} label={t("dyn.act")}>
          a<sub className={SUB}>t</sub>
        </Sym>
        {punct(5, ")")}
      </div>

      <motion.p
        {...enter(6)}
        className="mx-auto mt-10 max-w-[48ch] text-center text-[1.05rem] leading-relaxed text-ink-muted"
      >
        <span className="whitespace-pre">{t("dyn.read.0")}</span>
        {(["now", "act", "next", "worth"] as Id[]).map((id, i) => (
          <span key={id}>
            <button
              onPointerEnter={() => setHot(id)}
              onPointerLeave={() => setHot(null)}
              onFocus={() => setHot(id)}
              onBlur={() => setHot(null)}
              onClick={() => setHot(hot === id ? null : id)}
              className="cursor-pointer underline underline-offset-4 transition-all duration-200"
              style={{
                color: TONE[id],
                textDecorationStyle: hot === id ? "solid" : "dotted",
                textDecorationThickness: hot === id ? "2px" : "1px",
              }}
            >
              {t(`dyn.${id}`)}
            </button>
            <span className="whitespace-pre">{t(`dyn.read.${i + 1}`)}</span>
          </span>
        ))}
      </motion.p>

      <div data-print-hide className="mx-auto mt-6 min-h-[5em] max-w-[48ch] sm:min-h-[3.6em]">
        <motion.p
          key={hot ?? "idle"}
          initial={still ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-center text-[0.95rem] leading-relaxed text-ink-muted"
        >
          {hot ? t(`dyn.${hot}.note`) : <span className="text-ink-faint">{t("dyn.hint")}</span>}
        </motion.p>
      </div>
    </div>
  );
}
