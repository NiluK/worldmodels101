import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AUTHOR } from "@/lib/author";
import { CHAPTERS, chapterText } from "@/lib/chapters";
import { DEFINITIONS } from "@/lib/definitions";

/**
 * The social card, rendered as a page so it uses the site's own fonts and
 * palette rather than a second description of them.
 *
 * scripts/make-og.mjs screenshots this at 1200x630 into public/og. The home
 * card takes a frame number and cycles the five senses of the phrase, which
 * the script assembles into an animated GIF; the first frame is a complete
 * card on its own, because most platforms show only that.
 *
 * Not linked, and kept out of search.
 */
export const dynamicParams = false;

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return [{ slug: "home" }, ...CHAPTERS.map((c) => ({ slug: c.slug }))];
}

const SHELL: React.CSSProperties = {
  // fixed and full-bleed: the card has to cover the site header and the
  // floating star badge, which are part of the shared layout
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  width: 1200,
  height: 630,
  background: "var(--paper)",
  color: "var(--ink)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: "64px 72px",
  boxSizing: "border-box",
  overflow: "hidden",
};

const LABEL: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 19,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--ink-muted)",
};

export default async function OgCard(props: PageProps<"/print/og/[slug]">) {
  const { slug } = await props.params;
  const { frame } = await props.searchParams;
  const home = slug === "home";
  const chapter = home ? null : CHAPTERS.find((c) => c.slug === slug);
  if (!home && !chapter) notFound();

  const n = Number(Array.isArray(frame) ? frame[0] : (frame ?? 0)) || 0;
  const sense = DEFINITIONS[n % DEFINITIONS.length];
  const text = chapter ? chapterText("en", chapter.slug) : null;

  return (
    <div style={SHELL}>
      {/* the vermilion tick, the site's own mark */}
      <div style={{ position: "absolute", top: 0, left: 0, width: 168, height: 7, background: "var(--imagine)" }} />

      {home ? (
        <>
          <p style={LABEL}>A free interactive primer</p>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 132,
                lineHeight: 0.92,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              World Models
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 30,
                  color: "var(--imagine)",
                  letterSpacing: "0.2em",
                  verticalAlign: "super",
                  marginLeft: 18,
                }}
              >
                101
              </span>
            </h1>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 34,
                lineHeight: 1.35,
                margin: "34px 0 0",
                maxWidth: 960,
                color: "var(--ink-muted)",
              }}
            >
              The phrase means at least five things. This one is{" "}
              <span style={{ color: "var(--imagine)" }}>{sense.name.replace(/^The /, "")}</span>.
            </p>
          </div>
        </>
      ) : (
        <>
          <p style={LABEL}>
            Chapter {String(chapter!.n).padStart(2, "0")} &middot; World Models 101
          </p>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: text!.title.length > 34 ? 82 : 100,
                lineHeight: 1.02,
                margin: 0,
                letterSpacing: "-0.01em",
                maxWidth: 1010,
              }}
            >
              {text!.title}
            </h1>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 27,
                lineHeight: 1.4,
                margin: "30px 0 0",
                maxWidth: 940,
                color: "var(--ink-muted)",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {text!.blurb}
            </p>
          </div>
        </>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid var(--rule)",
          paddingTop: 24,
        }}
      >
        <span style={LABEL}>worldmodels101.com</span>
        <span style={LABEL}>{AUTHOR}</span>
      </div>
    </div>
  );
}
