// /hizmetler/santiye-teknik-hizmetler/ içeriği — tools/make-service-page.mjs ile HTML'e dönüşür.
export default {
  title: 'Silivri Şantiye ve Teknik Hizmetler | Kontrollük, Metraj, Keşif – Sibel Aydın İnşaat Mimarlık',
  description: "Silivri ve Büyükçekmece'de mimari kontrollük, şantiye takibi, metraj, keşif ve hakediş hizmetleri. Projenin sahada doğru uygulanması için teknik destek.",
  breadcrumb: 'Şantiye ve Teknik Hizmetler',
  waService: 'Şantiye ve Teknik Hizmetler',
  waMsg: 'Merhaba, web sitenizden yazıyorum. Şantiye ve teknik hizmetleriniz hakkında bilgi almak istiyorum.',
  service: {
    name: 'Silivri Şantiye ve Teknik Hizmetler',
    type: 'Mimari kontrollük, metraj ve keşif',
    description: "Silivri ve Büyükçekmece'de mimari kontrollük, şantiye takibi, metraj, keşif ve hakediş hizmetleri. Projenin sahada doğru uygulanması için teknik destek.",
    cities: ['Silivri', 'Büyükçekmece']
  },
  hero: {
    h1: 'Silivri Şantiye ve Teknik Hizmetler',
    lead: 'Silivri şantiye ve teknik hizmetlerimizle projenizin sahada çizildiği gibi uygulanmasını takip ediyoruz. İşveren tarafında durarak kaliteyi, süreyi ve maliyeti kontrol altında tutuyoruz. Silivri, Büyükçekmece ve çevresinde hizmet veriyoruz.',
    img: '/assets/img/hizmet/santiye-kontrol-cizim-baret',
    alt: 'Şantiye masasında açık proje paftaları, baret, şerit metre ve tablet; arkada iskeleli bina karkası',
    ph: 'Görsel: şantiyede proje kontrolü'
  },
  scope: {
    h2: 'Silivri şantiye ve teknik hizmetlerimiz neleri kapsar?',
    text: 'İnşaatı kim yaparsa yapsın, işverenin sahada kendi adına konuşan bir teknik ekibe ihtiyacı vardır. Bu hizmetle uygulamayı üstlenen firmadan bağımsız olarak projeye uygunluğu, iş kalitesini ve hakedişleri denetliyoruz.',
    // [terim, açıklama, ikon (24×24, ince çizgi)]
    items: [
      ['Mimari kontrollük', 'uygulamanın mimari projeye ve detaylara uygunluğunun denetlenmesi', 'M8 4h8v3H8zM6 5.5H5v15h14v-15h-1M9 13l2 2 4-4'],
      ['Şantiye takibi', 'düzenli saha ziyaretleri, fotoğraflı raporlama ve eksik listeleri', 'M3 17h18v3H3zM5 17a7 7 0 0 1 14 0M10 10V7h4v3'],
      ['Metraj ve keşif', 'iş kalemlerinin ve malzeme miktarlarının projeden çıkarılması', 'M3 16L16 3l5 5L8 21zM7 12l2 2M10 9l2 2M13 6l2 2'],
      ['Hakediş kontrolü', 'yapılan işin miktar ve kalite açısından doğrulanması', 'M6 3h9l4 4v14H6zM15 3v4h4M9 14l2 2 4-4'],
      ['Teklif karşılaştırma', 'farklı firmalardan gelen tekliflerin aynı kalemler üzerinden değerlendirilmesi', 'M3 4h18v16H3zM12 4v16M6 9h3M15 9h3M6 13h2M15 13h2'],
      ['İhale ve proje dokümantasyonu', 'teknik şartname, iş programı ve sözleşme eklerinin hazırlanması', 'M8 3h10v14H8zM5 6v15h10M11 7h4M11 10h4M11 13h2']
    ]
  },
  types: {
    eyebrow: 'Kimler için',
    h2: 'Kimler için çalışıyoruz?',
    cards: [
      { h3: 'Ev ve villa sahipleri', text: 'İnşaatını bir müteahhide yaptıran ama sahada kendi adına güvenilir bir teknik göz isteyen işverenler için.',
        img: '/assets/img/hizmet/villa-santiyesi-donati-kontrolu', alt: 'Döküm öncesi donatısı yerleştirilmiş villa döşemesi; kalıp kenarında baret ve şerit metre', ph: 'Görsel: villa şantiyesinde saha kontrolü' },
      { h3: 'Yatırımcılar', text: 'Birden fazla birimli projelerde bütçe, süre ve kaliteyi düzenli raporlarla izlemek isteyen yatırımcılar için.',
        img: '/assets/img/hizmet/konut-insaati-cephe-isleri', alt: 'Cephesine yalıtım levhaları ve doğramalar takılan, iskele ve güvenlik filesiyle çevrili konut inşaatı', ph: 'Görsel: çok birimli konut şantiyesi' },
      { h3: 'Kurumlar ve işletmeler', text: 'Ofis, mağaza veya tesis yatırımlarında proje ile uygulama arasında koordinasyon ihtiyacı olan kurumlar için.',
        img: '/assets/img/hizmet/ofis-ic-mekan-tasarimi', alt: 'Meşe toplantı masası, keçe duvar panelleri ve traverten bankosu olan ofis iç mekânı', ph: 'Görsel: ofis uygulaması' }
    ]
  },
  steps: [
    ['Proje ve sözleşme incelemesi', 'Projeyi, teklifi ve sözleşmeyi inceleyip kontrol planını hazırlıyoruz.'],
    ['Kontrol planı', 'Hangi aşamada neyin denetleneceğini ve raporlama sıklığını birlikte belirliyoruz.'],
    ['Saha kontrolleri', 'Kritik aşamalarda şantiyede bulunuyor, uygunsuzlukları yerinde tespit ediyoruz.'],
    ['Raporlama', 'Her ziyaretten sonra fotoğraflı kısa rapor ve yapılacaklar listesi paylaşıyoruz.'],
    ['Hakediş ve teslim kontrolü', 'Hakedişleri doğruluyor, teslimde eksik listesiyle kabul sürecine destek oluyoruz.']
  ],
  why: {
    h2: 'Kontrollük neden inşaatın başında planlanmalı?',
    text: 'Temel, karkas ve tesisat gibi aşamalar kapandıktan sonra hataları görmek ve düzeltmek zorlaşır, maliyeti de artar. Kontrollük hizmetini inşaat başlamadan planlamak, kritik aşamaların zamanında denetlenmesini ve sonradan yaşanabilecek anlaşmazlıkların önlenmesini sağlar.',
    note: 'Uygulamayı bizimle yapmak ister misiniz?',
    link: 'İnşaat ve uygulama hizmetini inceleyin',
    href: '/hizmetler/uygulama/'
  },
  related: [
    ['İnşaat ve Uygulama', 'İnşaat ve uygulama hizmetini inceleyin', '/hizmetler/uygulama/'],
    ['Mimari Proje', 'Mimari proje hizmetini inceleyin', '/hizmetler/mimari-proje/'],
    ['Bilirkişilik ve Teknik İnceleme', 'Bilirkişilik hizmetini inceleyin', '/hizmetler/bilirkisilik/']
  ],
  faq: [
    ["Silivri'de şantiye kontrollüğü hizmeti nasıl işler?", 'Önce proje ve sözleşmeyi inceleyip bir kontrol planı çıkarıyoruz. Ardından kritik aşamalarda sahaya gidiyor, her ziyaret sonrasında fotoğraflı rapor ve yapılacaklar listesi paylaşıyoruz.'],
    ['Müteahhitle zaten anlaştım, yine de kontrollük gerekir mi?', 'Kontrollük, müteahhide güvensizlikten çok işin projeye uygun ilerlemesini güvence altına almak içindir. Taraflardan bağımsız bir teknik göz, anlaşmazlıkları azaltır ve kararların zamanında alınmasını sağlar.'],
    ['Metraj ve keşif neden önemlidir?', 'Metraj ve keşif, işin gerçek miktarlarını ortaya koyar. Böylece teklifleri aynı kalemler üzerinden karşılaştırabilir, hakedişlerde ödediğiniz işin karşılığını doğrulayabilirsiniz.'],
    ['Ne sıklıkla şantiyeye geliyorsunuz?', 'Ziyaret sıklığını işin büyüklüğüne ve aşamalarına göre birlikte belirliyoruz. Temel, karkas ve tesisat gibi kritik aşamalarda sahada bulunmayı önceliklendiriyoruz.'],
    ['Bu hizmetin ücreti nasıl belirlenir?', 'Ücret; projenin büyüklüğüne, süresine ve ziyaret sıklığına göre belirlenir. Projenizi incelediğimizde size özel teklif hazırlıyoruz.']
  ],
  cta: {
    h2: 'Şantiyenizi güvence altına alalım',
    text: 'Projenizi ve sözleşmenizi paylaşın, size uygun kontrol planını birlikte çıkaralım.'
  }
};
