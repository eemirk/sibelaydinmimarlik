// Hizmet sayfası üretici: tools/content/<slug>.mjs → hizmetler/<slug>/index.html
// Mimari Proje / İç Mimari sayfalarıyla AYNI yapı ve bileşenler. Metin içerik dosyasında
// tek kaynaktadır; SSS hem HTML'e hem FAQPage JSON-LD'ye aynı veriden yazılır.
//
//   node tools/make-service-page.mjs 3d-gorsellestirme
//   node tools/sync-partials.mjs          (header/footer'ı doldurur)
//
// og:title / og:description {{title}} / {{description}} yer tutucularıyla yazılır;
// make-dist.mjs derlemede <title> ve meta description ile doldurur.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
if (!slug) { console.error('Kullanım: node tools/make-service-page.mjs <slug>'); process.exit(1); }
const c = (await import(pathToFileURL(join(ROOT, 'tools', 'content', `${slug}.mjs`)).href)).default;

const SITE = 'https://www.sibelaydinmimarlik.com.tr';
const URL = `${SITE}/hizmetler/${slug}/`;
const WA = 'https://wa.me/905368475640';
const APPT = WA + '?text=' + encodeURIComponent('Merhaba, Sibel Aydın Mimarlık ile görüşme randevusu almak istiyorum. Uygun olduğum gün ve saat: ');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => esc(s).replace(/"/g, '&quot;');
const arrow = '<span class="btn__arrow" aria-hidden="true"><svg><use href="#i-arrow-ne"/></svg></span>';
const linkArrow = '<svg class="i-arrow" aria-hidden="true"><use href="#i-arrow-r"/></svg>';
const apptBtn = (cls, cta) => `<a class="btn ${cls} btn--wa" href="${APPT}" target="_blank" rel="noopener" aria-label="WhatsApp üzerinden randevu alın" data-appointment data-cta="${cta}"><svg class="icon" aria-hidden="true"><use href="#i-wa"/></svg>Randevu Alın${arrow}</a>`;
const ind = (s, n) => s.split('\n').map((l) => (l ? ' '.repeat(n) + l : l)).join('\n');

const ld = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Service', '@id': `${URL}#hizmet`,
      name: c.service.name, serviceType: c.service.type, url: URL, description: c.service.description,
      provider: { '@type': 'ProfessionalService', '@id': `${SITE}/#firma`, name: 'Sibel Aydın Mimarlık', url: `${SITE}/` },
      areaServed: [
        ...(c.service.cities || []).map((n) => ({ '@type': 'City', name: n })),
        { '@type': 'AdministrativeArea', name: 'İstanbul' }, { '@type': 'AdministrativeArea', name: 'Tekirdağ' }
      ]
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Hizmetler', item: `${SITE}/hizmetler/` },
        { '@type': 'ListItem', position: 3, name: c.breadcrumb, item: URL }
      ]
    },
    { '@type': 'FAQPage', mainEntity: c.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
  ]
};

const imgComment = [
  `    ${c.hero.img.padEnd(46)} (hero, 4:3 — ana sayfadaki kartla aynı dosya)`,
  ...c.types.cards.map((k) => `    ${k.img.padEnd(46)} (kart, 4:3)`)
].join('\n');

