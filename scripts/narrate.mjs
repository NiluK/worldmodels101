#!/usr/bin/env node
/**
 * Build-time narration via ElevenLabs.
 *
 * Reads spoken-register scripts from src/content/narration/<slug>.txt, sends
 * each to ElevenLabs, and writes public/audio/<slug>.mp3. Generation happens
 * here rather than at request time so the API key never reaches a browser, the
 * audio is a static asset on the CDN, and a page view costs nothing.
 *
 * A manifest records the hash of the text each file was generated from, so
 * re-running only regenerates the chapters whose script actually changed.
 * Editing prose therefore does not mean re-paying for every chapter.
 *
 *   pnpm narrate --voices        list the voices on the account
 *   pnpm narrate                 generate anything stale
 *   pnpm narrate --force         regenerate everything
 */

import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src/content/narration");
const OUT = path.join(ROOT, "public/audio");
const MANIFEST = path.join(OUT, "manifest.json");

function die(msg) {
  console.error(`\n  ${msg}\n`);
  process.exit(1);
}

const API = "https://api.elevenlabs.io/v1";
const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = process.env.ELEVENLABS_VOICE_ID;
const MODEL = process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2";

/**
 * eleven_v3 accepts only three discrete stability settings, and they are not a
 * continuum you can sample anywhere along:
 *   0.0 Creative — most responsive to audio tags, can hallucinate
 *   0.5 Natural  — closest to the source recording
 *   1.0 Robust   — stable but largely ignores directional tags
 * Passing anything else (0.45, say) is not a valid v3 setting, and "Robust" is
 * the wrong end entirely when the script is carrying delivery tags.
 */
const V3 = MODEL.startsWith("eleven_v3");
const STABILITY = (() => {
  const raw = process.env.ELEVENLABS_STABILITY;
  if (raw === undefined) return V3 ? 0.5 : 0.45;
  const n = Number(raw);
  if (!V3) return n;
  const allowed = [0, 0.5, 1];
  if (!allowed.includes(n)) {
    die(`ELEVENLABS_STABILITY must be 0, 0.5 or 1 for ${MODEL} (got ${raw}).`);
  }
  return n;
})();

const args = new Set(process.argv.slice(2));

if (!KEY) {
  die(
    "ELEVENLABS_API_KEY is not set.\n" +
      "  Add it with:  vercel env add ELEVENLABS_API_KEY\n" +
      "  then:         vercel env pull --yes",
  );
}

async function listVoices() {
  const res = await fetch(`${API}/voices`, { headers: { "xi-api-key": KEY } });
  if (!res.ok) die(`Could not list voices (HTTP ${res.status}). Check the API key.`);
  const { voices } = await res.json();
  console.log(`\n  ${voices.length} voice(s) on this account:\n`);
  for (const v of voices) {
    console.log(`  ${v.voice_id}  ${v.name.padEnd(24)} ${v.category ?? ""}`);
  }
  console.log(`\n  Set the one you want:  vercel env add ELEVENLABS_VOICE_ID\n`);
}

async function synthesize(text) {
  const res = await fetch(`${API}/text-to-speech/${VOICE}`, {
    method: "POST",
    headers: {
      "xi-api-key": KEY,
      "content-type": "application/json",
      accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      // v3 ignores style/speaker-boost; sending them just adds noise.
      voice_settings: V3
        ? { stability: STABILITY, similarity_boost: 0.85 }
        : {
            stability: STABILITY,
            similarity_boost: 0.8,
            style: 0.15,
            use_speaker_boost: true,
          },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    die(`ElevenLabs returned HTTP ${res.status}\n  ${body.slice(0, 400)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  if (args.has("--voices")) return listVoices();
  if (!VOICE) {
    die(
      "ELEVENLABS_VOICE_ID is not set.\n" +
        "  Run  pnpm narrate --voices  to see the voices on the account,\n" +
        "  then vercel env add ELEVENLABS_VOICE_ID",
    );
  }

  await mkdir(OUT, { recursive: true });
  const manifest = existsSync(MANIFEST)
    ? JSON.parse(await readFile(MANIFEST, "utf8"))
    : {};

  const files = (await readdir(SRC)).filter((f) => f.endsWith(".txt"));
  if (!files.length) die(`No narration scripts found in ${SRC}`);

  let spent = 0;
  let skipped = 0;

  for (const file of files) {
    const slug = file.replace(/\.txt$/, "");
    const text = (await readFile(path.join(SRC, file), "utf8")).trim();
    const hash = createHash("sha256").update(`${VOICE}:${MODEL}:${STABILITY}:${text}`).digest("hex").slice(0, 16);
    const dest = path.join(OUT, `${slug}.mp3`);

    if (!args.has("--force") && manifest[slug]?.hash === hash && existsSync(dest)) {
      skipped++;
      continue;
    }

    const tags = (text.match(/\[[^\]]+\]/g) ?? []).length;
    process.stdout.write(`  ${slug} … ${text.length} chars, ${tags} tags … `);
    const audio = await synthesize(text);
    await writeFile(dest, audio);
    manifest[slug] = { hash, chars: text.length, bytes: audio.length };
    spent += text.length;
    console.log(`${(audio.length / 1024).toFixed(0)} KB`);
  }

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(
    `\n  done — ${spent.toLocaleString()} characters synthesized, ${skipped} unchanged\n`,
  );
}

main().catch((e) => die(e.message));
