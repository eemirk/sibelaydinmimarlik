// /hizmetler/mimari-danismanlik/ içeriği — tools/make-service-page.mjs ile HTML'e dönüşür.
export default {
  title: 'Silivri Mimari Danışmanlık ve Kentsel Dönüşüm | İmar ve Yapılaşma – Sibel Aydın İnşaat Mimarlık',
  description: "Silivri ve Büyükçekmece'de imar durumu analizi, arsa değerlendirme, yapılaşma danışmanlığı ve kentsel dönüşüm süreçlerinde mimari danışmanlık.",
  breadcrumb: 'Mimari Danışmanlık ve Kentsel Dönüşüm',
  waService: 'Mimari Danışmanlık ve Kentsel Dönüşüm',
  waMsg: 'Merhaba, web sitenizden yazıyorum. Mimari danışmanlık ve kentsel dönüşüm hizmetiniz hakkında bilgi almak istiyorum.',
  service: {
    name: 'Silivri Mimari Danışmanlık',
    type: 'İmar, yapılaşma ve kentsel dönüşüm danışmanlığı',
    description: "Silivri ve Büyükçekmece'de imar durumu analizi, arsa değerlendirme, yapılaşma danışmanlığı ve kentsel dönüşüm süreçlerinde mimari danışmanlık.",
    cities: ['Silivri', 'Büyükçekmece']
  },
  hero: {
    h1: 'Silivri Mimari Danışmanlık',
    lead: 'Silivri mimari danışmanlık hizmetimizle arsa almadan, inşaata başlamadan ya da kentsel dönüşüm kararı vermeden önce doğru bilgiyle hareket etmenizi sağlıyoruz. İmar koşullarını, riskleri ve seçenekleri sizin için anlaşılır hâle getiriyoruz. Silivri, Büyükçekmece ve çevresinde hizmet veriyoruz.',
    img: '/assets/img/hizmet/imar-plani-degerlendirme',
    alt: 'Traverten masada parsel ve yol çizimli imar planı, ölçek cetveli ve aydınger',
    ph: 'Görsel: imar planı üzerinde değerlendirme'
  },
  scope: {
    h2: 'Silivri mimari danışmanlık hizmetimiz neleri kapsar?',
    text: 'Yapıyla ilgili en önemli kararlar çoğu zaman proje çizilmeden önce verilir. Bir arsanın ne kadar yapılaşabileceği, mevcut bir binanın dönüşüm seçenekleri ya da bir yatırımın uygulanabilirliği; doğru teknik değerlendirme yapılmadan netleşmez.',
    // [terim, açıklama, ikon (24×24, ince çizgi)]
    items: [
      ['İmar durumu analizi', 'emsal, çekme mesafeleri, kat ve yükseklik sınırlarının yorumlanması', 'M4 4h16v16H4zM8 8h8v8H8z'],
      ['Arsa değerlendirme', 'satın alma öncesi yapılaşma potansiyeli ve risklerin raporlanması', 'M12 3a5 5 0 0 1 5 5c0 4-5 9-5 9s-5-5-5-9a5 5 0 0 1 5-5zM12 7.5v1M3 21l3-3h12l3 3z'],
      ['Yapılaşma ve fizibilite', 'arsaya sığabilecek yapı büyüklüğü ve alternatiflerin karşılaştırılması', 'M4 20h16M6 20v-6M10 20V9M14 20v-8M18 20V5'],
      ['Kentsel dönüşüm danışmanlığı', 'sürecin adımları, proje alternatifleri ve malik görüşmelerine teknik destek', 'M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4M10 15v-4l2-1.5 2 1.5v4'],
      ['Kat karşılığı projelerde teknik destek', 'paylaşım, plan ve sözleşme eklerinin mimari açıdan değerlendirilmesi', 'M7 4L3 8l4 4M3 8h12M17 12l4 4-4 4M21 16H9'],
      ['Yapı malzemeleri ve uygulama danışmanlığı', 'doğru malzeme ve sistem seçimi', 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z']
    ]
  },
  types: {
    eyebrow: 'Konular',
    h2: 'Hangi konularda danışmanlık veriyoruz?',
    cards: [
      { h3: 'Arsa ve imar', text: 'Arsa almadan önce ya da proje başlamadan önce yapılaşma koşullarını ve riskleri netleştirmek için.',
        img: '/assets/img/hizmet/kiyi-kasabasi-arsa-parselleri', alt: 'Deniz kıyısındaki bir kasabanın kenarında toprak yollarla ayrılmış boş arsalar – havadan görünüm', ph: 'Görsel: arsa ve imar değerlendirmesi' },
      { h3: 'Kentsel dönüşüm', text: 'Riskli yapı sürecinden yeni projeye kadar, maliklerin doğru karar verebilmesi için teknik destek.',
        img: '/assets/img/hizmet/konut-insaati-cephe-isleri', alt: 'Cephesine yalıtım levhaları ve doğramalar takılan, iskele ve güvenlik filesiyle çevrili konut inşaatı', ph: 'Görsel: kentsel dönüşüm' },
      { h3: 'Kat karşılığı ve yatırım', text: 'Müteahhitle anlaşma öncesinde proje, paylaşım ve teknik şartların değerlendirilmesi.',
        img: '/assets/img/hizmet/konut-binasi-gorsellestirme', alt: 'Ahşap tavanlı girintili balkonları olan beş katlı çağdaş konut binası – mimari görselleştirme', ph: 'Görsel: kat karşılığı proje incelemesi' }
    ]
  },
  steps: [
    ['İhtiyacın netleşmesi', 'Kararınızı, elinizdeki belgeleri ve zaman planınızı konuşuyoruz.'],
    ['Belge ve yerinde inceleme', 'İmar durumu, tapu, mevcut projeler ve gerekirse yerinde tespit.'],
    ['Analiz', 'Yapılaşma koşullarını, seçenekleri ve riskleri değerlendiriyoruz.'],
    ['Rapor ve sunum', 'Bulgularımızı anlaşılır bir rapor ve görsellerle sunuyoruz.'],
    ['Karar desteği', 'Sonraki adımlarda (proje, ruhsat, müteahhit görüşmeleri) yanınızda oluyoruz.']
  ],
  why: {
    h2: 'Arsa almadan önce neden mimara danışılmalı?',
    text: 'İlan fiyatı cazip görünen bir arsa; çekme mesafeleri, yol durumu ya da imar kısıtları nedeniyle beklenenden çok daha az yapılaşma imkânı sunabilir. Satın alma öncesinde yapılan kısa bir mimari değerlendirme, bu riskleri ortaya koyarak yanlış yatırımın önüne geçer.',
    note: 'Kararınızı verdiniz mi?',
    link: 'Mimari proje hizmetini inceleyin',
    href: '/hizmetler/mimari-proje/'
  },
  related: [
    ['Mimari Proje', 'Mimari proje hizmetini inceleyin', '/hizmetler/mimari-proje/'],
    ['Ruhsat ve İskân Süreçleri', 'Ruhsat ve iskân süreçlerini inceleyin', '/hizmetler/ruhsat-iskan/'],
    ['Bilirkişilik ve Teknik İnceleme', 'Bilirkişilik hizmetini inceleyin', '/hizmetler/bilirkisilik/']
  ],
  faq: [
    ["Silivri'de arsa almadan önce mimari danışmanlık neden gerekli?", 'Arsanın gerçek yapılaşma potansiyeli ancak imar durumu ve arazinin koşulları birlikte değerlendirildiğinde ortaya çıkar. Satın alma öncesi yapılan değerlendirme, beklentinizle arsanın imkânlarının örtüşüp örtüşmediğini gösterir.'],
    ['Kentsel dönüşümde mimarlık ofisi hangi aşamalarda destek verir?', 'Süreç adımlarının açıklanmasından yeni projenin alternatiflerinin hazırlanmasına, maliklerle yapılan görüşmelere teknik destekten müteahhit tekliflerinin değerlendirilmesine kadar birçok aşamada destek veriyoruz.'],
    ['Kat karşılığı anlaşmadan önce neye dikkat etmeliyim?', 'Proje alternatiflerinin, bağımsız bölüm paylaşımının, malzeme ve teslim şartlarının sözleşmede açıkça tanımlanması önemlidir. Bu konuları imzadan önce teknik açıdan değerlendirmenizi öneriyoruz.'],
    ['Danışmanlık sonunda yazılı rapor alıyor muyum?', 'Evet. Kapsama göre bulguları, seçenekleri ve önerileri içeren yazılı bir rapor hazırlıyor, gerekirse görsellerle destekliyoruz.'],
    ['Danışmanlık ücreti nasıl belirlenir?', 'Ücret; konunun kapsamına, yerinde inceleme gerekip gerekmediğine ve rapor detayına göre belirlenir. Konuyu dinledikten sonra size özel teklif hazırlıyoruz.']
  ],
  cta: {
    h2: 'Kararınızı doğru bilgiyle verin',
    text: 'Arsanızı, binanızı ya da projenizi anlatın; önce neyin mümkün olduğunu birlikte netleştirelim.'
  }
};
