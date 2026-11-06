/*
 * Denetimler — İSG saha denetimi ve uygunsuzluk yönetimi veri modeli.
 *
 * Mimari ayrım:
 *  - Risk Değerlendirme → tehlike/risklerin sistematik belirlenmesi
 *  - Denetimler         → sahadaki mevcut koşul ve uygulamaların kontrolü
 *  - Aksiyonlar         → tespit edilen eksikliklerin giderilmesi (merkezi
 *                         risk-store.aksiyonlar kullanılır — ayrı tablo yok)
 *
 * Versiyonlama: kontrol maddeleri denetime SNAPSHOT olarak kopyalanır
 * (maddeler[]). Şablon sonradan değişse bile tamamlanmış denetimin
 * kullandığı kontrol listesi geçmişi korunur.
 *
 * ÖNEMLİ: Şablon maddeleri örnek başlangıç içeriğidir; mevzuata uygunluk
 * iddiası taşıyan maddeler uzman incelemesine açıktır. Backend'de aynı
 * yaşam döngüsü + tenant izolasyonu zorunlu olarak tekrarlanmalıdır.
 */
import { TODAY } from '@/data/dashboard'

/* --------------------------------- Türler --------------------------------- */

export type DenetimDurum = 'Taslak' | 'Planlandı' | 'Devam Ediyor' | 'Rapor Bekliyor' | 'Tamamlandı' | 'İptal Edildi'
export type MaddeSonuc = 'Uygun' | 'Uygunsuz' | 'Uygulanamaz' | 'Gözlem'
export type Onem = 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'
export type BulguDurum = 'Açık' | 'Aksiyonda' | 'Kontrol Bekliyor' | 'Kapatıldı' | 'İptal Edildi'
export type KatilimciRol = 'Sorumlu Uzman' | 'Katılımcı' | 'İşveren Temsilcisi' | 'Çalışan Temsilcisi'

export const ONEMLER: Onem[] = ['Düşük', 'Orta', 'Yüksek', 'Kritik']
export const DURUMLAR: DenetimDurum[] = ['Taslak', 'Planlandı', 'Devam Ediyor', 'Rapor Bekliyor', 'Tamamlandı', 'İptal Edildi']
export const KATILIMCI_ROLLER: KatilimciRol[] = ['Sorumlu Uzman', 'Katılımcı', 'İşveren Temsilcisi', 'Çalışan Temsilcisi']

export const onemRenk: Record<Onem, string> = {
  'Düşük': 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
  'Orta': 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  'Yüksek': 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  'Kritik': 'bg-red-500/10 text-red-700 dark:text-red-400',
}
export const durumRenk: Record<DenetimDurum, string> = {
  'Taslak': 'bg-muted text-muted-foreground',
  'Planlandı': 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  'Devam Ediyor': 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  'Rapor Bekliyor': 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  'Tamamlandı': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  'İptal Edildi': 'bg-zinc-500/10 text-zinc-500',
}
export const sonucRenk: Record<MaddeSonuc, string> = {
  'Uygun': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  'Uygunsuz': 'bg-red-500/10 text-red-700 dark:text-red-400',
  'Uygulanamaz': 'bg-muted text-muted-foreground',
  'Gözlem': 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
}
export const bulguDurumRenk: Record<BulguDurum, string> = {
  'Açık': 'bg-red-500/10 text-red-700 dark:text-red-400',
  'Aksiyonda': 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  'Kontrol Bekliyor': 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  'Kapatıldı': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  'İptal Edildi': 'bg-zinc-500/10 text-zinc-500',
}

/* ------------------------------ Şablon modeli ------------------------------ */

export interface DenetimTuru {
  id: string // DT-xx
  ad: string
  aciklama?: string
  aktif: boolean
}

export interface SablonMadde {
  id: string
  soru: string
  aciklama?: string // değerlendirme kriteri
  onem: Onem
  mevzuatRef?: string // yalnızca doğrulanmışsa
  zorunlu: boolean
  fotografGerekli?: boolean
  /** Uygunsuz işaretlendiğinde aksiyon oluşturma önerisi */
  aksiyonKurali?: boolean
}

export interface SablonKategori {
  id: string
  ad: string
  maddeler: SablonMadde[]
}

export interface SablonSurum {
  surum: number
  tarih: string
  kullanici: string
  not?: string
}

export interface DenetimSablon {
  id: string // DSB-xx
  ad: string
  aciklama?: string
  surum: number
  durum: 'Aktif' | 'Arşiv'
  kategoriler: SablonKategori[]
  olusturan: string
  olusturma: string
  guncelleme: string
  surumGecmisi: SablonSurum[]
}

