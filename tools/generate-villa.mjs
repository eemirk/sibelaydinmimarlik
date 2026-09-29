#!/usr/bin/env node
/* ==========================================================================
   Hero "eskizden gerçeğe" görsel dizisi üretimi — fal.ai
   --------------------------------------------------------------------------
   Adımlar (her biri ayrı çalıştırılır; her adımdan sonra çıktıları inceleyip
   bir sonrakine geçin):

     node generate-villa.mjs render                                  # 4 render
     node generate-villa.mjs sketch --from render_2.png              # 2 eskiz
     node generate-villa.mjs video  --sketch sketch_1.png --render render_2.png
   "Katman katman inşa" senaryosu (güncel):
     node generate-villa.mjs stages [--only K0,K2]                   # K0–K3 ara aşamalar, her biri 2 varyasyon
     node generate-villa.mjs build --k0 stage_K0_1.png --k1 … --k2 … --k3 …   # 4 klip + birleştirme → villa_build.mp4
     node generate-villa.mjs frames --video villa_build.mp4

     node generate-villa.mjs frames [--video villa.mp4] [--mobile-focus 0.5]
     node generate-villa.mjs metadata      # IPTC "AI ile üretildi" (frames sonunda otomatik)

   Ücretli adımlar maliyeti yazar ve onay ister; onayı atlamak için --yes.
   Anahtar: tools/.env → FAL_KEY=...  (process.env.FAL_KEY'den okunur)
   ========================================================================== */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';

/* ---- Modeller (fal.ai dokümantasyonundan doğrulandı, 2026-09) ------------ */
const MODELS = {
  image: 'fal-ai/nano-banana-pro',                                  // Google Nano Banana Pro
  edit: 'fal-ai/nano-banana-pro/edit',                              // eskiz dönüşümü
  video: 'fal-ai/kling-video/v3/pro/image-to-video'                 // Kling 3.0 Pro, 1080p, end_image_url destekli
  // Alternatif: 'fal-ai/kling-video/v3/4k/image-to-video' ($0.42/sn) — sitede max 1920px kullanıldığı için gereksiz.
};
const PRICES = {                                                    // USD, fal.ai model sayfaları
  image_2k: 0.15,                                                   // 1K/2K görsel başına (4K = 2×)
  video_per_sec_no_audio: 0.112                                     // Kling v3 Pro, ses kapalı
};

/* ---- Sabit villa tanımı --------------------------------------------------- */
const VILLA = "Modern two-storey luxury villa in Silivri, Istanbul countryside; flat roofs, white plaster walls, warm wood cladding, large floor-to-ceiling glass, infinity pool in front, landscaped garden with olive trees, three-quarter front view from a slightly elevated eye level, centered composition with empty sky space in the upper third for text.";
const RENDER_STYLE = 'photorealistic architectural visualization, golden hour / early dusk light, warm interior lights on, soft realistic shadows, no people, no text, no watermark';
const SKETCH_PROMPT = "Convert this exact image into an architect's hand-drawn pencil sketch on off-white paper. Keep the composition, camera angle, perspective, proportions and every building edge EXACTLY the same. Clean black line work, light hatching, no color, no text.";
const VIDEO_PROMPT = 'The pencil sketch slowly comes to life: lines turn into a white architectural model, then materials, wood, glass, pool water and landscape appear, finally the warm interior lights turn on. Very slow, subtle camera orbit to the right. Smooth continuous shot, no cuts, no people, no text.';

/* ---- "Katman katman inşa" senaryosu ---------------------------------------- */
const RENDER3_URL = 'https://v3b.fal.media/files/b/0aac59e6/EV6pSLKEd7sdcz_VD_lEt_rswIcTFi.png';
const STAGE_RULE = 'Keep the camera angle, perspective, framing, horizon, sky, landscape and olive trees EXACTLY the same as the input image. The building must occupy exactly the same footprint and position. Same dusk light. Photorealistic. No people, no machinery, no scaffolding, no text.';
const STAGES = {
  K0: "Remove the building and pool completely. Show the empty, levelled plot with the building's footprint drawn on the ground as thin glowing white architectural lines.",
  K1: 'Show only the reinforced concrete foundation and ground floor slab of this building, plus the excavated pool shell. Nothing above the slab.',
  K2: 'Show the building as a clean reinforced concrete frame: columns, floor slabs, roof slabs and stair, no walls, no windows. Raw grey concrete.',
  K3: 'Show the building with all walls built and finished in smooth white plaster, window openings empty (no glass, no frames), no wood cladding, pool empty, landscaping as is, interior lights off.'
};
const BUILD_PROMPT = 'Time-lapse style construction: the next building layer rises smoothly and precisely from the ground. Completely static camera. No people, no machines, no text.';
const BUILD_PROMPT_LAST = ' Wood cladding, glass and pool water appear, then warm interior lights turn on.';
const CLIP_SECONDS = 3;

