// /hizmetler/ruhsat-iskan/ içeriği — tools/make-service-page.mjs ile HTML'e dönüşür.
export default {
  title: 'Silivri Ruhsat ve İskân İşlemleri | Yapı Ruhsatı, Yapı Kullanma İzni – Sibel Aydın Mimarlık',
  description: "Silivri ve Büyükçekmece'de yapı ruhsatı, tadilat ruhsatı ve iskân (yapı kullanma izin belgesi) süreçleri. Projelendirmeden belediye onayına kadar takip.",
  breadcrumb: 'Ruhsat ve İskân Süreçleri',
  waService: 'Ruhsat ve İskân Süreçleri',
  waMsg: 'Merhaba, web sitenizden yazıyorum. Ruhsat ve iskân hizmetiniz hakkında bilgi almak istiyorum.',
  service: {
    name: 'Silivri Ruhsat ve İskân',
    type: 'Yapı ruhsatı ve yapı kullanma izni işlemleri',
    description: "Silivri ve Büyükçekmece'de yapı ruhsatı, tadilat ruhsatı ve iskân (yapı kullanma izin belgesi) süreçleri. Projelendirmeden belediye onayına kadar takip.",
    cities: ['Silivri', 'Büyükçekmece']
  },
  hero: {
    h1: 'Silivri Ruhsat ve İskân',
    lead: 'Silivri ruhsat ve iskân süreçlerinde projelendirmeden belediye onayına kadar her adımı sizin adınıza planlıyor ve takip ediyoruz. Eksik belge ya da uyumsuz proje yüzünden zaman kaybetmemeniz için süreci baştan doğru kuruyoruz. Silivri, Büyükçekmece ve çevresinde hizmet veriyoruz.',
    img: '/assets/img/hizmet/ruhsat-iskan.webp',
    alt: 'Silivri Ruhsat ve İskân – belediye başvurusu için hazırlanmış proje dosyaları',
    ph: 'Görsel: ruhsat proje dosyaları'
  },
  scope: {
    h2: 'Silivri ruhsat ve iskân hizmetimiz neleri kapsar?',
    text: 'Yapı ruhsatı ve yapı kullanma izin belgesi (iskân), bir yapının yasal olarak inşa edilebilmesi ve kullanılabilmesi için gereken temel belgelerdir. Süreç; imar durumunun doğru okunmasından projelerin onaylanmasına, yapı denetim ve ilgili kurumlarla yürütülen yazışmalardan iskân aşamasındaki kontrollere kadar birçok adımı içerir.',
    // [terim (yoksa ''), açıklama, ikon (24×24, ince çizgi)]
    items: [
      ['', 'İmar durumu ve yapılaşma koşullarının değerlendirilmesi', 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14'],
      ['', 'Ruhsat projelerinin hazırlanması ve diğer disiplinlerle koordinasyonu', 'M4 4h16v16H4zM4 12h8M12 4v16M12 15h8'],
      ['', 'Belediye başvurusu, düzeltmelerin takibi ve onay süreci', 'M3 9l9-5 9 5M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 20h18'],
      ['', 'Tadilat ve ilave ruhsatı süreçleri', 'M3 20h18M5 20v-8l6-5 6 5v8M11 11.5v5M8.5 14h5'],
      ['', 'Yapı kullanma izin belgesi (iskân) için gerekli belge ve kontrollerin planlanması', 'M4 4h16v11H4zM8 8h8M8 11h4M16 11a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM15 15v5l1-.8 1 .8v-5'],
      ['', 'Projesine aykırı durumların tespiti ve çözüm yollarının değerlendirilmesi', 'M10.5 3a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15zM21 21l-5-5M10.5 7v4.5M10.5 14v.5']
    ]
  },
  types: {
    eyebrow: 'İşlem türleri',
    h2: 'Hangi süreçlerde destek veriyoruz?',
    cards: [
      { h3: 'Yeni yapı ruhsatı', text: 'Arsadan başlayarak villa, müstakil ev ve konut projeleri için ruhsat sürecinin tamamı.',
        img: '/assets/img/hizmet/ruhsat-iskan/kart-1.webp', alt: 'Ruhsat projesi hazırlanan arsada yeni villa yapımı', ph: 'Görsel: yeni yapı ruhsatı' },
      { h3: 'Tadilat ve ilave ruhsatı', text: 'Mevcut yapılarda plan değişikliği, kat veya alan ilavesi gibi işler için gerekli ruhsat süreçleri.',
        img: '/assets/img/hizmet/ruhsat-iskan/kart-2.webp', alt: 'Kat ilavesi yapılan mevcut bir konut', ph: 'Görsel: tadilat ve ilave' },
      { h3: 'İskân (yapı kullanma izni)', text: 'İnşaatı biten yapılarda iskân başvurusu öncesi kontroller, eksiklerin tespiti ve başvuru takibi.',
        img: '/assets/img/hizmet/ruhsat-iskan/kart-3.webp', alt: 'İnşaatı tamamlanmış, iskân aşamasındaki konut', ph: 'Görsel: iskân aşamasındaki yapı' }
    ]
  },
  steps: [
    ['Belge ve imar incelemesi', 'Tapu, imar durumu ve mevcut belgeleri inceleyip yapılaşma koşullarını netleştiriyoruz.'],
    ['Yol haritası', 'Gerekli projeleri, belgeleri, kurum yazışmalarını ve tahmini süreyi listeliyoruz.'],
    ['Proje hazırlığı', 'Mimari projeyi hazırlıyor, diğer mühendislik projeleriyle uyumunu sağlıyoruz.'],
    ['Başvuru ve takip', 'Belediye başvurusunu yapıyor, düzeltme taleplerini hızla karşılıyor ve süreci takip ediyoruz.'],
    ['Sonuç', 'Ruhsat veya iskân belgesi alınana kadar süreci sizin adınıza yönetiyor, her adımda bilgilendiriyoruz.']
  ],
  why: {
    h2: 'Ruhsat sürecinde en sık yapılan hatalar nelerdir?',
    text: 'Arsa alındıktan sonra imar durumunun incelenmesi, onaylı projeden farklı uygulama yapılması ve iskân aşamasına gelindiğinde eksik belgelerle karşılaşılması en sık yaşanan sorunlardır. Bu hatalar hem zaman hem de para kaybına yol açar. Süreci projelendirme başlamadan planlamak ve uygulamayı onaylı projeye uygun yürütmek bu risklerin çoğunu ortadan kaldırır.',
    note: 'İskân için Enerji Kimlik Belgesi gerekir',
    link: 'Enerji kimlik belgesi hizmetini inceleyin',
    href: '/hizmetler/enerji-kimlik-belgesi/'
  },
  related: [
    ['Mimari Proje', 'Mimari proje hizmetini inceleyin', '/hizmetler/mimari-proje/'],
    ['Enerji Kimlik Belgesi (EKB)', 'Enerji kimlik belgesi hizmetini inceleyin', '/hizmetler/enerji-kimlik-belgesi/'],
    ['Mimari Danışmanlık ve Kentsel Dönüşüm', 'Mimari danışmanlık hizmetini inceleyin', '/hizmetler/mimari-danismanlik/']
  ],
  faq: [
    ["Silivri'de ruhsat almak için hangi belgeler gerekir?", 'Temel olarak tapu, imar durumu, aplikasyon krokisi, zemin etüdü raporu ve onaylanacak mimari, statik, mekanik ve elektrik projeleri gerekir; yapı denetim sözleşmesi ve ilgili harçlar da süreçte yer alır. Projeye göre ek belgeler istenebildiği için güncel listeyi sürecin başında sizinle paylaşıyoruz.'],
    ['Ruhsat süreci ne kadar sürer?', 'Süre; projenin hazırlanma süresine, başvurunun eksiksiz olmasına ve belediyenin yoğunluğuna göre değişir. Eksiksiz ve doğru hazırlanmış bir başvuru, düzeltme turlarını azaltarak süreci belirgin şekilde kısaltır.'],
    ['İskân (yapı kullanma izni) almak için neler gerekir?', 'İnşaatın onaylı projeye uygun tamamlanmış olması, yapı denetim sürecinin kapatılması ve Enerji Kimlik Belgesi gibi belgelerin hazırlanması gerekir. Yapının türüne göre ilgili kurumlardan ek uygunluk yazıları da istenebilir.'],
    ['Projesine aykırı yapılmış bir binaya iskân alınabilir mi?', 'Önce aykırılığın türü ve mevzuat karşısındaki durumu incelenmelidir. Bazı durumlarda tadilat projesiyle uygunluk sağlanabilir; hangi yolun mümkün olduğunu yerinde tespit ve belge incelemesinden sonra söyleyebiliyoruz.'],
    ['Ruhsat ve iskân hizmetinin ücreti nasıl belirlenir?', 'Ücret; yapının büyüklüğüne, işlem türüne ve hazırlanması gereken projelerin kapsamına göre belirlenir. Belgelerinizi incelediğimizde size özel teklif hazırlıyoruz.']
  ],
  cta: {
    h2: 'Ruhsat sürecinizi birlikte planlayalım',
    text: 'Tapu ve imar durumu belgelerinizi paylaşın, size özel yol haritasını çıkaralım.'
  }
};
