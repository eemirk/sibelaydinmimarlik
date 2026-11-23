#!/usr/bin/env node
// Duyuru/reklam görseli: tools/input/reklam/<dosya> → assets/img/duyuru/<ad>-{480,640,960,1280}.{avif,webp}
//   node tools/process-reklam.mjs "<tools/input/reklam/dosya.jpg>" <ad>
// Metadata yazılmaz. Görsel main.js initPromo'da kullanılır (PROMO.img = '/assets/img/duyuru/<ad>').
import { mkdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [src, name] = process.argv.slice(2);
if (!src || !name || !existsSync(src)) { console.error('Kullanım: node tools/process-reklam.mjs <kaynak> <ad>'); process.exit(1); }
const OUT = join(ROOT, 'assets', 'img', 'duyuru');
mkdirSync(OUT, { recursive: true });
const m = await sharp(src).metadata();
for (const w of [480, 640, 960, 1280]) {
  const r = sharp(src).resize({ width: Math.min(w, m.width), withoutEnlargement: true });
  await r.clone().avif({ quality: 62, effort: 6 }).toFile(join(OUT, `${name}-${w}.avif`));
  await r.clone().webp({ quality: 82, effort: 6 }).toFile(join(OUT, `${name}-${w}.webp`));
  console.log(`✓ ${name}-${w}  avif ${(statSync(join(OUT, `${name}-${w}.avif`)).size / 1024).toFixed(0)} KB · webp ${(statSync(join(OUT, `${name}-${w}.webp`)).size / 1024).toFixed(0)} KB`);
}
console.log(`kaynak ${m.width}×${m.height} (oran ${(m.width / m.height).toFixed(3)})`);
