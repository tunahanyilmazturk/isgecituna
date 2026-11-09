/* Sağlık hizmetleri modülleri — teklif, test, ekipman ve tarama kayıt tipleri ile demo verisi. */

const yerelIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Bugünün yerel tarihi (YYYY-MM-DD) */
export const BUGUN = yerelIso(new Date())

/** Bugünden n gün kaydırılmış yerel tarih */
export const gunEkle = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return yerelIso(d)
}

// ---------- Teklif ----------

export const HIZMET_TURLERI = [
  'İşe giriş taraması',
  'Periyodik muayene',
  'Odyometri',
  'Spirometri',
  'Paket tarama',
] as const

export const TEKLIF_DURUMLARI = ['Taslak', 'Gönderildi', 'Onaylandı', 'Reddedildi'] as const
export type TeklifDurum = (typeof TEKLIF_DURUMLARI)[number]

export interface Teklif {
  id: string
  no: string
  firma: string
  hizmet: string
  kisiSayisi: number
  /** Kişi başı birim fiyat (TL) */
  birimFiyat: number
  tarih: string
  gecerlilik: string
  durum: TeklifDurum
  /** Otomatik oluşturulan teklif başlığı: firma · tür · tarih */
  baslik?: string
  /** Kullanılan test paketinin adı (sihirbazdan oluşturulduysa) */
  paketAdi?: string
  /** Kişi başı fiyata uygulanan iskonto (%) */
  iskontoYuzde?: number
  /** Kalem toplamı üzerinden uygulanan indirim tutarı (TL) */
  indirimTutar?: number
  /** İndirim sonrası toplam, KDV hariç (TL) */
  netToplam?: number
  /** KDV dahil genel toplam (TL) */
  genelToplam?: number
  notlar?: string
  /** Teklif kalemleri: test, kişi başı fiyat ve miktar */
  kalemler?: { testId: string; ad: string; birim: number; miktar: number }[]
  /** KDV oranı (%) */
  kdvOrani?: number
  /** Ödeme koşulu (ODEME_KOSULLARI) */
  odemeKosulu?: string
  /** Durum ve geçerlilik değişikliklerinin kronolojik kaydı (ISO zaman, olay) */
  gecmis?: { tarih: string; olay: string }[]
  /** Teklif ön yazısı (metin) */
  onYazi?: string
  /** Şartlar ve koşullar maddeleri */
  sartlar?: string[]
}

export const ODEME_KOSULLARI = [
  'Peşin',
  '15 gün vadeli',
  '30 gün vadeli',
  '45 gün vadeli',
  'Tarama sonrası 30 gün vadeli',
  '%50 avans, kalanı tarama sonrası',
] as const

/** Kişi başı fiyat × kişi sayısı (KDV hariç, indirim sonrası) */
export const teklifTutari = (t: Pick<Teklif, 'kisiSayisi' | 'birimFiyat'>) => t.kisiSayisi * t.birimFiyat

/** KDV dahil genel toplam; kayıtta saklanmamışsa eski kayıtlar için hesaplanır */
export const teklifKdvDahil = (t: Pick<Teklif, 'kisiSayisi' | 'birimFiyat' | 'kdvOrani' | 'genelToplam'>) =>
  t.genelToplam ?? Math.round(teklifTutari(t) * (1 + (t.kdvOrani ?? 20) / 100))

/** KDV hariç net toplam; kayıtta saklanmamışsa eski kayıtlar için hesaplanır */
export const teklifNet = (t: Pick<Teklif, 'kisiSayisi' | 'birimFiyat' | 'netToplam'>) => t.netToplam ?? teklifTutari(t)

/**
 * Kalemlerden tutarları yeniden hesaplar. İndirim yüzdesi korunur; kalem değişince
 * indirim tutarı, net, KDV dahil toplam ve kişi başı fiyat birlikte güncellenir.
 */
export function teklifToplamlariHesapla(p: {
  kalemler: { birim: number; miktar: number }[]
  iskontoYuzde?: number
  kdvOrani?: number
  kisiSayisi: number
}) {
  const kalemToplam = p.kalemler.reduce((s, k) => s + k.birim * k.miktar, 0)
  const indirimTutar = Math.round(((kalemToplam * (p.iskontoYuzde ?? 0)) / 100) * 100) / 100
  const netToplam = Math.round((kalemToplam - indirimTutar) * 100) / 100
  const genelToplam = Math.round(netToplam * (1 + (p.kdvOrani ?? 20) / 100))
  const birimFiyat = Math.round(netToplam / Math.max(1, p.kisiSayisi))
  return { kalemToplam, indirimTutar, netToplam, genelToplam, birimFiyat }
}