const html = `<!doctype html>
<!--
  HİZMET SAYFASI: ${c.breadcrumb} — tools/make-service-page.mjs ile tools/content/${slug}.mjs'den üretildi.
  Metni içerik dosyasında değiştirip yeniden üretin; sonra: node tools/sync-partials.mjs
  Görsel yer tutucuları (dosyalar yüklenene kadar gri, etiketli kutu görünür;
  yüklenince alt metinleri görselin GERÇEKTE gösterdiğine göre güncelleyin):
${imgComment}
-->
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(c.title)}</title>
  <meta name="description" content="${attr(c.description)}">
  <link rel="canonical" href="${URL}">
  <!-- GSC: <meta name="google-site-verification" content="..."> -->
  <meta name="theme-color" content="#F7F5F2">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:site_name" content="Sibel Aydın Mimarlık">
  <meta property="og:title" content="{{title}}">
  <meta property="og:description" content="{{description}}">
  <meta property="og:url" content="${URL}">
  <meta property="og:image" content="${SITE}/assets/img/hero-villa.webp">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" href="/assets/img/favicon-32.png" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png" sizes="180x180">
  <link rel="manifest" href="/site.webmanifest">
  <script>(function(d){var c=d.documentElement.classList,n=navigator.connection;c.add('js');if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&!(n&&n.saveData))c.add('motion');})(document);</script>
  <!-- Fontlar kendi sunucumuzdan (Instrument Sans, değişken); latin + latin-ext önceden yüklenir -->
  <link rel="preload" href="/assets/fonts/instrument-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/instrument-sans-latin-ext.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/css/style.css?v=dev">
  <script type="application/ld+json">
${ind(JSON.stringify(ld, null, 2), 2)}
  </script>
  <!-- İç sayfalarda GSAP gerekmez; yalnızca main.js -->
  <script src="/assets/js/main.js?v=dev" defer></script>
</head>
<body class="page-inner page-service" data-wa-service="${attr(c.waService)}" data-wa-msg="${attr(c.waMsg)}">

<!-- HEADER START -->
<!-- HEADER END -->

<main id="main">
  <nav class="breadcrumb container" aria-label="Sayfa konumu">
    <ol>
      <li><a href="/">Ana Sayfa</a></li>
      <li><a href="/hizmetler/">Hizmetler</a></li>
      <li aria-current="page">${esc(c.breadcrumb)}</li>
    </ol>
  </nav>

  <!-- HERO -->
  <section class="page-hero">
    <div class="container svc-hero">
      <div>
        <p class="eyebrow">Hizmetler</p>
        <h1 class="page-hero__title">${esc(c.hero.h1)}</h1>
        <p class="page-hero__lead">${esc(c.hero.lead)}</p>
        <div class="btn-row">
          <a class="btn btn--primary" href="/projenizi-anlatin/" data-cta="projenizi_anlatin_hizmet_hero">Projenizi Anlatın${arrow}</a>
          ${apptBtn('btn--outline', 'randevu_hizmet_hero')}
        </div>
      </div>
      <div class="media media--4x3" data-ph="${attr(c.hero.ph)}">
        <img src="${c.hero.img}" width="1200" height="900" fetchpriority="high" decoding="async" alt="${attr(c.hero.alt)}">
      </div>
    </div>
  </section>

  <!-- BÖLÜM 1 -->
  <section class="section" aria-labelledby="kapsam-baslik">
    <div class="container">
      <div class="split-head reveal">
        <div>
          <p class="eyebrow">Kapsam</p>
          <h2 id="kapsam-baslik" class="section__title">${esc(c.scope.h2)}</h2>
        </div>
        <p>${esc(c.scope.text)}</p>
      </div>
      <ul class="icon-list">
${c.scope.items.map(([term, text, path]) => `        <li class="reveal">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>
          <span><strong>${esc(term)}:</strong> ${esc(text)}</span>
        </li>`).join('\n')}
      </ul>
    </div>
  </section>

  <!-- BÖLÜM 2 -->
  <section class="section projects" aria-labelledby="turler-baslik">
    <div class="container">
      <header class="section__head reveal">
        <p class="eyebrow">${esc(c.types.eyebrow)}</p>
        <h2 id="turler-baslik" class="section__title">${esc(c.types.h2)}</h2>
      </header>
      <div class="cards-3">
${c.types.cards.map((k) => `        <article class="info-card reveal">
          <div class="media media--4x3" data-ph="${attr(k.ph)}">
            <img src="${k.img}" width="1200" height="900" loading="lazy" decoding="async" alt="${attr(k.alt)}">
          </div>
          <h3>${esc(k.h3)}</h3>
          <p>${esc(k.text)}</p>
        </article>`).join('\n')}
      </div>
    </div>
  </section>

  <!-- BÖLÜM 3 -->
  <section class="section" aria-labelledby="surec-baslik">
    <div class="container">
      <header class="section__head reveal">
        <p class="eyebrow">Süreç</p>
        <h2 id="surec-baslik" class="section__title">Süreç nasıl ilerler?</h2>
      </header>
      <ol class="steps">
${c.steps.map(([h3, text]) => `        <li class="reveal">
          <h3>${esc(h3)}</h3>
          <p>${esc(text)}</p>
        </li>`).join('\n')}
      </ol>
    </div>
  </section>

  <!-- BÖLÜM 4 -->
  <section class="section process" aria-labelledby="erken-baslik">
    <div class="container two-col">
      <div class="reveal">
        <p class="eyebrow">Doğru başlangıç</p>
        <h2 id="erken-baslik" class="section__title">${esc(c.why.h2)}</h2>
        <p class="prose-p">${esc(c.why.text)}</p>
      </div>
      <aside class="note reveal" aria-label="Not">
        <p>${esc(c.why.note)}</p>
        <a class="link-arrow" href="${c.why.href}">${esc(c.why.link)}${linkArrow}</a>
      </aside>
    </div>
  </section>

  <!-- BÖLÜM 5 -->
  <section class="section section--tight" aria-labelledby="ilgili-baslik">
    <div class="container">
      <header class="section__head reveal">
        <p class="eyebrow">Birlikte düşünülenler</p>
        <h2 id="ilgili-baslik" class="section__title">İlgili hizmetler</h2>
      </header>
      <div class="related">
${c.related.map(([name, link, href]) => `        <a class="reveal" href="${href}">
          <h3>${esc(name)}</h3>
          <span class="link-arrow">${esc(link)}${linkArrow}</span>
        </a>`).join('\n')}
      </div>
    </div>
  </section>

  <!-- BÖLÜM 6: SSS -->
  <section class="section faq" id="sss" aria-labelledby="sss-baslik">
    <div class="container faq__grid">
      <header class="faq__head reveal">
        <p class="eyebrow">SSS</p>
        <h2 id="sss-baslik" class="section__title">Sıkça sorulan sorular</h2>
      </header>
      <div class="faq__list reveal">
${c.faq.map(([q, a]) => `        <details class="faq__item">
          <summary>${esc(q)}</summary>
          <div class="faq__answer"><p>${esc(a)}</p></div>
        </details>`).join('\n')}
      </div>
    </div>
  </section>

  <!-- CTA BANDI -->
  <section class="cta-band" aria-labelledby="cta-baslik">
    <div class="container cta-band__inner reveal">
      <div>
        <p class="eyebrow eyebrow--light">İletişim</p>
        <h2 id="cta-baslik" class="cta-band__title">${esc(c.cta.h2)}</h2>
        <p class="cta-band__text">${esc(c.cta.text)}</p>
      </div>
      <div class="btn-row">
        <a class="btn btn--light" href="/projenizi-anlatin/" data-cta="projenizi_anlatin_band">Projenizi Anlatın${arrow}</a>
        ${apptBtn('btn--ghost-light', 'randevu_band')}
        <a class="btn btn--ghost-light" href="tel:+905368475640" data-cta="ara_band"><svg class="icon" aria-hidden="true"><use href="#i-phone"/></svg>Bizi Arayın</a>
      </div>
    </div>
  </section>
</main>

<!-- FOOTER START -->
<!-- FOOTER END -->

</body>
</html>
`;

const out = join(ROOT, 'hizmetler', slug, 'index.html');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`✓ hizmetler/${slug}/index.html  (SSS: ${c.faq.length}, adım: ${c.steps.length}, liste: ${c.scope.items.length})`);
