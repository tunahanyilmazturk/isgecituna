import type { PillTone } from '@/components/pill'
import type { OlayEk } from '@/data/olaylar'
import type { FirmaIslem } from '@/data/firmalar'
import { TODAY } from '@/data/dashboard'
import {
  DEMO_SIFRE_OZETI,
  DSP2026_SIFRE_OZETI,
  ISG2026_SIFRE_OZETI,
  MUDUR2026_SIFRE_OZETI,
  SAHA2026_SIFRE_OZETI,
} from '@/data/sifre-seed'

export const BUGUN = TODAY

/* ------------------------------------------------------------------ */
/* Üç ayrı kavram: Personel · Kullanıcı Hesabı · Firma Görevlendirmesi  */
/* ------------------------------------------------------------------ */

export type GorevTuru =
  | 'Kurum Müdürü'
  | 'İş Güvenliği Uzmanı'
  | 'İşyeri Hekimi'
  | 'Diğer Sağlık Personeli'
  | 'Hemşire'
  | 'İdari Personel'
  | 'Operasyon Sorumlusu'
  | 'Laboratuvar Personeli'
  | 'Diğer'

export type PersonelDurum = 'Aktif' | 'İzinli' | 'Pasif' | 'İşten Ayrıldı'
export type HesapDurum = 'Aktif' | 'Davet Bekliyor' | 'Askıda' | 'Pasif'

/** Personel — kurumda çalışan kişi (hesaptan bağımsız) */
export interface EkipUye {
  id: string
  unvanOnek?: string // Dr., Hemşire, ATT…
  ad: string
  soyad: string
  tc?: string // maskeli saklanır (KVKK)
  dogumTarihi?: string
  telefon: string
  eposta: string
  adres?: string
  gorev: GorevTuru
  // — mesleki alanlar (göreve göre dolu) —
  uzmanSinifi?: 'A' | 'B' | 'C'
  katipKaydi?: string
  belgeNo?: string
  belgeGecerlilik?: string
  brans?: string
  diplomaNo?: string
  meslekiKayitNo?: string
  meslekTuru?: string
  departman?: string
  pozisyon?: string
  deneyimYili?: string
  belgeler: OlayEk[]
  // — çalışma bilgileri —
  iseGiris: string
  calismaTipi?: string
  dahiliTel?: string
  aciklama?: string
  durum: PersonelDurum
  islemGecmisi: FirmaIslem[]
}

/**
 * Kullanıcı hesabı — sisteme giriş. Personel kaydıyla ilişki OPSİYONEL:
 * her personelin hesabı olmak zorunda değil, her hesap personele bağlı olmak
 * zorunda değil. İzinler kullanıcı bazlıdır; `rol` yalnızca ilk şablon etiketi.
 */
export interface KullaniciHesap {
  id: string
  personelId?: string
  ad?: string // personel kaydı yoksa görünen isim
  kullaniciAdi: string
  eposta: string
  sifreHash?: string // düz metin asla saklanmaz (PBKDF2-SHA256, bkz. lib/sifre.ts)
  rol: RolAdi
  /** Kullanıcıya özel izin anahtarları — atanmamışsa rol şablonundan türetilir */
  izinler?: string[]
  /** Modül bazlı kayıt erişim kapsamı */
  kapsam?: import('@/data/permissions').KapsamHarita
  durum: HesapDurum
  sonGiris?: string
  sonAktiflik?: string
  davetTarihi?: string
  davetToken?: string // tek kullanımlık
  davetBitis?: string // süreli davet
}

