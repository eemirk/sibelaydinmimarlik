// Dikey logodan yatay logo üretir: simge solda, sağda iki satır yazı.
// Parçalar yeniden çizilmez/esnetilmez; yalnızca translate ile konumlanır.
// Kullanım (proje kökünde):  node tools/make-logo-yatay.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const IMG = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'assets', 'img');

// Parça sınırları (orijinal viewBox 0 0 992.13 799.29 koordinatlarında; tarayıcıda getBBox ile ölçüldü)
const ICON = { x: 300.7, y: 0, w: 404.9, h: 500.9 };
const LINE1 = { x: 0, y: 567.9, h: 93.1 };      // "SİBEL AYDIN"
const LINE2 = { x: 47.8, y: 678.0, h: 73.2 };   // "İNŞAAT & MİMARLIK"
const LINE_GAP = LINE2.y - (LINE1.y + LINE1.h); // orijinal satır aralığı korunur
const TEXT_W = 992.1;
const GAP = ICON.w * 0.25;                       // simge ile yazı arası: simge genişliğinin %25'i

// Hangi üst düzey öğe neye ait (sıra, dosyadaki sırası)
const PARTS = {
  'sibelaydinlogo.svg':       { out: 'sibelaydinlogo-yatay.svg',       icon: [0, 1, 2, 3, 4], line1: 8, line2: 6 },
  'sibelaydinlogo-white.svg': { out: 'sibelaydinlogo-yatay-white.svg', icon: [0, 1, 2, 3, 4, 5, 6], line1: 10, line2: 8 }
};

const f = (n) => +n.toFixed(2);
const textH = LINE1.h + LINE_GAP + LINE2.h;
const textTop = ICON.y + (ICON.h - textH) / 2;   // yazı bloğu simge yüksekliğine dikey ortalı
const textX = ICON.w + GAP;
const W = f(textX + TEXT_W), H = f(ICON.h);

for (const [src, cfg] of Object.entries(PARTS)) {
  const svg = readFileSync(join(IMG, src), 'utf8');
  const defs = svg.match(/<defs>[^]*?<\/defs>/)[0];
  const body = svg.slice(svg.indexOf('</defs>') + 7, svg.lastIndexOf('</svg>'));
  const els = body.match(/<path[^>]*\/>|<g[^>]*>[^]*?<\/g>/g);
  const pick = (ids) => ids.map((i) => els[i]).join('');
  const out =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}">` +
    `<title>Sibel Aydın Mimarlık</title>` + defs +
    `<g transform="translate(${f(-ICON.x)} ${f(-ICON.y)})">${pick(cfg.icon)}</g>` +
    `<g transform="translate(${f(textX - LINE1.x)} ${f(textTop - LINE1.y)})">${els[cfg.line1]}</g>` +
    `<g transform="translate(${f(textX - LINE2.x)} ${f(textTop + LINE1.h + LINE_GAP - LINE2.y)})">${els[cfg.line2]}</g>` +
    `</svg>`;
  writeFileSync(join(IMG, cfg.out), out);
  console.log(`✓ ${cfg.out}  viewBox ${W}×${H}  (oran ${(W / H).toFixed(3)})`);
}
