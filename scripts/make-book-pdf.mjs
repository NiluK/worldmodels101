#!/usr/bin/env node
/**
 * Render the whole book to one PDF through the running dev server.
 *
 * /print/book lays out a title page, an author page and all nine chapters on
 * one page, so one print run gives continuous page numbers and a single
 * outline. See scripts/make-pdf.mjs for the per-chapter version and for the
 * print styling notes.
 *
 *   pnpm dev                 # in another shell
 *   node scripts/make-book-pdf.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const port = process.env.PORT ?? "4311";
const browse = path.join(os.homedir(), ".claude/skills/gstack/browse/dist/browse");
const out = path.join("public", "pdf", "world-models-101.pdf");

mkdirSync(path.dirname(out), { recursive: true });
const run = (...a) => execFileSync(browse, a, { stdio: "inherit", timeout: 600_000 });

run("viewport", "1200x1600");
run("goto", `http://localhost:${port}/print/book`);
// Nine chapters of figures compile and mount slowly on a cold server; print
// only once the last figure of the last chapter is in the document.
run("wait", "--networkidle");
run("wait", "section:last-of-type figure:last-of-type");
run("pdf", out, "--format", "a4", "--print-background",
    "--page-numbers", "--tagged", "--outline", "--margins", "16mm");
console.log(`\n  ${out}\n`);