/* ------------------------------ Denetim modeli ----------------------------- */

export interface DenetimEk {
  id: string
  ad: string
  tur: 'fotograf' | 'belge'
  boyut: number
  /** Küçültülmüş data-URL (prototip); üretimde nesne depolama anahtarı */
  dataUrl?: string
  tarih: string
  ekleyen: string
}

/** Şablondan kopyalanmış denetim maddesi — snapshot */
export interface DenetimMadde {
  id: string
  sablonMaddeId?: string
  sablonId?: string
  kategoriAd: string
  soru: string
  aciklama?: string
  onem: Onem
  mevzuatRef?: string
  zorunlu: boolean
  fotografGerekli: boolean
  aksiyonKurali: boolean
  sonuc?: MaddeSonuc
  not?: string
  bolum?: string // konum/bölüm bilgisi
  fotograflar: DenetimEk[]
}

export interface DenetimKatilimci {
  ad: string
  rol: KatilimciRol
}

export interface DenetimBulgu {
  id: string // BLG-xxxx
  denetimId: string
  maddeId?: string
  baslik: string
  aciklama: string
  firmaId: string
  bolum?: string
  tespitTarihi: string
  onem: Onem
  ekler: DenetimEk[]
  onerilenFaaliyet?: string
  sorumluId?: string
  sorumluAd?: string
  hedefTarih?: string
  durum: BulguDurum
  /** İlişkilendirilmiş risk kaydı (kontrollü — otomatik çoğaltma yok) */
  riskTehlikeId?: string
  /** Merkezi Aksiyonlar'daki karşılığı */
  aksiyonId?: string
  kapatmaNotu?: string
  kapatan?: string
  kapatmaTarihi?: string
}

export interface DenetimBelge {
  id: string
  ad: string
  tur: 'rapor' | 'ek' | 'fotograf'
  surum: number
  olusturma: string
  olusturan: string
}

export interface DenetimOlay {
  tarih: string
  kullanici: string
  islem: string
  not?: string
}

export interface Denetim {
  id: string // DN-xxxx
  no: string // görünen numara DN-2026-001
  baslik: string
  firmaId: string
  firmaAd: string
  lokasyon: string // işyeri/lokasyon
  turId: string
  turAd: string
  planlananTarih: string // YYYY-MM-DD
  planlananSaat?: string
  gerceklesmeBaslangic?: string
  gerceklesmeBitis?: string
  uzmanId?: string // ekip personelId
  uzmanAd: string
  katilimcilar: DenetimKatilimci[]
  aciklama?: string
  kapsam?: string
  hazirlikNotlari?: string
  /** Kullanılan şablonların {sablonId, surum} referansı — maddeler snapshot'landı */
  sablonlar: { sablonId: string; surum: number }[]
  maddeler: DenetimMadde[]
  durum: DenetimDurum
  /** uygun / (uygun+uygunsuz) — tutarlı tek yöntem */
  puan?: number
  belgeler: DenetimBelge[]
  gecmis: DenetimOlay[]
  olusturan: string
  olusturma: string
  guncelleme: string
}

/* -------------------------------- Yardımcılar ------------------------------ */

export const maddeIstat = (maddeler: DenetimMadde[]) => ({
  toplam: maddeler.length,
  uygun: maddeler.filter((m) => m.sonuc === 'Uygun').length,
  uygunsuz: maddeler.filter((m) => m.sonuc === 'Uygunsuz').length,
  uygulanamaz: maddeler.filter((m) => m.sonuc === 'Uygulanamaz').length,
  gozlem: maddeler.filter((m) => m.sonuc === 'Gözlem').length,
  cevapsiz: maddeler.filter((m) => !m.sonuc).length,
  eksikZorunlu: maddeler.filter((m) => m.zorunlu && !m.sonuc).length,
})

/** Denetim puanı: uygun / (uygun + uygunsuz) × 100 — uygulanamaz ve gözlem dışarıda */
export const puanHesapla = (maddeler: DenetimMadde[]): number | undefined => {
  const uygun = maddeler.filter((m) => m.sonuc === 'Uygun').length
  const uygunsuz = maddeler.filter((m) => m.sonuc === 'Uygunsuz').length
  const payda = uygun + uygunsuz
  return payda > 0 ? Math.round((uygun / payda) * 100) : undefined
}

