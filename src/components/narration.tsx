"use client";

import { useEffect, useRef, useState } from "react";

const fmt = (s: number) =>
  Number.isFinite(s)
    ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`
    : "–:––";

/**
 * Chapter narration. A build-time MP3, played through a control drawn in the
 * site's own language — the default browser audio element would import a
 * different design into the top of every chapter.
 */
export function Narration({ src, by = "Nilu" }: { src: string; by?: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState(0);
  const [len, setLen] = useState(NaN);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const time = () => setNow(a.currentTime);
    const meta = () => setLen(a.duration);
    const end = () => setPlaying(false);
    a.addEventListener("timeupdate", time);
    a.addEventListener("loadedmetadata", meta);
    a.addEventListener("ended", end);
    return () => {
      a.removeEventListener("timeupdate", time);
      a.removeEventListener("loadedmetadata", meta);
      a.removeEventListener("ended", end);
    };
  }, []);

  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (a.paused) {
      a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = ref.current;
    if (!a || !Number.isFinite(a.duration)) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - r.left) / r.width) * a.duration;
    setNow(a.currentTime);
  }

  const pct = Number.isFinite(len) && len > 0 ? (now / len) * 100 : 0;

  return (
    <div className="flex items-center gap-4 border border-rule bg-paper-raised px-4 py-3">
      <audio ref={ref} src={src} preload="metadata" />

      <button
        onClick={toggle}
        aria-label={playing ? "Pause narration" : "Play narration"}
        className="flex h-9 w-9 shrink-0 items-center justify-center bg-ink text-paper transition-colors hover:bg-imagine"
      >
        {playing ? (
          <svg viewBox="0 0 12 14" className="h-3.5 w-3" aria-hidden="true">
            <rect x="0" y="0" width="4" height="14" fill="currentColor" />
            <rect x="8" y="0" width="4" height="14" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 12 14" className="ml-0.5 h-3.5 w-3" aria-hidden="true">
            <polygon points="0,0 12,7 0,14" fill="currentColor" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className="label !text-[0.6rem]">Read by {by}</p>
        <div
          onClick={seek}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-1.5 h-1.5 w-full cursor-pointer bg-rule"
        >
          <div className="h-full bg-imagine" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <span className="label tnum shrink-0">
        {fmt(now)} / {fmt(len)}
      </span>
    </div>
  );
}
