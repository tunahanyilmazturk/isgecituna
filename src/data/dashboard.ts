export const TODAY = '2026-11-06'

export type Oncelik = 'kritik' | 'yuksek' | 'orta' | 'dusuk'
export type OlayTuru = 'Ramak kala' | 'İlk yardım' | 'Kayıp gün'
export type OlayDurum = 'İncelemede' | 'Aksiyonda' | 'Kapalı'

export interface Aksiyon {
  id: string
  baslik: string
  alan: string
  oncelik: Oncelik
  sorumlu: string
  termin: string
}

export interface Olay {
  id: string
  tur: OlayTuru
  baslik: string
  alan: string
  tarih: string
  durum: OlayDurum
}

export interface Planli {
  id: string
  tur: 'Denetim' | 'Eğitim' | 'Tatbikat'
  baslik: string
  alan: string
  tarih: string
  sorumlu: string
}

export interface Egitim {
  id: string
  ad: string
  tarih: string
  katilimci: number
  tamamlanan: number
}

export const aksiyonlar: Aksiyon[] = [
  { id: 'AK-114', baslik: 'Pres-3 acil stop butonu arızalı', alan: 'Pres Hattı', oncelik: 'kritik', sorumlu: 'Mehmet Demir', termin: '2026-10-30' },
  { id: 'AK-109', baslik: 'Forklift yaya yolu şeridi yenileme', alan: 'Sevkiyat', oncelik: 'orta', sorumlu: 'Emre Şahin', termin: '2026-10-28' },
  { id: 'AK-118', baslik: 'Kimyasal depo havalandırma ölçümü', alan: 'Depo', oncelik: 'yuksek', sorumlu: 'Ayşe Kaya', termin: '2026-11-01' },
  { id: 'AK-121', baslik: 'Kaynak atölyesi göz duşu kontrolü', alan: 'Kaynak', oncelik: 'yuksek', sorumlu: 'Mehmet Demir', termin: '2026-11-07' },
  { id: 'AK-122', baslik: 'Elektrik panosu LOTO prosedürü', alan: 'Bakım', oncelik: 'yuksek', sorumlu: 'Zeynep Arslan', termin: '2026-11-10' },
  { id: 'AK-124', baslik: 'KKD zimmet güncellemesi', alan: 'Genel', oncelik: 'orta', sorumlu: 'Ayşe Kaya', termin: '2026-11-12' },
  { id: 'AK-126', baslik: 'Yüksekte çalışma izin formu revizyonu', alan: 'Bakım', oncelik: 'orta', sorumlu: 'Emre Şahin', termin: '2026-11-15' },
  { id: 'AK-128', baslik: 'Gürültü ölçümü raporu yükleme', alan: 'Pres Hattı', oncelik: 'dusuk', sorumlu: 'Zeynep Arslan', termin: '2026-11-18' },
]

export const olaylar: Olay[] = [
  { id: 'OL-341', tur: 'Ramak kala', baslik: 'Kaygan zemin, montaj hattı girişi', alan: 'Montaj', tarih: '2026-11-02', durum: 'İncelemede' },
  { id: 'OL-338', tur: 'Ramak kala', baslik: 'Raftan düşen kutu', alan: 'Depo', tarih: '2026-10-27', durum: 'Aksiyonda' },
  { id: 'OL-335', tur: 'İlk yardım', baslik: 'El kesisi, el aletiyle', alan: 'Montaj', tarih: '2026-10-21', durum: 'Kapalı' },
  { id: 'OL-331', tur: 'Ramak kala', baslik: 'Forklift yakın temas', alan: 'Sevkiyat', tarih: '2026-10-15', durum: 'Kapalı' },
  { id: 'OL-329', tur: 'Kayıp gün', baslik: 'Sırt incinmesi, kaldırma sırasında', alan: 'Depo', tarih: '2026-10-09', durum: 'Kapalı' },
]

export const planli: Planli[] = [
  { id: 'DN-88', tur: 'Denetim', baslik: 'Aylık saha turu', alan: 'Tüm tesis', tarih: '2026-11-06', sorumlu: 'Tunahan Yılmaztürk' },
  { id: 'DN-89', tur: 'Denetim', baslik: 'Kimyasal depo denetimi', alan: 'Depo', tarih: '2026-11-10', sorumlu: 'Tunahan Yılmaztürk' },
  { id: 'EG-42', tur: 'Eğitim', baslik: 'Kimyasal güvenli kullanım (2. grup)', alan: 'Eğitim salonu', tarih: '2026-11-12', sorumlu: 'Ayşe Kaya' },
  { id: 'DN-90', tur: 'Denetim', baslik: 'KKD uyum kontrolü', alan: 'Pres Hattı', tarih: '2026-11-13', sorumlu: 'Ayşe Kaya' },
  { id: 'TB-07', tur: 'Tatbikat', baslik: 'Yangın tahliye tatbikatı', alan: 'Tüm tesis', tarih: '2026-11-20', sorumlu: 'Tunahan Yılmaztürk' },
]

