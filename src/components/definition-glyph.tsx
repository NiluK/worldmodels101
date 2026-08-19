/**
 * One mark per definition, drawn in the site's hairline language. The vermilion
 * element in each is always the thing being *predicted*, so the glyphs read as
 * a set: raster cells, mesh vertex, next state, masked embedding, probe.
 *
 * Reused wherever the taxonomy appears, so the reader learns five shapes once.
 */
export function DefinitionGlyph({
  definition,
  size = 34,
  className = "",
}: {
  definition: string;
  size?: number;
  className?: string;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    fill: "none",
    className,
    "aria-hidden": true as const,
    strokeLinecap: "square" as const,
  };
  const ink = "var(--ink-muted)";
  const hot = "var(--imagine)";

  switch (definition) {
    // pixels — a raster, with the next cells still being written
    case "renderer":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="26" height="22" stroke={ink} strokeWidth="1.5" />
          {[0, 1, 2, 3].map((c) =>
            [0, 1, 2].map((r) => (
              <rect
                key={`${c}-${r}`}
                x={6 + c * 5.5}
                y={8.5 + r * 5.5}
                width="4"
                height="4"
                fill={c === 3 ? hot : ink}
                opacity={c === 3 ? 1 : 0.28 + r * 0.06}
              />
            )),
          )}
        </svg>
      );

    // geometry — a wireframe solid with one vertex resolved
    case "simulator":
      return (
        <svg {...common}>
          <path d="M16 4 L28 11 L28 22 L16 29 L4 22 L4 11 Z" stroke={ink} strokeWidth="1.5" />
          <path d="M4 11 L16 18 L28 11 M16 18 L16 29" stroke={ink} strokeWidth="1.2" opacity="0.55" />
          <circle cx="16" cy="18" r="2.6" fill={hot} />
        </svg>
      );

    // compact state — s_t, an action, and the next state
    case "dynamics":
      return (
        <svg {...common}>
          <circle cx="7" cy="22" r="3.2" stroke={ink} strokeWidth="1.6" />
          <path d="M10.5 20 C 16 14, 19 11, 23.5 10.5" stroke={ink} strokeWidth="1.5" strokeDasharray="0.1 3.2" />
          <path d="M20.5 8 L24.5 10.5 L21 13.5" stroke={hot} strokeWidth="1.6" />
          <circle cx="25" cy="10" r="3.2" fill={hot} />
        </svg>
      );

    // embeddings — a latent cloud with the masked region predicted
    case "representation":
      return (
        <svg {...common}>
          {[
            [8, 9], [15, 6], [22, 10], [6, 17], [13, 14],
            [24, 18], [9, 25], [17, 23], [26, 26],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.7" fill={ink} opacity="0.5" />
          ))}
          <rect x="16.5" y="12.5" width="9" height="9" stroke={hot} strokeWidth="1.5" strokeDasharray="2.5 2" />
          <circle cx="21" cy="17" r="2" fill={hot} />
        </svg>
      );

    // found, not run — a probe reading structure out of a trained net
    case "implicit":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="26" height="24" stroke={ink} strokeWidth="1.4" opacity="0.5" />
          {[0, 1, 2].map((c) =>
            [0, 1, 2].map((r) => (
              <circle key={`${c}-${r}`} cx={8 + c * 8} cy={9 + r * 7} r="1.5" fill={ink} opacity="0.35" />
            )),
          )}
          <circle cx="19" cy="17" r="6.5" stroke={hot} strokeWidth="1.8" />
          <path d="M23.8 21.8 L29 27" stroke={hot} strokeWidth="1.8" />
        </svg>
      );

    default:
      return null;
  }
}
