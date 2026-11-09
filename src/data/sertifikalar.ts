/*
 * Sertifika yönetimi — veri modeli ve seed kayıtlar.
 * Üretimde karşılığı: certificate_templates, certificate_approval_requests,
 * certificates, certificate_verification_codes, certificate_approval_events.
 * Sertifika kayıtları donmuş görüntü taşır — şablon/eğitim değişse bile
 * geçmiş belge içeriği korunur (PDF yeniden aynı veriden üretilir).
 */
import { TODAY } from '@/data/dashboard'
import type { SertifikaKonu, TasarimEleman, Yon } from '@/data/sertifika-tasarim'

/* ------------------------------ Şablonlar -------------------------------- */

export type BelgeTuru = 'katilim' | 'resmi'

export interface SertifikaSablon {
  id: string
  ad: string
  aciklama: string
  /** Kurum içi katılım belgesi mi, mevzuata bağlı resmî belge mi */
  belgeTuru: BelgeTuru
  /** Sertifika üzerindeki ana başlık */
  baslik: string
  anaRenk: string // hex
  vurguRenk: string // hex
  imzalar: { unvan: string; adSoyad: string }[]
  aktif: boolean
  varsayilan: boolean
}

export const sablonSeed: SertifikaSablon[] = [
  {
    id: 'STB-01',
    ad: 'Standart Katılım',
    aciklama: 'Kurum içi eğitim tamamlama belgeleri için varsayılan tasarım',
    belgeTuru: 'katilim',
    baslik: 'EĞİTİM TAMAMLAMA SERTİFİKASI',
    anaRenk: '#16324F',
    vurguRenk: '#2563EB',
    imzalar: [
      { unvan: 'OSGB Sorumlu Müdürü', adSoyad: 'Tunahan Yılmaztürk' },
      { unvan: 'Eğitim Koordinatörü', adSoyad: 'Pınar Doğan' },
    ],
    aktif: true,
    varsayilan: true,
  },
  {
    id: 'STB-02',
    ad: 'Resmî Belge Tasarımı',
    aciklama: 'Mevzuat kapsamında yetkili kişilerce düzenlenen belgeler',
    belgeTuru: 'resmi',
    baslik: 'SERTİFİKA',
    anaRenk: '#1E3A5F',
    vurguRenk: '#0F766E',
    imzalar: [{ unvan: 'Yetkili İş Güvenliği Uzmanı', adSoyad: 'Ahmet Kaya' }],
    aktif: true,
    varsayilan: false,
  },
]

/* --------------------------- Başvuru (onay kuyruğu) ----------------------- */

export type BasvuruDurum =
  | 'İnceleme Bekliyor'
  | 'İnceleniyor'
  | 'Onaylandı'
  | 'Reddedildi'
  | 'Eksik Koşul'
  | 'İptal Edildi'

export interface BasvuruOlay {
  tarih: string
  kullanici: string
  islem: string
  not?: string
}

export interface SertifikaBasvuru {
  id: string // SBV-000001
  atamaId: string
  personelId: string
  egitimId: string
  /** Başvuru hangi eğitim sürümüne dayanıyorsa o sürüme sabitlenir */
  surumId: string
  basvuruTarihi: string
  durum: BasvuruDurum
  tamamlanmaTarihi: string
  sinavPuani?: number
  sinavGecti?: boolean
  denemeSayisi: number
  inceleyen?: string
  onaylayan?: string
  onayTarihi?: string
  retNedeni?: string
  retAciklama?: string
  sertifikaId?: string
  olaylar: BasvuruOlay[]
}

export const RET_NEDENLERI = [
  'Eksik eğitim içeriği',
  'Sınav koşulu karşılanmamış',
  'Eksik personel bilgisi',
  'Yanlış eğitim ataması',
  'Diğer',
] as const

/* ------------------------------- Sertifika -------------------------------- */

export type SertifikaDurum = 'Aktif' | 'Süresi Doldu' | 'İptal Edildi'

