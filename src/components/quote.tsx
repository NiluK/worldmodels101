import type { ReactNode } from "react";

/**
 * Pull quote with a formal attribution line underneath.
 *
 * Format follows the house style: the claim in full, then who said it, in what
 * context, and where it was published. Primary sources get quoted at length
 * rather than paraphrased into the body.
 */
export function Quote({
  children,
  who,
  context,
  where,
  href,
}: {
  children: ReactNode;
  who: string;
  context?: string;
  where?: string;
  href?: string;
}) {
  const attribution = (
    <>
      <span className="text-ink">{who}</span>
      {context ? <span className="text-ink-muted"> {context}</span> : null}
      {where ? <span className="text-ink-muted"> ({where})</span> : null}
    </>
  );

  return (
    <figure className="my-9 border-l-2 border-actual pl-5">
      <blockquote className="!m-0 !border-0 !p-0 text-[1.05rem] !not-italic leading-relaxed text-ink">
        {children}
      </blockquote>
      <figcaption className="mt-3 font-mono text-[0.75rem] leading-relaxed">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-imagine/50 underline-offset-2 hover:decoration-imagine"
          >
            {attribution}
          </a>
        ) : (
          attribution
        )}
      </figcaption>
    </figure>
  );
}

/**
 * Inline gloss for a term the reader may not have. Rendered as a quiet
 * parenthetical rather than a tooltip, because a definition you have to hover
 * for is a definition most readers never see.
 */
export function Gloss({ children }: { children: ReactNode }) {
  return (
    // Three signals, not one: lighter colour, lighter weight, slightly smaller.
    // Weight and size cost nothing in contrast, which is what lets the gloss
    // read as subordinate while still clearing AA.
    <span className="text-gloss text-[0.95em] font-[350]">({children})</span>
  );
}
