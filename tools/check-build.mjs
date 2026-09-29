// villa_build.mp4 kontrolü:
//  1) video_check_build/ozet.jpg — 12 kontrol karesi, 4×3 grid, altında saniye
//  2) Her birleşme noktası için: sıçrama (kare farkı), titreme (parlaklık oynaması),
//     bina kayması (klip sonu ↔ sonraki klip başı, bina bölgesinde kaydırma araması)
// Kullanım: node tools/check-build.mjs
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const TOOLS = dirname(fileURLToPath(import.meta.url));
const OUT = join(TOOLS, 'output');
const CHK = join(OUT, 'video_check_build');
const FF = join(TOOLS, 'node_modules', 'ffmpeg-static', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
const run = (a) => spawnSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...a], { maxBuffer: 1e9 });

// 1) 4×3 önizleme
const shots = readdirSync(CHK).filter((f) => /^sn_\d+\.png$/.test(f)).sort();
const TW = 640, TH = 356, LAB = 44;
let fc = shots.map((f, i) =>
  `[${i}]scale=${TW}:${TH},pad=${TW}:${TH + LAB}:0:0:color=0xF7F5F2,drawtext=text='${i + 1}. saniye':x=(w-text_w)/2:y=${TH + 10}:fontsize=24:fontcolor=0x1E1E1E[t${i}]`).join(';');
fc += ';' + shots.map((_, i) => `[t${i}]`).join('') + `xstack=inputs=${shots.length}:layout=` +
  shots.map((_, i) => `${(i % 4) * TW}_${Math.floor(i / 4) * (TH + LAB)}`).join('|');
run([...shots.flatMap((f) => ['-i', join(CHK, f)]), '-filter_complex', fc, '-frames:v', '1', '-q:v', '3', join(CHK, 'ozet.jpg')]);
console.log('✓ video_check_build/ozet.jpg');

// 2a) Tüm kareler küçük gri: kare farkı (MAD) ve ortalama parlaklık
const w = 240, h = 134;
const raw = run(['-i', join(OUT, 'villa_build.mp4'), '-vf', `scale=${w}:${h},format=gray`, '-f', 'rawvideo', '-']).stdout;
const N = raw.length / (w * h);
const mean = [], mad = [0];
for (let f = 0; f < N; f++) {
  let s = 0, d = 0;
  for (let p = 0; p < w * h; p++) {
    const v = raw[f * w * h + p]; s += v;
    if (f) d += Math.abs(v - raw[(f - 1) * w * h + p]);
  }
  mean.push(s / (w * h)); if (f) mad.push(d / (w * h));
}
const med = [...mad].sort((a, b) => a - b)[Math.floor(mad.length / 2)];
const p95 = [...mad].sort((a, b) => a - b)[Math.floor(mad.length * 0.95)];
// Titreme: parlaklığın yerel ortalamadan sapması (±3 kare)
const flick = mean.map((m, i) => { const a = mean.slice(Math.max(0, i - 3), i + 4); return Math.abs(m - a.reduce((x, y) => x + y) / a.length); });

// 2b) Klip sonu ↔ sonraki klip başı: bina bölgesinde (orta %60) kaydırma araması
function grab(file, last) {
  const args = last ? ['-sseof', '-0.05', '-i', file] : ['-i', file];
  return run([...args, '-frames:v', '1', '-vf', 'scale=480:268,format=gray', '-f', 'rawvideo', '-']).stdout;
}
function shift(A, B) {
  const W = 480, H = 268; let best = { dx: 0, dy: 0, e: Infinity }, base = 0;
  for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) {
    let e = 0, c = 0;
    for (let y = Math.floor(H * 0.3); y < H * 0.8; y += 2) for (let x = Math.floor(W * 0.2); x < W * 0.8; x += 2) {
      const d = A[y * W + x] - B[(y + dy) * W + (x + dx)]; e += d * d; c++;
    }
    e /= c; if (!dx && !dy) base = e; if (e < best.e) best = { dx, dy, e };
  }
  return { dx: best.dx * 1928 / W, dy: best.dy * 1072 / H, rmsAt0: Math.sqrt(base) };
}

const fps = 24, clipDur = 3.04, fade = 3 / fps;
console.log(`\nKare farkı (MAD, 0–255): medyan ${med.toFixed(2)}, %95 ${p95.toFixed(2)}, toplam ${N} kare`);
for (let j = 1; j <= 3; j++) {
  const t = j * (clipDur - fade);                     // birleşme zamanı
  const f0 = Math.round(t * fps);
  const win = [];
  for (let f = f0 - 4; f <= f0 + 4; f++) if (f > 0 && f < N) win.push(f);
  const maxMad = Math.max(...win.map((f) => mad[f]));
  const maxFl = Math.max(...win.map((f) => flick[f]));
  const s = shift(grab(join(OUT, `clip_${j}.mp4`), true), grab(join(OUT, `clip_${j + 1}.mp4`), false));
  const jump = maxMad > Math.max(p95, med * 3) ? 'VAR' : 'yok';
  const fl = maxFl > 2 ? 'VAR' : 'yok';
  const mv = Math.hypot(s.dx, s.dy) >= 8 ? 'VAR' : 'yok';
  console.log(`Birleşme ${j} (K${j}, ~${t.toFixed(2)} sn): sıçrama ${jump} (en yüksek kare farkı ${maxMad.toFixed(2)}), ` +
    `titreme ${fl} (parlaklık sapması ${maxFl.toFixed(2)}), bina kayması ${mv} (≈ x ${s.dx.toFixed(0)} px, y ${s.dy.toFixed(0)} px; hizalı fark RMS ${s.rmsAt0.toFixed(1)})`);
}
// Klip içlerinde en büyük kare farkları (beklenmedik kesme/sıçrama)
const top = mad.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, 5);
console.log('\nEn büyük 5 kare farkı: ' + top.map(([v, i]) => `${(i / fps).toFixed(2)} sn: ${v.toFixed(2)}`).join(' · '));