// ---------- Test ----------

export const TEST_KATEGORILERI = [
  'Laboratuvar',
  'Ölçüm',
  'Solunum',
  'İşitme',
  'Göz',
  'Fizik muayene',
  'Görüntüleme',
] as const

export interface Test {
  id: string
  ad: string
  kategori: string
  birim: string
  referans: string
  fiyat: number
  durum: 'Aktif' | 'Pasif'
}

// ---------- Ekipman ----------

export const EKIPMAN_TURLERI = [
  'Tansiyon ölçer',
  'Odyometre',
  'Spirometre',
  'EKG cihazı',
  'Boy-kilo ölçer',
  'Göz muayene seti',
  'Diğer',
] as const

export const EKIPMAN_DURUMLARI = ['Hazır', 'Sahada', 'Bakımda', 'Arızalı'] as const
export type EkipmanDurum = (typeof EKIPMAN_DURUMLARI)[number]

export interface Ekipman {
  id: string
  ad: string
  tur: string
  seriNo: string
  /** Kalibrasyon bitiş tarihi (ISO) */
  kalibrasyonBitis: string
  durum: EkipmanDurum
  konum: string
}

// ---------- Tarama ----------

export const TARAMA_DURUMLARI = ['Planlandı', 'Devam ediyor', 'Tamamlandı', 'İptal'] as const
export type TaramaDurum = (typeof TARAMA_DURUMLARI)[number]

export interface Tarama {
  id: string
  firma: string
  hizmet: string
  /** Tarama başlangıç tarihi (ISO) */
  tarih: string
  saat: string
  /** Tarama bitiş tarihi (ISO); eski kayıtlarda yoksa başlangıçla aynıdır */
  bitisTarih?: string
  /** Tarama bitiş saati (SS:DD); eski kayıtlarda yoksa tanımsızdır */
  bitisSaat?: string
  lokasyon: string
  /** Saha ekibi üyelerinin adları (ekip modülünden seçilen üyeler, virgülle ayrılmış) */
  ekip: string
  /** Saha ekibi üyelerinin kimlikleri (ekip modülü) */
  ekipUyeIdleri?: string[]
  /** Tarama ön yazısı (metin); paragraflar boş satırla ayrılır */
  onYazi?: string
  kisiSayisi: number
  tamamlanan: number
  durum: TaramaDurum
  /** Taramanın planlandığı onaylı teklif (varsa) */
  teklifId?: string
  /** Taramaya dahil edilen firma personelinin kimlikleri */
  personelIdleri?: string[]
  /** Yapılacak testler: test, birim fiyat ve miktar */
  kalemler?: { testId: string; ad: string; birim: number; miktar: number }[]
  /** Kalem toplamına uygulanan indirim (%) ve tutarı (TL) */
  iskontoYuzde?: number
  indirimTutar?: number
  /** KDV oranı (%), indirim sonrası net toplam ve KDV dahil genel toplam (TL) */
  kdvOrani?: number
  netToplam?: number
  genelToplam?: number
  notlar?: string
  /** Saha iş listesi: hazırlık maddeleri, ekip katılımı ve test başına yapılan kişi sayısı */
  isListesi?: TaramaIsListesi
  /** Durum ve ilerleme değişikliklerinin kronolojik kaydı */
  gecmis?: { tarih: string; olay: string }[]
}

/** İş listesi hazırlık maddeleri (sahaya çıkmadan önce kontrol edilir) */
export const ISLISTESI_HAZIRLIK = [
  { k: 'konum', e: 'Mobil ünite park alanına yanaştırıldı' },
  { k: 'enerji', e: 'Elektrik ve su bağlantısı hazır' },
  { k: 'oda', e: 'Muayene ve görüşme alanı (gizlilik) hazır' },
  { k: 'liste', e: 'Çalışan listesi ve kimlik kontrolü hazır' },
  { k: 'cihaz', e: 'Cihazlar kontrol edildi, kalibrasyonu geçerli' },
  { k: 'aclik', e: 'Kan alımı için açlık bilgilendirmesi yapıldı' },
] as const