/* ---- Kare ayarları ---------------------------------------------------------- */
const FRAMES = {
  // Masaüstü WebP = yedek set (AVIF desteklemeyen tarayıcılar): 1600px q60 (onaylı)
  desktop: { count: 150, width: 1600, quality: 60, qualityMin: 60, maxBytes: 8 * 1024 * 1024 },
  // Masaüstü AVIF = birincil set: 1920px, libaom crf (düşük = kaliteli); 8 MB'a sığmazsa AVIF üretilmez
  avif: { width: 1920, crf: 32, crfMax: 34, maxBytes: 8 * 1024 * 1024, concurrency: 6 },
  mobile: { count: 75, height: 1080, aspect: 9 / 16, quality: 70 },  // dikey kırpım: 608×1080
  heroQuality: 82,
  heroWidth: 1920                                                   // statik görsel + og:image
};

/* ---- Yollar ----------------------------------------------------------------- */
const TOOLS = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(TOOLS, '..');
const OUT = join(TOOLS, 'output');
const SEQ_DESKTOP = join(ROOT, 'assets', 'seq', 'desktop');
const SEQ_MOBILE = join(ROOT, 'assets', 'seq', 'mobile');
const HERO_IMG = join(ROOT, 'assets', 'img', 'hero-villa.webp');
const SPEND_LOG = join(OUT, 'spend-log.json');
mkdirSync(OUT, { recursive: true });

/* ---- Yardımcılar ------------------------------------------------------------ */
const args = process.argv.slice(2);
const step = args[0];
const opt = (name, def) => {
  const i = args.indexOf('--' + name);
  return i > -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : def;
};
const flag = (name) => args.includes('--' + name);
const usd = (n) => '$' + n.toFixed(2);

function loadEnv() {
  const f = join(TOOLS, '.env');
  if (!existsSync(f)) return;
  for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

async function confirm(model, detail, cost) {
  console.log('\n──────────────────────────────────────────────');
  console.log(`Model   : ${model}`);
  console.log(`İş      : ${detail}`);
  console.log(`Tahmini : ${usd(cost)}`);
  console.log('──────────────────────────────────────────────');
  if (flag('yes')) return;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const a = (await rl.question('Devam edilsin mi? (e/h) ')).trim().toLowerCase();
  rl.close();
  if (a !== 'e' && a !== 'evet' && a !== 'y') { console.log('İptal edildi.'); process.exit(0); }
}

function logSpend(entry) {
  const log = existsSync(SPEND_LOG) ? JSON.parse(readFileSync(SPEND_LOG, 'utf8')) : [];
  log.push({ at: new Date().toISOString(), ...entry });
  writeFileSync(SPEND_LOG, JSON.stringify(log, null, 2));
  const total = log.reduce((s, e) => s + (e.estimated_usd || 0), 0);
  console.log(`Harcama kaydı: ${basename(SPEND_LOG)} — toplam tahmini ${usd(total)}`);
}

async function falClient() {
  loadEnv();
  if (!process.env.FAL_KEY) { console.error('FAL_KEY bulunamadı (tools/.env).'); process.exit(1); }
  const { fal } = await import('@fal-ai/client');
  fal.config({ credentials: process.env.FAL_KEY });
  return fal;
}

async function run(fal, endpoint, input) {
  const t0 = Date.now();
  const res = await fal.subscribe(endpoint, {
    input,
    logs: true,
    onQueueUpdate: (u) => {
      if (u.status === 'IN_QUEUE') process.stdout.write(`\r  kuyrukta… (sıra ${u.queue_position ?? '?'})   `);
      if (u.status === 'IN_PROGRESS') process.stdout.write(`\r  işleniyor… ${Math.round((Date.now() - t0) / 1000)} sn   `);
    }
  });
  process.stdout.write('\n');
  return res;
}

async function download(url, file) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`İndirme hatası ${r.status}: ${url}`);
  writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  console.log(`  ✓ ${file.replace(ROOT, '').replace(/\\/g, '/')}  (${(statSync(file).size / 1024).toFixed(0)} KB)`);
}

