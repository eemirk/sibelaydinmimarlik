// Stüdyo görselleri kontrolü
//   node tools/check-studio.mjs wireframe   → tel kafes ↔ render 3 kenar bindirmesi + kayma
//   node tools/check-studio.mjs rooms        → 6 salon kombinasyonu ↔ taban görseli bindirmesi + kayma
//   node tools/check-studio.mjs preview      → önizleme grid'leri
// Bindirme: KIRMIZI = referans, YEŞİL = üretilen, SARI = çakışan kenar
import { existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const TOOLS = dirname(fileURLToPath(import.meta.url));
const OUT = join(TOOLS, 'output');
const ST = join(OUT, 'studio');
const FF = join(TOOLS, 'node_modules', 'ffmpeg-static', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
const ff = (a) => { const r = spawnSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...a], { maxBuffer: 1e9 }); if (r.status) { console.error(String(r.stderr)); process.exit(1); } return r; };
const W = 480, H = 268;
const edgeRaw = (f) => ff(['-i', f, '-vf', `scale=${W}:${H},format=gray,edgedetect=low=0.08:high=0.2`, '-f', 'rawvideo', '-']).stdout;

// Kenar haritaları arasında en iyi kaydırma (±8 px, 1920 ölçeğinde ≈ ±32 px) ve çakışma oranı
function align(ref, cur, box = [0, 0, 1, 1]) {
  const A = edgeRaw(ref), B = edgeRaw(cur);
  const [x0, y0, x1, y1] = [box[0] * W, box[1] * H, box[2] * W, box[3] * H].map(Math.round);
  const score = (dx, dy) => { let hit = 0, tot = 0;
    for (let y = y0 + 8; y < y1 - 8; y++) for (let x = x0 + 8; x < x1 - 8; x++) {
      if (A[y * W + x] < 128) continue; tot++;
      // ±1 px tolerans
      let ok = false; for (let yy = -1; yy <= 1 && !ok; yy++) for (let xx = -1; xx <= 1 && !ok; xx++) if (B[(y + dy + yy) * W + (x + dx + xx)] >= 128) ok = true;
      if (ok) hit++; }
    return tot ? hit / tot : 0; };
  let best = { dx: 0, dy: 0, s: -1 }; const s0 = score(0, 0);
  for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) { const s = score(dx, dy); if (s > best.s) best = { dx, dy, s }; }
  return { dx: Math.round(best.dx * 1920 / W), dy: Math.round(best.dy * 1080 / H), overlap0: s0, overlapBest: best.s };
}
function overlay(ref, cur, out) {
  const e = `scale=1376:768,setsar=1,format=gray,edgedetect=low=0.08:high=0.2`;
  ff(['-i', cur, '-i', ref, '-f', 'lavfi', '-i', 'color=black:s=1376x768', '-filter_complex',
    `[0]${e}[g];[1]${e}[r];[2]setsar=1,format=gray[b];[g][b][r]mergeplanes=0x001020:gbrp`, '-frames:v', '1', '-q:v', '3', out]);
}
function grid(files, labels, out, cols = 2, w = 640) {
  const h = Math.round(w * 9 / 16);
  const inputs = files.flatMap((f) => ['-i', f]);
  let fc = files.map((_, i) => `[${i}]scale=${w}:${h},drawtext=text='${labels[i]}':x=12:y=10:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=6[t${i}]`).join(';');
  fc += ';' + files.map((_, i) => `[t${i}]`).join('') + `xstack=inputs=${files.length}:layout=` + files.map((_, i) => `${(i % cols) * w}_${Math.floor(i / cols) * h}`).join('|');
  ff([...inputs, '-filter_complex', fc, '-frames:v', '1', '-q:v', '3', out]);
}