/** Saha iş listesi durumu: maddeler, katılım ve test başına yapılan kişi sayısı */
export interface TaramaIsListesi {
  /** Hazırlık maddesi anahtarı → tamamlandı */
  hazirlik: Record<string, boolean>
  /** Ekip üyesi kimliği → sahada katıldı */
  katilim: Record<string, boolean>
  /** Test kimliği → yapılan kişi sayısı */
  yapilan: Record<string, number>
}

/** Saha ekipleri; tarama planında seçilir */
export const TARAMA_EKIPLERI = ['Ekip 1', 'Ekip 2'] as const

// ---------- Demo verisi ----------

export const testSeed: Test[] = [
  { id: 'TST-01', ad: 'Tam kan sayımı', kategori: 'Laboratuvar', birim: '—', referans: 'Yaşa göre', fiyat: 180, durum: 'Aktif' },
  { id: 'TST-02', ad: 'Kan şekeri (açlık)', kategori: 'Laboratuvar', birim: 'mg/dL', referans: '70 – 100', fiyat: 90, durum: 'Aktif' },
  { id: 'TST-03', ad: 'Tansiyon ölçümü', kategori: 'Ölçüm', birim: 'mmHg', referans: '< 120 / 80', fiyat: 40, durum: 'Aktif' },
  { id: 'TST-04', ad: 'Vücut kitle indeksi', kategori: 'Ölçüm', birim: 'kg/m²', referans: '18.5 – 24.9', fiyat: 30, durum: 'Aktif' },
  { id: 'TST-05', ad: 'Saf ton odyometri', kategori: 'İşitme', birim: 'dB HL', referans: '≤ 25 dB', fiyat: 260, durum: 'Aktif' },
  { id: 'TST-06', ad: 'Spirometri', kategori: 'Solunum', birim: 'L / %', referans: 'FEV1 > %80', fiyat: 220, durum: 'Aktif' },
  { id: 'TST-07', ad: 'Göz keskinliği', kategori: 'Göz', birim: '—', referans: '10 / 10', fiyat: 50, durum: 'Aktif' },
  { id: 'TST-08', ad: 'Elektrokardiyografi (EKG)', kategori: 'Görüntüleme', birim: '—', referans: 'Normal sinüs ritmi', fiyat: 210, durum: 'Pasif' },
]

export const ekipmanSeed: Ekipman[] = [
  { id: 'EKP-01', ad: 'Dijital tansiyon ölçer A1', tur: 'Tansiyon ölçer', seriNo: 'TA-20231', kalibrasyonBitis: gunEkle(12), durum: 'Sahada', konum: 'Ekip 1' },
  { id: 'EKP-02', ad: 'Klinik odyometre OD-500', tur: 'Odyometre', seriNo: 'OD-40872', kalibrasyonBitis: gunEkle(96), durum: 'Hazır', konum: 'Merkez depo' },
  { id: 'EKP-03', ad: 'Spirometre SP-Pro', tur: 'Spirometre', seriNo: 'SP-11034', kalibrasyonBitis: gunEkle(-4), durum: 'Bakımda', konum: 'Servis' },
  { id: 'EKP-04', ad: '12 kanal EKG cihazı', tur: 'EKG cihazı', seriNo: 'EKG-7781', kalibrasyonBitis: gunEkle(40), durum: 'Sahada', konum: 'Ekip 2' },
  { id: 'EKP-05', ad: 'Boy-kilo ölçer seti', tur: 'Boy-kilo ölçer', seriNo: 'BK-2290', kalibrasyonBitis: gunEkle(180), durum: 'Hazır', konum: 'Merkez depo' },
  { id: 'EKP-06', ad: 'Göz muayene seti', tur: 'Göz muayene seti', seriNo: 'GM-0456', kalibrasyonBitis: gunEkle(25), durum: 'Arızalı', konum: 'Servis' },
]

