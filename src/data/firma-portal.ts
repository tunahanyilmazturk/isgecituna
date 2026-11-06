import { TODAY } from '@/data/dashboard'
import { DEMO_SIFRE_OZETI } from '@/data/sifre-seed'

/*
 * Firma yetkilisi hesapları — müşteri firmanın yönetici/İK kullanıcıları.
 * Üç hesap tipi ayrıdır:
 *   OSGB yönetim kullanıcısı (ekip hesapları, /panel)
 *   Firma yetkilisi (bu dosya, /firma portalı — yalnız kendi firma kapsamı)
 *   Çalışan hesabı (PortalHesap, /portal eğitim portalı)
 * Üretimde: company_users, company_user_memberships, company_user_permissions,
 * audit_logs tabloları; firmaId her istekte sunucudaki üyelikten çözülür,
 * istemciden gelen firma id'sine güvenilmez.
 */

export type YetkiliDurum = 'Aktif' | 'Davet Bekliyor' | 'Askıda' | 'Pasif'

export interface FirmaYetkili {
  id: string
  /** Üyelik — yetkilinin görebildiği/ işlem yapabildiği tek kapsam */
  firmaId: string
  ad: string
  soyad: string
  eposta: string
  telefon: string
  /** Görev/ünvan — ör. İnsan Kaynakları Müdürü, İSG Uzmanı */
  gorev: string
  kullaniciAdi: string
  sifreHash?: string
  sifreDegisimZorunlu?: boolean
  davetToken?: string
  davetBitis?: string
  durum: YetkiliDurum
  sonGiris?: string
  oturumlar: { id: string; cihaz: string; ip: string; tarih: string }[]
  /** Firma kapsamlı izin anahtarları — FIRMA_IZINLERI içinden; ['*'] = tümü */
  izinler: string[]
  olusturma: string
  islemGecmisi: { tarih: string; islem: string; detay?: string }[]
}

const I = (key: string, label: string) => ({ key, label })

/** Firma yetkilisi izin kataloğu — OSGB yönetim izinlerinden (IZIN_MODULLERI) ayrı ad alanı */
export const FIRMA_IZINLERI: { modul: string; label: string; izinler: { key: string; label: string }[] }[] = [
  {
    modul: 'calisan',
    label: 'Çalışan Yönetimi',
    izinler: [
      I('calisan.goruntule', 'Çalışanları görüntüleme'),
      I('calisan.olustur', 'Çalışan oluşturma'),
      I('calisan.duzenle', 'Çalışan düzenleme'),
      I('calisan.hesap', 'Çalışan hesabı oluşturma'),
      I('calisan.pasif', 'Çalışan hesabını/durumunu pasife alma'),
      I('calisan.toplu', 'Toplu çalışan ekleme'),
    ],
  },
  {
    modul: 'egitim',
    label: 'Eğitim Yönetimi',
    izinler: [
      I('egitim.goruntule', 'Atanmış eğitimleri görüntüleme'),
      I('egitim.katilimci', 'Katılımcıları görüntüleme'),
      I('egitim.ekle', 'Çalışanları eğitime ekleme'),
      I('egitim.ilerleme', 'Eğitim ilerlemesini görüntüleme'),
      I('egitim.rapor', 'Eğitim raporlarını indirme'),
    ],
  },
  {
    modul: 'sertifika',
    label: 'Sertifika Yönetimi',
    izinler: [
      I('sertifika.goruntule', 'Sertifikaları görüntüleme'),
      I('sertifika.pdf', 'Sertifika PDF indirme'),
      I('sertifika.dogrulama', 'Doğrulama bilgilerini görüntüleme'),
    ],
  },
  {
    modul: 'firma',
    label: 'Firma Yönetimi',
    izinler: [
      I('firma.goruntule', 'Firma profilini görüntüleme'),
      I('firma.duzenle', 'Firma iletişim bilgilerini düzenleme'),
      I('firma.yetkililer', 'Diğer firma yetkililerini görüntüleme'),
    ],
  },
]

export const FIRMA_TUM_IZINLER: string[] = FIRMA_IZINLERI.flatMap((m) => m.izinler.map((i) => i.key))

