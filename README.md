# World Models 101

A free, interactive primer on world models, at [worldmodels101.com](https://worldmodels101.com).

The phrase now describes at least five different classes of system, and the
people using it rarely specify which. The site exists to sort that out first and
teach the machinery second.

| Definition | Predicts | Examples |
|---|---|---|
| Renderer | Pixels | Genie 3, Sora, GameNGen |
| Simulator | Geometry and physics | Marble, NVIDIA Cosmos* |
| Controller | Compact state | Dreamer, PlaNet, Ha & Schmidhuber |
| Representation | Embeddings | V-JEPA 2, I-JEPA |
| Implicit Model | Nothing; it is found, not run | Othello-GPT |

\* Cosmos straddles Renderer and Simulator, which is why it is in the chapter at
all.

## Status

Chapter 1 is written and interactive. Chapter 2 exists in draft. Chapters 3
through 9 are titles, blurbs and a named demo each. Nothing is paywalled and
nothing will be.

## Running it

```bash
pnpm install
pnpm dev
```

## Narration

Chapter audio is generated at build time rather than per request, so no API key
reaches a browser and each chapter is a static asset.

```bash
pnpm narrate --voices   # list the voices on the account
pnpm narrate            # generate anything whose script changed
pnpm narrate --force    # regenerate everything
```

Needs `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`. A content-hashed manifest
means editing one script re-synthesises only that chapter. The on-page player is
currently hidden behind `SHOW_NARRATION` in `src/lib/flags.ts`; the audio still
builds and deploys.

## House rules

Three constraints are worth knowing before changing anything.

**Colour carries meaning.** Vermilion is what a model imagined; slate is what
actually happened. It holds across the logo, every figure and every demo, so
neither is available for decoration. Terrain in the landscape demo has its own
palette for exactly this reason.

**Contrast is a contract, and it is not only a ratio.** Every text token clears
WCAG AA on every surface it actually appears on, and the rules are documented at
the top of `src/app/globals.css`. Muted text must also stay perceptually
separate from body ink, or the hierarchy collapses and a gloss reads as body
copy. Raising a token's contrast past that gap makes the page technically more
compliant and visibly worse. Tinted backgrounds break tokens that pass fine on
paper, which is why `--imagine-on-soft` exists.

**Never dim text to signal state.** Fading below full opacity drops text under
AA even at 0.7. Signal the active thing by adding emphasis instead.

## Sources

Every video is either from the lab that built the system or from the researcher
who authored the work, and every id is checked against YouTube's oEmbed endpoint
for channel and title before it ships. Claims that cannot be independently
verified are attributed as reported rather than stated as fact.

Corrections are welcome and will be credited.
