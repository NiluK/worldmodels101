"use client";

import { useState } from "react";

/**
 * Privacy-lite video embed.
 *
 * Nothing from YouTube loads until the reader clicks — no iframe, no cookies,
 * no tracking on page view. Until then it is a poster frame and a play control
 * drawn in the site's own language, so an embed does not import someone else's
 * design into the middle of the page.
 */
export function VideoFigure({
  id,
  title,
  source,
  poster = "maxresdefault",
}: {
  id: string;
  title: string;
  /** The channel the video actually comes from. Always first-party here. */
  source: string;
  poster?: "maxresdefault" | "hqdefault";
}) {
  const [live, setLive] = useState(false);

  return (
    <div className="group">
      <div className="relative aspect-video w-full overflow-hidden border-b border-rule bg-paper-sunk">
        {live ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setLive(true)}
            className="absolute inset-0 h-full w-full cursor-pointer"
            aria-label={`Play: ${title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${id}/${poster}.jpg`}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100"
            />
            <span className="absolute inset-0 bg-ink/10 transition-colors group-hover:bg-ink/0" />
            <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 border-paper bg-imagine transition-transform duration-200 group-hover:scale-110">
              <svg viewBox="0 0 18 22" className="ml-1 h-[22px] w-[18px]" aria-hidden="true">
                <polygon points="0,0 18,11 0,22" fill="var(--paper)" />
              </svg>
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
        <span className="label !text-imagine">{source}</span>
        <span className="text-[0.9rem] leading-snug text-ink-muted">{title}</span>
      </div>
    </div>
  );
}

/**
 * Used where a sense genuinely has nothing to show. Two of the five predict
 * things that are never rendered, and saying so is more honest than filling
 * the slot with someone's commentary reupload.
 */
export function NoVideo({ reason }: { reason: string }) {
  return (
    <div className="flex aspect-video w-full flex-col items-start justify-center gap-3 border-b border-dashed border-rule-strong bg-paper-sunk px-6">
      <span className="label">Nothing to watch</span>
      <p className="max-w-[38ch] text-[0.95rem] leading-relaxed text-ink-muted">
        {reason}
      </p>
    </div>
  );
}

/**
 * Two videos side by side. Built for the one comparison that does more work
 * than any paragraph: a renderer and a simulator, running at the same time.
 */
export function VideoPair({
  left,
  right,
}: {
  left: { id: string; title: string; source: string; label: string };
  right: { id: string; title: string; source: string; label: string };
}) {
  return (
    <div className="grid grid-cols-1 gap-px bg-rule md:grid-cols-2">
      {[left, right].map((v) => (
        <div key={v.id} className="bg-paper-raised">
          <p className="label border-b border-rule px-4 py-2.5 !text-ink">
            {v.label}
          </p>
          <VideoFigure id={v.id} title={v.title} source={v.source} poster="hqdefault" />
        </div>
      ))}
    </div>
  );
}