export const denetimNo = (n: number) => `DN-2026-${String(n).padStart(3, '0')}`

/* --------------------------------- Türler ---------------------------------- */

export const denetimTuruSeed: DenetimTuru[] = [
  { id: 'DT-01', ad: 'Genel İSG Saha Denetimi', aktif: true },
  { id: 'DT-02', ad: 'İş Ekipmanları ve Makine Güvenliği', aktif: true },
  { id: 'DT-03', ad: 'Elektrik Güvenliği', aktif: true },
  { id: 'DT-04', ad: 'Yangın ve Acil Durum', aktif: true },
  { id: 'DT-05', ad: 'Kişisel Koruyucu Donanım', aktif: true },
  { id: 'DT-06', ad: 'Çalışma Ortamı ve Düzen', aktif: true },
  { id: 'DT-07', ad: 'Kimyasal Güvenlik', aktif: true },
  { id: 'DT-08', ad: 'Yüksekte Çalışma', aktif: true },
  { id: 'DT-09', ad: 'Depo ve İstifleme', aktif: true },
  { id: 'DT-10', ad: 'Hijyen ve Ergonomi', aktif: true },
  { id: 'DT-11', ad: 'Özel Denetim', aktif: true },
]

/* -------------------------------- Şablonlar -------------------------------- */

let smSeq = 0
const sm = (soru: string, ek: Partial<SablonMadde> = {}): SablonMadde => ({
  id: `SM-${(++smSeq).toString(36).padStart(3, '0')}`,
  soru,
  onem: 'Orta',
  zorunlu: true,
  aksiyonKurali: true,
  ...ek,
})

