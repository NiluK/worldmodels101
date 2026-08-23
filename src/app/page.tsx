import Link from "next/link";
import { PredictionHero } from "@/components/prediction-hero";
import { CHAPTERS, TOTAL_MINUTES } from "@/lib/chapters";
import { StarCta } from "@/components/star-cta";
import { Byline } from "@/components/byline";
import { getStars } from "@/lib/github";
import { DefinitionMap } from "@/components/definition-map";
import type { Metadata } from "next";

function runtime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export const metadata: Metadata = {
  alternates: { canonical: "/", languages: { en: "/", "zh-Hans": "/zh" } },
};

export default async function Home() {
  const stars = await getStars();
  return (
    <>
      {/* ── hero ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[84rem] px-6 pb-10 pt-16 md:px-10 md:pt-24">
        <p className="label rise" style={{ animationDelay: "0ms" }}>
          A free interactive primer
        </p>

        <h1
          className="display rise mt-5 text-[clamp(3.2rem,11vw,8.5rem)]"
          style={{ animationDelay: "70ms" }}
        >
          World Models
          <span className="ml-4 align-super font-mono text-[0.16em] tracking-[0.2em] text-imagine">
            101
          </span>
        </h1>

        <p
          className="rise mt-8 max-w-[36ch] text-[clamp(1.25rem,2.4vw,1.7rem)] leading-[1.4] text-ink md:max-w-[42ch]"
          style={{ animationDelay: "150ms" }}
        >
          Since 2018, &ldquo;world model&rdquo; has meant at least five
          different machines, and the people saying it rarely tell you which.
          This primer pulls the five apart, then shows how each one works and
          where it came from.
        </p>

        <div
          className="rise mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
          style={{ animationDelay: "230ms" }}
        >
          <Link
            href={`/chapters/${CHAPTERS[0].slug}`}
            className="group inline-flex items-center gap-3 border border-ink bg-ink px-6 py-3 text-paper transition-colors hover:bg-imagine hover:border-imagine"
          >
            <span className="label !text-paper">Begin Chapter 01</span>
            <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </Link>
          <p className="label">
            {CHAPTERS.length} chapters &middot; {runtime(TOTAL_MINUTES)} &middot; no signup
          </p>
          <Byline locale="en" />
        </div>
      </section>

      <div className="rise mt-6" style={{ animationDelay: "300ms" }}>
        <PredictionHero />
      </div>

      {/* ── the disambiguation: the reason this site exists ─────────── */}
      <section id="map" className="mx-auto mt-28 max-w-[84rem] px-6 md:px-10">
        <div className="flex flex-col gap-4 border-b border-ink pb-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="display text-[clamp(2rem,5vw,3.4rem)] leading-none">
            Five things people mean
          </h2>
          <p className="label max-w-[34ch] sm:text-right">
            If you are not sure which kind you have been reading about, start here.
          </p>
        </div>
        <div className="mt-8">
          <DefinitionMap />
        </div>
      </section>

      {/* ── the premise ──────────────────────────────────────────────── */}
      <section className="mx-auto mt-28 max-w-[84rem] px-6 md:px-10">
        <div className="grid gap-x-16 gap-y-10 md:grid-cols-[13rem_minmax(0,40rem)]">
          <p className="label md:pt-3">The premise</p>
          <div className="prose">
            <p className="text-[1.3rem] leading-[1.55]">
              Ask four labs what a world model is and you get four different
              machines that do not fit together. Each has its own history.
              Genie, from Google DeepMind, generates video you steer with the
              arrow keys. Marble, from World Labs, builds 3D geometry a robot
              can be trained inside. Dreamer, from Danijar Hafner&rsquo;s
              group, learns a small simulator and plans against it. V-JEPA,
              from Meta, predicts embeddings and throws the prediction away.
            </p>
            <p>
              A fifth camp is not describing a machine at all. When people
              argue about whether a language model &ldquo;has a world
              model&rdquo;, they mean structure found inside a network that was
              trained for something else. The evidence comes from
              interpretability work, not from anything you could run. That is
              why two people can agree on every fact and still argue. One is
              asking whether a system can simulate. The other is asking whether
              a network contains something.
            </p>
            <p>
              Under the naming mess is a real and old subject with a clear line
              of descent. It starts in 1960 with the Kalman filter, the maths
              that lets a radar track a plane from noisy blips. It passes
              through 1990, when J&uuml;rgen Schmidhuber and Richard Sutton
              first put a learned model of the world next to something that
              used it to act. It arrives at the four machines above.
            </p>
          </div>
        </div>
      </section>

      {/* ── chapters ─────────────────────────────────────────────────── */}
      <section id="chapters" className="mx-auto mt-32 max-w-[84rem] px-6 md:px-10">
        <div className="flex items-baseline justify-between border-b border-ink pb-3">
          <h2 className="display text-[clamp(2rem,5vw,3.4rem)]">Contents</h2>
          <p className="label">{CHAPTERS.length} chapters</p>
        </div>

        <ol>
          {CHAPTERS.map((c) => {
            const live = c.status === "ready";
            const Row = (
              <div
                className={`grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-5 py-8 md:grid-cols-[5rem_minmax(0,1fr)_11rem] md:gap-x-10 ${
                  live ? "" : "opacity-55"
                }`}
              >
                <span className="display text-[2.4rem] leading-none text-ink-faint transition-colors group-hover:text-imagine tnum md:text-[3.2rem]">
                  {String(c.n).padStart(2, "0")}
                </span>

                <div>
                  <h3 className="display text-[clamp(1.6rem,3vw,2.3rem)] leading-tight">
                    {c.title}
                  </h3>
                  <p className="mt-3 max-w-[52ch] text-ink-muted">{c.blurb}</p>
                  <p className="mt-4 flex max-w-[52ch] gap-2.5 font-mono text-[0.78rem] leading-relaxed text-imagine">
                    <span aria-hidden className="select-none">&#9656;</span>
                    <span>{c.demo}</span>
                  </p>
                </div>

                <div className="col-start-2 mt-5 flex items-center gap-4 md:col-start-3 md:mt-1 md:justify-end">
                  <span className="label">{c.minutes} min</span>
                  {live ? (
                    <span className="label !text-imagine">Read &rarr;</span>
                  ) : (
                    <span className="label">
                      {c.status === "drafting" ? "Drafting" : "Soon"}
                    </span>
                  )}
                </div>
              </div>
            );

            return (
              <li key={c.slug} className="border-b border-rule">
                {live ? (
                  <Link
                    href={`/chapters/${c.slug}`}
                    className="group block transition-colors hover:bg-paper-raised"
                  >
                    {Row}
                  </Link>
                ) : (
                  <div className="group cursor-default">{Row}</div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── audience ─────────────────────────────────────────────────── */}
      <section className="mx-auto mt-32 max-w-[84rem] px-6 md:px-10">
        <div className="grid gap-x-16 gap-y-10 md:grid-cols-[13rem_minmax(0,40rem)]">
          <p className="label md:pt-3">Who this is for</p>
          <div className="grid gap-8 sm:grid-cols-2">
            {[
              [
                "The engineer",
                "You ship models but the RL-adjacent literature has always felt like a different country. You want a map of it.",
              ],
              [
                "The researcher next door",
                "You work in another subfield and need to know what people mean when they say a video model 'understands physics'.",
              ],
              [
                "The student",
                "You have the maths and the time and want a path through the papers that is ordered rather than alphabetical.",
              ],
              [
                "The sceptic",
                "You suspect a lot of this is overclaimed. Chapter 9 is for you, and you are probably partly right.",
              ],
            ].map(([who, why]) => (
              <div key={who} className="border-t border-ink pt-4">
                <h3 className="font-mono text-[0.7rem] uppercase tracking-[0.16em]">
                  {who}
                </h3>
                <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-muted">
                  {why}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StarCta locale="en" stars={stars} />

    </>
  );
}
