/* ==========================================================================
   Sibel Aydın İnşaat Mimarlık — main.js (vanilla JS, GSAP + ScrollTrigger yalnızca hero'da)
   ========================================================================== */

/* ---- Hero görsel dizisi ayarları (dosya adı/sayısı değişirse sadece burayı düzenleyin) ---- */
const HERO_SEQ = {
  // Masaüstü: AVIF destekleniyorsa 1920px AVIF (6.9 MB), değilse 1600px WebP (7.9 MB)
  desktop: { dir: '/assets/seq/desktop/', prefix: 'villa_', count: 150, ext: '.webp', width: 1600, height: 890,
             avif: { ext: '.avif', width: 1920, height: 1068 } },
  mobile:  { dir: '/assets/seq/mobile/',  prefix: 'villa_', count: 75,  ext: '.webp', width: 604,  height: 1072 },
  pad: 4,                                   // villa_0001
  mobileQuery: '(max-width: 767px)',
  scrollLength: 3,                          // pin süresi: viewport yüksekliğinin katı (~300vh)
  preloadSteps: [10, 5, 1],                 // ön yükleme: önce her 10. kare, sonra aradakiler
  staticImage: '/assets/img/hero-villa.webp',
  // Aşama sınırları — her aşamanın TAMAMLANDIĞI kare (0 tabanlı; K0 Plan, K1 Temel,
  // K2 Karkas, K3 Kütle, K4 Tamamlanan). "node tools/generate-villa.mjs frames" çıktısından.
  // hold: aşama tamamlanınca bırakılan kısa duraklamanın kare sayısı.
  stages: {
    desktop: { frames: [0, 21, 77, 117, 149], hold: 4 },
    mobile:  { frames: [0, 10, 39, 59, 74],   hold: 2 }
  },
  stageNames: ['Plan', 'Temel', 'Karkas', 'Kütle', 'Tamamlanan']
};

/* Metin ve etiket pencereleri aşama sınırlarından türetilir (kare → ilerleme 0–1).
   Pencere: [görünme başı, tam görünür, kaybolma başı, tam kayıp]
   · 1. cümle  → K0–K1 (plan + temel), K1 duraklamasından sonra kaybolur
   · 2. cümle  → K2–K3 (karkas + kütle), K3 duraklamasından sonra kaybolur
   · H1 + butonlar → K4 (final)                                             */
function heroPhases(set, st) {
  const N = set.count - 1, f = st.frames, h = st.hold;
  const p = (x) => x / N;
  const span = (a, b, t) => a + (b - a) * t;      // a→b aralığında t oranı
  const after1 = f[1] + h, after3 = f[3] + h;
  return {
    line1: [-1, 0, p(after1), p(span(after1, f[2], 0.3))],
    line2: [p(span(after1, f[2], 0.3)), p(span(after1, f[2], 0.5)), p(after3), p(span(after3, f[4], 0.3))],
    final: [p(span(after3, f[4], 0.4)), p(span(after3, f[4], 0.75)), 2, 2],
    // Etiket: bir aşama, önceki aşamadan ona geçişin yarısında aktif olur
    labels: f.map((fr, k) => (k === 0 ? 0 : p(span(f[k - 1] + h, fr, 0.5))))
  };
}

/* AVIF desteği: 2×2 px gerçek AVIF'i çözmeyi dener; sonuç bir kez hesaplanır ve saklanır */
const AVIF_TEST = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAAD5bWV0YQAAAAAAAAAvaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAFBpY3R1cmVIYW5kbGVyAAAAAA5waXRtAAAAAAABAAAAHmlsb2MAAAAARAAAAQABAAAAAQAAASEAAAATAAAAKGlpbmYAAAAAAAEAAAAaaW5mZQIAAAAAAQAAYXYwMUNvbG9yAAAAAGppcHJwAAAAS2lwY28AAAAUaXNwZQAAAAAAAAACAAAAAgAAABBwaXhpAAAAAAMICAgAAAAMYXYxQ4EADAAAAAATY29scm5jbHgAAgACAAIAAAAAF2lwbWEAAAAAAAAAAQABBAECgwQAAAAbbWRhdAoFGAA2wCAyChyAAABYAABABMA=';
function supportsAvif() {
  try {
    const c = localStorage.getItem('sa-avif');
    if (c === '1' || c === '0') return Promise.resolve(c === '1');
  } catch (e) { /* depolama kapalı */ }
  return new Promise((resolve) => {
    const img = new Image();
    const done = (ok) => { try { localStorage.setItem('sa-avif', ok ? '1' : '0'); } catch (e) { /* yok say */ } resolve(ok); };
    img.onload = () => (img.decode ? img.decode().then(() => done(img.naturalWidth > 0), () => done(false)) : done(img.naturalWidth > 0));
    img.onerror = () => done(false);
    img.src = AVIF_TEST;
  });
}

const WA_BASE = 'https://wa.me/905368475640';
// Ayrı randevu sistemi yok: "Randevu Al/Alın" butonları bu hazır mesajla WhatsApp'a gider
const WA_APPOINTMENT_MSG = 'Merhaba, Sibel Aydın İnşaat Mimarlık ile görüşme randevusu almak istiyorum. Uygun olduğum gün ve saat: ';
const PROJECTS_URL = '/data/projects.json';
const REVEAL_STAGGER_MS = 80;
// Projenizi Anlatın: dosya kuralları (api/form.php ile aynı) ve ?hizmet=<hizmet sayfası slug'ı> → form seçeneği
const PF_FILE_TYPES = ['jpg', 'jpeg', 'png', 'heic', 'webp', 'pdf', 'dwg', 'dxf'];
const PF_MAX_FILES = 10, PF_MAX_FILE = 15 * 1024 * 1024, PF_MAX_TOTAL = 25 * 1024 * 1024;
const PF_SERVICE_MAP = { 'ruhsat-iskan': 'ruhsat', 'santiye-teknik-hizmetler': 'santiye-teknik', 'enerji-kimlik-belgesi': 'ekb' };
/* WhatsApp şantiye karakteri (özgün çizim, 80×120, sola bakar). Renkler: mürekkep, petrol, koyu petrol, beyaz, ten, pantolon.
   Gruplar ve eklem noktaları (svgOrigin): kolL 35 56 · kolR 47 56 · baret 41 30 · bas 41 50 · bacakF 38 84 · bacakB 43 84.
   Direk ve bayrak kolR içinde: kol −150° kalkınca el başın sağında, direk ucu ≈ (72, 1) → HTML bayrak başın üstünde direğe asılır (CSS). */
const MASCOT_SVG = '<svg class="mascot__svg" viewBox="0 0 80 120" aria-hidden="true" focusable="false">' +
  '<g fill="none" stroke="#1E1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<g data-part="kolR"><g data-part="direk" opacity="0"><path d="M48.4 64 53 116" stroke-width="2.4"/></g>' +
  '<g data-part="bayrak" opacity="0"><path d="M53 116 56.6 108.5 49.4 109.6Z" fill="#fff" stroke="#007580" stroke-width="1.6"/></g>' +
  '<path d="M44 54h7l1 18h-7z" fill="#12636D"/><circle cx="49" cy="76" r="3.6" fill="#E9B48A"/></g>' +
  '<g data-part="bacaklar"><g data-part="bacakB"><path d="M39.5 82h7.5v22h-7.5z" fill="#3A4245"/><path d="M36 104h11v5H35a2.5 2.5 0 0 1 1-5z" fill="#1E1E1E"/></g>' +
  '<g data-part="bacakF"><path d="M34.5 82H42v22h-7.5z" fill="#3A4245"/><path d="M31 104h11v5H30a2.5 2.5 0 0 1 1-5z" fill="#1E1E1E"/></g></g>' +
  '<g data-part="govde"><path d="M31 53q11-5 23 0l1 31H30z" fill="#007580"/><path d="M31.5 68h23M37 53.5V68m11-14.5V68" stroke="#fff" stroke-width="2.4"/><path d="M30 84h25"/></g>' +
  '<g data-part="bas"><path d="M38 47v6h7v-6" fill="#E9B48A"/><circle cx="41" cy="38" r="12" fill="#E9B48A"/>' +
  '<circle cx="34.6" cy="37.6" r="1.5" fill="#1E1E1E" stroke="none"/><circle cx="40.2" cy="37.6" r="1.5" fill="#1E1E1E" stroke="none"/>' +
  '<path d="M33.6 42.6q3 2.6 6 0M48.6 36.5q3.2 2 0 4.6" stroke-width="1.6"/>' +
  '<g data-part="baret"><path d="M28.5 30.5a12.5 11.5 0 0 1 25 0z" fill="#fff"/><rect x="22.5" y="29.5" width="33" height="4.2" rx="2.1" fill="#fff"/><path d="M41 19.5v10" stroke-width="1.6"/></g></g>' +
  '<g data-part="kolL"><path d="M32 54h7l-1 18h-6z" fill="#007580"/><path d="M32.4 65.5h6.2" stroke="#fff" stroke-width="2.2"/><circle cx="35" cy="76" r="3.6" fill="#E9B48A"/></g>' +
  '</g></svg>';

