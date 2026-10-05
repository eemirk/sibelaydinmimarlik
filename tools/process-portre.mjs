#!/usr/bin/env node
/* ==========================================================================
   Kurucu portresi — tools/input/kurumsal/portre.png → assets/img/ekip/
   --------------------------------------------------------------------------
     node tools/process-portre.mjs

   Gerçek fotoğraf; arka planı yapay zekâ ile kaldırılmış (şeffaf PNG), yüz müşteri tarafından onaylı.
   İşlem YALNIZCA: şeffaf alanın arkasına #F6F7F6 zemin + kırpma + ölçekleme. Rötuş, filtre, keskinleştirme,
   renk/pozlama değişikliği YOK. Tüm metadata (C2PA dahil) silinir; IPTC DigitalSourceType =
   compositeWithTrainedAlgorithmicMedia yazılır (arka plan yapay zekâ ile kaldırıldı).
     dikey 4:5 → sibel-aydin-isikondes-mimar-{800,480}.{avif,webp}   (kimdir hero, /kurumsal/ kurucu kartı)
     kare 1:1  → sibel-aydin-isikondes-mimar-kare-{240,120}.{avif,webp} (blog yazar kutusu, yuvarlak)
     paylaşım  → sibel-aydin-isikondes-mimar-og.jpg 1200×630 (portre ortada, aynı zemin; kimdir og:image)
   Orijinal tools/input/ altında kalır (.gitignore; repoya girmez).
   ========================================================================== */
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const TOOLS = dirname(fileURLToPath(import.meta.url));
const SRC = join(TOOLS, 'input', 'kurumsal', 'portre.png');
const OUT = join(TOOLS, '..', 'assets', 'img', 'ekip');
const BASE = 'sibel-aydin-isikondes-mimar';
const BG = '#F6F7F6';
const IPTC = 'http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia';

if (!existsSync(SRC)) { console.error('YOK:', SRC); process.exit(1); }
mkdirSync(OUT, { recursive: true });
const flat = await sharp(SRC).flatten({ background: BG }).png().toBuffer({ resolveWithObject: true });
const W = flat.info.width, H = flat.info.height;

// 4:5: kaynak zaten ~4:5 (1122×1402) → tam genişlik, yükseklik 4:5'e göre (alttan kırpılır; baş üstte kalır)
const v = { left: 0, top: 0, width: W, height: Math.min(H, Math.round(W * 5 / 4)) };
// 1:1: tam genişlik, üstten (baş ve omuzlar; göz hizası üst üçte bir)
const s = { left: 0, top: 0, width: W, height: W };

const outputs = [];
const write = async (buf, name, w, h) => {
  const r = sharp(buf).resize(w, h, { fit: 'fill' });     // oran zaten doğru; yalnızca ölçek
  for (const [ext, fn] of [['avif', (x) => x.avif({ quality: 60, effort: 6 })], ['webp', (x) => x.webp({ quality: 82, effort: 6 })]]) {
    const f = join(OUT, `${name}-${w}.${ext}`);
    await fn(r.clone()).toFile(f);
    outputs.push(f);
  }
};
const vert = await sharp(flat.data).extract(v).png().toBuffer();
const sq = await sharp(flat.data).extract(s).png().toBuffer();
await write(vert, BASE, 800, 1000);
await write(vert, BASE, 480, 600);
await write(sq, BASE + '-kare', 240, 240);
await write(sq, BASE + '-kare', 120, 120);
// Paylaşım görseli 1200×630: portre (4:5) yükseklikte 630, ortada; zemin aynı renk
const og = join(OUT, `${BASE}-og.jpg`);
const ph = await sharp(vert).resize({ height: 630 }).png().toBuffer({ resolveWithObject: true });
await sharp({ create: { width: 1200, height: 630, channels: 3, background: BG } })
  .composite([{ input: ph.data, left: Math.round((1200 - ph.info.width) / 2), top: 0 }])
  .jpeg({ quality: 85, mozjpeg: true }).toFile(og);
outputs.push(og);

// Metadata: hepsi silinir, yalnızca IPTC DigitalSourceType yazılır
const known = [join(process.env.LOCALAPPDATA || '', 'Programs', 'ExifTool', 'ExifTool.exe'), 'C:\\Program Files\\ExifTool\\ExifTool.exe'];
const bin = ['exiftool', ...known.filter((p) => existsSync(p))].find((b) => spawnSync(b, ['-ver']).status === 0);
if (!bin) { console.error('exiftool yok → IPTC yazılamaz'); process.exit(1); }
const r = spawnSync(bin, ['-overwrite_original', '-q', '-q', '-all=', `-XMP-iptcExt:DigitalSourceType=${IPTC}`, ...outputs]);
if (r.status !== 0) { console.error('exiftool:', String(r.stderr)); process.exit(1); }
for (const f of outputs) console.log(`✓ ${f.split(/[\\/]/).pop()}  ${(statSync(f).size / 1024).toFixed(0)} KB`);
console.log(`kaynak ${W}×${H} · 4:5 kırpım ${v.width}×${v.height} · kare ${s.width}×${s.height}`);
