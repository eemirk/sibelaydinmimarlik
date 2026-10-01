// Yayın paketi: dist/site/ (Netlify yayın klasörü) + isteğe bağlı cPanel ZIP'i
//
//   node tools/make-dist.mjs          → dist/site/
//   node tools/make-dist.mjs --zip    → dist/site/ + dist/sibelaydin-site-YYYYMMDD.zip
//
// 1) Siteyi dist/site/ içine kopyalar (tools/, dist/, .git, .env, netlify.toml vb. HARİÇ)
// 2) Önbellek sürümü: style.css ve main.js'in içerik hash'i (SHA-256, ilk 8 karakter)
//    hesaplanır; tüm HTML'lerde "?v=dev" bu değerle değiştirilir. Kaynakta ?v=dev kalır.
//    Paylaşım etiketleri: og:title / og:description içindeki {{title}} ve {{description}},
//    sayfanın <title> ve meta description değerleriyle doldurulur (tek kaynak).
// 3) Güvenlik: çıktıda fal anahtarı / FAL_KEY izi ve dolu SMTP şifresi aranır; bulunursa paket üretilmez.
//    api/config.local.php (SMTP şifresi) ve form çalışma verisi (_data, private_data) hiçbir derinlikte kopyalanmaz.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SITE = join(DIST, 'site');
const EXCLUDE = new Set(['tools', 'dist', 'node_modules', '.git', '.gitignore', '.env', '.claude', '.vscode', '.netlify', 'netlify.toml', 'README.md']);
// Her derinlikte hariç: SMTP şifresi içeren yerel ayar dosyası ve form çalışma verisi
const NESTED_EXCLUDE = new Set(['config.local.php', '_data', 'private_data']);
const ASSETS = { 'style.css': 'assets/css/style.css', 'main.js': 'assets/js/main.js' };

// 1) Kopyala
rmSync(SITE, { recursive: true, force: true });
mkdirSync(SITE, { recursive: true });
for (const name of readdirSync(ROOT)) {
  if (EXCLUDE.has(name) || NESTED_EXCLUDE.has(name) || name.startsWith('.env')) continue;
  cpSync(join(ROOT, name), join(SITE, name), { recursive: true, filter: (src) => !NESTED_EXCLUDE.has(basename(src)) });
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
let htmlCount = 0, ogCount = 0;
for (const f of files.filter((p) => p.endsWith('.html'))) {
  let s = readFileSync(f, 'utf8');
  const before = s;
  for (const [name, rel] of Object.entries(ASSETS)) s = s.split(`/${rel}?v=dev`).join(`/${rel}?v=${hash[name]}`);
  if (s.includes('?v=dev')) { console.error(`HATA: ${relative(SITE, f)} içinde çözülmemiş ?v=dev kaldı.`); process.exit(1); }
  // Paylaşım etiketleri tek kaynaktan: {{title}} → <title>, {{description}} → meta description
  // (sayfada açıkça yazılmış og değerleri olduğu gibi kalır)
  if (s.includes('{{title}}') || s.includes('{{description}}')) {
    const title = (s.match(/<title>([^<]*)<\/title>/) || [])[1];
    const desc = (s.match(/<meta name="description" content="([^"]*)">/) || [])[1];
    if (s.includes('{{title}}') && !title) { console.error(`HATA: ${relative(SITE, f)} {{title}} kullanıyor ama <title> yok.`); process.exit(1); }
    if (s.includes('{{description}}') && !desc) { console.error(`HATA: ${relative(SITE, f)} {{description}} kullanıyor ama meta description yok.`); process.exit(1); }
    s = s.split('content="{{title}}"').join(`content="${title}"`).split('content="{{description}}"').join(`content="${desc}"`);
    if (/\{\{(title|description)\}\}/.test(s)) { console.error(`HATA: ${relative(SITE, f)} içinde çözülmemiş {{…}} kaldı (yalnızca content="…" içinde kullanın).`); process.exit(1); }
    ogCount++;
  }
  if (s !== before) { writeFileSync(f, s); htmlCount++; }
}

// 3) Anahtar taraması (metin dosyaları)
const KEY = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[0-9a-f]{32}|FAL_KEY|SMTP_PASS'\s*=>\s*'[^']+'/i;
// Google uygulama şifresi biçimi (16 küçük harf, boşluklu ya da bitişik) — yalnızca api/config*.php içinde aranır
const APP_PASS = /(^|[^a-z])([a-z]{4} [a-z]{4} [a-z]{4} [a-z]{4}|[a-z]{16})([^a-z]|$)/m;
const leaks = files.filter((p) => /\.(html|css|js|mjs|json|txt|xml|webmanifest|md|env|toml|htaccess|php|ini)$|\/\.[^/]+$/.test(p.replace(/\\/g, '/')))
  .filter((p) => {
    const t = readFileSync(p, 'utf8');
    return KEY.test(t) || (/config[^\\/]*\.php$/.test(p) && APP_PASS.test(t.replace(/\/\/.*|#.*|\/\*[^]*?\*\//g, '')));
  });
if (leaks.length) {
  rmSync(SITE, { recursive: true, force: true });
  console.error('GÜVENLİK: anahtar izi bulundu, paket silindi:\n  ' + leaks.map((p) => relative(ROOT, p)).join('\n  '));
  process.exit(1);
}

const bytes = walk(SITE).reduce((s, p) => s + statSync(p).size, 0);
console.log(`✓ dist/site/  ${walk(SITE).length} dosya, ${(bytes / 1048576).toFixed(2)} MB`);
console.log(`  style.css?v=${hash['style.css']}  main.js?v=${hash['main.js']}  (${htmlCount} HTML güncellendi, ${ogCount} sayfada og:title/description dolduruldu)`);
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
