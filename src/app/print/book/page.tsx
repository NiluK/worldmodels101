import type { Metadata } from "next";
import { ChapterView } from "@/components/chapter-view";
import { AUTHOR, AUTHOR_URL } from "@/lib/author";
import { CHAPTERS } from "@/lib/chapters";
import { REPO, REPO_URL } from "@/lib/github";

/**
 * The whole book on one page, for printing to a single PDF.
 *
 * scripts/make-book-pdf.mjs prints this route, so the page numbers run
 * through the whole thing instead of restarting at every chapter, and the PDF
 * outline carries every chapter's headings. A title page and an author page
 * come first; each chapter then starts on a fresh sheet. Not linked from
 * anywhere and kept out of search.
 */
export const metadata: Metadata = {
  title: "World Models 101, the book",
  robots: { index: false, follow: false },
};

export default function Book() {
  return (
    <div>
      <section className="track flex min-h-[92vh] flex-col justify-center py-24 break-after-page">
        <p className="label">A free interactive primer</p>
        <h1 className="display mt-6 text-[clamp(3rem,10vw,6.5rem)] leading-[0.92]">
          World Models 101
        </h1>
        <p className="mt-8 max-w-[30rem] text-[1.25rem] leading-[1.5] text-ink-muted">
          How machines learn to predict what happens next, in nine chapters:
          what the phrase means, how the machinery works, and what is still
          broken.
        </p>
        <p className="label mt-16">By {AUTHOR}</p>
        <p className="label mt-2 !text-ink-muted">
          worldmodels101.com · 2026 · CC BY-SA 4.0
        </p>
      </section>

      <section className="track py-24 break-after-page">
        <h2 className="display text-[clamp(2rem,6vw,3.5rem)] leading-[0.95]">About the author</h2>
        <div className="prose mt-10">
          <p>
            {AUTHOR} is a software engineer and founder who has spent a decade
            building interactive entertainment products. In 2014 he founded
            Paravine, an esports news and statistics platform that grew to
            800,000 monthly readers and was acquired by CBS Interactive as the
            foundation of its esports vertical, onGamers. He later founded and
            led Nucanon, an AI gaming company whose tools generated
            canon-consistent story, lore and worlds for game studios, backed by
            Antler, Skalata, Futureverse and Jason Calacanis and acquired by the
            Indian gaming platform Zupee.
          </p>
          <p>
            In between he launched SBS News&apos;s first live blog platform;
            helped rebuild the Qantas Rewards Store; led the frontend at
            Gamurs, the publisher of Dot Esports; and rebuilt Futureverse&apos;s
            core blockchain in Rust.
          </p>
          <p>
            World Models 101 is his attempt to lay the field out plainly, in
            the order he wishes he had met it. The book is free and stays free.
            The interactive version lives at worldmodels101.com, where every
            figure in these pages can be pressed and dragged. The source,
            including every figure, is at github.com/{REPO}, under CC BY-SA
            4.0: reuse it, with credit, and share what you make under the same
            terms. Corrections are welcome and credited; the About page on the
            site says how to send one.
          </p>
          <p className="font-mono text-[0.85rem] text-ink-muted">
            {AUTHOR_URL}
            <br />
            {REPO_URL}
          </p>
        </div>
      </section>

      {CHAPTERS.map((c) => (
        <section key={c.slug} className="break-before-page">
          <ChapterView locale="en" slug={c.slug} />
        </section>
      ))}
    </div>
  );
}
