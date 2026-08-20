"use client";

import { useEffect, useRef, useState } from "react";

/**
 * True when the figure has less room than its drawing was laid out for.
 *
 * These SVGs scale to their container, so a wide viewBox in a narrow column
 * shrinks the type along with everything else: a 10px label inside a 900-unit
 * box rendered at 340px comes out under 4px. The alternative used to be a
 * min-width, which just moved the problem to a horizontal scrollbar. Components
 * take this and enlarge type, drop the left label gutter, and shed anything the
 * narrow version can live without.
 */
export function useCompact(threshold = 560) {
  const ref = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setCompact(entry.contentRect.width < threshold);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [threshold]);

  return { ref, compact };
}
