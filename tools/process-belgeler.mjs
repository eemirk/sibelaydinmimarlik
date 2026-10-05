#!/usr/bin/env node
/* ==========================================================================
   Belgeler — tarama PDF'leri (tools/input/belgeler/) → site görselleri
   --------------------------------------------------------------------------
     node tools/process-belgeler.mjs            # assets/img/belgeler/<slug>-{800,1600}.{avif,webp}
                                                # + önizleme: tools/output/screens/belgeler/

   Her PDF tek sayfa, gömülü 2480×3507 JPEG (A4 / 300 dpi): JPEG doğrudan alınır (yeniden örnekleme yok),
   dik konuma döndürülür, kişisel veriler OPAK kutuyla kapatılır (bulanıklaştırma yok), kırpılır,
   sağ alta yarı saydam "sibelaydinmimarlik.com.tr" filigranı eklenir. Çıktıda EXIF/ICC/XMP yoktur.
   Kapatılanlar: T.C. kimlik no, imzalar, kişisel sorgu içerebilecek QR kod. Görünür kalanlar: kurum,
   belge no, ad-soyad, sicil no, firma unvanı ve işyeri adresi, yetki türü, tarihler, mühürler.
   Koordinatlar dik görüntüde piksel [x0, y0, x1, y1]. Yeni belge gelince (ör. 2027 büro tescili)
   önizlemeyi kontrol edip koordinatları güncelleyin; başlık/metin: tools/content/belgeler.mjs.
   Orijinal PDF'ler tools/input/ altında kalır (.gitignore; repoya girmez).
   ========================================================================== */
import { readFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const TOOLS = dirname(fileURLToPath(import.meta.url));
const IN = join(TOOLS, 'input', 'belgeler');
const OUT = join(TOOLS, '..', 'assets', 'img', 'belgeler');
const PRE = join(TOOLS, 'output', 'screens', 'belgeler');
const MASK = '#1F2328';
const WIDTHS = [1600, 800];

const DOCS = [
  { pdf: 'doc01511120261005111212.pdf', slug: 'mimarlar-odasi-buro-tescil-belgesi-2026', rotate: 180, masks: [
    [1140, 1192, 2115, 1298],   // T.C. kimlik no (değer hücresi)
    [222, 205, 468, 440],       // QR kod
    [440, 2860, 870, 3075],     // imza (Oda Başkanı)
    [1465, 2860, 1990, 3075]    // imza (Genel Sekreter)
  ] },
  { pdf: 'doc01511420261005111756.pdf', slug: 'd1-temel-bina-akustigi-sertifikasi', rotate: 270, masks: [
    [1300, 950, 2215, 1022],    // (T.C. Kimlik No: …)
    [2050, 1548, 3255, 2008]    // imza + üstüne atıldığı isim/unvan satırı
  ] },
  { pdf: 'doc01511220261005111436.pdf', slug: 'kamulastirma-bilirkisiligi-yetki-belgesi', rotate: 270, masks: [
    [2870, 1862, 3295, 1912],   // imza üst kuyruğu
    [2670, 1910, 3295, 2138]    // imza
  ] },
  { pdf: 'doc01511320261005111630.pdf', slug: 'marka-tescil-belgesi', rotate: 180, masks: [
    [1590, 2972, 2110, 3125]    // imza
  ] }
];

// PDF içindeki tek DCT (JPEG) akışı
function pdfJpeg(file) {
  const b = readFileSync(file);
  const st = b.indexOf(Buffer.from('stream'), b.indexOf(Buffer.from('/DCTDecode')));
  const a = b.indexOf(Buffer.from([0xff, 0xd8, 0xff]), st);
  const z = b.lastIndexOf(Buffer.from([0xff, 0xd9]), b.indexOf(Buffer.from('endstream'), a)) + 2;
  if (st < 0 || a < 0 || z < 2) throw new Error('JPEG akışı bulunamadı: ' + file);
  return b.subarray(a, z);
}

// İçerik sınırı: satır/sütunda 40'tan fazla beyaz olmayan piksel (tarama lekelerini yok sayar)
async function bbox(buf, W, H) {
  const { data } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const rows = new Uint32Array(H), cols = new Uint32Array(W);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 3; if (data[o] + data[o + 1] + data[o + 2] < 690) { rows[y]++; cols[x]++; } }
  const first = (a) => a.findIndex((v) => v > 40);
  const last = (a) => a.length - 1 - [...a].reverse().findIndex((v) => v > 40);
  return [first(cols), first(rows), last(cols), last(rows)];
}

