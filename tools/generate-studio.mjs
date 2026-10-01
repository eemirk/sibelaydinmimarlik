#!/usr/bin/env node
/* ==========================================================================
   3D Görselleştirme sayfası — "Görselleştirme Stüdyosu" görselleri (fal.ai)
   --------------------------------------------------------------------------
   Adımlar (her biri ayrı çalıştırılır; her adımdan sonra çıktıları inceleyin):

     node generate-studio.mjs wireframe                 # A) tel kafes, 2 varyasyon (render 3'ten)
     node generate-studio.mjs room-base                 # B) salon taban görseli, 2 varyasyon
     node generate-studio.mjs room-variants --base <salon_taban_N.png | URL>
                                                        # B) 6 malzeme/ışık kombinasyonu
     node generate-studio.mjs maquette-input            # 2) beyaz maket girdisi (deneysel)
     node generate-studio.mjs check                     # hizalama bindirmeleri + önizleme

   Çıktılar: tools/output/studio/. Her görsele IPTC DigitalSourceType =
   trainedAlgorithmicMedia yazılır. Anahtar: tools/.env → FAL_KEY (site dosyalarına girmez).
   Ücretli adımlar maliyeti yazar ve onay ister; onayı atlamak için --yes.
   ========================================================================== */
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';

const MODELS = { image: 'fal-ai/nano-banana-pro', edit: 'fal-ai/nano-banana-pro/edit' };
const PRICE_IMAGE_2K = 0.15;
// Görselden 3D: fal.ai dokümanından doğrulandı (2026-09) — $0.375/üretim; PBR +$0.15, özel yüz sayısı +$0.15
const MODEL_3D = 'fal-ai/hunyuan-3d/v3.1/pro/image-to-3d';
const PRICE_3D = 0.375;
const RENDER3_URL = 'https://v3b.fal.media/files/b/0aac59e6/EV6pSLKEd7sdcz_VD_lEt_rswIcTFi.png';

