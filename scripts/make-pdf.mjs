#!/usr/bin/env node
/**
 * Render a chapter to PDF through the running dev server.
 *
 * Print styling lives in globals.css under @media print: interactive controls
 * are removed rather than frozen mid-state, the quiz swaps to a static form
 * with an answer key, and scroll-reveal opacity is forced back to 1 so nothing
 * the reader never scrolled past prints blank.
 *
 *   pnpm dev                 # in another shell
 *   pnpm pdf what-is-a-world-model 1
 */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const [slug = "what-is-a-world-model", n = "1"] = process.argv.slice(2);
const port = process.env.PORT ?? "4311";
const browse = path.join(os.homedir(), ".claude/skills/gstack/browse/dist/browse");
const out = path.join(
  "public",
  "pdf",
  `world-models-101-chapter-${n}.pdf`,
);

mkdirSync(path.dirname(out), { recursive: true });
const run = (...a) => execFileSync(browse, a, { stdio: "inherit" });

run("viewport", "1200x1600");
run("goto", `http://localhost:${port}/chapters/${slug}`);
// A cold dev server compiles the route on first hit, and printing before that
// lands gives you a one-page PDF of a half-built page. Wait for the real thing.
run("wait", "--networkidle");
run("wait", "figure:last-of-type");
run("pdf", out, "--format", "a4", "--print-background",
    "--page-numbers", "--tagged", "--outline", "--margins", "16mm");
console.log(`\n  ${out}\n`);