/** Sertifika anındaki donmuş tasarım görüntüsü — şablon değişse bile korunur */
export interface TasarimSnap {
  sablonId: string
  sablonAd: string
  surum: number
  yon: Yon
  zemin: string
  font: string
  elemanlar: TasarimEleman[]
  /** İki yüzlü şablonlarda arka yüz tasarımı. Eski snapshot'larda yoktur. */
  arkaElemanlar?: TasarimEleman[]
  arkaZemin?: string
}

export interface SertifikaKatilimDetayi {
  egitimTarihi?: string
  baslangic?: string
  bitis?: string
  egitimSekli?: 'Yüz yüze' | 'Uzaktan'
  egitimYeri?: string
  egitimTuru?: 'İlk defa' | 'Tekrar'
  egiticiler?: { adSoyad: string; unvan?: string }[]
}

/** PDF sürüm kaydı — eski sürümler anlık görüntüden yeniden üretilebilir */
export interface PdfSurum {
  surum: number
  tarih: string
  kullanici: string
  sebep: string
  tasarim: TasarimSnap
}

export interface Sertifika {
  id: string
  /** SRT-YYYY-NNNNNN — benzersiz */
  sertifikaNo: string
  /** Tahmin edilmesi zor doğrulama anahtarı — QR/URL buna bağlı */
  dogrulamaKodu: string
  basvuruId: string
  atamaId: string
  personelId: string
  firmaId: string
  egitimId: string
  surumId: string
  // Donmuş görüntü — sertifika anındaki değerler
  personelAd: string
  personelGorev?: string
  /** TCKN yalnızca açıkça sertifika tasarımına eklenmişse snapshot'a alınır. */
  personelTc?: string
  firmaAd: string
  egitimAd: string
  egitimSurumNo: number
  egitimSure: number
  egitimKonulari?: SertifikaKonu[]
  katilimDetayi?: SertifikaKatilimDetayi
  egitimKategori: string
  belgeTuru: BelgeTuru
  sablonId: string
  /** Şablonun o andaki görsel tanımı — sonradan şablon değişse de etkilenmez */
  sablonSnap: Pick<SertifikaSablon, 'baslik' | 'anaRenk' | 'vurguRenk' | 'imzalar'>
  /** Eleman-tabanlı tasarım anlık görüntüsü (v2 şablonla üretildiyse) */
  tasarim?: TasarimSnap
  /** Üretilen PDF sürümleri — sürüm 1 ilk üretim */
  pdfSurumler?: PdfSurum[]
  aciklama?: string
  tamamlanmaTarihi: string
  duzenlenmeTarihi: string
  gecerlilikTarihi?: string
  onaylayan: string
  onayTarihi: string
  durum: SertifikaDurum
  iptalNedeni?: string
  iptalTarihi?: string
  gecmis: BasvuruOlay[]
}

export const durumRenkSertifika: Record<SertifikaDurum, string> = {
  Aktif: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'Süresi Doldu': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'İptal Edildi': 'bg-red-500/10 text-red-500',
}

export const basvuruDurumRenk: Record<BasvuruDurum, string> = {
  'İnceleme Bekliyor': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  İnceleniyor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  Onaylandı: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Reddedildi: 'bg-red-500/10 text-red-500',
  'Eksik Koşul': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  'İptal Edildi': 'bg-zinc-500/10 text-zinc-500',
}

/* --------------------------------- Seed ----------------------------------- */

