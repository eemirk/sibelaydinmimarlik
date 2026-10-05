// Belgeler: tek kaynak (kimdir sayfası ızgarası, hizmet sayfalarındaki "Yetki belgemiz" kartı, make-service-page).
// Görseller tools/process-belgeler.mjs ile üretilir: /assets/img/belgeler/<slug>-{800,1600}.{avif,webp}
// Kişisel veriler (T.C. kimlik no, imzalar, QR) görsellerde opak kutuyla kapatılmıştır.
export const BELGE_DIR = '/assets/img/belgeler/';
export const KIMDIR_BELGELER = '/kurumsal/sibel-aydin-isikondes/#belgeler';

// Sıra = kimdir sayfasındaki sıra
export const BELGELER = [
  {
    slug: 'mimarlar-odasi-buro-tescil-belgesi-2026', en: 1600, boy: 2263,
    baslik: 'Mimarlar Odası Büro Tescil Belgesi',
    kurum: 'TMMOB Mimarlar Odası', detay: 'Büro tescil no 34-7639 · 2026',
    alt: "TMMOB Mimarlar Odası Serbest Mimarlık Hizmetleri Büro Tescil Belgesi 2026: Sibel Aydın Işıköndeş, oda sicil no 46515, büro tescil no 34-7639 (T.C. kimlik no, QR kod ve imzalar kapatılmış)",
    yetki: "Büromuz, TMMOB Mimarlar Odası'na serbest mimarlık hizmetleri bürosu olarak tescillidir. Kurucumuz Mimar Sibel Aydın Işıköndeş'in Mimarlar Odası sicil numarası 46515'tir."
  },
  {
    slug: 'd1-temel-bina-akustigi-sertifikasi', en: 1600, boy: 1102,
    baslik: 'D1 Temel Bina Akustiği Sertifikası',
    kurum: 'TMMOB Fizik Mühendisleri Odası', detay: 'Belge no 666 · 27.04.2022',
    alt: 'TMMOB Fizik Mühendisleri Odası Başarı Belgesi: Sibel Aydın Işıköndeş, D1 Temel Bina Akustiği sertifikası, belge no 666 (T.C. kimlik no ve imza kapatılmış)',
    yetki: "Mimar Sibel Aydın Işıköndeş, Binaların Gürültüye Karşı Korunması Hakkında Yönetmelik kapsamında Fizik Mühendisleri Odası'nın eğitimini tamamlayıp sınavı başararak D1 Temel Bina Akustiği sertifikası almıştır."
  },
  {
    slug: 'kamulastirma-bilirkisiligi-yetki-belgesi', en: 1600, boy: 1031,
    baslik: 'Kamulaştırma Bilirkişiliği Yetki Belgesi',
    kurum: 'TMMOB Mimarlar Odası SMGM', detay: 'Belge no 00.SM.S.2016.0000047 · 14.10.2016',
    alt: 'TMMOB Mimarlar Odası Sürekli Mesleki Gelişim Merkezi yetki belgesi: Sibel Aydın (46515), Kamulaştırma Bilirkişiliği (imza kapatılmış)',
    yetki: "Mimar Sibel Aydın Işıköndeş, TMMOB Mimarlar Odası Sürekli Mesleki Gelişim Merkezi'nin kamulaştırma bilirkişiliği eğitimini tamamlayıp sınavı başararak yetki belgesi almıştır."
  },
  {
    slug: 'marka-tescil-belgesi', en: 1600, boy: 2425,
    baslik: 'Marka Tescil Belgesi',
    kurum: 'Türk Patent ve Marka Kurumu', detay: 'Tescil no 2020 123274 · 25.06.2021',
    alt: 'Türk Patent ve Marka Kurumu Marka Tescil Belgesi: Sibel Aydın İnşaat & Mimarlık logosu, marka no 2020 123274, sınıf 37 ve 42 (imza kapatılmış)'
  }
];
export const belge = (slug) => {
  const b = BELGELER.find((x) => x.slug === slug);
  if (!b) throw new Error('belge yok: ' + slug);
  return b;
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => esc(s).replace(/"/g, '&quot;');
const ARROW = '<svg class="i-arrow" aria-hidden="true"><use href="#i-arrow-r"/></svg>';

// Küçük görsel (800/1600 srcset). Bağlantı JS yoksa 1600'lük görseli açar; JS ile lightbox (main.js initDocs).
export function belgeLink(b, { sizes, group = '', cls = 'doc-card__link', inner = '' }) {
  const base = BELGE_DIR + b.slug;
  const set = (ext) => `${base}-800.${ext} 800w, ${base}-1600.${ext} 1600w`;
  return `<a class="${cls}" href="${base}-1600.webp" data-doc="${base}" data-doc-w="${b.en}" data-doc-h="${b.boy}" data-doc-title="${attr(b.baslik)}" data-doc-meta="${attr(b.kurum + ' · ' + b.detay)}"${group ? ` data-doc-group="${group}"` : ''} aria-haspopup="dialog">` +
    `<span class="doc-card__frame"><picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><img src="${base}-800.webp" srcset="${set('webp')}" sizes="${sizes}" width="800" height="${Math.round(b.boy / 2)}" loading="lazy" decoding="async" alt="${attr(b.alt)}"></picture></span>${inner}</a>`;
}

// Kimdir sayfası kart ızgarası
export function belgeGrid(indent = '      ') {
  return `${indent}<ul class="docs" role="list">\n` + BELGELER.map((b) => `${indent}  <li class="doc-card reveal">
${indent}    ${belgeLink(b, { sizes: '(min-width: 1100px) 300px, (min-width: 700px) 45vw, 92vw', group: 'belgeler', inner: `<span class="doc-card__title">${esc(b.baslik)}</span><span class="doc-card__meta">${esc(b.kurum)}<br>${esc(b.detay)}</span>` })}
${indent}  </li>`).join('\n') + `\n${indent}</ul>`;
}

// Hizmet sayfası "Yetki belgemiz" bölümü
export function yetkiKarti(slug) {
  const b = belge(slug);
  return `  <!-- YETKİ BELGEMİZ (tools/content/belgeler.mjs) -->
  <section class="section section--tight" aria-labelledby="yetki-baslik">
    <div class="container">
      <div class="auth-card reveal">
        ${belgeLink(b, { sizes: '(min-width: 700px) 220px, 40vw', cls: 'auth-card__thumb', inner: '<span class="sr-only">Belgeyi büyütün</span>' })}
        <div class="auth-card__body">
          <p class="eyebrow">Yetki belgemiz</p>
          <h2 id="yetki-baslik" class="auth-card__title">${esc(b.baslik)}</h2>
          <p>${esc(b.yetki)}</p>
          <p class="auth-card__meta">${esc(b.kurum)} · ${esc(b.detay)}</p>
          <a class="link-arrow" href="${KIMDIR_BELGELER}">Tüm belgelerimizi görün${ARROW}</a>
        </div>
      </div>
    </div>
  </section>
`;
}