/** Demo kayıtlarındaki saha ekibi üyeleri: ekip modülü kimliği → görünen ad (wizard ile aynı biçim) */
const EKIP_AD: Record<string, string> = {
  'EKP-U01': 'Uzm. Tunahan Yılmaztürk',
  'EKP-U02': 'Dr. Selin Aydemir',
  'EKP-U03': 'Hemşire Ayşe Kaya',
  'EKP-U04': 'Murat Özkan',
  'EKP-U06': 'Emre Şahin',
}
const ekipAlani = (ids: string[]) => ({ ekipUyeIdleri: ids, ekip: ids.map((id) => EKIP_AD[id]).join(', ') })

/** Test kimliklerinden kalem listesi: birim fiyat test kartından, miktar kişi sayısından */
const kalemleriOlustur = (testIdleri: string[], kisi: number) =>
  testIdleri.map((id) => {
    const t = testSeed.find((x) => x.id === id)
    return { testId: id, ad: t?.ad ?? id, birim: t?.fiyat ?? 0, miktar: kisi }
  })

/** Mobil sağlık taraması ön yazısı (kurum adı metne yazılmaz; PDF ve imza bloğunda eklenir) */
const onYaziMetni = (o: { yetkili: string; firmaKisa: string; hizmet: string; tarihMetni: string; lokasyon: string; kisi: number; saat: string; ekip: string; testler: string[] }) =>
  [
    `Sayın ${o.yetkili},`,
    `Hizmet sağlayıcı olarak ${o.firmaKisa} çalışanlarına yönelik ${o.hizmet} kapsamındaki mobil sağlık taramasını ${o.tarihMetni}, ${o.lokasyon} konumunda gerçekleştirmek üzere hazırlandık.`,
    `Taramalar ${o.saat} saatleri arasında, ${o.kisi} çalışan için planlanmıştır. Saha ekibimiz (${o.ekip}) taramayı yürütecektir.`,
    'Mobil ünitemiz, çalışanların iş akışını aksatmadan tarama yapabilmesi için sahada hızlı ve gizlilik ilkelerine uygun bir süreç işletir. Her bulgu hekim değerlendirmesiyle sonuçlandırılır.',
    `Taramada şu testler uygulanacaktır: ${o.testler.join(', ')}.`,
    'Sorularınız için bizimle iletişime geçmekten memnuniyet duyarız.',
    'Saygılarımızla,',
  ].join('\n\n')

/** Teklif kaydı: kalemler ve tutarlar birlikte hesaplanır */
const teklifKaydi = (o: {
  id: string
  no: string
  firma: string
  hizmet: string
  kisi: number
  testIdleri: string[]
  tarih: string
  gecerlilik: string
  durum: TeklifDurum
  iskonto: number
  odemeKosulu: string
  paketAdi?: string
  onYazi: string
  sartlar: string[]
  notlar?: string
  gecmis: { tarih: string; olay: string }[]
}): Teklif => {
  const kalemler = kalemleriOlustur(o.testIdleri, o.kisi)
  const t = teklifToplamlariHesapla({ kalemler, iskontoYuzde: o.iskonto, kdvOrani: 20, kisiSayisi: o.kisi })
  return {
    id: o.id,
    no: o.no,
    firma: o.firma,
    hizmet: o.hizmet,
    kisiSayisi: o.kisi,
    birimFiyat: t.birimFiyat,
    tarih: o.tarih,
    gecerlilik: o.gecerlilik,
    durum: o.durum,
    baslik: `${o.firma} · ${o.hizmet} teklifi`,
    paketAdi: o.paketAdi,
    iskontoYuzde: o.iskonto || undefined,
    indirimTutar: t.indirimTutar,
    netToplam: t.netToplam,
    genelToplam: t.genelToplam,
    kdvOrani: 20,
    odemeKosulu: o.odemeKosulu,
    kalemler,
    notlar: o.notlar,
    onYazi: o.onYazi,
    sartlar: o.sartlar,
    gecmis: o.gecmis,
  }
}

const SARTLAR_STANDART = [
  'Teklif kapsamındaki muayene ve testler, firmanın belirlediği tarihlerde ve kabul edilen lokasyonda yapılır.',
  'Fatura, tarama tamamlandıktan sonra düzenlenir; ödeme koşulu teklifte belirtilen şekilde uygulanır.',
  'Tarama sonuçları kişi bazında hazırlanır ve tarama tarihinden sonra 5 iş günü içinde firma yetkilisine iletilir.',
  'Teklifte yer almayan ek testler ayrı teklif ile fiyatlandırılır.',
]

