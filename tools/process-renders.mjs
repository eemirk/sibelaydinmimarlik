#!/usr/bin/env node
/* ==========================================================================
   Tasarım projeleri — firmanın 3D render'ları (tools/input/gorseller/tasarim/<proje>/)
   --------------------------------------------------------------------------
     node tools/process-renders.mjs plan                 # seçilen kareler + durum
     node tools/process-renders.mjs gen [--only a,b]     # fotogerçekçi adaylar (nano-banana-pro/edit, 2 aday)
     node tools/process-renders.mjs compare              # orijinal | aday 1 | aday 2 → tools/output/tasarim-karsilastirma/
     node tools/process-renders.mjs contact              # proje başına kontak sayfası → tools/output/tasarim-kontak/
     node tools/process-renders.mjs build                # karar → assets/img/tasarim/<proje>/… (AVIF+WebP, IPTC)

   Kararlar tools/output/tasarim-secim.json içinde: { "<dosya>": 0 | 1 | 2 } (0 = orijinal render).
   Bütçe tavanı BUDGET_USD; her çağrıdan önce kontrol, sonra tools/output/tasarim-butce.json.
   IPTC: yapay zekâ ile işlenen (ya da yz: true) → compositeWithTrainedAlgorithmicMedia, işlenmeyen → digitalCreation.
   Orijinaller tools/input/ altında kalır (.gitignore; repoya girmez).
   ========================================================================== */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const TOOLS = dirname(fileURLToPath(import.meta.url));
const ROOT = join(TOOLS, '..');
const IN = join(TOOLS, 'input', 'gorseller', 'tasarim');
const CAND = join(TOOLS, 'output', 'tasarim-aday');
const CMP = join(TOOLS, 'output', 'tasarim-karsilastirma');
const LEDGER = join(TOOLS, 'output', 'tasarim-butce.json');
const DECIDE = join(TOOLS, 'output', 'tasarim-secim.json');
const MODEL = 'fal-ai/nano-banana-pro/edit';
const PRICE = 0.15;
const BUDGET_USD = 15;
const WIDTHS = [1600, 960, 480];

export const PROMPT = 'Make this architectural render photorealistic. KEEP EXACTLY the same building geometry, proportions, window count and positions, roof shape, facade materials, colors, camera angle and composition. Only improve lighting realism, material textures, sky, vegetation and ground surfaces. Do not add or remove any building elements, people, cars, text or logos. Keep the exact same framing and camera position: the image must align pixel-for-pixel with the input. Keep every existing tree, palm, shrub, fence, gate, car and background landform in exactly the same position and size; only make their surfaces look real. Natural daylight, calm clear weather, natural vegetation typical of the Thrace region of Turkey. No exaggerated HDR, no sunset effect, no lens flare.';

