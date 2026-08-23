"use client";


/**
 * The Play / Pause button that sits next to a figure's slider. Pairs with
 * useSweep. Same box as the other secondary controls; the glyph changes so
 * the state reads at a glance without the label moving much.
 */
export function PlayButton({
  playing,
  onClick,
  className = "",
}: {
  playing: boolean;
  onClick: () => void;
  className?: string;
}) {
  const label = playing ? "Pause" : "Play";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={playing}
      className={`label inline-flex h-10 min-w-[6.25rem] items-center justify-center gap-2 border border-rule-strong bg-paper px-3 !text-ink transition-colors hover:border-ink ${className}`}
    >
      <span aria-hidden="true" className="text-[0.7em] leading-none">
        {playing ? "❚❚" : "▶"}
      </span>
      {label}
    </button>
  );
}
