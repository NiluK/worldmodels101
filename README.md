# World Models 101

A free, interactive course on how machines learn to predict, simulate, and plan.

[Read the course](https://worldmodels101.com) · [简体中文](https://worldmodels101.com/zh) · [Star the repository](https://github.com/NiluK/worldmodels101)

[![The World Models 101 course homepage](public/readme-preview.png)](https://worldmodels101.com)

The phrase "world model" now describes at least five different classes of
system, and the people using it rarely specify which. World Models 101 sorts
that out first, then teaches the machinery.

Nine chapters. About two hours. No signup. Every chapter has an interactive,
a Simplified Chinese edition, and a printable PDF.

## What people mean by world model

| Definition | Predicts | Examples |
|---|---|---|
| Renderer | Pixels | Genie 3, Sora, GameNGen |
| Simulator | Geometry and physics | Marble, NVIDIA Cosmos* |
| Controller | Compact state | Dreamer, PlaNet, Ha and Schmidhuber |
| Representation | Embeddings | V-JEPA 2, I-JEPA |
| Implicit model | Nothing; researchers find it rather than run it | Othello-GPT |

\* Cosmos straddles Renderer and Simulator. That ambiguity is the point. Before
asking whether something is a world model, ask what it predicts and what you can
do with the prediction.

## The course

| | Chapter | The thing you can poke |
|---:|---|---|
| 01 | [What People Mean](https://worldmodels101.com/chapters/what-people-mean) | A map of five definitions and the question that separates them |
| 02 | [The Idea](https://worldmodels101.com/chapters/the-idea) | A planner that gets worse as it searches harder inside a flawed model |
| 03 | [Prediction as Learning](https://worldmodels101.com/chapters/prediction) | Possible futures collapsing as new evidence arrives |
| 04 | [Latent Space](https://worldmodels101.com/chapters/latents) | A two-number space that decodes into a room |
| 05 | [Dynamics](https://worldmodels101.com/chapters/dynamics) | One model run with corrections, then left to consume its own output |
| 06 | [Learning in a Dream](https://worldmodels101.com/chapters/dreaming) | The point where cheaper imagined experience becomes worse experience |
| 07 | [The Case Against Generation](https://worldmodels101.com/chapters/jepa) | Two possible futures and the impossible blur that scores above both |
| 08 | [Video as World Simulator](https://worldmodels101.com/chapters/video-worlds) | One starting frame and three futures selected by an action |
| 09 | [What's Broken](https://worldmodels101.com/chapters/whats-broken) | A thousand-step rollout showing which properties fail first |

The chapters are ordered for learning rather than history. Each one states which
definition of world model is in use, cites the underlying papers, and ends with
a short quiz. You can read the whole course online or download any chapter as a
PDF from its page.

## Run it locally

```bash
pnpm install
pnpm dev
```

The production checks are:

```bash
pnpm lint
pnpm build
```

## Narration

Chapter audio is generated at build time rather than per request, so no API key
reaches a browser and each recording is a static asset.

```bash
pnpm narrate --voices   # list the voices on the account
pnpm narrate            # generate scripts whose content changed
pnpm narrate --force    # regenerate every script
```

Narration needs `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`. A content-hashed
manifest means editing one script only regenerates that chapter. The on-page
player is currently hidden behind `SHOW_NARRATION` in `src/lib/flags.ts`.

## Print and PDF

Every chapter has a print layout. Interactive controls disappear, quizzes become
static questions with an answer key, and unrevealed sections remain visible.

```bash
pnpm dev                         # in another shell
pnpm pdf what-people-mean 1
```

The command writes to `public/pdf/`. A chapter page links its PDF automatically
when the corresponding file exists.

## Design rules

**Colour carries meaning.** Vermilion marks what a model imagined. Slate marks
what happened. Neither colour is available for decoration.

**Contrast is a contract.** Every text token clears WCAG AA on the background
where it appears. Muted text must also stay visibly separate from body text, or
the reading hierarchy collapses. The contrast notes live at the top of
`src/app/globals.css`.

**State never depends on dimmed text.** Lowering text opacity can break contrast.
Active states add emphasis instead.

## Sources and corrections

Videos come from the lab that built the system or a researcher who authored the
work. Every YouTube ID is checked against the oEmbed endpoint before it ships.
Claims that cannot be independently verified are attributed rather than stated
as fact.

Technical corrections, translation fixes, and broken demos are worth reporting.
[Open an issue](https://github.com/NiluK/worldmodels101/issues). Corrections are
credited.

## License and attribution

The application code and course material in this repository are licensed under
[CC BY-SA 4.0](LICENSE). Reuse must credit Nilushanan Kulasingham and World
Models 101, identify changes, and keep adaptations under the same license.
