/* OSGB ekibi — sağlık taraması ekibi (hekim, hemşire, saha ekibi, yönetim) ve kullanıcı hesapları. */

import type { PillTone } from '@saglik/components/pill'
import { BUGUN as TODAY } from '@saglik/data/saglik'
import { DEMO_SIFRE_OZETI, DSP2026_SIFRE_OZETI, MUDUR2026_SIFRE_OZETI, SAHA2026_SIFRE_OZETI } from '@saglik/data/sifre-seed'
import type { KapsamHarita } from '@saglik/data/permissions'

export const BUGUN = TODAY

export type Cinsiyet = 'Kadın' | 'Erkek'
export type PersonelDurum = 'Aktif' | 'İzinli' | 'Pasif' | 'İşten Ayrıldı'
export type HesapDurum = 'Aktif' | 'Davet Bekliyor' | 'Askıda' | 'Pasif'

export const GOREV_TURLERI = [
  'Operasyon Müdürü',
  'İşyeri Hekimi',
  'Hemşire',
  'Sağlık Teknisyeni',
  'Saha Sorumlusu',
  'İdari Personel',
  'Diğer',
] as const
export type GorevTuru = (typeof GOREV_TURLERI)[number]

export const PERSONEL_DURUMLARI: PersonelDurum[] = ['Aktif', 'İzinli', 'Pasif', 'İşten Ayrıldı']
export const CALISMA_TIPLERI = ['Tam zamanlı', 'Yarı zamanlı', 'Sözleşmeli'] as const

/** Ekip üyesi — kurumda çalışan kişi (hesaptan bağımsız) */
export interface EkipUye {
  id: string
  unvanOnek?: string // Dr., Uzm., Hemşire…
  ad: string
  soyad: string
  cinsiyet?: Cinsiyet
  /** Kırpılmış kare fotoğraf (data URL, ~256px) */
  fotograf?: string
  tc?: string // maskeli saklanır (KVKK)
  dogumTarihi?: string
  telefon: string
  eposta: string
  adres?: string
  gorev: GorevTuru
  /** Sağlık görevlisi ise sertifika / oda kayıt no */
  meslekiKayitNo?: string
  departman?: string
  iseGiris: string
  calismaTipi?: string
  durum: PersonelDurum
  aciklama?: string
}

/* ------------------------------ Kullanıcı hesabı ------------------------------ */

export const ROL_ADLARI_TANIM = [
  'Sistem Yöneticisi',
  'Operasyon Müdürü',
  'Saha Sorumlusu',
  'İşyeri Hekimi',
  'Sağlık Personeli',
  'İdari Personel',
] as const
export type RolAdi = (typeof ROL_ADLARI_TANIM)[number]

/**
 * Kullanıcı hesabı — sisteme giriş. Ekip üyesiyle ilişki opsiyoneldir.
 * İzinler kullanıcı bazlıdır; `rol` yalnızca ilk şablon etiketidir.
 */
export interface KullaniciHesap {
  id: string
  personelId?: string
  ad?: string
  kullaniciAdi: string
  eposta: string
  sifreHash?: string
  rol: RolAdi
  /** Kullanıcıya özel izin anahtarları — atanmamışsa rol şablonundan türetilir */
  izinler?: string[]
  /** Modül bazlı kayıt erişim kapsamı */
  kapsam?: KapsamHarita
  durum: HesapDurum
  sonGiris?: string
  sonAktiflik?: string
  davetTarihi?: string
  davetToken?: string
  davetBitis?: string
}

/* ------------------------------------- RBAC -------------------------------------- */

export type Modul =
  | 'Genel Bakış'
  | 'Firmalar'
  | 'Ekip'
  | 'Personeller'
  | 'Teklifler'
  | 'Testler'
  | 'Test Paketleri'
  | 'Ekipmanlar'
  | 'Taramalar'
  | 'Takvim'
  | 'Raporlar'
  | 'Sistem Ayarları'

export type Izin = 'görüntüle' | 'oluştur' | 'düzenle' | 'sil' | 'aktar'

export const MODULLER: Modul[] = [
  'Genel Bakış',
  'Firmalar',
  'Ekip',
  'Personeller',
  'Teklifler',
  'Testler',
  'Test Paketleri',
  'Ekipmanlar',
  'Taramalar',
  'Takvim',
  'Raporlar',
  'Sistem Ayarları',
]

export const IZINLER: Izin[] = ['görüntüle', 'oluştur', 'düzenle', 'sil', 'aktar']

const TUMU: Izin[] = [...IZINLER]
const GOR: Izin[] = ['görüntüle']
const GOR_AKTAR: Izin[] = ['görüntüle', 'aktar']
const GOR_EKLE_DUZ: Izin[] = ['görüntüle', 'oluştur', 'düzenle']
const GOR_EKLE_DUZ_AKT: Izin[] = ['görüntüle', 'oluştur', 'düzenle', 'aktar']

