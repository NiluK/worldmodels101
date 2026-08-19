/**
 * The site mark. A slate path (what happened) and a vermilion path (what was
 * imagined) leaving the same origin and drifting apart. It is the logo, the
 * favicon, and the thesis.
 */
export function SignalMark({
  size = 28,
  className = "",
  animate = false,
}: {
  size?: number;
  className?: string;
  animate?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 25 C 10 25, 13 16, 17 12 C 21 8, 25 7, 29 7"
        stroke="var(--actual)"
        strokeWidth="2.25"
        strokeLinecap="square"
        style={
          animate
            ? { strokeDasharray: 44, ["--len" as string]: 44, animation: "draw 1100ms cubic-bezier(0.16,1,0.3,1) both" }
            : undefined
        }
      />
      <path
        d="M3 25 C 10 25, 13 16, 17 12 C 21 8, 24 14, 29 20"
        stroke="var(--imagine)"
        strokeWidth="2.25"
        strokeLinecap="square"
        strokeDasharray={animate ? 46 : "0.1 4"}
        style={
          animate
            ? { ["--len" as string]: 46, animation: "draw 1100ms cubic-bezier(0.16,1,0.3,1) 180ms both" }
            : undefined
        }
      />
      <circle cx="17" cy="12" r="2.4" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.75" />
    </svg>
  );
}
