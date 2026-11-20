#!/usr/bin/env node
// Canlı için güncelleme paketi: yalnızca değişen ve yeni dosyalar (public_html köküne göre).
//
//   node tools/make-dist.mjs                       (önce yayın klasörünü üret)
//   node tools/make-update-zip.mjs [çıktı.zip] [--taban=dist/sibelaydinmimarlik-canli.zip]
//
// Taban: canlıya en son yüklenen TAM paket (varsayılan dist/sibelaydinmimarlik-canli.zip).
// dist/site ile taban ZIP içerik hash'iyle karşılaştırılır; yeni + değişen dosyalar paketlenir,
// tabanda olup artık olmayanlar "canlıda silinebilir" olarak listelenir. config.local.php, .env,
// tools/, PDF ve form verisi pakete giremez (girerse durur).
import { readdirSync, statSync, readFileSync, mkdirSync, rmSync, cpSync, existsSync, mkdtempSync } from 'node:fs';
import { join, dirname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NEW = join(ROOT, 'dist', 'site');
const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').split('=')[1];
const OUTZIP = join(ROOT, 'dist', process.argv.slice(2).find((a) => !a.startsWith('--')) || 'guncelleme.zip');
const BASE = resolve(ROOT, arg('taban') || 'dist/sibelaydinmimarlik-canli.zip');
const TAR = process.platform === 'win32' ? join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
if (!existsSync(NEW)) { console.error('dist/site yok: önce node tools/make-dist.mjs'); process.exit(1); }
if (!existsSync(BASE)) { console.error('Taban ZIP yok: ' + BASE); process.exit(1); }

const work = mkdtempSync(join(tmpdir(), 'sa-guncelleme-'));
const OLD = join(work, 'taban'), STAGE = join(work, 'paket');
mkdirSync(OLD); mkdirSync(STAGE);
if (spawnSync(TAR, ['-xf', BASE], { cwd: OLD }).status !== 0) { console.error('Taban ZIP açılamadı'); process.exit(1); }
const walk = (d, base = d, out = {}) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p, base, out);
    else out[p.slice(base.length + 1).split(sep).join('/')] = createHash('sha256').update(readFileSync(p)).digest('hex');
  }
  return out;
};
const a = walk(OLD), b = walk(NEW);
const added = Object.keys(b).filter((k) => !(k in a)).sort();
const changed = Object.keys(b).filter((k) => k in a && a[k] !== b[k]).sort();
const removed = Object.keys(a).filter((k) => !(k in b)).sort();
const bad = [...added, ...changed].filter((k) => /config\.local|(^|\/)\.env|private_data|(^|\/)_data\/|talepler|(^|\/)logs\/|\.pdf$|^tools\//i.test(k));
if (bad.length) { console.error('Pakete girmemeli: ' + bad.join(', ')); process.exit(1); }
for (const k of [...added, ...changed]) { mkdirSync(dirname(join(STAGE, k)), { recursive: true }); cpSync(join(NEW, k), join(STAGE, k)); }
if (existsSync(OUTZIP)) rmSync(OUTZIP);
if (!added.length && !changed.length) { console.log('Değişen dosya yok; paket üretilmedi.'); process.exit(0); }
const r = spawnSync(TAR, ['-a', '-c', '-f', OUTZIP, ...readdirSync(STAGE)], { cwd: STAGE });
rmSync(work, { recursive: true, force: true });
if (r.status !== 0) { console.error('ZIP oluşturulamadı'); process.exit(1); }
console.log(`✓ ${OUTZIP.slice(ROOT.length + 1)}  (${(statSync(OUTZIP).size / 1024).toFixed(0)} KB) · yeni ${added.length} · değişen ${changed.length}`);
console.log('YENİ:\n  ' + (added.join('\n  ') || '-'));
console.log('DEĞİŞEN:\n  ' + (changed.join('\n  ') || '-'));
console.log('CANLIDA SİLİNEBİLİR:\n  ' + (removed.join('\n  ') || '-'));
