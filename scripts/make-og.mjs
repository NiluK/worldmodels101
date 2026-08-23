#!/usr/bin/env node
/**
 * Render the social cards through the running dev server.
 *
 * /print/og/<slug> draws the card with the site's own fonts and palette, so
 * the cards cannot drift from the design the way a hand-built image would.
 * The site header and footer come from the root layout and would paint over
 * the card, so they are hidden before the shot rather than fought with CSS.
 *
 * The home card is also written as an animated GIF that cycles the five
 * senses of the phrase. Most platforms show only the first frame, so frame
 * zero is a complete card on its own; Discord and Slack animate it.
 *
 * Run it against a production build, not the dev server: the dev build draws
 * Next's own indicator into the corner of the shot, and hiding it would be
 * treating the symptom.
 *
 *   pnpm build && pnpm start -p 4399     # in another shell
 *   PORT=4399 node scripts/make-og.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const port = process.env.PORT ?? "4311";
const browse = path.join(os.homedir(), ".claude/skills/gstack/browse/dist/browse");
const outDir = path.join("public", "og");
// the browse tool only writes inside /private/tmp or the repo
const tmp = "/private/tmp/wm101-og";

mkdirSync(outDir, { recursive: true });
mkdirSync(tmp, { recursive: true });

const run = (...a) => execFileSync(browse, a, { stdio: "pipe", timeout: 300_000 });
// data-print-hide already marks the chrome that means nothing outside the
// page: the header, the footer and the floating star badge all carry it.
// Injected as a stylesheet rather than inline styles, which React overwrites
// when it hydrates a moment after the script runs.
const HIDE = `(() => {
  const id = "og-hide";
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = "[data-print-hide],body>header,body>footer{display:none !important}";
    document.head.appendChild(el);
  }
  return "ok";
})()`;

function shoot(url, file) {
  run("goto", url);
  run("js", HIDE);
  run("screenshot", "--clip", "0,0,1200,630", file);
}

// read the slugs out of the source rather than importing TypeScript into node
const slugs = [...readFileSync("src/lib/chapters.ts", "utf8").matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map(
  (m) => m[1],
);

run("viewport", "1200x630");

// the still cards
shoot(`http://localhost:${port}/print/og/home?frame=0`, path.join(outDir, "home.png"));
console.log("  og/home.png");
for (const slug of slugs) {
  shoot(`http://localhost:${port}/print/og/${slug}`, path.join(outDir, `${slug}.png`));
  console.log(`  og/${slug}.png`);
}

// the animated home card
const frames = 5;
for (let i = 0; i < frames; i++) {
  shoot(`http://localhost:${port}/print/og/home?frame=${i}`, path.join(tmp, `f${i}.png`));
}
execFileSync(
  "python3",
  [
    "-c",
    `
import sys
from PIL import Image
frames = [Image.open(f"${tmp}/f{i}.png").convert("P", palette=Image.ADAPTIVE, colors=64) for i in range(${frames})]
frames[0].save("${path.join(outDir, "home.gif")}", save_all=True, append_images=frames[1:],
               duration=1200, loop=0, optimize=True, disposal=2)
print("  og/home.gif", frames[0].size)
`,
  ],
  { stdio: "inherit" },
);

rmSync(tmp, { recursive: true, force: true });
console.log("\n  done\n");
