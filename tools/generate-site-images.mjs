#!/usr/bin/env node
/* ==========================================================================
   Site görselleri — hizmet, konsept çalışma, atmosfer ve blog kapağı (fal.ai)
   --------------------------------------------------------------------------
     node tools/generate-site-images.mjs list                     # alanlar + durum
     node tools/generate-site-images.mjs gen --only a,b [--n 2]   # aday üret (bütçe kontrollü)
     node tools/generate-site-images.mjs gen --phase 1|2          # 1: metinden, 2: referanslı (konsept devamı)
     node tools/generate-site-images.mjs sheet                    # adayları yan yana inceleme sayfaları
     node tools/generate-site-images.mjs build                    # SECIM → assets/img (AVIF+WebP, 1600/960/480, IPTC)
     node tools/generate-site-images.mjs og                       # 1200×630 paylaşım görseli (logo + villa, yerel)

   Adaylar: tools/output/gorseller/<alan>_<n>.png (elenenler burada kalır, siteye girmez).
   Bütçe: bu görev için tavan BUDGET_USD; her çağrıdan önce kontrol, her çağrıdan sonra
   tools/output/gorseller/butce.json'a yazılır. Anahtar: tools/.env → FAL_KEY.
   ========================================================================== */
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const MODELS = { image: 'fal-ai/nano-banana-pro', edit: 'fal-ai/nano-banana-pro/edit' };
const PRICE = 0.15;            // fal.ai fiyat API'si (2026-10): her iki uç nokta $0.15/görsel (2K)
const BUDGET_USD = 12;
const TOOLS = dirname(fileURLToPath(import.meta.url));
const ROOT = join(TOOLS, '..');
const OUT = join(TOOLS, 'output', 'gorseller');
const LEDGER = join(OUT, 'butce.json');
const WIDTHS = [1600, 960, 480];
mkdirSync(OUT, { recursive: true });

const STYLE = 'Photorealistic architectural photograph, calm and realistic, natural daylight, neutral earthy palette (warm white, travertine beige, sand, oak) with at most small cool accents in deep petrol teal. Straight verticals, eye-level camera, 24-35mm lens. Context: Thrace / Marmara coast of Turkey (gentle rolling hills, olive and pine trees). Strictly NO text, letters, numbers, logos, signage or watermark anywhere. No recognizable real building or brand. No people, or at most a tiny distant blurred silhouette; never a visible face. No HDR, no neon, no fantasy elements. Windows, stairs, railings and roofs must be geometrically correct and physically plausible.';
const SAFETY = 'Any construction worker wears a white hard hat and a high-visibility vest; scaffolding has complete guardrails, mid-rails and toe boards.';
const KEEP = 'Use the reference image ONLY to keep the same building: identical architecture, materials, colors, window design and style. ';