// Site için seçilen kareler (proje → dosya listesi, sıra = galeri sırası). islem: false → orijinal zaten gerçekçi.
// yz: true → orijinal render firmaya yapay zekâ ile iyileştirilmiş olarak geldi (IPTC: compositeWithTrainedAlgorithmicMedia).
export const PLAN = {
  'ahsap-detayli-semer-catili-villa': { islem: true, kareler: ['on-cephe-01', 'kose-cephe-02', 'bahce-cephesi-03'] },
  'kirma-catili-iki-katli-ev': { islem: true, kareler: ['balkon-cephesi-03', 'kus-bakisi-kose-01', 'kose-cephe-02'] },
  'kis-bahceli-tek-katli-ev': { islem: false, yz: true, kareler: ['sokak-cephesi-01', 'kis-bahcesi-02', 'bahce-cephesi-03', 'on-cephe-04'] },
  'teras-sundurmali-modern-villa': { islem: true, kareler: ['bahce-cephesi-01'] },
  'uc-katli-modern-konut': { islem: true, kareler: ['kose-cephe-01', 'yan-cephe-02'] },
  'ikiz-villa': { islem: true, kareler: ['on-cephe-01'] },
  'koyu-zeminli-semer-catili-villa': { islem: true, kareler: ['sokak-cephesi-01', 'kose-cephe-02'] },
  'havuzlu-modern-villa': { islem: true, kareler: ['giris-cephesi-01'] },
  'ahsap-kaplamali-modern-villa': { islem: true, kareler: ['on-cephe-01'] },
  'sundurmali-semer-catili-ev': { islem: true, kareler: ['kose-cephe-01'] },
  'cam-balkonlu-kirma-catili-ev': { islem: true, kareler: ['kus-bakisi-01'] },
  'ahsap-balkonlu-uc-katli-ev': { islem: true, kareler: ['kus-bakisi-01'] },
  'tek-katli-ticari-yapi': { islem: true, kareler: ['kose-cephe-01'] },
  'ahsap-detayli-apartman': { islem: true, kareler: ['kose-cephe-01'] },
  'ahsap-cepheli-apartman': { islem: true, kareler: ['kose-cephe-01'] },
  'cati-pencereli-apartman': { islem: true, kareler: ['on-cephe-01'] },
  'koyu-cepheli-apartman': { islem: true, kareler: ['kose-cephe-01'] },
  'beyaz-cepheli-apartman': { islem: true, kareler: ['kose-cephe-01'] }
};

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (n, d) => { const i = args.indexOf('--' + n); return i > -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const usd = (n) => '$' + n.toFixed(2);
const ledger = () => (existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : []);
const spent = () => ledger().reduce((s, e) => s + e.usd, 0);
const src = (p, k) => join(IN, p, `${p}-${k}.jpg`);
const cand = (p, k, n) => join(CAND, p, `${p}-${k}_${n}.png`);
const items = () => Object.entries(PLAN).flatMap(([p, v]) => v.kareler.map((k) => ({ p, k, islem: v.islem, yz: !!v.yz })));

function loadEnv() {
  const f = join(TOOLS, '.env');
  if (!existsSync(f)) return;
  for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
function exiftool() {
  const known = [join(process.env.LOCALAPPDATA || '', 'Programs', 'ExifTool', 'ExifTool.exe'), 'C:\\Program Files\\ExifTool\\ExifTool.exe'];
  for (const b of ['exiftool', ...known.filter((p) => existsSync(p))]) if (spawnSync(b, ['-ver']).status === 0) return b;
  return null;
}
function tag(files, type) {
  if (!files.length) return;
  const bin = exiftool();
  if (!bin) throw new Error('exiftool yok → IPTC yazılamaz');
  const r = spawnSync(bin, ['-overwrite_original', '-q', '-q', '-api', 'Compact=all', '-all=',
    `-XMP-iptcExt:DigitalSourceType=http://cv.iptc.org/newscodes/digitalsourcetype/${type}`, ...files]);
  if (r.status !== 0) throw new Error('exiftool: ' + r.stderr);
}

async function gen() {
  loadEnv();
  if (!process.env.FAL_KEY) { console.error('FAL_KEY bulunamadı (tools/.env).'); process.exit(1); }
  const { fal } = await import('@fal-ai/client');
  fal.config({ credentials: process.env.FAL_KEY });
  const only = opt('only') ? opt('only').split(',') : null;
  const list = items().filter((x) => x.islem && (!only || only.includes(x.p) || only.includes(`${x.p}-${x.k}`)) && !existsSync(cand(x.p, x.k, 1)));
  const cost = list.length * 2 * PRICE;
  console.log(`${list.length} kare × 2 aday = ${usd(cost)}  (harcanan ${usd(spent())}, tavan ${usd(BUDGET_USD)})`);
  const queue = [...list];
  const worker = async () => {
    while (queue.length) {
      const { p, k } = queue.shift();
      if (spent() + 2 * PRICE > BUDGET_USD + 1e-9) { console.error(`DUR: bütçe tavanı (${p}-${k})`); queue.length = 0; return; }
      try {
        const url = await fal.storage.upload(new Blob([readFileSync(src(p, k))], { type: 'image/jpeg' }));
        const res = await fal.subscribe(MODEL, { input: { prompt: PROMPT, image_urls: [url], num_images: 2, aspect_ratio: 'auto', resolution: '2K', output_format: 'png' }, logs: false });
        const imgs = res.data.images || [];
        mkdirSync(join(CAND, p), { recursive: true });
        for (let i = 0; i < imgs.length; i++) writeFileSync(cand(p, k, i + 1), Buffer.from(await (await fetch(imgs[i].url)).arrayBuffer()));
        const log = ledger(); log.push({ at: new Date().toISOString(), kare: `${p}-${k}`, count: imgs.length, usd: imgs.length * PRICE, request_id: res.requestId });
        writeFileSync(LEDGER, JSON.stringify(log, null, 1));
        console.log(`  ✓ ${p}-${k}: ${imgs.length} aday   toplam ${usd(spent())}`);
      } catch (e) {
        console.error(`  ✗ ${p}-${k}:`, e?.body ? JSON.stringify(e.body) : e.message);
      }
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  console.log(`Harcanan toplam: ${usd(spent())}`);
}

async function compare() {
  const sharp = (await import('sharp')).default;
  mkdirSync(CMP, { recursive: true });
  const H = 640;
  for (const { p, k, islem } of items()) {
    if (!islem) continue;
    const files = [src(p, k), cand(p, k, 1), cand(p, k, 2)].filter(existsSync);
    if (files.length < 2) continue;
    const labels = ['ORİJİNAL', 'ADAY 1', 'ADAY 2'];
    const tiles = [];
    let x = 0;
    for (const [i, f] of files.entries()) {
      const buf = await sharp(f).resize({ height: H }).jpeg({ quality: 85 }).toBuffer({ resolveWithObject: true });
      const lab = Buffer.from(`<svg width="140" height="36"><rect width="140" height="36" fill="#000" opacity=".7"/><text x="10" y="25" font-size="20" font-family="Arial" font-weight="bold" fill="#fff">${labels[i]}</text></svg>`);
      tiles.push({ input: await sharp(buf.data).composite([{ input: lab, left: 0, top: 0 }]).toBuffer(), left: x, top: 0 });
      x += buf.info.width + 12;
    }
    await sharp({ create: { width: x - 12, height: H, channels: 3, background: '#fff' } }).composite(tiles).jpeg({ quality: 80 }).toFile(join(CMP, `${p}-${k}.jpg`));
  }
  console.log('✓ karşılaştırmalar: tools/output/tasarim-karsilastirma/');
}

async function contact() {
  const sharp = (await import('sharp')).default;
  const dir = join(TOOLS, 'output', 'tasarim-kontak'); mkdirSync(dir, { recursive: true });
  for (const p of readdirSync(IN)) {
    const files = readdirSync(join(IN, p)).filter((f) => /\.jpe?g$/i.test(f)).sort();
    const W = 520, Hh = 340, cols = Math.min(3, files.length), rows = Math.ceil(files.length / cols);
    const tiles = await Promise.all(files.map(async (f, i) => {
      const img = await sharp(join(IN, p, f)).resize(W, Hh, { fit: 'contain', background: '#fff' }).toBuffer();
      const lab = Buffer.from(`<svg width="${W}" height="30"><rect width="${W}" height="30" fill="#000" opacity=".65"/><text x="8" y="21" font-size="15" font-family="Arial" fill="#fff">${f}</text></svg>`);
      return { input: await sharp(img).composite([{ input: lab, left: 0, top: Hh - 30 }]).toBuffer(), left: (i % cols) * (W + 8), top: Math.floor(i / cols) * (Hh + 8) };
    }));
    await sharp({ create: { width: cols * (W + 8) - 8, height: rows * (Hh + 8) - 8, channels: 3, background: '#ddd' } }).composite(tiles).jpeg({ quality: 80 }).toFile(join(dir, `${p}.jpg`));
  }
  console.log('✓ kontak sayfaları: tools/output/tasarim-kontak/');
}

async function build() {
  const sharp = (await import('sharp')).default;
  const decide = existsSync(DECIDE) ? JSON.parse(readFileSync(DECIDE, 'utf8')) : {};
  const ai = [], plain = [];
  const out = {};
  for (const { p, k, islem, yz } of items()) {
    const d = islem ? decide[`${p}-${k}`] : 0;
    if (d === undefined) { console.error(`karar yok: ${p}-${k}`); process.exit(1); }
    const file = d ? cand(p, k, d) : src(p, k);
    const base = join(ROOT, 'assets', 'img', 'tasarim', p, `${p}-${k.replace(/-\d+$/, '')}`);
    mkdirSync(dirname(base), { recursive: true });
    const m = await sharp(file).metadata();
    const ratio = m.height / m.width;
    for (const w of WIDTHS) {
      const width = Math.min(w, m.width) === m.width && w > m.width ? m.width : w;
      const img = sharp(file).resize({ width, withoutEnlargement: true });
      await img.clone().avif({ quality: 50, effort: 6 }).toFile(`${base}-${w}.avif`);
      await img.clone().webp({ quality: 70, effort: 6 }).toFile(`${base}-${w}.webp`);
      (d || yz ? ai : plain).push(`${base}-${w}.avif`, `${base}-${w}.webp`);
    }
    out[`${p}-${k}`] = { yol: '/assets/img/tasarim/' + p + '/' + basename(base), oran: +ratio.toFixed(4), islem: d ? `aday ${d}` : 'orijinal' };
  }
  tag(ai, 'compositeWithTrainedAlgorithmicMedia');
  tag(plain, 'digitalCreation');
  writeFileSync(join(TOOLS, 'output', 'tasarim-yayin.json'), JSON.stringify(out, null, 1));
  const kb = [...ai, ...plain].reduce((t, f) => t + statSync(f).size, 0) / 1024;
  console.log(`✓ ${ai.length + plain.length} dosya (${kb.toFixed(0)} KB) · yapay zekâ ile işlenen ${ai.length / 6} kare, işlenmeyen ${plain.length / 6} kare`);
}

function plan() {
  const decide = existsSync(DECIDE) ? JSON.parse(readFileSync(DECIDE, 'utf8')) : {};
  for (const { p, k, islem } of items()) {
    const c = [1, 2].filter((n) => existsSync(cand(p, k, n))).length;
    console.log(`${(p + '-' + k).padEnd(52)} ${islem ? 'işlenecek' : 'orijinal '}  aday:${c}  karar:${decide[`${p}-${k}`] ?? '-'}  ${existsSync(src(p, k)) ? '' : 'KAYNAK YOK'}`);
  }
  console.log(`harcanan: ${usd(spent())} / ${usd(BUDGET_USD)}`);
}

const cmds = { gen, compare, contact, build, plan };
if (!cmds[cmd]) { console.log('Kullanım: node tools/process-renders.mjs <plan|gen|compare|contact|build>'); process.exit(cmd ? 1 : 0); }
Promise.resolve(cmds[cmd]()).catch((e) => { console.error('HATA:', e); process.exit(1); });
