// /hizmetler/bilirkisilik/ içeriği — tools/make-service-page.mjs ile HTML'e dönüşür.
export default {
  title: 'Silivri Mimari Bilirkişi ve Teknik İnceleme | Yapı Ayıpları, Uzman Görüşü – Sibel Aydın İnşaat Mimarlık',
  description: "Silivri ve Büyükçekmece'de yapı ayıp ve eksikliklerinin tespiti, proje–uygulama karşılaştırması, teknik inceleme raporu ve mimari bilirkişilik hizmetleri.",
  breadcrumb: 'Bilirkişilik ve Teknik İnceleme',
  waService: 'Bilirkişilik ve Teknik İnceleme',
  waMsg: 'Merhaba, web sitenizden yazıyorum. Bilirkişilik ve teknik inceleme hizmetiniz hakkında bilgi almak istiyorum.',
  yetkiBelgesi: 'kamulastirma-bilirkisiligi-yetki-belgesi',   // tools/content/belgeler.mjs
  service: {
    name: 'Silivri Bilirkişilik ve Teknik İnceleme',
    type: 'Mimari bilirkişilik ve yapı teknik incelemesi',
    description: "Silivri ve Büyükçekmece'de yapı ayıp ve eksikliklerinin tespiti, proje–uygulama karşılaştırması, teknik inceleme raporu ve mimari bilirkişilik hizmetleri.",
    cities: ['Silivri', 'Büyükçekmece']
  },
  hero: {
    h1: 'Silivri Bilirkişilik ve Teknik İnceleme',
    lead: 'Silivri bilirkişilik ve teknik inceleme hizmetimizle yapılardaki ayıp, eksik ve projeye aykırılıkları tarafsız ve belgeli şekilde ortaya koyuyoruz. Anlaşmazlık aşamasına gelmeden ya da yargı sürecinde, teknik gerçeği anlaşılır bir raporla sunuyoruz. Silivri, Büyükçekmece ve çevresinde hizmet veriyoruz.',
    img: '/assets/img/hizmet/catlak-ve-nem-izli-apartman-cephesi',
    alt: 'Sıvasında kılcal çatlaklar ve zemine yakın nem izleri bulunan eski bir apartman cephesi',
    ph: 'Görsel: yerinde teknik inceleme'
  },
  scope: {
    h2: 'Silivri bilirkişilik ve teknik inceleme hizmetimiz neleri kapsar?',
    text: 'Yapıyla ilgili uyuşmazlıkların çoğu teknik bir sorunun doğru tespit edilmemesinden kaynaklanır. Teknik inceleme; yerinde tespit, proje ve sözleşme karşılaştırması ve belgelerle desteklenen tarafsız bir değerlendirme sunar. Mahkemelerce görevlendirildiğimiz dosyalarda ise bilirkişi raporu hazırlıyoruz.',
    // [terim (yoksa ''), açıklama, ikon (24×24, ince çizgi)]
    items: [
      ['', 'Yapıdaki ayıp ve eksikliklerin tespiti', 'M4 4h16v16H4zM12 4l-2 5 3 3-2 4 1 4'],
      ['', 'Proje ile uygulamanın karşılaştırılması', 'M3 5h7v14H3zM14 5h7v14h-7zM10 12h4M12.5 10.5L14 12l-1.5 1.5'],
      ['', 'Mimari proje inceleme ve değerlendirme', 'M4 4h10v10H4zM4 9h5M9 4v5M16 13a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM18.2 18.2L21 21'],
      ['', 'Yapı uyuşmazlıklarında keşif ve teknik inceleme', 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM16 16l5 5'],
      ['', 'Taraflar için teknik değerlendirme raporu (uzman görüşü)', 'M6 3h9l4 4v14H6zM15 3v4h4M9 11h7M9 14h7M9 17h4'],
      ['', 'Mahkemelerce görevlendirilen dosyalarda mimari bilirkişi raporu', 'M12 4v16M8 20h8M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z']
    ]
  },
  types: {
    eyebrow: 'Durumlar',
    h2: 'Hangi durumlarda teknik incelemeye ihtiyaç duyulur?',
    cards: [
      { h3: 'Satın alma ve teslim', text: 'Yeni alınan ya da teslim edilen konutlarda sözleşme ve projeye aykırı eksiklerin belgelenmesi.',
        img: '/assets/img/hizmet/iskana-hazir-mustakil-ev', alt: 'Taş kaideli, ahşap panjurlu ve peyzajı tamamlanmış iki katlı müstakil ev', ph: 'Görsel: teslimde eksik kontrolü' },
      { h3: 'Müteahhit ve kat maliki uyuşmazlıkları', text: 'Kat karşılığı ve inşaat sözleşmelerinden doğan teknik anlaşmazlıkların değerlendirilmesi.',
        img: '/assets/img/hizmet/ruhsat-proje-setleri-maket', alt: 'Meşe masada klasörlenmiş proje setleri, ölçek cetveli ve beyaz ev maketi', ph: 'Görsel: proje ve sözleşme incelemesi' },
      { h3: 'Hasar ve kusur tespiti', text: 'Nem, çatlak, sızıntı ve benzeri sorunların nedenlerinin ve sorumluluğun teknik açıdan incelenmesi.',
        img: '/assets/img/hizmet/nem-olcer-ile-catlak-tespiti', alt: 'Nem ölçerle sıvadaki çatlağın ve zemine yakın nem izinin ölçülmesi', ph: 'Görsel: çatlak ve nem tespiti' }
    ]
  },
  steps: [
    ['Ön görüşme', 'Konuyu, elinizdeki belgeleri ve beklentinizi dinliyor, incelemenin kapsamını belirliyoruz.'],
    ['Belge incelemesi', 'Sözleşme, proje, ruhsat ve yazışmaları inceliyoruz.'],
    ['Yerinde tespit', 'Yapıyı yerinde inceliyor, bulguları fotoğraf ve ölçümlerle belgeliyoruz.'],
    ['Değerlendirme', 'Bulguları proje, sözleşme ve mevzuat karşısında değerlendiriyoruz.'],
    ['Rapor', 'Tespitleri ve sonuçları tarafsız, anlaşılır ve belgelerle desteklenmiş bir raporda sunuyoruz.']
  ],
  why: {
    h2: 'Uyuşmazlık büyümeden teknik tespit neden önemli?',
    text: 'Kusurlar zamanla değişir, onarımlar yapılır ve ilk durum kaybolur. Sorun fark edildiğinde yapılan tarafsız bir teknik tespit, hem tarafların uzlaşmasını kolaylaştırır hem de ileride başvurulabilecek hukuki süreçte güçlü bir dayanak oluşturur.',
    note: 'Kentsel dönüşüm veya kat karşılığı sürecindeyseniz',
    link: 'Mimari danışmanlık hizmetini inceleyin',
    href: '/hizmetler/mimari-danismanlik/'
  },
  related: [
    ['Mimari Danışmanlık ve Kentsel Dönüşüm', 'Mimari danışmanlık hizmetini inceleyin', '/hizmetler/mimari-danismanlik/'],
    ['Şantiye ve Teknik Hizmetler', 'Şantiye ve teknik hizmetleri inceleyin', '/hizmetler/santiye-teknik-hizmetler/'],
    ['Ruhsat ve İskân Süreçleri', 'Ruhsat ve iskân süreçlerini inceleyin', '/hizmetler/ruhsat-iskan/']
  ],
  faq: [
    ["Silivri'de yapı ayıplarının tespiti için nasıl başvurabilirim?", "Sorunu ve elinizdeki belgeleri (sözleşme, proje, fotoğraflar) \"Projenizi Anlatın\" formundan ya da WhatsApp'tan iletmeniz yeterli. Ön değerlendirmenin ardından yerinde inceleme için randevu planlıyoruz."],
    ['Bilirkişi raporu ile uzman görüşü arasındaki fark nedir?', 'Bilirkişi, mahkeme tarafından görevlendirilir ve raporunu mahkemeye sunar. Taraflardan birinin talebiyle hazırlanan teknik değerlendirme ise uzman görüşü niteliğindedir; uyuşmazlık öncesinde veya yargı sürecinde taraflarca kullanılabilir.'],
    ['Teknik inceleme raporu mahkemede kullanılabilir mi?', 'Taraflarca hazırlatılan teknik değerlendirme raporları dosyaya sunulabilir ve mahkemece değerlendirilebilir. Raporun hangi amaçla kullanılacağını baştan konuşarak kapsamını buna göre hazırlıyoruz.'],
    ['Yerinde inceleme ne kadar sürer?', 'Süre, yapının büyüklüğüne ve incelenecek konuların sayısına göre değişir. Rapor süresini inceleme kapsamı netleştikten sonra paylaşıyoruz.'],
    ['Teknik inceleme ücreti nasıl belirlenir?', 'Ücret; incelemenin kapsamına, yerinde tespit gerekliliğine ve raporun detayına göre belirlenir. Konuyu dinledikten sonra size özel teklif hazırlıyoruz.']
  ],
  cta: {
    h2: 'Teknik gerçeği birlikte ortaya koyalım',
    text: 'Yaşadığınız sorunu ve belgelerinizi paylaşın, incelemenin kapsamını birlikte belirleyelim.'
  }
};
