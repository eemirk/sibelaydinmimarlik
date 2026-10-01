// /hizmetler/bina-akustigi/ içeriği — tools/make-service-page.mjs ile HTML'e dönüşür.
export default {
  title: 'Silivri Bina Akustiği | Akustik Proje, Ses Yalıtımı, Akustik Rapor – Sibel Aydın İnşaat Mimarlık',
  description: "Silivri ve Büyükçekmece'de bina akustik projesi, akustik performans raporu, ses yalıtımı ve gürültü kontrolü danışmanlığı. Yönetmeliğe uygun çözümler.",
  breadcrumb: 'Bina Akustiği',
  waService: 'Bina Akustiği',
  waMsg: 'Merhaba, web sitenizden yazıyorum. Bina akustiği hizmetiniz hakkında bilgi almak istiyorum.',
  service: {
    name: 'Silivri Bina Akustiği',
    type: 'Bina akustiği, akustik proje ve ses yalıtımı',
    description: "Silivri ve Büyükçekmece'de bina akustik projesi, akustik performans raporu, ses yalıtımı ve gürültü kontrolü danışmanlığı. Yönetmeliğe uygun çözümler.",
    cities: ['Silivri', 'Büyükçekmece']
  },
  hero: {
    h1: 'Silivri Bina Akustiği',
    lead: 'Silivri bina akustiği hizmetimizle yapınızın gürültüye karşı korunmasını proje aşamasından itibaren planlıyoruz. Yönetmeliğe uygun akustik proje ve raporların yanında, mevcut yapılardaki ses sorunlarına da çözüm üretiyoruz. Silivri, Büyükçekmece ve çevresinde hizmet veriyoruz.',
    img: '/assets/img/hizmet/bina-akustigi.webp',
    alt: 'Silivri Bina Akustiği – akustik panellerle düzenlenmiş iç mekân',
    ph: 'Görsel: akustik panelli iç mekân'
  },
  scope: {
    h2: 'Silivri bina akustiği hizmetimiz neleri kapsar?',
    text: 'Bina akustiği; dış ortamdan, komşu mekânlardan ve tesisattan gelen gürültünün kontrol altına alınmasını ve iç mekânda ses kalitesinin sağlanmasını kapsar. Binaların gürültüye karşı korunmasına ilişkin yönetmelik kapsamındaki yapılarda, ruhsat sürecinde akustik proje ve rapor istenebilir.',
    // [terim (yoksa ''), açıklama, ikon (24×24, ince çizgi)]
    items: [
      ['', 'Bina akustik projesi ve akustik rapor hazırlanması', 'M6 3h9l4 4v14H6zM15 3v4h4M8.5 14h1.5l1-3 2 6 1-3h1.5'],
      ['', 'Akustik mevzuat uygunluk çalışmaları', 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6zM9 12l2 2 4-4'],
      ['', 'Ses yalıtımı danışmanlığı: duvar, döşeme ve doğrama detayları', 'M15 3v18M19 3v18M3 9c1.5 0 1.5 6 3 6s1.5-6 3-6 1.5 6 3 6'],
      ['', 'Gürültü kontrolü: tesisat, mekanik sistem ve darbe sesi kaynaklı sorunlar', 'M4 9h4l5-4v14l-5-4H4zM17 9l4 6M21 9l-4 6'],
      ['', 'Akustik performans değerlendirmesi ve raporlama', 'M3 12h2M7 8v8M11 5v14M15 9v6M19 11v2'],
      ['', 'Toplantı, eğitim ve eğlence mekânlarında iç akustik düzenlemeleri', 'M3 4h18v16H3zM7 8v8M11 8v8M15 8v8']
    ]
  },
  types: {
    eyebrow: 'Uygulama alanları',
    h2: 'Hangi yapılarda çalışıyoruz?',
    cards: [
      { h3: 'Konut ve villa', text: 'Daireler arası ses geçişi, darbe sesi ve dış ortam gürültüsüne karşı yaşam konforunu artıran çözümler.',
        img: '/assets/img/hizmet/bina-akustigi/kart-1.webp', alt: 'Sessiz ve konforlu bir konut yaşam alanı', ph: 'Görsel: konut iç mekânı' },
      { h3: 'Ticari ve kamusal yapılar', text: 'Ofis, okul, klinik ve otel gibi yapılarda mevzuata uygun akustik tasarım ve raporlama.',
        img: '/assets/img/hizmet/bina-akustigi/kart-2.webp', alt: 'Akustik tavan uygulanmış bir ofis alanı', ph: 'Görsel: ofis akustiği' },
      { h3: 'Özel mekânlar', text: 'Toplantı salonu, stüdyo, restoran ve eğlence mekânlarında hem yalıtım hem iç akustik düzenleme.',
        img: '/assets/img/hizmet/bina-akustigi/kart-3.webp', alt: 'Duvarlarında akustik paneller bulunan toplantı salonu', ph: 'Görsel: toplantı salonu akustiği' }
    ]
  },
  steps: [
    ['İhtiyaç ve mevzuat tespiti', 'Yapının türüne ve kullanımına göre hangi akustik gerekliliklerin geçerli olduğunu belirliyoruz.'],
    ['Proje incelemesi', 'Mimari projeyi duvar, döşeme, doğrama ve tesisat detayları açısından inceliyoruz.'],
    ['Akustik tasarım', 'Gerekli yalıtım değerlerini ve detay çözümlerini belirliyoruz.'],
    ['Proje ve rapor', 'Akustik projeyi ve raporu hazırlayıp ruhsat sürecine uygun hâle getiriyoruz.'],
    ['Uygulama desteği', 'İsterseniz uygulamada detayların doğru yapılması için danışmanlık veriyoruz.']
  ],
  why: {
    h2: 'Ses yalıtımı neden sonradan çözmek için zor bir sorundur?',
    text: 'Ses, en küçük boşluk ve köprüden bile geçer. Duvar ve döşeme detayları, tesisat geçişleri ve doğrama birleşimleri inşaat sırasında doğru yapılmadığında, sonradan yapılan müdahaleler hem pahalı hem de sınırlı etkili olur. Akustiği proje aşamasında ele almak en ekonomik ve kalıcı çözümdür.',
    note: 'Akustiği projenizle birlikte planlayalım',
    link: 'Mimari proje hizmetini inceleyin',
    href: '/hizmetler/mimari-proje/'
  },
  related: [
    ['Mimari Proje', 'Mimari proje hizmetini inceleyin', '/hizmetler/mimari-proje/'],
    ['Enerji Kimlik Belgesi (EKB)', 'Enerji kimlik belgesi hizmetini inceleyin', '/hizmetler/enerji-kimlik-belgesi/'],
    ['Ruhsat ve İskân Süreçleri', 'Ruhsat ve iskân süreçlerini inceleyin', '/hizmetler/ruhsat-iskan/']
  ],
  faq: [
    ["Silivri'de akustik rapor hangi yapılar için gerekir?", 'Binaların gürültüye karşı korunmasına ilişkin yönetmelik, yapının türüne ve kullanımına göre akustik gereklilikler tanımlar. Projenizin bu kapsama girip girmediğini ve ruhsat aşamasında neyin istendiğini proje bilgileriniz üzerinden birlikte kontrol ediyoruz.'],
    ['Mevcut dairemde komşu gürültüsünü azaltabilir miyim?', 'Çoğu durumda evet. Sesin hangi yoldan geldiğini tespit ettikten sonra duvar, tavan veya döşemede uygulanabilecek yalıtım çözümlerini ve beklenen iyileşmeyi değerlendiriyoruz.'],
    ['Akustik proje ile ses yalıtımı aynı şey mi?', 'Ses yalıtımı, akustik projenin bir parçasıdır. Akustik proje; yalıtımın yanında darbe sesi, tesisat gürültüsü ve gerekli mekânlarda iç akustik kalitesini de kapsayan bütünlüklü bir çalışmadır.'],
    ['Akustik rapor ne kadar sürede hazırlanır?', 'Süre, yapının büyüklüğüne ve proje detaylarının hazır olup olmamasına göre değişir. Proje çizimleri eksiksizse süreç hızlı ilerler; net takvimi proje incelemesinden sonra paylaşıyoruz.'],
    ['Bina akustiği hizmetinin ücreti nasıl belirlenir?', 'Ücret; yapının türüne, büyüklüğüne ve istenen kapsamın (proje, rapor veya yerinde değerlendirme) detayına göre belirlenir. Bilgilerinizi ilettiğinizde size özel teklif hazırlıyoruz.']
  ],
  cta: {
    h2: 'Sessiz ve konforlu mekânlar tasarlayalım',
    text: 'Projenizi ya da yaşadığınız ses sorununu anlatın, doğru çözümü birlikte belirleyelim.'
  }
};