// Alanlar: id → { prompt, ar, ref? (başka alanın seçilen adayı) }
const AREAS = {
  // --- Hizmet ana görselleri
  'mimari-proje': { ar: '4:3', prompt: 'Architectural visualization of a contemporary single-storey courtyard villa on a gentle hillside: long low volume with natural stone walls and white plaster, deep timber-lined roof overhang, full-height glazing with slim dark frames, landscaped courtyard with an olive tree and gravel, late afternoon sun.' },
  'ic-mimari': { ar: '4:3', prompt: 'Interior design visualization of a villa living room: honed travertine floor, oak built-in shelving, low linen sofa, one deep petrol-teal velvet armchair as the only accent, large window with sheer curtains, soft daylight, uncluttered.' },
  'uygulama': { ar: '4:3', prompt: `Construction site of a two-storey reinforced concrete villa frame in the countryside: columns and slabs finished, brick infill partly started, steel scaffolding along one side, rebar neatly stored on timber, clean organized site, two tiny distant workers. Clear morning light. ${SAFETY}` },
  'santiye-teknik-hizmetler': { ar: '4:3', prompt: 'Site inspection still life on a construction site: on a sturdy timber site table an open set of architectural drawings showing only lines and hatching, a white hard hat, a steel tape measure and a tablet with a blank dark screen; behind it, softly out of focus, the concrete frame of a building with scaffolding that has full guardrails. No people.' },
  'ruhsat-iskan': { ar: '4:3', prompt: 'Neatly organized architectural drawing sets on a light oak desk: folded large-format plans and sections in plain folders, a scale ruler, a pencil and a small white study model of a house; drawings show only lines and hatching, no readable text, no stamps. Soft daylight from a side window.' },
  'mimari-danismanlik': { ar: '4:3', prompt: 'Top-down view of a large zoning plan drawing spread on a travertine table: parcels in muted sand, sage and grey tones, road network lines, a scale ruler, a pencil and a sheet of tracing paper with a few sketched lines. Absolutely no text, numbers or labels on the drawing. Soft daylight.' },
  'enerji-kimlik-belgesi': { ar: '4:3', prompt: 'Contemporary four-storey residential apartment building with external thermal insulation and light render, triple-glazed windows with slim frames, rooftop solar panels, balconies with glass railings, small landscaped front garden. Clear daylight.' },
  'bina-akustigi': { ar: '4:3', prompt: 'Interior of a multipurpose hall with vertical oak slat acoustic wall panels, suspended felt acoustic ceiling baffles in warm grey with a few in deep petrol teal, oak floor, rows of simple wooden chairs, soft daylight from high windows. No people.' },
  'bilirkisilik': { ar: '4:3', prompt: 'Street view of an older five-storey apartment building facade in a Thrace town showing hairline cracks in the render and moisture stains near the base, a tiny distant blurred silhouette of an inspector holding a clipboard on the sidewalk. Soft overcast daylight.' },
  // --- Ara görseller (hizmet sayfası kartları)
  'ara-konut-apartman': { ar: '4:3', prompt: 'Architectural visualization of a contemporary five-storey residential apartment building in a Thrace town: light stone and white facade, recessed balconies with timber soffits, ground-floor entrance with planting, street trees, soft afternoon light.' },
  'ara-ofis': { ar: '4:3', prompt: 'Interior of a modern small office: oak meeting table, wall panels in warm grey felt, plants, large windows, a travertine reception counter, two deep petrol-teal accent chairs; monitors switched off. No people.' },
  'ara-konut-santiye': { ar: '4:3', prompt: `Five-storey residential building under construction: facade insulation boards and new window frames being installed, full steel scaffolding with safety netting, one tiny distant worker. Daylight. ${SAFETY}` },
  'ara-villa-saha': { ar: '4:3', prompt: `Villa construction site: a reinforced concrete slab with carefully placed rebar, spacers and timber formwork before pouring, a white hard hat and a tape measure resting on the formwork edge, perimeter scaffolding, one distant blurred worker. Morning light. ${SAFETY}` },
  'ara-iskan': { ar: '4:3', prompt: 'Newly completed two-storey detached house just before occupancy: finished light plaster facade with stone base, clean site, freshly planted garden and young trees, closed garden gate. No people. Soft daylight.' },
  'ara-arsa': { ar: '4:3', prompt: 'Aerial drone view of the edge of a small coastal town in Thrace by the Sea of Marmara: empty land parcels divided by dirt roads, a few new low-rise houses, farmland and the calm sea in the distance. Soft late afternoon light.' },
  'ara-isi-yalitimi': { ar: '4:3', prompt: `Close view of external thermal insulation being applied to a residential facade: white EPS insulation boards fixed with plastic anchors, fibreglass mesh and base coat partly applied, the edge of a scaffold with guardrails in the foreground. Daylight. No people. ${SAFETY}` },
  'ara-toplanti': { ar: '4:3', prompt: 'Modern meeting room with acoustic ceiling panels and fabric-wrapped wall panels in warm grey, oak meeting table with chairs, glass partition, daylight; screens switched off. No people.' },
  'ara-catlak-nem': { ar: '4:3', prompt: 'Close-up of a single hand holding a pin-type moisture meter with a blank display against an interior plaster wall that has a fine diagonal crack and faint damp staining near the skirting; only the hand and forearm visible. Soft daylight.' },
  // --- Atmosfer ve blog
  'kurumsal-atmosfer': { ar: '21:9', prompt: 'Wide calm view of a work table with architectural material samples: travertine, oak and stone tiles, a deep petrol-teal fabric swatch, a white study model of a villa and rolled drawings without readable text, soft daylight from large windows. No people.' },
  'calisma-atmosfer': { ar: '21:9', prompt: 'Wide panoramic view of the rolling countryside near Silivri at late afternoon: a finished contemporary house among olive trees and fields, the Sea of Marmara faintly on the horizon. Calm and natural.' },
  'blog-kapak': { ar: '16:9', prompt: 'Architectural detail of a contemporary house facade: honed travertine cladding meeting vertical oak slats and a slim dark window frame, soft shadows of an olive tree on the wall, afternoon light.' },
  // --- Prefabrik Yapılar
  'prefabrik-ev': { ar: '4:3', prompt: 'Modern single-storey prefabricated house with a simple rectangular volume, light timber-look and off-white facade panels, flat roof with slim fascia, large windows, small timber deck, set in a garden with lawn, young olive trees and lavender in the Thrace countryside of Turkey, gentle rolling hills behind. Realistic architectural photograph, soft afternoon daylight.' },
  'prefabrik-montaj': { ar: '4:3', prompt: `Prefabricated house under assembly on a finished reinforced concrete raft foundation: a mobile crane lifting a large prefabricated wall panel into place with tag lines, several panels already standing, a small team far away in the background wearing white hard hats and high-visibility vests, clean organized site in the countryside. Daylight. ${SAFETY}` },
  // --- Konsept çalışmalar (dış görsel metinden; diğerleri seçilen dış görsele referansla)
  'k-villa-dis': { ar: '4:3', prompt: 'Two-storey contemporary villa in the countryside near the Marmara coast: white render and warm travertine cladding, flat roofs with thin overhangs, large glazing with slim dark bronze frames, covered terrace, garden with olive trees, lavender and a gravel path. Late afternoon sun, clear sky.' },
  'k-villa-teras': { ar: '4:3', ref: 'k-villa-dis', prompt: KEEP + 'Show the garden side of this same villa: a rectangular swimming pool with travertine coping, a shaded terrace with a simple pergola, outdoor lounge furniture in neutral fabrics, olive trees, view to gentle hills. Same light and season.' },
  'k-villa-ic': { ar: '4:3', ref: 'k-villa-dis', prompt: KEEP + 'Show the interior of this same villa: double-height living room, oak floor, a travertine accent wall, linen sofa, large windows looking to the garden and pool. Soft natural daylight.' },
  'k-ev-dis': { ar: '4:3', prompt: 'Detached two-storey family house with a pitched clay-tile roof, light plaster facade on a natural stone base, timber shutters in muted grey-green, generous front garden with lawn, fruit trees and a low stone wall, at the quiet edge of a Thrace village. Morning light.' },
  'k-ev-bahce': { ar: '4:3', ref: 'k-ev-dis', prompt: KEEP + 'Show the back garden of this same house: a stone-paved patio with a simple wooden dining table, a timber pergola with vines, vegetable beds and fruit trees.' },
  'k-ev-ic': { ar: '4:3', ref: 'k-ev-dis', prompt: KEEP + 'Show the interior of this same house: bright family kitchen and dining space, oak cabinets, light stone countertop, wooden dining table, window looking to the garden.' },
  'k-yazlik-dis': { ar: '4:3', prompt: 'Low-rise summer house terraced into a gentle slope above the Sea of Marmara: white walls, timber louvers, flat green roof, wide glazed openings facing the sea, olive, rosemary and pine planting. Calm sea, soft afternoon light.' },
  'k-yazlik-teras': { ar: '4:3', ref: 'k-yazlik-dis', prompt: KEEP + 'Show the sea-facing terrace of this same summer house: timber deck, built-in bench, simple outdoor table, view over the calm Sea of Marmara, low planting.' },
  'k-yazlik-ic': { ar: '4:3', ref: 'k-yazlik-dis', prompt: KEEP + 'Show the interior of this same summer house: bright living room opening to the terrace through sliding glass doors, sea view, light oak floor, natural linen fabrics.' },
  'k-tadilat-once': { ar: '4:3', prompt: 'Interior of an older Istanbul apartment before renovation: dated living room with worn parquet, an old panel radiator under the window, outdated patterned wallpaper, plaster ceiling cornice, a dated small kitchen visible through an open doorway, almost empty, daylight from one window. Realistic, tired but clean.' },
  'k-tadilat-sonra': { ar: '4:3', ref: 'k-tadilat-once', prompt: 'The SAME room after a complete renovation. Keep exactly the camera position, room proportions, window position and the doorway location. New light oak floor, smooth white walls, the doorway widened into an opening to a new minimalist kitchen with oak and white fronts, built-in storage, simple contemporary furniture with linen fabrics, soft daylight.' },
  'k-tadilat-detay': { ar: '4:3', ref: 'k-tadilat-sonra', prompt: KEEP + 'Closer view of the renovated kitchen corner of this same apartment: oak cabinets, light stone countertop, integrated appliances, a simple pendant light, natural daylight.' },
  'k-ticari-dis': { ar: '4:3', prompt: 'Small two-storey commercial building on a quiet town street corner in Thrace: ground floor with large blank shop windows (no signage), upper-floor office with vertical timber louvers, light stone and dark metal facade, a few street trees, clean sidewalk. Soft overcast daylight.' },
  'k-ticari-giris': { ar: '4:3', ref: 'k-ticari-dis', prompt: KEEP + 'Show the entrance forecourt of this same building: wide glass entrance door with a slim dark metal frame, planters, a bench, paved forecourt; no signage.' },
  'k-ticari-ic': { ar: '4:3', ref: 'k-ticari-dis', prompt: KEEP + 'Show the ground-floor interior of this same building: bright showroom with polished concrete floor, oak shelving with a few plain objects, white walls, large windows to the street.' }
};

