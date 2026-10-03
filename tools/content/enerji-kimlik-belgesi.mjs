// /hizmetler/enerji-kimlik-belgesi/ içeriği — tools/make-service-page.mjs ile HTML'e dönüşür.
export default {
  title: 'Silivri Enerji Kimlik Belgesi (EKB) | İskân ve Satış İçin EKB – Sibel Aydın İnşaat Mimarlık',
  description: "Silivri ve Büyükçekmece'de yeni ve mevcut binalar için Enerji Kimlik Belgesi (EKB), bina enerji performansı değerlendirmesi ve enerji verimliliği danışmanlığı.",
  breadcrumb: 'Enerji Kimlik Belgesi (EKB)',
  waService: 'Enerji Kimlik Belgesi (EKB)',
  waMsg: 'Merhaba, web sitenizden yazıyorum. Enerji Kimlik Belgesi (EKB) hizmetiniz hakkında bilgi almak istiyorum.',
  service: {
    name: 'Silivri Enerji Kimlik Belgesi',
    type: 'Enerji Kimlik Belgesi ve bina enerji performansı',
    description: "Silivri ve Büyükçekmece'de yeni ve mevcut binalar için Enerji Kimlik Belgesi (EKB), bina enerji performansı değerlendirmesi ve enerji verimliliği danışmanlığı.",
    cities: ['Silivri', 'Büyükçekmece']
  },
  hero: {
    h1: 'Silivri Enerji Kimlik Belgesi',
    lead: 'Silivri enerji kimlik belgesi (EKB) hizmetimizle binanızın enerji performansını belirliyor, iskân ve diğer resmi işlemler için gereken belgeyi hazırlıyoruz. Belgeyle birlikte enerji tüketimini azaltmak için neler yapılabileceğini de gösteriyoruz. Silivri, Büyükçekmece ve çevresinde hizmet veriyoruz.',
    img: '/assets/img/hizmet/enerji-verimli-konut-binasi',
    alt: 'Dış cephesi yalıtımlı, çatısında güneş panelleri bulunan dört katlı konut binası',
    ph: 'Görsel: enerji sınıfı ve konut cephesi'
  },
  scope: {
    h2: 'Silivri enerji kimlik belgesi hizmetimiz neleri kapsar?',
    text: "Enerji Kimlik Belgesi; bir binanın ısınma, soğutma, sıcak su ve aydınlatma için harcadığı enerjiyi ve buna bağlı karbon salımını A'dan G'ye sınıflandıran resmi belgedir. Belge, yetkili uzmanlar tarafından bakanlığın sistemi üzerinden düzenlenir.",
    // [terim (yoksa ''), açıklama, ikon (24×24, ince çizgi)]
    items: [
      ['', 'Yeni binalar için iskân öncesi Enerji Kimlik Belgesi', 'M3 20h18M5 20v-8l6-5 6 5v8M10 20v-5h4v5'],
      ['', 'Mevcut binalar için Enerji Kimlik Belgesi', 'M5 3h14v18H5zM9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M11 21v-3h2v3'],
      ['', 'Bina enerji performansı değerlendirmesi', 'M4 4h7l2 2.5L11 9H4zM4 10h10l2 2.5-2 2.5H4zM4 16h13l2 2.5-2 2.5H4z'],
      ['', 'Isı yalıtımı ve enerji kayıplarının tespiti', 'M5 3v18M14 3v18M10 3v18M10 6c1.7 1 2.3 1 4 0M10 10c1.7 1 2.3 1 4 0M10 14c1.7 1 2.3 1 4 0M10 18c1.7 1 2.3 1 4 0M18 9l2 3-2 3'],
      ['', 'Enerji verimliliğini artıracak iyileştirme önerileri', 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z'],
      ['', 'Proje aşamasında enerji verimli tasarım danışmanlığı', 'M12 2v2M4.9 4.9l1.4 1.4M2 12h2M17.7 6.3l1.4-1.4M20 12h2M8 12a4 4 0 0 1 8 0M3 20h18M6 20v-4h12v4']
    ]
  },
  types: {
    eyebrow: 'Ne zaman gerekir',
    h2: 'EKB hangi durumlarda gerekir?',
    cards: [
      { h3: 'Yeni binalar', text: 'Yeni yapılan binalarda yapı kullanma izin belgesi (iskân) alınabilmesi için EKB gereklidir.',
        img: '/assets/img/hizmet/iskana-hazir-mustakil-ev', alt: 'Taş kaideli, ahşap panjurlu ve peyzajı tamamlanmış iki katlı müstakil ev', ph: 'Görsel: yeni bina' },
      { h3: 'Satış ve kiralama', text: 'Mevcut binaların satış ve kiralama işlemlerinde EKB talep edilebilir; güncel uygulamayı işleminizden önce kontrol etmenizi öneriyoruz.',
        img: '/assets/img/hizmet/konut-binasi-gorsellestirme', alt: 'Ahşap tavanlı girintili balkonları olan beş katlı çağdaş konut binası – mimari görselleştirme', ph: 'Görsel: satış ve kiralama' },
      { h3: 'Enerji iyileştirme', text: 'Isınma giderlerini azaltmak isteyen bina sahipleri için mevcut durumun tespiti ve iyileştirme yol haritası.',
        img: '/assets/img/hizmet/mantolama-isi-yalitimi-uygulamasi', alt: 'Cepheye dübelle sabitlenmiş beyaz ısı yalıtım levhaları ve file üzerine sürülen sıva; önde iskele korkuluğu', ph: 'Görsel: ısı yalıtımı uygulaması' }
    ]
  },
  steps: [
    ['Bilgi ve belge toplama', 'Binanın projeleri, ruhsat bilgileri ve tesisat özelliklerini topluyoruz.'],
    ['Yerinde inceleme', 'Gerekli durumlarda yalıtım, doğrama ve tesisat sistemlerini yerinde kontrol ediyoruz.'],
    ['Hesaplama', 'Binanın verilerini resmi hesaplama sistemine giriyor, enerji sınıfını belirliyoruz.'],
    ['Belgenin düzenlenmesi', 'Enerji Kimlik Belgesini sistem üzerinden düzenliyoruz.'],
    ['Öneriler', 'İsterseniz binanın sınıfını iyileştirecek önlemleri ve öncelik sırasını paylaşıyoruz.']
  ],
  why: {
    h2: 'Enerji sınıfı proje aşamasında neden önemlidir?',
    text: 'Bir binanın enerji sınıfı büyük ölçüde tasarım aşamasında belirlenir. Yönlenme, pencere oranları, yalıtım detayları ve mekanik sistem seçimi proje sırasında doğru kurgulandığında, hem daha iyi bir EKB sınıfı hem de yıllar boyunca daha düşük enerji giderleri elde edilir.',
    note: 'İskân sürecinizi birlikte planlayalım',
    link: 'Ruhsat ve iskân süreçlerini inceleyin',
    href: '/hizmetler/ruhsat-iskan/'
  },
  related: [
    ['Ruhsat ve İskân Süreçleri', 'Ruhsat ve iskân süreçlerini inceleyin', '/hizmetler/ruhsat-iskan/'],
    ['Mimari Proje', 'Mimari proje hizmetini inceleyin', '/hizmetler/mimari-proje/'],
    ['Bina Akustiği', 'Bina akustiği hizmetini inceleyin', '/hizmetler/bina-akustigi/']
  ],
  faq: [
    ["Silivri'de Enerji Kimlik Belgesi nasıl alınır?", 'Binanın proje ve tesisat bilgilerini bize iletmeniz yeterlidir. Gerekirse yerinde inceleme yapıyor, hesaplamayı tamamlayarak belgeyi resmi sistem üzerinden düzenliyoruz.'],
    ['Enerji Kimlik Belgesi zorunlu mu?', 'Yeni binalarda iskân alınabilmesi için gereklidir. Mevcut binalarda ise satış, kiralama ve bazı resmi işlemlerde talep edilebilir; işleminize göre güncel gerekliliği birlikte kontrol ediyoruz.'],
    ['EKB ne kadar süre geçerlidir?', 'Enerji Kimlik Belgesi düzenlendiği tarihten itibaren 10 yıl geçerlidir. Binada enerji performansını etkileyen önemli bir değişiklik yapılırsa yenilenmesi gerekebilir.'],
    ['Binamın enerji sınıfını yükseltebilir miyim?', 'Evet. Isı yalıtımı, doğramaların yenilenmesi ve daha verimli ısıtma sistemleri gibi önlemler sınıfı iyileştirebilir. Hangi önlemin en yüksek faydayı sağlayacağını mevcut durum değerlendirmesiyle belirliyoruz.'],
    ['EKB ücreti nasıl belirlenir?', 'Ücret; binanın büyüklüğüne, türüne ve yerinde inceleme gerekip gerekmediğine göre belirlenir. Bina bilgilerinizi ilettiğinizde size özel teklif hazırlıyoruz.']
  ],
  cta: {
    h2: 'Enerji Kimlik Belgenizi hızlıca hazırlayalım',
    text: 'Binanızın bilgilerini paylaşın, belge sürecini ve gerekli adımları birlikte planlayalım.'
  }
};
