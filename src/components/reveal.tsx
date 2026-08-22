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
   * The server cannot know the reader's motion preference, so it always renders
   * the motion wrapper. Rendering a plain div on the client under reduced motion
   * mismatched that markup and could leave the figure at the server's opacity 0.
   * Same element on both sides; under reduced motion it simply lands at its
   * resting state with no transition.
   */
  return (
    <motion.div
      className={className}
      initial={still ? false : { opacity: 0, y: 14 }}
      animate={still ? { opacity: 1, y: 0 } : undefined}
      whileInView={still ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: still ? 0 : 0.55, delay: still ? 0 : delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
