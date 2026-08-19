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
  kind = "demo",
}: {
  id: string;
  title: string;
  /** The channel or speaker the video actually comes from. */
  source: string;
  poster?: "maxresdefault" | "hqdefault";
  kind?: "demo" | "talk";
}) {
  const [live, setLive] = useState(false);
  // Not every video has a maxres thumbnail. When it is missing YouTube serves a
  // 120x90 placeholder rather than a 404, so fall back to hqdefault on error.
  const [quality, setQuality] = useState(poster);

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
            {kind === "talk" ? (
              // A designed card, because a lecture's frame grab says nothing
              <span className="absolute inset-0 flex flex-col justify-center gap-2 bg-paper-sunk px-6 py-5 text-left">
                <span className="label !text-[0.6rem]">Talk</span>
                {/* the speaker, not the title: the caption already carries the title */}
                <span className="display text-[clamp(1.5rem,3.4vw,2.2rem)] leading-tight text-ink">
                  {source.split("·")[0].trim()}
                </span>
              </span>
            ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`https://i.ytimg.com/vi/${id}/${quality}.jpg`}
              alt=""
              loading="lazy"
              onError={() => setQuality("hqdefault")}
              onLoad={(e) => {
                if (e.currentTarget.naturalWidth <= 120) setQuality("hqdefault");
              }}
              className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100"
            />
            )}
            {kind === "demo" && (
              <span className="absolute inset-0 bg-ink/10 transition-colors group-hover:bg-ink/0" />
            )}
            <span
              className={`absolute flex h-16 w-16 items-center justify-center border-2 border-paper bg-imagine transition-transform duration-200 group-hover:scale-110 ${
                kind === "talk"
                  ? "bottom-5 right-5"
                  : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              }`}
            >
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