export const sertifikaSeed: Sertifika[] = [
  {
    id: 'CRT-01',
    sertifikaNo: 'SRT-2026-000001',
    dogrulamaKodu: 'd8f2k9mq4x',
    basvuruId: 'SBV-01',
    atamaId: 'ATM-01',
    personelId: 'FP-01',
    firmaId: 'FR-01',
    egitimId: 'EGT-01',
    surumId: 'ES-0102',
    personelAd: 'Cem Demir',
    firmaAd: 'Akdeniz Metal San. ve Tic. A.Ş.',
    egitimAd: 'Temel İş Sağlığı ve Güvenliği Eğitimi',
    egitimSurumNo: 2,
    egitimSure: 95,
    egitimKategori: 'Temel İSG',
    belgeTuru: 'katilim',
    sablonId: 'STB-01',
    sablonSnap: {
      baslik: 'EĞİTİM TAMAMLAMA SERTİFİKASI',
      anaRenk: '#16324F',
      vurguRenk: '#2563EB',
      imzalar: [
        { unvan: 'OSGB Sorumlu Müdürü', adSoyad: 'Tunahan Yılmaztürk' },
        { unvan: 'Eğitim Koordinatörü', adSoyad: 'Pınar Doğan' },
      ],
    },
    tamamlanmaTarihi: '2026-10-28',
    duzenlenmeTarihi: '2026-10-30',
    gecerlilikTarihi: '2027-10-30',
    onaylayan: 'Tunahan Yılmaztürk',
    onayTarihi: '2026-10-30',
    durum: 'Aktif',
    gecmis: [
      { tarih: '2026-10-29', kullanici: 'Sistem', islem: 'Başvuru oluşturuldu — eğitim tamamlandı' },
      { tarih: '2026-10-30', kullanici: 'Tunahan Yılmaztürk', islem: 'Onaylandı — sertifika SRT-2026-000001 düzenlendi' },
    ],
  },
]

export const basvuruSeed: SertifikaBasvuru[] = [
  {
    id: 'SBV-01',
    atamaId: 'ATM-01',
    personelId: 'FP-01',
    egitimId: 'EGT-01',
    surumId: 'ES-0102',
    basvuruTarihi: '2026-10-29',
    durum: 'Onaylandı',
    tamamlanmaTarihi: '2026-10-28',
    sinavPuani: 90,
    sinavGecti: true,
    denemeSayisi: 1,
    inceleyen: 'Tunahan Yılmaztürk',
    onaylayan: 'Tunahan Yılmaztürk',
    onayTarihi: '2026-10-30',
    sertifikaId: 'CRT-01',
    olaylar: [
      { tarih: '2026-10-29', kullanici: 'Sistem', islem: 'Başvuru oluşturuldu — eğitim tamamlandı' },
      { tarih: '2026-10-30', kullanici: 'Tunahan Yılmaztürk', islem: 'Onaylandı — SRT-2026-000001' },
    ],
  },
  {
    id: 'SBV-02',
    atamaId: 'ATM-02',
    personelId: 'FP-05',
    egitimId: 'EGT-02',
    surumId: 'ES-0201',
    basvuruTarihi: '2026-11-01',
    durum: 'Reddedildi',
    tamamlanmaTarihi: '2026-10-31',
    sinavPuani: 62,
    sinavGecti: false,
    denemeSayisi: 3,
    inceleyen: 'Tunahan Yılmaztürk',
    retNedeni: 'Sınav koşulu karşılanmamış',
    retAciklama: 'Son denemede 62 puan — geçme puanı 70. Deneme hakkı doldu; yeni atama planlanacak.',
    olaylar: [
      { tarih: '2026-11-01', kullanici: 'Sistem', islem: 'Başvuru oluşturuldu — eğitim tamamlandı' },
      { tarih: '2026-11-02', kullanici: 'Tunahan Yılmaztürk', islem: 'İncelemeye alındı' },
      { tarih: '2026-11-02', kullanici: 'Tunahan Yılmaztürk', islem: 'Reddedildi', not: 'Sınav koşulu karşılanmamış' },
    ],
  },
]

/* ------------------------------- Yardımcılar ------------------------------ */

/** Doğrulama sayfasında gösterilen maskeli ad — "Cem D***" */
export const adMaske = (ad: string) => {
  const p = ad.trim().split(' ')
  if (p.length === 1) return `${p[0][0]}***`
  return `${p.slice(0, -1).join(' ')} ${p.at(-1)![0]}${'*'.repeat(3)}`
}

/** Sertifika geçerlilik durumu — iptal ayrı tutulur */
export const sertifikaGuncelDurum = (s: Sertifika): SertifikaDurum => {
  if (s.durum === 'İptal Edildi') return 'İptal Edildi'
  if (s.gecerlilikTarihi && s.gecerlilikTarihi < TODAY) return 'Süresi Doldu'
  return 'Aktif'
}

export const dogrulamaUrl = (kod: string) => `${location.origin}/dogrula/${kod}`
