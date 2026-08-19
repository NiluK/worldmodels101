import Link from "next/link";
import { PredictionHero } from "@/components/prediction-hero";
import { CHAPTERS, TOTAL_MINUTES } from "@/lib/chapters";
import { Subscribe } from "@/components/subscribe";
import { SenseMap } from "@/components/sense-map";

function runtime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export default function Home() {
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
          The phrase means at least five different things, and the people
          using it rarely say which. Start with the map, then the machinery.
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
            Start here if you arrived confused. It is the most common reason to.
          </p>
        </div>
        <div className="mt-8">
          <SenseMap />
        </div>
      </section>

      {/* ── the premise ──────────────────────────────────────────────── */}
      <section className="mx-auto mt-28 max-w-[84rem] px-6 md:px-10">
        <div className="grid gap-x-16 gap-y-10 md:grid-cols-[13rem_minmax(0,40rem)]">
          <p className="label md:pt-3">The premise</p>
          <div className="prose">
            <p className="text-[1.3rem] leading-[1.55]">
              Four labs will tell you they build world models and mean four
              incompatible things. One generates video you can steer. One
              produces 3-D geometry a robot can be trained inside. One learns a
              compact simulator it can plan against. One predicts embeddings and
              throws the prediction away.
            </p>
            <p>
              A fifth group is not describing a system at all. When people argue
              about whether a language model &ldquo;has a world model&rdquo;,
              they are making a claim about structure found inside a network
              trained for something else, answered with interpretability
              evidence, not with anything you could run. Two people can agree on
              every fact and still disagree, because one is asking whether a
              system can simulate and the other is asking whether a network
              contains something.
            </p>
            <p>
              Underneath the naming mess there is a real and old subject. It
              runs from Kalman filters through Schmidhuber&rsquo;s 1990 papers
              to Dreamer, JEPA, Genie, and Marble. The literature is enormous
              and almost entirely written for people who have already read it.
            </p>
            <p>
              So: nine chapters, built around things you can poke at. No
              prerequisites past comfort with a gradient and a bit of linear
              algebra. Chapter 1 is the field guide; everything after it is the
              machinery, with the sense being used stated wherever it matters.
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
                "You ship models but the RL-adjacent literature has always felt like a different country. You want the map, not the tour.",
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

      <Subscribe />
    </>
  );
}