export const teklifSeed: Teklif[] = [
  teklifKaydi({
    id: 'TKL-01',
    no: 'TKL-2026-001',
    firma: 'Akdeniz Metal San. ve Tic. A.Ş.',
    hizmet: 'Periyodik muayene',
    kisi: 120,
    testIdleri: ['TST-01', 'TST-02', 'TST-03', 'TST-04', 'TST-07'],
    tarih: gunEkle(-21),
    gecerlilik: gunEkle(9),
    durum: 'Onaylandı',
    iskonto: 5,
    odemeKosulu: '30 gün vadeli',
    paketAdi: 'Periyodik muayene paketi',
    onYazi: onYaziMetni({ yetkili: 'Nurcan Aksoy', firmaKisa: 'Akdeniz Metal', hizmet: 'periyodik muayene', tarihMetni: 'Kasım ayı içinde', lokasyon: 'Fabrika A ve B blok', kisi: 120, saat: '09:00–17:00', ekip: 'Uzm. Tunahan Yılmaztürk, Dr. Selin Aydemir', testler: ['Tam kan sayımı', 'Kan şekeri (açlık)', 'Tansiyon ölçümü', 'Vücut kitle indeksi', 'Göz keskinliği'] }),
    sartlar: SARTLAR_STANDART,
    notlar: 'Periyodik muayene sonuçları işyeri hekimi onayı ile tamamlanır.',
    gecmis: [
      { tarih: `${gunEkle(-21)}T10:00:00`, olay: 'Teklif oluşturuldu' },
      { tarih: `${gunEkle(-18)}T14:20:00`, olay: 'Durum: Onaylandı' },
    ],
  }),
  teklifKaydi({
    id: 'TKL-02',
    no: 'TKL-2026-002',
    firma: 'Ege Lojistik Ltd. Şti.',
    hizmet: 'İşe giriş taraması',
    kisi: 45,
    testIdleri: ['TST-01', 'TST-02', 'TST-03', 'TST-04', 'TST-07'],
    tarih: gunEkle(-6),
    gecerlilik: gunEkle(24),
    durum: 'Gönderildi',
    iskonto: 0,
    odemeKosulu: '15 gün vadeli',
    onYazi: onYaziMetni({ yetkili: 'Hakan Demirtaş', firmaKisa: 'Ege Lojistik', hizmet: 'işe giriş taraması', tarihMetni: 'yeni alımlar için belirlenecek tarihlerde', lokasyon: 'Aliağa depo', kisi: 45, saat: '09:00–17:00', ekip: 'Hemşire Ayşe Kaya, Murat Özkan', testler: ['Tam kan sayımı', 'Kan şekeri (açlık)', 'Tansiyon ölçümü', 'Vücut kitle indeksi', 'Göz keskinliği'] }),
    sartlar: SARTLAR_STANDART,
    gecmis: [
      { tarih: `${gunEkle(-6)}T09:15:00`, olay: 'Teklif oluşturuldu' },
      { tarih: `${gunEkle(-5)}T11:00:00`, olay: 'Durum: Gönderildi' },
    ],
  }),
  teklifKaydi({
    id: 'TKL-03',
    no: 'TKL-2026-003',
    firma: 'Marmara Tekstil A.Ş.',
    hizmet: 'Paket tarama',
    kisi: 80,
    testIdleri: ['TST-01', 'TST-02', 'TST-03', 'TST-04', 'TST-05', 'TST-06', 'TST-07'],
    tarih: gunEkle(-3),
    gecerlilik: gunEkle(27),
    durum: 'Taslak',
    iskonto: 10,
    odemeKosulu: 'Tarama sonrası 30 gün vadeli',
    paketAdi: 'Kapsamlı paket tarama',
    onYazi: onYaziMetni({ yetkili: 'Gülay Tunç', firmaKisa: 'Marmara Tekstil', hizmet: 'paket tarama', tarihMetni: 'planlanacak tarihlerde', lokasyon: 'Çerkezköy üretim tesisi', kisi: 80, saat: '08:30–16:30', ekip: 'Dr. Selin Aydemir, Emre Şahin', testler: ['Tam kan sayımı', 'Kan şekeri (açlık)', 'Tansiyon ölçümü', 'Vücut kitle indeksi', 'Saf ton odyometri', 'Spirometri', 'Göz keskinliği'] }),
    sartlar: SARTLAR_STANDART,
    notlar: 'Taslak teklif; fiyatlar firma yetkilisi onayından sonra kesinleşir.',
    gecmis: [{ tarih: `${gunEkle(-3)}T16:40:00`, olay: 'Teklif oluşturuldu' }],
  }),
  teklifKaydi({
    id: 'TKL-04',
    no: 'TKL-2026-004',
    firma: 'Anadolu Gıda San. A.Ş.',
    hizmet: 'Odyometri',
    kisi: 30,
    testIdleri: ['TST-05', 'TST-03'],
    tarih: gunEkle(-40),
    gecerlilik: gunEkle(-10),
    durum: 'Reddedildi',
    iskonto: 0,
    odemeKosulu: '30 gün vadeli',
    onYazi: onYaziMetni({ yetkili: 'Serkan Yalçın', firmaKisa: 'Anadolu Gıda', hizmet: 'odyometri', tarihMetni: 'belirlenecek tarihte', lokasyon: 'Gebze tesis', kisi: 30, saat: '09:00–15:00', ekip: 'Emre Şahin', testler: ['Saf ton odyometri', 'Tansiyon ölçümü'] }),
    sartlar: SARTLAR_STANDART,
    notlar: 'Firma fiyatı yüksek bulduğunu bildirdi.',
    gecmis: [
      { tarih: `${gunEkle(-40)}T10:30:00`, olay: 'Teklif oluşturuldu' },
      { tarih: `${gunEkle(-12)}T15:10:00`, olay: 'Durum: Reddedildi' },
    ],
  }),
]