const PROMPTS = {
  wireframe: 'Convert this exact image into an architectural 3D wireframe render: the building shown as clean thin glowing white and pale-blue edge lines on a deep navy (#0E1624) background, visible structural grid, floor slabs and window mullions as lines, landscape and trees as faint sparse wireframe, subtle blueprint grid on the ground. Keep camera angle, perspective, framing and every building edge EXACTLY aligned with the input. No text.',
  roomBase: 'Photorealistic interior render of the double-height living room of a modern luxury villa in Istanbul countryside: large floor-to-ceiling windows overlooking an infinity pool and olive trees, minimalist sofa, dining area, open kitchen in the background, fixed wide-angle camera at eye level, neutral white walls, oak flooring, soft daylight. No people, no text.',
  // Kombinasyonlar: kamera, mobilya ve oda geometrisi birebir aynı; yalnızca malzeme/ışık
  keep: 'Keep the camera position, lens, framing, room geometry, windows, furniture layout and every object EXACTLY the same as the input image; change only materials and lighting as described. Photorealistic. No people, no text.',
  materials: {
    'acik-mese': 'light natural oak flooring and light oak wood wall panels, light beige textiles and upholstery',
    'koyu-ceviz': 'dark walnut flooring and dark walnut wall panels, anthracite textiles and upholstery, brushed brass details',
    'traverten': 'travertine stone flooring and a natural stone feature wall, off-white textiles and upholstery'
  },
  light: {
    gunduz: 'soft natural daylight through the windows',
    aksam: 'warm dusk light outside, interior lights on (cove lighting, pendant lamps), windows showing blue-hour sky'
  },
  // Malzeme seti → zemin / ahşap paneller ve mutfak yüzeyleri / tekstiller
  materialSets: {
    'acik-mese': ['light natural oak flooring', 'light oak wood wall panels and light oak kitchen cabinet fronts', 'light beige'],
    'koyu-ceviz': ['dark walnut flooring', 'dark walnut wall panels and dark walnut kitchen cabinet fronts with brushed brass handles and details', 'anthracite grey'],
    'traverten': ['honed travertine stone flooring', 'a natural stone clad feature wall instead of wood panels, and off-white kitchen cabinet fronts', 'off-white']
  },
  materialEdit(set) {
    const [floor, panels, textile] = this.materialSets[set];
    return `Change ONLY these materials: the floor becomes ${floor}; the wood surfaces become ${panels}; the sofa, armchair and cushion upholstery becomes ${textile} fabric. The material change must be clearly visible on the floor, the wall panels / kitchen surfaces and the textiles. Do NOT change the shape, size or position of any furniture.`;
  },
  // Traverten seti: gündüz ve akşam promptlarında aynı cümleler (taş duvar sınırları ve berjer formu sabit)
  traverten: {
    floor: 'Change ONLY these materials: the floor becomes honed travertine stone flooring with large rectangular slabs, and the kitchen cabinet fronts become off-white.',
    wall: 'The wall behind the kitchen counter, from the countertop up to the hidden ceiling cove, is clad in natural travertine stone blocks with straight horizontal joint lines; every other wall stays plain white.',
    furniture: 'The two armchairs keep their exact original shape with exposed solid wood frames and wooden armrests; only their seat and back cushions become off-white fabric. The sofa and the front armchair keep their exact shape; only their upholstery becomes off-white fabric. Do NOT change the shape, size or position of any furniture.'
  },
  travertenEvening: 'Use the FIRST image as the base. Keep its camera, framing, room geometry, windows, furniture shapes, all materials, the travertine floor and especially the travertine stone wall behind the kitchen (its exact block pattern, joint lines and boundaries, including the stone band above the cabinets) EXACTLY as in the first image. Apply ONLY the lighting of the SECOND image: the same warm dusk atmosphere, the blue-hour sky and exterior view through the windows, the warm hidden cove lighting along the ceiling edges washing down over the stone wall, and the two pendant lamps above the dining table at exactly the same positions and sizes as in the second image. Photorealistic. No people, no text.',
  keepDay: 'Keep the camera position, lens, framing, room geometry, windows, furniture shapes and layout EXACTLY the same as the input. The exterior view through the windows (infinity pool, olive trees, hills, sky) must stay pixel-identical to the input. Same soft natural daylight. Photorealistic. No people, no text.',
  eveningBase: 'Change ONLY the lighting and the sky: warm dusk light outside, windows showing a blue-hour sky; interior lights on — warm hidden cove lighting along the ceiling edges and two pendant lamps above the dining table. Keep all materials, furniture, camera, framing, room geometry and the exterior landscape (infinity pool, olive trees, hills) EXACTLY identical to the input. Photorealistic. No people, no text.',
  keepEvening: 'Keep the camera position, lens, framing, room geometry, windows, furniture shapes and layout EXACTLY the same as the input. Keep every light fixture (hidden cove lighting, the pendant lamps) in exactly the same position with the same warm dusk lighting, and keep the exterior view and blue-hour sky identical to the input. Photorealistic. No people, no text.',
  // İlk denemede ön planda ağaçlar kaldı; 3D için yalnızca maket + düz gri zemin gerekli
  maquetteStrict: 'Turn this exact villa into an isolated white matte architectural scale model, including its terraces, steps and the empty pool basin, standing alone on a seamless plain light grey studio background. Remove ALL trees, plants, grass, garden, paving and landscape completely: nothing but the white model and the plain grey background. Same camera angle and building geometry. Soft studio lighting. No text.',
  maquette: 'Convert this exact villa into a white matte architectural scale model of this exact villa on a plain light grey background, no landscape, no pool water, studio lighting. Keep the building geometry and proportions exactly the same. No text.'
};

const TOOLS = dirname(fileURLToPath(import.meta.url));
const OUT = join(TOOLS, 'output', 'studio');
const SPEND_LOG = join(TOOLS, 'output', 'spend-log.json');
mkdirSync(OUT, { recursive: true });