const mode = process.argv[2] || 'preview';
if (mode === 'wireframe') {
  const ref = join(OUT, 'render_3.png');
  // Bina bölgesi (render 3'te binanın bulunduğu alan) — kayma burada ölçülür
  const bld = [0.12, 0.3, 0.9, 0.78];
  for (const v of [1, 2]) {
    const f = join(ST, `telkafes_${v}.png`); if (!existsSync(f)) continue;
    overlay(ref, f, join(ST, `hizalama_telkafes_${v}.jpg`));
    const a = align(ref, f, bld);
    console.log(`telkafes_${v}: bina kenarlarının %${(a.overlap0 * 100).toFixed(0)}'i yerinde çakışıyor; en iyi kaydırma x ${a.dx}, y ${a.dy} px (çakışma %${(a.overlapBest * 100).toFixed(0)})`);
  }
  grid([ref, join(ST, 'telkafes_1.png'), join(ST, 'telkafes_2.png'), join(ST, 'hizalama_telkafes_1.jpg')], ['render 3', 'tel kafes 1', 'tel kafes 2', 'hizalama 1'], join(ST, 'onizleme_telkafes.jpg'));
  grid([join(ST, 'hizalama_telkafes_1.jpg'), join(ST, 'hizalama_telkafes_2.jpg')], ['hizalama 1 (kırmızı: render 3)', 'hizalama 2'], join(ST, 'onizleme_telkafes_hizalama.jpg'));
  console.log('✓ studio/onizleme_telkafes.jpg, onizleme_telkafes_hizalama.jpg');
}
// Bir bölgedeki ortalama renk farkı (0–255): pencereden görünen dış manzaranın sabit kalıp kalmadığı
const rgbRaw = (f) => ff(['-i', f, '-vf', `scale=${W}:${H}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']).stdout;
function regionDiff(a, b, box) {
  const A = rgbRaw(a), B = rgbRaw(b);
  const [x0, y0, x1, y1] = [box[0] * W, box[1] * H, box[2] * W, box[3] * H].map(Math.round);
  let d = 0, n = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * W + x) * 3; d += Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]); n += 3; }
  return d / n;
}
if (mode === 'rooms') {
  const base = join(ST, 'salon_taban_1.png');
  const eveBase = join(ST, 'salon_aksam_taban_1.png');
  // Salon 1'de pencereden görünen dış manzara (sol cam cephe): havuz, zeytin ağaçları, tepeler, gökyüzü
  const VIEW = [0.04, 0.2, 0.44, 0.66];
  const M = ['acik-mese', 'koyu-ceviz', 'traverten'];
  const f = (k) => join(ST, `${k}_1.png`);
  const row = (label, ref, k) => {
    const a = align(ref, f(k));
    overlay(ref, f(k), join(ST, `hizalama_${k}.jpg`));
    console.log(`  ${k.padEnd(18)} ← ${label.padEnd(12)} kenar çakışması %${String((a.overlap0 * 100).toFixed(0)).padStart(2)} · kaydırma x ${a.dx}, y ${a.dy} px · dış manzara farkı ${regionDiff(ref, f(k), VIEW).toFixed(1)}`);
  };
  console.log('Akşam tabanı ← salon taban:');
  const eb = align(base, eveBase);
  console.log(`  kenar çakışması %${(eb.overlap0 * 100).toFixed(0)} · kaydırma x ${eb.dx}, y ${eb.dy} px`);
  console.log('Gündüz (referans: salon taban):');
  for (const m of M) row('salon taban', base, `${m}-gunduz`);
  console.log('Akşam (referans: akşam tabanı):');
  for (const m of M) row('akşam tabanı', eveBase, `${m}-aksam`);
  console.log('Dış manzara, setler arası (0 = aynı; ~3 altı gözle fark edilmez):');
  for (const l of ['gunduz', 'aksam']) {
    const pairs = [[0, 1], [0, 2], [1, 2]].map(([i, j]) => `${M[i]}↔${M[j]} ${regionDiff(f(`${M[i]}-${l}`), f(`${M[j]}-${l}`), VIEW).toFixed(1)}`);
    console.log(`  ${l.padEnd(7)} ${pairs.join(' · ')}`);
  }
}
if (mode === 'traverten-pairs') {
  const base = join(ST, 'salon_taban_1.png'), eveBase = join(ST, 'salon_aksam_taban_1.png');
  const WALL = [0.62, 0.30, 0.95, 0.57];     // mutfak arka duvarı (taş kaplama)
  const CHAIRS = [0.13, 0.60, 0.41, 0.90];   // ahşap çerçeveli berjerler
  const g = (i) => join(ST, `traverten-gunduz-r_${i}.png`), a = (i) => join(ST, `traverten-aksam-r_${i}.png`);
  const pct = (x) => '%' + (x * 100).toFixed(0);
  const res = [];
  for (const i of [1, 2]) for (const j of [1, 2]) {
    const w1 = align(g(i), a(j), WALL), w2 = align(a(j), g(i), WALL);
    const c1 = align(g(i), a(j), CHAIRS), c2 = align(a(j), g(i), CHAIRS);
    const wall = (w1.overlap0 + w2.overlap0) / 2, chairs = (c1.overlap0 + c2.overlap0) / 2;
    const shift = Math.max(Math.hypot(w1.dx, w1.dy), Math.hypot(c1.dx, c1.dy));
    const bDay = align(base, g(i)).overlap0, bEve = align(eveBase, a(j)).overlap0;
    const bChairsDay = align(base, g(i), CHAIRS).overlap0, bChairsEve = align(eveBase, a(j), CHAIRS).overlap0;
    res.push({ pair: `gündüz ${i} ↔ akşam ${j}`, i, j, wall, chairs, shift, bDay, bEve, bChairsDay, bChairsEve, score: wall + chairs + (bChairsDay + bChairsEve) / 2 });
  }
  res.sort((x, y) => y.score - x.score);
  for (const r of res) console.log(`${r.pair}: taş duvar ${pct(r.wall)} · berjer ${pct(r.chairs)} · kayma ${r.shift} px | tabana göre: gündüz ${pct(r.bDay)} (berjer ${pct(r.bChairsDay)}), akşam ${pct(r.bEve)} (berjer ${pct(r.bChairsEve)})`);
  const best = res[0];
  overlay(g(best.i), a(best.j), join(ST, 'hizalama_traverten_gunduz_aksam.jpg'));
  // Önizleme: 4 aday + seçilen çiftin bindirmesi + taş duvar / berjer yakın plan
  grid([g(1), g(2), a(1), a(2)], ['traverten gunduz 1', 'traverten gunduz 2', 'traverten aksam 1', 'traverten aksam 2'], join(ST, 'onizleme_traverten_adaylar.jpg'));
  const crop = (f, box, out) => ff(['-i', f, '-vf', `crop=iw*${box[2] - box[0]}:ih*${box[3] - box[1]}:iw*${box[0]}:ih*${box[1]},scale=640:-2`, '-frames:v', '1', '-q:v', '3', out]);
  crop(g(best.i), WALL, join(ST, '_c1.jpg')); crop(a(best.j), WALL, join(ST, '_c2.jpg'));
  crop(g(best.i), CHAIRS, join(ST, '_c3.jpg')); crop(a(best.j), CHAIRS, join(ST, '_c4.jpg'));
  ff(['-i', join(ST, '_c1.jpg'), '-i', join(ST, '_c2.jpg'), '-i', join(ST, '_c3.jpg'), '-i', join(ST, '_c4.jpg'), '-filter_complex',
    '[0][1]hstack[t];[2]scale=640:-2[c];[3]scale=640:-2[d];[c][d]hstack[u];[t][u]vstack', '-frames:v', '1', '-q:v', '3', join(ST, 'onizleme_traverten_yakin.jpg')]);
  console.log(`\nSeçilen çift: ${best.pair} → studio/onizleme_traverten_adaylar.jpg, onizleme_traverten_yakin.jpg, hizalama_traverten_gunduz_aksam.jpg`);
}
// Gündüzden türetilen traverten akşam adayları: taş duvar/berjer (gündüze göre), lamba konumu ve manzara (diğer akşamlara göre)
if (mode === 'traverten-t') {
  const WALL = [0.62, 0.30, 0.95, 0.57], CHAIRS = [0.13, 0.60, 0.41, 0.90], PEND = [0.62, 0.22, 0.80, 0.46], VIEW = [0.04, 0.2, 0.44, 0.66];
  const day = join(ST, 'traverten-gunduz-r_1.png'), ref = join(ST, 'acik-mese-aksam_1.png'), ref2 = join(ST, 'koyu-ceviz-aksam_1.png');
  const both = (a, b, box) => (align(a, b, box).overlap0 + align(b, a, box).overlap0) / 2;
  const pct = (x) => '%' + (x * 100).toFixed(0);
  const rows = [];
  for (const name of ['traverten-aksam-r_1', 'traverten-aksam-t_1', 'traverten-aksam-t_2']) {
    const f = join(ST, `${name}.png`); if (!existsSync(f)) continue;
    const r = { name, wall: both(day, f, WALL), chairs: both(day, f, CHAIRS), pend: (both(ref, f, PEND) + both(ref2, f, PEND)) / 2,
      view: (regionDiff(ref, f, VIEW) + regionDiff(ref2, f, VIEW)) / 2, shift: align(day, f).dx + '/' + align(day, f).dy };
    rows.push(r);
    console.log(`${name.padEnd(22)} taş duvar ↔ gündüz ${pct(r.wall)} · berjer ↔ gündüz ${pct(r.chairs)} · lambalar ↔ diğer akşamlar ${pct(r.pend)} · manzara farkı ${r.view.toFixed(1)} · kayma ${r.shift} px`);
  }
  const best = rows.filter((r) => r.name.includes('-t_')).sort((a, b) => (b.wall + b.chairs + b.pend) - (a.wall + a.chairs + a.pend))[0];
  console.log(`\nSeçilen: ${best.name}`);
  const crop = (f, box, out) => ff(['-i', f, '-vf', `crop=iw*${box[2] - box[0]}:ih*${box[3] - box[1]}:iw*${box[0]}:ih*${box[1]},scale=640:-2`, '-frames:v', '1', '-q:v', '3', out]);
  const tiles = [day, join(ST, 'traverten-aksam-t_1.png'), join(ST, 'traverten-aksam-t_2.png'), join(ST, 'acik-mese-aksam_1.png')];
  tiles.forEach((f, i) => crop(f, [0.58, 0.18, 0.97, 0.6], join(ST, `_k${i}.jpg`)));
  ff([...tiles.flatMap((_, i) => ['-i', join(ST, `_k${i}.jpg`)]), '-filter_complex', '[0][1]hstack[t];[2][3]hstack[u];[t][u]vstack', '-frames:v', '1', '-q:v', '3', join(ST, 'onizleme_traverten_t_mutfak.jpg')]);
  console.log('✓ studio/onizleme_traverten_t_mutfak.jpg (sol üst: gündüz 1 · sağ üst: t_1 · sol alt: t_2 · sağ alt: açık meşe akşam)');
}
// Seçilen 6 görselin tüm crossfade çiftleri için kenar tutarlılığı (bölge bazında)
if (mode === 'transitions') {
  const f = { 'acik-mese-gunduz': 'acik-mese-gunduz_1', 'acik-mese-aksam': 'acik-mese-aksam_1', 'koyu-ceviz-gunduz': 'koyu-ceviz-gunduz_1',
    'koyu-ceviz-aksam': 'koyu-ceviz-aksam_1', 'traverten-gunduz': 'traverten-gunduz-r_1', 'traverten-aksam': 'traverten-aksam-t_2' };
  const P = (k) => join(ST, `${f[k]}.png`);
  const R = { 'taş/mutfak duvarı': [0.62, 0.30, 0.95, 0.57], berjerler: [0.13, 0.60, 0.41, 0.90], 'kanepe': [0.44, 0.58, 0.72, 0.82], 'pencere doğramaları': [0.02, 0.1, 0.5, 0.75] };
  const M = ['acik-mese', 'koyu-ceviz', 'traverten'];
  const T = [...M.map((m) => [`${m}-gunduz`, `${m}-aksam`]), ...['gunduz', 'aksam'].flatMap((l) => [[0, 1], [1, 2], [0, 2]].map(([i, j]) => [`${M[i]}-${l}`, `${M[j]}-${l}`]))];
  for (const [a, c] of T) {
    const parts = Object.entries(R).map(([n, box]) => { const x = align(P(a), P(c), box), y = align(P(c), P(a), box); return `${n} %${(((x.overlap0 + y.overlap0) / 2) * 100).toFixed(0)}`; });
    console.log(`${(a + ' → ' + c).padEnd(38)} ${parts.join(' · ')}`);
  }
}
if (mode === 'preview-rooms') {
  // 2 satır (ışık) × 3 sütun (malzeme)
  const order = ['acik-mese-gunduz', 'koyu-ceviz-gunduz', 'traverten-gunduz', 'acik-mese-aksam', 'koyu-ceviz-aksam', 'traverten-aksam'];
  const names = { 'acik-mese': 'Acik Mese', 'koyu-ceviz': 'Koyu Ceviz', 'traverten': 'Traverten ve Tas', gunduz: 'Gunduz', aksam: 'Aksam' };
  const lbl = (k) => { const i = k.lastIndexOf('-'); return `${names[k.slice(0, i)]} - ${names[k.slice(i + 1)]}`; };
  grid(order.map((k) => join(ST, `${k}_1.png`)), order.map(lbl), join(ST, 'onizleme_salon_6.jpg'), 3, 640);
  console.log('✓ studio/onizleme_salon_6.jpg');
}
if (mode === 'preview-base') {
  grid([join(ST, 'salon_taban_1.png'), join(ST, 'salon_taban_2.png')], ['salon taban 1', 'salon taban 2'], join(ST, 'onizleme_salon_taban.jpg'));
  console.log('✓ studio/onizleme_salon_taban.jpg');
}