mkdirSync(OUT, { recursive: true }); mkdirSync(PRE, { recursive: true });
for (const d of DOCS) {
  const file = join(IN, d.pdf);
  if (!existsSync(file)) { console.error('YOK:', file); process.exit(1); }
  const up = await sharp(pdfJpeg(file)).rotate(d.rotate).png().toBuffer({ resolveWithObject: true });
  const W = up.info.width, H = up.info.height;
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${d.masks.map(([a, b, c, e]) => `<rect x="${a}" y="${b}" width="${c - a}" height="${e - b}" fill="${MASK}"/>`).join('')}</svg>`;
  const masked = await sharp(up.data).composite([{ input: Buffer.from(svg) }]).png().toBuffer();
  const [x0, y0, x1, y1] = await bbox(masked, W, H);
  const m = 36, L = Math.max(0, x0 - m), T = Math.max(0, y0 - m), CW = Math.min(W, x1 + m) - L, CH = Math.min(H, y1 + m) - T;
  const crop = await sharp(masked).extract({ left: L, top: T, width: CW, height: CH }).png().toBuffer();
  const fs = Math.round(CW * 0.0135), pad = Math.round(CW * 0.03);
  const wm = `<svg width="${CW}" height="${CH}" xmlns="http://www.w3.org/2000/svg"><text x="${CW - pad}" y="${CH - pad}" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="${fs}" font-weight="600" fill="#12636D" fill-opacity=".55" stroke="#fff" stroke-opacity=".6" stroke-width="${Math.max(1, fs / 14)}" paint-order="stroke">sibelaydinmimarlik.com.tr</text></svg>`;
  const final = await sharp(crop).composite([{ input: Buffer.from(wm) }]).png().toBuffer();
  const sizes = [];
  for (const w of WIDTHS) {
    const r = sharp(final).resize({ width: w });   // sharp varsayılanı: metadata yazılmaz
    await r.clone().webp({ quality: 80, effort: 6 }).toFile(join(OUT, `${d.slug}-${w}.webp`));
    await r.clone().avif({ quality: 55, effort: 6 }).toFile(join(OUT, `${d.slug}-${w}.avif`));
    sizes.push(`${w}: ${(statSync(join(OUT, `${d.slug}-${w}.webp`)).size / 1024).toFixed(0)}/${(statSync(join(OUT, `${d.slug}-${w}.avif`)).size / 1024).toFixed(0)} KB`);
  }
  // Önizleme: orijinal küçük + kapatılmış büyük, yan yana
  const big = await sharp(final).resize({ height: 1100 }).png().toBuffer({ resolveWithObject: true });
  const small = await sharp(up.data).resize({ height: 420 }).png().toBuffer({ resolveWithObject: true });
  const lab = (t, w) => Buffer.from(`<svg width="${w}" height="40"><rect width="${w}" height="40" fill="#222"/><text x="12" y="27" font-family="Arial" font-size="20" fill="#fff">${t}</text></svg>`);
  await sharp({ create: { width: small.info.width + big.info.width + 60, height: 1180, channels: 3, background: '#d9d9d9' } })
    .composite([
      { input: lab('ORİJİNAL', small.info.width), left: 20, top: 20 }, { input: small.data, left: 20, top: 60 },
      { input: lab('KAPATILMIŞ + KIRPILMIŞ + FİLİGRAN', big.info.width), left: small.info.width + 40, top: 20 }, { input: big.data, left: small.info.width + 40, top: 60 }
    ]).jpeg({ quality: 82 }).toFile(join(PRE, `${d.slug}.jpg`));
  console.log(`✓ ${d.slug}  ${CW}×${CH}  webp/avif ${sizes.join(' · ')}`);
}