export const egitimler: Egitim[] = [
  { id: 'EG-40', ad: 'Temel İSG eğitimi', tarih: '2026-10-06', katilimci: 142, tamamlanan: 124 },
  { id: 'EG-41', ad: 'Yüksekte çalışma', tarih: '2026-10-14', katilimci: 24, tamamlanan: 18 },
  { id: 'EG-42', ad: 'Kimyasal güvenli kullanım', tarih: '2026-10-28', katilimci: 42, tamamlanan: 31 },
  { id: 'EG-43', ad: 'İlk yardım temel', tarih: '2026-10-30', katilimci: 40, tamamlanan: 36 },
]

/** 5×5 risk matrisi — satırlar şiddet 5→1, sütunlar olasılık 1→5, değer o hücredeki risk sayısı */
export const riskMatrix: number[][] = [
  [0, 0, 0, 1, 1],
  [0, 0, 1, 2, 1],
  [0, 1, 3, 2, 1],
  [1, 2, 3, 1, 0],
  [1, 2, 1, 0, 0],
]

export interface Aktivite {
  id: number
  metin: string
  zaman: string
}

export const aktiviteler: Aktivite[] = [
  { id: 1, metin: 'Ramak kala bildirildi — Kaygan zemin, Montaj', zaman: '2 gün önce' },
  { id: 2, metin: 'Denetim tamamlandı — Elektrik odası', zaman: '3 gün önce' },
  { id: 3, metin: 'Aksiyon kapandı — Depo raf ankrajı', zaman: '4 gün önce' },
  { id: 4, metin: 'Eğitim planlandı — Kimyasal güvenli kullanım', zaman: '5 gün önce' },
  { id: 5, metin: 'Risk değerlendirme güncellendi — Pres Hattı', zaman: '6 gün önce' },
]

/* Türetilmiş değerler — ekranlar tek kaynaktan beslenir */
export const suresiGecmis = aksiyonlar.filter((a) => a.termin < TODAY)
export const toplamRisk = riskMatrix.flat().reduce((a, b) => a + b, 0)
export const yuksekRisk = riskMatrix
  .flatMap((row, s) => row.map((n, o) => ({ n, skor: (5 - s) * (o + 1) })))
  .filter((c) => c.skor >= 15)
  .reduce((a, b) => a + b.n, 0)
export const egitimOran = Math.round(
  (egitimler.reduce((a, e) => a + e.tamamlanan, 0) / egitimler.reduce((a, e) => a + e.katilimci, 0)) * 100,
)
export const alanAksiyonlari = [...aksiyonlar.reduce((m, a) => m.set(a.alan, (m.get(a.alan) ?? 0) + 1), new Map<string, number>())]
  .sort((a, b) => b[1] - a[1])
  .map(([alan, adet]) => ({ alan, adet }))

export const riskAlanlari = [
  { alan: 'Pres Hattı', enYuksekSkor: 16, guncelleme: '2026-11-01' },
  { alan: 'Depo', enYuksekSkor: 12, guncelleme: '2026-10-30' },
  { alan: 'Bakım', enYuksekSkor: 12, guncelleme: '2026-10-28' },
  { alan: 'Kaynak', enYuksekSkor: 9, guncelleme: '2026-10-25' },
  { alan: 'Sevkiyat', enYuksekSkor: 8, guncelleme: '2026-10-24' },
  { alan: 'Montaj', enYuksekSkor: 6, guncelleme: '2026-10-20' },
  { alan: 'Genel', enYuksekSkor: 4, guncelleme: '2026-10-15' },
].map((r) => ({ ...r, acikAksiyon: alanAksiyonlari.find((a) => a.alan === r.alan)?.adet ?? 0 }))

export const firmalar = [
  { id: 'FR-01', ad: 'Akdeniz Metal San. ve Tic. A.Ş.', tip: 'Ana işveren', kisiSayisi: 142, yetkili: 'Tunahan Yılmaztürk', durum: 'Aktif' },
  { id: 'FR-02', ad: 'Teknik Bakım Ltd.', tip: 'Taşeron', kisiSayisi: 18, yetkili: 'Burak Yıldız', durum: 'Aktif' },
  { id: 'FR-03', ad: 'Güven Taşımacılık', tip: 'Taşeron', kisiSayisi: 11, yetkili: 'Deniz Koç', durum: 'Aktif' },
  { id: 'FR-04', ad: 'Pro-Temiz Hizmetleri', tip: 'Taşeron', kisiSayisi: 7, yetkili: 'Elif Aksoy', durum: 'Askıda' },
] as const