/** Rol şablonu → izin anahtarı seti (yalnızca ilk atama önerisi) */
export const rolIzinleri = (rol: RolAdi): string[] => {
  const modulKey: Record<string, string> = {
    'Genel Bakış': 'genel',
    Firmalar: 'firmalar',
    Ekip: 'ekip',
    Personeller: 'personeller',
    Teklifler: 'teklifler',
    Testler: 'testler',
    'Test Paketleri': 'test-paketleri',
    Ekipmanlar: 'ekipmanlar',
    Taramalar: 'taramalar',
    Takvim: 'takvim',
    Raporlar: 'raporlar',
    'Sistem Ayarları': 'ayarlar',
  }
  const izinKey: Record<string, string> = {
    görüntüle: 'goruntule',
    oluştur: 'olustur',
    düzenle: 'duzenle',
    sil: 'sil',
    aktar: 'aktar',
  }
  const izinler = new Set<string>()
  for (const [modul, list] of Object.entries(ROLLER[rol].izinler)) {
    const mk = modulKey[modul]
    if (!mk) continue
    for (const i of list ?? []) {
      const ik = izinKey[i]
      if (ik) izinler.add(`${mk}.${ik}`)
    }
  }
  return [...izinler]
}

export const ROLLER: Record<RolAdi, { aciklama: string; izinler: Partial<Record<Modul, Izin[]>> }> = {
  'Sistem Yöneticisi': {
    aciklama: 'Tüm modüllere tam erişim',
    izinler: Object.fromEntries(MODULLER.map((m) => [m, TUMU])) as Record<Modul, Izin[]>,
  },
  'Operasyon Müdürü': {
    aciklama: 'Firma, teklif, ekip ve tarama planlaması',
    izinler: {
      'Genel Bakış': GOR_AKTAR,
      Firmalar: GOR_EKLE_DUZ_AKT,
      Ekip: GOR_EKLE_DUZ,
      Personeller: GOR_EKLE_DUZ_AKT,
      Teklifler: GOR_EKLE_DUZ_AKT,
      Testler: GOR_EKLE_DUZ,
      'Test Paketleri': GOR_EKLE_DUZ,
      Ekipmanlar: GOR_EKLE_DUZ,
      Taramalar: GOR_EKLE_DUZ_AKT,
      Takvim: GOR,
      Raporlar: GOR_AKTAR,
      'Sistem Ayarları': GOR,
    },
  },
  'Saha Sorumlusu': {
    aciklama: 'Saha taramalarını ve ekipmanları yönetir',
    izinler: {
      'Genel Bakış': GOR,
      Firmalar: GOR,
      Personeller: GOR_EKLE_DUZ,
      Testler: GOR,
      'Test Paketleri': GOR,
      Ekipmanlar: GOR_EKLE_DUZ,
      Taramalar: GOR_EKLE_DUZ,
      Takvim: GOR,
      Raporlar: GOR,
    },
  },
  'İşyeri Hekimi': {
    aciklama: 'Tarama sonuçlarını ve muayene kayıtlarını görüntüler',
    izinler: {
      'Genel Bakış': GOR,
      Firmalar: GOR,
      Personeller: GOR,
      Testler: GOR,
      'Test Paketleri': GOR,
      Taramalar: GOR_EKLE_DUZ,
      Takvim: GOR,
      Raporlar: GOR,
    },
  },
  'Sağlık Personeli': {
    aciklama: 'Saha ölçüm ve tarama kaydı girer',
    izinler: {
      'Genel Bakış': GOR,
      Testler: GOR,
      Ekipmanlar: GOR,
      Taramalar: GOR_EKLE_DUZ,
      Takvim: GOR,
    },
  },
  'İdari Personel': {
    aciklama: 'Teklif ve firma kayıtlarını hazırlar',
    izinler: {
      'Genel Bakış': GOR,
      Firmalar: GOR,
      Teklifler: GOR_EKLE_DUZ,
      Raporlar: GOR_AKTAR,
    },
  },
}

export const ROL_ADLARI = Object.keys(ROLLER) as RolAdi[]

/** Görev → varsayılan kullanıcı rolü */
export const gorevRol: Record<GorevTuru, RolAdi> = {
  'Operasyon Müdürü': 'Operasyon Müdürü',
  'İşyeri Hekimi': 'İşyeri Hekimi',
  Hemşire: 'Sağlık Personeli',
  'Sağlık Teknisyeni': 'Sağlık Personeli',
  'Saha Sorumlusu': 'Saha Sorumlusu',
  'İdari Personel': 'İdari Personel',
  Diğer: 'İdari Personel',
}

/* ------------------------------------ Yardımcılar ------------------------------------ */

export const adSoyad = (u: Pick<EkipUye, 'ad' | 'soyad' | 'unvanOnek'>) =>
  `${u.unvanOnek ? `${u.unvanOnek} ` : ''}${u.ad} ${u.soyad}`

export const initialsOf = (u: Pick<EkipUye, 'ad' | 'soyad'>) =>
  `${u.ad[0] ?? ''}${u.soyad[0] ?? ''}`.toUpperCase()

/** Hesabın görünen adı — bağlı ekip üyesi varsa onun adı, yoksa hesap adı */
export const hesapGorunenAd = (h: KullaniciHesap, uyeler: EkipUye[]) => {
  const p = uyeler.find((u) => u.id === h.personelId)
  return p ? adSoyad(p) : (h.ad ?? h.kullaniciAdi)
}

