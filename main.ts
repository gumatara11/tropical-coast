// Tropical Coast — the entry program for make.fun gta6-01 (Node 22,
// standard library only). It hands the game in: copies this repository's
// game/ and screenshots/ to /output (or MAKEFUN_OUTPUT_DIR outside the
// grader) and writes /output/dossier.json with the vendored make.fun
// library. The game itself is plain static files a desktop browser loads
// offline — game/index.html plus its classic scripts, three.js vendored
// under game/vendor/, generated textures under game/textures/ — no build
// step, no network request.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The program runs twice in the grader and both runs must write the same
// bytes, so it writes nothing but the copied files and the dossier, and
// nothing it writes carries a timestamp, a random value or an absolute path.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the others refuse an entry the scorer would refuse — more
// than 4 screenshots or one over 256 KiB; more than 993 files in game/ or
// 48 MiB of game files in all, or a path under game/ over 1000 bytes.
// game/ counts beside /output's own 1000-entry cap, its screenshots/ and
// dossier.json, so check the counts before copying and fail loudly instead
// of handing in an entry the gate would refuse.
const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');
if (!existsSync(join(gameDir, 'index.html'))) throw new Error('game/index.html is missing');
const shotNames = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((n) => !n.startsWith('.')).sort()
  : [];
if (shotNames.length < 3 || shotNames.length > 4) throw new Error(`expected 3-4 screenshots, found ${shotNames.length}`);
for (const name of shotNames) {
  if (!/\.(png|jpe?g)$/i.test(name)) throw new Error(`screenshot ${name} is not a PNG or JPEG`);
  if (statSync(join(shotsDir, name)).size > 262144) throw new Error(`screenshot ${name} is over 256 KiB`);
}

mkdirSync(outDir, { recursive: true });
cpSync(gameDir, join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`Tropical Coast: ${shotNames.length} screenshots, dossier written to ${join(outDir, 'dossier.json')}`);
