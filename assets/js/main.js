/* ==========================================================================
   Sibel Aydın Mimarlık — main.js (vanilla JS, GSAP + ScrollTrigger yalnızca hero'da)
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
const WA_APPOINTMENT_MSG = 'Merhaba, Sibel Aydın Mimarlık ile görüşme randevusu almak istiyorum. Uygun olduğum gün ve saat: ';
const PROJECTS_URL = '/data/projects.json';
const HOME_PROJECT_LIMIT = 6;
const REVEAL_STAGGER_MS = 80;

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
  // Randevu butonları ([data-appointment]) kendi mesajını taşır; burada atlanır.
  const waMsg = body.dataset.waMsg;
  if (waMsg) {
    $$('a[href^="' + WA_BASE + '"]:not([data-appointment])').forEach((a) => {
      a.href = WA_BASE + '?text=' + encodeURIComponent(waMsg);
    });
  }
  // Randevu mesajı: hizmet sayfalarında <body data-wa-service="…"> ile hizmet adı eklenir
  const service = body.dataset.waService;
  const apptMsg = service
    ? 'Merhaba, Sibel Aydın Mimarlık ile ' + service + ' hakkında görüşme randevusu almak istiyorum. Uygun olduğum gün ve saat: '
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
  $$('.nav a[href^="/"]').forEach((a) => {
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
      f.title = 'Sibel Aydın Mimarlık konumu — Google Haritalar';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.setAttribute('allowfullscreen', '');
      box.innerHTML = '';
      box.appendChild(f);
    });
  });

  /* ---------------------------------------------------------------- Projeler (JSON ile zenginleştirme)
     Kartlar HTML'de statik durur (SEO); JSON gelirse içerik JSON'dan güncellenir. */
  const projectList = $('[data-projects]');
  if (projectList && 'fetch' in window) {
    fetch(PROJECTS_URL, { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        const items = (Array.isArray(data) ? data : data.projeler || []).slice(0, HOME_PROJECT_LIMIT);
        if (items.length) renderProjects(projectList, items);
      })
      .catch(() => { /* statik kartlar kalır */ });
  }

  function projectCard(p) {
    const li = document.createElement('li');
    li.className = 'project-card reveal';
    li.innerHTML =
      '<a><div class="project-card__frame"><div class="media"><img width="1600" height="1200" loading="lazy" decoding="async"></div></div>' +
      '<div class="project-card__meta"><h3 class="project-card__title"></h3><p class="project-card__info"></p></div></a>';
    return li;
  }
  function renderProjects(list, items) {
    const cards = $$('.project-card', list);
    items.forEach((p, i) => {
      let li = cards[i];
      if (!li) { li = projectCard(p); list.appendChild(li); }
      const a = $('a', li);
      const media = $('.media', li);
      const img = $('img', li);
      const area = typeof p.alan_m2 === 'number' ? p.alan_m2.toLocaleString('tr-TR') + ' m²' : '— m²';
      a.href = '/projeler/' + encodeURIComponent(p.slug) + '/';
      $('.project-card__title', li).textContent = p.baslik;
      const info = $('.project-card__info', li);
      info.textContent = '';
      [p.tur, p.konum, area].forEach((t) => {
        const s = document.createElement('span');
        s.textContent = t;
        info.appendChild(s);
      });
      media.dataset.ph = 'Proje kapağı: ' + p.baslik;
      if (p.kapak && img.getAttribute('src') !== p.kapak) {
        media.classList.remove('is-missing');
        img.src = p.kapak;
      }
      img.alt = p.baslik + ' — ' + p.tur + ', ' + p.konum;
      li.dataset.slug = p.slug;
      li.dataset.tur = p.tur;
      if (Array.isArray(p.hizmetler)) li.dataset.hizmetler = p.hizmetler.join('|');
    });
    cards.slice(items.length).forEach((li) => li.remove());
    observeReveals(list);
  }

  /* ---------------------------------------------------------------- HERO */
  initHero();
  initXray();
  initStudio();

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
      ctx.fillStyle = 'rgb(' + g + ',' + (g - 2) + ',' + (g - 6) + ')';
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
})();
