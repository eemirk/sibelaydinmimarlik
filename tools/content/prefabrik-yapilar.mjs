// /hizmetler/prefabrik-yapilar/ içeriği — tools/make-service-page.mjs ile HTML'e dönüşür.
// Görseller (fal.ai, temsilî): tools/generate-site-images.mjs → prefabrik-ev, prefabrik-montaj.
// Dosyalar yoksa hero ve ara görsel alanı yazılmaz (hero.optional, types.img kontrolü).
export default {
  title: 'Silivri Prefabrik Ev | Proje, Ruhsat ve Uygulama – Sibel Aydın İnşaat Mimarlık',
  description: "Silivri'de prefabrik ev ve prefabrik yapılar için mimari proje, ruhsat, temel ve montaj tek elden. Arsanıza uygun projeyi birlikte planlayalım.",
  breadcrumb: 'Prefabrik Yapılar',
  waService: 'Prefabrik Yapılar',
  waMsg: 'Merhaba, web sitenizden yazıyorum. Prefabrik yapı hizmetiniz hakkında bilgi almak istiyorum.',
  service: {
    name: 'Silivri Prefabrik Yapılar',
    type: 'Prefabrik yapı projesi ve uygulaması',
    description: 'Prefabrik ev ve prefabrik yapılar için arsa analizi, mimari proje, ruhsat, temel, montaj ve iskân süreçleri tek elden.',
    cities: ['Silivri', 'Büyükçekmece', 'Çatalca']
  },
  hero: {
    h1: 'Silivri Prefabrik Ev ve Prefabrik Yapı Projeleri',
    lead: 'Prefabrik ev hızlı kurulur, ama arsaya uygun projesi çizilmeden, ruhsatı alınmadan ve sağlam bir temele oturtulmadan kalıcı bir yapı olmaz. Sibel Aydın İnşaat Mimarlık olarak prefabrik yapıyı satıcı gözüyle değil, mimar ve uygulayıcı gözüyle ele alıyoruz: arsanızın imar durumunu inceliyor, projeyi seçilen sistemin ölçülerine göre çiziyor, ruhsat sürecini yürütüyor, temeli yapıyor ve montajı yönetiyoruz.',
    img: '/assets/img/hizmet/prefabrik-tek-katli-bahceli-ev',
    alt: 'Trakya kırsalında bahçeli, tek katlı modern prefabrik ev görselleştirmesi',
    ph: 'Görsel: prefabrik ev',
    caption: 'Temsilî görselleştirme',
    optional: true
  },
  intro: {
    eyebrow: 'Önce proje',
    h2: 'Prefabrik yapıda neden önce proje?',
    paras: [
      'Prefabrik yapılar da betonarme bir ev gibi imar mevzuatına ve deprem yönetmeliğine tabidir. İmar planı olan bir parselde yapı ruhsatı gerekir. Kalıcı elektrik ve su aboneliği için de genellikle yapı kullanma izni (iskan) istenir. Ruhsatsız kurulan bir yapı ileride abonelik, satış ve yıkım riski gibi sorunlar doğurabilir.',
      'Bu yüzden işe katalogdan model seçerek değil, parselden başlıyoruz: çekme mesafeleri, taban alanı, kat sayısı ve yönlenme belli olduktan sonra prefabrik sistemi bu koşullara uyarlıyoruz.'
    ]
  },
  scope: {
    eyebrow: 'Kapsam',
    h2: 'Hizmet kapsamı',
    // [terim, açıklama, ikon (24×24, ince çizgi)]
    items: [
      ['Arsa ve imar durumu analizi', 'parselin yapılaşma koşullarını, erişimini ve altyapı durumunu inceliyoruz.', 'M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3zM9 4v13M15 7v13'],
      ['Mimari proje', 'plan ve cepheleri prefabrik sistemin modül ölçülerine göre tasarlıyoruz; kişiye özel düzenleme yapıyoruz.', 'M4 4h16v16H4zM4 10h7v10M11 14h9M15 4v6'],
      ['Statik ve tesisat projeleri', 'projeleri ruhsat dosyasıyla birlikte koordine ediyoruz.', 'M8 3v5M13 3v5M6 8h9v3a4.5 4.5 0 0 1-9 0zM10.5 15.5V21M16 12h2a3 3 0 0 1 3 3v6'],
      ['Ruhsat ve iskan', 'belediye süreçlerini başvurudan yapı kullanma iznine kadar takip ediyoruz.', 'M6 3h9l4 4v14H6zM15 3v4h4M9 14l2 2 4-4'],
      ['Zemin ve temel', 'zemin etüdüne göre temeli (çoğunlukla radye) projelendirip uyguluyoruz.', 'M3 20h18M5 20v-4h14v4M7 16V10l5-4 5 4v6'],
      ['Montaj ve ince işler', 'kurulumu, tesisat bağlantılarını ve iç-dış ince işleri yönetiyoruz.', 'M5 21V4h12M5 4l5 5M10 4v5M17 4v5M15 9h4v4h-4zM3 21h6'],
      ['Çevre düzenlemesi', 'bahçe, teras, otopark ve peyzaj işlerini planlıyoruz.', 'M12 21v-6M12 15a5 5 0 1 0-5-5 4 4 0 0 0 5 5zM4 21h16']
    ]
  },
  types: {
    eyebrow: 'Yapı türleri',
    h2: 'Hangi yapılar için?',
    text: 'Bahçeli müstakil ev, hafta sonu ve yazlık evi, bahçe ofisi, şantiye ve iş yeri binası, depo ve yardımcı yapılar. Her yapı tipinde ruhsat koşulları ve teknik gereksinimler farklıdır; ilk görüşmede bunları birlikte netleştiriyoruz.',
    img: '/assets/img/hizmet/prefabrik-panel-montaji',
    alt: 'Radye temel üzerinde prefabrik duvar panelinin vinçle yerleştirilmesi; uzakta baretli ve yelekli ekip',
    ph: 'Görsel: prefabrik montaj',
    caption: 'Temsilî görselleştirme'
  },
  stepsH2: 'Süreç nasıl ilerliyor?',
  steps: [
    ['Ön görüşme ve arsa incelemesi', ''],
    ['İmar durumu ve fizibilite', ''],
    ['Mimari proje ve sistem seçimi', ''],
    ['Ruhsat dosyası ve onay', ''],
    ['Zemin etüdü ve temel', ''],
    ['Montaj ve ince işler', ''],
    ['İskan ve teslim', '']
  ],
  why: {
    eyebrow: 'Sistem seçimi',
    h2: 'Prefabrik mi, betonarme mi?',
    text: 'İki sistemin de doğru kullanıldığı yerler var. Prefabrik yapı kısa kurulum süresi ve kontrollü üretim kalitesiyle öne çıkar. Betonarme yapı ise plan esnekliği ve kat sayısı açısından daha fazla seçenek sunar. Biz iki sistemle de çalıştığımız için arsanıza, bütçenize ve kullanım amacınıza hangisinin uygun olduğunu tarafsız biçimde karşılaştırıyoruz.',
    note: 'Betonarme bir yapıyı da değerlendiriyorsanız:',
    link: 'betonarme konut ve villa uygulamalarımız',
    href: '/hizmetler/uygulama/'
  },
  related: [
    ['Mimari Proje', 'Mimari proje hizmetini inceleyin', '/hizmetler/mimari-proje/'],
    ['Ruhsat ve İskân Süreçleri', 'Ruhsat ve iskân süreçlerini inceleyin', '/hizmetler/ruhsat-iskan/'],
    ['İnşaat ve Uygulama', 'İnşaat ve uygulama hizmetini inceleyin', '/hizmetler/uygulama/']
  ],
  faq: [
    ['Prefabrik ev için ruhsat gerekir mi?', 'Evet. İmar planı olan bir parselde prefabrik yapı da betonarme yapı gibi yapı ruhsatına tabidir. Ruhsat için mimari, statik ve tesisat projeleri hazırlanır. Kalıcı elektrik ve su aboneliği için de genellikle iskan istenir.'],
    ['Prefabrik eve temel yapılır mı?', 'Evet. Kalıcı bir prefabrik yapı, zemin etüdüne göre projelendirilen bir temele oturtulur; bu temel çoğunlukla betonarme radyedir. Temel, yapının deprem güvenliği ve uzun ömrü için belirleyicidir.'],
    ['Tarlaya ya da imar dışı bir arsaya prefabrik ev kurulabilir mi?', 'İmar planı olmayan alanlarda ve tarım arazilerinde yapılaşma koşulları farklıdır, çoğu zaman da sınırlıdır. Parselin imar durumunu sorgulamadan karar vermemenizi öneririz; ilk görüşmede bu kontrolü birlikte yapıyoruz.'],
    ['Prefabrik ev projesi kişiye özel çizilebilir mi?', 'Evet. Hazır modelleri olduğu gibi kullanmak yerine plan ve cepheyi arsanıza ve ihtiyaçlarınıza göre, seçilen sistemin modül ölçülerine uygun biçimde tasarlıyoruz.'],
    ['Silivri dışında da çalışıyor musunuz?', 'Silivri merkezli çalışıyoruz; Büyükçekmece, Çatalca ve Tekirdağ başta olmak üzere çevre ilçelerdeki projeleri de üstleniyoruz.']
  ],
  cta: {
    h2: 'Prefabrik yapınızı birlikte planlayalım',
    text: 'Arsanızın bilgilerini ve hayalinizdeki yapıyı anlatın; size uygun prefabrik çözümü birlikte planlayalım.'
  }
};