export const sablonSeed: DenetimSablon[] = [
  {
    id: 'DSB-01',
    ad: 'Genel İSG Kontrol Listesi',
    aciklama: 'İşyeri genel saha denetimi — temel İSG uygulama kontrolleri',
    surum: 2,
    durum: 'Aktif',
    kategoriler: [
      {
        id: 'DSK-01', ad: 'Genel Düzen ve Temizlik',
        maddeler: [
          sm('Çalışma alanları temiz ve düzenli mi?', { aciklama: 'Zemin, geçiş yolları ve çalışma yüzeyleri kontrol edilir' }),
          sm('Geçiş yolları ve koridorlar açık mı?', { onem: 'Yüksek' }),
          sm('İstifleme güvenli ve dengeli mi?', { aciklama: 'Devirme/kayma riski kontrol edilir' }),
          sm('İSG uyarı ve yönlendirme levhaları görünür durumda mı?', { zorunlu: false }),
        ],
      },
      {
        id: 'DSK-02', ad: 'Acil Durum Hazırlığı',
        maddeler: [
          sm('Acil çıkış kapıları açık ve erişilebilir mi?', { onem: 'Kritik' }),
          sm('Acil çıkış yönlendirmeleri görünür ve aydınlatmalı mı?', { onem: 'Yüksek' }),
          sm('Acil durum ekipleri belirlenmiş ve duyurulmuş mu?', { zorunlu: false }),
          sm('İlk yardım ekipmanı erişilebilir ve tam mı?', { onem: 'Yüksek', fotografGerekli: true }),
        ],
      },
      {
        id: 'DSK-03', ad: 'Kişisel Koruyucu Donanım',
        maddeler: [
          sm('Çalışanlara uygun KKD dağıtılmış mı?', { onem: 'Yüksek' }),
          sm('KKD kullanımı sahada uygulanıyor mu?', { onem: 'Yüksek', fotografGerekli: true }),
        ],
      },
    ],
    olusturan: 'Tunahan Yılmaztürk',
    olusturma: '2026-01-10',
    guncelleme: '2026-09-15',
    surumGecmisi: [
      { surum: 1, tarih: '2026-01-10', kullanici: 'Tunahan Yılmaztürk', not: 'İlk sürüm' },
      { surum: 2, tarih: '2026-09-15', kullanici: 'Tunahan Yılmaztürk', not: 'Acil durum kategorisi genişletildi' },
    ],
  },
  {
    id: 'DSB-02',
    ad: 'Yangın Güvenliği Kontrol Listesi',
    aciklama: 'Yangın önleme, algılama, söndürme ve tahliye kontrolleri',
    surum: 1,
    durum: 'Aktif',
    kategoriler: [
      {
        id: 'DSK-04', ad: 'Söndürme Ekipmanı',
        maddeler: [
          sm('Yangın söndürücülerin erişilebilirliği kontrol edildi mi?', { onem: 'Kritik', fotografGerekli: true }),
          sm('Yangın söndürücülerin bakım tarihleri uygun mu?', { onem: 'Yüksek', mevzuatRef: 'TS 9811 (yerel doğrulama gerekir)' }),
          sm('Yangın dolapları ve hortumları çalışır durumda mı?', { onem: 'Yüksek' }),
        ],
      },
      {
        id: 'DSK-05', ad: 'Algılama ve Tahliye',
        maddeler: [
          sm('Yangın algılama sistemi çalışır durumda mı?', { onem: 'Kritik' }),
          sm('Duman dedektörleri periyodik olarak test ediliyor mu?', { onem: 'Yüksek', zorunlu: false }),
          sm('Tahliye toplanma alanı belirlenmiş ve işaretlenmiş mi?', { onem: 'Orta' }),
        ],
      },
    ],
    olusturan: 'Ayşe Kaya',
    olusturma: '2026-02-01',
    guncelleme: '2026-02-01',
    surumGecmisi: [{ surum: 1, tarih: '2026-02-01', kullanici: 'Ayşe Kaya', not: 'İlk sürüm' }],
  },
  {
    id: 'DSB-03',
    ad: 'Elektrik Güvenliği Kontrol Listesi',
    aciklama: 'Elektrik tesisatı, pano ve ekipman güvenliği kontrolleri',
    surum: 1,
    durum: 'Aktif',
    kategoriler: [
      {
        id: 'DSK-06', ad: 'Pano ve Tesisat',
        maddeler: [
          sm('Elektrik panolarının kapakları kapalı mı?', { onem: 'Yüksek' }),
          sm('Elektrik panolarında gerekli uyarı işaretleri bulunuyor mu?', { onem: 'Orta' }),
          sm('Topraklama kontrolleri ve ilgili kayıtlar mevcut mu?', { onem: 'Kritik', mevzuatRef: 'Elektrik Tesislerinde Topraklamalar Yönetmeliği (yerel doğrulama gerekir)' }),
          sm('Elektrik kablolarında hasar veya açıkta iletken var mı?', { onem: 'Kritik', fotografGerekli: true }),
          sm('Elektrik panolarının önünde yeterli çalışma alanı var mı?', { onem: 'Orta' }),
        ],
      },
    ],
    olusturan: 'Ayşe Kaya',
    olusturma: '2026-02-01',
    guncelleme: '2026-02-01',
    surumGecmisi: [{ surum: 1, tarih: '2026-02-01', kullanici: 'Ayşe Kaya', not: 'İlk sürüm' }],
  },
  {
    id: 'DSB-04',
    ad: 'Makine Güvenliği Kontrol Listesi',
    aciklama: 'İş ekipmanları koruyucu donanım ve kullanım kontrolleri',
    surum: 1,
    durum: 'Aktif',
    kategoriler: [
      {
        id: 'DSK-07', ad: 'Makine Güvenliği',
        maddeler: [
          sm('Makine koruyucuları mevcut ve yerinde mi?', { onem: 'Kritik', fotografGerekli: true }),
          sm('Acil durdurma butonları çalışıyor mu?', { onem: 'Kritik' }),
          sm('Makine kullanım talimatları mevcut mu?', { onem: 'Orta', zorunlu: false }),
          sm('Yetkisiz kullanım önlenmiş mi?', { onem: 'Yüksek' }),
        ],
      },
    ],
    olusturan: 'Tunahan Yılmaztürk',
    olusturma: '2026-03-01',
    guncelleme: '2026-03-01',
    surumGecmisi: [{ surum: 1, tarih: '2026-03-01', kullanici: 'Tunahan Yılmaztürk', not: 'İlk sürüm' }],
  },
  {
    id: 'DSB-05',
    ad: 'Depo ve İstifleme Kontrol Listesi',
    aciklama: 'Depo, raf sistemleri ve istifleme güvenliği kontrolleri',
    surum: 1,
    durum: 'Aktif',
    kategoriler: [
      {
        id: 'DSK-08', ad: 'Raf ve İstifleme',
        maddeler: [
          sm('Raf traverslerinde hasar var mı?', { onem: 'Kritik', fotografGerekli: true }),
          sm('Raf yük kapasite etiketleri görünür mü?', { onem: 'Yüksek' }),
          sm('Yaya yolları forklift güzergâhından ayrılmış mı?', { onem: 'Kritik' }),
          sm('İstif yüksekliği güvenli sınırda mı?', { onem: 'Yüksek' }),
        ],
      },
    ],
    olusturan: 'Ayşe Kaya',
    olusturma: '2026-04-10',
    guncelleme: '2026-04-10',
    surumGecmisi: [{ surum: 1, tarih: '2026-04-10', kullanici: 'Ayşe Kaya', not: 'İlk sürüm' }],
  },
]