/** Rol şablonu → izin anahtarı seti (yalnızca ilk atama önerisi) */
export const rolIzinleri = (rol: RolAdi): string[] => {
  const modulKey: Record<string, string> = {
    'Genel Bakış': 'genel',
    'Olay Bildirimleri': 'olaylar',
    Firmalar: 'firmalar',
    'İSG-KATİP': 'isg-katip',
    Ekip: 'ekip',
    'Risk Değerlendirme': 'risk',
    Denetimler: 'gorevlendirmeler',
    'Eğitim & Belgeler': 'egitimler',
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

/** Firma görevlendirmesi — personel × firma ilişkisi, geçmiş korunur */
export interface Gorevlendirme {
  id: string
  personelId: string
  firmaId: string
  gorevTuru: 'Uzman' | 'Hekim' | 'DSP' | 'Diğer'
  baslangic: string
  bitis?: string
  durum: 'Aktif' | 'Geçmiş' | 'Beklemede'
}

/* ---------------------------------- RBAC ---------------------------------- */

export type RolAdi =
  | 'Sistem Yöneticisi'
  | 'Kurum Müdürü'
  | 'İş Güvenliği Uzmanı'
  | 'İşyeri Hekimi'
  | 'DSP / Hemşire'
  | 'İdari Personel'

export type Modul =
  | 'Genel Bakış'
  | 'Olay Bildirimleri'
  | 'Firmalar'
  | 'İSG-KATİP'
  | 'Ekip'
  | 'Risk Değerlendirme'
  | 'Denetimler'
  | 'Eğitim & Belgeler'
  | 'Raporlar'
  | 'Sistem Ayarları'

export type Izin = 'görüntüle' | 'oluştur' | 'düzenle' | 'sil' | 'aktar'

export const MODULLER: Modul[] = [
  'Genel Bakış',
  'Olay Bildirimleri',
  'Firmalar',
  'İSG-KATİP',
  'Ekip',
  'Risk Değerlendirme',
  'Denetimler',
  'Eğitim & Belgeler',
  'Raporlar',
  'Sistem Ayarları',
]

export const IZINLER: Izin[] = ['görüntüle', 'oluştur', 'düzenle', 'sil', 'aktar']

const TUMU: Izin[] = [...IZINLER]
const GOR: Izin[] = ['görüntüle']
const GOR_AKTAR: Izin[] = ['görüntüle', 'aktar']
const GOR_EKLE_DUZ: Izin[] = ['görüntüle', 'oluştur', 'düzenle']
const GOR_EKLE_DUZ_AKT: Izin[] = ['görüntüle', 'oluştur', 'düzenle', 'aktar']

/** Hazır rol şablonları — modül bazında 5 izin türü */
export const ROLLER: Record<RolAdi, { aciklama: string; izinler: Partial<Record<Modul, Izin[]>> }> = {
  'Sistem Yöneticisi': {
    aciklama: 'Tüm modüllere tam erişim',
    izinler: Object.fromEntries(MODULLER.map((m) => [m, TUMU])) as Record<Modul, Izin[]>,
  },
  'Kurum Müdürü': {
    aciklama: 'Firma, ekip ve operasyon yönetimi',
    izinler: {
      'Genel Bakış': GOR_AKTAR,
      'Olay Bildirimleri': GOR_EKLE_DUZ_AKT,
      Firmalar: GOR_EKLE_DUZ_AKT,
      'İSG-KATİP': GOR_EKLE_DUZ_AKT,
      Ekip: GOR_EKLE_DUZ_AKT,
      'Risk Değerlendirme': GOR_EKLE_DUZ_AKT,
      Denetimler: GOR_EKLE_DUZ_AKT,
      'Eğitim & Belgeler': GOR_EKLE_DUZ_AKT,
      Raporlar: GOR_AKTAR,
      'Sistem Ayarları': GOR,
    },
  },
  'İş Güvenliği Uzmanı': {
    aciklama: 'Atanan firmalarda olay, risk ve DÖF yönetimi',
    izinler: {
      'Genel Bakış': GOR,
      'Olay Bildirimleri': GOR_EKLE_DUZ_AKT,
      Firmalar: GOR,
      'İSG-KATİP': GOR,
      'Risk Değerlendirme': GOR_EKLE_DUZ,
      Denetimler: GOR_EKLE_DUZ,
      'Eğitim & Belgeler': GOR,
      Raporlar: GOR_AKTAR,
    },
  },
  'İşyeri Hekimi': {
    aciklama: 'Sağlık hizmeti kapsamında atama ve olay görüntüleme',
    izinler: {
      'Genel Bakış': GOR,
      'Olay Bildirimleri': GOR,
      Firmalar: GOR,
      'İSG-KATİP': GOR,
      'Eğitim & Belgeler': GOR,
      Raporlar: GOR,
    },
  },
  'DSP / Hemşire': {
    aciklama: 'Atanan firmalarda operasyonel kayıt takibi',
    izinler: {
      'Genel Bakış': GOR,
      'Olay Bildirimleri': GOR_EKLE_DUZ,
      Firmalar: GOR,
      'İSG-KATİP': GOR,
      Raporlar: GOR,
    },
  },
  'İdari Personel': {
    aciklama: 'Yetkilendirilen modüllerde kayıt işlemleri',
    izinler: {
      'Genel Bakış': GOR,
      'Olay Bildirimleri': GOR_EKLE_DUZ,
      Firmalar: GOR,
      Raporlar: GOR_AKTAR,
    },
  },
}

export const ROL_ADLARI = Object.keys(ROLLER) as RolAdi[]

export const GOREV_TURLERI: GorevTuru[] = [
  'Kurum Müdürü',
  'İş Güvenliği Uzmanı',
  'İşyeri Hekimi',
  'Diğer Sağlık Personeli',
  'Hemşire',
  'İdari Personel',
  'Operasyon Sorumlusu',
  'Laboratuvar Personeli',
  'Diğer',
]

export const PERSONEL_DURUMLARI: PersonelDurum[] = ['Aktif', 'İzinli', 'Pasif', 'İşten Ayrıldı']

export const CALISMA_TIPLERI = ['Tam zamanlı', 'Yarı zamanlı', 'Vardiyalı', 'Sözleşmeli']

/** Görev → varsayılan kullanıcı rolü eşleşmesi */
export const gorevRol: Partial<Record<GorevTuru, RolAdi>> = {
  'Kurum Müdürü': 'Kurum Müdürü',
  'İş Güvenliği Uzmanı': 'İş Güvenliği Uzmanı',
  'İşyeri Hekimi': 'İşyeri Hekimi',
  'Diğer Sağlık Personeli': 'DSP / Hemşire',
  Hemşire: 'DSP / Hemşire',
  'İdari Personel': 'İdari Personel',
  'Operasyon Sorumlusu': 'İdari Personel',
  'Laboratuvar Personeli': 'İdari Personel',
  Diğer: 'İdari Personel',
}

/* --------------------------------- helpers --------------------------------- */

export const adSoyad = (u: Pick<EkipUye, 'ad' | 'soyad' | 'unvanOnek'>) =>
  `${u.unvanOnek ? `${u.unvanOnek} ` : ''}${u.ad} ${u.soyad}`

export const initialsOf = (u: Pick<EkipUye, 'ad' | 'soyad'>) =>
  `${u.ad[0] ?? ''}${u.soyad[0] ?? ''}`.toUpperCase()

/** Hesabın görünen adı — bağlı personel varsa personel adı, yoksa hesap adı/kullanıcı adı */
export const hesapGorunenAd = (h: KullaniciHesap, uyeler: EkipUye[]) => {
  const p = uyeler.find((u) => u.id === h.personelId)
  return p ? adSoyad(p) : (h.ad ?? h.kullaniciAdi)
}

export const gorevTone: Record<GorevTuru, PillTone> = {
  'Kurum Müdürü': 'violet',
  'İş Güvenliği Uzmanı': 'amber',
  'İşyeri Hekimi': 'sky',
  'Diğer Sağlık Personeli': 'sky',
  Hemşire: 'sky',
  'İdari Personel': 'zinc',
  'Operasyon Sorumlusu': 'zinc',
  'Laboratuvar Personeli': 'zinc',
  Diğer: 'zinc',
}

export const personelDurumTone: Record<PersonelDurum, PillTone> = {
  Aktif: 'green',
  İzinli: 'amber',
  Pasif: 'zinc',
  'İşten Ayrıldı': 'zinc',
}

export const hesapDurumTone: Record<HesapDurum | 'Hesap Yok', PillTone> = {
  Aktif: 'green',
  'Davet Bekliyor': 'amber',
  'Askıda': 'amber',
  Pasif: 'red',
  'Hesap Yok': 'zinc',
}

export const gorevlendirmeTone = {
  Aktif: 'green',
  Beklemede: 'amber',
  Geçmiş: 'zinc',
} as const

/* ---------------------------------- seed ----------------------------------- */

const zorunlu = { belgeler: [] as OlayEk[], islemGecmisi: [] as FirmaIslem[] }

const islem = (tarih: string, i: string, not?: string): FirmaIslem => ({
  tarih,
  islem: i,
  not,
})

export const ekipSeed: EkipUye[] = [
  {
    ...zorunlu,
    id: 'PRS-01',
    ad: 'Tunahan',
    soyad: 'Yılmaztürk',
    telefon: '0532 114 78 90',
    eposta: 't.yilmazturk@vegaosgb.com.tr',
    gorev: 'İş Güvenliği Uzmanı',
    uzmanSinifi: 'B',
    katipKaydi: 'KTIP-34-10294',
    belgeNo: 'IGU-B-2021-04512',
    belgeGecerlilik: '2027-08-14',
    deneyimYili: '6 yıl',
    departman: 'İSG',
    pozisyon: 'Kıdemli İSG Uzmanı',
    belgeler: [{ ad: 'iguz-b-belge.pdf', tur: 'Belge', boyut: '540 KB' }],
    iseGiris: '2021-03-01',
    calismaTipi: 'Tam zamanlı',
    dahiliTel: '1201',
    durum: 'Aktif',
    islemGecmisi: [
      islem('2021-03-01', 'Personel kaydı oluşturuldu'),
      islem('2025-01-15', 'B sınıfı belge yükseltmesi yapıldı'),
      islem('2026-10-30', 'İSG-KATİP profesyonel kaydı doğrulandı'),
    ],
  },
  {
    ...zorunlu,
    id: 'PRS-02',
    ad: 'Ayşe',
    soyad: 'Kaya',
    telefon: '0535 220 41 77',
    eposta: 'a.kaya@vegaosgb.com.tr',
    gorev: 'İş Güvenliği Uzmanı',
    uzmanSinifi: 'C',
    katipKaydi: 'KTIP-34-22180',
    belgeNo: 'IGU-C-2023-08871',
    belgeGecerlilik: '2026-11-20',
    deneyimYili: '2 yıl',
    departman: 'İSG',
    pozisyon: 'İSG Uzmanı',
    belgeler: [{ ad: 'iguz-c-belge.pdf', tur: 'Belge', boyut: '480 KB' }],
    iseGiris: '2023-06-12',
    calismaTipi: 'Tam zamanlı',
    dahiliTel: '1203',
    durum: 'Aktif',
    islemGecmisi: [
      islem('2023-06-12', 'Personel kaydı oluşturuldu'),
      islem('2026-10-15', 'Belge geçerlilik uyarısı oluştu', '20 gün sonra doluyor'),
    ],
  },
  {
    ...zorunlu,
    id: 'PRS-03',
    unvanOnek: 'Dr.',
    ad: 'Selin',
    soyad: 'Aydemir',
    telefon: '0542 801 36 29',
    eposta: 's.aydemir@vegaosgb.com.tr',
    gorev: 'İşyeri Hekimi',
    brans: 'İş Sağlığı',
    diplomaNo: 'TIP-2014-77120',
    meslekiKayitNo: 'KTP-HEK-5544',
    katipKaydi: 'KTIP-HEK-34-0917',
    belgeGecerlilik: '2028-01-20',
    departman: 'Sağlık',
    belgeler: [{ ad: 'isg-hekim-belge.pdf', tur: 'Belge', boyut: '610 KB' }],
    iseGiris: '2024-02-05',
    calismaTipi: 'Sözleşmeli',
    dahiliTel: '1210',
    durum: 'Aktif',
    islemGecmisi: [
      islem('2024-02-05', 'Personel kaydı oluşturuldu'),
      islem('2026-11-01', 'Kullanıcı daveti gönderildi', 'saydemir@vegaosgb.com.tr'),
    ],
  },
  {
    ...zorunlu,
    id: 'PRS-04',
    unvanOnek: 'Dr.',
    ad: 'Murat',
    soyad: 'Özkan',
    telefon: '0533 490 15 82',
    eposta: 'm.ozkan@vegaosgb.com.tr',
    gorev: 'İşyeri Hekimi',
    brans: '',
    diplomaNo: 'TIP-2011-30458',
    meslekiKayitNo: 'KTP-HEK-4412',
    departman: 'Sağlık',
    belgeler: [],
    iseGiris: '2025-09-01',
    calismaTipi: 'Yarı zamanlı',
    durum: 'Aktif',
    islemGecmisi: [islem('2025-09-01', 'Personel kaydı oluşturuldu')],
  },
  {
    ...zorunlu,
    id: 'PRS-05',
    unvanOnek: 'Dr.',
    ad: 'Levent',
    soyad: 'Kara',
    telefon: '0541 237 60 44',
    eposta: 'l.kara@vegaosgb.com.tr',
    gorev: 'İşyeri Hekimi',
    brans: 'Aile Hekimliği',
    diplomaNo: 'TIP-2008-19033',
    departman: 'Sağlık',
    belgeler: [],
    iseGiris: '2024-01-15',
    calismaTipi: 'Sözleşmeli',
    durum: 'Pasif',
    islemGecmisi: [
      islem('2024-01-15', 'Personel kaydı oluşturuldu'),
      islem('2026-05-31', 'Pro-Temiz sözleşmesi sona erdi — pasife alındı'),
    ],
  },
  {
    ...zorunlu,
    id: 'PRS-06',
    unvanOnek: 'Hemşire',
    ad: 'Kaan',
    soyad: 'Ünal',
    telefon: '0553 708 24 91',
    eposta: 'k.unal@vegaosgb.com.tr',
    gorev: 'Diğer Sağlık Personeli',
    meslekTuru: 'Hemşire',
    diplomaNo: 'HMS-2019-55610',
    meslekiKayitNo: 'DSP-3412',
    belgeGecerlilik: '2027-03-30',
    departman: 'Sağlık',
    belgeler: [{ ad: 'dsp-belge.pdf', tur: 'Belge', boyut: '390 KB' }],
    iseGiris: '2022-11-07',
    calismaTipi: 'Tam zamanlı',
    dahiliTel: '1211',
    durum: 'Aktif',
    islemGecmisi: [
      islem('2022-11-07', 'Personel kaydı oluşturuldu'),
      islem('2026-10-15', 'Nova Gıda DSP görevlendirmesi güncellendi'),
    ],
  },
  {
    ...zorunlu,
    id: 'PRS-07',
    unvanOnek: 'ATT',
    ad: 'Pınar',
    soyad: 'Doğan',
    telefon: '0544 815 02 67',
    eposta: 'p.dogan@vegaosgb.com.tr',
    gorev: 'Diğer Sağlık Personeli',
    meslekTuru: 'Acil Tıp Teknisyeni',
    diplomaNo: 'ATT-2021-40218',
    departman: 'Sağlık',
    belgeler: [],
    iseGiris: '2024-08-19',
    calismaTipi: 'Vardiyalı',
    durum: 'İzinli',
    islemGecmisi: [
      islem('2024-08-19', 'Personel kaydı oluşturuldu'),
      islem('2026-10-30', 'Yıllık izin başladı', '12 Kasım dönüş'),
    ],
  },
  {
    ...zorunlu,
    id: 'PRS-08',
    unvanOnek: 'Hemşire',
    ad: 'Seda',
    soyad: 'Yücel',
    telefon: '0536 442 19 85',
    eposta: 's.yucel@vegaosgb.com.tr',
    gorev: 'Hemşire',
    meslekTuru: 'Hemşire',
    diplomaNo: 'HMS-2020-61934',
    departman: 'Sağlık',
    belgeler: [],
    iseGiris: '2025-04-14',
    calismaTipi: 'Tam zamanlı',
    durum: 'Aktif',
    islemGecmisi: [islem('2025-04-14', 'Personel kaydı oluşturuldu')],
  },
  {
    ...zorunlu,
    id: 'PRS-09',
    ad: 'Özlem',
    soyad: 'Yıldız',
    telefon: '0532 650 48 33',
    eposta: 'o.yildiz@vegaosgb.com.tr',
    gorev: 'Kurum Müdürü',
    departman: 'Yönetim',
    pozisyon: 'Genel Müdür',
    belgeler: [],
    iseGiris: '2020-01-20',
    calismaTipi: 'Tam zamanlı',
    dahiliTel: '1100',
    durum: 'Aktif',
    islemGecmisi: [
      islem('2020-01-20', 'Personel kaydı oluşturuldu'),
      islem('2025-01-01', 'Kurum müdürü rolü atandı'),
    ],
  },
  {
    ...zorunlu,
    id: 'PRS-10',
    ad: 'Mehmet',
    soyad: 'Demir',
    telefon: '0537 913 55 08',
    eposta: 'm.demir@vegaosgb.com.tr',
    gorev: 'Operasyon Sorumlusu',
    departman: 'Üretim',
    pozisyon: 'Saha Formeni',
    belgeler: [],
    iseGiris: '2021-09-06',
    calismaTipi: 'Vardiyalı',
    dahiliTel: '1304',
    durum: 'Aktif',
    islemGecmisi: [islem('2021-09-06', 'Personel kaydı oluşturuldu')],
  },
  {
    ...zorunlu,
    id: 'PRS-11',
    ad: 'Emre',
    soyad: 'Şahin',
    telefon: '0543 726 40 19',
    eposta: 'e.sahin@vegaosgb.com.tr',
    gorev: 'İdari Personel',
    departman: 'Bakım',
    pozisyon: 'Bakım Şefi',
    belgeler: [],
    iseGiris: '2022-02-14',
    calismaTipi: 'Tam zamanlı',
    dahiliTel: '1308',
    durum: 'Aktif',
    islemGecmisi: [islem('2022-02-14', 'Personel kaydı oluşturuldu')],
  },
  {
    ...zorunlu,
    id: 'PRS-12',
    ad: 'Zeynep',
    soyad: 'Arslan',
    telefon: '0549 381 76 52',
    eposta: 'z.arslan@vegaosgb.com.tr',
    gorev: 'İdari Personel',
    departman: 'Lojistik',
    pozisyon: 'Depo Sorumlusu',
    belgeler: [],
    iseGiris: '2023-01-09',
    calismaTipi: 'Tam zamanlı',
    dahiliTel: '1312',
    durum: 'Aktif',
    islemGecmisi: [islem('2023-01-09', 'Personel kaydı oluşturuldu')],
  },
]

export const gorevlendirmeSeed: Gorevlendirme[] = [
  { id: 'GRV-01', personelId: 'PRS-01', firmaId: 'FR-01', gorevTuru: 'Uzman', baslangic: '2025-01-15', durum: 'Aktif' },
  { id: 'GRV-02', personelId: 'PRS-01', firmaId: 'FR-03', gorevTuru: 'Uzman', baslangic: '2025-03-10', durum: 'Aktif' },
  { id: 'GRV-03', personelId: 'PRS-01', firmaId: 'FR-06', gorevTuru: 'Uzman', baslangic: '2025-12-01', durum: 'Aktif' },
  { id: 'GRV-04', personelId: 'PRS-02', firmaId: 'FR-02', gorevTuru: 'Uzman', baslangic: '2025-06-01', durum: 'Aktif' },
  { id: 'GRV-05', personelId: 'PRS-02', firmaId: 'FR-05', gorevTuru: 'Uzman', baslangic: '2025-09-01', durum: 'Aktif' },
  { id: 'GRV-06', personelId: 'PRS-02', firmaId: 'FR-04', gorevTuru: 'Uzman', baslangic: '2025-02-01', bitis: '2026-05-31', durum: 'Geçmiş' },
  { id: 'GRV-07', personelId: 'PRS-03', firmaId: 'FR-01', gorevTuru: 'Hekim', baslangic: '2025-02-03', durum: 'Aktif' },
  { id: 'GRV-08', personelId: 'PRS-03', firmaId: 'FR-02', gorevTuru: 'Hekim', baslangic: '2025-06-02', durum: 'Aktif' },
  { id: 'GRV-09', personelId: 'PRS-04', firmaId: 'FR-05', gorevTuru: 'Hekim', baslangic: '2025-09-02', durum: 'Aktif' },
  { id: 'GRV-10', personelId: 'PRS-04', firmaId: 'FR-07', gorevTuru: 'Hekim', baslangic: '2026-11-10', durum: 'Beklemede' },
  { id: 'GRV-11', personelId: 'PRS-05', firmaId: 'FR-04', gorevTuru: 'Hekim', baslangic: '2025-02-03', bitis: '2026-05-31', durum: 'Geçmiş' },
  { id: 'GRV-12', personelId: 'PRS-06', firmaId: 'FR-01', gorevTuru: 'DSP', baslangic: '2025-06-20', durum: 'Aktif' },
  { id: 'GRV-13', personelId: 'PRS-06', firmaId: 'FR-05', gorevTuru: 'DSP', baslangic: '2026-10-15', durum: 'Aktif' },
  { id: 'GRV-14', personelId: 'PRS-10', firmaId: 'FR-01', gorevTuru: 'Diğer', baslangic: '2024-03-01', durum: 'Aktif' },
]

export const hesapSeed: KullaniciHesap[] = [
  {
    id: 'USR-01',
    personelId: 'PRS-01',
    kullaniciAdi: 'yilmazturk',
    eposta: 't.yilmazturk@vegaosgb.com.tr',
    sifreHash: DEMO_SIFRE_OZETI,
    rol: 'Sistem Yöneticisi',
    durum: 'Aktif',
    sonGiris: '2026-11-04T08:42:00',
    sonAktiflik: '2026-11-04T09:10:00',
  },
  {
    id: 'USR-02',
    personelId: 'PRS-02',
    kullaniciAdi: 'akaya',
    eposta: 'a.kaya@vegaosgb.com.tr',
    sifreHash: ISG2026_SIFRE_OZETI,
    rol: 'İş Güvenliği Uzmanı',
    durum: 'Aktif',
    sonGiris: '2026-11-03T16:20:00',
    sonAktiflik: '2026-11-03T17:45:00',
  },
  {
    id: 'USR-03',
    personelId: 'PRS-03',
    kullaniciAdi: 'saydemir',
    eposta: 's.aydemir@vegaosgb.com.tr',
    rol: 'İşyeri Hekimi',
    durum: 'Davet Bekliyor',
    davetTarihi: '2026-11-01',
    davetToken: 'dvt-saydemir-demo', // demo davet akışı: /davet/dvt-saydemir-demo
    davetBitis: '2026-11-11',
  },
  {
    id: 'USR-04',
    personelId: 'PRS-06',
    kullaniciAdi: 'kunal',
    eposta: 'k.unal@vegaosgb.com.tr',
    sifreHash: DSP2026_SIFRE_OZETI,
    rol: 'DSP / Hemşire',
    durum: 'Aktif',
    sonGiris: '2026-11-02T07:55:00',
    sonAktiflik: '2026-11-02T14:12:00',
  },
  {
    id: 'USR-05',
    personelId: 'PRS-09',
    kullaniciAdi: 'oyildiz',
    eposta: 'o.yildiz@vegaosgb.com.tr',
    sifreHash: MUDUR2026_SIFRE_OZETI,
    rol: 'Kurum Müdürü',
    durum: 'Aktif',
    sonGiris: '2026-11-04T09:00:00',
    sonAktiflik: '2026-11-04T09:00:00',
  },
  {
    id: 'USR-06',
    personelId: 'PRS-10',
    kullaniciAdi: 'mdemir',
    eposta: 'm.demir@vegaosgb.com.tr',
    sifreHash: SAHA2026_SIFRE_OZETI,
    rol: 'İdari Personel',
    durum: 'Pasif',
    sonGiris: '2026-10-12T18:30:00',
  },
]
