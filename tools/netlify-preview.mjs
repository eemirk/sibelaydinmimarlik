// Netlify önizlemesi: make-dist'ten SONRA, yalnızca Netlify derlemesinde çalışır (netlify.toml → build.command).
// cPanel ZIP'i bu adımı görmez: orada api/ gerçek PHP'dir ve önizleme bandı yoktur.
//
//   node tools/make-dist.mjs && node tools/netlify-preview.mjs
//
// 1) dist/site/api/ tamamen silinir (Netlify PHP çalıştırmaz; form.php ve lib/ düz metin servis edilirdi).
// 2) dist/site/api/form.php yerine sabit bir JSON yanıtı konur (Content-Type netlify.toml'da):
//    formlar bu mesajı gösterir; ok:false olduğu için başarı akışı / yönlendirme tetiklenmez.
// 3) Tüm HTML'lerde <body> açılışından hemen sonra ince bir önizleme bandı (akışta, sabit değil).
//    Header sabit olduğu için bandın altında başlar; sayfa kaydıkça yukarı kayar (--preview-top).
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'dist', 'site');
if (!existsSync(join(SITE, 'index.html'))) {
  console.error('HATA: dist/site bulunamadı. Önce node tools/make-dist.mjs çalıştırın.');
  process.exit(1);
}

// 1–2) /api → yalnızca önizleme yanıtı
const API = join(SITE, 'api');
rmSync(API, { recursive: true, force: true });
mkdirSync(API, { recursive: true });
writeFileSync(join(API, 'form.php'), JSON.stringify({
  ok: false,
  message: 'Bu bir önizleme sitesidir; form gönderimi yalnızca canlı sitede çalışır. Bilgileriniz gönderilmedi.'
}) + '\n');

// 3) Önizleme bandı
const MARK = 'data-preview-band';
const STYLE = `<style ${MARK}>
.preview-band{position:relative;z-index:101;margin:0;padding:5px 16px;background:#0B4D55;color:#fff;font:500 .75rem/1.4 var(--font-body);text-align:center}
body:not(.has-hero){padding-top:0}
body:not(.has-hero) .preview-band{margin-bottom:var(--header-h)}
.site-header{top:var(--preview-top,0px)}
@media (max-width:1099px){.nav{padding-top:calc(var(--header-h) + var(--preview-top,0px) + 24px)}}
</style>`;
// Bant yüksekliği (mobilde iki satıra sarabilir) ölçülür; header, bant görünür kaldığı sürece onun altında durur.
const BAND = `<p class="preview-band" role="note" ${MARK}>Önizleme sürümü — formlar bu adreste gönderilmez.</p>
<script ${MARK}>(function(){var b=document.querySelector('.preview-band'),r=document.documentElement,q=0;function u(){q=0;r.style.setProperty('--preview-top',Math.max(0,b.offsetHeight-window.scrollY)+'px')}addEventListener('scroll',function(){if(!q)q=requestAnimationFrame(u)},{passive:true});addEventListener('resize',u);u()})();</script>`;

const walk = (dir, out = []) => {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
};
let count = 0;
for (const f of walk(SITE).filter((p) => p.endsWith('.html'))) {
  let s = readFileSync(f, 'utf8');
  if (s.includes(MARK)) continue;
  const body = s.match(/<body[^>]*>/);
  if (!body || !s.includes('</head>')) { console.error(`HATA: ${relative(SITE, f)} içinde <body> / </head> yok.`); process.exit(1); }
  s = s.replace('</head>', `${STYLE}\n</head>`);
  s = s.replace(body[0], `${body[0]}\n${BAND}`);
  writeFileSync(f, s);
  count++;
}
console.log(`✓ Netlify önizlemesi: api/ kaldırıldı (api/form.php → önizleme JSON'u), ${count} HTML'e önizleme bandı eklendi`);
