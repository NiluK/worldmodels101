"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Drive a range slider automatically.
 *
 * A figure keeps its own slider state; this hook steps that state from where
 * it is up to `max` on a timer, so the reader can press Play instead of
 * dragging. It uses setInterval rather than requestAnimationFrame on purpose:
 * every tick is a discrete state change, which is what the figures' motion
 * already responds to, and it still runs where rAF does not tick.
 *
 * Usage:
 *   const sweep = useSweep({ value: h, min: 1, max: STEPS, setValue: setH });
 *   <input type="range" ... onChange={(e) => { sweep.stop(); setH(Number(e.target.value)); }} />
 *   <PlayButton playing={sweep.playing} onClick={sweep.toggle} />
 *
 * Pressing Play at the end restarts from `min`. Dragging the slider, or
 * pressing any other control, should call `stop()` so the sweep never fights
 * the reader.
 */
export function useSweep(opts: {
  value: number;
  min: number;
  max: number;
  step?: number;
  setValue: (v: number) => void;
  /** milliseconds per step; defaults so a full sweep takes about six seconds */
  intervalMs?: number;
}) {
  const [playing, setPlaying] = useState(false);
  const latest = useRef(opts);
  useEffect(() => {
    latest.current = opts;
  });

  const step = opts.step ?? 1;
  const steps = Math.max(1, Math.round((opts.max - opts.min) / step));
  // With the default timing a sweep takes about six seconds however long the
  // slider is: long sliders move several steps per tick rather than crawling.
  // A caller who sets intervalMs is tuning by hand, so then one step per tick.
  const unitsPerTick = opts.intervalMs ? 1 : Math.max(1, Math.ceil(steps / 50));
  const ticks = Math.ceil(steps / unitsPerTick);
  const intervalMs = opts.intervalMs ?? Math.min(800, Math.max(120, Math.round(6000 / ticks)));

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const { value, max, step = 1, setValue } = latest.current;
      if (value >= max) {
        setPlaying(false);
        return;
      }
      setValue(Math.min(max, value + step * unitsPerTick));
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [playing, intervalMs, unitsPerTick]);

  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (p) return false;
      const { value, min, max, setValue } = latest.current;
      if (value >= max) setValue(min);
      return true;
    });
  }, []);

  const stop = useCallback(() => setPlaying(false), []);

  return { playing, toggle, stop };
}
