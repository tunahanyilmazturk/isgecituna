/**
 * Merkezi izin kataloğu — sabit ve benzersiz permission key'leri.
 * Kullanıcı bazlıdır; sabit rol sistemi YOK. Rol şablonları yalnızca
 * ilk izin setini önermek için kullanılır, sonrasında serbestçe düzenlenir.
 *
 * Yetki denetimi backend/API katmanında da zorunlu olarak tekrarlanmalıdır;
 * buradaki yapı arayüz görünürlüğünü ve servis katmanını yönetir.
 */

export interface IzinDef {
  k: string // 'goruntule' → key: `${modul}.${k}`
  label: string
}

export interface ModulDef {
  key: string
  label: string
  izinler: IzinDef[]
  /** Firma/kayıt kapsamı seçimi sunulsun mu */
  kapsam?: boolean
}

const I = (k: string, label: string): IzinDef => ({ k, label })

/** Ortak CRUD izinleri */
const CRUD = [
  I('goruntule', 'Listeleme'),
  I('detay', 'Detay görüntüleme'),
  I('olustur', 'Oluşturma'),
  I('duzenle', 'Düzenleme'),
  I('sil', 'Silme'),
  I('aktar', 'Dışa aktarma'),
]

export const IZIN_MODULLERI: ModulDef[] = [
  {
    key: 'genel',
    label: 'Genel Bakış & İstatistikler',
    izinler: [I('goruntule', 'Görüntüleme'), I('aktar', 'Dışa aktarma')],
  },
  {
    key: 'firmalar',
    label: 'Firmalar',
    kapsam: true,
    izinler: [
      ...CRUD,
      I('pasife-al', 'Pasife alma'),
      I('yazdir', 'Yazdırma'),
      I('hassas', 'Hassas bilgileri görüntüleme (vergi no, sözleşme)'),
    ],
  },
  {
    key: 'ekip',
    label: 'Ekip',
    izinler: [
      ...CRUD,
      I('pasife-al', 'Pasife alma'),
      I('hassas', 'Hassas bilgileri görüntüleme (TC, sağlık)'),
      I('hesap-yonet', 'Kullanıcı hesabı yönetme'),
    ],
  },
  {
    key: 'personeller',
    label: 'Personeller (Müşteri Çalışanları)',
    kapsam: true,
    izinler: [
      ...CRUD,
      I('pasife-al', 'Pasife alma'),
      I('hesap-yonet', 'Kullanıcı hesabı yönetme'),
      I('toplu-olustur', 'Toplu personel ve hesap oluşturma'),
      I('hassas', 'Hassas bilgileri görüntüleme (TC)'),
    ],
  },
  {
    key: 'teklifler',
    label: 'Teklifler',
    kapsam: true,
    izinler: [...CRUD, I('onayla', 'Teklif onaylama / reddetme'), I('yazdir', 'Yazdırma')],
  },
  {
    key: 'testler',
    label: 'Testler',
    izinler: [...CRUD, I('fiyat-degistir', 'Fiyat değiştirme')],
  },
  {
    key: 'test-paketleri',
    label: 'Test Paketleri',
    izinler: [...CRUD],
  },
  {
    key: 'ekipmanlar',
    label: 'Ekipmanlar',
    izinler: [...CRUD, I('kalibrasyon-kaydet', 'Kalibrasyon kaydı girme')],
  },
  {
    key: 'taramalar',
    label: 'Taramalar',
    kapsam: true,
    izinler: [
      ...CRUD,
      I('iptal', 'Tarama iptal etme'),
      I('sonuc-gir', 'Muayene sonucu girme'),
      I('hassas', 'Sağlık sonuçlarını görüntüleme'),
    ],
  },
  {
    key: 'takvim',
    label: 'Takvim',
    izinler: [I('goruntule', 'Görüntüleme')],
  },
  {
    key: 'raporlar',
    label: 'Raporlar',
    izinler: [I('goruntule', 'Görüntüleme'), I('aktar', 'Dışa aktarma'), I('yazdir', 'Yazdırma')],
  },
  {
    key: 'ayarlar',
    label: 'Ayarlar',
    izinler: [
      I('goruntule', 'Görüntüleme'),
      I('duzenle', 'Ayarları düzenleme'),
      I('kullanici-yonet', 'Kullanıcı yönetimi'),
      I('izin-yonet', 'İzin yönetimi'),
      I('tanim-yonet', 'Tanım/katalog yönetimi'),
      I('entegrasyon', 'Entegrasyon yönetimi'),
      I('gecmis', 'İşlem geçmişi görüntüleme'),
    ],
  },
]

export const TUM_IZINLER = IZIN_MODULLERI.flatMap((m) =>
  m.izinler.map((i) => `${m.key}.${i.k}`),
)

export const izinKey = (modul: string, izin: string) => `${modul}.${izin}`

export const izinLabel = (key: string) => {
  const [m, i] = key.split('.')
  const mod = IZIN_MODULLERI.find((x) => x.key === m)
  return `${mod?.label ?? m} · ${mod?.izinler.find((x) => x.k === i)?.label ?? i}`
}

/* ------------------------------ Erişim kapsamı ----------------------------- */

export type KapsamTipi = 'tumu' | 'atanmis' | 'secili' | 'kendi'

export const KAPSAM_SECENEKLERI: { key: KapsamTipi; label: string }[] = [
  { key: 'tumu', label: 'Tüm firmalar' },
  { key: 'atanmis', label: 'Atanmış firmalar' },
  { key: 'secili', label: 'Seçilmiş firmalar' },
  { key: 'kendi', label: 'Yalnızca kendi kayıtları' },
]

export interface ModulKapsam {
  tip: KapsamTipi
  firmalar?: string[] // 'secili' ise firma id listesi
}

export type KapsamHarita = Record<string, ModulKapsam>

export const kapsamLabel = (k?: ModulKapsam) => {
  if (!k) return 'Tüm firmalar'
  const t = KAPSAM_SECENEKLERI.find((x) => x.key === k.tip)
  return k.tip === 'secili' && k.firmalar?.length
    ? `${k.firmalar.length} firma seçili`
    : (t?.label ?? 'Tüm firmalar')
}