// Seçimler: alan → aday numarası (inceleme sonrası doldurulur) ve sitedeki dosya adı + alt metin
const SELECT = existsSync(join(OUT, 'secim.json')) ? JSON.parse(readFileSync(join(OUT, 'secim.json'), 'utf8')) : {};

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (n, d) => { const i = args.indexOf('--' + n); return i > -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const usd = (n) => '$' + n.toFixed(2);
const ledger = () => (existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : []);
const spent = () => ledger().reduce((s, e) => s + e.usd, 0);

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
function tagAI(files, type = 'trainedAlgorithmicMedia') {
  const bin = exiftool();
  if (!bin) throw new Error('exiftool yok → IPTC yazılamaz');
  const r = spawnSync(bin, ['-overwrite_original', '-q', '-q', '-api', 'Compact=all', '-xmp:all=',
    `-XMP-iptcExt:DigitalSourceType=http://cv.iptc.org/newscodes/digitalsourcetype/${type}`, ...files]);
  if (r.status !== 0) throw new Error('exiftool: ' + r.stderr);
}
const candidate = (id, n) => join(OUT, `${id}_${n}.png`);
const chosenPath = (id) => (SELECT[id] ? candidate(id, SELECT[id].aday) : null);

async function gen() {
  loadEnv();
  if (!process.env.FAL_KEY) { console.error('FAL_KEY bulunamadı (tools/.env).'); process.exit(1); }
  const { fal } = await import('@fal-ai/client');
  fal.config({ credentials: process.env.FAL_KEY });
  const n = +opt('n', 2);
  const phase = opt('phase');
  let ids = opt('only') ? opt('only').split(',') : Object.keys(AREAS).filter((id) => (phase === '2' ? AREAS[id].ref : !AREAS[id].ref));
  if (!opt('only') && !args.includes('--force')) ids = ids.filter((id) => !existsSync(candidate(id, 1)));
  for (const id of ids) if (!AREAS[id]) { console.error('Bilinmeyen alan: ' + id); process.exit(1); }
  const cost = ids.length * n * PRICE;
  console.log(`${ids.length} alan × ${n} aday = ${usd(cost)}  (harcanan ${usd(spent())}, tavan ${usd(BUDGET_USD)})`);
  if (spent() + cost > BUDGET_USD + 1e-9) { console.error('DUR: bütçe tavanı aşılır.'); process.exit(2); }
  const queue = [...ids];
  const worker = async () => {
    while (queue.length) {
      const id = queue.shift();
      const a = AREAS[id];
      // Yeniden üretimde mevcut adayların üzerine yazma: sıradaki numaradan devam
      let start = 1; while (existsSync(candidate(id, start))) start++;
      if (spent() + n * PRICE > BUDGET_USD + 1e-9) { console.error(`DUR: ${id} için bütçe kalmadı.`); return; }
      const input = { prompt: `${a.prompt} ${STYLE}`, num_images: n, aspect_ratio: a.ar, resolution: '2K', output_format: 'png' };
      let endpoint = MODELS.image;
      if (a.ref) {
        const refFile = chosenPath(a.ref);
        if (!refFile || !existsSync(refFile)) { console.error(`  ${id}: önce ${a.ref} seçilmeli (secim.json)`); continue; }
        input.image_urls = [await fal.storage.upload(new Blob([readFileSync(refFile)], { type: 'image/png' }))];
        endpoint = MODELS.edit;
      }
      try {
        const res = await fal.subscribe(endpoint, { input, logs: false });
        const imgs = res.data.images || [];
        const files = [];
        for (let i = 0; i < imgs.length; i++) {
          const f = candidate(id, start + i);
          writeFileSync(f, Buffer.from(await (await fetch(imgs[i].url)).arrayBuffer()));
          files.push(f);
        }
        if (files.length) tagAI(files);
        const log = ledger(); log.push({ at: new Date().toISOString(), id, endpoint, count: imgs.length, usd: imgs.length * PRICE, request_id: res.requestId });
        writeFileSync(LEDGER, JSON.stringify(log, null, 2));
        console.log(`  ✓ ${id}: ${files.map((f) => f.split(/[\\/]/).pop()).join(', ')}   toplam ${usd(spent())}`);
      } catch (e) {
        console.error(`  ✗ ${id}:`, e?.body ? JSON.stringify(e.body) : e.message);
      }
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  console.log(`Bu görevde harcanan toplam: ${usd(spent())}`);
}

// İnceleme: her alan için adaylar yan yana (etiketli) → output/gorseller/inceleme/<alan>.jpg
async function sheet() {
  const sharp = (await import('sharp')).default;
  const dir = join(OUT, 'inceleme'); mkdirSync(dir, { recursive: true });
  const ids = opt('only') ? opt('only').split(',') : Object.keys(AREAS);
  for (const id of ids) {
    const c = []; for (let i = 1; existsSync(candidate(id, i)); i++) c.push(candidate(id, i));
    if (!c.length) continue;
    const W = 900;
    const tiles = await Promise.all(c.map(async (f) => sharp(f).resize({ width: W }).jpeg({ quality: 82 }).toBuffer({ resolveWithObject: true })));
    const H = Math.max(...tiles.map((t) => t.info.height));
    const out = sharp({ create: { width: W * tiles.length + 20 * (tiles.length - 1), height: H, channels: 3, background: '#ffffff' } })
      .composite(tiles.map((t, i) => ({ input: t.data, left: i * (W + 20), top: 0 })));
    await out.jpeg({ quality: 80 }).toFile(join(dir, `${id}.jpg`));
  }
  console.log('✓ inceleme sayfaları: tools/output/gorseller/inceleme/');
}

// Yayın: secim.json → assets/img/<dosya>-{1600,960,480}.{avif,webp} + IPTC
async function build() {
  const sharp = (await import('sharp')).default;
  const made = [];
  const only = opt('only') ? opt('only').split(',') : null;
  for (const [id, s] of Object.entries(SELECT)) {
    if (only && !only.includes(id)) continue;
    let src = candidate(id, s.aday);
    if (!existsSync(src)) { console.error('Yok: ' + src); process.exit(1); }
    // Rötuş: cetvel/kalem üzerindeki küçük rakam ve yazılar → yalnızca çokgen içinde hafif bulanıklaştırma
    if (s.rotus) {
      const { width, height } = await sharp(src).metadata();
      const polys = s.rotus.map((r) => `<polygon points="${r.poly.map((p) => p.join(',')).join(' ')}" fill="#fff"/>`).join('');
      const mask = await sharp(Buffer.from(`<svg width="${width}" height="${height}"><rect width="100%" height="100%" fill="#000"/>${polys}</svg>`)).blur(2).extractChannel(0).toBuffer();
      const blurred = await sharp(src).removeAlpha().blur(s.rotus[0].sigma || 3).joinChannel(mask).png().toBuffer();
      src = await sharp(src).removeAlpha().composite([{ input: blurred }]).png().toBuffer();
    }
    for (const target of [].concat(s.dosya)) {
      const base = join(ROOT, 'assets', 'img', target);
      mkdirSync(dirname(base), { recursive: true });
      const [rw, rh] = AREAS[id].ar.split(':').map(Number);
      for (const w of WIDTHS) {
        const h = Math.round((w * rh) / rw);
        const img = sharp(src).resize(w, h, { fit: 'cover' });
        await img.clone().avif({ quality: 50, effort: 6 }).toFile(`${base}-${w}.avif`);
        await img.clone().webp({ quality: 70, effort: 6 }).toFile(`${base}-${w}.webp`);
        made.push(`${base}-${w}.avif`, `${base}-${w}.webp`);
      }
    }
  }
  tagAI(made);
  const kb = made.reduce((t, f) => t + statSync(f).size, 0) / 1024;
  console.log(`✓ ${made.length} dosya (${kb.toFixed(0)} KB), IPTC trainedAlgorithmicMedia yazıldı`);
}

// OG: 1200×630, mevcut villa render'ı (yapay zekâ) + logo → composite
async function og() {
  const sharp = (await import('sharp')).default;
  const villa = join(ROOT, 'assets', 'img', 'hero-villa.webp');
  const logo = readFileSync(join(ROOT, 'assets', 'img', 'sibelaydinlogo-yatay-white.svg'));
  const shade = Buffer.from('<svg width="1200" height="630"><defs><linearGradient id="g" x1="0" y1="0" x2=".8" y2=".9"><stop offset="0" stop-color="#101416" stop-opacity=".62"/><stop offset=".45" stop-color="#101416" stop-opacity=".12"/><stop offset="1" stop-color="#101416" stop-opacity="0"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/></svg>');
  const logoPng = await sharp(logo, { density: 600 }).resize({ width: 420 }).png().toBuffer();
  const meta = await sharp(logoPng).metadata();
  const out = join(ROOT, 'assets', 'img', 'og-paylasim.jpg');
  await sharp(villa).resize(1200, 630, { fit: 'cover', position: 'centre' })
    .composite([{ input: shade }, { input: logoPng, left: 64, top: 56 }])
    .jpeg({ quality: 82, mozjpeg: true }).toFile(out);
  tagAI([out], 'compositeWithTrainedAlgorithmicMedia');
  console.log(`✓ assets/img/og-paylasim.jpg (${(statSync(out).size / 1024).toFixed(0)} KB)`);
}

function list() {
  for (const [id, a] of Object.entries(AREAS)) {
    let c = 0; while (existsSync(candidate(id, c + 1))) c++;
    console.log(`${id.padEnd(26)} ${a.ar.padEnd(5)} aday:${c} seçim:${SELECT[id]?.aday ?? '-'}${a.ref ? '  ← ' + a.ref : ''}`);
  }
  console.log(`harcanan: ${usd(spent())} / ${usd(BUDGET_USD)}`);
}

const cmds = { gen, sheet, build, og, list };
if (!cmds[cmd]) { console.log('Kullanım: node tools/generate-site-images.mjs <list|gen|sheet|build|og>'); process.exit(cmd ? 1 : 0); }
Promise.resolve(cmds[cmd]()).catch((e) => { console.error('HATA:', e); process.exit(1); });
