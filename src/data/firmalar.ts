import type { PillTone } from '@/components/pill'
import type { OlayEk } from '@/data/olaylar'
import { TODAY } from '@/data/dashboard'

export const BUGUN = TODAY

export type TehlikeSinifi = 'Az Tehlikeli' | 'Tehlikeli' | 'Çok Tehlikeli'
export type FirmaDurum = 'Aktif' | 'Pasif'
export type SozlesmeDurumu = 'Aktif' | 'Yaklaşıyor' | 'Doldu' | 'Yok'

export interface FirmaKisi {
  id: string
  ad: string
  gorev: string
  telefon: string
  eposta: string
  birincil: boolean
}

export interface FirmaIslem {
  tarih: string
  islem: string
  not?: string
}

export interface Firma {
  id: string
  kod: string
  unvan: string
  kisaAd: string
  /** Firma logosu — küçük optimize edilmiş data URL */
  logo?: string
  vergiDairesi: string
  vergiNo: string
  sgkSicil: string
  mersis?: string
  tehlikeSinifi: TehlikeSinifi | ''
  nace: string
  faaliyet: string
  calisanSayisi: number
  il: string
  ilce: string
  adres: string
  telefon: string
  eposta: string
  yetkili: string
  kisiler: FirmaKisi[]
  hizmetTuru: string
  uzman?: string
  uzmanSinifi?: 'A' | 'B' | 'C'
  hekim?: string
  dsp?: string
  hizmetBaslangic: string
  hizmetBitis: string
  aylikSure?: string
  notlar?: string
  ekler: OlayEk[]
  durum: FirmaDurum
  islemGecmisi: FirmaIslem[]
}

export const TEHLIKE_SINIFLARI: TehlikeSinifi[] = ['Az Tehlikeli', 'Tehlikeli', 'Çok Tehlikeli']

export const HIZMET_TURLERI = [
  'OSGB Kapsamlı Hizmet',
  'OSGB Yalnızca Uzmanlık',
  'OSGB Yalnızca Hekimlik',
  'İşyeri İçi İSG Birimi',
  'Danışmanlık',
]

export const ILLER = ['Kocaeli', 'İstanbul', 'Bursa', 'Sakarya', 'Tekirdağ', 'İzmir']

export const tehlikeTone: Record<TehlikeSinifi, PillTone> = {
  'Az Tehlikeli': 'green',
  Tehlikeli: 'amber',
  'Çok Tehlikeli': 'red',
}

export const firmaDurumTone: Record<FirmaDurum, PillTone> = {
  Aktif: 'green',
  Pasif: 'zinc',
}

export const sozlesmeTone: Record<SozlesmeDurumu, PillTone> = {
  Aktif: 'green',
  Yaklaşıyor: 'orange',
  Doldu: 'red',
  Yok: 'zinc',
}

/** Firma hizmet sözleşmesinin durumu — bitiş tarihinden türetilir */
export const sozlesmeDurumu = (f: Firma): SozlesmeDurumu => {
  if (!f.hizmetBitis) return 'Yok'
  if (f.hizmetBitis < BUGUN) return 'Doldu'
  const kalan = Math.round(
    (new Date(`${f.hizmetBitis}T00:00:00`).getTime() - new Date(`${BUGUN}T00:00:00`).getTime()) /
      86400000,
  )
  return kalan <= 30 ? 'Yaklaşıyor' : 'Aktif'
}

/** Zorunlu alanlardaki eksikler — "Eksik Bilgili" istatistiği ve uyarılar buradan beslenir */
export const eksikAlanlar = (f: Firma): string[] => {
  const e: string[] = []
  if (!f.vergiNo) e.push('Vergi numarası')
  if (!f.vergiDairesi) e.push('Vergi dairesi')
  if (!f.sgkSicil) e.push('SGK sicil no')
  if (!f.tehlikeSinifi) e.push('Tehlike sınıfı')
  if (!f.nace) e.push('NACE kodu')
  if (!f.il || !f.ilce) e.push('İl / ilçe')
  if (!f.adres) e.push('Açık adres')
  if (!f.telefon) e.push('Telefon')
  if (!f.yetkili) e.push('İşyeri yetkilisi')
  if (!f.hizmetTuru) e.push('İSG hizmet türü')
  if (!f.hizmetBaslangic || !f.hizmetBitis) e.push('Hizmet tarihleri')
  return e
}