(function () {
  'use strict';

  const doc = document.documentElement;
  const body = document.body;
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  /* ---------------------------------------------------------------- Görseller
     Dosyası henüz olmayan görseller için gri, etiketli yer tutucu göster. */
  function markMissing(img) {
    const box = img.closest('.media');
    (box || img).classList.add('is-missing');
  }
  document.addEventListener('error', (e) => {
    if (e.target instanceof HTMLImageElement) markMissing(e.target);
  }, true);
  $$('img').forEach((img) => { if (img.complete && img.naturalWidth === 0) markMissing(img); });

  /* ---------------------------------------------------------------- Yıl */
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  /* ---------------------------------------------------------------- WhatsApp mesajı
     <body data-wa-msg="..."> değeri tüm wa.me linklerine eklenir. */
  // Randevu butonları ([data-appointment]) ve kendi mesajını JS ile alan linkler ([data-wa-keep]) atlanır.
  const waMsg = body.dataset.waMsg;
  if (waMsg) {
    $$('a[href^="' + WA_BASE + '"]:not([data-appointment]):not([data-wa-keep])').forEach((a) => {
      a.href = WA_BASE + '?text=' + encodeURIComponent(waMsg);
    });
  }
  // Randevu mesajı: hizmet sayfalarında <body data-wa-service="…"> ile hizmet adı eklenir
  const service = body.dataset.waService;
  const apptMsg = service
    ? 'Merhaba, Sibel Aydın İnşaat Mimarlık ile ' + service + ' hakkında görüşme randevusu almak istiyorum. Uygun olduğum gün ve saat: '
    : WA_APPOINTMENT_MSG;
  $$('a[data-appointment]').forEach((a) => { a.href = WA_BASE + '?text=' + encodeURIComponent(apptMsg); });

  /* ---------------------------------------------------------------- dataLayer olayları */
  window.dataLayer = window.dataLayer || [];
  function placementOf(el) {
    if (el.closest('.site-header')) return 'header';
    if (el.closest('.mobile-bar')) return 'mobile_bar';
    if (el.closest('.wa-fab')) return 'floating_button';
    if (el.closest('.site-footer')) return 'footer';
    if (el.closest('[data-hero]')) return 'hero';
    const sec = el.closest('section');
    return (sec && (sec.id || sec.getAttribute('aria-labelledby'))) || 'content';
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    let event = null;
    if (a.hasAttribute('data-social')) {
      window.dataLayer.push({ event: 'social_click', platform: a.dataset.social, link_url: a.href, placement: placementOf(a), page_path: location.pathname });
      return;
    }
    if (a.hasAttribute('data-appointment')) event = 'appointment_whatsapp_click';
    else if (href.indexOf('https://wa.me/') === 0) event = 'whatsapp_click';
    else if (href.indexOf('tel:') === 0) event = 'phone_click';
    else if (a.hasAttribute('data-cta')) event = 'cta_click';
    if (!event) return;
    window.dataLayer.push({
      event: event,
      cta_id: a.dataset.cta || null,
      link_url: a.href,
      link_text: a.textContent.replace(/\s+/g, ' ').trim().slice(0, 80),
      placement: placementOf(a),
      page_path: location.pathname,
      page_name: document.title
    });
  });

  /* ---------------------------------------------------------------- Aktif menü öğesi */
  const path = location.pathname.replace(/index\.html$/, '').replace(/\/?$/, '/');
  $$('.nav a[href^="/"], .header-cta__link').forEach((a) => {
    const p = a.getAttribute('href');
    if (p === path) a.setAttribute('aria-current', 'page');
    const item = a.closest('.nav__item');
    if (item && p !== '/' && path.indexOf(p) === 0 && a.classList.contains('nav__link')) item.classList.add('is-current');
  });
  $$('.nav__sub a[aria-current="page"]').forEach((a) => {
    const item = a.closest('.nav__item');
    if (item) item.classList.add('is-current');
  });

  /* ---------------------------------------------------------------- Menü */
  const header = $('[data-header]');
  const nav = $('[data-nav]');
  const burger = $('[data-burger]');
  const burgerLabel = $('[data-burger-label]');
  const desktopMQ = matchMedia('(min-width: 1100px)');
  const hoverMQ = matchMedia('(hover: hover)');
  const subItems = $$('[data-sub]');
  // Mobil menüde bağlantılar aşağıdan yukarı sırayla belirsin (CSS: --i × 60ms)
  if (nav) $$('.nav__item, .nav__mobile-extra', nav).forEach((el, i) => el.style.setProperty('--i', i));

  function setSub(item, open) {
    item.classList.toggle('is-open', open);
    const t = $('.nav__toggle', item);
    if (t) t.setAttribute('aria-expanded', String(open));
    updateHeader();
  }
  function closeSubs(except) {
    subItems.forEach((it) => { if (it !== except) setSub(it, false); });
  }

  subItems.forEach((item) => {
    const toggle = $('.nav__toggle', item);
    let leaveTimer;
    toggle.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      if (desktopMQ.matches) closeSubs(item);
      setSub(item, open);
    });
    item.addEventListener('mouseenter', () => {
      if (!desktopMQ.matches || !hoverMQ.matches) return;
      clearTimeout(leaveTimer);
      closeSubs(item);
      setSub(item, true);
    });
    item.addEventListener('mouseleave', () => {
      if (!desktopMQ.matches || !hoverMQ.matches) return;
      leaveTimer = setTimeout(() => setSub(item, false), 160);
    });
    item.addEventListener('focusout', (e) => {
      if (desktopMQ.matches && !item.contains(e.relatedTarget)) setSub(item, false);
    });
  });

  document.addEventListener('click', (e) => {
    if (desktopMQ.matches && !e.target.closest('[data-sub]')) closeSubs();
  });

  const inertTargets = () => $$('body > *').filter((el) => el !== header && !el.classList.contains('skip-link') && el.tagName !== 'SCRIPT');
  function setMenu(open) {
    if (!nav || !burger) return;
    nav.classList.toggle('is-open', open);
    body.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', String(open));
    if (burgerLabel) burgerLabel.textContent = open ? 'Menüyü kapat' : 'Menüyü aç';
    inertTargets().forEach((el) => { el.inert = open; });
    updateHeader();
    if (open) {
      const first = $('a, button', nav);
      if (first) first.focus({ preventScroll: true });
    } else {
      closeSubs();
    }
  }
  if (burger) burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  desktopMQ.addEventListener('change', (e) => { if (e.matches) setMenu(false); closeSubs(); });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (nav && nav.classList.contains('is-open')) {
      setMenu(false);
      burger.focus();
      return;
    }
    const open = subItems.find((it) => it.classList.contains('is-open'));
    if (open) {
      setSub(open, false);
      $('.nav__toggle', open).focus();
    }
  });

  /* ---------------------------------------------------------------- Header zemini
     Hero görünürken şeffaf; hero'dan çıkınca beyaz + sticky. */
  const heroStage = $('[data-hero-stage]');
  let headerTicking = false;
  function updateHeader() {
    headerTicking = false;
    if (!header) return;
    const past = heroStage
      ? heroStage.getBoundingClientRect().bottom <= header.offsetHeight + 1
      : window.scrollY > 4;
    // Masaüstü alt menü açıkken header beyaz zemine geçer (koyu logo + koyu menü);
    // mobil menü açıkken koyu tam ekran menünün üstünde durur (beyaz logo + beyaz X)
    const navOpen = body.classList.contains('nav-open');
    const subOpen = !navOpen && subItems.some((it) => it.classList.contains('is-open'));
    header.classList.toggle('is-solid', past || subOpen);
    header.classList.toggle('is-over-dark', navOpen);
    header.classList.toggle('is-over-hero', !!heroStage && !past && !subOpen && !navOpen);
  }
  window.addEventListener('scroll', () => {
    if (!headerTicking) { headerTicking = true; requestAnimationFrame(updateHeader); }
  }, { passive: true });
  window.addEventListener('resize', updateHeader);
  updateHeader();

  /* ---------------------------------------------------------------- Yumuşak girişler */
  const motionOK = doc.classList.contains('motion');
  let revealIO = null;
  if (motionOK && 'IntersectionObserver' in window) {
    doc.classList.add('reveal-ready');
    revealIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        revealIO.unobserve(el);
        // will-change yalnızca animasyon süresince
        el.style.willChange = 'transform, opacity';
        el.addEventListener('transitionend', function done(e) {
          if (e.target !== el || e.propertyName !== 'transform') return;
          el.style.willChange = '';
          el.removeEventListener('transitionend', done);
        });
        requestAnimationFrame(() => el.classList.add('is-in'));
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  }
  function observeReveals(root) {
    const els = $$('.reveal:not(.is-in)', root);
    if (!revealIO) { els.forEach((el) => el.classList.add('is-in')); return; }
    els.forEach((el) => {
      // Grid/liste öğeleri sırayla: kardeşler arasındaki sıra × 80ms (en fazla 8 adım)
      const sibs = Array.from(el.parentElement.children).filter((c) => c.classList.contains('reveal'));
      el.style.transitionDelay = Math.min(sibs.indexOf(el), 8) * REVEAL_STAGGER_MS + 'ms';
      revealIO.observe(el);
    });
  }
  observeReveals();

  /* ---------------------------------------------------------------- Harita (tıklayınca yüklenir) */
  $$('[data-map]').forEach((box) => {
    const btn = $('[data-map-btn]', box);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = box.dataset.mapSrc;
      f.title = box.dataset.mapTitle || 'Sibel Aydın İnşaat Mimarlık konumu — Google Haritalar';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.setAttribute('allowfullscreen', '');
      box.innerHTML = '';
      box.appendChild(f);
    });
  });

  /* ---------------------------------------------------------------- Harita sekmeleri (İletişim: Silivri | Büyükçekmece)
     Sekme yalnızca yüklenecek iframe adresini değiştirir; kullanıcı "Haritayı göster"e basmadan Google'a istek gitmez.
     Harita zaten yüklendiyse (onay verilmiş) iframe yeni ofise geçer. Klavye: ←/→, Home, End. */
  $$('[data-map-tabs]').forEach((list) => {
    const tabs = $$('[role="tab"]', list);
    const panel = document.getElementById(tabs[0].getAttribute('aria-controls'));
    if (!panel) return;
    const select = (tab, focus) => {
      tabs.forEach((t) => { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      panel.setAttribute('aria-labelledby', tab.id);
      panel.dataset.mapSrc = tab.dataset.mapTab;
      panel.dataset.mapTitle = tab.dataset.mapTitle;
      const f = $('iframe', panel);
      if (f) { f.src = tab.dataset.mapTab; f.title = tab.dataset.mapTitle; }
      if (focus) tab.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t, false));
      t.addEventListener('keydown', (e) => {
        const j = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
        if (j === undefined) return;
        e.preventDefault();
        select(tabs[j], true);
      });
    });
  });

  /* ---------------------------------------------------------------- Tasarım projeleri (ana sayfa + /projeler/)
     Kartlar HTML'de statik durur (SEO). /data/projects.json gelirse her karta "… görseli inceleyin"
     düğmesi eklenir; tıklanınca projenin tüm görsellerini gösteren detay penceresi (<dialog>) açılır.
     Kayıtlar firmanın 3D görselleştirmeleridir; konum, yıl ve m² gösterilmez. */
  const projectList = $('[data-projects]');
  if (projectList && 'fetch' in window && typeof HTMLDialogElement === 'function') {
    fetch(PROJECTS_URL, { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => initConcepts(projectList, Array.isArray(data) ? data : data.projeler || []))
      .catch(() => { /* statik kartlar kalır */ });
  }

  function conceptPicture(g, sizes) {
    const ws = g.genislikler || [480, 960, 1600];
    const set = (ext) => ws.map((w, i) => g.gorsel + '-' + [480, 960, 1600][i] + '.' + ext + ' ' + w + 'w').join(', ');
    const pic = document.createElement('picture');
    const src = document.createElement('source');
    src.type = 'image/avif'; src.srcset = set('avif'); src.sizes = sizes;
    const img = document.createElement('img');
    img.src = g.gorsel + '-960.webp'; img.srcset = set('webp'); img.sizes = sizes;
    img.width = g.en || 1600; img.height = g.boy || 900; img.loading = 'lazy'; img.decoding = 'async'; img.alt = g.alt;
    pic.append(src, img);
    return pic;
  }
  function initConcepts(list, items) {
    const bySlug = {};
    items.forEach((p) => { bySlug[p.slug] = p; });
    const dlg = document.createElement('dialog');
    dlg.className = 'concept-dialog';
    dlg.setAttribute('aria-labelledby', 'konsept-baslik');
    // Kapat düğmesi önde ve yapışkan: uzun içerikte kaydırınca da görünür
    dlg.innerHTML = '<button class="concept-dialog__close" type="button" aria-label="Pencereyi kapat"><span aria-hidden="true">×</span></button>' +
      '<div class="concept-dialog__inner">' +
      '<header class="concept-dialog__head"><p class="eyebrow" data-k-etiket></p><h2 id="konsept-baslik" class="concept-dialog__title"></h2>' +
      '<p class="concept-dialog__text" data-k-tanim></p></header>' +
      '<div class="concept-dialog__grid" data-k-galeri></div></div>';
    body.appendChild(dlg);
    let opener = null;
    $('.concept-dialog__close', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });     // arka plana tıklama
    dlg.addEventListener('close', () => { body.classList.remove('dialog-open'); if (opener) opener.focus(); });
    const open = (p, btn) => {
      opener = btn;
      $('[data-k-etiket]', dlg).textContent = p.etiket;
      $('.concept-dialog__title', dlg).textContent = p.baslik;
      $('[data-k-tanim]', dlg).textContent = p.tanim;
      const grid = $('[data-k-galeri]', dlg);
      grid.replaceChildren(...p.galeri.map((g, i) => {
        const fig = document.createElement('figure');
        fig.className = 'concept-dialog__fig' + (i === 0 ? ' is-main' : '');
        const media = document.createElement('div');
        media.className = 'media';
        media.appendChild(conceptPicture(g, i === 0 ? '(min-width: 1100px) 1040px, 94vw' : '(min-width: 700px) 520px, 94vw'));
        const cap = document.createElement('figcaption');
        cap.textContent = g.baslik;
        fig.append(media, cap);
        return fig;
      }));
      body.classList.add('dialog-open');
      dlg.showModal();
      dlg.scrollTop = 0;
      window.dataLayer.push({ event: 'project_open', project: p.slug, page_path: location.pathname });
    };
    $$('.project-card', list).forEach((li) => {
      const p = bySlug[li.dataset.slug];
      if (!p || !Array.isArray(p.galeri) || !p.galeri.length) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'link-arrow project-card__open';
      btn.setAttribute('aria-haspopup', 'dialog');
      btn.innerHTML = p.galeri.length + ' görseli inceleyin<svg class="i-arrow" aria-hidden="true"><use href="#i-arrow-r"/></svg>';
      $('.project-card__meta', li).appendChild(btn);
      btn.addEventListener('click', () => open(p, btn));
      const frame = $('.project-card__frame', li);
      frame.classList.add('is-interactive');
      frame.addEventListener('click', () => open(p, btn));
    });
  }

  /* ---------------------------------------------------------------- HERO */
  initHero();
  initXray();
  initStudio();
  initContactForm();
  initProjectForm();
  initCareerForm();
  initDocs();
  initThanks();
  initMascot();

  /* ---------------------------------------------------------------- BELGELER: lightbox
     Kimdir sayfası ızgarası (data-doc-group="belgeler") ve hizmet sayfalarındaki "Yetki belgemiz" kartı.
     Bağlantı JS yoksa 1600'lük görseli açar. <dialog>: ESC kapatır (yerel), ←/→ aynı gruptaki belgeler
     arasında gezer, arka plana tıklama kapatır, kapanınca odak açan bağlantıya döner. dataLayer: document_open. */
  function initDocs() {
    const links = $$('[data-doc]');
    if (!links.length || typeof HTMLDialogElement !== 'function') return;
    const dlg = document.createElement('dialog');
    dlg.className = 'doc-dialog';
    dlg.setAttribute('aria-labelledby', 'belge-baslik');
    const arrowSvg = '<svg class="i-arrow" aria-hidden="true"><use href="#i-arrow-r"/></svg>';
    dlg.innerHTML = '<button class="doc-dialog__close" type="button" aria-label="Pencereyi kapat"><span aria-hidden="true">×</span></button>' +
      '<div class="doc-dialog__stage"><picture><source type="image/avif"><img alt="" decoding="async"></picture></div>' +
      '<div class="doc-dialog__bar"><p class="doc-dialog__cap"><span class="doc-dialog__title" id="belge-baslik"></span><span class="doc-dialog__meta"></span></p>' +
      '<div class="doc-dialog__nav"><button class="doc-dialog__btn doc-dialog__btn--prev" type="button" data-step="-1" aria-label="Önceki belge">' + arrowSvg + '</button>' +
      '<span class="doc-dialog__count" aria-live="polite"></span>' +
      '<button class="doc-dialog__btn" type="button" data-step="1" aria-label="Sonraki belge">' + arrowSvg + '</button></div></div>';
    body.appendChild(dlg);
    const source = $('source', dlg), img = $('img', dlg), nav = $('.doc-dialog__nav', dlg);
    let list = [], idx = 0, opener = null;
    const show = (i) => {
      idx = (i + list.length) % list.length;
      const a = list[idx], base = a.dataset.doc, thumb = $('img', a);
      source.srcset = base + '-1600.avif';      // belge metni okunabilsin diye her zaman 1600
      img.width = +a.dataset.docW; img.height = +a.dataset.docH;
      img.src = base + '-1600.webp';
      img.alt = thumb ? thumb.alt : '';
      $('.doc-dialog__title', dlg).textContent = a.dataset.docTitle;
      $('.doc-dialog__meta', dlg).textContent = a.dataset.docMeta;
      $('.doc-dialog__count', dlg).textContent = (idx + 1) + ' / ' + list.length;
    };
    links.forEach((a) => a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;   // yeni sekmede açma serbest
      e.preventDefault();
      const g = a.dataset.docGroup;
      list = g ? links.filter((x) => x.dataset.docGroup === g) : [a];
      nav.hidden = list.length < 2;
      opener = a;
      show(list.indexOf(a));
      body.classList.add('dialog-open');
      dlg.showModal();
      window.dataLayer.push({ event: 'document_open', document: a.dataset.doc.split('/').pop(), page_path: location.pathname });
    }));
    $('.doc-dialog__close', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    $$('[data-step]', dlg).forEach((b) => b.addEventListener('click', () => show(idx + Number(b.dataset.step))));
    dlg.addEventListener('keydown', (e) => {
      if (list.length < 2) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
    });
    dlg.addEventListener('close', () => { body.classList.remove('dialog-open'); if (opener) opener.focus(); });
  }

  /* ---------------------------------------------------------------- İLETİŞİM FORMU
     İstemci doğrulaması (sunucu aynı kuralları tekrar uygular) → POST /api/form.php (JSON).
     Başarıda formun yerine teşekkür mesajı; dataLayer: contact_submit. */
  function initContactForm() {
    const form = $('[data-contact-form]');
    if (!form) return;
    const card = form.closest('.form-card');
    const status = $('[data-form-status]', form);
    const submit = $('[data-form-submit]', form);
    const counter = $('[data-counter]', form);
    const ts = $('[data-form-ts]', form);
    if (ts) ts.value = String(Math.floor(Date.now() / 1000));

    const RULES = {
      ad_soyad: (v) => (v.trim().length >= 2 ? '' : 'Lütfen adınızı ve soyadınızı yazın.'),
      telefon: (v) => { const d = v.replace(/\D/g, ''); return d.length >= 10 && d.length <= 13 ? '' : 'Lütfen geçerli bir telefon numarası yazın.'; },
      eposta: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Lütfen geçerli bir e-posta adresi yazın.'),
      mesaj: (v) => { const n = v.trim().length; return n >= 10 && n <= 2000 ? '' : 'Mesajınız 10 ile 2000 karakter arasında olmalı.'; },
      kvkk: (v, el) => (el.checked ? '' : 'Devam etmek için KVKK Aydınlatma Metni\'ni okuduğunuzu onaylayın.')
    };
    const setError = (name, msg) => {
      const el = form.elements[name];
      if (!el) return;
      const err = $('#' + el.id + '-err', form);
      if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
      if (err) err.textContent = msg || '';
    };
    const check = (name) => {
      const el = form.elements[name];
      const msg = RULES[name] ? RULES[name](el.value, el) : '';
      setError(name, msg);
      return !msg;
    };

    // Alan terk edilince (ve hatalıyken her değişiklikte) doğrula
    Object.keys(RULES).forEach((name) => {
      const el = form.elements[name];
      el.addEventListener('blur', () => { if (el.value || el.type === 'checkbox') check(name); });
      el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => { if (el.getAttribute('aria-invalid')) check(name); });
    });
    const msgEl = form.elements.mesaj;
    const count = () => { counter.textContent = msgEl.value.length + ' / 2000'; };
    msgEl.addEventListener('input', count);
    count();

    let sending = false;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (sending) return;
      const invalid = Object.keys(RULES).filter((name) => !check(name));
      if (invalid.length) {
        status.className = 'form-status form-status--error';
        status.textContent = 'Lütfen işaretli alanları kontrol edin.';
        form.elements[invalid[0]].focus();
        return;
      }
      sending = true;
      submit.setAttribute('aria-disabled', 'true');
      status.className = 'form-status';
      status.textContent = 'Gönderiliyor…';
      const konu = form.elements.konu.value;

      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }, credentials: 'same-origin' })
        .then((r) => r.json().catch(() => ({ ok: false })).then((data) => ({ status: r.status, data })))
        .then(({ status: code, data }) => {
          if (data && data.ok) {
            window.dataLayer.push({ event: 'contact_submit', konu: konu, talep_no: data.talep_no || null, page_path: location.pathname });
            showSuccess(data.talep_no);
            return;
          }
          if (code === 422 && data.errors) Object.keys(data.errors).forEach((name) => setError(name, data.errors[name]));
          fail(data && data.message);
        })
        .catch(() => fail());
    });

    function fail(message) {
      sending = false;
      submit.removeAttribute('aria-disabled');
      status.className = 'form-status form-status--error';
      status.textContent = message || 'Mesajınız şu anda gönderilemedi. Lütfen tekrar deneyin ya da 0536 847 56 40 numarasından bize ulaşın.';
      const firstInvalid = $('[aria-invalid="true"]', form);
      if (firstInvalid) firstInvalid.focus();
    }
    function showSuccess(no) {
      const box = document.createElement('div');
      box.className = 'form-success';
      box.tabIndex = -1;
      box.setAttribute('role', 'status');
      box.innerHTML = '<h3>Teşekkürler, mesajınız bize ulaştı.</h3>' +
        (no ? '<p>Talep numaranız: <strong></strong></p>' : '') +
        '<p>En kısa sürede size dönüş yapacağız. Acil durumlar için <a href="tel:+905368475640">0536 847 56 40</a> numarasından bize ulaşabilirsiniz.</p>';
      if (no) $('strong', box).textContent = no;
      card.replaceChildren(box);
      box.focus({ preventScroll: true });
      const top = card.getBoundingClientRect().top;
      if (top < 80 || top > innerHeight) card.scrollIntoView({ block: 'start', behavior: motionOK ? 'smooth' : 'auto' });
    }
  }

  /* ---------------------------------------------------------------- PROJENİZİ ANLATIN (3 adımlı form)
     JS kapalıysa tüm adımlar tek sayfada görünür ve form normal POST eder.
     Adım geçişinde yalnızca o adım doğrulanır; gönderim XHR (yükleme yüzdesi) → /api/form.php.
     dataLayer: form_step {step}, form_submit {proje_turu, hizmet_sayisi}. */

  /* ---------------------------------------------------------------- FORM YARDIMCILARI (Projenizi Anlatın + Kariyer) */
  // Telefon: 0532 123 45 67 / +90 532 123 45 67 biçiminde otomatik boşluk
  function phoneMask(tel) {
    tel.addEventListener('input', () => {
      const raw = tel.value;
      const plus = raw.trim().startsWith('+');
      const d = raw.replace(/\D/g, '').slice(0, plus ? 12 : 11);
      let out;
      if (plus) out = '+' + [d.slice(0, 2), d.slice(2, 5), d.slice(5, 8), d.slice(8, 10), d.slice(10, 12)].filter(Boolean).join(' ');
      else if (d.startsWith('0')) out = [d.slice(0, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)].filter(Boolean).join(' ');
      else out = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean).join(' ');
      if (out !== raw) tel.value = out;
    });
  }
  const fmtSize = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
  // Dosya alanı: [data-dropzone] içindeki input + sonraki kardeşler [data-file-list] / [data-file-total].
  // Sürükle-bırak, seçim, liste, tek tek kaldırma. maxFiles: 1 → yeni dosya eskisinin yerine geçer. Dönüş: { files } (canlı dizi).
  function fileField(zone, o) {
    const field = zone.parentElement;
    const input = $('input[type="file"]', zone), list = $('[data-file-list]', field), total = $('[data-file-total]', field);
    const files = [];
    const mb = (b) => Math.round(b / 1048576) + ' MB';
    function add(incoming) {
      const msgs = [];
      Array.from(incoming).forEach((f) => {
        const ext = (f.name.split('.').pop() || '').toLowerCase();
        if (!o.types.includes(ext) || f.name.indexOf('.') < 0) { msgs.push(f.name + ': bu dosya türü kabul edilmiyor (' + o.typeLabel + ').'); return; }
        if (f.size > o.maxFile) { msgs.push(f.name + ': dosya başına en fazla ' + mb(o.maxFile) + ' yükleyebilirsiniz.'); return; }
        if (files.some((x) => x.name === f.name && x.size === f.size)) return;
        if (o.maxFiles === 1) { files.splice(0, files.length, f); return; }
        if (files.length >= o.maxFiles) { msgs.push(f.name + ': en fazla ' + o.maxFiles + ' dosya yükleyebilirsiniz.'); return; }
        if (files.reduce((t, x) => t + x.size, 0) + f.size > o.maxTotal) { msgs.push(f.name + ': toplam boyut ' + mb(o.maxTotal) + '\'ı aşıyor.'); return; }
        files.push(f);
      });
      render();
      o.onError(msgs.join(' '));
    }
    function render() {
      list.replaceChildren(...files.map((f, i) => {
        const li = document.createElement('li');
        li.innerHTML = '<span class="file-list__name"></span><span class="file-list__size"></span>' +
          '<button type="button"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>';
        $('.file-list__name', li).textContent = f.name;
        $('.file-list__size', li).textContent = fmtSize(f.size);
        const btn = $('button', li);
        btn.setAttribute('aria-label', f.name + ' dosyasını kaldır');
        btn.addEventListener('click', () => {
          files.splice(i, 1);
          render();
          o.onError('');
          (list.children[Math.min(i, files.length - 1)]?.querySelector('button') || input).focus();
        });
        return li;
      }));
      if (total) {
        total.hidden = !files.length;
        total.textContent = files.length + ' dosya · ' + fmtSize(files.reduce((t, f) => t + f.size, 0)) + ' / ' + mb(o.maxTotal);
      }
      if (o.onChange) o.onChange(files);
    }
    input.addEventListener('change', () => { add(input.files); input.value = ''; });
    ['dragenter', 'dragover'].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.remove('is-over'); }));
    zone.addEventListener('drop', (e) => { if (e.dataTransfer && e.dataTransfer.files.length) add(e.dataTransfer.files); });
    return { files };
  }

  /* ---------------------------------------------------------------- KARİYER BAŞVURU FORMU
     /kariyer/ → POST /api/form.php (form_type=basvuru, XHR + yükleme yüzdesi) → /kariyer/tesekkurler/?no=…
     Sunucu aynı kuralları tekrar uygular. dataLayer: form_submit (form_type: basvuru). */
  function initCareerForm() {
    const form = $('[data-career-form]');
    if (!form) return;
    const el = (name) => form.elements[name];
    const ts = $('[data-form-ts]', form);
    if (ts) ts.value = String(Math.floor(Date.now() / 1000));
    const submit = $('[type="submit"]', form), status = $('[data-form-status]', form), alertBox = $('[data-form-alert]', form);
    const tel = el('telefon');
    phoneMask(tel);
    const about = el('hakkinda'), counter = $('[data-counter]', form);
    const count = () => { counter.textContent = about.value.length + ' / 3000'; };
    about.addEventListener('input', count);
    count();

    const cv = fileField($('[data-dropzone="cv"]', form), { types: ['pdf', 'doc', 'docx'], typeLabel: 'PDF, DOC, DOCX', maxFiles: 1, maxFile: 10 * 1048576, maxTotal: 10 * 1048576,
      onError: (msg) => setError('cv', msg), onChange: (f) => { if (f.length) setError('cv', ''); } });
    const pf = fileField($('[data-dropzone="portfolyo"]', form), { types: ['pdf', 'jpg', 'jpeg', 'png'], typeLabel: 'PDF, JPG, PNG', maxFiles: 3, maxFile: 20 * 1048576, maxTotal: 20 * 1048576,
      onError: (msg) => setError('portfolyo', msg) });

    const RULES = {
      ad_soyad: () => (el('ad_soyad').value.trim().length >= 2 ? '' : 'Lütfen adınızı ve soyadınızı yazın.'),
      eposta: () => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el('eposta').value.trim()) ? '' : 'Lütfen geçerli bir e-posta adresi yazın.'),
      telefon: () => { const d = tel.value.replace(/\D/g, ''); return d.length >= 10 && d.length <= 13 ? '' : 'Lütfen geçerli bir telefon numarası yazın.'; },
      alan: () => (el('alan').value ? '' : 'Lütfen çalışmak istediğiniz alanı seçin.'),
      hakkinda: () => { const n = about.value.trim().length; return n >= 30 && n <= 3000 ? '' : 'Kendinizden biraz daha bahseder misiniz? (30 ile 3000 karakter arası)'; },
      tecrube: () => (el('tecrube').value.length <= 3000 ? '' : 'Tecrübeleriniz en fazla 3000 karakter olabilir.'),
      baglanti: () => { const v = el('baglanti').value.trim(); return !v || /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(v) ? '' : 'Lütfen bağlantıyı https:// ile başlayan tam adres olarak yazın.'; },
      cv: () => (cv.files.length ? '' : 'Lütfen CV\'nizi ekleyin (PDF, DOC ya da DOCX).'),
      kvkk: () => (el('kvkk').checked ? '' : 'Devam etmek için çalışan adayı aydınlatma metnini okuduğunuzu onaylayın.')
    };
    const control = (name) => (name === 'cv' || name === 'portfolyo' ? $('#f-' + name, form) : form.elements[name]);
    function setError(name, msg) {
      const err = $('#e-' + CSS.escape(name), form);
      if (err) err.textContent = msg || '';
      const c = control(name);
      if (c && c.nodeType === 1) { if (msg) c.setAttribute('aria-invalid', 'true'); else c.removeAttribute('aria-invalid'); }
    }
    function validate() {
      let first = null;
      Object.keys(RULES).forEach((name) => { const msg = RULES[name](); setError(name, msg); if (msg && !first) first = name; });
      return first;
    }
    form.addEventListener('change', (e) => {
      const name = e.target.name;
      if (e.target.type === 'file') return;      // dosya alanlarını fileField yönetir (tür/boyut mesajı korunur)
      if (RULES[name] && $('#e-' + CSS.escape(name), form)?.textContent) setError(name, RULES[name]());
    });
    form.addEventListener('input', (e) => {
      const name = e.target.name;
      if (RULES[name] && $('#e-' + CSS.escape(name), form)?.textContent && !RULES[name]()) setError(name, '');
    });

    let sending = false;
    function showAlert(message) {
      alertBox.replaceChildren();
      const p1 = document.createElement('p');
      p1.textContent = message;
      const p2 = document.createElement('p');
      p2.innerHTML = 'Sorun sürerse CV\'nizi <a href="mailto:proje@sibelaydinmimarlik.com.tr?subject=%C4%B0%C5%9F%20ba%C5%9Fvurusu">proje@sibelaydinmimarlik.com.tr</a> adresine e-postayla da gönderebilirsiniz.';
      alertBox.append(p1, p2);
      alertBox.hidden = false;
      alertBox.focus();
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (sending) return;
      const bad = validate();
      if (bad) { control(bad).focus(); return; }
      sending = true;
      alertBox.hidden = true;
      submit.setAttribute('aria-disabled', 'true');
      status.className = 'form-status';
      status.textContent = 'Gönderiliyor…';
      const fd = new FormData(form);
      fd.delete('cv'); fd.delete('portfolyo[]');
      cv.files.forEach((f) => fd.append('cv', f, f.name));
      pf.files.forEach((f) => fd.append('portfolyo[]', f, f.name));
      const alan = el('alan').value;
      const xhr = new XMLHttpRequest();
      xhr.open('POST', form.action);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.upload.addEventListener('progress', (ev) => {
        if (ev.lengthComputable) status.textContent = 'Gönderiliyor… %' + Math.round((ev.loaded / ev.total) * 100);
      });
      const fail = (message) => {
        sending = false;
        submit.removeAttribute('aria-disabled');
        status.textContent = '';
        showAlert(message || 'Başvurunuz şu anda gönderilemedi. Bilgileriniz formda duruyor; lütfen tekrar deneyin.');
      };
      xhr.addEventListener('load', () => {
        let data = null;
        try { data = JSON.parse(xhr.responseText); } catch (err) { /* PHP çalışmıyor ya da beklenmeyen yanıt */ }
        if (data && data.ok) {
          status.textContent = 'Başvurunuz alındı, yönlendiriliyorsunuz…';
          let done = false;
          const once = () => { if (!done) { done = true; location.href = data.redirect || '/kariyer/tesekkurler/'; } };
          window.dataLayer.push({ event: 'form_submit', form_type: 'basvuru', alan: alan, page_path: location.pathname, eventCallback: once, eventTimeout: 1500 });
          setTimeout(once, 600);
          return;
        }
        if (xhr.status === 422 && data && data.errors) {
          Object.keys(data.errors).forEach((name) => setError(name, data.errors[name]));
          const first = Object.keys(RULES).concat('portfolyo').find((n) => data.errors[n]);
          if (first && control(first)) control(first).focus({ preventScroll: false });
        }
        fail(data && data.message);
      });
      xhr.addEventListener('error', () => fail());
      xhr.send(fd);
    });
  }

  function initProjectForm() {
    const form = $('[data-project-form]');
    if (!form) return;
    form.classList.add('pf-enhanced');
    const steps = $$('.pf-step', form);
    const back = $('[data-pf-back]', form), next = $('[data-pf-next]', form), submit = $('[data-pf-submit]', form);
    const alertBox = $('[data-pf-alert]', form), status = $('[data-form-status]', form);
    const el = (name) => form.elements[name];
    const ts = $('[data-form-ts]', form);
    if (ts) ts.value = String(Math.floor(Date.now() / 1000));
    let current = 0;

    // ?hizmet=<slug> → ilgili hizmet seçili gelsin
    const want = new URLSearchParams(location.search).get('hizmet');
    if (want) {
      const box = $('input[name="hizmetler[]"][value="' + CSS.escape(PF_SERVICE_MAP[want] || want) + '"]', form);
      if (box) box.checked = true;
    }

    // İl → ilçe listesi (JS kapalıyken tüm ilçeler optgroup'larla tek listede)
    const il = el('il'), ilce = el('ilce');
    const ilceField = $('[data-ilce-select]', form), digerField = $('[data-ilce-diger]', form);
    const ilceByIl = {};
    $$('optgroup', ilce).forEach((g) => { ilceByIl[g.label] = $$('option', g).map((o) => o.value); });
    function syncIlce() {
      const v = il.value;
      const isOther = v === 'Diğer';
      digerField.hidden = !isOther;
      ilceField.hidden = isOther || !v;
      if (isOther || !v) return;
      const keep = ilce.value;
      ilce.replaceChildren(new Option('İlçe seçin', ''), ...(ilceByIl[v] || []).map((d) => new Option(d, d)));
      if ((ilceByIl[v] || []).includes(keep)) ilce.value = keep;
    }
    il.addEventListener('change', () => { syncIlce(); setError('il', ''); setError('ilce', ''); setError('ilce_diger', ''); });
    $('label[for="f-ilce-diger"] .field__opt', form)?.remove();
    syncIlce();

    // Telefon: 0532 123 45 67 / +90 532 123 45 67 biçiminde otomatik boşluk
    const tel = el('telefon');
    phoneMask(tel);

    // Açıklama sayacı
    const desc = el('aciklama'), counter = $('[data-counter]', form);
    const count = () => { counter.textContent = desc.value.length + ' / 3000'; };
    desc.addEventListener('input', count);
    count();

    // Dosyalar: sürükle-bırak + seç, önizleme listesi, tek tek kaldırma (ortak bileşen: fileField)
    const input = $('#f-dosyalar', form);
    const ff = fileField($('[data-dropzone]', form), {
      types: PF_FILE_TYPES, typeLabel: 'JPG, PNG, HEIC, WEBP, PDF, DWG, DXF', maxFiles: PF_MAX_FILES, maxFile: PF_MAX_FILE, maxTotal: PF_MAX_TOTAL,
      onError: (msg) => setError('dosyalar', msg)
    });
    const files = ff.files;

    // Doğrulama (sunucu aynı kuralları tekrar uygular)
    const checked = (name) => $$('input[name="' + name + '"]:checked', form);
    const m2ok = (v) => !v.trim() || /^\d{1,7}([.,]\d{1,2})?$/.test(v.replace(/\s/g, ''));
    const RULES = {
      1: {
        proje_turu: () => (checked('proje_turu').length ? '' : 'Lütfen proje türünü seçin.'),
        hizmetler: () => (checked('hizmetler[]').length ? '' : 'Lütfen en az bir hizmet seçin.'),
        asama: () => (checked('asama').length ? '' : 'Lütfen projenizin aşamasını seçin.'),
        il: () => (il.value ? '' : 'Lütfen il seçin.'),
        ilce: () => (!il.value || il.value === 'Diğer' || ilce.value ? '' : 'Lütfen ilçe seçin.'),
        ilce_diger: () => (il.value !== 'Diğer' || el('ilce_diger').value.trim().length >= 2 ? '' : 'Lütfen il ve ilçeyi yazın.'),
        arsa_m2: () => (m2ok(el('arsa_m2').value) ? '' : 'Lütfen metrekareyi yalnızca sayı olarak yazın (ör. 450).'),
        yapi_m2: () => (m2ok(el('yapi_m2').value) ? '' : 'Lütfen metrekareyi yalnızca sayı olarak yazın (ör. 450).')
      },
      2: {
        aciklama: () => { const n = desc.value.trim().length; return n >= 20 && n <= 3000 ? '' : 'Proje açıklaması 20 ile 3000 karakter arasında olmalı.'; }
      },
      3: {
        ad_soyad: () => (el('ad_soyad').value.trim().length >= 2 ? '' : 'Lütfen adınızı ve soyadınızı yazın.'),
        telefon: () => { const d = tel.value.replace(/\D/g, ''); return d.length >= 10 && d.length <= 13 ? '' : 'Lütfen geçerli bir telefon numarası yazın.'; },
        eposta: () => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el('eposta').value.trim()) ? '' : 'Lütfen geçerli bir e-posta adresi yazın.'),
        kvkk: () => (el('kvkk').checked ? '' : 'Devam etmek için KVKK Aydınlatma Metni\'ni okuduğunuzu onaylayın.')
      }
    };
    const stepOf = (name) => (name === 'dosyalar' ? 2 : Number(Object.keys(RULES).find((s) => name in RULES[s]) || 3));
    function setError(name, msg) {
      const err = $('#e-' + CSS.escape(name), form);
      if (err) err.textContent = msg || '';
      const target = name === 'hizmetler' ? null : form.elements[name];
      if (target && target.nodeType === 1 && !(target instanceof RadioNodeList)) {
        if (msg) target.setAttribute('aria-invalid', 'true'); else target.removeAttribute('aria-invalid');
      }
    }
    function firstInvalidControl(name) {
      if (name === 'hizmetler') return $('input[name="hizmetler[]"]', form);
      if (name === 'dosyalar') return input;
      const c = form.elements[name];
      return c instanceof RadioNodeList ? c[0] : c;
    }
    function validateStep(n) {
      let first = null;
      Object.keys(RULES[n]).forEach((name) => {
        const msg = RULES[n][name]();
        setError(name, msg);
        if (msg && !first) first = name;
      });
      return first;
    }
    // Hatalı alan düzeltilince hata kalksın
    form.addEventListener('change', (e) => {
      const name = (e.target.name || '').replace('[]', '');
      const n = stepOf(name);
      if (RULES[n] && RULES[n][name] && $('#e-' + CSS.escape(name), form)?.textContent) setError(name, RULES[n][name]());
    });

    function show(i, focus) {
      current = i;
      steps.forEach((s, k) => s.classList.toggle('is-current', k === i));
      back.hidden = i === 0;
      next.hidden = i === steps.length - 1;
      submit.hidden = i !== steps.length - 1;
      $('[data-pf-num]', form).textContent = String(i + 1);
      $('[data-pf-name]', form).textContent = steps[i].dataset.stepName;
      $('[data-pf-bar]', form).style.setProperty('--p', String((i + 1) / steps.length));
      window.dataLayer.push({ event: 'form_step', step: i + 1, page_path: location.pathname });
      if (focus) {
        const card = form.closest('.form-card');
        if (card.getBoundingClientRect().top < 0) card.scrollIntoView({ block: 'start', behavior: motionOK ? 'smooth' : 'auto' });
        $('.pf-step__title', steps[i]).focus({ preventScroll: true });
      }
    }
    next.addEventListener('click', () => {
      const bad = validateStep(current + 1);
      if (bad) { firstInvalidControl(bad).focus(); return; }
      show(current + 1, true);
    });
    back.addEventListener('click', () => show(current - 1, true));
    show(0, false);

    // Gönderim
    let sending = false;
    const waFallback = WA_BASE + '?text=' + encodeURIComponent('Merhaba, web sitenizden proje talebi göndermeye çalıştım ancak form hata verdi. Projem hakkında bilgi vermek istiyorum.');
    function showAlert(message) {
      alertBox.replaceChildren();
      const p1 = document.createElement('p');
      p1.textContent = message;
      const p2 = document.createElement('p');
      p2.innerHTML = 'Dilerseniz talebinizi <a target="_blank" rel="noopener" data-wa-keep>WhatsApp\'tan iletin</a> ya da <a href="tel:+905368475640">0536 847 56 40</a> numarasını arayın.';
      $('a', p2).href = waFallback;
      alertBox.append(p1, p2);
      alertBox.hidden = false;
      alertBox.focus();
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (sending) return;
      // Son adımdan önce Enter: gönderme, sonraki adıma geç
      if (current < steps.length - 1) { next.click(); return; }
      for (let n = 1; n <= 3; n++) {
        const bad = validateStep(n);
        if (bad) { show(n - 1, false); firstInvalidControl(bad).focus(); return; }
      }
      sending = true;
      alertBox.hidden = true;
      submit.setAttribute('aria-disabled', 'true');
      back.setAttribute('aria-disabled', 'true');
      status.className = 'form-status';
      status.textContent = 'Gönderiliyor…';

      const fd = new FormData(form);
      fd.delete('dosyalar[]');
      files.forEach((f) => fd.append('dosyalar[]', f, f.name));
      const projeTuru = (checked('proje_turu')[0] || {}).value || null;
      const hizmetSayisi = checked('hizmetler[]').length;

      const xhr = new XMLHttpRequest();
      xhr.open('POST', form.action);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.upload.addEventListener('progress', (ev) => {
        if (ev.lengthComputable && files.length) status.textContent = 'Gönderiliyor… %' + Math.round((ev.loaded / ev.total) * 100);
      });
      const fail = (message) => {
        sending = false;
        submit.removeAttribute('aria-disabled');
        back.removeAttribute('aria-disabled');
        status.textContent = '';
        showAlert(message || 'Talebiniz şu anda gönderilemedi. Bilgileriniz formda duruyor; lütfen tekrar deneyin.');
      };
      xhr.addEventListener('load', () => {
        let data = null;
        try { data = JSON.parse(xhr.responseText); } catch (err) { /* PHP çalışmıyor ya da beklenmeyen yanıt */ }
        if (data && data.ok) {
          status.textContent = 'Talebiniz alındı, yönlendiriliyorsunuz…';
          const go = () => { location.href = data.redirect || '/projenizi-anlatin/tesekkurler/'; };
          let done = false;
          const once = () => { if (!done) { done = true; go(); } };
          window.dataLayer.push({ event: 'form_submit', form_type: 'proje', proje_turu: projeTuru, hizmet_sayisi: hizmetSayisi, page_path: location.pathname, eventCallback: once, eventTimeout: 1500 });
          setTimeout(once, 600);
          return;
        }
        if (xhr.status === 422 && data && data.errors) {
          Object.keys(data.errors).forEach((name) => setError(name, data.errors[name]));
          const firstStep = Math.min(...Object.keys(data.errors).map(stepOf));
          show(firstStep - 1, false);
        }
        fail(data && data.message);
      });
      xhr.addEventListener('error', () => fail());
      xhr.send(fd);
    });
  }

  /* ---------------------------------------------------------------- Teşekkür sayfası: ?no=<TALEP_NO> */
  function initThanks() {
    const box = $('[data-thanks]');
    if (!box) return;
    const no = new URLSearchParams(location.search).get('no') || '';
    const kind = box.dataset.thanks || 'proje';          // "proje" | "basvuru"
    const valid = (kind === 'basvuru' ? /^SA-BSV-\d{4}-(\d{4}|R[0-9A-F]{4})$/ : /^SA-\d{4}-(\d{4}|R[0-9A-F]{4})$/).test(no);
    const wa = $('[data-thanks-wa]', box);
    if (valid) {
      $('[data-thanks-no]', box).textContent = no;
      $('[data-thanks-line]', box).hidden = false;
    }
    if (!wa) return;
    wa.href = WA_BASE + '?text=' + encodeURIComponent(valid
      ? 'Merhaba, web sitenizden ' + no + ' numaralı proje talebini gönderdim.'
      : 'Merhaba, web sitenizden proje talebi gönderdim.');
  }

  /* ---------------------------------------------------------------- RÖNTGEN MERCEĞİ (3D Görselleştirme)
     lens: imleci yumuşak takip eden mercek (mask-position + transform)
     slider: dokunmatik/dar ekranda karşılaştırma kaydırıcısı (transform)
     static: hareket kapalı → iki görsel yan yana (yalnız CSS) */
  function initXray() {
    const root = $('[data-xray]');
    if (!root) return;
    const stage = $('[data-xray-stage]', root), top = $('[data-xray-top]', root), inner = $('[data-xray-top-inner]', root);
    const ring = $('[data-xray-ring]', root), handle = $('[data-xray-handle]', root), range = $('[data-xray-range]', root);
    const toggle = $('[data-xray-toggle]', root), toggleLabel = $('[data-xray-toggle-label]', root), hint = $('[data-xray-hint]', root);
    const lensMQ = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)');
    const motion = doc.classList.contains('motion');
    let mode = '', W = 0, H = 0, full = false, raf = 0;
    let tx = 0.5, ty = 0.42, cx = tx, cy = ty;          // mercek hedefi / mevcut (0–1)

    const measure = () => {
      const r = stage.getBoundingClientRect(); W = r.width; H = r.height;
      if (mode === 'lens') top.style.webkitMaskSize = top.style.maskSize = `${2 * W}px ${2 * H}px`;
    };
    const drawLens = () => {
      const x = cx * W, y = cy * H;
      top.style.webkitMaskPosition = top.style.maskPosition = `${x - W}px ${y - H}px`;
      ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const tick = () => {
      raf = 0;
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      if (Math.abs(tx - cx) < 0.0005 && Math.abs(ty - cy) < 0.0005) { cx = tx; cy = ty; }
      drawLens();
      if (cx !== tx || cy !== ty) raf = requestAnimationFrame(tick);
    };
    const setSlider = (p) => {
      top.style.transform = `translate3d(${p}%, 0, 0)`;
      inner.style.transform = `translate3d(${-p}%, 0, 0)`;
      handle.style.transform = `translate3d(${(p / 100) * W}px, 0, 0)`;
    };
    const setFull = (on) => {
      full = on;
      root.classList.toggle('xray--full', on);
      toggle.setAttribute('aria-pressed', String(on));
      toggleLabel.textContent = on ? 'Tel kafes görünümünü kapat' : 'Tel kafes görünümünü aç';
      if (mode === 'slider') { range.value = on ? 100 : 50; setSlider(+range.value); }
    };
    const setMode = () => {
      const next = !motion ? 'static' : lensMQ.matches ? 'lens' : 'slider';
      if (next === mode) {
        measure();
        if (mode === 'lens') drawLens(); else if (mode === 'slider') setSlider(+range.value);
        return;
      }
      mode = next;
      root.classList.remove('xray--lens', 'xray--slider', 'xray--static');
      root.classList.add('xray--' + mode);
      top.style.transform = inner.style.transform = top.style.maskPosition = top.style.webkitMaskPosition = '';
      measure();
      if (mode === 'lens') { hint.textContent = 'Merceği görselin üzerinde gezdirin; tıklayınca tüm yapı tel kafese döner.'; drawLens(); }
      if (mode === 'slider') { hint.textContent = 'Kaydırıcıyı sürükleyin: solda tel kafes, sağda render.'; setSlider(+range.value); }
      if (mode === 'static') hint.textContent = 'Solda tel kafes, sağda render görünümü.';
    };

    stage.addEventListener('pointermove', (e) => {
      if (mode !== 'lens') return;
      const r = stage.getBoundingClientRect();
      tx = clamp01((e.clientX - r.left) / r.width); ty = clamp01((e.clientY - r.top) / r.height);
      hint.classList.add('is-hidden');
      if (!raf) raf = requestAnimationFrame(tick);
    });
    stage.addEventListener('click', () => { if (mode === 'lens') setFull(!full); });
    toggle.addEventListener('click', () => setFull(!full));          // Enter/Space: yerel buton davranışı
    range.addEventListener('input', () => { setSlider(+range.value); if (full && +range.value !== 100) setFull(false); hint.classList.add('is-hidden'); });
    lensMQ.addEventListener('change', setMode);
    window.addEventListener('resize', () => requestAnimationFrame(setMode));
    setMode();
  }

  /* ---------------------------------------------------------------- STÜDYO (malzeme × ışık)
     Radio grupları (yerel klavye desteği); seçim değişince 500 ms crossfade.
     İlk kombinasyon dışındaki görseller bölüm görünür olunca yüklenir. */
  function initStudio() {
    const root = $('[data-studio]');
    if (!root) return;
    const pics = $$('[data-combo]', root);
    const live = $('[data-studio-live]', root);
    const load = (pic) => {
      $$('[data-srcset]', pic).forEach((el) => { el.srcset = el.dataset.srcset; el.removeAttribute('data-srcset'); });
      const img = $('img', pic);
      if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
      return img;
    };
    const loadAll = () => pics.forEach(load);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((en) => { if (en.some((e) => e.isIntersecting)) { io.disconnect(); loadAll(); } }, { rootMargin: '400px 0px' });
      io.observe(root);
    } else loadAll();

    const current = () => {
      const m = $('input[name="studyo-malzeme"]:checked', root), l = $('input[name="studyo-isik"]:checked', root);
      return { m: m.value, l: l.value, mName: m.dataset.label, lName: l.dataset.label };
    };
    let seq = 0;
    root.addEventListener('change', (e) => {
      if (!e.target.matches('input[type="radio"]')) return;
      const s = current(), key = `${s.m}-${s.l}`, my = ++seq;
      const pic = pics.find((p) => p.dataset.combo === key);
      const img = load(pic);
      const show = () => {
        if (my !== seq) return;                                    // hızlı ardışık seçimlerde son seçim kazanır
        pics.forEach((p) => { const on = p === pic; p.classList.toggle('is-active', on); on ? p.removeAttribute('aria-hidden') : p.setAttribute('aria-hidden', 'true'); });
        live.textContent = `Gösterilen: ${s.mName}, ${s.lName.toLocaleLowerCase('tr')} ışığı`;
      };
      (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(show);
      window.dataLayer.push({ event: 'studio_interaction', malzeme: s.m, isik: s.l, page_path: location.pathname });
    });
  }

  function initHero() {
    const hero = $('[data-hero]');
    if (!hero) return;
    const stage = $('[data-hero-stage]', hero);
    const poster = $('[data-hero-poster]', hero);
    const canvas = $('[data-hero-canvas]', hero);
    const line1 = $('[data-hero-line="1"]', hero);
    const line2 = $('[data-hero-line="2"]', hero);
    const final = $('[data-hero-final]', hero);
    const scrollHint = $('[data-hero-scroll]', hero);
    const bar = $('[data-hero-bar]', hero);
    const loadBar = $('[data-hero-load]', hero);
    const gsapOK = !!(window.gsap && window.ScrollTrigger);

    // Klavye ile hero butonlarına gelinirse metni görünür yap.
    hero.addEventListener('focusin', (e) => { if (final.contains(e.target)) hero.classList.add('is-focus'); });
    hero.addEventListener('focusout', (e) => { if (!final.contains(e.relatedTarget)) hero.classList.remove('is-focus'); });

    /* Statik mod: reduced-motion, saveData veya GSAP yüklenemedi */
    if (!doc.classList.contains('motion') || !gsapOK) {
      doc.classList.remove('motion');
      stage.classList.add('is-static');
      $$('source', poster.parentElement).forEach((s) => s.remove());
      if (poster.getAttribute('src') !== HERO_SEQ.staticImage) {
        poster.classList.remove('is-missing');
        poster.src = HERO_SEQ.staticImage;
      }
      return;
    }

    const isMobile = matchMedia(HERO_SEQ.mobileQuery).matches;
    const set = isMobile ? HERO_SEQ.mobile : HERO_SEQ.desktop;
    const ph = heroPhases(set, HERO_SEQ.stages[isMobile ? 'mobile' : 'desktop']);
    const N = set.count;
    // Aşama göstergesi
    const stagesBox = $('[data-hero-stages]', hero);
    const stageItems = stagesBox ? $$('[data-stage]', stagesBox) : [];
    const stageNum = stagesBox && $('[data-stage-num]', stagesBox);
    const stageName = stagesBox && $('[data-stage-name]', stagesBox);
    const stageBar = stagesBox && $('[data-stage-bar]', stagesBox);
    let activeStage = -1;
    const frames = new Array(N);
    const ctx = canvas.getContext('2d', { alpha: false });
    let placeholderMode = false;
    let loaded = 0;
    let target = 0;       // ScrollTrigger ilerlemesi
    let current = 0;      // yumuşatılmış ilerleme
    let drawnIndex = -1;
    let rafId = 0;
    let cw = 0, ch = 0;

    let ext = set.ext;
    const frameUrl = (i) => set.dir + set.prefix + String(i + 1).padStart(HERO_SEQ.pad, '0') + ext;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = Math.round(stage.clientWidth * dpr);
      ch = Math.round(stage.clientHeight * dpr);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      drawnIndex = -1;
      render(true);
    }

    function nearestLoaded(i) {
      if (frames[i]) return i;
      for (let d = 1; d < N; d++) {
        if (i - d >= 0 && frames[i - d]) return i - d;
        if (i + d < N && frames[i + d]) return i + d;
      }
      return -1;
    }

    function drawCover(img) {
      const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      const s = Math.max(cw / iw, ch / ih);
      const dw = iw * s, dh = ih * s;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    }

    // Dosyalar yoksa: gri, numaralı yer tutucu kare
    function drawPlaceholder(i) {
      const t = i / (N - 1);
      const g = Math.round(222 - t * 40);
      ctx.fillStyle = 'rgb(' + (g - 2) + ',' + g + ',' + g + ')';
      ctx.fillRect(0, 0, cw, ch);
      ctx.strokeStyle = 'rgba(30,30,30,.12)';
      ctx.lineWidth = Math.max(1, cw / 1200);
      const step = Math.round(Math.min(cw, ch) / 12);
      ctx.beginPath();
      for (let x = 0; x < cw; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, ch); }
      for (let y = 0; y < ch; y += step) { ctx.moveTo(0, y); ctx.lineTo(cw, y); }
      ctx.stroke();
      const fs = Math.round(Math.min(cw, ch) / 7);
      ctx.fillStyle = 'rgba(30,30,30,.35)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '500 ' + fs + 'px "Instrument Sans", system-ui, sans-serif';
      ctx.fillText(String(i + 1).padStart(HERO_SEQ.pad, '0') + ' / ' + N, cw / 2, ch * 0.66);
      ctx.font = '400 ' + Math.round(fs / 4.5) + 'px "Instrument Sans", system-ui, sans-serif';
      ctx.fillText('YER TUTUCU KARE — ' + set.prefix + '*.webp bulunamadı', cw / 2, ch * 0.66 + fs * 0.75);
    }

    function render(force) {
      const i = Math.min(N - 1, Math.round(current * (N - 1)));
      if (placeholderMode) {
        if (force || i !== drawnIndex) { drawPlaceholder(i); drawnIndex = i; }
        return;
      }
      const j = nearestLoaded(i);
      if (j < 0) return;
      if (force || j !== drawnIndex) { drawCover(frames[j]); drawnIndex = j; }
    }

    function fade(p, ph) {
      if (p <= ph[0] || p >= ph[3]) return 0;
      if (p < ph[1]) return (p - ph[0]) / (ph[1] - ph[0]);
      if (p <= ph[2]) return 1;
      return 1 - (p - ph[2]) / (ph[3] - ph[2]);
    }

    function applyStage(p) {
      if (!stagesBox) return;
      let k = 0;
      ph.labels.forEach((start, i) => { if (p >= start) k = i; });
      if (k !== activeStage) {
        activeStage = k;
        stageItems.forEach((li, i) => li.classList.toggle('is-active', i === k));
        stageNum.textContent = String(k + 1).padStart(2, '0');
        stageName.textContent = HERO_SEQ.stageNames[k];
      }
      stageBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      stagesBox.classList.toggle('is-hidden', p >= 0.999);   // hero (pin) bitince kaybolur
    }

    function applyText(p) {
      const o1 = fade(p, ph.line1), o2 = fade(p, ph.line2), o3 = fade(p, ph.final);
      applyStage(p);
      line1.style.opacity = o1;
      line1.style.transform = 'translateY(' + (-(1 - o1) * 16).toFixed(1) + 'px)';
      line2.style.opacity = o2;
      line2.style.transform = 'translateY(' + ((p < ph.line2[2] ? 1 : -1) * (1 - o2) * 16).toFixed(1) + 'px)';
      final.style.opacity = o3;
      final.style.transform = 'translateY(' + ((1 - o3) * 20).toFixed(1) + 'px)';
      final.classList.toggle('is-active', o3 > 0.5);
      stage.style.setProperty('--final', o3.toFixed(3));
      // İlk evrelerde ek koyuluk (gerekirse); son görsele yaklaştıkça azalır
      // Ölçüm (gerçek kareler): bu katman olmadan 1. ve 2. cümle masaüstünde 3:1'in altına düşüyor.
      // Katman 2. cümle kaybolana kadar tam, ardından H1 görünmeden sönümlenir (H1'in kendi katmanı var).
      const early = p <= ph.line2[2] ? 1 : 1 - clamp01((p - ph.line2[2]) / (ph.final[1] - ph.line2[2]));
      stage.style.setProperty('--early', early.toFixed(3));
      scrollHint.classList.toggle('is-hidden', p > 0.02);
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }

    function tick() {
      rafId = 0;
      const diff = target - current;
      current = Math.abs(diff) < 0.0005 ? target : current + diff * 0.18;
      render(false);
      applyText(current);
      if (current !== target) rafId = requestAnimationFrame(tick);
    }
    function schedule() { if (!rafId) rafId = requestAnimationFrame(tick); }

    function onFrameLoaded(i, img) {
      frames[i] = img;
      loaded++;
      loadBar.style.transform = 'scaleX(' + (loaded / N).toFixed(3) + ')';
      if (loaded === N) loadBar.classList.add('is-done');
      const want = Math.min(N - 1, Math.round(current * (N - 1)));
      if (Math.abs(i - want) < Math.abs(drawnIndex - want)) render(true);
    }

    function loadImage(i) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => resolve(img));
        };
        img.onerror = reject;
        img.src = frameUrl(i);
      });
    }

    // Önce her 10. kare (animasyon hemen kaba haliyle çalışsın), sonra aradakiler
    // (önce 5'er, sonra kalanlar: boşluklar dengeli dolsun).
    function loadOrder() {
      const order = [], seen = new Set([0]);
      HERO_SEQ.preloadSteps.forEach((step) => {
        for (let i = 0; i < N; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
      });
      if (!seen.has(N - 1)) order.splice(0, 0, N - 1);
      return order;
    }

    function preloadRest() {
      const queue = loadOrder();
      const workers = 6;
      const next = () => {
        const i = queue.shift();
        if (i === undefined) return;
        loadImage(i).then((img) => onFrameLoaded(i, img), () => {}).then(next);
      };
      for (let w = 0; w < workers; w++) next();
    }

    function whenIdle(fn) {
      const go = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));
      if (document.readyState === 'complete') go();
      else window.addEventListener('load', go, { once: true });
    }

    // Format seçimi (masaüstünde AVIF testi bir kez), sonra ilk kare + arka planda kalanlar
    (isMobile || !set.avif ? Promise.resolve(false) : supportsAvif()).then((avif) => {
      if (avif) ext = set.avif.ext;
      return loadImage(0);
    }).then((img) => {
      onFrameLoaded(0, img);
      resize();
      poster.classList.add('is-hidden');
      whenIdle(preloadRest);
    }, () => {
      placeholderMode = true;
      loaded = N;
      loadBar.classList.add('is-done');
      poster.classList.add('is-missing');
      resize();
    });

    resize();
    applyText(0);

    let resizeRaf = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(resize);
    });

    const ST = window.ScrollTrigger;
    window.gsap.registerPlugin(ST);
    ST.create({
      trigger: stage,
      start: 'top top',
      end: () => '+=' + Math.round(window.innerHeight * HERO_SEQ.scrollLength),
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => { target = clamp01(self.progress); schedule(); },
      onRefresh: (self) => { target = clamp01(self.progress); current = target; schedule(); updateHeader(); }
    });
  }

  /* ---------------------------------------------------------------- WhatsApp: şantiye karakteri
     Senaryo (GSAP, oturumda bir kez): sağdan yürüyüp WhatsApp butonunu yerine iter → baretini düzeltir →
     bayrağı kaldırır ("Size nasıl yardımcı olabiliriz?") → ~8 sn ya da kaydırınca bayrak toplanır.
     Masaüstü: karakter butonun yanında küçük kalır (≥20 sn'de bir baret düzeltme). Mobil: sağa çıkar.
     Ana sayfada hero (pin) bittikten sonra, iç sayfalarda yüklemeden 3 sn sonra başlar.
     İç sayfalarda GSAP yalnızca senaryo oynayacaksa (aynı CDN dosyası) yüklenir.
     Yalnızca transform/opacity; katman position: fixed (CLS yok). */
  function initMascot() {
    const fab = $('.wa-fab');
    if (!fab) return;
    const KEY = 'sa-maskot';                       // 'oynadi' | 'kapali'
    const store = (v) => { try { if (v === undefined) return sessionStorage.getItem(KEY); sessionStorage.setItem(KEY, v); } catch (e) { /* depolama kapalı */ } return null; };
    const state = store();
    const mobile = matchMedia('(max-width: 767px)').matches;
    const still = !doc.classList.contains('motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (state === 'kapali' || (state === 'oynadi' && mobile)) return;

    let OFF = 170;                                 // ekran dışı başlangıç (px, --k ile ölçeklenir)
    const SHIFT = { big: -64, small: -50 };        // karakter görünürken butonun sola kayması (px, --k = 1 için)
    const FLAG_TEXT = 'Size nasıl yardımcı olabiliriz?';
    const root = document.createElement('div');
    root.className = 'mascot';
    root.innerHTML = MASCOT_SVG +
      '<div class="mascot__flag" hidden><p class="mascot__flag-text" aria-live="polite"></p>' +
      '<button class="mascot__close" type="button" aria-label="Karakteri kapat"><span aria-hidden="true">×</span></button></div>';
    body.appendChild(root);
    // Ölçek CSS'te (--k: masaüstü 4/3, mobil .9167, kısa ekranda eski boy); kaymalar aynı oranda büyür
    const K = parseFloat(getComputedStyle(root).getPropertyValue('--k')) || 1;
    OFF = Math.round(OFF * K); SHIFT.big = Math.round(SHIFT.big * K); SHIFT.small = Math.round(SHIFT.small * K);
    const part = (n) => $('[data-part="' + n + '"]', root);
    const P = { kolL: part('kolL'), kolR: part('kolR'), baret: part('baret'), bas: part('bas'), govde: part('govde'),
      bacakF: part('bacakF'), bacakB: part('bacakB'), direk: part('direk'), bayrak: part('bayrak') };
    const flag = $('.mascot__flag', root);
    const flagText = $('.mascot__flag-text', root);
    let g = null;                                  // GSAP (senaryo oynarken)
    let small = false, closed = false, away = new Set();

    const setShift = (px, dur) => {
      if (g && dur) g.to(fab, { '--mascot-shift': px + 'px', duration: dur, ease: 'power2.out', overwrite: 'auto' });
      else fab.style.setProperty('--mascot-shift', px + 'px');
    };
    const restShift = () => (closed || away.size ? 0 : mobile ? 0 : small ? SHIFT.small : SHIFT.big);
    // Görünmez olması gereken durumlar: footer alt bandı, form alanına odak, mobil klavye
    const setAway = (reason, on) => {
      const was = away.size > 0;
      on ? away.add(reason) : away.delete(reason);
      const now = away.size > 0;
      if (was === now) return;
      root.classList.toggle('is-away', now);
      root.inert = now;
      setShift(restShift(), 0.4);
    };
    const bottom = $('.footer__bottom');
    if (bottom && 'IntersectionObserver' in window) new IntersectionObserver((es) => setAway('footer', es[0].isIntersecting)).observe(bottom);
    if ($('[data-contact-form], [data-project-form]')) {
      document.addEventListener('focusin', (e) => { if (e.target.matches('input, select, textarea')) setAway('form', true); });
      document.addEventListener('focusout', (e) => { if (e.target.matches('input, select, textarea')) setAway('form', false); });
    }
    if (window.visualViewport) visualViewport.addEventListener('resize', () => setAway('klavye', innerHeight - visualViewport.height > 150));

    // Tıklama: WhatsApp butonuyla aynı link ve aynı dataLayer olayı (placement: floating_button)
    root.addEventListener('click', (e) => {
      if (e.target.closest('.mascot__close')) return;
      if (e.target.closest('.mascot__svg, .mascot__flag')) fab.click();
    });
    $('.mascot__close', root).addEventListener('click', () => {
      closed = true;
      store('kapali');
      flag.hidden = true;
      root.classList.add('is-away');
      root.inert = true;
      setShift(0, 0.4);
      setTimeout(() => root.remove(), 600);
    });

    const showSmall = () => {
      small = true;
      root.classList.add('is-small');
      setShift(restShift(), 0);
      // Ara sıra (20–32 sn) baret düzeltme — CSS anahtar kareleri, yalnızca transform
      if (!still) (function idle() {
        setTimeout(() => {
          if (!root.isConnected) return;
          if (!away.size) { root.classList.add('is-idle'); setTimeout(() => root.classList.remove('is-idle'), 1300); }
          idle();
        }, 20000 + Math.random() * 12000);
      })();
    };
    const openFlag = () => {
      flag.hidden = false;
      if (!flagText.textContent) flagText.textContent = FLAG_TEXT;   // ekran okuyucu bir kez okur
    };

    // Daha önce oynadı (masaüstü): doğrudan son pozisyon
    if (state === 'oynadi') { showSmall(); return; }

    root.classList.add('is-waiting');
    const start = () => {
      if (closed) return;
      store('oynadi');
      root.classList.remove('is-waiting');
      if (still) return playStill();
      loadGsap().then(play, playStill);
    };
    // Hareketsiz: son poz statik, bayrak 8 sn sonra kaybolur
    function playStill() {
      root.classList.add('is-pose');
      setShift(mobile ? 0 : SHIFT.big, 0);
      openFlag();
      setTimeout(() => {
        flag.hidden = true;
        root.classList.remove('is-pose');
        if (mobile) root.remove(); else showSmall();
      }, 8000);
    }
    function play(gsap) {
      g = gsap;
      const so = (x, y) => ({ svgOrigin: x + ' ' + y });
      const walk = (dur) => {
        const steps = Math.round(dur / 0.35);
        const t = gsap.timeline();
        for (let i = 0; i < steps; i++) {
          const s = i % 2 ? 1 : -1;
          t.to(P.bacakF, { rotation: 16 * s, ...so(38, 84), duration: 0.35, ease: 'sine.inOut' }, i * 0.35)
            .to(P.bacakB, { rotation: -16 * s, ...so(43, 84), duration: 0.35, ease: 'sine.inOut' }, i * 0.35)
            .to([P.govde, P.bas, P.kolL, P.kolR], { y: -1.5, duration: 0.175, yoyo: true, repeat: 1, ease: 'sine.inOut' }, i * 0.35);
        }
        return t.to([P.bacakF, P.bacakB], { rotation: 0, duration: 0.15 });
      };
      gsap.set(root, { x: OFF });
      gsap.set(flag, { transformOrigin: '100% 100%' });
      gsap.set(P.kolL, { rotation: 80, ...so(35, 56) });
      const tl = gsap.timeline();
      // 0.0–1.4 sn: buton ekran dışından itilerek yerine gelir; yerine oturunca yaylanır
      tl.to(fab, { opacity: 0, duration: 0.15 })
        .set(fab, { '--mascot-shift': OFF + 'px' })
        .set(fab, { opacity: 1 })
        .addLabel('yuru')
        .to(root, { x: 0, duration: 1.4, ease: 'power1.out' }, 'yuru')
        .to(fab, { '--mascot-shift': SHIFT.big + 'px', duration: 1.4, ease: 'power1.out' }, 'yuru')
        .add(walk(1.4), 'yuru')
        .to(fab, { '--mascot-shift': SHIFT.big - 7 + 'px', duration: 0.12, ease: 'power2.out' }, 'yuru+=1.4')
        .to(fab, { '--mascot-shift': SHIFT.big + 'px', duration: 0.5, ease: 'elastic.out(1, 0.35)' })
        // 1.4–2.2 sn: baret düzeltme
        .to(P.kolL, { rotation: 165, ...so(35, 56), duration: 0.3, ease: 'power2.out' }, 'yuru+=1.45')
        .to(P.baret, { rotation: -9, ...so(41, 30), duration: 0.14, ease: 'power1.inOut' }, 'yuru+=1.72')
        .to(P.baret, { rotation: 0, ...so(41, 30), duration: 0.22, ease: 'back.out(3)' })
        .to(P.kolL, { rotation: 0, ...so(35, 56), duration: 0.3, ease: 'power2.inOut' }, 'yuru+=2.0')
        // 2.2–3.0 sn: bayrak kalkar ve açılır
        .set([P.direk, P.bayrak], { opacity: 1 }, 'yuru+=2.2')
        .to(P.kolR, { rotation: -150, ...so(47, 56), duration: 0.45, ease: 'back.out(1.6)' }, 'yuru+=2.2')
        .call(openFlag, null, 'yuru+=2.55')
        .fromTo(flag, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.45, ease: 'power2.out' }, 'yuru+=2.55')
        .call(() => {
          const wave = gsap.to(flag, { rotation: 1.4, skewY: 1, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
          let y0 = scrollY, done = false;
          const fold = () => {
            if (done || closed) return;
            done = true;
            removeEventListener('scroll', onScroll);
            wave.kill();
            const t = gsap.timeline();
            t.to(flag, { scaleX: 0, opacity: 0, rotation: 0, skewY: 0, duration: 0.35, ease: 'power2.in' })
              .call(() => { flag.hidden = true; })
              .to(P.kolR, { rotation: 0, ...so(47, 56), duration: 0.35, ease: 'power2.inOut' })
              .set([P.direk, P.bayrak], { opacity: 0 });
            if (mobile) {
              t.addLabel('cik')
                .to(root, { x: OFF, duration: 1.1, ease: 'power1.in' }, 'cik')
                .add(walk(1.1), 'cik')
                .call(() => root.remove());
            } else {
              t.call(() => { small = true; })
                .to(root, { scale: 0.55, transformOrigin: '100% 100%', duration: 0.5, ease: 'power2.inOut' })
                .add(() => setShift(restShift(), 0.5), '<')
                .call(() => {
                  // Son poz: GSAP dönüşümleri temizlenir; boşta hareket CSS anahtar kareleriyle
                  gsap.set(root, { clearProps: 'transform' });
                  Object.values(P).forEach((el) => { gsap.set(el, { clearProps: 'all' }); el.removeAttribute('transform'); });
                  showSmall();
                });
            }
          };
          const onScroll = () => { if (Math.abs(scrollY - y0) > 160) fold(); };
          setTimeout(() => { y0 = scrollY; addEventListener('scroll', onScroll, { passive: true }); }, 600);
          setTimeout(fold, 8000);
        }, null, 'yuru+=3.0');
    }

    // Tetikleme: ana sayfada hero pin'i bitince, diğer sayfalarda 3 sn sonra
    const stage = $('[data-hero-stage]');
    if (stage && !still && !stage.classList.contains('is-static') && window.ScrollTrigger) {
      const st = () => window.ScrollTrigger.getAll().find((t) => t.trigger === stage);
      const check = () => {
        const t = st();
        if (t ? t.progress >= 1 : stage.getBoundingClientRect().bottom < 0) {
          removeEventListener('scroll', check);
          setTimeout(start, 600);
        }
      };
      addEventListener('scroll', check, { passive: true });
      check();
    } else {
      const go = () => setTimeout(start, 3000);
      if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
    }
  }
  function loadGsap() {
    if (window.gsap) return Promise.resolve(window.gsap);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
      s.onload = () => (window.gsap ? resolve(window.gsap) : reject());
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
})();