/** Tarama kaydı: teklif, ekip, testler ve tutarlar birlikte hesaplanır */
const taramaKaydi = (o: {
  id: string
  firma: string
  firmaKisa: string
  yetkili: string
  hizmet: string
  tarih: string
  bitisTarih?: string
  saat: string
  bitisSaat: string
  lokasyon: string
  kisi: number
  tamamlanan: number
  durum: TaramaDurum
  teklifId?: string
  ekipIds: string[]
  testIdleri: string[]
  iskonto: number
  notlar: string[]
  tarihMetni: string
}): Tarama => {
  const kalemler = kalemleriOlustur(o.testIdleri, o.kisi)
  const t = teklifToplamlariHesapla({ kalemler, iskontoYuzde: o.iskonto, kdvOrani: 20, kisiSayisi: o.kisi })
  const ekip = ekipAlani(o.ekipIds)
  return {
    id: o.id,
    firma: o.firma,
    hizmet: o.hizmet,
    tarih: o.tarih,
    saat: o.saat,
    bitisTarih: o.bitisTarih ?? o.tarih,
    bitisSaat: o.bitisSaat,
    lokasyon: o.lokasyon,
    ...ekip,
    onYazi: onYaziMetni({
      yetkili: o.yetkili,
      firmaKisa: o.firmaKisa,
      hizmet: o.hizmet.toLocaleLowerCase('tr'),
      tarihMetni: o.tarihMetni,
      lokasyon: o.lokasyon,
      kisi: o.kisi,
      saat: `${o.saat}–${o.bitisSaat}`,
      ekip: ekip.ekip,
      testler: kalemler.map((k) => k.ad),
    }),
    kisiSayisi: o.kisi,
    tamamlanan: o.tamamlanan,
    durum: o.durum,
    teklifId: o.teklifId,
    kalemler,
    iskontoYuzde: o.iskonto || undefined,
    indirimTutar: t.indirimTutar,
    kdvOrani: 20,
    netToplam: t.netToplam,
    genelToplam: t.genelToplam,
    notlar: o.notlar.join('\n'),
  }
}

