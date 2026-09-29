// Yayın paketi: dist/site/ (Netlify yayın klasörü) + isteğe bağlı cPanel ZIP'i
//
//   node tools/make-dist.mjs          → dist/site/
//   node tools/make-dist.mjs --zip    → dist/site/ + dist/sibelaydin-site-YYYYMMDD.zip
//
// 1) Siteyi dist/site/ içine kopyalar (tools/, dist/, .git, .env, netlify.toml vb. HARİÇ)
// 2) Önbellek sürümü: style.css ve main.js'in içerik hash'i (SHA-256, ilk 8 karakter)
//    hesaplanır; tüm HTML'lerde "?v=dev" bu değerle değiştirilir. Kaynakta ?v=dev kalır.
// 3) Güvenlik: çıktıda fal anahtarı / FAL_KEY izi aranır; bulunursa paket üretilmez.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SITE = join(DIST, 'site');
const EXCLUDE = new Set(['tools', 'dist', 'node_modules', '.git', '.gitignore', '.env', '.claude', '.vscode', '.netlify', 'netlify.toml', 'README.md']);
const ASSETS = { 'style.css': 'assets/css/style.css', 'main.js': 'assets/js/main.js' };

// 1) Kopyala
rmSync(SITE, { recursive: true, force: true });
mkdirSync(SITE, { recursive: true });
for (const name of readdirSync(ROOT)) {
  if (EXCLUDE.has(name) || name.startsWith('.env')) continue;
  cpSync(join(ROOT, name), join(SITE, name), { recursive: true });
}

// 2) İçerik hash'i ile sürümle
const hash = {};
for (const [name, rel] of Object.entries(ASSETS)) {
  hash[name] = createHash('sha256').update(readFileSync(join(ROOT, rel))).digest('hex').slice(0, 8);
}
const walk = (dir, out = []) => {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
};
const files = walk(SITE);
let htmlCount = 0;
for (const f of files.filter((p) => p.endsWith('.html'))) {
  let s = readFileSync(f, 'utf8');
  const before = s;
  for (const [name, rel] of Object.entries(ASSETS)) s = s.split(`/${rel}?v=dev`).join(`/${rel}?v=${hash[name]}`);
  if (s.includes('?v=dev')) { console.error(`HATA: ${relative(SITE, f)} içinde çözülmemiş ?v=dev kaldı.`); process.exit(1); }
  if (s !== before) { writeFileSync(f, s); htmlCount++; }
}

// 3) Anahtar taraması (metin dosyaları)
const KEY = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[0-9a-f]{32}|FAL_KEY/i;
const leaks = files.filter((p) => /\.(html|css|js|mjs|json|txt|xml|webmanifest|md|env|toml|htaccess)$|\/\.[^/]+$/.test(p.replace(/\\/g, '/')))
  .filter((p) => KEY.test(readFileSync(p, 'utf8')));
if (leaks.length) {
  rmSync(SITE, { recursive: true, force: true });
  console.error('GÜVENLİK: anahtar izi bulundu, paket silindi:\n  ' + leaks.map((p) => relative(ROOT, p)).join('\n  '));
  process.exit(1);
}

const bytes = walk(SITE).reduce((s, p) => s + statSync(p).size, 0);
console.log(`✓ dist/site/  ${walk(SITE).length} dosya, ${(bytes / 1048576).toFixed(2)} MB`);
console.log(`  style.css?v=${hash['style.css']}  main.js?v=${hash['main.js']}  (${htmlCount} HTML güncellendi)`);
console.log('  anahtar taraması: temiz');

// 4) İsteğe bağlı ZIP (cPanel). Windows'un bsdtar'ı ZIP'i "/" yollarıyla yazar.
if (process.argv.includes('--zip')) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const zip = join(DIST, `sibelaydin-site-${stamp}.zip`);
  if (existsSync(zip)) rmSync(zip);
  const entries = readdirSync(SITE);
  const r = process.platform === 'win32'
    ? spawnSync(join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe'), ['-a', '-c', '-f', zip, ...entries], { cwd: SITE, stdio: 'inherit' })
    : spawnSync('zip', ['-r', '-q', zip, ...entries], { cwd: SITE, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
  console.log(`✓ ${relative(ROOT, zip)}  (${(statSync(zip).size / 1048576).toFixed(2)} MB)`);
}
