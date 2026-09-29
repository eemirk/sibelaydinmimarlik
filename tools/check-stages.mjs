// Ara aşama görsellerini kontrol eder:
//  1) stages_preview.jpg — tüm varyasyonlar yan yana (satır = aşama)
//  2) stages_align/     — her aşamanın kenarları bir öncekinin üstüne bindirilir:
//     KIRMIZI = önceki aşama, YEŞİL = bu aşama, SARI = çakışan kenar (kayma yok)
//  3) Yatay/dikey kayma tahmini: sabit kalması gereken alanda (gökyüzü + peyzaj) faz korelasyonu
// Kullanım: node tools/check-stages.mjs
import { existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const TOOLS = dirname(fileURLToPath(import.meta.url));
const OUT = join(TOOLS, 'output');
const FF = join(TOOLS, 'node_modules', 'ffmpeg-static', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
const ff = (a) => { const r = spawnSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...a], { encoding: 'utf8', maxBuffer: 1e9 }); if (r.status) { console.error(r.stderr); process.exit(1); } return r; };

const K = ['K0', 'K1', 'K2', 'K3'];
const V = [1, 2];
const file = (k, v) => (k === 'K4' ? join(OUT, 'render_3.png') : join(OUT, `stage_${k}_${v}.png`));
const W = 640, H = 360;

// 1) Önizleme: her satır bir aşama (2 varyasyon), son satır K4 = render 3
const tiles = [];
for (const k of K) for (const v of V) if (existsSync(file(k, v))) tiles.push([k, v]);
tiles.push(['K4', 0]);
const inputs = tiles.flatMap(([k, v]) => ['-i', file(k, v)]);
const lab = (k, v) => (k === 'K4' ? 'K4 = render 3' : `${k} - varyasyon ${v}`);
let fc = tiles.map(([k, v], i) => `[${i}]scale=${W}:${H},drawtext=text='${lab(k, v)}':x=14:y=12:fontsize=26:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=8[t${i}]`).join(';');
const layout = tiles.map((_, i) => `${(i % 2) * W}_${Math.floor(i / 2) * H}`).join('|');
if (tiles.length % 2) { fc += `;color=c=0xF7F5F2:s=${W}x${H}[pad]`; }
const n = tiles.length + (tiles.length % 2);
const labels = tiles.map((_, i) => `[t${i}]`).join('') + (tiles.length % 2 ? '[pad]' : '');
const layoutFull = tiles.length % 2 ? `${layout}|${W}_${Math.floor(tiles.length / 2) * H}` : layout;
fc += `;${labels}xstack=inputs=${n}:layout=${layoutFull}`;
ff([...inputs, ...(tiles.length % 2 ? ['-f', 'lavfi', '-i', `color=c=0xF7F5F2:s=${W}x${H}`] : []), '-filter_complex', fc.replace(`;color=c=0xF7F5F2:s=${W}x${H}[pad]`, '').replace('[pad]', `[${tiles.length}]`), '-frames:v', '1', '-q:v', '3', join(OUT, 'stages_preview.jpg')]);
console.log('✓ tools/output/stages_preview.jpg');

// 2) Kenar bindirme: her aşama bir önceki aşamanın 1. varyasyonuyla ve render 3 ile
const AL = join(OUT, 'stages_align');
mkdirSync(AL, { recursive: true });
const edge = `scale=1376:768,setsar=1,format=gray,edgedetect=low=0.08:high=0.2`;
function overlay(prev, cur, out) {
  ff(['-i', cur, '-i', prev, '-f', 'lavfi', '-i', 'color=black:s=1376x768',
    '-filter_complex', `[0]${edge}[g];[1]${edge}[r];[2]setsar=1,format=gray[b];[g][b][r]mergeplanes=0x001020:gbrp`,
    '-frames:v', '1', '-q:v', '3', out]);
}

// 3) Sabit bölgede kayma tahmini (üst %35 gökyüzü/ufuk + alt %20 ön plan hariç tutulmaz; yalnız sol ve sağ kenar şeritleri)
function shift(a, b) {
  const grab = (f) => {
    const r = spawnSync(FF, ['-v', 'error', '-i', f, '-vf', 'scale=344:192,format=gray', '-f', 'rawvideo', '-'], { maxBuffer: 1e8 });
    return r.stdout;
  };
  const A = grab(a), B = grab(b), w = 344, h = 192;
  // Kenar şeritleri (bina ortada; sol %22 ve sağ %22 değişmemeli)
  const cols = (x) => x < w * 0.22 || x > w * 0.78;
  let best = { dx: 0, dy: 0, e: Infinity };
  for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
    let e = 0, c = 0;
    for (let y = 6; y < h - 6; y += 2) for (let x = 6; x < w - 6; x += 2) {
      if (!cols(x)) continue;
      const d = A[y * w + x] - B[(y + dy) * w + (x + dx)]; e += d * d; c++;
    }
    e /= c; if (e < best.e) best = { dx, dy, e };
  }
  return { dxPx: best.dx * (1920 / w), dyPx: best.dy * (1080 / h), rms: Math.sqrt(best.e).toFixed(1) };
}

const chain = ['K0', 'K1', 'K2', 'K3', 'K4'];
for (let i = 1; i < chain.length; i++) {
  for (const v of chain[i] === 'K4' ? [0] : V) {
    const cur = file(chain[i], v);
    if (!existsSync(cur)) continue;
    for (const pv of V) {
      const prev = file(chain[i - 1], pv);
      if (!existsSync(prev)) continue;
      const name = `${chain[i - 1]}_${pv}__${chain[i]}${v ? '_' + v : ''}.jpg`;
      overlay(prev, cur, join(AL, name));
      const s = shift(prev, cur);
      console.log(`${chain[i - 1]}_${pv} → ${chain[i]}${v ? '_' + v : ''}: kayma ≈ x ${s.dxPx.toFixed(0)} px, y ${s.dyPx.toFixed(0)} px (1920×1080 ölçeğinde)  → stages_align/${name}`);
    }
  }
}
// Her varyasyon ayrıca render 3'e göre
for (const k of K) for (const v of V) {
  const cur = file(k, v); if (!existsSync(cur)) continue;
  const s = shift(file('K4', 0), cur);
  console.log(`render3 → ${k}_${v}: kayma ≈ x ${s.dxPx.toFixed(0)} px, y ${s.dyPx.toFixed(0)} px`);
}