async function upload(fal, name) {
  if (/^https?:\/\//.test(name)) return name;               // zaten erişilebilir bir URL
  const file = join(OUT, name);
  if (!existsSync(file)) { console.error(`Bulunamadı: tools/output/${name}`); process.exit(1); }
  const type = name.endsWith('.png') ? 'image/png' : name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  const url = await fal.storage.upload(new Blob([readFileSync(file)], { type }));
  console.log(`  yüklendi: ${name}`);
  return url;
}

function ffmpegBin() {
  const sys = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  if (sys.status === 0) return 'ffmpeg';
  try {
    const p = join(TOOLS, 'node_modules', 'ffmpeg-static', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
    if (existsSync(p)) return p;
  } catch { /* yok */ }
  console.error('ffmpeg bulunamadı. Kurulum:\n  tools klasöründe: npm install && npm approve-scripts ffmpeg-static && npm rebuild ffmpeg-static\n  ya da Windows geneline: winget install --id Gyan.FFmpeg -e');
  process.exit(1);
}

function ff(bin, argv) {
  const r = spawnSync(bin, ['-hide_banner', '-loglevel', 'error', '-y', ...argv], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
}

function probe(bin, file) {
  const r = spawnSync(bin, ['-hide_banner', '-i', file], { encoding: 'utf8' });
  const s = r.stderr || '';
  const d = s.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const v = s.match(/Video: .*?, (\d{2,5})x(\d{2,5})/);
  const f = s.match(/([\d.]+) fps/);
  if (!d || !v) { console.error('Video okunamadı:\n' + s); process.exit(1); }
  return { duration: +d[1] * 3600 + +d[2] * 60 + +d[3], width: +v[1], height: +v[2], fps: f ? +f[1] : 24 };
}

function clearDir(dir, prefix) {
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(dir)) if (f.startsWith(prefix)) rmSync(join(dir, f));
}
const dirBytes = (dir) => readdirSync(dir).reduce((s, f) => s + statSync(join(dir, f)).size, 0);
const mb = (b) => (b / 1024 / 1024).toFixed(2) + ' MB';

/* ==========================================================================
   Adımlar
   ========================================================================== */
async function stepRender() {
  const n = +opt('count', 4);
  const prompt = `${VILLA} ${RENDER_STYLE}`;
  await confirm(MODELS.image, `${n} adet render, 16:9, 2K`, n * PRICES.image_2k);
  const fal = await falClient();
  const res = await run(fal, MODELS.image, {
    prompt, num_images: n, aspect_ratio: '16:9', resolution: '2K', output_format: 'png'
  });
  const imgs = res.data.images || [];
  for (let i = 0; i < imgs.length; i++) await download(imgs[i].url, join(OUT, `render_${i + 1}.png`));
  logSpend({ step: 'render', model: MODELS.image, request_id: res.requestId, count: imgs.length, estimated_usd: imgs.length * PRICES.image_2k });
  console.log('\nDUR → render_1..4.png dosyalarını inceleyin, sonra:\n  node generate-villa.mjs sketch --from render_N.png');
}

async function stepSketch() {
  const from = opt('from');
  if (!from) { console.error('--from render_N.png (veya https://… URL) gerekli'); process.exit(1); }
  const n = +opt('count', 2);
  await confirm(MODELS.edit, `${n} adet eskiz (${from} → kara kalem), 16:9, 2K`, n * PRICES.image_2k);
  const fal = await falClient();
  const url = await upload(fal, from);
  const res = await run(fal, MODELS.edit, {
    prompt: SKETCH_PROMPT, image_urls: [url], num_images: n, aspect_ratio: '16:9', resolution: '2K', output_format: 'png'
  });
  const imgs = res.data.images || [];
  for (let i = 0; i < imgs.length; i++) await download(imgs[i].url, join(OUT, `sketch_${i + 1}.png`));
  logSpend({ step: 'sketch', model: MODELS.edit, source: from, request_id: res.requestId, count: imgs.length, estimated_usd: imgs.length * PRICES.image_2k });
  console.log(`\nDUR → sketch_1..${imgs.length}.png dosyalarını inceleyin, sonra:\n  node generate-villa.mjs video --sketch sketch_N.png --render ${from}`);
}

async function stepVideo() {
  const sketch = opt('sketch'), render = opt('render');
  if (!sketch || !render) { console.error('--sketch sketch_N.png --render render_N.png gerekli'); process.exit(1); }
  const seconds = +opt('duration', 6);
  await confirm(MODELS.video, `${seconds} sn video, 16:9 (başlangıç: ${sketch}, bitiş: ${render}), ses kapalı`, seconds * PRICES.video_per_sec_no_audio);
  const fal = await falClient();
  const start = await upload(fal, sketch);
  const end = await upload(fal, render);
  const res = await run(fal, MODELS.video, {
    prompt: VIDEO_PROMPT,
    start_image_url: start,
    end_image_url: end,
    duration: String(seconds),
    generate_audio: false,
    negative_prompt: 'blur, distort, low quality, people, text, watermark, scene cut, flicker'
  });
  const file = join(OUT, opt('out', 'villa.mp4'));
  await download(res.data.video.url, file);
  logSpend({ step: 'video', model: MODELS.video, sketch, render, request_id: res.requestId, seconds, estimated_usd: seconds * PRICES.video_per_sec_no_audio });
  console.log('\nDUR → tools/output/villa.mp4 dosyasını izleyin, sonra:\n  node generate-villa.mjs frames');
}

async function stepStages() {
  const only = opt('only') ? opt('only').split(',') : Object.keys(STAGES);
  const n = +opt('count', 2);
  const src = opt('from', RENDER3_URL);
  await confirm(MODELS.edit, `${only.length} aşama × ${n} varyasyon (${only.join(', ')}), 16:9, 2K, kaynak: render 3`, only.length * n * PRICES.image_2k);
  const fal = await falClient();
  const url = await upload(fal, src);
  // Aşamalar paralel üretilir
  await Promise.all(only.map(async (k) => {
    const res = await run(fal, MODELS.edit, {
      prompt: `${STAGES[k]} ${STAGE_RULE}`, image_urls: [url], num_images: n, aspect_ratio: '16:9', resolution: '2K', output_format: 'png'
    });
    const imgs = res.data.images || [];
    for (let i = 0; i < imgs.length; i++) {
      await download(imgs[i].url, join(OUT, `stage_${k}_${i + 1}.png`));
      console.log(`    URL ${k}_${i + 1}: ${imgs[i].url}`);
    }
    logSpend({ step: `stage ${k}`, model: MODELS.edit, request_id: res.requestId, count: imgs.length, estimated_usd: imgs.length * PRICES.image_2k,
      urls: imgs.map((x) => x.url) });
  }));
  console.log('\nDUR → stage_K*.png dosyalarını inceleyin (tools/output/stages_preview.jpg), sonra: node generate-villa.mjs build …');
}

async function stepBuild() {
  const keys = ['k0', 'k1', 'k2', 'k3'];
  const imgs = keys.map((k) => opt(k));
  if (imgs.some((x) => !x)) { console.error('--k0 --k1 --k2 --k3 gerekli (dosya adı veya URL); K4 = render 3'); process.exit(1); }
  imgs.push(opt('k4', RENDER3_URL));
  const secs = +opt('clip', CLIP_SECONDS);
  await confirm(MODELS.video, `4 klip × ${secs} sn (K0→K1, K1→K2, K2→K3, K3→K4), ses kapalı`, 4 * secs * PRICES.video_per_sec_no_audio);
  const fal = await falClient();
  const urls = [];
  for (const x of imgs) urls.push(await upload(fal, x));
  const clips = await Promise.all([0, 1, 2, 3].map(async (i) => {
    const res = await run(fal, MODELS.video, {
      prompt: BUILD_PROMPT + (i === 3 ? BUILD_PROMPT_LAST : ''),
      start_image_url: urls[i], end_image_url: urls[i + 1],
      duration: String(secs), generate_audio: false,
      negative_prompt: 'blur, distort, low quality, camera movement, people, workers, machinery, crane, scaffolding, text, watermark, scene cut, flicker'
    });
    const file = join(OUT, `clip_${i + 1}.mp4`);
    await download(res.data.video.url, file);
    logSpend({ step: `build clip ${i + 1}`, model: MODELS.video, request_id: res.requestId, seconds: secs, estimated_usd: secs * PRICES.video_per_sec_no_audio });
    return file;
  }));
  concatClips(clips, join(OUT, 'villa_build.mp4'));
  console.log('\nDUR → tools/output/villa_build.mp4 ve video_check_build/ karelerini inceleyin, sonra: node generate-villa.mjs frames --video villa_build.mp4');
}

// Klipleri birleştir (en-boy oranı korunur; ölçekleme kare adımında): K(n) klibinin son karesi ile K(n+1)'in ilk karesi aynı görsel olduğundan
// bitişik kareleri tekrarlamamak için her klibin son karesi atılır ve kısa crossfade uygulanır.
function concatClips(files, out, fadeFrames = 3) {
  const bin = ffmpegBin();
  const info = files.map((f) => probe(bin, f));
  const fps = 24;
  const fade = fadeFrames / fps;
  const inputs = files.flatMap((f) => ['-i', f]);
  let chain = files.map((_, i) => `[${i}:v]fps=${fps},setsar=1,format=yuv420p[v${i}]`).join(';');
  let prev = 'v0', offset = 0;
  for (let i = 1; i < files.length; i++) {
    offset += info[i - 1].duration - fade;
    chain += `;[${prev}][v${i}]xfade=transition=fade:duration=${fade.toFixed(3)}:offset=${offset.toFixed(3)}[x${i}]`;
    prev = `x${i}`;
  }
  ff(bin, [...inputs, '-filter_complex', chain, '-map', `[${prev}]`, '-an', '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-pix_fmt', 'yuv420p', out]);
  const total = probe(bin, out);
  console.log(`✓ ${basename(out)}  ${total.width}×${total.height}, ${total.duration.toFixed(2)} sn`);
  // Kontrol kareleri: her saniyeden bir
  const dir = join(OUT, 'video_check_build');
  clearDir(dir, 'sn_');
  for (let s = 0; s < Math.ceil(total.duration); s++) {
    const t = Math.min(s + 0.5, total.duration - 0.05);
    ff(bin, ['-ss', t.toFixed(2), '-i', out, '-frames:v', '1', join(dir, `sn_${String(s + 1).padStart(2, '0')}.png`)]);
  }
  console.log(`✓ kontrol kareleri: tools/output/video_check_build/ (${Math.ceil(total.duration)} adet)`);
}

/* ---- Zaman yeniden eşleme ---------------------------------------------------
   Amaç: scroll boyunca görüntü her an değişsin. Kareler arası değişim (MAD) ölçülür,
   değişim toplamı çıktı süresine eşit dağıtılır (durağan kısımlar hızlanır, hızlı
   kısımlar yavaşlar). Her aşama tamamlandığında (K1–K4) kısa bir duraklama bırakılır. */
const REMAP = { duration: 12, hold: 0.3, fps: 24, floor: 0.15, smooth: 5 };

async function stepRemap() {
  const bin = ffmpegBin();
  const src = join(OUT, opt('video', 'villa_build.mp4'));
  const out = join(OUT, 'villa_remap.mp4');
  const info = probe(bin, src);
  const w = 240, h = 134;
  const raw = spawnSync(bin, ['-v', 'error', '-i', src, '-vf', `scale=${w}:${h},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1e9 }).stdout;
  const N = raw.length / (w * h);
  // Kareler arası ortalama mutlak fark
  const mad = [0];
  for (let f = 1; f < N; f++) {
    let d = 0;
    for (let p = 0; p < w * h; p++) d += Math.abs(raw[f * w * h + p] - raw[(f - 1) * w * h + p]);
    mad.push(d / (w * h));
  }
  // Yumuşatma + taban (tamamen durağan kareler de bir miktar ilerlesin)
  const sm = mad.map((_, i) => { const a = mad.slice(Math.max(1, i - REMAP.smooth), i + REMAP.smooth + 1); return a.reduce((x, y) => x + y, 0) / a.length; });
  const avg = sm.slice(1).reduce((x, y) => x + y, 0) / (N - 1);
  const wgt = sm.map((v, i) => (i === 0 ? 0 : v + avg * REMAP.floor));
  const cum = []; wgt.reduce((s, v, i) => (cum[i] = s + v), 0);
  const total = cum[N - 1];

  // Aşama tamamlanma kareleri: klip birleşme noktaları (klip sonu = aşama görseli) + son kare
  const clipDur = +opt('clip-dur', 3.04), fade = 3 / REMAP.fps;
  const bounds = [1, 2, 3].map((k) => Math.round(k * (clipDur - fade) * info.fps)).concat([N - 1]);
  const moveTime = REMAP.duration - REMAP.hold * bounds.length;

  // Her kaynak karenin yeni zamanı
  const pts = cum.map((c, i) => (c / total) * moveTime + REMAP.hold * bounds.filter((b) => b < i).length);
  const stageStart = [0, ...bounds.map((b) => pts[b])];            // K0 … K4 tamamlandığı an (duraklama başı)

  // setpts ifadesi: artımlı toplam (kare başına süre)
  const dt = pts.map((t, i) => (i ? t - pts[i - 1] : 0));
  const expr = dt.map((d, i) => (i ? `gte(N,${i})*${d.toFixed(6)}` : '0')).join('+');
  const script = join(OUT, 'remap_filter.txt');
  writeFileSync(script, `[0:v]setpts='(${expr})/TB',fps=${REMAP.fps},tpad=stop_mode=clone:stop_duration=${REMAP.hold},format=yuv420p[v]`);
  ff(bin, ['-i', src, '-filter_complex_script', script, '-map', '[v]', '-an', '-c:v', 'libx264', '-crf', '12', '-preset', 'slow', out]);
  const res = probe(bin, out);
  const stages = { source: basename(src), duration: res.duration, hold: REMAP.hold, stageStart };
  writeFileSync(join(OUT, 'stages.json'), JSON.stringify(stages, null, 2));
  console.log(`✓ villa_remap.mp4  ${res.width}×${res.height}, ${res.duration.toFixed(2)} sn`);
  console.log('  Aşama tamamlanma anları (sn): ' + stageStart.map((t, k) => `K${k} ${t.toFixed(2)}`).join(' · '));
  // Değişim dağılımı kontrolü: 1 sn'lik dilimlerde toplam değişim payı (eşit ≈ %8.3)
  const per = Array.from({ length: Math.ceil(REMAP.duration) }, (_, s) => {
    let c = 0; for (let i = 1; i < N; i++) if (pts[i] >= s && pts[i] < s + 1) c += mad[i];
    return c;
  });
  const sum = per.reduce((x, y) => x + y, 0);
  console.log('  Saniye başına değişim payı: ' + per.map((c) => (100 * c / sum).toFixed(1) + '%').join(' '));
}

async function stepFrames() {
  const bin = ffmpegBin();
  const video = join(OUT, opt('video', 'villa_build.mp4'));
  if (!existsSync(video)) { console.error(`Bulunamadı: ${video}`); process.exit(1); }
  const info = probe(bin, video);
  console.log(`Video: ${info.width}×${info.height}, ${info.duration.toFixed(2)} sn, ${info.fps} fps`);
  const focus = Math.min(1, Math.max(0, +opt('mobile-focus', 0.5)));

  // Kareleri videonun tamamına eşit aralıklarla yay: fps = kare sayısı / süre
  const extract = (dir, count, vf, q) => {
    clearDir(dir, 'villa_');
    const rate = (count / info.duration).toFixed(5);
    ff(bin, ['-i', video, '-vf', `fps=${rate}:round=near,${vf}`, '-frames:v', String(count),
      '-c:v', 'libwebp', '-quality', String(q), '-compression_level', '6', '-preset', 'picture',
      '-start_number', '1', join(dir, 'villa_%04d.webp')]);
    let got = readdirSync(dir).filter((f) => f.startsWith('villa_')).length;
    if (got < count) {           // yuvarlama nedeniyle eksik kaldıysa hızı hafif artırıp tekrarla
      clearDir(dir, 'villa_');
      ff(bin, ['-i', video, '-vf', `fps=${(count / (info.duration - 1 / info.fps)).toFixed(5)},${vf}`, '-frames:v', String(count),
        '-c:v', 'libwebp', '-quality', String(q), '-compression_level', '6', '-preset', 'picture',
        '-start_number', '1', join(dir, 'villa_%04d.webp')]);
      got = readdirSync(dir).filter((f) => f.startsWith('villa_')).length;
    }
    return got;
  };

  // Masaüstü: 1920px genişlik, 8 MB'ı geçerse kaliteyi 5'er düşürüp tekrar üret — en fazla q65'e kadar
  let q = +opt('desktop-q', FRAMES.desktop.quality);
  const qMin = +opt('desktop-q-min', FRAMES.desktop.qualityMin);
  const dvf = `scale=${FRAMES.desktop.width}:-2:flags=lanczos`;
  let got, bytes;
  for (;;) {
    got = extract(SEQ_DESKTOP, FRAMES.desktop.count, dvf, q);
    bytes = dirBytes(SEQ_DESKTOP);
    console.log(`Masaüstü: ${got} kare, q${q}, ${mb(bytes)}`);
    if (bytes <= FRAMES.desktop.maxBytes || q <= qMin) break;
    q = Math.max(qMin, q - 5);
    console.log(`  8 MB sınırı aşıldı → q${q} ile tekrar`);
  }
  if (bytes > FRAMES.desktop.maxBytes) {
    console.log(`\nDUR: q${qMin}'te bile ${mb(bytes)} (> 8 MB). Kaliteyi daha fazla düşürmeden önce onay alın.`);
    console.log('  Seçenekler: --desktop-q-min 55 ile daha düşük kalite, ya da kare sayısını/çözünürlüğü azaltmak.');
  }

  // Masaüstü AVIF (birincil): WebP ile aynı zamanlama, 1920px
  const avif = flag('no-avif') ? null : await encodeAvifSet(bin, video, info);

  // Mobil: dikey kırpım (9:16, 1080 yükseklik), yatay odak --mobile-focus (0 sol … 1 sağ)
  const mh = Math.min(FRAMES.mobile.height, info.height);
  const mw = Math.round((mh * FRAMES.mobile.aspect) / 2) * 2;
  const mvf = `scale=-2:${mh}:flags=lanczos,crop=${mw}:${mh}:(iw-${mw})*${focus}:0`;
  const mq = +opt('mobile-q', FRAMES.mobile.quality);
  const mgot = extract(SEQ_MOBILE, FRAMES.mobile.count, mvf, mq);
  const mbytes = dirBytes(SEQ_MOBILE);
  console.log(`Mobil   : ${mgot} kare, ${mw}×${mh}, q${mq}, ${mb(mbytes)}`);

  // Statik görsel (reduced-motion / saveData / og:image): videonun son karesi
  ff(bin, ['-sseof', '-0.1', '-i', video, '-frames:v', '1', '-vf', `scale=${FRAMES.heroWidth}:-2:flags=lanczos`, '-c:v', 'libwebp', '-quality', String(FRAMES.heroQuality), HERO_IMG]);
  const hbytes = statSync(HERO_IMG).size;
  console.log(`Hero    : assets/img/hero-villa.webp, ${mb(hbytes)}`);
  console.log(`\nMasaüstü hero (AVIF destekli tarayıcı): ${avif ? mb(avif.bytes) + ` (AVIF crf${avif.crf})` : 'AVIF yok → ' + mb(bytes) + ' (WebP)'}`);
  console.log(`Masaüstü hero (yedek WebP): ${mb(bytes)} · Mobil hero: ${mb(mbytes)} · Statik görsel: ${mb(hbytes)}`);
  console.log(`\nToplam  : ${mb(bytes + mbytes + hbytes + (avif ? avif.bytes : 0))} (sunucuda; bir ziyaretçi bunların yalnızca bir setini indirir)`);
  if (bytes > FRAMES.desktop.maxBytes) console.log('UYARI: masaüstü seti hâlâ 8 MB üzerinde.');
  console.log(`\nmain.js → HERO_SEQ.mobile: { width: ${mw}, height: ${mh} } olarak güncelleyin.`);

  // Aşama sınırları (remap adımının stages.json'undan) → kare numaraları
  const sj = join(OUT, 'stages.json');
  if (existsSync(sj)) {
    const st = JSON.parse(readFileSync(sj, 'utf8'));
    const toFrames = (count) => {
      const rate = count / info.duration;
      return { frames: st.stageStart.map((t) => Math.min(count - 1, Math.round(t * rate))), hold: Math.max(1, Math.round(st.hold * rate)) };
    };
    const d = toFrames(FRAMES.desktop.count), m = toFrames(FRAMES.mobile.count);
    d.frames[d.frames.length - 1] = FRAMES.desktop.count - 1;
    m.frames[m.frames.length - 1] = FRAMES.mobile.count - 1;
    const stagesOut = { desktop: d, mobile: m };
    writeFileSync(join(OUT, 'stages_frames.json'), JSON.stringify(stagesOut, null, 2));
    console.log(`main.js → HERO_SEQ.stages:\n  desktop: { frames: [${d.frames.join(', ')}], hold: ${d.hold} },\n  mobile:  { frames: [${m.frames.join(', ')}], hold: ${m.hold} }`);
  }

  if (exiftoolBin(false)) stepMetadata();
  else console.log('\nUYARI: exiftool yok → IPTC metadata yazılmadı. Kurup çalıştırın: node generate-villa.mjs metadata');
}

/* ---- AVIF seti: önce PNG kareler, sonra paralel libaom kodlama ---------------- */
async function encodeAvifSet(bin, video, info) {
  const { width, crfMax, maxBytes, concurrency } = FRAMES.avif;
  const count = FRAMES.desktop.count;
  const tmp = join(OUT, 'avif_tmp');
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  const rate = (count / info.duration).toFixed(5);
  ff(bin, ['-i', video, '-vf', `fps=${rate}:round=near,scale=${width}:-2:flags=lanczos`, '-frames:v', String(count), join(tmp, 'f_%04d.png')]);
  const pngs = readdirSync(tmp).filter((f) => f.endsWith('.png')).sort();
  if (pngs.length !== count) { console.log(`AVIF: ${pngs.length}/${count} kare çıktı, AVIF atlandı.`); return null; }
  const removeAvif = () => readdirSync(SEQ_DESKTOP).filter((f) => f.endsWith('.avif')).forEach((f) => rmSync(join(SEQ_DESKTOP, f)));
  const { spawn } = await import('node:child_process');
  const enc = (png, out, crf) => new Promise((res, rej) => {
    const p = spawn(bin, ['-v', 'error', '-y', '-i', png, '-c:v', 'libaom-av1', '-crf', String(crf), '-cpu-used', '6',
      '-still-picture', '1', '-pix_fmt', 'yuv420p', '-f', 'avif', out]);
    p.on('close', (c) => (c === 0 ? res() : rej(new Error('AVIF kodlama hatası: ' + png))));
  });
  for (let crf = +opt('avif-crf', FRAMES.avif.crf); ; crf += 2) {
    removeAvif();
    const queue = pngs.map((f, i) => [join(tmp, f), join(SEQ_DESKTOP, `villa_${String(i + 1).padStart(4, '0')}.avif`)]);
    await Promise.all(Array.from({ length: concurrency }, async () => {
      for (let job; (job = queue.shift());) await enc(job[0], job[1], crf);
    }));
    const bytes = readdirSync(SEQ_DESKTOP).filter((f) => f.endsWith('.avif')).reduce((s, f) => s + statSync(join(SEQ_DESKTOP, f)).size, 0);
    console.log(`AVIF    : ${count} kare, ${width}px, crf${crf}, ${mb(bytes)}`);
    if (bytes <= maxBytes) { rmSync(tmp, { recursive: true, force: true }); return { crf, bytes }; }
    if (crf + 2 > crfMax) {
      console.log(`AVIF crf${crf}'de bile 8 MB üstünde → AVIF seti kaldırıldı, yalnızca WebP kullanılacak.`);
      removeAvif(); rmSync(tmp, { recursive: true, force: true }); return null;
    }
  }
}

/* ---- IPTC: yapay zekâ ile üretilmiş görsel işareti -------------------------
   Iptc4xmpExt:DigitalSourceType = trainedAlgorithmicMedia (XMP, WebP/PNG/JPG) */
const DIGITAL_SOURCE_TYPE = 'http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia';
const AI_IMAGES = () => [HERO_IMG, SEQ_DESKTOP, SEQ_MOBILE];   // og:image = hero-villa.webp

function exiftoolBin(required = true) {
  // PATH + winget/varsayılan kurulum yerleri (yeni kurulumda PATH henüz yenilenmemiş olabilir)
  const known = process.platform === 'win32'
    ? [join(process.env.LOCALAPPDATA || '', 'Programs', 'ExifTool', 'ExifTool.exe'), 'C:\\Program Files\\ExifTool\\ExifTool.exe']
    : [];
  for (const bin of ['exiftool', 'exiftool.exe', ...known.filter((p) => existsSync(p))]) {
    const r = spawnSync(bin, ['-ver'], { encoding: 'utf8' });
    if (r.status === 0) return bin;
  }
  if (required) {
    console.error('exiftool bulunamadı. Kurulum:\n  Windows: winget install --id OliverBetz.ExifTool -e\n  macOS:   brew install exiftool\n  Kurduktan sonra yeni bir terminal açıp tekrar çalıştırın.');
    process.exit(1);
  }
  return null;
}

function stepMetadata() {
  const bin = exiftoolBin();
  const targets = AI_IMAGES().filter((p) => existsSync(p));
  if (!targets.length) { console.error('Etiketlenecek görsel yok (önce: node generate-villa.mjs frames).'); process.exit(1); }
  const r = spawnSync(bin, ['-overwrite_original', '-q', '-q', '-api', 'Compact=all', '-xmp:all=', '-ext', 'webp', '-ext', 'avif', '-ext', 'png', '-ext', 'jpg',
    `-XMP-iptcExt:DigitalSourceType=${DIGITAL_SOURCE_TYPE}`, ...targets], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stderr || r.stdout); process.exit(1); }
  // Doğrulama: tüm dosyalarda alan var mı?
  const chk = spawnSync(bin, ['-q', '-q', '-ext', 'webp', '-ext', 'avif', '-if', `$XMP-iptcExt:DigitalSourceType ne "${DIGITAL_SOURCE_TYPE}"`, '-p', '$FileName', ...targets], { encoding: 'utf8' });
  const missing = (chk.stdout || '').trim();
  console.log(missing ? `UYARI: metadata eksik:\n${missing}` : `✓ IPTC DigitalSourceType yazıldı: ${targets.map((p) => p.replace(ROOT, '')).join(', ')}`);
}

/* ========================================================================== */
const steps = { render: stepRender, sketch: stepSketch, video: stepVideo, stages: stepStages, build: stepBuild,
  remap: stepRemap,
  concat: async () => concatClips([1, 2, 3, 4].map((i) => join(OUT, `clip_${i}.mp4`)), join(OUT, 'villa_build.mp4')), frames: stepFrames, metadata: async () => stepMetadata() };
if (!steps[step]) {
  console.log('Kullanım: node generate-villa.mjs <render|sketch|video|frames> [seçenekler]\nAyrıntı: dosyanın başındaki açıklama.');
  process.exit(step ? 1 : 0);
}
steps[step]().catch((e) => {
  console.error('\nHATA:', e?.body ? JSON.stringify(e.body, null, 2) : e);
  process.exit(1);
});
