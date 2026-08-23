"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Scroll-triggered entrance. Deliberately small: a figure rising a few pixels
 * as it comes into view reads as the page settling, where anything larger
 * reads as a slideshow. Disabled outright when the reader asks for less motion.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const still = useReducedMotion();

  /**
   * The server cannot know the reader's motion preference, so every prop that
   * decides what is rendered has to be the same on both sides. An earlier
   * version branched `initial` on that preference, which meant a reader who
   * asks for less motion got different markup from the server and a hydration
   * warning on every figure. The props are constant now and only the duration
   * varies, so reduced motion lands at the resting state with no transition
   * and no divergence.
   */
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: still ? 0 : 0.55, delay: still ? 0 : delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