const args = process.argv.slice(2);
const step = args[0];
const opt = (n, d) => { const i = args.indexOf('--' + n); return i > -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const flag = (n) => args.includes('--' + n);
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
  console.log(`\n──────────────────────────────────────────────\nModel   : ${model}\nİş      : ${detail}\nTahmini : ${usd(cost)}\n──────────────────────────────────────────────`);
  if (flag('yes')) return;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const a = (await rl.question('Devam edilsin mi? (e/h) ')).trim().toLowerCase();
  rl.close();
  if (!['e', 'evet', 'y'].includes(a)) { console.log('İptal edildi.'); process.exit(0); }
}
function logSpend(entry) {
  const log = existsSync(SPEND_LOG) ? JSON.parse(readFileSync(SPEND_LOG, 'utf8')) : [];
  log.push({ at: new Date().toISOString(), ...entry });
  writeFileSync(SPEND_LOG, JSON.stringify(log, null, 2));
  console.log(`Harcama kaydı — toplam tahmini ${usd(log.reduce((s, e) => s + (e.estimated_usd || 0), 0))}`);
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
  const res = await fal.subscribe(endpoint, { input, logs: false, onQueueUpdate: (u) => { if (u.status === 'IN_PROGRESS') process.stdout.write(`\r  işleniyor… ${Math.round((Date.now() - t0) / 1000)} sn   `); } });
  process.stdout.write('\n');
  return res;
}
async function upload(fal, src) {
  if (/^https?:\/\//.test(src)) return src;
  const file = existsSync(src) ? src : join(OUT, src);
  if (!existsSync(file)) { console.error('Bulunamadı: ' + src); process.exit(1); }
  return fal.storage.upload(new Blob([readFileSync(file)], { type: 'image/png' }));
}

// IPTC: yapay zekâ ile üretildi (exiftool; yoksa uyarı)
function exiftool() {
  const known = [join(process.env.LOCALAPPDATA || '', 'Programs', 'ExifTool', 'ExifTool.exe'), 'C:\\Program Files\\ExifTool\\ExifTool.exe'];
  for (const b of ['exiftool', ...known.filter((p) => existsSync(p))]) if (spawnSync(b, ['-ver']).status === 0) return b;
  return null;
}
function tagAI(files) {
  const bin = exiftool();
  if (!bin) { console.log('UYARI: exiftool yok → IPTC yazılmadı.'); return; }
  spawnSync(bin, ['-overwrite_original', '-q', '-q', '-api', 'Compact=all', '-xmp:all=',
    '-XMP-iptcExt:DigitalSourceType=http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia', ...files]);
  console.log(`  IPTC trainedAlgorithmicMedia → ${files.length} dosya`);
}
async function save(images, prefix) {
  const files = [];
  for (let i = 0; i < images.length; i++) {
    const f = join(OUT, `${prefix}_${i + 1}.png`);
    const r = await fetch(images[i].url);
    writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    console.log(`  ✓ studio/${prefix}_${i + 1}.png  (${(statSync(f).size / 1024).toFixed(0)} KB)  ${images[i].url}`);
    files.push(f);
  }
  tagAI(files);
  return files;
}
async function edit(fal, src, prompt, n, prefix, label) {
  const url = await upload(fal, src);
  const res = await run(fal, MODELS.edit, { prompt, image_urls: [url], num_images: n, aspect_ratio: '16:9', resolution: '2K', output_format: 'png' });
  await save(res.data.images || [], prefix);
  logSpend({ step: `studio ${label}`, model: MODELS.edit, request_id: res.requestId, count: n, estimated_usd: n * PRICE_IMAGE_2K, urls: (res.data.images || []).map((x) => x.url) });
}

const steps = {
  async wireframe() {
    const n = +opt('count', 2);
    await confirm(MODELS.edit, `${n} tel kafes varyasyonu (render 3), 16:9, 2K`, n * PRICE_IMAGE_2K);
    await edit(await falClient(), RENDER3_URL, PROMPTS.wireframe, n, 'telkafes', 'wireframe');
  },
  async 'room-base'() {
    const n = +opt('count', 2);
    await confirm(MODELS.image, `${n} salon taban görseli, 16:9, 2K`, n * PRICE_IMAGE_2K);
    const fal = await falClient();
    const res = await run(fal, MODELS.image, { prompt: PROMPTS.roomBase, num_images: n, aspect_ratio: '16:9', resolution: '2K', output_format: 'png' });
    await save(res.data.images || [], 'salon_taban');
    logSpend({ step: 'studio room-base', model: MODELS.image, request_id: res.requestId, count: n, estimated_usd: n * PRICE_IMAGE_2K, urls: (res.data.images || []).map((x) => x.url) });
  },
  // Tutarlılık için iki aşama:
  //  1) Taban görselden TEK bir akşam tabanı (yalnızca ışık/gökyüzü; ışık kaynakları burada belirlenir)
  //  2) Gündüz varyantları tabandan, akşam varyantları akşam tabanından (ışık kaynakları 3 sette aynı yerde)
  async 'room-variants'() {
    const base = opt('base');
    if (!base) { console.error('--base salon_taban_N.png (veya URL) gerekli'); process.exit(1); }
    const only = opt('only') ? opt('only').split(',') : null;
    const combos = Object.keys(PROMPTS.materials).flatMap((m) => Object.keys(PROMPTS.light).map((l) => `${m}-${l}`)).filter((k) => !only || only.includes(k));
    const needEveningBase = combos.some((k) => k.endsWith('-aksam')) && !opt('evening-base');
    const count = combos.length + (needEveningBase ? 1 : 0);
    await confirm(MODELS.edit, `${needEveningBase ? '1 akşam tabanı + ' : ''}${combos.length} kombinasyon (${combos.join(', ')}), 16:9, 2K`, count * PRICE_IMAGE_2K);
    const fal = await falClient();
    const baseUrl = await upload(fal, base);
    const day = combos.filter((k) => k.endsWith('-gunduz'));
    const eve = combos.filter((k) => k.endsWith('-aksam'));
    const matOf = (k) => k.slice(0, k.lastIndexOf('-'));
    const jobs = day.map((k) => edit(fal, baseUrl, `${PROMPTS.materialEdit(matOf(k))} ${PROMPTS.keepDay}`, 1, k, `room ${k}`));
    const eveningJob = (async () => {
      if (!eve.length) return;
      let eveUrl = opt('evening-base');
      if (!eveUrl) {
        const res = await run(fal, MODELS.edit, { prompt: PROMPTS.eveningBase, image_urls: [baseUrl], num_images: 1, aspect_ratio: '16:9', resolution: '2K', output_format: 'png' });
        await save(res.data.images, 'salon_aksam_taban');
        eveUrl = res.data.images[0].url;
        logSpend({ step: 'studio room evening-base', model: MODELS.edit, request_id: res.requestId, count: 1, estimated_usd: PRICE_IMAGE_2K, urls: [eveUrl] });
      }
      await Promise.all(eve.map((k) => edit(fal, eveUrl, `${PROMPTS.materialEdit(matOf(k))} ${PROMPTS.keepEvening}`, 1, k, `room ${k}`)));
    })();
    await Promise.all([...jobs, eveningJob]);
  },
  // Traverten setini yeniden üret: taş duvar ve berjer tanımı iki görselde KELİMESİ KELİMESİNE aynı
  async 'room-traverten'() {
    const n = +opt('count', 2);
    const base = opt('base', 'https://v3b.fal.media/files/b/0aac7d9e/4pdAaUQM43sRJktR80i7z_bR8J0oQJ.png');
    const eveBase = opt('evening-base', 'https://v3b.fal.media/files/b/0aac7db7/KmtdHvhRiRo1UEK9zgwdd_mJfrfsoU.png');
    await confirm(MODELS.edit, `traverten gündüz ×${n} (salon tabanından) + traverten akşam ×${n} (akşam tabanından), 16:9, 2K`, 2 * n * PRICE_IMAGE_2K);
    const fal = await falClient();
    const core = `${PROMPTS.traverten.floor} ${PROMPTS.traverten.wall} ${PROMPTS.traverten.furniture}`;
    await Promise.all([
      edit(fal, base, `${core} ${PROMPTS.keepDay}`, n, 'traverten-gunduz-r', 'room traverten-gunduz (yeniden)'),
      edit(fal, eveBase, `${core} ${PROMPTS.keepEvening}`, n, 'traverten-aksam-r', 'room traverten-aksam (yeniden)')
    ]);
  },
  // Traverten akşam: taş deseni gündüz görselinden, ışık kaynakları akşam tabanından (iki görselli edit)
  async 'room-traverten-evening'() {
    const n = +opt('count', 2);
    const day = opt('day', 'https://v3b.fal.media/files/b/0aac7dd3/himpdWgv0BWtJN6x3exqt_l5HOzdHn.png');        // traverten-gunduz-r_1
    const eveBase = opt('evening-base', 'https://v3b.fal.media/files/b/0aac7db7/KmtdHvhRiRo1UEK9zgwdd_mJfrfsoU.png'); // salon_aksam_taban_1
    await confirm(MODELS.edit, `traverten akşam ×${n} (1. görsel: traverten gündüz 1, 2. görsel: akşam tabanı — yalnızca ışık)`, n * PRICE_IMAGE_2K);
    const fal = await falClient();
    const res = await run(fal, MODELS.edit, {
      prompt: PROMPTS.travertenEvening, image_urls: [await upload(fal, day), await upload(fal, eveBase)],
      num_images: n, aspect_ratio: '16:9', resolution: '2K', output_format: 'png'
    });
    await save(res.data.images || [], 'traverten-aksam-t');
    logSpend({ step: 'studio room traverten-aksam (gündüzden türetme)', model: MODELS.edit, request_id: res.requestId, count: n, estimated_usd: n * PRICE_IMAGE_2K, urls: (res.data.images || []).map((x) => x.url) });
  },
  async 'maquette-input'() {
    const strict = flag('strict');
    await confirm(MODELS.edit, `1 beyaz maket görseli (render 3)${strict ? ', sıkı prompt' : ''}, 16:9, 2K`, PRICE_IMAGE_2K);
    await edit(await falClient(), RENDER3_URL, strict ? PROMPTS.maquetteStrict : PROMPTS.maquette, 1, strict ? 'maket_girdi_siki' : 'maket_girdi', 'maquette-input');
  },
  // DENEYSEL: görselden 3D (GLB). Hunyuan 3D v3.1 Pro — mimari gibi sert yüzeylerde geometriyi iyi korur.
  async maquette() {
    const input = opt('input');
    if (!input) { console.error('--input maket_girdi_1.png (veya URL) gerekli'); process.exit(1); }
    await confirm(MODEL_3D, '1 deneme, tek görselden GLB (PBR kapalı, varsayılan yüz sayısı)', PRICE_3D);
    const fal = await falClient();
    const url = await upload(fal, input);
    const res = await run(fal, MODEL_3D, { input_image_url: url, generate_type: 'Normal', enable_pbr: false });
    const glbUrl = res.data.model_glb?.url || res.data.model_urls?.glb?.url;
    const glb = join(OUT, 'maket.glb');
    writeFileSync(glb, Buffer.from(await (await fetch(glbUrl)).arrayBuffer()));
    console.log(`  ✓ studio/maket.glb  (${(statSync(glb).size / 1048576).toFixed(2)} MB)  ${glbUrl}`);
    if (res.data.thumbnail?.url) writeFileSync(join(OUT, 'maket_thumb.png'), Buffer.from(await (await fetch(res.data.thumbnail.url)).arrayBuffer()));
    logSpend({ step: 'studio maquette 3D', model: MODEL_3D, request_id: res.requestId, count: 1, estimated_usd: PRICE_3D, urls: [glbUrl] });
  }
};
if (!steps[step]) { console.log('Kullanım: node generate-studio.mjs <wireframe|room-base|room-variants|maquette-input> [--yes]'); process.exit(step ? 1 : 0); }
steps[step]().catch((e) => { console.error('\nHATA:', e?.body ? JSON.stringify(e.body, null, 2) : e); process.exit(1); });