export const taramaSeed: Tarama[] = [
  taramaKaydi({
    id: 'TRM-01',
    firma: 'Akdeniz Metal San. ve Tic. A.Ş.',
    firmaKisa: 'Akdeniz Metal',
    yetkili: 'Nurcan Aksoy',
    hizmet: 'Periyodik muayene',
    tarih: gunEkle(-14),
    saat: '09:00',
    bitisSaat: '17:00',
    lokasyon: 'Fabrika A blok',
    kisi: 60,
    tamamlanan: 60,
    durum: 'Tamamlandı',
    teklifId: 'TKL-01',
    ekipIds: ['EKP-U01', 'EKP-U02', 'EKP-U03', 'EKP-U04'],
    testIdleri: ['TST-01', 'TST-02', 'TST-03', 'TST-04', 'TST-07'],
    iskonto: 5,
    notlar: ['Mobil ünite düz ve güvenli bir park alanına yanaşmalı; giriş rampası ve yaya yolu boş tutulmalı.', 'Muayene ve görüşmeler için gizliliği sağlayan ayrı bir oda ya da paravan firma tarafından hazırlanmalı.'],
    tarihMetni: 'Ekim ayı içinde',
  }),
  taramaKaydi({
    id: 'TRM-02',
    firma: 'Akdeniz Metal San. ve Tic. A.Ş.',
    firmaKisa: 'Akdeniz Metal',
    yetkili: 'Nurcan Aksoy',
    hizmet: 'Periyodik muayene',
    tarih: gunEkle(-13),
    saat: '09:00',
    bitisSaat: '17:00',
    lokasyon: 'Fabrika B blok',
    kisi: 60,
    tamamlanan: 58,
    durum: 'Tamamlandı',
    teklifId: 'TKL-01',
    ekipIds: ['EKP-U02', 'EKP-U03', 'EKP-U06'],
    testIdleri: ['TST-01', 'TST-02', 'TST-03', 'TST-04', 'TST-07'],
    iskonto: 5,
    notlar: ['Kan alımı yapılacak çalışanlar tarama öncesi 8 saat açlık süresine uymalı, kullandıkları ilaçları bildirmeli.'],
    tarihMetni: 'Ekim ayı içinde',
  }),
  taramaKaydi({
    id: 'TRM-03',
    firma: 'Ege Lojistik Ltd. Şti.',
    firmaKisa: 'Ege Lojistik',
    yetkili: 'Hakan Demirtaş',
    hizmet: 'İşe giriş taraması',
    tarih: gunEkle(-2),
    saat: '10:30',
    bitisSaat: '16:30',
    lokasyon: 'Aliağa depo',
    kisi: 22,
    tamamlanan: 22,
    durum: 'Tamamlandı',
    teklifId: 'TKL-02',
    ekipIds: ['EKP-U03', 'EKP-U04'],
    testIdleri: ['TST-01', 'TST-02', 'TST-03', 'TST-04', 'TST-07'],
    iskonto: 0,
    notlar: ['Ünitenin elektrik (220 V) ve su bağlantısı tarama başlamadan önce firma yetkilisi tarafından sağlanmalı.'],
    tarihMetni: 'geçen hafta',
  }),
  taramaKaydi({
    id: 'TRM-04',
    firma: 'Marmara Tekstil A.Ş.',
    firmaKisa: 'Marmara Tekstil',
    yetkili: 'Gülay Tunç',
    hizmet: 'Paket tarama',
    tarih: gunEkle(0),
    saat: '08:30',
    bitisSaat: '16:30',
    lokasyon: 'Çerkezköy üretim',
    kisi: 40,
    tamamlanan: 17,
    durum: 'Devam ediyor',
    ekipIds: ['EKP-U02', 'EKP-U03', 'EKP-U04', 'EKP-U06'],
    testIdleri: ['TST-01', 'TST-02', 'TST-03', 'TST-04', 'TST-05', 'TST-06', 'TST-07'],
    iskonto: 0,
    notlar: ['Odyometri ve akciğer fonksiyon testleri için sakin, gürültüsüz bir ortam ayarlanmalı.', 'Çalışan listesi tarama gününden önce saha ekibine iletilmeli; kimlik kontrolü tarama girişinde yapılır.'],
    tarihMetni: 'bugün',
  }),
  taramaKaydi({
    id: 'TRM-05',
    firma: 'Akdeniz Metal San. ve Tic. A.Ş.',
    firmaKisa: 'Akdeniz Metal',
    yetkili: 'Nurcan Aksoy',
    hizmet: 'Odyometri',
    tarih: gunEkle(3),
    saat: '09:00',
    bitisSaat: '13:00',
    lokasyon: 'Fabrika A blok',
    kisi: 35,
    tamamlanan: 0,
    durum: 'Planlandı',
    ekipIds: ['EKP-U03', 'EKP-U06'],
    testIdleri: ['TST-05', 'TST-03'],
    iskonto: 0,
    notlar: ['Odyometri için sakin, gürültüsüz bir ortam ayarlanmalı.'],
    tarihMetni: 'üç gün sonra',
  }),
  taramaKaydi({
    id: 'TRM-06',
    firma: 'Anadolu Gıda San. A.Ş.',
    firmaKisa: 'Anadolu Gıda',
    yetkili: 'Serkan Yalçın',
    hizmet: 'Spirometri',
    tarih: gunEkle(6),
    saat: '11:00',
    bitisSaat: '16:00',
    lokasyon: 'Gebze tesis',
    kisi: 28,
    tamamlanan: 0,
    durum: 'Planlandı',
    ekipIds: ['EKP-U04', 'EKP-U06'],
    testIdleri: ['TST-06', 'TST-03', 'TST-04'],
    iskonto: 0,
    notlar: ['Akciğer fonksiyon testi için çalışanlar tarama öncesinde sigara kullanmamalı.'],
    tarihMetni: 'altı gün sonra',
  }),
  taramaKaydi({
    id: 'TRM-07',
    firma: 'Ege Lojistik Ltd. Şti.',
    firmaKisa: 'Ege Lojistik',
    yetkili: 'Hakan Demirtaş',
    hizmet: 'İşe giriş taraması',
    tarih: gunEkle(9),
    saat: '09:30',
    bitisSaat: '14:00',
    lokasyon: 'Aliağa depo',
    kisi: 18,
    tamamlanan: 0,
    durum: 'Planlandı',
    teklifId: 'TKL-02',
    ekipIds: ['EKP-U04', 'EKP-U06'],
    testIdleri: ['TST-01', 'TST-02', 'TST-03', 'TST-04', 'TST-07'],
    iskonto: 0,
    notlar: ['Kan alımı yapılacak çalışanlar tarama öncesi 8 saat açlık süresine uymalı.'],
    tarihMetni: 'dokuz gün sonra',
  }),
  taramaKaydi({
    id: 'TRM-08',
    firma: 'Marmara Tekstil A.Ş.',
    firmaKisa: 'Marmara Tekstil',
    yetkili: 'Gülay Tunç',
    hizmet: 'Paket tarama',
    tarih: gunEkle(-30),
    saat: '08:30',
    bitisSaat: '16:30',
    lokasyon: 'Çerkezköy üretim',
    kisi: 50,
    tamamlanan: 0,
    durum: 'İptal',
    ekipIds: ['EKP-U06'],
    testIdleri: ['TST-01', 'TST-02', 'TST-03', 'TST-04', 'TST-07'],
    iskonto: 0,
    notlar: ['Tarama, firma talebi üzerine iptal edildi.'],
    tarihMetni: 'otuz gün önce',
  }),
]