/* --------------------------------- Seed'ler -------------------------------- */

const dm = (sablonId: string, katAd: string, soru: string, ek: Partial<DenetimMadde> = {}): DenetimMadde => ({
  id: `DM-${(++smSeq).toString(36).padStart(3, '0')}`,
  sablonId,
  kategoriAd: katAd,
  soru,
  onem: 'Orta',
  zorunlu: true,
  fotografGerekli: false,
  aksiyonKurali: true,
  fotograflar: [],
  ...ek,
})

const olay = (tarih: string, kullanici: string, islem: string, not?: string): DenetimOlay => ({ tarih, kullanici, islem, not })

export const denetimSeed: Denetim[] = [
  {
    id: 'DN-001',
    no: 'DN-2026-001',
    baslik: 'Kasım genel saha denetimi',
    firmaId: 'FR-01',
    firmaAd: 'Akdeniz Metal San. ve Tic. A.Ş.',
    lokasyon: 'Ana tesis — üretim alanı',
    turId: 'DT-01',
    turAd: 'Genel İSG Saha Denetimi',
    planlananTarih: '2026-11-10',
    planlananSaat: '10:00',
    uzmanId: 'PRS-02',
    uzmanAd: 'Ayşe Kaya',
    katilimcilar: [
      { ad: 'Ayşe Kaya', rol: 'Sorumlu Uzman' },
      { ad: 'Osman Karaca', rol: 'İşveren Temsilcisi' },
    ],
    aciklama: 'Aylık periyodik genel saha denetimi.',
    kapsam: 'Üretim alanı, depo girişi ve acil çıkışlar',
    sablonlar: [{ sablonId: 'DSB-01', surum: 2 }],
    maddeler: [
      dm('DSB-01', 'Genel Düzen ve Temizlik', 'Çalışma alanları temiz ve düzenli mi?', { onem: 'Orta' }),
      dm('DSB-01', 'Genel Düzen ve Temizlik', 'Geçiş yolları ve koridorlar açık mı?', { onem: 'Yüksek' }),
      dm('DSB-01', 'Genel Düzen ve Temizlik', 'İstifleme güvenli ve dengeli mi?'),
      dm('DSB-01', 'Genel Düzen ve Temizlik', 'İSG uyarı ve yönlendirme levhaları görünür durumda mı?', { zorunlu: false }),
      dm('DSB-01', 'Acil Durum Hazırlığı', 'Acil çıkış kapıları açık ve erişilebilir mi?', { onem: 'Kritik' }),
      dm('DSB-01', 'Acil Durum Hazırlığı', 'Acil çıkış yönlendirmeleri görünür ve aydınlatmalı mı?', { onem: 'Yüksek' }),
      dm('DSB-01', 'Acil Durum Hazırlığı', 'Acil durum ekipleri belirlenmiş ve duyurulmuş mu?', { zorunlu: false }),
      dm('DSB-01', 'Acil Durum Hazırlığı', 'İlk yardım ekipmanı erişilebilir ve tam mı?', { onem: 'Yüksek', fotografGerekli: true }),
      dm('DSB-01', 'Kişisel Koruyucu Donanım', 'Çalışanlara uygun KKD dağıtılmış mı?', { onem: 'Yüksek' }),
      dm('DSB-01', 'Kişisel Koruyucu Donanım', 'KKD kullanımı sahada uygulanıyor mu?', { onem: 'Yüksek', fotografGerekli: true }),
    ],
    durum: 'Planlandı',
    belgeler: [],
    gecmis: [olay('2026-11-02', 'Tunahan Yılmaztürk', 'Denetim planlandı')],
    olusturan: 'Tunahan Yılmaztürk',
    olusturma: '2026-11-02',
    guncelleme: '2026-11-02',
  },
  {
    id: 'DN-002',
    no: 'DN-2026-002',
    baslik: 'Depo elektrik ve yangın denetimi',
    firmaId: 'FR-02',
    firmaAd: 'Nova Lojistik Ltd.',
    lokasyon: 'Ana depo — A blok',
    turId: 'DT-04',
    turAd: 'Yangın ve Acil Durum',
    planlananTarih: TODAY,
    planlananSaat: '09:30',
    gerceklesmeBaslangic: TODAY,
    uzmanId: 'PRS-01',
    uzmanAd: 'Tunahan Yılmaztürk',
    katilimcilar: [
      { ad: 'Tunahan Yılmaztürk', rol: 'Sorumlu Uzman' },
      { ad: 'Burak Koç', rol: 'Çalışan Temsilcisi' },
    ],
    kapsam: 'Yangın ekipmanı, elektrik panoları ve tahliye yolları',
    sablonlar: [
      { sablonId: 'DSB-02', surum: 1 },
      { sablonId: 'DSB-03', surum: 1 },
    ],
    maddeler: [
      dm('DSB-02', 'Söndürme Ekipmanı', 'Yangın söndürücülerin erişilebilirliği kontrol edildi mi?', { onem: 'Kritik', fotografGerekli: true, sonuc: 'Uygun', bolum: 'Depo girişi' }),
      dm('DSB-02', 'Söndürme Ekipmanı', 'Yangın söndürücülerin bakım tarihleri uygun mu?', { onem: 'Yüksek', sonuc: 'Uygunsuz', not: '2 adet söndürücünün bakım etiketi 2025-08 tarihinde kalmış', bolum: 'B katı' }),
      dm('DSB-02', 'Söndürme Ekipmanı', 'Yangın dolapları ve hortumları çalışır durumda mı?', { onem: 'Yüksek', sonuc: 'Uygun' }),
      dm('DSB-02', 'Algılama ve Tahliye', 'Yangın algılama sistemi çalışır durumda mı?', { onem: 'Kritik', sonuc: 'Uygun' }),
      dm('DSB-02', 'Algılama ve Tahliye', 'Duman dedektörleri periyodik olarak test ediliyor mu?', { onem: 'Yüksek', zorunlu: false, sonuc: 'Uygulanamaz', not: 'Test kaydı tutulmuyor' }),
      dm('DSB-02', 'Algılama ve Tahliye', 'Tahliye toplanma alanı belirlenmiş ve işaretlenmiş mi?', { sonuc: 'Uygun' }),
      dm('DSB-03', 'Pano ve Tesisat', 'Elektrik panolarının kapakları kapalı mı?', { onem: 'Yüksek', sonuc: 'Uygunsuz', not: 'DP-3 pano kapağı açık, geçici bantla kapatılmış', bolum: 'Depo A koridor' }),
      dm('DSB-03', 'Pano ve Tesisat', 'Elektrik panolarında gerekli uyarı işaretleri bulunuyor mu?', { sonuc: 'Uygun' }),
      dm('DSB-03', 'Pano ve Tesisat', 'Topraklama kontrolleri ve ilgili kayıtlar mevcut mu?', { onem: 'Kritik' }),
      dm('DSB-03', 'Pano ve Tesisat', 'Elektrik kablolarında hasar veya açıkta iletken var mı?', { onem: 'Kritik', fotografGerekli: true }),
      dm('DSB-03', 'Pano ve Tesisat', 'Elektrik panolarının önünde yeterli çalışma alanı var mı?', { sonuc: 'Gözlem', not: 'DP-1 önünde palet istifi — sürekli tekrarlanıyor' }),
    ],
    durum: 'Devam Ediyor',
    belgeler: [],
    gecmis: [
      olay('2026-11-03', 'Ayşe Kaya', 'Denetim planlandı'),
      olay(TODAY, 'Tunahan Yılmaztürk', 'Denetim başlatıldı'),
    ],
    olusturan: 'Ayşe Kaya',
    olusturma: '2026-11-03',
    guncelleme: TODAY,
  },
  {
    id: 'DN-003',
    no: 'DN-2026-003',
    baslik: 'Makine güvenliği periyodik denetimi',
    firmaId: 'FR-01',
    firmaAd: 'Akdeniz Metal San. ve Tic. A.Ş.',
    lokasyon: 'Pres hattı ve kaynak bölümü',
    turId: 'DT-02',
    turAd: 'İş Ekipmanları ve Makine Güvenliği',
    planlananTarih: '2026-10-28',
    gerceklesmeBaslangic: '2026-10-28',
    uzmanId: 'PRS-01',
    uzmanAd: 'Tunahan Yılmaztürk',
    katilimcilar: [{ ad: 'Tunahan Yılmaztürk', rol: 'Sorumlu Uzman' }],
    sablonlar: [{ sablonId: 'DSB-04', surum: 1 }],
    maddeler: [
      dm('DSB-04', 'Makine Güvenliği', 'Makine koruyucuları mevcut ve yerinde mi?', { onem: 'Kritik', fotografGerekli: true, sonuc: 'Uygunsuz', not: 'Pres-2 kalıp koruyucusu sökülmüş durumda', bolum: 'Pres hattı' }),
      dm('DSB-04', 'Makine Güvenliği', 'Acil durdurma butonları çalışıyor mu?', { onem: 'Kritik', sonuc: 'Uygun' }),
      dm('DSB-04', 'Makine Güvenliği', 'Makine kullanım talimatları mevcut mu?', { zorunlu: false, sonuc: 'Uygun' }),
      dm('DSB-04', 'Makine Güvenliği', 'Yetkisiz kullanım önlenmiş mi?', { onem: 'Yüksek', sonuc: 'Uygun' }),
    ],
    durum: 'Rapor Bekliyor',
    belgeler: [],
    gecmis: [
      olay('2026-10-24', 'Ayşe Kaya', 'Denetim planlandı'),
      olay('2026-10-28', 'Tunahan Yılmaztürk', 'Denetim başlatıldı'),
      olay('2026-10-28', 'Tunahan Yılmaztürk', 'Saha kontrolleri tamamlandı — rapor bekleniyor'),
    ],
    olusturan: 'Ayşe Kaya',
    olusturma: '2026-10-24',
    guncelleme: '2026-10-28',
  },
  {
    id: 'DN-004',
    no: 'DN-2026-004',
    baslik: 'Depo raf ve istifleme denetimi',
    firmaId: 'FR-02',
    firmaAd: 'Nova Lojistik Ltd.',
    lokasyon: 'Ana depo',
    turId: 'DT-09',
    turAd: 'Depo ve İstifleme',
    planlananTarih: '2026-10-15',
    gerceklesmeBaslangic: '2026-10-15',
    gerceklesmeBitis: '2026-10-15',
    uzmanId: 'PRS-02',
    uzmanAd: 'Ayşe Kaya',
    katilimcilar: [
      { ad: 'Ayşe Kaya', rol: 'Sorumlu Uzman' },
      { ad: 'Burak Koç', rol: 'İşveren Temsilcisi' },
    ],
    sablonlar: [{ sablonId: 'DSB-05', surum: 1 }],
    maddeler: [
      dm('DSB-05', 'Raf ve İstifleme', 'Raf traverslerinde hasar var mı?', { onem: 'Kritik', fotografGerekli: true, sonuc: 'Uygunsuz', not: 'R3 rafında 2 travers bükülmüş', bolum: 'R3 koridoru' }),
      dm('DSB-05', 'Raf ve İstifleme', 'Raf yük kapasite etiketleri görünür mü?', { onem: 'Yüksek', sonuc: 'Uygunsuz', not: 'B koridorunda etiketler eksik' }),
      dm('DSB-05', 'Raf ve İstifleme', 'Yaya yolları forklift güzergâhından ayrılmış mı?', { onem: 'Kritik', sonuc: 'Uygunsuz', not: 'Ana koridorda yaya-forklift çakışması sürüyor', bolum: 'Ana koridor' }),
      dm('DSB-05', 'Raf ve İstifleme', 'İstif yüksekliği güvenli sınırda mı?', { onem: 'Yüksek', sonuc: 'Uygun' }),
    ],
    durum: 'Tamamlandı',
    puan: 25,
    belgeler: [{ id: 'DB-01', ad: 'DN-2026-004 Denetim Raporu', tur: 'rapor', surum: 1, olusturma: '2026-10-16', olusturan: 'Ayşe Kaya' }],
    gecmis: [
      olay('2026-10-10', 'Tunahan Yılmaztürk', 'Denetim planlandı'),
      olay('2026-10-15', 'Ayşe Kaya', 'Denetim başlatıldı'),
      olay('2026-10-15', 'Ayşe Kaya', '3 uygunsuzluk kaydedildi'),
      olay('2026-10-16', 'Ayşe Kaya', 'Rapor oluşturuldu — denetim tamamlandı'),
    ],
    olusturan: 'Tunahan Yılmaztürk',
    olusturma: '2026-10-10',
    guncelleme: '2026-10-16',
  },
]

