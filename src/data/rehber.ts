import {
  ActivityIcon,
  AwardIcon,
  Building2Icon,
  CalendarClockIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  RocketIcon,
  SettingsIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  SirenIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'

/* ------------------------------ Türler ----------------------------------- */

export type RehberKapsam = 'panel' | 'firma' | 'portal'
export type RehberDurum = 'Yayında' | 'Taslak' | 'Arşiv'

/** Ekran görüntüsü üzerindeki işaret — yüzde koordinat (0–100) */
export interface RehberIsaret {
  x: number
  y: number
  no?: number
  aciklama?: string
}

export interface RehberAdim {
  baslik: string
  aciklama: string
  /** /rehber/ altındaki gerçek ekran görüntüsü dosya adı */
  gorsel?: string
  isaretler?: RehberIsaret[]
  ipucu?: string
  dikkat?: string
}

export interface Rehber {
  id: string
  baslik: string
  aciklama: string
  /** tahmini okuma süresi (dk) */
  sure: number
  adimlar: RehberAdim[]
  sonuc?: string
  /** "İlgili modüle git" hedefi — boşsa modül rotası kullanılır */
  rota?: string
}

export interface ModulSss {
  soru: string
  cevap: string
}

export interface Modul {
  id: string
  ad: string
  kategori: string
  ikon: LucideIcon
  /** Kart üzerindeki kısa açıklama */
  aciklama: string
  /** Detay sayfası giriş paragrafı */
  nedir: string
  neZaman?: string
  kimler: string
  sekmeler?: { ad: string; gorev: string }[]
  /** Uygulama içi rota — "Modüle git" hedefi */
  rota?: string
  kapsam: RehberKapsam[]
  rehberler: Rehber[]
  sss: ModulSss[]
  iliskili?: string[]
  /** Henüz geliştirilmemiş özellikler — "Yakında" rozetiyle gösterilir */
  yakinda?: string[]
  populer?: boolean
}

export interface RehberKategori {
  id: string
  ad: string
  aciklama: string
}

/* ----------------------------- Kategoriler -------------------------------- */

export const KATEGORILER: RehberKategori[] = [
  { id: 'baslangic', ad: 'Başlangıç', aciklama: 'isghub\'u ilk kez kullananlar için yol haritası' },
  { id: 'genel', ad: 'Genel Kullanım', aciklama: 'Dashboard, arama, bildirim ve tema gibi ortak alanlar' },
  { id: 'isg', ad: 'İSG Yönetimi', aciklama: 'Risk değerlendirme, aksiyon, olay ve denetim süreçleri' },
  { id: 'egitim', ad: 'Eğitim & Belgeler', aciklama: 'Eğitim kataloğu, atamalar, sınav ve sertifikalar' },
  { id: 'organizasyon', ad: 'Organizasyon', aciklama: 'Firmalar, İSG-KATİP, personel ve ekip yönetimi' },
  { id: 'portallar', ad: 'Kullanıcı Portalları', aciklama: 'Firma yetkilisi ve katılımcı portallarının kullanımı' },
  { id: 'ayarlar', ad: 'Sistem Ayarları', aciklama: 'Kurum, kullanıcı, izin ve entegrasyon ayarları' },
  { id: 'yakinda', ad: 'Yakında', aciklama: 'Geliştirme aşamasındaki modüller' },
]

/* ------------------------------- Modüller --------------------------------- */

export const MODULLER: Modul[] = [
  /* ============================ BAŞLANGIÇ ============================ */
  {
    id: 'baslangic',
    ad: "isghub'a Başlarken",
    kategori: 'baslangic',
    ikon: RocketIcon,
    aciklama: 'İlk girişten ilk denetime — uygulamayı sıfırdan öğrenmek için önerilen okuma sırası.',
    nedir:
      "isghub, OSGB operasyonunuzu tek çalışma alanında toplar: firmalar, personel, eğitim, sertifika, risk değerlendirme, denetim ve aksiyon takibi. Bu bölüm yeni kullanıcıların sistemi mantıklı bir sırayla öğrenmesi için hazırlanmıştır.",
    kimler: 'Yeni isghub kullanıcıları, OSGB yöneticileri ve uzmanlar.',
    kapsam: ['panel'],
    rota: '/panel',
    populer: true,
    rehberler: [
      {
        id: 'ilk-giris',
        baslik: 'İlk giriş ve arayüz turu',
        aciklama: 'Hesabınızla giriş yapın, panelin ana bölümlerini tanıyın.',
        sure: 3,
        adimlar: [
          {
            baslik: 'Giriş yapın',
            aciklama:
              'Giriş sayfasında kullanıcı adınızı ve şifrenizi yazın. Hesap türünüz (yönetim, firma veya katılımcı) otomatik olarak tanınır ve doğru portala yönlendirilirsiniz.',
            gorsel: 'giris.png',
            isaretler: [
              { x: 76, y: 33, no: 1, aciklama: 'Kullanıcı adı ve şifre alanları' },
              { x: 76, y: 51, no: 2, aciklama: 'Giriş yap butonu' },
            ],
          },
          {
            baslik: 'Paneli tanıyın',
            aciklama:
              'Sol menü modüllere erişimi sağlar. Üstteki bar (topbar) sayfa konumunu, aramayı, bildirimleri, tema geçişini ve hesap menünüzü içerir.',
            gorsel: 'dashboard.png',
            isaretler: [
              { x: 7, y: 40, no: 1, aciklama: 'Modül menüsü' },
              { x: 50, y: 3, no: 2, aciklama: 'Topbar (arama, bildirim, tema, hesap)' },
            ],
          },
          {
            baslik: 'Tema ve bildirimler',
            aciklama:
              'Güneş/ay simgesiyle açık-koyu tema arasında geçiş yapın. Zil simgesi yaklaşan son tarihler ve bekleyen işlemler hakkında uyarı gösterir.',
            gorsel: 'bildirimler.png',
            ipucu: 'Bildirim satırına tıklamak sizi doğrudan ilgili kayda götürür.',
          },
        ],
        sonuc: 'Artık panele giriş yapabilir ve temel gezinmeyi kullanabilirsiniz.',
        rota: '/panel',
      },
      {
        id: 'temel-akis',
        baslik: 'Temel iş akışı: firmadan sertifikaya',
        aciklama: "isghub'ın ana operasyon döngüsü — hangi modül hangi sırayla kullanılır.",
        sure: 5,
        adimlar: [
          {
            baslik: 'Firmayı ekleyin',
            aciklama:
              'Firmalar modülünden yeni müşteri firmanızı oluşturun; firma yetkilisi hesabını tanımlayın.',
            gorsel: 'firmalar.png',
          },
          {
            baslik: 'Personeli ekleyin',
            aciklama:
              'Firmanın çalışanlarını Personeller modülünden tek tek veya Excel ile toplu ekleyin.',
            gorsel: 'personeller.png',
          },
          {
            baslik: 'Eğitim atayın',
            aciklama:
              'Eğitim Atamaları sayfasından seçili eğitimi bir firmanın personeline atayın; son tarih belirleyin.',
            gorsel: 'egitim-atamalari.png',
          },
          {
            baslik: 'Sertifikayı onaylayın',
            aciklama:
              'Eğitimini tamamlayan personelin sertifika başvurusu Sertifika Onay sayfasında listelenir; inceleyip onaylayın.',
            gorsel: 'sertifika-onay.png',
          },
          {
            baslik: 'Saha süreçlerini yürütün',
            aciklama:
              'Risk değerlendirmesi oluşturun, denetim planlayın, uygunsuzlukları aksiyona dönüştürün ve merkezi Aksiyonlar modülünden takip edin.',
            gorsel: 'denetimler.png',
          },
        ],
        sonuc: 'Bu döngü isghub operasyonunun omurgasıdır; her adımın detaylı rehberi kendi modülünde anlatılır.',
      },
    ],
    sss: [
      {
        soru: 'Hangi hesap türüyle giriş yapmalıyım?',
        cevap:
          'Tek giriş formu vardır; hesabınızın türü kullanıcı adından otomatik çözülür. Yönetim hesapları /panel, firma yetkilileri /firma, katılımcılar /portal alanına yönlendirilir.',
      },
      {
        soru: 'Demo hesabı nasıl açılır?',
        cevap:
          'Giriş sayfasındaki demo butonlarından birine basın — ilgili portal demo verileriyle açılır. Demo veriler gerçek kayıtlardan izole tutulur ve çıkışta sıfırlanır.',
      },
    ],
  },

  /* ============================ GENEL KULLANIM ============================ */
  {
    id: 'genel-bakis',
    ad: 'Genel Bakış (Dashboard)',
    kategori: 'genel',
    ikon: LayoutDashboardIcon,
    aciklama: 'Operasyonun günlük nabzı — KPI kartları, grafikler, yaklaşan işler ve hızlı erişimler.',
    nedir:
      'Genel Bakış, giriş sonrası açılan ana ekrandır. Firma sayıları, eğitim ilerlemeleri, açık aksiyonlar, yaklaşan son tarihler ve denetim durumu gibi kritik metrikleri tek ekranda toplar.',
    kimler: 'Tüm yönetim kullanıcıları.',
    kapsam: ['panel'],
    rota: '/panel',
    populer: true,
    rehberler: [
      {
        id: 'dashboard-turu',
        baslik: 'Dashboard öğelerini okuma',
        aciklama: 'KPI kartları, grafikler ve aktivite akışının anlamı.',
        sure: 3,
        adimlar: [
          {
            baslik: 'KPI kartlarını inceleyin',
            aciklama:
              'Üst bölümdeki kartlar toplam firma, personel, aktif eğitim, açık aksiyon gibi canlı sayaçları gösterir.',
            gorsel: 'dashboard.png',
            isaretler: [{ x: 45, y: 52, no: 1, aciklama: 'KPI kartları' }],
          },
          {
            baslik: 'Grafikleri kullanın',
            aciklama:
              'Trend çizgileri ve dağılım grafikleri eğitim tamamlama, aksiyon kapanma ve denetim yoğunluğunu gösterir. Noktaların üzerine gelerek değer okuyun.',
            gorsel: 'dashboard.png',
          },
          {
            baslik: 'Bekleyen işleri takip edin',
            aciklama:
              'Sağ taraftaki listeler yaklaşan son tarihleri ve bekleyen onayları gösterir; satıra tıklayarak ilgili modüle geçin.',
            gorsel: 'dashboard.png',
          },
        ],
        sonuc: 'Dashboard operasyonun günlük kontrol noktasıdır — sabah açılış ekranı olarak kullanın.',
        rota: '/panel',
      },
    ],
    sss: [
      {
        soru: 'Dashboard verileri canlı mı?',
        cevap: 'Evet — kartlar ve grafikler mevcut modül kayıtlarından anlık hesaplanır; sayfa yenilemeden güncellenir.',
      },
      {
        soru: 'Dashboard düzenini değiştirebilir miyim?',
        cevap: 'Sayfadaki Özelleştir seçeneğiyle görünen blokları açıp kapatabilirsiniz.',
      },
    ],
  },
  {
    id: 'bildirim-arama',
    ad: 'Bildirimler, Arama & Tema',
    kategori: 'genel',
    ikon: ActivityIcon,
    aciklama: 'Topbar’daki bildirim merkezi, genel arama ve açık-koyu tema geçişi.',
    nedir:
      'Üst bar üç ortak aracı barındırır: genel arama (modül kayıtlarında hızlı bulma), bildirim zili (yaklaşan işler ve uyarılar) ve tema geçişi.',
    kimler: 'Tüm kullanıcılar (panel, firma ve katılımcı portalı).',
    kapsam: ['panel', 'firma', 'portal'],
    rehberler: [
      {
        id: 'bildirimler',
        baslik: 'Bildirimleri kullanma',
        aciklama: 'Yaklaşan son tarihler ve bekleyen işler için uyarıları okuyun.',
        sure: 2,
        adimlar: [
          {
            baslik: 'Zil simgesine tıklayın',
            aciklama:
              'Okunmamış bildirim sayısı amber rozetle gösterilir. Menüde her bildirim bir ikon ve kısa açıklamayla listelenir.',
            gorsel: 'bildirimler.png',
            isaretler: [{ x: 79, y: 3, no: 1, aciklama: 'Bildirim zili' }],
          },
          {
            baslik: 'Bildirime tıklayın',
            aciklama:
              'Satıra tıklamak sizi doğrudan ilgili kayda götürür (ör. süresi geçen aksiyon, kontrol bekleyen denetim bulgusu).',
            ipucu: '"Tümünü okundu say" mevcut sayacı sıfırlar; yeni uyarılar gelmeye devam eder.',
          },
        ],
      },
      {
        id: 'genel-arama',
        baslik: 'Genel arama',
        aciklama: 'Firma, personel, denetim ve kayıtları tek alandan arayın.',
        sure: 2,
        adimlar: [
          {
            baslik: 'Arama kutusunu açın',
            aciklama:
              'Topbar’daki arama alanına yazmaya başlayın; sonuçlar modül bazında gruplanarak listelenir.',
            gorsel: 'arama.png',
          },
          {
            baslik: 'Sonuca gidin',
            aciklama:
              'Sonuç satırına tıklamak ilgili detay sayfasını açar. Denetimler, firmalar ve diğer kayıtlar gerçek veriyle indekslenir.',
          },
        ],
      },
      {
        id: 'tema',
        baslik: 'Açık / koyu tema',
        aciklama: 'Göz konforuna göre tema seçin.',
        sure: 1,
        adimlar: [
          {
            baslik: 'Güneş/ay simgesine tıklayın',
            aciklama:
              'Topbar’daki tema düğmesi açık ve koyu tema arasında animasyonlu geçiş yapar. Tercih tarayıcıda saklanır.',
            gorsel: 'dashboard.png',
          },
        ],
      },
    ],
    sss: [
      {
        soru: 'Bildirimler nereden geliyor?',
        cevap:
          'Bildirimler gerçek kayıtlardan türetilir: süresi geçen sözleşmeler, yaklaşan belge tarihleri, bekleyen davetler, geciken denetim/aksiyonlar ve kritik bulgular.',
      },
    ],
  },

  /* ============================ İSG YÖNETİMİ ============================ */
  {
    id: 'risk',
    ad: 'Risk Değerlendirme',
    kategori: 'isg',
    ikon: ShieldAlertIcon,
    aciklama: 'İşyeri tehlike ve risklerinin sistematik belirlenmesi, skorlanması ve izlenmesi.',
    nedir:
      'Risk Değerlendirme modülü, işyerindeki tehlikeleri belirleyip olasılık ve şiddet üzerinden skorlayarak 5×5 risk matrisine yerleştirir. Değerlendirmeler firma ve işyeri bazlıdır; her risk düzeltici aksiyona bağlanabilir.',
    neZaman: 'Yeni firma sözleşmesinde, periyodik yenilemelerde ve olay/uygunsuzluk sonrası revizyonlarda.',
    kimler: 'İSG uzmanları ve yönetim kullanıcıları.',
    kapsam: ['panel'],
    rota: '/panel/risk',
    populer: true,
    iliskili: ['aksiyonlar', 'denetimler'],
    rehberler: [
      {
        id: 'risk-olustur',
        baslik: 'Risk değerlendirmesi oluşturma',
        aciklama: 'Yeni bir değerlendirme başlatıp firma ve kapsamı belirleyin.',
        sure: 4,
        adimlar: [
          {
            baslik: 'Değerlendirmeler listesini açın',
            aciklama:
              'Sol menüden Risk Değerlendirme bölümüne girin. Mevcut değerlendirmeler durum, firma ve yenileme tarihiyle listelenir.',
            gorsel: 'risk.png',
          },
          {
            baslik: 'Yeni değerlendirme başlatın',
            aciklama:
              'Yeni değerlendirme oluşturma akışında firmayı, işyeri/lokasyonu, değerlendirme ekibini ve yöntemi belirleyin.',
            gorsel: 'risk-detay.png',
          },
          {
            baslik: 'Tehlike ve riskleri girin',
            aciklama:
              'Her tehlike kaydı için olasılık ve şiddet seçin; sistem skoru hesaplar ve 5×5 matrise yerleştirir. Mevcut kontrolleri ve yasal referansı ekleyin.',
            gorsel: 'risk-detay.png',
            dikkat: 'Skor hesabı otomatiktir — manuel değiştirmek yerine olasılık/şiddet girdisini düzeltin.',
          },
          {
            baslik: 'Aksiyonlara bağlayın',
            aciklama:
              'Kabul edilemez riskler için değerlendirme içinden doğrudan aksiyon oluşturun; kayıt merkezi Aksiyonlar modülüne düşer.',
            gorsel: 'aksiyonlar.png',
          },
        ],
        sonuc: 'Değerlendirme yayına alınır; yenileme tarihi yaklaşınca bildirim alırsınız.',
        rota: '/panel/risk',
      },
      {
        id: 'risk-rapor',
        baslik: 'Değerlendirme raporu ve aktarım',
        aciklama: 'Risk matrisini PDF olarak çıkarın, Excel ile dışa aktarın.',
        sure: 2,
        adimlar: [
          {
            baslik: 'Değerlendirme detayını açın',
            aciklama: 'Listeden değerlendirmeye tıklayın; matris, tehlike listesi ve aksiyonlar tek sayfada görünür.',
            gorsel: 'risk-detay.png',
          },
          {
            baslik: 'PDF / Excel alın',
            aciklama:
              'Detay üstündeki aktarım seçenekleriyle kurumsal PDF raporu oluşturun veya listeyi Excel olarak indirin.',
            ipucu: 'PDF, denetim raporlarıyla aynı kurumsal şablonu kullanır — imza ve onay blokları içerir.',
          },
        ],
        rota: '/panel/risk',
      },
    ],
    sss: [
      {
        soru: 'Risk skoru nasıl hesaplanıyor?',
        cevap:
          'Olasılık × şiddet çarpımı skoru verir ve 5×5 matriste düşük/orta/yüksek/kritik bölgeye düşer. Skor otomatiktir.',
      },
      {
        soru: 'Denetimde bulunan uygunsuzluk riske bağlanabilir mi?',
        cevap:
          'Evet — denetim bulgusu detayından mevcut bir risk kaydıyla ilişkilendirilebilir veya Risk modülünde yeni kayıt açılabilir.',
      },
      {
        soru: 'Yenileme uyarısı nasıl çalışır?',
        cevap: 'Değerlendirmenin yenileme tarihi yaklaştığında bildirim merkezinde ve listede uyarı görünür.',
      },
    ],
  },
  {
    id: 'aksiyonlar',
    ad: 'Aksiyonlar',
    kategori: 'isg',
    ikon: CalendarClockIcon,
    aciklama: 'Risk ve denetimden doğan düzeltici faaliyetlerin merkezi takip ekranı.',
    nedir:
      'Aksiyonlar, risk değerlendirmelerinden ve denetim bulgularından oluşan tüm düzeltici faaliyetleri tek listede toplar. Sorumlu, termin, öncelik ve durum takibi yapılır; tamamlanan aksiyonlar kontrol edilip kapatılır veya yeniden açılır.',
    kimler: 'İSG uzmanları, sorumlular ve yöneticiler.',
    kapsam: ['panel'],
    rota: '/panel/aksiyonlar',
    populer: true,
    iliskili: ['risk', 'denetimler'],
    sekmeler: [
      { ad: 'Liste', gorev: 'Tüm açık ve kapalı aksiyonlar; filtre, arama, Excel aktarımı' },
      { ad: 'Detay', gorev: 'Aksiyon açıklaması, kanıt dosyaları, durum geçmişi' },
    ],
    rehberler: [
      {
        id: 'aksiyon-takip',
        baslik: 'Aksiyonları takip etme',
        aciklama: 'Açık aksiyonları süzün, gecikenleri yakalayın.',
        sure: 3,
        adimlar: [
          {
            baslik: 'Aksiyon listesini açın',
            aciklama:
              'Risk Değerlendirme altındaki Aksiyonlar sekmesi tüm kaynaklardan (risk + denetim) gelen faaliyetleri listeler.',
            gorsel: 'aksiyonlar.png',
          },
          {
            baslik: 'Filtreleyin',
            aciklama:
              'Firma, durum, öncelik ve sorumluya göre süzün; arama kutusu başlık ve sorumlu adında arar.',
            gorsel: 'aksiyonlar.png',
          },
          {
            baslik: 'Gecikenleri görün',
            aciklama:
              'Termin tarihi geçmiş açık aksiyonlar kırmızı uyarıyla işaretlenir ve bildirim merkezine düşer.',
            dikkat: 'Geciken denetim aksiyonları denetim detayında da "gecikti" olarak görünür.',
          },
        ],
        sonuc: 'Tüm düzeltici faaliyetler tek merkezden izlenir.',
        rota: '/panel/aksiyonlar',
      },
      {
        id: 'aksiyon-kapat',
        baslik: 'Aksiyon tamamlama ve kontrol',
        aciklama: 'Tamamlanma notu, kanıt ve uzman kontrolüyle kapanış.',
        sure: 3,
        adimlar: [
          {
            baslik: 'Aksiyonu açın',
            aciklama: 'Listede aksiyona tıklayın; açıklama, kaynak (risk/denetim) ve geçmiş görünür.',
            gorsel: 'aksiyonlar.png',
          },
          {
            baslik: 'Tamamlanma bilgisi girin',
            aciklama:
              'Tamamla işleminde yapılan işin açıklaması zorunludur; kanıt fotoğrafı veya dosya eklenebilir.',
          },
          {
            baslik: 'Kontrol ve kapanış',
            aciklama:
              'Denetim kaynaklı aksiyonlar "Kontrol Bekliyor" durumuna geçer; denetimi yapan uzman uygunsa kapatır, yetersizse gerekçeyle yeniden açar.',
            ipucu: 'Yeniden açılan aksiyon ilgili denetim bulgusunu da açık duruma döndürür.',
          },
        ],
        sonuc: 'Kapanan denetim aksiyonu bağlı bulgunun kapanmasını sağlar.',
        rota: '/panel/aksiyonlar',
      },
    ],
    sss: [
      {
        soru: 'Denetim bulgusu aksiyona nasıl dönüşür?',
        cevap:
          'Denetim detayı → Uygunsuzluklar sekmesindeki "Aksiyona Dönüştür" ile sorumlu/termin/öncelik onayı alınarak merkezi aksiyon oluşturulur.',
      },
      {
        soru: 'Aksiyon silinebilir mi?',
        cevap: 'Kapanış yerine iptal kullanılır; kayıt geçmişi korunur.',
      },
    ],
  },
  {
    id: 'olaylar',
    ad: 'Olay Bildirimleri',
    kategori: 'isg',
    ikon: SirenIcon,
    aciklama: 'İş kazası, ramak kala ve tehlikeli durum bildirimlerinin kaydı ve incelemesi.',
    nedir:
      'Olay Bildirimleri, sahada yaşanan iş kazaları, ramak kala olayları ve tehlikeli durumları kayıt altına alır. Her bildirim sınıflandırılır, incelenir ve gerektiğinde aksiyona dönüştürülür.',
    kimler: 'İSG uzmanları ve olayları bildiren sorumlular.',
    kapsam: ['panel'],
    rota: '/panel/olaylar',
    iliskili: ['risk', 'aksiyonlar'],
    rehberler: [
      {
        id: 'olay-bildir',
        baslik: 'Olay bildirimi oluşturma',
        aciklama: 'Yeni kaza/ramak kala kaydını form üzerinden girin.',
        sure: 3,
        adimlar: [
          {
            baslik: 'Olay listesini açın',
            aciklama: 'Olay Bildirimleri sayfası tüm kayıtları durum ve sınıfa göre listeler.',
            gorsel: 'olaylar.png',
          },
          {
            baslik: 'Yeni olay formunu doldurun',
            aciklama:
              'Yeni Olay ile açılan form çekmecesinde firma, lokasyon, olay sınıfı, açıklama ve tarih bilgilerini girin.',
            ipucu: 'Ramak kala bildirimleri de aynı formdan yapılır — sınıfı doğru seçin.',
          },
        ],
        rota: '/panel/olaylar',
      },
      {
        id: 'olay-incele',
        baslik: 'Olayı inceleme ve sonuçlandırma',
        aciklama: 'Bildirimi inceleyin, kök nedeni yazın, gerekirse aksiyon açın.',
        sure: 3,
        adimlar: [
          {
            baslik: 'Olay detayını açın',
            aciklama: 'Listeden bildirime tıklayın; detay çekmecesi açıklama ve durum geçmişini gösterir.',
          },
          {
            baslik: 'İnceleme sonucunu işleyin',
            aciklama: 'Durumu güncelleyin, kök neden ve alınan önlemleri kaydedin.',
          },
          {
            baslik: 'Aksiyon oluşturun',
            aciklama: 'Tekrarını önlemek için gereken düzeltici işi Aksiyonlar modülüne bağlayın.',
          },
        ],
        rota: '/panel/olaylar',
      },
    ],
    sss: [
      {
        soru: 'Olay türleri neler?',
        cevap: 'İş kazası, ramak kala ve tehlikeli durum/davranış sınıflarıyla kayıt tutulur.',
      },
    ],
  },
  {
    id: 'denetimler',
    ad: 'Denetimler',
    kategori: 'isg',
    ikon: ClipboardCheckIcon,
    aciklama: 'Saha denetimlerinin planlanması, mobil kontrol listesi, uygunsuzluk ve PDF rapor yönetimi.',
    nedir:
      'Denetimler, işyerlerindeki İSG uygulamalarının fiilen kontrol edildiği operasyon modülüdür. Kontrol listeleriyle sahada madde madde değerlendirme yapılır; uygunsuzluklar fotoğraflı kaydedilir, düzeltici faaliyetlere dönüştürülür ve kurumsal PDF raporu üretilir.',
    neZaman: 'Planlı saha denetimleri, periyodik kontroller ve olay sonrası yerinde incelemelerde.',
    kimler: 'İSG uzmanları (sahada mobil) ve yöneticiler (planlama/rapor).',
    kapsam: ['panel'],
    rota: '/panel/denetimler',
    populer: true,
    iliskili: ['risk', 'aksiyonlar'],
    sekmeler: [
      { ad: 'Genel Bakış', gorev: 'Denetim özeti, ilerleme sayaçları, puan ve açık aksiyonlar' },
      { ad: 'Kontrol Listesi', gorev: 'Kategori bazında tüm maddeler ve verilen yanıtlar' },
      { ad: 'Uygunsuzluklar', gorev: 'Bulgular, önem dereceleri, fotoğraflar, düzeltici faaliyetler' },
      { ad: 'Aksiyonlar', gorev: 'Bu denetimden üretilen aksiyonların durumu' },
      { ad: 'Dokümanlar', gorev: 'Rapor sürümleri ve ek belgeler' },
      { ad: 'Geçmiş', gorev: 'Kim ne yaptı — durum geçişleri ve değişiklik kayıtları' },
    ],
    rehberler: [
      {
        id: 'denetim-planla',
        baslik: 'Denetim planlama',
        aciklama: 'Sihirbaz ile yeni denetim oluşturun: bilgiler → şablon → ekip → özet.',
        sure: 4,
        adimlar: [
          {
            baslik: 'Denetimler sayfasını açın',
            aciklama:
              'Operasyon merkezi; üstte istatistik kartları, altta liste/takvim görünümü. "Yeni Denetim Oluştur" ile sihirbazı başlatın.',
            gorsel: 'denetimler.png',
            isaretler: [{ x: 79, y: 19, no: 1, aciklama: 'Yeni Denetim Oluştur' }],
          },
          {
            baslik: 'Adım 1 — Bilgiler',
            aciklama:
              'Başlık, firma (seçilince bilgileri otomatik gelir), lokasyon, denetim türü, planlanan tarih ve sorumlu uzmanı girin.',
            gorsel: 'denetim-yeni.png',
          },
          {
            baslik: 'Adım 2 — Kontrol listesi',
            aciklama:
              'Bir veya birden fazla şablon seçin; madde sayıları önizlenir. Şablonlar sürümlüdür — denetim o anki sürüme bağlanır.',
            gorsel: 'denetim-yeni.png',
          },
          {
            baslik: 'Adım 3-4 — Ekip ve özet',
            aciklama:
              'Katılımcıları ve hazırlık notlarını ekleyin; özeti kontrol edip "Taslak" veya "Planla" ile kaydedin. Aynı uzmana çakışan denetim varsa uyarı çıkar.',
            gorsel: 'denetim-yeni.png',
          },
        ],
        sonuc: 'Planlanan denetim takvimde görünür ve sorumluya bildirim düşer.',
        rota: '/panel/denetimler/yeni',
      },
      {
        id: 'saha-denetimi',
        baslik: 'Sahada denetim yapma (mobil)',
        aciklama: 'Telefondan madde madde kontrol: uygun / uygunsuz / uygulanamaz.',
        sure: 5,
        adimlar: [
          {
            baslik: 'Denetimi başlatın',
            aciklama:
              'Denetim detayından "Sahada Devam Et" ile mobil ekranı açın. Üstte sabit ilerleme çubuğu sayaçları gösterir.',
            gorsel: 'denetim-saha.png',
          },
          {
            baslik: 'Maddeyi değerlendirin',
            aciklama:
              'Her kontrol maddesi için Uygun / Uygunsuz / Uygulanamaz düğmelerinden birine dokunun; gözlem için not alanı vardır.',
            gorsel: 'denetim-saha.png',
            ipucu: 'Her yanıt anında kaydedilir — bağlantı kesse de veri kaybolmaz.',
          },
          {
            baslik: 'Fotoğraf ve konum ekleyin',
            aciklama:
              'Uygunsuzluklarda fotoğraf koşulu varsa kamera/galeri ile ekleyin; bölüm bilgisini yazın.',
            dikkat: 'Fotoğraf zorunlu maddeler foto olmadan tamamlanamaz.',
          },
          {
            baslik: 'Kontrolleri bitirin',
            aciklama:
              '"Bitir" zorunlu maddeleri denetler; eksik varsa listeler. Eksiksizse denetim "Rapor Bekliyor" durumuna geçer.',
            gorsel: 'denetim-saha.png',
          },
        ],
        sonuc: 'Denetim sahadan tamamlanır; uygunsuz işaretlenen maddeler bulgu önerisi üretir.',
        rota: '/panel/denetimler',
      },
      {
        id: 'uygunsuzluk-aksiyon',
        baslik: 'Uygunsuzluğu aksiyona dönüştürme',
        aciklama: 'Bulgu kaydı → sorumlu/termin → merkezi aksiyon.',
        sure: 3,
        adimlar: [
          {
            baslik: 'Uygunsuzluklar sekmesini açın',
            aciklama:
              'Denetim detayında bulgular önem derecesi ve durumlarıyla listelenir.',
            gorsel: 'denetim-detay.png',
          },
          {
            baslik: '"Aksiyona Dönüştür"ü kullanın',
            aciklama:
              'Onay penceresinde sorumlu, termin ve öncelik gelir — düzenleyip onaylayın. Kayıt Aksiyonlar modülüne düşer; bulgu "Aksiyonda" olur.',
            gorsel: 'denetim-detay.png',
          },
          {
            baslik: 'Kapanışı izleyin',
            aciklama:
              'Aksiyon tamamlanınca bulgu "Kontrol Bekliyor"a geçer; uzman kanıtı inceler, uygunsa kapatır, yetersizse yeniden açar.',
          },
        ],
        sonuc: 'Bulguların giderilmesi merkezi aksiyon takibinden yürür — ayrı liste tutulmaz.',
        rota: '/panel/aksiyonlar',
      },
      {
        id: 'denetim-rapor',
        baslik: 'PDF raporu ve şablon yönetimi',
        aciklama: 'Kurumsal rapor üretimi, sürüm saklama ve kontrol listesi düzenleme.',
        sure: 4,
        adimlar: [
          {
            baslik: 'PDF oluşturun',
            aciklama:
              'Denetim detayı üstündeki rapor düğmesi kurumsal PDF üretir: logo, ekip, madde sonuçları, bulgular+fotoğraflar, aksiyon planı ve imza blokları.',
            gorsel: 'denetim-detay.png',
          },
          {
            baslik: 'Sürümleri takip edin',
            aciklama: 'Üretilen her rapor Dokümanlar sekmesinde sürüm numarasıyla saklanır; eski sürümler silinmez.',
          },
          {
            baslik: 'Şablonları yönetin',
            aciklama:
              'Şablonlar sayfasında kategori ve madde düzenleme, sürümleme, arşivleme ve yeni denetim türü ekleme yapılır.',
            gorsel: 'denetim-sablonlar.png',
            ipucu: 'Şablon düzenlendiğinde yeni sürüm çıkar — tamamlanan eski denetimlerin listesi bozulmaz.',
          },
          {
            baslik: 'Analizlere bakın',
            aciklama: 'Raporlar sayfası aylık hacim, puan trendi, tür/önem dağılımı ve aksiyon sağlığını grafikler.',
            gorsel: 'denetim-raporlar.png',
          },
        ],
        rota: '/panel/denetimler/raporlar',
      },
    ],
    sss: [
      {
        soru: 'Denetim nasıl planlanır?',
        cevap: 'Denetimler → Yeni Denetim Oluştur sihirbazı: bilgiler, şablon seçimi, ekip, özet. Taslak veya Planla ile kaydedilir.',
      },
      {
        soru: 'Kontrol listesi nasıl oluşturulur?',
        cevap:
          'Şablonlar sayfasından yeni şablon açılır veya mevcut kopyalanır; kategori → madde yapısında soru, önem, zorunluluk, foto koşulu ve mevzuat referansı tanımlanır.',
      },
      {
        soru: 'Uygunsuzluk nasıl kaydedilir?',
        cevap:
          'Saha ekranında maddeyi "Uygunsuz" işaretleyin — bulgu önerisi otomatik oluşur; başlık, önem, foto ve önerilen faaliyet girilir.',
      },
      {
        soru: 'Aynı uzmana iki denetim atanabilir mi?',
        cevap: 'Planlama sırasında çakışma uyarısı gösterilir; istenirse yine de kaydedilebilir.',
      },
      {
        soru: 'İnternet kesilirse saha verisi kaybolur mu?',
        cevap: 'Her yanıt anında yerel kayda yazılır; sayfa yenilense bile ilerleme korunur.',
      },
    ],
  },

  /* ============================ EĞİTİM & BELGELER ============================ */
  {
    id: 'egitimler',
    ad: 'Eğitimler & Atamalar',
    kategori: 'egitim',
    ikon: GraduationCapIcon,
    aciklama: 'Eğitim kataloğu, içerik ve sınav editörü, oynatıcı, firma atamaları ve ilerleme takibi.',
    nedir:
      'Eğitimler modülü iki parçadan oluşur: Katalog (eğitim içeriklerinin, bölümlerin, video/PDF içeriklerin ve sınavların yönetimi) ve Atamalar (eğitimin hangi firma/personele, hangi son tarihle verildiği). Katılımcılar eğitimleri kendi portalında tamamlar; sınav sonucu sertifikaya bağlanır.',
    kimler: 'Eğitim sorumluları ve İSG yöneticileri.',
    kapsam: ['panel'],
    rota: '/panel/egitimler',
    populer: true,
    iliskili: ['sertifikalar', 'personeller'],
    sekmeler: [
      { ad: 'Katalog', gorev: 'Tüm eğitimler; oluşturma ve düzenleme' },
      { ad: 'Atamalar', gorev: 'Firma/personel bazlı eğitim atamaları ve durum' },
      { ad: 'Oynatıcı', gorev: 'Eğitim içeriklerinin önizleme/oynatımı' },
    ],
    rehberler: [
      {
        id: 'egitim-olustur',
        baslik: 'Eğitim oluşturma ve içerik düzenleme',
        aciklama: 'Editörde bölümler, video/PDF içerikler ve zorunluluk ayarları.',
        sure: 5,
        adimlar: [
          {
            baslik: 'Katalogdan yeni eğitim açın',
            aciklama:
              'Eğitimler sayfası katalog listesidir; yeni eğitim oluşturma akışında başlık, kategori, süre ve açıklama girilir.',
            gorsel: 'egitimler.png',
          },
          {
            baslik: 'Bölümler ve içerikler ekleyin',
            aciklama:
              'Editörde bölüm → içerik yapısında video, PDF ve metin içerikler ekleyin; her içerik zorunlu/isteğe bağlı işaretlenebilir.',
            gorsel: 'egitim-detay.png',
            ipucu: 'İçerik sırası sürükle-bırak ile değişir; sürüm yapısı eski atamaları korur.',
          },
          {
            baslik: 'Yayınlayın',
            aciklama: 'Taslak eğitim yayına alınınca atama ekranlarında seçilebilir olur.',
          },
        ],
        rota: '/panel/egitimler',
      },
      {
        id: 'sinav-hazirla',
        baslik: 'Sınav ve soru bankası',
        aciklama: 'Eğitime sınav ekleyin: sorular, puanlama, geçme notu.',
        sure: 4,
        adimlar: [
          {
            baslik: 'Editörde sınav bölümünü açın',
            aciklama: 'Eğitim düzenleme ekranında sınav tanımı ve soru listesi yönetilir.',
            gorsel: 'egitim-detay.png',
          },
          {
            baslik: 'Soruları girin',
            aciklama: 'Soru metni, seçenekler ve doğru cevabı tanımlayın; geçme puanı ve deneme hakkı ayarlanır.',
            dikkat: 'Sınavlı eğitimde katılımcı içerikleri bitirmeden sınava giremez.',
          },
        ],
        rota: '/panel/egitimler',
      },
      {
        id: 'egitim-ata',
        baslik: 'Eğitim atama',
        aciklama: 'Yeni Atama ile eğitimi firma personeline bağlayın.',
        sure: 3,
        adimlar: [
          {
            baslik: 'Atamalar sayfasını açın',
            aciklama: 'Eğitimler → Atamalar sekmesi mevcut atamaları eğitim ve firma bazında listeler.',
            gorsel: 'egitim-atamalari.png',
            isaretler: [{ x: 93, y: 13, no: 1, aciklama: 'Yeni Atama' }],
          },
          {
            baslik: 'Atamayı oluşturun',
            aciklama:
              'Eğitimi, firmayı ve personelleri seçin; son tarih belirleyin. Aynı eğitim aynı kişiye ayrı atamalarla tekrar verilebilir.',
            ipucu: 'Atama, eğitimin o anki sürümüne bağlanır — sonraki düzenlemeler eski atamayı etkilemez.',
          },
        ],
        sonuc: 'Atanan personelin katılımcı portalında eğitim görünür.',
        rota: '/panel/egitim-atamalari',
      },
      {
        id: 'ilerleme-takip',
        baslik: 'İlerleme ve raporlama',
        aciklama: 'Kim ne kadar ilerledi — kişi bazında durum takibi.',
        sure: 2,
        adimlar: [
          {
            baslik: 'Atama satırını açın',
            aciklama:
              'Atamalar listesinde her atama tamamlayan/devam eden/başlamayan dağılımını gösterir.',
            gorsel: 'egitim-atamalari.png',
          },
          {
            baslik: 'Kişi detayına inin',
            aciklama:
              'Atama detayında her personelin içerik ilerlemesi, sınav denemeleri ve puanı görünür; Excel aktarımı desteklenir.',
          },
        ],
        rota: '/panel/egitim-atamalari',
      },
    ],
    sss: [
      {
        soru: 'Yeni eğitim nasıl oluşturulur?',
        cevap: 'Eğitimler → yeni eğitim: başlık/kategori/süre girilir; editörde bölüm, içerik ve sınav eklenir, yayına alınır.',
      },
      {
        soru: 'Eğitim videosu nasıl eklenir?',
        cevap: 'Editörde bölüm içine video türünde içerik eklenir; kaynak bağlantısı veya dosya referansı tanımlanır.',
      },
      {
        soru: 'Personele eğitim nasıl atanır?',
        cevap: 'Atamalar → Yeni Atama: eğitim + firma + personel seçimi ve son tarih. Katılımcı portalında otomatik görünür.',
      },
      {
        soru: 'Aynı eğitim tekrar atanabilir mi?',
        cevap: 'Evet — ayrı atama kaydıyla aynı eğitim aynı personele yeniden verilebilir; ilerleme atama bazında tutulur.',
      },
    ],
  },
  {
    id: 'sertifikalar',
    ad: 'Sertifikalar',
    kategori: 'egitim',
    ikon: AwardIcon,
    aciklama: 'Sertifika belgeleri, şablon tasarım editörü, onay akışı ve QR doğrulama.',
    nedir:
      'Sertifika modülü üç ekrandan oluşur: Belgeler (düzenlenmiş sertifikalar), Tasarımlar (dikey/yatay şablonların görsel editörü) ve Onay Bekleyen (eğitimi bitiren katılımcıların sertifika başvuruları). Her sertifika doğrulama kodu ve QR ile doğrulanabilir.',
    kimler: 'Eğitim sorumluları ve yetkili onay kullanıcıları (sertifikalar.onayla izni).',
    kapsam: ['panel'],
    rota: '/panel/sertifikalar',
    populer: true,
    iliskili: ['egitimler'],
    sekmeler: [
      { ad: 'Belgeler', gorev: 'Düzenlenmiş sertifikalar; PDF indirme, iptal, geçmiş' },
      { ad: 'Tasarımlar', gorev: 'Şablon listesi ve görsel editör' },
      { ad: 'Onay bekleyen', gorev: 'Başvuru inceleme: onay / ret / eksik koşul' },
    ],
    rehberler: [
      {
        id: 'sertifika-onayla',
        baslik: 'Sertifika başvurusunu onaylama',
        aciklama: 'Onay Bekleyen listesinden başvuruyu inceleyip karar verin.',
        sure: 3,
        adimlar: [
          {
            baslik: 'Onay bekleyen sekmesini açın',
            aciklama:
              'Eğitimini tamamlayan katılımcıların başvuruları burada listelenir; eğitim, personel ve tamamlanma tarihi görünür.',
            gorsel: 'sertifika-onay.png',
          },
          {
            baslik: 'Başvuruyu inceleyin',
            aciklama:
              'Sınav sonucu ve içerik tamamlama durumunu kontrol edin; uygunsa Onayla, değilse Ret veya Eksik Koşul ile geri gönderin.',
            dikkat: 'Onay yetkisi ayrıdır — sertifikalar.onayla izni olmayan kullanıcı butonu görmez.',
          },
          {
            baslik: 'Belgeyi doğrulayın',
            aciklama:
              'Onaylanan sertifika Belgeler listesine düşer; sertifika numarası ve doğrulama kodu üretilir, PDF indirilebilir.',
            gorsel: 'sertifikalar.png',
          },
        ],
        sonuc: 'Katılımcı portalında sertifika görünür hâle gelir.',
        rota: '/panel/sertifika-onay',
      },
      {
        id: 'sablon-duzenle',
        baslik: 'Sertifika şablonu tasarlama',
        aciklama: 'Görsel editörle dikey/yatay şablonlar üzerinde çalışın.',
        sure: 5,
        adimlar: [
          {
            baslik: 'Tasarımları açın',
            aciklama: 'Hazır şablonlar (klasik, modern, prestij vb.) listelenir; her biri önizlenebilir.',
            gorsel: 'sertifika-tasarim.png',
          },
          {
            baslik: 'Editörde düzenleyin',
            aciklama:
              'Metin, logo, imza ve QR öğeleri sürüklenebilir; font, renk ve yön (yatay/dikey) ayarlanır.',
            ipucu: 'Şablon değişikliği yeni sertifikalara uygulanır; düzenlenmiş belgelerin görünümü korunur.',
          },
        ],
        rota: '/panel/sertifika-tasarimlari',
      },
      {
        id: 'qr-dogrula',
        baslik: 'QR ile sertifika doğrulama',
        aciklama: 'Belge üzerindeki kodla sahtecilik kontrolü.',
        sure: 2,
        adimlar: [
          {
            baslik: 'Doğrulama kodunu bulun',
            aciklama: 'Her sertifika benzersiz sertifika no ve doğrulama kodu taşır (belge alt bölümünde).',
            gorsel: 'sertifikalar.png',
          },
          {
            baslik: 'Doğrulama sayfasını kullanın',
            aciklama:
              '/dogrula/:kod adresi herkese açıktır — kod girilince belgenin geçerliliği ve sahibi görüntülenir.',
            ipucu: 'QR karekod bu adresi kodlar; telefon kamerasıyla okutmak yeterlidir.',
          },
        ],
      },
    ],
    sss: [
      {
        soru: 'Sertifika nasıl onaylanır?',
        cevap: 'Sertifikalar → Onay bekleyen: başvuruyu açıp sınav/içerik durumunu kontrol edin, Onayla deyin.',
      },
      {
        soru: 'Yatay ve dikey şablon nasıl seçilir?',
        cevap: 'Tasarım editöründe yön ayarı vardır; şablon listesinde yön bilgisi görünür.',
      },
      {
        soru: 'Sertifika iptal edilirse ne olur?',
        cevap: 'Belge iptal durumuna geçer; doğrulama sayfasında iptal olduğu görünür, geçmiş korunur.',
      },
      {
        soru: 'QR kod doğrulaması giriş gerektirir mi?',
        cevap: 'Hayır — /dogrula/:kod sayfası dışarıdan erişilebilir; belge geçerliliği kamuya açık doğrulanır.',
      },
    ],
  },

  /* ============================ ORGANİZASYON ============================ */
  {
    id: 'firmalar',
    ad: 'Firmalar',
    kategori: 'organizasyon',
    ikon: Building2Icon,
    aciklama: 'Müşteri firma kayıtları, detay sekmeleri, yetkili ve kullanıcı hesapları.',
    nedir:
      'Firmalar, OSGB hizmeti verilen müşteri işyerlerinin ana kaydıdır. Firma detayında iletişim, çalışanlar, yetkililer, kullanıcı hesapları ve belge eksikleri yönetilir.',
    kimler: 'Yönetim kullanıcıları (firmalar.* izinleri kapsamlıdır).',
    kapsam: ['panel'],
    rota: '/panel/firmalar',
    populer: true,
    iliskili: ['personeller', 'isg-katip'],
    rehberler: [
      {
        id: 'firma-ekle',
        baslik: 'Firma ekleme',
        aciklama: 'Yeni müşteri firmasını form çekmecesiyle kaydedin.',
        sure: 3,
        adimlar: [
          {
            baslik: 'Firmalar listesini açın',
            aciklama: 'Sol menüden Firmalar bölümüne girin; mevcut firmalar durum ve eksik alan bilgisiyle listelenir.',
            gorsel: 'firmalar.png',
          },
          {
            baslik: 'Yeni Firma ile formu açın',
            aciklama:
              'Sağdan açılan form çekmecesinde ünvan, vergi bilgileri, iletişim, adres ve tehlike sınıfını doldurun.',
            gorsel: 'firma-detay.png',
            ipucu: 'Zorunlu alanlar eksikse bildirim merkezinde "Firma bilgileri eksik" uyarısı görünür.',
          },
          {
            baslik: 'Yetkiliyi tanımlayın',
            aciklama:
              'Firma yetkilisi kişisini ekleyin — firma portalı hesabı bu yetkiliye bağlanır.',
          },
          {
            baslik: 'Kaydedin ve detayı açın',
            aciklama:
              'Kayıt sonrası firma detay sayfası çalışanlar, yetkililer, hesaplar ve belgeler sekmeleriyle açılır.',
            gorsel: 'firma-detay.png',
          },
        ],
        sonuc: 'Firma sisteme eklendi; artık personel, eğitim ataması ve denetim bağlanabilir.',
        rota: '/panel/firmalar',
      },
      {
        id: 'firma-hesap',
        baslik: 'Firma kullanıcı hesabı açma',
        aciklama: 'Yetkiliye firma portalı erişimi verin.',
        sure: 2,
        adimlar: [
          {
            baslik: 'Firma detayında kullanıcılar bölümünü açın',
            aciklama: 'Firma detay sekmesinde yetkililer ve bağlı portal hesapları listelenir.',
            gorsel: 'firma-detay.png',
          },
          {
            baslik: 'Hesap oluşturun',
            aciklama:
              'Yetkili için hesap oluşturun — davet akışı ilk şifre belirleme ve KVKK onayı içerir.',
            ipucu: 'Yetkili ilk girişinde şifresini değiştirir ve KVKK metnini onaylar.',
          },
        ],
        rota: '/panel/firmalar',
      },
    ],
    sss: [
      {
        soru: 'Nasıl firma eklerim?',
        cevap: 'Firmalar → Yeni Firma: çekmecede ünvan, iletişim ve tehlike sınıfını doldurup kaydedin; yetkiliyi firma detayından ekleyin.',
      },
      {
        soru: 'Firma yetkilisi nasıl tanımlanır?',
        cevap: 'Firma detayında yetkililer bölümünden kişi eklenir; bu kişiye portal hesabı açılarak /firma erişimi verilir.',
      },
      {
        soru: 'Firma çalışanları nereden yönetilir?',
        cevap: 'Personeller modülü firma bazlıdır — firma seçilerek çalışan listesi, hesaplar ve eğitim atamaları yönetilir.',
      },
      {
        soru: 'Eksik firma bilgisi uyarısı nedir?',
        cevap: 'Zorunlu alanları boş aktif firmalar bildirim merkezinde listelenir; detaydan alanları tamamlayın.',
      },
    ],
  },
  {
    id: 'personeller',
    ad: 'Personeller',
    kategori: 'organizasyon',
    ikon: UsersIcon,
    aciklama: 'Firma çalışanları, katılımcı hesapları ve Excel ile toplu kayıt.',
    nedir:
      'Personeller, müşteri firmaların çalışan kayıtlarıdır — İSG hizmetinin muhatapları. Her personel tek firmaya bağlıdır; katılımcı hesabı açılan personel eğitim portalına girer.',
    kimler: 'Yönetim kullanıcıları.',
    kapsam: ['panel'],
    rota: '/panel/personeller',
    populer: true,
    iliskili: ['firmalar', 'egitimler'],
    sekmeler: [
      { ad: 'Liste', gorev: 'Firma/durum filtreli çalışan listesi, arama, Excel' },
      { ad: 'Toplu Oluşturma', gorev: 'Excel şablonuyla çoklu personel aktarımı' },
      { ad: 'Detay', gorev: 'Kişi bilgileri, hesap durumu, eğitim geçmişi' },
    ],
    rehberler: [
      {
        id: 'personel-ekle',
        baslik: 'Personel ekleme',
        aciklama: 'Tek personel kaydı ve durum yönetimi.',
        sure: 3,
        adimlar: [
          {
            baslik: 'Personel listesini açın',
            aciklama: 'Personeller sayfası firma ve durum filtreli çalışan listesidir.',
            gorsel: 'personeller.png',
          },
          {
            baslik: 'Yeni Personel ile kaydı açın',
            aciklama:
              'Ad soyad, TC, firma, departman, görev ve iletişim alanlarını doldurup "Personeli Ekle" ile kaydedin.',
            dikkat: 'TC ve e-posta kişisel veridir — hassas bilgi izni olmayan kullanıcıya maskeli gösterilir.',
          },
        ],
        rota: '/panel/personeller',
      },
      {
        id: 'toplu-ekle',
        baslik: 'Excel ile toplu personel ekleme',
        aciklama: 'Şablon indirin, doldurun, doğrulayıp içe aktarın.',
        sure: 4,
        adimlar: [
          {
            baslik: 'Toplu Oluşturma sayfasını açın',
            aciklama: 'Personeller → Toplu Oluşturma geniş çalışma alanıyla açılır.',
            gorsel: 'personel-toplu.png',
          },
          {
            baslik: 'Şablonu indirip doldurun',
            aciklama: 'Excel şablonunu indirin; satır başına personel bilgilerini girin.',
          },
          {
            baslik: 'Dosyayı yükleyip doğrulayın',
            aciklama:
              'Yükleme sonrası satırlar önizlenir; hatalı satırlar işaretlenir, düzeltip tekrar deneyin.',
            ipucu: 'Aynı TC/numara mükerrer kayıt olarak yakalanır — tekrar oluşturulmaz.',
          },
        ],
        rota: '/panel/personeller/toplu',
      },
      {
        id: 'katilimci-hesap',
        baslik: 'Katılımcı hesabı ve davet',
        aciklama: 'Personele eğitim portalı erişimi açın.',
        sure: 3,
        adimlar: [
          {
            baslik: 'Personel detayında hesap bölümünü açın',
            aciklama: 'Hesap durumu Yok / Davet Bekliyor / Aktif olarak görünür.',
            gorsel: 'personeller.png',
          },
          {
            baslik: 'Davet gönderin',
            aciklama:
              'Hesap oluştur ile davet bağlantısı üretilir; personel ilk girişte şifresini belirler ve KVKK onayı verir.',
            ipucu: 'Davet bekleyen hesaplar listede rozetlenir; bağlantı yeniden gönderilebilir.',
          },
        ],
        sonuc: 'Personel /portal üzerinden eğitimlerine erişir.',
        rota: '/panel/personeller',
      },
    ],
    sss: [
      {
        soru: 'Excel ile toplu personel nasıl eklenir?',
        cevap: 'Personeller → Toplu Oluşturma: şablonu indirin, doldurun, yükleyin; hatalı satırlar önizlemede gösterilir.',
      },
      {
        soru: 'Katılımcı hesabı nasıl oluşturulur?',
        cevap: 'Personel detayında hesap bölümünden davet oluşturulur; personel bağlantıyla ilk şifresini belirler.',
      },
      {
        soru: 'Personel firması değişebilir mi?',
        cevap: 'Bir personel aynı anda tek firmaya bağlıdır; detaydan firma alanı güncellenir.',
      },
      {
        soru: 'Şifre nasıl sıfırlanır?',
        cevap: 'Hesap yönetimi ekranından yeni davet/sıfırlama bağlantısı üretilir; personel kendi şifresini belirler.',
      },
    ],
  },
  {
    id: 'ekip',
    ad: 'Ekip (OSGB Personeli)',
    kategori: 'organizasyon',
    ikon: UsersIcon,
    aciklama: 'İSG uzmanları, hekimler ve DSP kayıtları; roller, izinler ve hesaplar.',
    nedir:
      'Ekip, OSGB bünyesindeki uzman, işyeri hekimi ve diğer sağlık personelinin kaydıdır. Rol bazlı izinler, belge geçerlilik takibi ve yönetim paneli hesapları buradan yönetilir.',
    kimler: 'Yönetim kullanıcıları (ekip.* izinleri).',
    kapsam: ['panel'],
    rota: '/panel/ekip',
    iliskili: ['firmalar', 'ayarlar'],
    rehberler: [
      {
        id: 'ekip-ekle',
        baslik: 'Ekip üyesi ekleme',
        aciklama: 'Uzman/hekim kaydı, rol ve belge bilgileri.',
        sure: 3,
        adimlar: [
          {
            baslik: 'Ekip listesini açın',
            aciklama: 'Üyeler rol, durum ve belge geçerliliğiyle listelenir; süresi yaklaşan belgeler uyarı üretir.',
            gorsel: 'ekip.png',
          },
          {
            baslik: 'Yeni üye formunu doldurun',
            aciklama:
              'Çekmecede kişi bilgileri, rol (uzman/hekim/DSP), belge numarası ve geçerlilik tarihi girilir.',
            ipucu: 'Rol, modül bazlı izin setini belirler (ör. İSG Uzmanı → denetim/risk tam yetki).',
          },
        ],
        rota: '/panel/ekip',
      },
      {
        id: 'ekip-hesap',
        baslik: 'Panel hesabı ve davet',
        aciklama: 'Ekibe giriş hesabı açma, izin yönetimi.',
        sure: 3,
        adimlar: [
          {
            baslik: 'Üye detayında hesap bölümüne girin',
            aciklama: 'Hesap yoksa "Hesap oluştur" ile davet akışı başlar.',
            gorsel: 'ekip.png',
          },
          {
            baslik: 'İzinleri düzenleyin',
            aciklama:
              'Hesap bazlı veya rol bazlı izinler Ayarlar → Erişim İzinleri ile de yönetilir.',
            ipucu: 'Davet bekleyen hesaplar listede görünür; bağlantı yeniden gönderilebilir.',
          },
        ],
        rota: '/panel/ekip',
      },
    ],
    sss: [
      {
        soru: 'Ekip ile personel farkı nedir?',
        cevap: 'Ekip = OSGB çalışanları (uzman/hekim). Personeller = müşteri firmaların çalışanları. İki kayıt ayrıdır.',
      },
      {
        soru: 'Belge süresi uyarısı nedir?',
        cevap: 'Uzmanlık/hekimlik belgesi geçerliliği 30 gün içinde dolacak üyeler bildirime düşer.',
      },
    ],
  },
  {
    id: 'isg-katip',
    ad: 'İSG-KATİP',
    kategori: 'organizasyon',
    ikon: ShieldCheckIcon,
    aciklama: 'İSG-KATİP sözleşmeleri, görevlendirme eksikleri ve kontrol bekleyen kayıtlar.',
    nedir:
      'İSG-KATİP modülü firmalarla yapılan İSG hizmet sözleşmelerini, uzman/hekim görevlendirmelerini ve sistem kontrol durumunu takip eder. Sözleşme bitişi ve eksik görevlendirme uyarıları buradan gelir.',
    kimler: 'Sözleşme ve mevzuat takibi yapan yönetim kullanıcıları.',
    kapsam: ['panel'],
    rota: '/panel/isg-katip',
    iliskili: ['firmalar', 'ekip'],
    rehberler: [
      {
        id: 'sozlesme-yonet',
        baslik: 'Sözleşme ve görevlendirme takibi',
        aciklama: 'Sözleşme kaydı, görevlendirme eksikleri, kontrol durumları.',
        sure: 4,
        adimlar: [
          {
            baslik: 'Sözleşme listesini açın',
            aciklama:
              'Kayıtlar durum ve bitiş tarihiyle listelenir; bitişi yaklaşanlar ve eksik görevlendirmeler uyarı üretir.',
            gorsel: 'isg-katip.png',
          },
          {
            baslik: 'Görevlendirme eksiklerini kapatın',
            aciklama:
              'Firma detayında eksik uzman/hekim atamaları görünür; ekip üyesi atayarak eksikleri kapatın.',
            dikkat: 'Eksik görevlendirme bildirim merkezinde de listelenir.',
          },
          {
            baslik: 'Kontrol bekleyenleri işleyin',
            aciklama: '"Kontrol Bekleyen" filtresi onay/işlem bekleyen sözleşme kayıtlarını gösterir.',
          },
        ],
        rota: '/panel/isg-katip',
      },
    ],
    sss: [
      {
        soru: 'Sözleşme süresi uyarısı ne zaman gelir?',
        cevap: 'Bitişe 30/15/7 gün kala ve süre geçtiğinde bildirim üretilir.',
      },
      {
        soru: 'Eksik görevlendirme ne demek?',
        cevap: 'Sözleşmesi olan firmanın uzman veya hekim ataması yoksa kayıt "eksik" işaretlenir.',
      },
    ],
  },

  /* ============================ AYARLAR ============================ */
  {
    id: 'ayarlar',
    ad: 'Ayarlar',
    kategori: 'ayarlar',
    ikon: SettingsIcon,
    aciklama: 'Kurum bilgileri, kullanıcı ve izin yönetimi, güvenlik, tanımlar ve işlem geçmişi.',
    nedir:
      'Ayarlar, sistemin 12 sekmeli yönetim alanıdır: kurum bilgileri, kullanıcı hesapları, rol/izin matrisi, bildirim tercihleri, güvenlik ve oturumlar, belge/PDF ayarları, tanım katalogları, iş akışı, entegrasyonlar, veri aktarımı ve audit geçmişi.',
    kimler: 'Yönetici kullanıcılar (ayarlar.* izinleriyle sınırlı).',
    kapsam: ['panel'],
    rota: '/panel/ayarlar',
    sekmeler: [
      { ad: 'Genel', gorev: 'Temel tercihler' },
      { ad: 'Kurum', gorev: 'OSGB kurum bilgileri ve logo' },
      { ad: 'Kullanıcılar', gorev: 'Panel hesaplarının listesi ve yönetimi' },
      { ad: 'İzinler', gorev: 'Modül × işlem izin matrisi, rol tanımları' },
      { ad: 'Ekip', gorev: 'Ekip/personel ayarları' },
      { ad: 'Bildirim', gorev: 'Bildirim tercihleri' },
      { ad: 'Güvenlik', gorev: 'Oturumlar ve güvenlik politikası' },
      { ad: 'Belgeler', gorev: 'PDF/şablon ayarları' },
      { ad: 'Tanımlar', gorev: 'Kategori ve katalog yönetimi' },
      { ad: 'İş Akışı', gorev: 'Otomasyon kuralları' },
      { ad: 'Entegrasyonlar', gorev: 'Dış sistem bağlantıları' },
      { ad: 'Veri', gorev: 'Dışa aktarım ve yedek' },
      { ad: 'Geçmiş', gorev: 'Audit — kim ne yaptı kayıtları' },
    ],
    rehberler: [
      {
        id: 'kullanici-izin',
        baslik: 'Kullanıcı ve izin yönetimi',
        aciklama: 'Panel hesapları, rol atama ve izin matrisi.',
        sure: 4,
        adimlar: [
          {
            baslik: 'Kullanıcılar sekmesini açın',
            aciklama: 'Ayarlar → Kullanıcılar: panel hesapları rol ve durumlarıyla listelenir.',
            gorsel: 'ayarlar.png',
          },
          {
            baslik: 'İzinleri düzenleyin',
            aciklama:
              'İzinler sekmesinde modül × işlem matrisi rol bazlı düzenlenir (ör. ekip.olustur, sertifikalar.onayla).',
            dikkat: 'İzin değişiklikleri işlem geçmişine (audit) yazılır.',
          },
        ],
        rota: '/panel/ayarlar/izinler',
      },
    ],
    sss: [
      {
        soru: 'Yeni yönetim kullanıcısı nasıl açılır?',
        cevap: 'Ekip üyesi kaydı oluşturup hesap daveti gönderilir; rolü izin setini belirler.',
      },
      {
        soru: 'İşlem geçmişi (audit) nedir?',
        cevap: 'Geçmiş sekmesi kritik değişiklikleri kullanıcı/zaman/IP ile kaydeder — geriye dönük izlenebilirlik sağlar.',
      },
    ],
  },

  /* ============================ PORTALLAR ============================ */
  {
    id: 'firma-portali',
    ad: 'Firma Portalı',
    kategori: 'portallar',
    ikon: Building2Icon,
    aciklama: 'Müşteri firma yetkilisinin çalışan, eğitim ve sertifika takip alanı.',
    nedir:
      'Firma Portalı, müşteri firma yetkilisinin kendi çalışanlarını ve eğitim süreçlerini izlediği alandır (/firma). Çalışan listesi, eğitim atamaları, ilerleme takibi, sertifikalar, firma profili ve hesap ayarları buradadır.',
    kimler: 'Firma yetkilisi hesabı olan kullanıcılar.',
    kapsam: ['panel', 'firma'],
    rota: '/firma',
    populer: true,
    sekmeler: [
      { ad: 'Dashboard', gorev: 'Çalışan/eğitim/sertifika özet sayaçları ve son aktiviteler' },
      { ad: 'Çalışanlarım', gorev: 'Çalışan listesi, ekleme, Excel, davet durumu' },
      { ad: 'Eğitimlerimiz', gorev: 'Firmaya atanan eğitimler ve katılımcı durumları' },
      { ad: 'Eğitim Takibi', gorev: 'Kişi × eğitim ilerleme tablosu' },
      { ad: 'Sertifikalar', gorev: 'Çalışanlara düzenlenen belgeler' },
      { ad: 'Firma Profilim', gorev: 'Firma bilgilerinin görüntülenmesi' },
      { ad: 'Hesap Ayarları', gorev: 'Şifre ve hesap tercihleri' },
    ],
    rehberler: [
      {
        id: 'firma-calisan',
        baslik: 'Çalışan ekleme ve davet',
        aciklama: 'Çalışan kaydı açın, hesap davetini yönetin.',
        sure: 3,
        adimlar: [
          {
            baslik: 'Çalışanlarım sayfasını açın',
            aciklama:
              'Çalışanlar durum ve hesap sütunlarıyla listelenir; Excel ve Toplu ekle seçenekleri üsttedir.',
            gorsel: 'f-calisanlar.png',
          },
          {
            baslik: 'Çalışan ekleyin',
            aciklama: '"Çalışan ekle" formunda kişi bilgilerini doldurun — kayıt yönetim paneliyle paylaşılır.',
          },
          {
            baslik: 'Hesap durumunu izleyin',
            aciklama:
              'HESAP sütunu Yok / Davet Bekliyor / Aktif gösterir; yanıt bekleyen davetler topbar bildiriminde de çıkar.',
            gorsel: 'f-calisanlar.png',
          },
        ],
        rota: '/firma/calisanlar',
      },
      {
        id: 'firma-takip',
        baslik: 'Eğitim takibi',
        aciklama: 'Hangi çalışan hangi eğitimde, ne kadar ilerledi?',
        sure: 3,
        adimlar: [
          {
            baslik: 'Eğitim Takibi sayfasını açın',
            aciklama: 'Kişi × eğitim satırları ilerleme çubuğu, sınav durumu ve son tarihle listelenir.',
            gorsel: 'f-takip.png',
          },
          {
            baslik: 'Eğitimlerimiz sayfasını kullanın',
            aciklama:
              'Atama bazlı görünümde tamamlayan/devam/başlamayan/başarısız dağılımı ve "Katılımcı ekle" işlemi vardır.',
            gorsel: 'f-egitimler.png',
            ipucu: 'Son tarih yaklaşan atamalar dashboard ve bildirimlerde de görünür.',
          },
        ],
        rota: '/firma/takip',
      },
    ],
    sss: [
      {
        soru: 'Çalışanım eğitimini nasıl görürüm?',
        cevap: 'Eğitim Takibi kişi bazında ilerleme yüzdesi, sınav puanı ve durumu gösterir.',
      },
      {
        soru: 'Sertifikaya nasıl ulaşırım?',
        cevap: 'Sertifikalar sekmesi onaylanmış belgeleri listeler; PDF indirilebilir.',
      },
      {
        soru: 'Tema değiştirebilir miyim?',
        cevap: 'Üst bardaki güneş/ay simgesiyle açık-koyu tema arasında geçiş yapılır.',
      },
    ],
  },
  {
    id: 'katilimci-portali',
    ad: 'Katılımcı Portalı',
    kategori: 'portallar',
    ikon: GraduationCapIcon,
    aciklama: 'Çalışanın eğitim alanı — atanan eğitimler, sınavlar ve sertifikalar.',
    nedir:
      'Katılımcı Portalı (/portal), eğitim atanan çalışanın kendi ekranıdır: atanan eğitimler, içerik oynatıcı, sınav ve hazır sertifikalar burada bulunur.',
    kimler: 'Katılımcı hesabı açılan firma çalışanları.',
    kapsam: ['panel', 'portal'],
    populer: true,
    rota: '/portal',
    sekmeler: [
      { ad: 'Ana Sayfa', gorev: 'Genel ilerleme, devam eden eğitim, yaklaşan son tarihler ve kalan gün sayısı' },
      { ad: 'Eğitimlerim', gorev: 'Atanan eğitim kartları, durum filtreleri ve son tarih bilgisi' },
      { ad: 'Sertifikalarım', gorev: 'Onaylı belgeler, başvuru durumu, PDF indirme' },
      { ad: 'Profilim', gorev: 'Kişi bilgileri, e-posta ve telefon güncelleme, şifre değiştirme' },
    ],
    rehberler: [
      {
        id: 'egitime-basla',
        baslik: 'Eğitime başlama ve ilerleme',
        aciklama: 'Atanan eğitimi açın, içerikleri tamamlayın.',
        sure: 3,
        adimlar: [
          {
            baslik: 'Ana sayfadan devam edin',
            aciklama:
              '"Eğitime Devam Et" kartı en güncel açık eğitimi gösterir; henüz başlamadıysanız düğme "Başla" olur. İlerleme yüzdesi canlıdır.',
            gorsel: 'p-ana.png',
          },
          {
            baslik: 'İçerikleri sırayla tamamlayın',
            aciklama:
              'Oynatıcıda bölüm içeriklerini bitirdikçe ilerleme işaretlenir; zorunlu içerikler atlanamaz.',
            gorsel: 'p-egitimler.png',
            ipucu: 'Yarıda bırakırsanız kaldığınız yerden devam edersiniz.',
          },
        ],
        rota: '/portal/egitimler',
      },
      {
        id: 'sinav-sertifika',
        baslik: 'Sınava girme ve sertifika',
        aciklama: 'İçerikler bitince sınavı açın; başarınca belge başvurusu oluşur.',
        sure: 3,
        adimlar: [
          {
            baslik: 'Sınavı başlatın',
            aciklama: 'Zorunlu içerikler tamamlanınca sınav açılır; soru sayısı ve geçme puanı eğitim bazlıdır.',
          },
          {
            baslik: 'Sonucu izleyin',
            aciklama:
              'Başarılıysanız sertifika başvurusu onaya gider; Sertifikalarım sekmesinde durum izlenir.',
            gorsel: 'p-sertifikalar.png',
            ipucu: 'Başvuru incelenince belge burada görünür ve PDF indirilebilir.',
          },
        ],
        rota: '/portal/sertifikalar',
      },
      {
        id: 'profil-iletisim',
        baslik: 'Profil, iletişim ve şifre',
        aciklama: 'E-posta ve telefonunuzu güncelleyin, şifrenizi değiştirin.',
        sure: 2,
        adimlar: [
          {
            baslik: 'Profilim’e gidin',
            aciklama: 'Kenar menüsünden Profilim’i açın; firma, departman ve kullanıcı adınız burada görünür.',
          },
          {
            baslik: 'İletişim bilgilerinizi güncelleyin',
            aciklama:
              'E-posta ve Telefon satırının yanındaki Düzenle düğmesine basın, bilgileri girip Kaydet’e basın. E-posta biçimi kontrol edilir ve telefon en az 10 haneli olmalıdır.',
            ipucu: 'Firma, rol ve kullanıcı adı yalnızca işvereniniz tarafından değiştirilebilir.',
          },
          {
            baslik: 'Şifrenizi değiştirin',
            aciklama: 'Şifre bölümündeki Şifre Değiştir düğmesiyle yeni şifrenizi iki kez girin; en az 6 karakter olmalıdır.',
          },
        ],
        rota: '/portal/profil',
      },
    ],
    sss: [
      {
        soru: 'E-posta ve telefonumu nasıl güncellerim?',
        cevap: 'Profilim → E-posta/Telefon satırında Düzenle’ye basın, değişikliği Kaydet ile onaylayın.',
      },
      {
        soru: 'Eğitimime nasıl girerim?',
        cevap: 'Ana Sayfa veya Eğitimlerim’den karta tıklayın; oynatıcı kaldığınız yerden açılır.',
      },
      {
        soru: 'Sınavda kalırsam ne olur?',
        cevap: 'Deneme hakkı eğitim bazlıdır; yeni denemeye Eğitimlerim’den girilir. Hak bitince yöneticiyle iletişime geçin.',
      },
      {
        soru: 'Sertifikamı nereden indiririm?',
        cevap: 'Sertifikalarım → onaylı belge satırındaki indir düğmesi PDF üretir; QR kodla doğrulanabilir.',
      },
    ],
  },

  /* ============================ YAKINDA ============================ */
  {
    id: 'yakinda',
    ad: 'Geliştirme Yol Haritası',
    kategori: 'yakinda',
    ikon: FileTextIcon,
    aciklama: 'Planlanan modüller — henüz kullanımda değil.',
    nedir:
      'Aşağıdaki modüller ürün yol haritasındadır ve henüz aktif değildir. Bu ekran yalnızca bilgilendirme amaçlıdır.',
    kimler: '—',
    kapsam: ['panel'],
    yakinda: [
      'Sağlık Taramaları — poliklinik/saha tarama planlama, tetkik ve EK-2 belgeleri',
      'Teklifler — hizmet teklifi oluşturma ve PDF çıktısı',
      'Planlama Takvimi — uzman/araç/firma ziyaret planlaması',
      'Mobil uygulama — çevrimdışı saha denetimi',
      'e-Devlet / İSG-KATİP servis entegrasyonu',
    ],
    rehberler: [],
    sss: [],
  },
]

/* ---------------------------- Yardımcılar --------------------------------- */

export const modulGetir = (id: string) => MODULLER.find((m) => m.id === id)

export const kapsamModulleri = (k: RehberKapsam) =>
  MODULLER.filter((m) => m.kapsam.includes(k))

export const kategoriModulleri = (katId: string, k: RehberKapsam) =>
  kapsamModulleri(k).filter((m) => m.kategori === katId)

/** Arama indeks kaydı */
export interface AramaKayit {
  tip: 'modul' | 'rehber' | 'sss'
  baslik: string
  detay: string
  to: string
}

const norm = (s: string) => s.toLocaleLowerCase('tr')

/** Uygulama rotası bu kapsamdaki kullanıcıya açık mı? (/panel → panel, /firma → firma, /portal → portal) */
export const rotaKapsamdaMi = (rota: string | undefined, k: RehberKapsam): boolean => {
  if (!rota) return false
  if (rota.startsWith('/firma')) return k === 'firma'
  if (rota.startsWith('/portal')) return k === 'portal'
  if (rota.startsWith('/panel')) return k === 'panel'
  return true
}

export const rehberAra = (
  sorgu: string,
  k: RehberKapsam,
  kok: string,
  rehberListe?: (m: Modul) => Rehber[],
): AramaKayit[] => {
  const q = norm(sorgu.trim())
  if (q.length < 2) return []
  const out: AramaKayit[] = []
  for (const m of kapsamModulleri(k)) {
    const mText = norm(`${m.ad} ${m.aciklama} ${m.nedir}`)
    if (mText.includes(q)) {
      out.push({
        tip: 'modul',
        baslik: m.ad,
        detay: m.aciklama,
        to: `${kok}/${m.id}`,
      })
    }
    for (const r of rehberListe ? rehberListe(m) : m.rehberler) {
      const rText = norm(
        `${r.baslik} ${r.aciklama} ${r.adimlar.map((a) => `${a.baslik} ${a.aciklama}`).join(' ')}`,
      )
      if (rText.includes(q)) {
        out.push({
          tip: 'rehber',
          baslik: r.baslik,
          detay: `${m.ad} · ${r.aciklama}`,
          to: `${kok}/${m.id}/${r.id}`,
        })
      }
    }
    for (const s of m.sss) {
      if (norm(`${s.soru} ${s.cevap}`).includes(q)) {
        out.push({
          tip: 'sss',
          baslik: s.soru,
          detay: m.ad,
          to: `${kok}/${m.id}#sss`,
        })
      }
    }
  }
  return out.slice(0, 12)
}
