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

export const IZIN_MODULLERI: ModulDef[] = [
  {
    key: 'genel',
    label: 'Dashboard',
    izinler: [I('goruntule', 'Görüntüleme'), I('aktar', 'Dışa aktarma')],
  },
  {
    key: 'firmalar',
    label: 'Firmalar',
    kapsam: true,
    izinler: [
      I('goruntule', 'Listeleme'),
      I('detay', 'Detay görüntüleme'),
      I('olustur', 'Oluşturma'),
      I('duzenle', 'Düzenleme'),
      I('pasife-al', 'Pasife alma'),
      I('aktar', 'Dışa aktarma'),
      I('yazdir', 'Yazdırma'),
      I('toplu-islem', 'Toplu işlem'),
      I('hassas', 'Hassas bilgileri görüntüleme (vergi, SGK)'),
    ],
  },
  {
    key: 'ekip',
    label: 'Ekip & Personel',
    izinler: [
      I('goruntule', 'Listeleme'),
      I('detay', 'Detay görüntüleme'),
      I('olustur', 'Oluşturma'),
      I('duzenle', 'Düzenleme'),
      I('pasife-al', 'Pasife alma'),
      I('aktar', 'Dışa aktarma'),
      I('hassas', 'Hassas bilgileri görüntüleme (TC, sağlık)'),
      I('hesap-yonet', 'Kullanıcı hesabı yönetme'),
    ],
  },
  {
    key: 'personeller',
    label: 'Personeller (Müşteri Çalışanları)',
    kapsam: true,
    izinler: [
      I('goruntule', 'Listeleme'),
      I('detay', 'Detay görüntüleme'),
      I('olustur', 'Oluşturma'),
      I('duzenle', 'Düzenleme'),
      I('pasife-al', 'Pasife alma'),
      I('hesap-yonet', 'Kullanıcı hesabı yönetme'),
      I('toplu-olustur', 'Toplu personel ve hesap oluşturma'),
      I('aktar', 'Dışa aktarma'),
      I('hassas', 'Hassas bilgileri görüntüleme (TC)'),
    ],
  },
  {
    key: 'gorevlendirmeler',
    label: 'Görevlendirmeler',
    kapsam: true,
    izinler: [
      I('goruntule', 'Görüntüleme'),
      I('olustur', 'Oluşturma'),
      I('duzenle', 'Düzenleme'),
      I('sonlandir', 'Sonlandırma'),
      I('aktar', 'Raporları dışa aktarma'),
    ],
  },
  {
    key: 'olaylar',
    label: 'Olay Bildirimleri',
    kapsam: true,
    izinler: [
      I('goruntule', 'Listeleme'),
      I('detay', 'Detay görüntüleme'),
      I('olustur', 'Oluşturma'),
      I('duzenle', 'Düzenleme'),
      I('sil', 'Silme'),
      I('ata', 'Sorumlu atama'),
      I('kapat', 'Olayı kapatma'),
      I('aktar', 'Dışa aktarma'),
      I('toplu-islem', 'Toplu işlem'),
      I('hassas', 'Hassas bilgileri görüntüleme (TC, sağlık)'),
    ],
  },
  {
    key: 'saglik-taramalari',
    label: 'Sağlık Taramaları',
    kapsam: true,
    izinler: [
      I('goruntule', 'Görüntüleme'),
      I('olustur', 'Oluşturma'),
      I('duzenle', 'Düzenleme'),
      I('hassas', 'Hassas bilgileri görüntüleme'),
    ],
  },
  {
    key: 'muayene',
    label: 'Muayene',
    kapsam: true,
    izinler: [
      I('goruntule', 'Görüntüleme'),
      I('olustur', 'Oluşturma'),
      I('duzenle', 'Düzenleme'),
      I('hassas', 'Hassas bilgileri görüntüleme'),
    ],
  },
  {
    key: 'egitimler',
    label: 'Eğitimler',
    izinler: [
      I('goruntule', 'Görüntüleme'),
      I('onizle', 'Önizleme (oynatıcı)'),
      I('olustur', 'Oluşturma'),
      I('duzenle', 'Düzenleme'),
      I('yayinla', 'Yayınlama'),
      I('arsivle', 'Arşivleme'),
      I('sil', 'Silme'),
      I('icerik-yonet', 'İçerik yönetimi'),
      I('sinav-yonet', 'Sınav yönetimi'),
      I('surum-yonet', 'Sürüm yönetimi'),
      I('sonuc-gor', 'Sonuçları görüntüleme'),
      I('onay-yonet', 'Onayları yönetme'),
      I('ata', 'Atama'),
      I('aktar', 'Dışa aktarma'),
    ],
  },
  {
    key: 'risk',
    label: 'Risk Değerlendirme',
    kapsam: true,
    izinler: [
      I('goruntule', 'Değerlendirme ve aksiyon listeleme'),
      I('olustur', 'Değerlendirme oluşturma'),
      I('duzenle', 'Tehlike/aksiyon düzenleme'),
      I('sil', 'Kayıt silme (arşiv)'),
      I('onayla', 'Değerlendirme onaylama'),
      I('pdf', 'PDF rapor oluşturma'),
      I('yontem', 'Yöntem ve eşik yapılandırma'),
      I('aktar', 'Dışa aktarma'),
    ],
  },
  {
    key: 'sertifikalar',
    label: 'Sertifikalar',
    kapsam: true,
    izinler: [
      I('goruntule', 'Sertifika listeleme ve görüntüleme'),
      I('duzenle', 'Sertifika bilgilerini düzenleme'),
      I('onayla', 'Sertifika başvurusu onaylama'),
      I('reddet', 'Sertifika başvurusu reddetme'),
      I('iptal', 'Sertifika iptal etme'),
      I('sablon', 'Sertifika şablonu yönetimi'),
      I('pdf', 'PDF görüntüleme/indirme'),
      I('aktar', 'Dışa aktarma'),
    ],
  },
  {
    key: 'teklifler',
    label: 'Teklifler',
    izinler: [
      I('goruntule', 'Görüntüleme'),
      I('olustur', 'Oluşturma'),
      I('duzenle', 'Düzenleme'),
      I('onayla', 'Onaylama'),
      I('pdf', 'PDF oluşturma'),
      I('aktar', 'Dışa aktarma'),
    ],
  },
  {
    key: 'belgeler',
    label: 'Belgeler',
    izinler: [
      I('goruntule', 'Görüntüleme'),
      I('olustur', 'Yükleme'),
      I('duzenle', 'Düzenleme'),
      I('sil', 'Silme'),
      I('onayla', 'Onaylama'),
      I('aktar', 'İndirme'),
    ],
  },
  {
    key: 'isg-katip',
    label: 'İSG-KATİP',
    kapsam: true,
    izinler: [
      I('goruntule', 'Görüntüleme'),
      I('olustur', 'Oluşturma'),
      I('duzenle', 'Düzenleme'),
      I('gonder', 'Gönderme / bildirme'),
      I('aktar', 'Dışa aktarma'),
    ],
  },
  {
    key: 'ibys',
    label: 'İBYS',
    izinler: [I('goruntule', 'Görüntüleme'), I('gonder', 'Gönderme'), I('aktar', 'Dışa aktarma')],
  },
  {
    key: 'raporlar',
    label: 'Raporlar',
    izinler: [
      I('goruntule', 'Görüntüleme'),
      I('olustur', 'Oluşturma'),
      I('pdf', 'PDF oluşturma'),
      I('yazdir', 'Yazdırma'),
      I('aktar', 'Dışa aktarma'),
    ],
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