export const bulguSeed: DenetimBulgu[] = [
  {
    id: 'BLG-001', denetimId: 'DN-002', maddeId: '',
    baslik: 'Söndürücü bakım etiketleri güncel değil',
    aciklama: 'B katındaki 2 yangın söndürücünün bakım etiketi 2025-08 tarihinde kalmış; periyodik bakım kaydı yok.',
    firmaId: 'FR-02', bolum: 'B katı', tespitTarihi: TODAY,
    onem: 'Yüksek', ekler: [],
    onerilenFaaliyet: 'Tüm söndürücüler için bakım sözleşmesi ve etiket takip planı',
    sorumluAd: 'Selin Öztürk', hedefTarih: '2026-11-20',
    durum: 'Açık',
  },
  {
    id: 'BLG-002', denetimId: 'DN-002', maddeId: '',
    baslik: 'DP-3 pano kapağı açık',
    aciklama: 'Depo A koridordaki DP-3 dağıtım panosu kapağı açık, geçici bantla kapatılmış. Enerjili baralara erişim riski.',
    firmaId: 'FR-02', bolum: 'Depo A koridor', tespitTarihi: TODAY,
    onem: 'Kritik', ekler: [],
    onerilenFaaliyet: 'Pano kapağı kilit mekanizmasının onarımı ve uyarı levhası',
    sorumluAd: 'Burak Koç', hedefTarih: '2026-11-08',
    durum: 'Aksiyonda',
    aksiyonId: 'AK-DEN-01',
  },
  {
    id: 'BLG-003', denetimId: 'DN-003', maddeId: '',
    baslik: 'Pres-2 kalıp koruyucusu sökülmüş',
    aciklama: 'Pres hattındaki Pres-2 makinesinin kalıp koruyucusu sökülmüş durumda; operatör korumasız çalışıyor.',
    firmaId: 'FR-01', bolum: 'Pres hattı', tespitTarihi: '2026-10-28',
    onem: 'Kritik', ekler: [],
    onerilenFaaliyet: 'Koruyucunun derhal monte edilmesi; monte edilene dek makine durdurulmalı',
    sorumluAd: 'Cem Demir', hedefTarih: '2026-11-01',
    durum: 'Kontrol Bekliyor',
    aksiyonId: 'AK-DEN-02', riskTehlikeId: 'TH-01',
  },
  {
    id: 'BLG-004', denetimId: 'DN-004', maddeId: '',
    baslik: 'R3 rafında bükülmüş travers',
    aciklama: 'R3 koridorundaki rafın 2 traversi forklift darbesiyle bükülmüş; taşıma kapasitesi belirsiz.',
    firmaId: 'FR-02', bolum: 'R3 koridoru', tespitTarihi: '2026-10-15',
    onem: 'Yüksek', ekler: [],
    onerilenFaaliyet: 'Hasarlı traverslerin değişimi ve darbe koruyucu montajı',
    sorumluAd: 'Burak Koç', hedefTarih: '2026-11-02',
    durum: 'Aksiyonda',
    aksiyonId: 'AK-04', riskTehlikeId: 'TH-05',
  },
  {
    id: 'BLG-005', denetimId: 'DN-004', maddeId: '',
    baslik: 'Yaya-forklift güzergâhı çakışması',
    aciklama: 'Ana koridorda yaya yolları forklift güzergâhıyla kesişiyor; fiziksel ayrım yok.',
    firmaId: 'FR-02', bolum: 'Ana koridor', tespitTarihi: '2026-10-15',
    onem: 'Kritik', ekler: [],
    onerilenFaaliyet: 'Yaya bariyerleri ve hız limiti levhaları',
    sorumluAd: 'Selin Öztürk', hedefTarih: '2026-10-30',
    durum: 'Aksiyonda',
    aksiyonId: 'AK-05', riskTehlikeId: 'TH-06',
  },
  {
    id: 'BLG-006', denetimId: 'DN-004', maddeId: '',
    baslik: 'Raf kapasite etiketleri eksik',
    aciklama: 'B koridorundaki raflarda yük kapasite etiketleri eksik; operatörler limit bilgisi olmadan istifliyor.',
    firmaId: 'FR-02', bolum: 'B koridoru', tespitTarihi: '2026-10-15',
    onem: 'Orta', ekler: [],
    onerilenFaaliyet: 'Tüm raflara kapasite etiketi basılıp asılması',
    sorumluAd: 'Burak Koç', hedefTarih: '2026-10-25',
    durum: 'Kapatıldı',
    kapatmaNotu: 'Etiketler basılıp tüm raflara asıldı; fotoğrafıyla doğrulandı.',
    kapatan: 'Ayşe Kaya', kapatmaTarihi: '2026-10-24',
  },
]