/**
 * Firma kapsamlı izin denetimi — UI katmanı yardımcısı.
 * Zorunlu: backend her API isteğinde aynı kontrolü üyelik tablosundan tekrarlar;
 * burada yalnızca arayüz gösterimi yapılır.
 */
export const fIzinVar = (y: FirmaYetkili | undefined, key: string): boolean => {
  if (!y || y.durum !== 'Aktif') return false
  const iz = y.izinler
  if (iz.includes('*')) return true
  const [modul] = key.split('.')
  return iz.includes(key) || iz.includes(`${modul}.*`)
}

export const yetkiliDurumRenk: Record<YetkiliDurum, string> = {
  Aktif: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'Davet Bekliyor': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Askıda: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  Pasif: 'bg-zinc-500/10 text-zinc-500',
}

const gecmis = (islem: string, tarih = TODAY) => [{ tarih, islem }]

export const firmaYetkiliSeed: FirmaYetkili[] = [
  {
    id: 'FY-01',
    firmaId: 'FR-01',
    ad: 'Özlem',
    soyad: 'Karaca',
    eposta: 'o.karaca@akdenizmetal.com.tr',
    telefon: '0532 445 90 12',
    gorev: 'İnsan Kaynakları Müdürü',
    kullaniciAdi: 'okaraca',
    sifreHash: DEMO_SIFRE_OZETI, // demo: okaraca / 123456
    durum: 'Aktif',
    sonGiris: '2026-11-03T14:20:00',
    oturumlar: [
      { id: 'OT-fy1', cihaz: 'Chrome · Windows', ip: '88.240.55.10', tarih: '2026-11-03T14:20:00' },
    ],
    izinler: ['*'],
    olusturma: '2026-09-15',
    islemGecmisi: [
      ...gecmis('Firma yetkilisi hesabı oluşturuldu', '2026-09-15'),
      { tarih: '2026-10-20', islem: 'Tüm firma izinleri tanımlandı' },
    ],
  },
  {
    id: 'FY-02',
    firmaId: 'FR-02',
    ad: 'Burak',
    soyad: 'Yıldız',
    eposta: 'b.yildiz@teknikbakim.com.tr',
    telefon: '0542 610 34 78',
    gorev: 'Firma Sahibi',
    kullaniciAdi: 'byildiz',
    sifreHash: DEMO_SIFRE_OZETI, // demo: byildiz / 123456
    durum: 'Aktif',
    sonGiris: '2026-11-01T09:05:00',
    oturumlar: [
      { id: 'OT-fy2', cihaz: 'Safari · iPhone', ip: '85.105.22.90', tarih: '2026-11-01T09:05:00' },
    ],
    izinler: [
      'calisan.goruntule',
      'egitim.goruntule',
      'egitim.katilimci',
      'egitim.ilerleme',
      'sertifika.goruntule',
      'sertifika.pdf',
      'sertifika.dogrulama',
      'firma.goruntule',
      'firma.yetkililer',
    ],
    olusturma: '2026-06-05',
    islemGecmisi: [
      ...gecmis('Firma yetkilisi hesabı oluşturuldu', '2026-06-05'),
      { tarih: '2026-06-05', islem: 'Sınırlı izin seti tanımlandı' },
    ],
  },
  {
    id: 'FY-03',
    firmaId: 'FR-05',
    ad: 'Nazlı',
    soyad: 'Eren',
    eposta: 'n.eren@novagida.com.tr',
    telefon: '0541 335 67 20',
    gorev: 'İnsan Kaynakları Personeli',
    kullaniciAdi: 'neren',
    davetToken: 'dvt-fy-nazli-demo',
    davetBitis: new Date(Date.now() + 7 * 86400000).toISOString(),
    durum: 'Davet Bekliyor',
    oturumlar: [],
    izinler: ['calisan.goruntule', 'calisan.olustur', 'egitim.goruntule', 'firma.goruntule'],
    olusturma: '2026-10-30',
    islemGecmisi: gecmis('Davet bağlantısı oluşturuldu', '2026-10-30'),
  },
]
