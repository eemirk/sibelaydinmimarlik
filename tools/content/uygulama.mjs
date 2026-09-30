// /hizmetler/uygulama/ içeriği — tools/make-service-page.mjs ile HTML'e dönüşür.
export default {
  title: 'Silivri İnşaat Firması | Villa ve Konut Uygulama – Sibel Aydın İnşaat Mimarlık',
  description: "Silivri ve Büyükçekmece'de villa, konut ve tadilat projelerinin projeye sadık uygulaması. Mimarlık ve inşaat tek firmada; tasarımdan teslime kadar.",
  breadcrumb: 'Uygulama',
  waService: 'Uygulama',
  waMsg: 'Merhaba, web sitenizden yazıyorum. Uygulama ve inşaat hizmetiniz hakkında bilgi almak istiyorum.',
  service: {
    name: 'Silivri İnşaat ve Uygulama',
    type: 'İnşaat uygulama ve tadilat',
    description: 'Villa, konut ve tadilat projelerinin projeye sadık uygulaması; tasarımdan teslime kadar.',
    cities: ['Silivri', 'Büyükçekmece']
  },
  hero: {
    h1: 'Silivri İnşaat ve Uygulama',
    lead: 'Silivri inşaat firmaları arasında bizi farklı kılan, projeyi çizen ekiple uygulayan ekibin aynı olması. Tasarımda verilen kararlar şantiyede kaybolmuyor; villa, konut ve tadilat işlerinizi projeye sadık kalarak hayata geçiriyoruz. Silivri, Büyükçekmece ve çevresinde hizmet veriyoruz.',
    img: '/assets/img/hizmet/uygulama.webp',
    alt: 'Silivri inşaat ve uygulama – villa şantiyesi',
    ph: 'Görsel: villa şantiyesi'
  },
  scope: {
    h2: 'Silivri inşaat ve uygulama hizmetimiz neleri kapsar?',
    text: 'İyi bir proje, ancak doğru uygulandığında değer kazanır. Mimari projeyi hazırlayan ofisin uygulamayı da üstlenmesi; detayların doğru yorumlanmasını, sorunların şantiyede hızlı çözülmesini ve sorumluluğun tek elde toplanmasını sağlar.',
    // [terim, açıklama, ikon (24×24, ince çizgi)]
    items: [
      ['Kaba inşaat', 'temel, betonarme karkas ve duvar imalatlarının projeye uygun yapımı', 'M3 20h18M4 20V8h16v12M4 12h16M4 16h16M9 8v4M15 8v4M12 12v4M7 16v4M17 16v4'],
      ['İnce işler', 'sıva, alçı, zemin kaplamaları, doğrama, boya ve cephe uygulamaları', 'M4 4h13v5H4zM17 6.5h3V12h-8v3M11 15h2v6h-2z'],
      ['Tesisat koordinasyonu', 'elektrik, sıhhi tesisat ve mekanik işlerin projeyle uyumlu yürütülmesi', 'M8 3v5M13 3v5M6 8h9v3a4.5 4.5 0 0 1-9 0zM10.5 15.5V21M16 12h2a3 3 0 0 1 3 3v6'],
      ['İç mekân uygulaması', 'mutfak, banyo, dolap ve özel tasarım mobilya imalatlarının takibi', 'M3 10h18v10H3zM3 10l2-6h14l2 6M12 10v10M9.5 14v2M14.5 14v2'],
      ['Tadilat ve yenileme', 'mevcut yapılarda plan değişikliği, yenileme ve güçlendirme çalışmaları', 'M14 3l6 6-3 3-6-6zM11 6l-8 8 3 3 8-8M3 21h8'],
      ['İş programı ve maliyet takibi', 'zaman planı, hakediş ve malzeme süreçlerinin şeffaf yönetimi', 'M4 5h16v15H4zM4 9h16M8 3v4M16 3v4M8 17v-3M12 17v-5M16 17v-2']
    ]
  },
  types: {
    eyebrow: 'Proje türleri',
    h2: 'Hangi işleri uyguluyoruz?',
    cards: [
      { h3: 'Villa ve müstakil ev', text: 'Arsadan anahtar teslime; projesi bizde veya başka bir ofiste hazırlanmış villa ve müstakil ev uygulamaları.',
        img: '/assets/img/hizmet/uygulama/villa.webp', alt: 'Uygulama aşamasındaki müstakil villa inşaatı', ph: 'Görsel: villa uygulaması' },
      { h3: 'Konut ve apartman', text: 'Konut projelerinde kaba ve ince inşaat uygulaması, ortak alan ve cephe işleri.',
        img: '/assets/img/hizmet/uygulama/konut.webp', alt: 'Cephe işleri süren çok katlı konut inşaatı', ph: 'Görsel: konut ve apartman uygulaması' },
      { h3: 'Tadilat ve dekorasyon', text: 'Daire, villa ve iş yerlerinde projeli tadilat, yenileme ve iç mekân dekorasyonu uygulamaları.',
        img: '/assets/img/hizmet/uygulama/tadilat.webp', alt: 'Projeli tadilatı süren daire iç mekânı', ph: 'Görsel: tadilat ve dekorasyon' }
    ]
  },
  steps: [
    ['Proje ve keşif incelemesi', 'Mevcut projeyi ve alanı inceliyor, uygulama kapsamını birlikte netleştiriyoruz.'],
    ['Metraj, keşif ve teklif', 'Malzeme miktarlarını ve iş kalemlerini çıkararak açık, kalem kalem bir teklif hazırlıyoruz.'],
    ['İş programı', 'İşin aşamalarını, sürelerini ve ödeme planını baştan belirliyoruz.'],
    ['Uygulama ve kontrol', 'Şantiyeyi yönetiyor, her aşamayı projeye uygunluk açısından kontrol ediyor ve sizi düzenli bilgilendiriyoruz.'],
    ['Teslim', 'İşi eksik listesiyle birlikte kontrol ederek teslim ediyor, gerekli belgeleri hazırlıyoruz.']
  ],
  why: {
    h2: 'Uygulamaya başlamadan önce nelere dikkat edilmeli?',
    text: 'Uygulama sürecindeki sorunların çoğu, eksik projeden ve belirsiz tekliften kaynaklanır. Detay çizimleri tamamlanmış bir uygulama projesi ve kalem kalem hazırlanmış bir keşif, hem bütçenin hem de sürenin kontrol altında kalmasını sağlar. Bu yüzden uygulamaya, projesi netleşmiş ve iş programı çıkarılmış olarak başlamanızı öneriyoruz.',
    note: 'Uygulamadan önce projenizi netleştirelim',
    link: 'Mimari proje hizmetini inceleyin',
    href: '/hizmetler/mimari-proje/'
  },
  related: [
    ['Şantiye ve Teknik Hizmetler', 'Şantiye ve teknik hizmetleri inceleyin', '/hizmetler/santiye-teknik-hizmetler/'],
    ['Mimari Proje', 'Mimari proje hizmetini inceleyin', '/hizmetler/mimari-proje/'],
    ['Ruhsat ve İskân Süreçleri', 'Ruhsat ve iskân süreçlerini inceleyin', '/hizmetler/ruhsat-iskan/']
  ],
  faq: [
    ["Silivri'de inşaat firması seçerken nelere dikkat etmeliyim?", 'Firmanın tamamladığı işleri yerinde ya da fotoğraflarla görmek, teklifin kalem kalem hazırlanıp hazırlanmadığını kontrol etmek ve sözleşmede iş programıyla ödeme planının açıkça yazılmasını istemek en önemli adımlardır. Projeyi hazırlayan ekiple uygulayan ekibin uyumu da sonucu doğrudan etkiler.'],
    ['Projesi başka bir ofiste hazırlanmış işi uygulayabilir misiniz?', 'Evet. Projeyi inceleyip uygulama için eksik detay varsa tamamlıyor, ardından uygulama teklifimizi hazırlıyoruz.'],
    ['Anahtar teslim çalışıyor musunuz?', 'Projenin kapsamına göre anahtar teslim ya da sadece belirli iş kalemlerini içeren uygulama modelleriyle çalışabiliyoruz. Hangi modelin size uygun olduğunu keşif sonrasında birlikte belirliyoruz.'],
    ['Uygulama sürecinde nasıl bilgilendiriliyorum?', 'İşin aşamalarına göre düzenli fotoğraflı bilgilendirme yapıyor, önemli kararlar öncesinde sizinle birlikte değerlendiriyoruz.'],
    ['Uygulama teklifi nasıl hazırlanıyor?', 'Proje ve keşif üzerinden metraj çıkararak iş kalemlerini, malzeme özelliklerini ve süreleri gösteren detaylı bir teklif hazırlıyoruz. Böylece neyin ne kadara yapılacağını baştan görebiliyorsunuz.']
  ],
  cta: {
    h2: 'Projenizi birlikte hayata geçirelim',
    text: 'Projeniz hazırsa ya da henüz fikir aşamasındaysa, uygulama sürecini birlikte planlayalım.'
  }
};
