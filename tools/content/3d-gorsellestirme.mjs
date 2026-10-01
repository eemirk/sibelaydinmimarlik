// /hizmetler/3d-gorsellestirme/ içeriği — tools/make-service-page.mjs ile HTML'e dönüşür.
export default {
  title: 'Silivri 3D Görselleştirme | Mimari Render ve İç Mekân Görselleri – Sibel Aydın Mimarlık',
  description: "Silivri ve Büyükçekmece'de villa, konut ve iç mekân projeleri için gerçekçi 3D görselleştirme ve render. Projenizi inşa edilmeden önce görün.",
  breadcrumb: '3D Görselleştirme',
  waService: '3D Görselleştirme',
  waMsg: 'Merhaba, web sitenizden yazıyorum. 3D görselleştirme hizmetiniz hakkında bilgi almak istiyorum.',
  service: {
    name: 'Silivri 3D Görselleştirme',
    type: 'Mimari 3D görselleştirme ve render',
    description: 'Villa, konut ve iç mekân projeleri için gerçekçi 3D görselleştirme ve render.',
    cities: ['Silivri', 'Büyükçekmece']
  },
  hero: {
    h1: 'Silivri 3D Görselleştirme',
    lead: 'Silivri 3D görselleştirme hizmetimizle projenizi daha inşa edilmeden, gerçeğe yakın görsellerle görmenizi sağlıyoruz. Kararlarınızı çizim üzerinde değil, sonucu görerek veriyorsunuz. Silivri, Büyükçekmece ve çevresinde hizmet veriyoruz.',
    img: '/assets/img/hizmet/3d-gorsellestirme.webp',
    alt: 'Silivri 3D görselleştirme – villa dış cephe render',
    ph: 'Görsel: villa dış cephe render'
  },
  // Hero "röntgen merceği": alt katman tel kafes, üst katman render 3 (tools/build-studio-assets.mjs)
  xray: {
    base: '/assets/img/hizmet/3d-gorsellestirme/xray/telkafes',
    baseAlt: 'Aynı villanın tel kafes görünümü: taşıyıcı sistem, döşemeler ve doğrama çizgileri',
    top: '/assets/img/hizmet/3d-gorsellestirme/xray/render',
    label: 'İskelet',
    hint: 'Merceği görselin üzerinde gezdirin; tıklayınca tüm yapı tel kafese döner.'
  },
  // Stüdyo: aynı salon, 3 malzeme × 2 ışık (Kapsam bölümünden sonra)
  studio: {
    eyebrow: 'Stüdyo',
    h2: 'Kararı görerek verin',
    text: 'Aynı salonu farklı malzeme ve ışık seçenekleriyle deneyin. 3D görselleştirme, bu kararları inşaat başlamadan ve hiçbir masraf yapmadan vermenizi sağlar.',
    dir: '/assets/img/hizmet/3d-gorsellestirme/studyo/',
    materials: [['acik-mese', 'Açık Meşe'], ['koyu-ceviz', 'Koyu Ceviz'], ['traverten', 'Traverten & Taş']],
    lights: [['gunduz', 'Gündüz'], ['aksam', 'Akşam']],
    alt: (m, l) => `Çift yükseklikte villa salonunun 3D görselleştirmesi: ${m} malzeme seti, ${l.toLocaleLowerCase('tr')} ışığı`,
    badge: 'Temsilî görselleştirme örneği'
  },
  scope: {
    h2: 'Silivri 3D görselleştirme hizmetimiz neleri kapsar?',
    text: 'Plan ve kesitleri okumak herkes için kolay değildir. 3D görselleştirme; malzeme, renk, ışık ve oranları gerçeğe yakın biçimde göstererek sizin, ailenizin ya da yatırım ortaklarınızın projeyi aynı şekilde anlamasını sağlar.',
    // [terim, açıklama, ikon (24×24, ince çizgi)]
    items: [
      ['Dış mekân görselleri', 'cephe, peyzaj ve havuzla birlikte yapının gün ışığında ve akşam görünümü', 'M3 20h18M5 20v-8l6-5 6 5v8M9 20v-4h4v4M19 3v2M22 6h-2M21 3.5l-1.5 1.5'],
      ['İç mekân görselleri', 'salon, mutfak, yatak odası ve banyo için malzeme ve mobilya kararları', 'M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M3 11h18v6H3zM5 17v2M19 17v2'],
      ['Alternatif karşılaştırma', 'aynı mekânın farklı renk ve malzeme seçenekleriyle görselleri', 'M3 4h18v16H3zM12 4v16M6 9h3M15 9h3M6 13h2M15 13h2'],
      ['Kat planı görselleştirmesi', 'mobilyalı, anlaşılır ve renkli plan sunumları', 'M4 4h16v16H4zM4 12h8M12 4v16M12 15h8'],
      ['Satış ve pazarlama görselleri', 'müteahhit ve yatırımcılar için ilan ve broşür kalitesinde görseller', 'M4 4h16v12H4zM4 13l4-4 4 4 3-3 5 5M8 20h8M12 16v4'],
      ['Sunum paftaları', 'belediye, ortaklar veya müşteriler için düzenli proje sunumları', 'M3 4h18v12H3zM12 16v4M8 20h8M7 8h6M7 11h10']
    ]
  },
  types: {
    eyebrow: 'Kimler için',
    h2: 'Kimler için hazırlıyoruz?',
    cards: [
      { h3: 'Ev sahipleri', text: 'Villanızın ya da evinizin nasıl görüneceğini inşaat başlamadan görmek, değişiklikleri erken aşamada ve masrafsız yapmak için.',
        img: '/assets/img/hizmet/3d-gorsellestirme/ev-sahibi.webp', alt: 'Ev sahibi için hazırlanmış villa 3D görselleştirmesi', ph: 'Görsel: ev sahibi için villa görselleştirmesi' },
      { h3: 'Müteahhitler ve yatırımcılar', text: 'Projeyi inşaat bitmeden tanıtmak, ön satış ve pazarlama çalışmalarında kullanmak için.',
        img: '/assets/img/hizmet/3d-gorsellestirme/muteahhit.webp', alt: 'Satış ve pazarlama için konut projesi render görseli', ph: 'Görsel: konut projesi satış görseli' },
      { h3: 'İşletmeler', text: 'Ofis, mağaza veya restoran iç mekânının müşteri gözünden nasıl algılanacağını önceden görmek için.',
        img: '/assets/img/hizmet/3d-gorsellestirme/isletme.webp', alt: 'Restoran iç mekânının 3D görselleştirmesi', ph: 'Görsel: işletme iç mekân görselleştirmesi' }
    ]
  },
  steps: [
    ['Proje ve beklenti', 'Mevcut çizimlerinizi, referans görsellerinizi ve görsellerin nerede kullanılacağını konuşuyoruz.'],
    ['Model hazırlığı', 'Projeyi ölçülerine sadık kalarak üç boyutlu olarak modelliyoruz.'],
    ['Malzeme ve ışık', 'Renk, doku, mobilya ve aydınlatma kararlarını modele işliyoruz.'],
    ['Ön görseller ve revizyon', 'Kamera açılarını ve ilk görselleri paylaşıyor, geri bildirimlerinize göre düzenliyoruz.'],
    ['Final teslim', 'Yüksek çözünürlüklü görselleri, kullanım yerine uygun formatlarda teslim ediyoruz.']
  ],
  why: {
    h2: '3D görselleştirme maliyeti nasıl düşürür?',
    text: 'İnşaat ya da tadilat sırasında yapılan her değişiklik; malzeme, işçilik ve zaman kaybı demektir. Aynı kararı 3D görsel üzerinde vermek ise yalnızca birkaç düzeltme turuna mal olur. Bu yüzden özellikle cephe, mutfak ve banyo gibi değiştirilmesi zor alanlarda görselleştirmeyi uygulamadan önce yapmanızı öneriyoruz.',
    note: 'Görselleştirmeyi iç mekân tasarımıyla birlikte planlayalım',
    link: 'İç mimari hizmetini inceleyin',
    href: '/hizmetler/ic-mimari/'
  },
  related: [
    ['Mimari Proje', 'Mimari proje hizmetini inceleyin', '/hizmetler/mimari-proje/'],
    ['İç Mimari', 'İç mimari hizmetini inceleyin', '/hizmetler/ic-mimari/'],
    ['Uygulama', 'Uygulama hizmetini inceleyin', '/hizmetler/uygulama/']
  ],
  faq: [
    ["Silivri'de 3D görselleştirme için hangi bilgiler gerekiyor?", 'Varsa mimari proje çizimleri (DWG veya PDF), yoksa ölçülü bir kroki ve mekânın fotoğrafları yeterlidir. Beğendiğiniz referans görselleri de paylaşırsanız beklentinizi daha hızlı yakalarız.'],
    ['Sadece 3D görselleştirme hizmeti alabilir miyim?', 'Evet. Başka bir mimar ya da tasarımcı tarafından hazırlanmış projeleri de görselleştirebiliyoruz; çizimlerinizi göndermeniz yeterli.'],
    ['Görseller ne kadar sürede hazırlanır?', 'Süre, görsel sayısına ve projenin detay seviyesine göre değişir. Birkaç görsellik bir iş genellikle kısa sürede tamamlanır; net takvimi çizimleri inceledikten sonra paylaşıyoruz.'],
    ['Kaç revizyon hakkım var?', 'Revizyon kapsamını teklifte açıkça belirtiyoruz. Ön görseller aşamasında kamera açıları, malzeme ve renk üzerinde düzenleme yaparak finale birlikte karar veriyoruz.'],
    ['3D görselleştirme ücreti nasıl belirlenir?', 'Ücret; görsel sayısına, iç veya dış mekân olmasına ve modelin detay seviyesine göre belirlenir. Projenizi ilettiğinizde size özel teklif hazırlıyoruz.']
  ],
  cta: {
    h2: 'Projenizi inşa edilmeden görün',
    text: 'Çizimlerinizi ya da fikrinizi paylaşın, projenizi birlikte görselleştirelim.'
  }
};