export const gorevTone: Record<GorevTuru, PillTone> = {
  'Operasyon Müdürü': 'violet',
  'İşyeri Hekimi': 'violet',
  Hemşire: 'green',
  'Sağlık Teknisyeni': 'green',
  'Saha Sorumlusu': 'amber',
  'İdari Personel': 'zinc',
  Diğer: 'zinc',
}

export const personelDurumTone: Record<PersonelDurum, PillTone> = {
  Aktif: 'green',
  İzinli: 'amber',
  Pasif: 'zinc',
  'İşten Ayrıldı': 'red',
}

export const hesapDurumTone: Record<HesapDurum | 'Hesap Yok', PillTone> = {
  Aktif: 'green',
  'Davet Bekliyor': 'amber',
  Askıda: 'red',
  Pasif: 'zinc',
  'Hesap Yok': 'zinc',
}

/* --------------------------------------- Seed --------------------------------------- */

export const ekipSeed: EkipUye[] = [
  { id: 'EKP-U01', unvanOnek: 'Uzm.', ad: 'Tunahan', soyad: 'Yılmaztürk', cinsiyet: 'Erkek', telefon: '0532 100 10 01', eposta: 'tunahan@vegaosgb.com.tr', gorev: 'Operasyon Müdürü', departman: 'Operasyon', iseGiris: '2018-04-02', calismaTipi: 'Tam zamanlı', durum: 'Aktif' },
  { id: 'EKP-U02', unvanOnek: 'Dr.', ad: 'Selin', soyad: 'Aydemir', cinsiyet: 'Kadın', telefon: '0533 100 10 02', eposta: 'selin.aydemir@vegaosgb.com.tr', gorev: 'İşyeri Hekimi', meslekiKayitNo: 'TTB-48211', departman: 'Sağlık', iseGiris: '2019-09-16', calismaTipi: 'Tam zamanlı', durum: 'Aktif' },
  { id: 'EKP-U03', unvanOnek: 'Hemşire', ad: 'Ayşe', soyad: 'Kaya', cinsiyet: 'Kadın', telefon: '0534 100 10 03', eposta: 'ayse.kaya@vegaosgb.com.tr', gorev: 'Hemşire', meslekiKayitNo: 'HEM-20931', departman: 'Sağlık', iseGiris: '2021-02-08', calismaTipi: 'Tam zamanlı', durum: 'Aktif' },
  { id: 'EKP-U04', ad: 'Murat', soyad: 'Özkan', cinsiyet: 'Erkek', telefon: '0535 100 10 04', eposta: 'murat.ozkan@vegaosgb.com.tr', gorev: 'Saha Sorumlusu', departman: 'Saha', iseGiris: '2020-06-01', calismaTipi: 'Tam zamanlı', durum: 'Aktif' },
  { id: 'EKP-U05', ad: 'Pınar', soyad: 'Doğan', cinsiyet: 'Kadın', telefon: '0536 100 10 05', eposta: 'pinar.dogan@vegaosgb.com.tr', gorev: 'Sağlık Teknisyeni', meslekiKayitNo: 'SAT-7742', departman: 'Sağlık', iseGiris: '2022-11-21', calismaTipi: 'Vardiyalı', durum: 'İzinli' },
  { id: 'EKP-U06', ad: 'Emre', soyad: 'Şahin', cinsiyet: 'Erkek', telefon: '0537 100 10 06', eposta: 'emre.sahin@vegaosgb.com.tr', gorev: 'Saha Sorumlusu', departman: 'Saha', iseGiris: '2023-03-06', calismaTipi: 'Tam zamanlı', durum: 'Aktif' },
]

export const hesapSeed: KullaniciHesap[] = [
  { id: 'USR-01', personelId: 'EKP-U01', kullaniciAdi: 'yilmazturk', eposta: 'tunahan@vegaosgb.com.tr', sifreHash: MUDUR2026_SIFRE_OZETI, rol: 'Operasyon Müdürü', durum: 'Aktif', sonGiris: '2026-11-04T08:42:00' },
  { id: 'USR-02', personelId: 'EKP-U04', kullaniciAdi: 'mozkan', eposta: 'murat.ozkan@vegaosgb.com.tr', sifreHash: SAHA2026_SIFRE_OZETI, rol: 'Saha Sorumlusu', durum: 'Aktif', sonGiris: '2026-11-03T16:20:00' },
  { id: 'USR-03', personelId: 'EKP-U03', kullaniciAdi: 'akaya', eposta: 'ayse.kaya@vegaosgb.com.tr', sifreHash: DSP2026_SIFRE_OZETI, rol: 'Sağlık Personeli', durum: 'Aktif', sonGiris: '2026-11-02T07:55:00' },
  { id: 'USR-04', kullaniciAdi: 'demo-yonetim', eposta: 'demo@vegaosgb.com.tr', ad: 'Demo Yönetici', sifreHash: DEMO_SIFRE_OZETI, rol: 'Sistem Yöneticisi', durum: 'Pasif' },
]
