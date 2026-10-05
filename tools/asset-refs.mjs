// Asset kullanım taraması: assets/ ve data/ altındaki her dosya için sitede referans var mı?
//
//   node tools/asset-refs.mjs                 → kullanılmayan dosyaların listesi (kuru çalıştırma)
//   node tools/asset-refs.mjs --md <dosya>    → listeyi Markdown tablo olarak yazar
//   import { assetUsage } from './asset-refs.mjs'  → make-dist: yalnızca referanslı asset'leri yayına alır
//
// Referans kaynakları: tüm HTML (sayfalar + tools/templates), CSS (url()), JS (srcset, dinamik yollar),
// data/*.json, PHP, site.webmanifest, browserconfig, .htaccess, tools/content/* ve make-service-page.mjs.
// Eşleşme: tam yol ("/assets/…/x-960.webp") ya da genişlik/uzantı eki atılmış kök ("/assets/…/x"; JS ve
// data/projects.json srcset'i kökten kurar). Hero sekansı (assets/seq/**) her zaman kullanılır sayılır
// (kare yolları main.js'te prefix + sıra numarasıyla üretilir).
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(HERE, '..');
const SKIP_DIRS = new Set(['tools', 'dist', 'node_modules', '.git', '.claude', '.vscode', '.netlify']);
const TEXT = /\.(html|css|js|mjs|json|php|webmanifest|xml|txt)$|(^|[\\/])\.htaccess$/;
const ALWAYS = [/^assets\/seq\//];                    // dinamik üretilen hero kareleri
const SIZE_SUFFIX = /-(\d{2,4})\.(avif|webp|jpe?g|png)$/i;

const walk = (dir, out = [], skip = SKIP_DIRS) => {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { if (!skip.has(n)) walk(p, out, skip); } else out.push(p);
  }
  return out;
};
const posix = (root, p) => relative(root, p).split('\\').join('/');

/** root: site kökü (kaynak ya da dist/site). stripComments: HTML yorumlarını yok say (yayın çıktısı için). */
export function assetUsage(root = DEFAULT_ROOT, { stripComments = false, extraCorpus = [] } = {}) {
  const all = walk(root);
  const candidates = all.filter((p) => /^(assets|data)\//.test(posix(root, p)) && !/^assets\/(css|js)\//.test(posix(root, p)));
  const corpusFiles = [
    ...all.filter((p) => TEXT.test(p) && !/^(assets\/(img|seq|fonts))\//.test(posix(root, p))),
    ...extraCorpus.filter(existsSync)
  ];
  let corpus = '';
  for (const f of corpusFiles) {
    let t = readFileSync(f, 'utf8');
    if (stripComments && f.endsWith('.html')) t = t.replace(/<!--[\s\S]*?-->/g, '');
    corpus += '\n' + t;
  }
  corpus = corpus.replace(/&amp;/g, '&');
  const used = [], unused = [];
  for (const p of candidates) {
    const rel = posix(root, p);
    const size = statSync(p).size;
    if (ALWAYS.some((re) => re.test(rel))) { used.push({ rel, size, why: 'hero sekansı (dinamik)' }); continue; }
    if (corpus.includes('/' + rel) || corpus.includes(rel)) { used.push({ rel, size, why: 'tam yol' }); continue; }
    const stem = rel.replace(SIZE_SUFFIX, '');
    if (stem !== rel && (corpus.includes("'/" + stem + "'") || corpus.includes('"/' + stem + '"'))) {
      used.push({ rel, size, why: 'kök ad (dinamik srcset)' }); continue;
    }
    unused.push({ rel, size });
  }
  return { used, unused, corpusFiles: corpusFiles.map((f) => posix(root, f)) };
}

// Kaynak taramasında site dosyalarına ek olarak sayfa üreticisi ve içerik dosyaları
export const SOURCE_EXTRA = [
  join(DEFAULT_ROOT, 'tools', 'make-service-page.mjs'),
  ...walk(join(DEFAULT_ROOT, 'tools', 'content'), [], new Set()),
  ...walk(join(DEFAULT_ROOT, 'tools', 'templates'), [], new Set())
];

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { used, unused } = assetUsage(DEFAULT_ROOT, { extraCorpus: SOURCE_EXTRA });
  const kb = (n) => (n / 1024).toFixed(1) + ' KB';
  const total = unused.reduce((s, x) => s + x.size, 0);
  console.log(`kullanılan: ${used.length} · kullanılmayan: ${unused.length} (${(total / 1048576).toFixed(2)} MB)`);
  unused.forEach((x) => console.log('  ' + x.rel + '  ' + kb(x.size)));
  const i = process.argv.indexOf('--md');
  if (i > -1) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(process.argv[i + 1], unused.map((x) => `| ${x.rel} | ${kb(x.size)} |`).join('\n') + '\n');
  }
}
