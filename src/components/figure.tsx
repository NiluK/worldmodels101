import type { ReactNode } from "react";
import { Reveal } from "./reveal";

export function Figure({
  n,
  caption,
  children,
  wide = true,
}: {
  n: string;
  caption: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <figure className={`my-16 ${wide ? "wide" : ""}`}>
      <Reveal>
        <div className="border border-rule bg-paper-raised">{children}</div>
        <figcaption className="mt-3 flex gap-3 text-[0.85rem] leading-relaxed text-ink-muted">
          <span className="label shrink-0 !text-imagine">Fig.&nbsp;{n}</span>
          <span>{caption}</span>
        </figcaption>
      </Reveal>
    </figure>
  );
}

export function MarginNote({ children }: { children: ReactNode }) {
  return <aside className="marginnote">{children}</aside>;
}
