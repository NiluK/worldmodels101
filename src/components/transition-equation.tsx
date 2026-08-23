"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useT } from "./locale-provider";

/**
 * The transition function, animated and colour-coded to the site's thesis:
 * vermilion is what the model imagines, slate is what is already known.
 *
 * The notation and its plain-English reading are linked in both directions.
 * Hovering a symbol lights the phrase; hovering the phrase lights the symbol.
 * That pairing is the whole point: most readers bounce off this equation
 * because nobody tells them which squiggle is which idea.
 */

type Id = "next" | "now" | "act";

const TONE: Record<Id, string> = {
  next: "var(--imagine)",
  now: "var(--actual)",
  act: "var(--ink)",
};

/** Hoisted so the buttons are not remounted on every parent render. */
function Sym({
  id, enter, hot, setHot, label, children,
}: {
  id: Id;
  /** the readable name, so the control is not announced as an internal id */
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

export function TransitionEquation() {
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
          transition: { duration: 0.5, delay: 0.12 * i, ease: [0.16, 1, 0.3, 1] as const },
        };

  /**
   * Deliberately no dimming. Fading the unhovered terms drops them below AA
   * (even 0.7 opacity lands near 3:1), so the active term is signalled by
   * ADDING emphasis rather than by degrading everything else.
   */

  const punct = (i: number, children: React.ReactNode) => (
    <motion.span {...enter(i)} className="text-ink-muted">
      {children}
    </motion.span>
  );

  return (
    <div className="px-5 py-10 md:px-8 md:py-12">
      {/* the notation */}
      <div
        className="flex flex-wrap items-baseline justify-center gap-x-1 text-[clamp(2rem,6vw,3.4rem)] leading-none"
        style={{ fontFamily: "var(--font-body)", fontStyle: "italic" }}
      >
        {punct(0, "p")}
        {punct(0, "(")}
        <Sym id="next" enter={enter(1)} hot={hot} setHot={setHot} label={t("eq.next")}>
          s<sub className="text-[0.55em] not-italic">t+1</sub>
        </Sym>
        {punct(2, (
          <span
            className="mx-3 not-italic md:mx-4"
            style={{ fontWeight: 300 }}
            aria-label="given"
          >
            &#8739;
          </span>
        ))}
        <Sym id="now" enter={enter(3)} hot={hot} setHot={setHot} label={t("eq.now")}>
          s<sub className="text-[0.55em] not-italic">t</sub>
        </Sym>
        {punct(3, <span className="mr-2">,</span>)}
        <Sym id="act" enter={enter(4)} hot={hot} setHot={setHot} label={t("eq.act")}>
          a<sub className="text-[0.55em] not-italic">t</sub>
        </Sym>
        {punct(4, ")")}
      </div>

      {/* the same thing in words, paired to the symbols above */}
      <motion.p
        {...enter(5)}
        className="mx-auto mt-10 max-w-[46ch] text-center text-[1.05rem] leading-relaxed text-ink-muted"
      >
        {t("eq.reading")}{" "}
        {(["next", "now", "act"] as Id[]).map((id, i) => (
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
              {t(`eq.${id}`)}
            </button>
            <span className="whitespace-pre">{i === 0 ? t("eq.given") : i === 1 ? t("eq.and") : ""}</span>
          </span>
        ))}
      </motion.p>

      {/* the gloss for whichever part is lit */}
      <div data-print-hide className="mx-auto mt-6 min-h-[4.5em] max-w-[46ch] sm:min-h-[3.2em]">
        <motion.p
          key={hot ?? "idle"}
          initial={still ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-center text-[0.95rem] leading-relaxed text-ink-muted"
        >
          {hot ? (
            t(`eq.${hot}.note`)
          ) : (
            <span className="text-ink-faint">
              {t("eq.hoverHint")}
            </span>
          )}
        </motion.p>
      </div>
    </div>
  );
}
