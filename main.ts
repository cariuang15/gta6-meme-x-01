// gta6-meme-x-01 — "Post a GTA 6 meme on X" (Node 22, standard library only).
//
// The joke behind this entry: GTA V came out in 2013, and GTA VI finally
// arrived on 19 November 2026 — thirteen years of waiting. Wait that long
// and you turn into a ghost. The meme shows make.fun's own ghost mascot
// wandering a Vice City street at sunset, and the post on X tells its
// readers that people and their AI agents earn real money in make.fun
// bounties — while the ghost waited, the agent was already getting paid.
//
// The entry itself is the post, not this program. The house reads the post
// straight from X (its first picture and its text) and hands that to the
// judge. All this program has to do is hand the gate the post's address:
// it reads POST.json from the repository root, checks that it really is a
// usable X post address, and writes it out to /output/POST.json where the
// gate looks for it.
//
// POST.json holds one field:
//
//   {"url": "https://x.com/<handle>/status/<id>"}
//
// The post must be public, it must carry make.fun (a link or written out)
// and/or a tag of @makefunai, and its text must carry one of the entrant's
// make.fun play codes. This program does not judge any of that — the house
// does, by reading the post itself. What it does check, before copying,
// is that POST.json is well-formed JSON and that its url really looks like
// an X post address (x.com or twitter.com, with /status/ and a numeric id).
// A broken POST.json would only waste the entry, so it fails loudly here
// instead of handing the gate a file it cannot use.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR
// stand in for /bot and /output, so a local run looks like this:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// An X post address: https://x.com/<handle>/status/<digits>, or the same
// on twitter.com (with or without www. or mobile. in front). The id is
// digits only; anything after it (a query or a fragment) is ignored.
const X_POST_URL =
  /^https?:\/\/(?:www\.|mobile\.)?(?:x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/\d+(?:[?#].*)?$/;

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message: string): never {
  console.error(`gta6-meme-x-01: ${message}`);
  process.exit(1);
}

const postPath = join(BOT_DIR, 'POST.json');

// First, make sure the file is really there. Without it there is no
// entry at all, so say so plainly instead of failing on a copy error.
let raw: string;
try {
  raw = readFileSync(postPath, 'utf8');
} catch (err) {
  fail(`cannot read POST.json from ${BOT_DIR}: ${(err as Error).message}`);
}

// Second, it has to be valid JSON with a url string in it. A file that
// is not JSON, or JSON without a url, is not a post address.
let parsed: unknown;
try {
  parsed = JSON.parse(raw);
} catch (err) {
  fail(`POST.json is not valid JSON: ${(err as Error).message}`);
}

if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
  fail('POST.json must be a JSON object like {"url": "https://x.com/<handle>/status/<id>"}');
}

const rawUrl = (parsed as { url?: unknown }).url;
if (typeof rawUrl !== 'string' || rawUrl.length === 0) {
  fail('POST.json has no "url" field, or it is not a string');
}

// A stray space or newline around the address should not sink the
// entry, so trim it before checking the shape.
const url = rawUrl.trim();
if (url.length === 0) {
  fail('POST.json "url" is empty after trimming whitespace');
}

// A url still holding the starter's <handle> / <id> placeholders is
// not a post at all — call that out directly, since it is the most
// common mistake with this entry.
if (url.includes('<') || url.includes('>')) {
  fail(
    `POST.json url still holds a placeholder: ${url}\n` +
      'replace <handle> and <id> with the real post address from X',
  );
}

// Third, the url has to look like a real X post address. A placeholder
// such as https://x.com/<handle>/status/<id> fails this check, as does
// a link to anything that is not an X post.
if (!X_POST_URL.test(url)) {
  fail(
    `POST.json url does not look like an X post address: ${url}\n` +
      'expected something like https://x.com/<handle>/status/<id>',
  );
}

// Everything checks out: copy the file unchanged to the output
// directory, so the gate reads exactly the address that was validated.
mkdirSync(OUTPUT_DIR, { recursive: true });
try {
  copyFileSync(postPath, join(OUTPUT_DIR, 'POST.json'));
} catch (err) {
  fail(`could not copy POST.json to ${OUTPUT_DIR}: ${(err as Error).message}`);
}

console.log(
  `gta6-meme-x-01: entry post handed to the gate: ${url}\n` +
    `gta6-meme-x-01: wrote ${join(OUTPUT_DIR, 'POST.json')}`,
);
