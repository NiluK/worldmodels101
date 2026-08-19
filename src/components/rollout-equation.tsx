"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

/**
 * The one-step model expanded into a rollout, animated in the same language as
 * Figure 1.3 so the reader can see what actually changed.
 *
 * Only two things do. The states you are asking for become a whole stretch of
 * future rather than a single step, and the action becomes a whole plan. What
 * you are given stays exactly as small as it was.
 */

type Id = "one" | "many" | "now" | "plan";

const PARTS: Record<Id, { tone: string; phrase: string; note: string }> = {
  one: {
    tone: "var(--imagine)",
    phrase: "the next state",
    note: "One step. This is the model from Figure 1.3, unchanged.",
  },
  many: {
    tone: "var(--imagine)",
    phrase: "every state from here to H",
    note: "Not one prediction but a whole stretch of them, each one built on the last. The model has to eat its own output to get here, which is where the error compounds.",
  },
  now: {
    tone: "var(--actual)",
    phrase: "the same single state you are in",
    note: "This does not grow. However far ahead you ask, you are still standing in exactly one place with exactly one observation of it.",
  },
  plan: {
    tone: "var(--ink)",
    phrase: "a whole plan",
    note: "No longer one action but a sequence of them, which is what makes this a plan rather than a guess. Searching over these sequences is what planning is.",
  },
};

function Sym({
  id, enter, hot, setHot, children,
}: {
  id: Id;
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
      aria-label={PARTS[id].phrase}
      className="relative cursor-pointer bg-transparent"
      style={{ color: PARTS[id].tone }}
    >
      {children}
      <motion.span
        aria-hidden
        className="absolute -bottom-1.5 left-0 right-0 h-[2px]"
        style={{ background: PARTS[id].tone }}
        initial={false}
        animate={{ scaleX: hot === id ? 1 : 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      />
    </motion.button>
  );
}

const Sub = ({ children }: { children: React.ReactNode }) => (
  <sub className="text-[0.5em] not-italic">{children}</sub>
);

export function RolloutEquation() {
  const still = useReducedMotion();
  const [hot, setHot] = useState<Id | null>(null);

  const enter = (i: number) =>
    still
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "0px 0px -15% 0px" },
          transition: { duration: 0.5, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] as const },
        };

  const punct = (i: number, children: React.ReactNode) => (
    <motion.span {...enter(i)} className="text-ink-muted">
      {children}
    </motion.span>
  );

  return (
    <div className="px-5 py-10 md:px-8 md:py-12">
      <div
        className="flex flex-wrap items-baseline justify-center gap-x-1 text-[clamp(1.5rem,4.4vw,2.6rem)] leading-none"
        style={{ fontFamily: "var(--font-body)", fontStyle: "italic" }}
      >
        {punct(0, "p(")}
        <Sym id="one" enter={enter(1)} hot={hot} setHot={setHot}>
          s<Sub>t+1</Sub>
        </Sym>
        {punct(1, <span className="mx-2 not-italic">&#8739;</span>)}
        {punct(1, <>s<Sub>t</Sub>, a<Sub>t</Sub></>)}
        {punct(1, ")")}

        <motion.span {...enter(2)} className="mx-4 not-italic text-imagine md:mx-6" aria-label="becomes">
          &#10233;
        </motion.span>

        {punct(3, "p(")}
        <Sym id="many" enter={enter(3)} hot={hot} setHot={setHot}>
          s<Sub>t+1:t+H</Sub>
        </Sym>
        {punct(4, <span className="mx-2 not-italic">&#8739;</span>)}
        <Sym id="now" enter={enter(4)} hot={hot} setHot={setHot}>
          s<Sub>t</Sub>
        </Sym>
        {punct(4, <span className="mr-2">,</span>)}
        <Sym id="plan" enter={enter(5)} hot={hot} setHot={setHot}>
          a<Sub>t:t+H&minus;1</Sub>
        </Sym>
        {punct(5, ")")}
      </div>

      <motion.p
        {...enter(6)}
        className="mx-auto mt-10 max-w-[54ch] text-center text-[1.05rem] leading-relaxed text-ink-muted"
      >
        Ask for{" "}
        {(["one", "many"] as Id[]).map((id, i) => (
          <span key={id}>
            <button
              onPointerEnter={() => setHot(id)}
              onPointerLeave={() => setHot(null)}
              onFocus={() => setHot(id)}
              onBlur={() => setHot(null)}
              onClick={() => setHot(hot === id ? null : id)}
              className="cursor-pointer underline underline-offset-4 transition-all duration-200"
              style={{
                color: PARTS[id].tone,
                textDecorationStyle: hot === id ? "solid" : "dotted",
                textDecorationThickness: hot === id ? "2px" : "1px",
              }}
            >
              {PARTS[id].phrase}
            </button>
            {i === 0 ? " instead of " : ", "}
          </span>
        ))}
        and you still only get{" "}
        {(["now", "plan"] as Id[]).map((id, i) => (
          <span key={id}>
            <button
              onPointerEnter={() => setHot(id)}
              onPointerLeave={() => setHot(null)}
              onFocus={() => setHot(id)}
              onBlur={() => setHot(null)}
              onClick={() => setHot(hot === id ? null : id)}
              className="cursor-pointer underline underline-offset-4 transition-all duration-200"
              style={{
                color: PARTS[id].tone,
                textDecorationStyle: hot === id ? "solid" : "dotted",
                textDecorationThickness: hot === id ? "2px" : "1px",
              }}
            >
              {PARTS[id].phrase}
            </button>
            {i === 0 ? " and " : "."}
          </span>
        ))}
      </motion.p>

      <div data-print-hide className="mx-auto mt-6 min-h-[4.5em] max-w-[52ch] sm:min-h-[3.2em]">
        <motion.p
          key={hot ?? "idle"}
          initial={still ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-center text-[0.95rem] leading-relaxed text-ink-muted"
        >
          {hot ? (
            PARTS[hot].note
          ) : (
            <span className="text-ink-faint">
              Only two things changed. Hover either side to see which.
            </span>
          )}
        </motion.p>
      </div>
    </div>
  );
}
