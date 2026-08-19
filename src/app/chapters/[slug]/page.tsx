import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CHAPTERS, getChapter } from "@/lib/chapters";
import { CONTENT } from "@/content/registry";
import { ReadingProgress } from "@/components/reading-progress";
import { Narration } from "@/components/narration";
import { SHOW_NARRATION } from "@/lib/flags";
import { existsSync } from "node:fs";
import path from "node:path";

export function generateStaticParams() {
  return Object.keys(CONTENT).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/chapters/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const chapter = getChapter(slug);
  if (!chapter) return {};
  return {
    title: chapter.title,
    description: chapter.blurb,
    openGraph: { title: `${chapter.title} · World Models 101`, description: chapter.blurb },
  };
}

export default async function ChapterPage(props: PageProps<"/chapters/[slug]">) {
  const { slug } = await props.params;
  const chapter = getChapter(slug);
  const load = CONTENT[slug];
  if (!chapter || !load) notFound();

  const { default: Body } = await load();

  // Narration is optional: the player only appears once `pnpm narrate` has
  // produced an MP3 for this chapter.
  const audio = `/audio/${slug}.mp3`;
  const hasAudio =
    SHOW_NARRATION &&
    existsSync(path.join(process.cwd(), "public", "audio", `${slug}.mp3`));
  const next = CHAPTERS.find((c) => c.n === chapter.n + 1);
  const prev = CHAPTERS.find((c) => c.n === chapter.n - 1);

  return (
    <article>
      <ReadingProgress />

      {/* chapter plate */}
      <header className="track pt-16 pb-12 md:pt-24">
        <div>
          <Link href="/#chapters" className="label hover:text-ink transition-colors">
            &larr; Contents
          </Link>

          <div className="mt-8 flex items-start gap-6 md:gap-10">
            <span className="display tnum text-[clamp(3rem,9vw,6rem)] leading-[0.8] text-imagine">
              {String(chapter.n).padStart(2, "0")}
            </span>
            <div className="pt-1">
              <h1 className="display text-[clamp(2.4rem,7vw,4.6rem)] leading-[0.92]">
                {chapter.title}
              </h1>
              <p className="label mt-5">
                {chapter.minutes} min read &middot; interactive
              </p>
            </div>
          </div>

          <p className="mt-10 max-w-[46ch] border-l-2 border-actual pl-5 text-[1.15rem] leading-[1.5] text-ink-muted">
            {chapter.blurb}
          </p>

          {hasAudio && (
            <div className="mt-8 max-w-[30rem]">
              <Narration src={audio} />
            </div>
          )}
        </div>
      </header>

      <div className="track prose pb-16">
        <Body />
      </div>

      {/* chapter foot */}
      <nav className="track border-t border-ink pt-8">
        <div className="flex flex-col gap-8 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {prev ? (
              <Link href={`/chapters/${prev.slug}`} className="group block">
                <p className="label">&larr; Previous</p>
                <p className="display mt-2 text-2xl group-hover:text-imagine transition-colors">
                  {prev.title}
                </p>
              </Link>
            ) : (
              <div>
                <p className="label">Start</p>
                <p className="display mt-2 text-2xl text-ink-faint">You&rsquo;re at the beginning</p>
              </div>
            )}
          </div>

          <div className="sm:text-right">
            {next ? (
              next.status === "ready" ? (
                <Link href={`/chapters/${next.slug}`} className="group block">
                  <p className="label">Next &rarr;</p>
                  <p className="display mt-2 text-2xl group-hover:text-imagine transition-colors">
                    {next.title}
                  </p>
                </Link>
              ) : (
                <div>
                  <p className="label">Next &middot; {next.status === "drafting" ? "drafting" : "soon"}</p>
                  <p className="display mt-2 text-2xl text-ink-faint">{next.title}</p>
                </div>
              )
            ) : null}
          </div>
        </div>
      </nav>
    </article>
  );
}
