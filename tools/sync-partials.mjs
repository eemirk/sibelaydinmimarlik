// Header ve footer'ı ana sayfadan (index.html) tüm diğer sayfalara kopyalar.
// Kullanım (proje kökünde):  node tools/sync-partials.mjs
// Her sayfada <!-- HEADER START --> … <!-- HEADER END --> ve
// <!-- FOOTER START --> … <!-- FOOTER END --> işaretleri bulunmalıdır.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['assets', 'data', 'api', 'node_modules', 'dist', '.git', 'tipografi-test']);
const BLOCKS = ['HEADER', 'FOOTER'];

const src = readFileSync(join(ROOT, 'index.html'), 'utf8');
const re = (name) => new RegExp(`<!-- ${name} START -->[\\s\\S]*?<!-- ${name} END -->`);
const parts = Object.fromEntries(BLOCKS.map((b) => {
  const m = src.match(re(b));
  if (!m) throw new Error(`index.html içinde ${b} işaretleri yok`);
  return [b, m[0]];
}));

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (!SKIP.has(name) && !(dir === join(ROOT, 'tools') && name === 'output')) walk(p, out);
    } else if (name.endsWith('.html') && p !== join(ROOT, 'index.html')) out.push(p);
  }
  return out;
}

let changed = 0;
for (const file of walk(ROOT)) {
  let html = readFileSync(file, 'utf8');
  const before = html;
  for (const b of BLOCKS) {
    if (re(b).test(html)) html = html.replace(re(b), () => parts[b]);
    else console.warn(`! ${relative(ROOT, file)}: ${b} işareti yok, atlandı`);
  }
  if (html !== before) { writeFileSync(file, html); changed++; console.log(`✓ ${relative(ROOT, file)}`); }
}
console.log(`${changed} dosya güncellendi.`);