// ---------- Hizmet – test paketleri ----------

/** Her hizmet türünün kapsadığı test kimlikleri (testSeed.id) */
export const HIZMET_TEST_PAKETI: Record<(typeof HIZMET_TURLERI)[number], string[]> = {
  'İşe giriş taraması': ['TST-01', 'TST-02', 'TST-03', 'TST-04', 'TST-07'],
  'Periyodik muayene': ['TST-01', 'TST-02', 'TST-03', 'TST-04', 'TST-07', 'TST-08'],
  Odyometri: ['TST-05', 'TST-03'],
  Spirometri: ['TST-06', 'TST-03', 'TST-04'],
  'Paket tarama': ['TST-01', 'TST-02', 'TST-03', 'TST-04', 'TST-05', 'TST-06', 'TST-07', 'TST-08'],
}

// ---------- Test paketleri (kayıtlı, düzenlenebilir) ----------

export interface TestPaketi {
  id: string
  ad: string
  /** Hangi hizmet türünde önerildiği */
  hizmet: string
  aciklama: string
  /** Testler (testSeed.id) */
  testIdleri: string[]
}

export const testPaketiSeed: TestPaketi[] = HIZMET_TURLERI.map((hizmet, i) => ({
  id: `PKT-0${i + 1}`,
  ad: `${hizmet} paketi`,
  hizmet,
  aciklama: '',
  testIdleri: HIZMET_TEST_PAKETI[hizmet] ?? [],
}))

/** Teklif türleri — sihirbazda seçilir */
export const TEKLIF_TURLERI = ['İşe giriş taraması', 'Periyodik muayene'] as const
