// 3D Görselleştirme sayfası görselleri: röntgen merceği (render + tel kafes) ve stüdyo (6 kombinasyon)
// Kaynak: tools/output/ (fal.ai çıktıları) → assets/img/hizmet/3d-gorsellestirme/{xray,studyo}/
// Her görsel: 768 / 1280 / 1920 px, AVIF + WebP; IPTC DigitalSourceType = trainedAlgorithmicMedia.
//   node tools/build-studio-assets.mjs
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const TOOLS = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(TOOLS, '..');
const OUT = join(ROOT, 'assets', 'img', 'hizmet', '3d-gorsellestirme');
const FF = join(TOOLS, 'node_modules', 'ffmpeg-static', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
const WIDTHS = [768, 1280, 1920];
const Q = { webp: 74, avifCrf: 33 };

// Seçilen kaynaklar (onaylı): tel kafes 1, render 3; traverten akşam = gündüzden türetilen t_2
const SOURCES = {
  'xray/render': join(TOOLS, 'output', 'render_3.png'),
  'xray/telkafes': join(TOOLS, 'output', 'studio', 'telkafes_1.png'),
  'studyo/acik-mese-gunduz': join(TOOLS, 'output', 'studio', 'acik-mese-gunduz_1.png'),
  'studyo/acik-mese-aksam': join(TOOLS, 'output', 'studio', 'acik-mese-aksam_1.png'),
  'studyo/koyu-ceviz-gunduz': join(TOOLS, 'output', 'studio', 'koyu-ceviz-gunduz_1.png'),
  'studyo/koyu-ceviz-aksam': join(TOOLS, 'output', 'studio', 'koyu-ceviz-aksam_1.png'),
  'studyo/traverten-gunduz': join(TOOLS, 'output', 'studio', 'traverten-gunduz-r_1.png'),
  'studyo/traverten-aksam': join(TOOLS, 'output', 'studio', 'traverten-aksam-t_2.png')
};

const jobs = [];
for (const [key, src] of Object.entries(SOURCES)) {
  if (!existsSync(src)) { console.error('Kaynak yok: ' + src); process.exit(1); }
  mkdirSync(join(OUT, dirname(key)), { recursive: true });
  for (const w of WIDTHS) {
    const vf = `scale=${w}:-2:flags=lanczos`;
    jobs.push(['-i', src, '-vf', vf, '-c:v', 'libwebp', '-quality', String(Q.webp), '-compression_level', '6', join(OUT, `${key}-${w}.webp`)]);
    jobs.push(['-i', src, '-vf', `${vf},format=yuv420p`, '-c:v', 'libaom-av1', '-crf', String(Q.avifCrf), '-cpu-used', '6', '-still-picture', '1', '-f', 'avif', join(OUT, `${key}-${w}.avif`)]);
  }
}
const run = (a) => new Promise((res, rej) => { const p = spawn(FF, ['-v', 'error', '-y', ...a]); p.on('close', (c) => (c ? rej(new Error('ffmpeg: ' + a.at(-1))) : res())); });
await Promise.all(Array.from({ length: 6 }, async () => { for (let j; (j = jobs.shift());) await run(j); }));

// IPTC (yapay zekâ ile üretildi)
const known = [join(process.env.LOCALAPPDATA || '', 'Programs', 'ExifTool', 'ExifTool.exe'), 'C:\\Program Files\\ExifTool\\ExifTool.exe'];
const ex = ['exiftool', ...known.filter((p) => existsSync(p))].find((b) => spawnSync(b, ['-ver']).status === 0);
if (ex) {
  spawnSync(ex, ['-overwrite_original', '-q', '-q', '-r', '-api', 'Compact=all', '-xmp:all=', '-ext', 'webp', '-ext', 'avif',
    '-XMP-iptcExt:DigitalSourceType=http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia', OUT]);
  const miss = spawnSync(ex, ['-q', '-q', '-r', '-ext', 'webp', '-ext', 'avif', '-if', 'not $XMP-iptcExt:DigitalSourceType', '-p', '$FileName', OUT], { encoding: 'utf8' }).stdout.trim();
  console.log(miss ? 'UYARI: IPTC eksik:\n' + miss : '✓ IPTC trainedAlgorithmicMedia: tüm dosyalar');
} else console.log('UYARI: exiftool yok → IPTC yazılmadı');

// Boyut raporu
for (const sub of ['xray', 'studyo']) {
  const dir = join(OUT, sub); const files = readdirSync(dir);
  for (const ext of ['avif', 'webp']) for (const w of WIDTHS) {
    const fs = files.filter((f) => f.endsWith(`-${w}.${ext}`));
    const kb = fs.reduce((s, f) => s + statSync(join(dir, f)).size, 0) / 1024;
    console.log(`${sub.padEnd(7)} ${ext} ${String(w).padStart(4)}px: ${fs.length} dosya, ort. ${(kb / fs.length).toFixed(0)} KB`);
  }
}