export const ekipUyeleri = [
  { id: 'EK-01', ad: 'Tunahan Yılmaztürk', rol: 'İSG Uzmanı', departman: 'İSG', firma: 'Akdeniz Metal San. ve Tic. A.Ş.', durum: 'Aktif' },
  { id: 'EK-02', ad: 'Ayşe Kaya', rol: 'İSG Teknikeri', departman: 'İSG', firma: 'Akdeniz Metal San. ve Tic. A.Ş.', durum: 'Aktif' },
  { id: 'EK-03', ad: 'Mehmet Demir', rol: 'Saha Formeni', departman: 'Üretim', firma: 'Akdeniz Metal San. ve Tic. A.Ş.', durum: 'Aktif' },
  { id: 'EK-04', ad: 'Emre Şahin', rol: 'Bakım Şefi', departman: 'Bakım', firma: 'Akdeniz Metal San. ve Tic. A.Ş.', durum: 'Aktif' },
  { id: 'EK-05', ad: 'Zeynep Arslan', rol: 'Depo Sorumlusu', departman: 'Lojistik', firma: 'Akdeniz Metal San. ve Tic. A.Ş.', durum: 'Aktif' },
  { id: 'EK-06', ad: 'Burak Yıldız', rol: 'Taşeron Temsilcisi', departman: 'Bakım', firma: 'Teknik Bakım Ltd.', durum: 'Aktif' },
  { id: 'EK-07', ad: 'Deniz Koç', rol: 'Sürücü', departman: 'Lojistik', firma: 'Güven Taşımacılık', durum: 'Aktif' },
  { id: 'EK-08', ad: 'Elif Aksoy', rol: 'Temizlik Amiri', departman: 'Destek', firma: 'Pro-Temiz Hizmetleri', durum: 'İzinli' },
] as const

export type AtamaDurum = 'Atandı' | 'Devam' | 'Tamamlandı' | 'Gecikti'
export const egitimAtamalari: {
  id: string; personel: string; egitim: string; sonTarih: string; durum: AtamaDurum
}[] = [
  { id: 'EA-12', personel: 'Deniz Koç', egitim: 'Defansif sürüş ve yük güvenliği', sonTarih: '2026-11-08', durum: 'Devam' },
  { id: 'EA-13', personel: 'Elif Aksoy', egitim: 'Kimyasal güvenli kullanım', sonTarih: '2026-11-12', durum: 'Atandı' },
  { id: 'EA-14', personel: 'Mehmet Demir', egitim: 'Yangın söndürme ve tahliye', sonTarih: '2026-10-28', durum: 'Tamamlandı' },
  { id: 'EA-15', personel: 'Burak Yıldız', egitim: 'Elektrik güvenliği (seviye 2)', sonTarih: '2026-11-01', durum: 'Gecikti' },
  { id: 'EA-16', personel: 'Zeynep Arslan', egitim: 'İlk yardım temel eğitimi', sonTarih: '2026-11-20', durum: 'Atandı' },
]

export type SertifikaDurum = 'Geçerli' | 'Dolmak üzere' | 'Süresi doldu'
export const sertifikalar: {
  id: string; personel: string; belge: string; gecerlilik: string; durum: SertifikaDurum
}[] = [
  { id: 'SR-41', personel: 'Deniz Koç', belge: 'Forklift Operatör Belgesi', gecerlilik: '2026-11-15', durum: 'Dolmak üzere' },
  { id: 'SR-42', personel: 'Mehmet Demir', belge: 'İlk Yardım Sertifikası', gecerlilik: '2027-05-10', durum: 'Geçerli' },
  { id: 'SR-43', personel: 'Burak Yıldız', belge: 'Elektrik Yetki Belgesi (EKAT)', gecerlilik: '2026-10-30', durum: 'Süresi doldu' },
  { id: 'SR-44', personel: 'Ayşe Kaya', belge: 'İSG Uzmanlığı (C sınıfı)', gecerlilik: '2028-01-20', durum: 'Geçerli' },
  { id: 'SR-45', personel: 'Emre Şahin', belge: 'Yüksekte Çalışma Sertifikası', gecerlilik: '2026-12-05', durum: 'Dolmak üzere' },
  { id: 'SR-46', personel: 'Tunahan Yılmaztürk', belge: 'İSG Uzmanlığı (B sınıfı)', gecerlilik: '2027-08-14', durum: 'Geçerli' },
]

export const sertifikaOnaylari = [
  { id: 'SO-07', personel: 'Deniz Koç', belge: 'SRC-4 Mesleki Yeterlilik', yuklenme: '2026-11-02', durum: 'Bekliyor' },
  { id: 'SO-08', personel: 'Elif Aksoy', belge: 'Hijyen Eğitimi Sertifikası', yuklenme: '2026-11-03', durum: 'Bekliyor' },
] as const