const kisi = (
  id: string,
  ad: string,
  gorev: string,
  telefon: string,
  eposta: string,
  birincil = false,
): FirmaKisi => ({ id, ad, gorev, telefon, eposta, birincil })

const islem = (tarih: string, islemAdi: string, not?: string): FirmaIslem => ({
  tarih,
  islem: islemAdi,
  not,
})

export const firmalarSeed: Firma[] = [
  {
    id: 'FR-01',
    kod: 'FR-001',
    unvan: 'Akdeniz Metal San. ve Tic. A.Ş.',
    kisaAd: 'Akdeniz Metal',
    vergiDairesi: 'Gebze',
    vergiNo: '7340051298',
    sgkSicil: '3-4107-2201-00-000',
    mersis: '0734005129800015',
    tehlikeSinifi: 'Çok Tehlikeli',
    nace: '25.50.02',
    faaliyet: 'Metal eşya dövme, presleme ve damgalama',
    calisanSayisi: 142,
    il: 'Kocaeli',
    ilce: 'Gebze',
    adres: 'İMES OSB 4. Cadde No:12, Gebze',
    telefon: '0262 643 18 40',
    eposta: 'info@akdenizmetal.com.tr',
    yetkili: 'Tunahan Yılmaztürk',
    kisiler: [
      kisi('FK-01', 'Tunahan Yılmaztürk', 'İSG Uzmanı', '0532 114 78 90', 't.yilmazturk@vegaosgb.com.tr', true),
      kisi('FK-02', 'Mehmet Demir', 'Üretim Müdürü', '0533 220 45 61', 'm.demir@akdenizmetal.com.tr'),
    ],
    hizmetTuru: 'OSGB Kapsamlı Hizmet',
    uzman: 'Tunahan Yılmaztürk',
    uzmanSinifi: 'B',
    hekim: 'Dr. Selin Aydemir',
    dsp: 'Hemşire Kaan Ünal',
    hizmetBaslangic: '2025-01-15',
    hizmetBitis: '2027-01-14',
    aylikSure: 'Uzman 12 dk/çalışan · Hekim 6 dk/çalışan',
    notlar: 'Vardiya sistemi 3-8-16; saha ziyaretleri salı günü planlanır.',
    ekler: [
      { ad: 'akdeniz-osgb-sozlesme.pdf', tur: 'Belge', boyut: '1,2 MB' },
      { ad: 'iskur-tescil.pdf', tur: 'Belge', boyut: '420 KB' },
    ],
    durum: 'Aktif',
    islemGecmisi: [
      islem('2025-01-15', 'Firma kaydı oluşturuldu'),
      islem('2025-01-15', 'OSGB hizmet sözleşmesi yüklendi', 'Söz. No: SZL-2025-014'),
      islem('2025-02-03', 'İSG-KATİP görevlendirmeleri doğrulandı'),
      islem('2026-09-12', 'Çalışan sayısı güncellendi', '128 → 142'),
    ],
  },
  {
    id: 'FR-02',
    kod: 'FR-002',
    unvan: 'Teknik Bakım Ltd.',
    kisaAd: 'Teknik Bakım',
    vergiDairesi: 'Çayırova',
    vergiNo: '6290044317',
    sgkSicil: '3-4107-3380-00-000',
    tehlikeSinifi: 'Tehlikeli',
    nace: '33.12.01',
    faaliyet: 'Makine ve teçhizat bakım-onarım hizmetleri',
    calisanSayisi: 18,
    il: 'Kocaeli',
    ilce: 'Çayırova',
    adres: 'Şekerpınar Mah. Atatürk Cad. No:27',
    telefon: '0262 658 92 13',
    eposta: 'info@teknikbakim.com.tr',
    yetkili: 'Burak Yıldız',
    kisiler: [
      kisi('FK-03', 'Burak Yıldız', 'Firma Sahibi', '0542 610 34 78', 'b.yildiz@teknikbakim.com.tr', true),
    ],
    hizmetTuru: 'OSGB Kapsamlı Hizmet',
    uzman: 'Ayşe Kaya',
    uzmanSinifi: 'C',
    hekim: 'Dr. Selin Aydemir',
    dsp: '',
    hizmetBaslangic: '2025-06-01',
    hizmetBitis: '2026-11-30',
    aylikSure: 'Uzman 6 saat/ay · Hekim 3 saat/ay',
    ekler: [{ ad: 'teknik-bakim-sozlesme.pdf', tur: 'Belge', boyut: '890 KB' }],
    durum: 'Aktif',
    islemGecmisi: [
      islem('2025-06-01', 'Firma kaydı oluşturuldu'),
      islem('2025-06-02', 'OSGB hizmet sözleşmesi yüklendi', 'Söz. No: SZL-2025-089'),
      islem('2026-10-28', 'DSP görevlendirmesi sonlandı', 'Personel ayrılışı'),
    ],
  },
  {
    id: 'FR-03',
    kod: 'FR-003',
    unvan: 'Güven Taşımacılık',
    kisaAd: 'Güven',
    vergiDairesi: 'Gebze',
    vergiNo: '3180077624',
    sgkSicil: '3-4107-4412-00-000',
    tehlikeSinifi: 'Tehlikeli',
    nace: '49.41.01',
    faaliyet: 'Kara yoluyla şehirlerarası yük taşımacılığı',
    calisanSayisi: 11,
    il: 'Kocaeli',
    ilce: 'Gebze',
    adres: 'Mimar Sinan Mah. Lojistik Cad. No:5',
    telefon: '0262 644 70 22',
    eposta: 'operasyon@guventasimacilik.com',
    yetkili: 'Deniz Koç',
    kisiler: [
      kisi('FK-04', 'Deniz Koç', 'Operasyon Sorumlusu', '0555 482 19 63', 'd.koc@guventasimacilik.com', true),
      kisi('FK-05', 'Kemal Öztürk', 'Muhasebe', '0532 771 05 44', 'k.ozturk@guventasimacilik.com'),
    ],
    hizmetTuru: 'OSGB Yalnızca Uzmanlık',
    uzman: 'Tunahan Yılmaztürk',
    uzmanSinifi: 'B',
    hekim: '',
    dsp: '',
    hizmetBaslangic: '2025-03-10',
    hizmetBitis: '2026-11-18',
    aylikSure: 'Uzman 4 saat/ay',
    ekler: [],
    durum: 'Aktif',
    islemGecmisi: [
      islem('2025-03-10', 'Firma kaydı oluşturuldu'),
      islem('2025-03-10', 'OSGB hizmet sözleşmesi yüklendi', 'Söz. No: SZL-2025-041'),
      islem('2026-08-20', 'İşyeri hekimi sözleşmesi sona erdi', 'Karşılıklı fesih'),
    ],
  },
  {
    id: 'FR-04',
    kod: 'FR-004',
    unvan: 'Pro-Temiz Hizmetleri',
    kisaAd: 'Pro-Temiz',
    vergiDairesi: 'Gebze',
    vergiNo: '1470033660',
    sgkSicil: '3-4107-5198-00-000',
    tehlikeSinifi: 'Az Tehlikeli',
    nace: '81.21.01',
    faaliyet: 'Binaların genel temizlik faaliyetleri',
    calisanSayisi: 7,
    il: 'Kocaeli',
    ilce: 'Gebze',
    adres: 'Barış Mah. Sanayi Sok. No:9',
    telefon: '0262 642 55 17',
    eposta: 'info@protemiz.com',
    yetkili: 'Elif Aksoy',
    kisiler: [
      kisi('FK-06', 'Elif Aksoy', 'Temizlik Amiri', '0530 216 88 42', 'e.aksoy@protemiz.com', true),
    ],
    hizmetTuru: 'Danışmanlık',
    hizmetBaslangic: '2025-02-01',
    hizmetBitis: '2026-05-31',
    ekler: [],
    durum: 'Pasif',
    islemGecmisi: [
      islem('2025-02-01', 'Firma kaydı oluşturuldu'),
      islem('2026-05-31', 'Sözleşme süresi doldu — firma pasife alındı'),
    ],
  },
  {
    id: 'FR-05',
    kod: 'FR-005',
    unvan: 'Nova Gıda San. Tic. A.Ş.',
    kisaAd: 'Nova Gıda',
    vergiDairesi: 'Darıca',
    vergiNo: '8520066119',
    sgkSicil: '3-4108-0931-00-000',
    mersis: '0852006611900012',
    tehlikeSinifi: 'Tehlikeli',
    nace: '10.71.01',
    faaliyet: 'Unlu mamuller üretimi',
    calisanSayisi: 56,
    il: 'Kocaeli',
    ilce: 'Darıca',
    adres: 'Osmangazi Mah. Sanayi Cad. No:41',
    telefon: '0262 653 40 08',
    eposta: 'info@novagida.com.tr',
    yetkili: 'Serkan Aydın',
    kisiler: [
      kisi('FK-07', 'Serkan Aydın', 'Genel Müdür', '0534 907 12 36', 's.aydin@novagida.com.tr', true),
      kisi('FK-08', 'Nazlı Eren', 'İnsan Kaynakları', '0541 335 67 20', 'n.eren@novagida.com.tr'),
    ],
    hizmetTuru: 'OSGB Kapsamlı Hizmet',
    uzman: 'Ayşe Kaya',
    uzmanSinifi: 'C',
    hekim: 'Dr. Murat Özkan',
    dsp: 'Hemşire Kaan Ünal',
    hizmetBaslangic: '2025-09-01',
    hizmetBitis: '2026-11-25',
    aylikSure: 'Uzman 8 saat/ay · Hekim 4 saat/ay · DSP 8 saat/ay',
    ekler: [{ ad: 'nova-sozlesme-2025.pdf', tur: 'Belge', boyut: '1,4 MB' }],
    durum: 'Aktif',
    islemGecmisi: [
      islem('2025-09-01', 'Firma kaydı oluşturuldu'),
      islem('2025-09-01', 'OSGB hizmet sözleşmesi yüklendi', 'Söz. No: SZL-2025-112'),
      islem('2026-10-15', 'DSP görevlendirmesi güncellendi', 'Hemşire Kaan Ünal atandı'),
    ],
  },
  {
    id: 'FR-06',
    kod: 'FR-006',
    unvan: 'Atlas Metal ve Döküm',
    kisaAd: 'Atlas Metal',
    vergiDairesi: 'Bursa',
    vergiNo: '9600011845',
    sgkSicil: '3-1610-7742-00-000',
    tehlikeSinifi: 'Çok Tehlikeli',
    nace: '24.45.10',
    faaliyet: 'Demir dışı metallerin dökümü',
    calisanSayisi: 63,
    il: 'Bursa',
    ilce: 'İnegöl',
    adres: 'İnegöl OSB 8. Blok No:3',
    telefon: '0224 714 26 90',
    eposta: 'info@atlasmetal.com.tr',
    yetkili: 'Hakan Turan',
    kisiler: [
      kisi('FK-09', 'Hakan Turan', 'Fabrika Müdürü', '0536 442 90 15', 'h.turan@atlasmetal.com.tr', true),
    ],
    hizmetTuru: 'OSGB Yalnızca Uzmanlık',
    uzman: 'Tunahan Yılmaztürk',
    uzmanSinifi: 'B',
    hekim: '',
    dsp: '',
    hizmetBaslangic: '2025-12-01',
    hizmetBitis: '2026-12-01',
    ekler: [],
    durum: 'Aktif',
    islemGecmisi: [
      islem('2025-12-01', 'Firma kaydı oluşturuldu'),
      islem('2025-12-01', 'OSGB hizmet sözleşmesi yüklendi', 'Söz. No: SZL-2025-143'),
      islem('2026-10-02', 'Hekim görevlendirme talebi iletildi', 'Firma onayı bekleniyor'),
    ],
  },
  {
    id: 'FR-07',
    kod: 'FR-007',
    unvan: 'Bereket Ambalaj Ltd.',
    kisaAd: 'Bereket',
    vergiDairesi: 'Tuzla',
    vergiNo: '4120039908',
    sgkSicil: '',
    tehlikeSinifi: 'Az Tehlikeli',
    nace: '17.21.02',
    faaliyet: 'Oluklu mukavva ve ambalaj üretimi',
    calisanSayisi: 24,
    il: 'İstanbul',
    ilce: 'Tuzla',
    adres: 'Aydınlı Mah. Patlayıcı Maddeler Yolu No:7',
    telefon: '0216 593 71 24',
    eposta: 'info@bereketambalaj.com',
    yetkili: '',
    kisiler: [],
    hizmetTuru: 'Danışmanlık',
    hizmetBaslangic: '2026-10-15',
    hizmetBitis: '',
    ekler: [],
    durum: 'Aktif',
    islemGecmisi: [
      islem('2026-10-15', 'Firma kaydı oluşturuldu'),
      islem('2026-10-15', 'Zorunlu alan eksikleri tespit edildi', 'SGK sicil, yetkili, sözleşme bitiş'),
    ],
  },
]

/** Ünvan → firma id (olay kayıtlarındaki firma ilişkisi için) */
export const firmaIdByAd = (firmalar: Firma[], ad: string) =>
  firmalar.find((f) => f.unvan === ad || f.kisaAd === ad)?.id
