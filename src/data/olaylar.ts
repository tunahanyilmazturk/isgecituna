import type { PillTone } from '@/components/pill'
import { TODAY } from '@/data/dashboard'
import { adSoyad, ekipSeed } from '@/data/ekip'
import { firmalarSeed } from '@/data/firmalar'

export const BUGUN = TODAY

export type OlayTuru =
  | 'İş Kazası'
  | 'Ramak Kala'
  | 'Tehlikeli Durum'
  | 'Tehlikeli Davranış'
  | 'Maddi Hasar'

export type OlayDurumu =
  | 'Yeni Bildirildi'
  | 'İncelemede'
  | 'Aksiyon Bekliyor'
  | 'Aksiyon Alındı'
  | 'Kapatıldı'

export type RiskSeviyesi = 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'

export interface OlayEk {
  ad: string
  tur: string
  boyut: string
}

export interface OlayAksiyon {
  id: string
  aciklama: string
  sorumlu: string
  baslangic: string
  hedefBitis: string
  tamamlandi: boolean
  tamamlanmaNotu?: string
  kanit?: string
}

export interface OlayGecmis {
  durum: OlayDurumu
  tarih: string
  not?: string
}

export interface Olay {
  id: string
  tarih: string
  saat: string
  firma: string
  firmaId?: string
  isyeri: string
  bolum: string
  tur: OlayTuru
  baslik: string
  aciklama: string
  calisan?: string
  tc?: string
  gorev?: string
  bildiren: string
  taniklar?: string
  yaralanma: boolean
  maddiHasar: boolean
  isKaybi: boolean
  yaralanmaTuru?: string
  vucutBolgesi?: string
  sonuc?: string
  risk: RiskSeviyesi
  durum: OlayDurumu
  sorumlu: string
  ekler: OlayEk[]
  ilkOnlemler?: string
  duzelticiFaaliyet?: string
  aksiyonlar: OlayAksiyon[]
  gecmis: OlayGecmis[]
  notlar?: string
}

export const TURLER: OlayTuru[] = [
  'İş Kazası',
  'Ramak Kala',
  'Tehlikeli Durum',
  'Tehlikeli Davranış',
  'Maddi Hasar',
]

export const DURUMLAR: OlayDurumu[] = [
  'Yeni Bildirildi',
  'İncelemede',
  'Aksiyon Bekliyor',
  'Aksiyon Alındı',
  'Kapatıldı',
]

export const RISKLER: RiskSeviyesi[] = ['Düşük', 'Orta', 'Yüksek', 'Kritik']

export const FIRMALAR = firmalarSeed.map((f) => f.unvan)
export const ISYERLERI = ['Merkez Tesis', 'Lojistik Merkez', 'Bursa Şube']
export const BOLUMLER = [
  'Pres Hattı',
  'Montaj',
  'Kaynak',
  'Depo',
  'Sevkiyat',
  'Bakım',
  'Elektrik Odası',
  'Genel Alan',
]
// Olay sorumluları merkezi ekip kaydından gelir (veri/ekip.ts)
export const SORUMLULAR = ekipSeed.map(adSoyad)
export const YARALANMA_TURLERI = ['Kesik', 'Ezilme', 'Burkulma', 'Kırık', 'Yanık', 'Çarpma', 'Diğer']
export const VUCUT_BOLGELERI = [
  'Parmak',
  'El',
  'Kol',
  'Bacak',
  'Ayak',
  'Baş',
  'Göz',
  'Omuz',
  'Gövde',
]
export const SONUCLAR = [
  'İlk yardım müdahalesi',
  'Ayakta tedavi',
  'İş göremezlik raporu',
  'Kayıp iş günü',
  'Hasarsız atlatıldı',
]

export const riskTone: Record<RiskSeviyesi, PillTone> = {
  Düşük: 'zinc',
  Orta: 'amber',
  Yüksek: 'orange',
  Kritik: 'red',
}

export const durumTone: Record<OlayDurumu, PillTone> = {
  'Yeni Bildirildi': 'sky',
  İncelemede: 'amber',
  'Aksiyon Bekliyor': 'orange',
  'Aksiyon Alındı': 'violet',
  Kapatıldı: 'green',
}

export const turTone: Record<OlayTuru, PillTone> = {
  'İş Kazası': 'red',
  'Ramak Kala': 'amber',
  'Tehlikeli Durum': 'orange',
  'Tehlikeli Davranış': 'sky',
  'Maddi Hasar': 'zinc',
}

export const riskSira: Record<RiskSeviyesi, number> = {
  Düşük: 0,
  Orta: 1,
  Yüksek: 2,
  Kritik: 3,
}

const h = (durum: OlayDurumu, tarih: string, not?: string): OlayGecmis => ({ durum, tarih, not })

const aksiyon = (
  id: string,
  aciklama: string,
  sorumlu: string,
  baslangic: string,
  hedefBitis: string,
  tamamlandi = false,
  tamamlanmaNotu?: string,
): OlayAksiyon => ({ id, aciklama, sorumlu, baslangic, hedefBitis, tamamlandi, tamamlanmaNotu })

export const olaylarSeed: Olay[] = [
  {
    id: 'OL-342',
    tarih: '2026-11-03',
    saat: '09:15',
    firma: 'Akdeniz Metal San. ve Tic. A.Ş.',
    isyeri: 'Merkez Tesis',
    bolum: 'Pres Hattı',
    tur: 'İş Kazası',
    baslik: 'Pres operatörü parmak sıkışması',
    aciklama:
      'Pres-3 tezgahında parça beslemesi sırasında operatörün sağ el işaret parmağı kalıp arasına sıkıştı. Acil stop butonu geç tepki verdi, makine beklenenden yavaş durdu. Olay yerinde ilk müdahale yapıldı, çalışan hastaneye sevk edildi.',
    calisan: 'Hasan Yıldırım',
    tc: '3*********7',
    gorev: 'Pres Operatörü',
    bildiren: 'Mehmet Demir',
    taniklar: 'Serkan Aydın, Veli Koçak',
    yaralanma: true,
    maddiHasar: false,
    isKaybi: true,
    yaralanmaTuru: 'Ezilme',
    vucutBolgesi: 'Parmak',
    sonuc: 'İş göremezlik raporu',
    risk: 'Kritik',
    durum: 'İncelemede',
    sorumlu: 'Tunahan Yılmaztürk',
    ekler: [
      { ad: 'pres3-olay-yeri.jpg', tur: 'Fotoğraf', boyut: '2,4 MB' },
      { ad: 'hastane-raporu.pdf', tur: 'Belge', boyut: '312 KB' },
    ],
    ilkOnlemler: 'Makine enerjisi kesildi, pres-3 çalışmaya kapatıldı, bölge şeritlendi.',
    duzelticiFaaliyet: 'Acil stop devresi revizyonu ve iki-el kumanda kontrolü.',
    aksiyonlar: [
      aksiyon(
        'AKS-101',
        'Pres-3 acil stop butonu ve fren devresinin bakım firmasına kontrol ettirilmesi',
        'Emre Şahin',
        '2026-11-03',
        '2026-10-30',
      ),
      aksiyon(
        'AKS-102',
        'Tüm preslerde iki-el kumanda fonksiyon testi yapılması',
        'Emre Şahin',
        '2026-11-03',
        '2026-11-12',
      ),
      aksiyon(
        'AKS-103',
        'Kalıp besleme noktasına ışık perdesi (light curtain) montajı için teklif alınması',
        'Tunahan Yılmaztürk',
        '2026-11-04',
        '2026-11-20',
      ),
    ],
    gecmis: [
      h('Yeni Bildirildi', '2026-11-03', 'Vardiya formeni tarafından bildirildi'),
      h('İncelemede', '2026-11-03', 'Olay yeri incelemesi ve tanık ifadeleri alındı'),
    ],
    notlar:
      'Acil stop butonunun tepki süresi ölçüldü; standart dışı gecikme tespit edildi. Kök neden analizi devam ediyor.',
  },
  {
    id: 'OL-341',
    tarih: '2026-11-02',
    saat: '16:40',
    firma: 'Güven Taşımacılık',
    isyeri: 'Lojistik Merkez',
    bolum: 'Sevkiyat',
    tur: 'Ramak Kala',
    baslik: 'Forklift ile yaya çarpışması son anda önlendi',
    aciklama:
      'Sevkiyat rampasında forklift geri manevrası yaparken yaya yolundaki çalışanı son anda fark etti. Yaya yolu şeridi silik, forklift ikaz lambası çalışmıyor.',
    calisan: 'Deniz Koç',
    gorev: 'Sürücü',
    bildiren: 'Zeynep Arslan',
    taniklar: 'Zeynep Arslan',
    yaralanma: false,
    maddiHasar: false,
    isKaybi: false,
    risk: 'Yüksek',
    durum: 'Aksiyon Bekliyor',
    sorumlu: 'Tunahan Yılmaztürk',
    ekler: [{ ad: 'rampa-goruntu.mp4', tur: 'Video', boyut: '18 MB' }],
    ilkOnlemler: 'Rampa bölgesine geçici uyarı levhası konuldu.',
    duzelticiFaaliyet: 'Yaya yolu şeritlerinin yenilenmesi ve forklift ikaz sistemlerinin kontrolü.',
    aksiyonlar: [
      aksiyon(
        'AKS-104',
        'Sevkiyat alanı yaya yolu şeritlerinin epoksi boya ile yenilenmesi',
        'Zeynep Arslan',
        '2026-11-02',
        '2026-10-28',
      ),
      aksiyon(
        'AKS-105',
        'Tüm forkliftlerde ikaz lambası ve geri vites sesli ikaz kontrolü',
        'Emre Şahin',
        '2026-11-03',
        '2026-11-10',
      ),
    ],
    gecmis: [
      h('Yeni Bildirildi', '2026-11-02'),
      h('İncelemede', '2026-11-02', 'Kamera kaydı incelendi'),
      h('Aksiyon Bekliyor', '2026-11-03', 'DÖF açıldı, sorumlular atandı'),
    ],
    notlar: 'Yaya-forklift ayrışması için fiziksel bariyer değerlendirmesi yapılacak.',
  },
  {
    id: 'OL-340',
    tarih: '2026-11-01',
    saat: '11:25',
    firma: 'Akdeniz Metal San. ve Tic. A.Ş.',
    isyeri: 'Merkez Tesis',
    bolum: 'Depo',
    tur: 'Tehlikeli Durum',
    baslik: 'Kimyasal depoda havalandırma arızası',
    aciklama:
      'Kimyasal malzeme deposunun egzoz fanı arızalandı, ortamda solvent kokusu yoğunlaştı. Depo boşaltıldı, arıza bakım ekibine bildirildi.',
    bildiren: 'Zeynep Arslan',
    yaralanma: false,
    maddiHasar: false,
    isKaybi: false,
    risk: 'Orta',
    durum: 'Aksiyon Alındı',
    sorumlu: 'Emre Şahin',
    ekler: [{ ad: 'fan-ariza.jpg', tur: 'Fotoğraf', boyut: '1,8 MB' }],
    ilkOnlemler: 'Depoya giriş yasaklandı, kapılar açık bırakılarak doğal havalandırma sağlandı.',
    duzelticiFaaliyet: 'Egzoz fanı motor değişimi ve periyodik bakım planına eklenmesi.',
    aksiyonlar: [
      aksiyon(
        'AKS-106',
        'Egzoz fanı motorunun değiştirilmesi',
        'Emre Şahin',
        '2026-11-01',
        '2026-11-03',
        true,
        'Motor değişti, debi ölçümü yapıldı — değerler normal.',
      ),
      aksiyon(
        'AKS-107',
        'Depo havalandırma sisteminin aylık bakım planına eklenmesi',
        'Emre Şahin',
        '2026-11-02',
        '2026-11-15',
      ),
    ],
    gecmis: [
      h('Yeni Bildirildi', '2026-11-01'),
      h('İncelemede', '2026-11-01'),
      h('Aksiyon Bekliyor', '2026-11-01'),
      h('Aksiyon Alındı', '2026-11-03', 'Fan motoru değişimi tamamlandı'),
    ],
  },
  {
    id: 'OL-339',
    tarih: '2026-10-30',
    saat: '14:05',
    firma: 'Akdeniz Metal San. ve Tic. A.Ş.',
    isyeri: 'Lojistik Merkez',
    bolum: 'Depo',
    tur: 'Ramak Kala',
    baslik: 'Raf üstünden ambalaj paleti düştü',
    aciklama:
      'Depo C koridorunda 4. kattaki paletin ambalajı yırtılarak içindeki kutular koridora düştü. O esnada koridorda kimse bulunmuyordu.',
    bildiren: 'Zeynep Arslan',
    yaralanma: false,
    maddiHasar: true,
    isKaybi: false,
    risk: 'Orta',
    durum: 'İncelemede',
    sorumlu: 'Zeynep Arslan',
    ekler: [{ ad: 'raf-c-koridor.jpg', tur: 'Fotoğraf', boyut: '2,1 MB' }],
    ilkOnlemler: 'C koridoru geçici olarak kapatıldı, palet yeniden istiflendi.',
    duzelticiFaaliyet: 'Üst kat paletlerine emniyet filesi takılması.',
    aksiyonlar: [
      aksiyon(
        'AKS-108',
        'C koridoru üst kat raflarına emniyet filesi montajı',
        'Zeynep Arslan',
        '2026-10-31',
        '2026-11-14',
      ),
    ],
    gecmis: [h('Yeni Bildirildi', '2026-10-30'), h('İncelemede', '2026-10-31')],
  },
  {
    id: 'OL-338',
    tarih: '2026-10-29',
    saat: '10:50',
    firma: 'Akdeniz Metal San. ve Tic. A.Ş.',
    isyeri: 'Merkez Tesis',
    bolum: 'Kaynak',
    tur: 'İş Kazası',
    baslik: 'Kaynak operatörü gözünde kıvılcım yanığı',
    aciklama:
      'Kaynak operatörü maskeyi kaldırdığı anda sıçrayan kıvılcım sol gözüne isabet etti. İşyeri hekimi ilk müdahaleyi yaptı, göz doktoruna sevk edildi.',
    calisan: 'Okan Demirtaş',
    tc: '2*********4',
    gorev: 'Kaynak Operatörü',
    bildiren: 'Ayşe Kaya',
    yaralanma: true,
    maddiHasar: false,
    isKaybi: true,
    yaralanmaTuru: 'Yanık',
    vucutBolgesi: 'Göz',
    sonuc: 'Ayakta tedavi',
    risk: 'Yüksek',
    durum: 'Aksiyon Alındı',
    sorumlu: 'Ayşe Kaya',
    ekler: [{ ad: 'muayene-belgesi.pdf', tur: 'Belge', boyut: '280 KB' }],
    ilkOnlemler: 'Göz duşu ile yıkama yapıldı, hekim müdahalesi sağlandı.',
    duzelticiFaaliyet: 'Kaynak bölümünde yüz siperi + gözlük çift KKD zorunluluğu.',
    aksiyonlar: [
      aksiyon(
        'AKS-109',
        'Kaynak istasyonlarına yüz siperi temini ve KKD kontrol listesi güncellemesi',
        'Ayşe Kaya',
        '2026-10-29',
        '2026-11-02',
        true,
        'Siperler dağıtıldı, kontrol listesi revize edildi.',
      ),
    ],
    gecmis: [
      h('Yeni Bildirildi', '2026-10-29'),
      h('İncelemede', '2026-10-29'),
      h('Aksiyon Bekliyor', '2026-10-30'),
      h('Aksiyon Alındı', '2026-11-02'),
    ],
  },
  {
    id: 'OL-337',
    tarih: '2026-10-28',
    saat: '15:30',
    firma: 'Teknik Bakım Ltd.',
    isyeri: 'Merkez Tesis',
    bolum: 'Bakım',
    tur: 'Tehlikeli Davranış',
    baslik: 'Koruyucu gözlüksüz taşlama işlemi',
    aciklama:
      'Taşeron personelin avuç taşlama ile kaynak çapağı temizliği yaparken koruyucu gözlük takmadığı gözlemlendi. İş durdurularak uyarı verildi.',
    calisan: 'Taşeron personeli',
    bildiren: 'Mehmet Demir',
    yaralanma: false,
    maddiHasar: false,
    isKaybi: false,
    risk: 'Orta',
    durum: 'Kapatıldı',
    sorumlu: 'Mehmet Demir',
    ekler: [],
    ilkOnlemler: 'İş durduruldu, personele KKD hatırlatması yapıldı.',
    duzelticiFaaliyet: 'Taşeron firma ile KKD denetim sıklığının artırılması.',
    aksiyonlar: [
      aksiyon(
        'AKS-110',
        'Teknik Bakım Ltd. personeline KKD farkındalık bilgilendirmesi',
        'Ayşe Kaya',
        '2026-10-28',
        '2026-10-31',
        true,
        'Bilgilendirme tutanağı imzalatıldı.',
      ),
    ],
    gecmis: [
      h('Yeni Bildirildi', '2026-10-28'),
      h('İncelemede', '2026-10-28'),
      h('Aksiyon Bekliyor', '2026-10-28'),
      h('Aksiyon Alındı', '2026-10-31'),
      h('Kapatıldı', '2026-11-01', 'Tekrar gözlem yapıldı, uygunsuzluk görülmedi'),
    ],
  },
  {
    id: 'OL-336',
    tarih: '2026-10-27',
    saat: '09:40',
    firma: 'Akdeniz Metal San. ve Tic. A.Ş.',
    isyeri: 'Lojistik Merkez',
    bolum: 'Depo',
    tur: 'Maddi Hasar',
    baslik: 'Forklift raf ayaklığına çarptı',
    aciklama:
      'Depo B koridorunda forklift manevrası sırasında raf ayaklığına çarpıldı. Ayaklık koruyucusu deforme oldu, raf taşıma kapasitesi etkilenmedi ancak kontrol gerekiyor.',
    calisan: 'Deniz Koç',
    gorev: 'Sürücü',
    bildiren: 'Deniz Koç',
    yaralanma: false,
    maddiHasar: true,
    isKaybi: false,
    risk: 'Orta',
    durum: 'Aksiyon Bekliyor',
    sorumlu: 'Zeynep Arslan',
    ekler: [{ ad: 'raf-hasari.jpg', tur: 'Fotoğraf', boyut: '1,5 MB' }],
    ilkOnlemler: 'Hasarlı raf bölümü kullanıma kapatıldı.',
    duzelticiFaaliyet: 'Raf ayaklık koruyucusunun değişimi ve raf statik kontrolü.',
    aksiyonlar: [
      aksiyon(
        'AKS-111',
        'B koridoru raf ayaklık koruyucu değişimi + statik kontrol raporu',
        'Zeynep Arslan',
        '2026-10-27',
        '2026-11-01',
      ),
    ],
    gecmis: [
      h('Yeni Bildirildi', '2026-10-27'),
      h('İncelemede', '2026-10-27'),
      h('Aksiyon Bekliyor', '2026-10-28', 'Raf firmasından servis talebi açıldı'),
    ],
    notlar: 'Raf servis firması 6 Kasım için randevu verdi.',
  },
  {
    id: 'OL-335',
    tarih: '2026-10-26',
    saat: '08:15',
    firma: 'Akdeniz Metal San. ve Tic. A.Ş.',
    isyeri: 'Lojistik Merkez',
    bolum: 'Sevkiyat',
    tur: 'Ramak Kala',
    baslik: 'Sevkiyat rampasında kaygan zemin — düşme tehlikesi',
    aciklama:
      'Yağmur sonrası rampa yüzeyinde biriken su ve yapraklar nedeniyle yükleme yapan çalışan kayarak düşme tehlikesi geçirdi.',
    bildiren: 'Zeynep Arslan',
    yaralanma: false,
    maddiHasar: false,
    isKaybi: false,
    risk: 'Düşük',
    durum: 'Kapatıldı',
    sorumlu: 'Zeynep Arslan',
    ekler: [],
    ilkOnlemler: 'Rampa temizlendi, kaymaz paspas serildi.',
    aksiyonlar: [],
    gecmis: [
      h('Yeni Bildirildi', '2026-10-26'),
      h('İncelemede', '2026-10-26'),
      h('Kapatıldı', '2026-10-27', 'Drenaj kontrolü yapıldı, temizlik planına eklendi'),
    ],
  },
  {
    id: 'OL-334',
    tarih: '2026-10-24',
    saat: '13:20',
    firma: 'Teknik Bakım Ltd.',
    isyeri: 'Merkez Tesis',
    bolum: 'Elektrik Odası',
    tur: 'İş Kazası',
    baslik: 'Elektrik panosunda kontrolsüz enerji — çarpma',
    aciklama:
      'Bakım teknisyeni pano bakımı sırasında LOTO uygulanmadan enerjili baraya temas etti, hafif elektrik çarpması meydana geldi. Kontrol amaçlı hastaneye götürüldü.',
    calisan: 'Murat Özkan',
    tc: '1*********2',
    gorev: 'Bakım Teknisyeni',
    bildiren: 'Burak Yıldız',
    taniklar: 'Emre Şahin',
    yaralanma: true,
    maddiHasar: false,
    isKaybi: true,
    yaralanmaTuru: 'Çarpma',
    vucutBolgesi: 'El',
    sonuc: 'İş göremezlik raporu',
    risk: 'Kritik',
    durum: 'Kapatıldı',
    sorumlu: 'Tunahan Yılmaztürk',
    ekler: [
      { ad: 'loto-proseduru.pdf', tur: 'Belge', boyut: '420 KB' },
      { ad: 'pano-gorsel.jpg', tur: 'Fotoğraf', boyut: '1,9 MB' },
    ],
    ilkOnlemler: 'Pano devre dışı bırakıldı, tüm bakım işleri durduruldu.',
    duzelticiFaaliyet: 'LOTO prosedürü revizyonu ve tüm personele yeniden eğitim.',
    aksiyonlar: [
      aksiyon(
        'AKS-112',
        'LOTO prosedürünün revize edilmesi ve panolara kilit noktası eklenmesi',
        'Emre Şahin',
        '2026-10-24',
        '2026-10-28',
        true,
        'Prosedür revize edildi, 12 panoya kilit noktası eklendi.',
      ),
      aksiyon(
        'AKS-113',
        'Tüm bakım personeline LOTO uygulamalı eğitim',
        'Ayşe Kaya',
        '2026-10-25',
        '2026-10-30',
        true,
        'Eğitim tamamlandı, 18 kişi katıldı.',
      ),
    ],
    gecmis: [
      h('Yeni Bildirildi', '2026-10-24'),
      h('İncelemede', '2026-10-24', 'Kök neden: LOTO prosedürüne uyulmaması'),
      h('Aksiyon Bekliyor', '2026-10-25'),
      h('Aksiyon Alındı', '2026-10-30'),
      h('Kapatıldı', '2026-11-01', 'SGK bildirimi yapıldı, dosya arşivlendi'),
    ],
    notlar: 'İş kazası SGK\'ya 2 iş günü içinde bildirildi.',
  },
  {
    id: 'OL-333',
    tarih: '2026-10-22',
    saat: '17:10',
    firma: 'Akdeniz Metal San. ve Tic. A.Ş.',
    isyeri: 'Merkez Tesis',
    bolum: 'Montaj',
    tur: 'Tehlikeli Durum',
    baslik: 'Acil çıkış kapısı önünde malzeme istifi',
    aciklama:
      'Montaj hattı çıkışındaki acil çıkış kapısının önünde sevkiyatı bekleyen kasa istifi tespit edildi. Kapı erişimi tamamen engellenmişti.',
    bildiren: 'Tunahan Yılmaztürk',
    yaralanma: false,
    maddiHasar: false,
    isKaybi: false,
    risk: 'Orta',
    durum: 'Kapatıldı',
    sorumlu: 'Mehmet Demir',
    ekler: [{ ad: 'acil-cikis.jpg', tur: 'Fotoğraf', boyut: '1,6 MB' }],
    ilkOnlemler: 'İstif derhal kaldırıldı, bölge sorumlusuna uyarı yapıldı.',
    aksiyonlar: [
      aksiyon(
        'AKS-114',
        'Acil çıkış kapıları önüne zemin işaretleme ve günlük kontrol listesi maddesi',
        'Mehmet Demir',
        '2026-10-22',
        '2026-10-24',
        true,
        'Zemin işaretleme yapıldı, kontrol listesine eklendi.',
      ),
    ],
    gecmis: [
      h('Yeni Bildirildi', '2026-10-22'),
      h('İncelemede', '2026-10-22'),
      h('Aksiyon Bekliyor', '2026-10-22'),
      h('Aksiyon Alındı', '2026-10-24'),
      h('Kapatıldı', '2026-10-25'),
    ],
  },
  {
    id: 'OL-332',
    tarih: '2026-10-20',
    saat: '11:00',
    firma: 'Teknik Bakım Ltd.',
    isyeri: 'Merkez Tesis',
    bolum: 'Bakım',
    tur: 'Tehlikeli Davranış',
    baslik: 'Emniyet kemeri takmadan platform üzerinde çalışma',
    aciklama:
      'Bakım personeli 3,5 metre yükseklikteki platform üzerinde ankraj noktasına bağlanmadan çalışırken görüldü. Çalışma durduruldu.',
    bildiren: 'Tunahan Yılmaztürk',
    yaralanma: false,
    maddiHasar: false,
    isKaybi: false,
    risk: 'Yüksek',
    durum: 'Kapatıldı',
    sorumlu: 'Ayşe Kaya',
    ekler: [],
    ilkOnlemler: 'Çalışma durduruldu, personel platformdan indirildi.',
    duzelticiFaaliyet: 'Yüksekte çalışma izin formu revizyonu ve saha gözetimi.',
    aksiyonlar: [
      aksiyon(
        'AKS-115',
        'Yüksekte çalışma izin formu revizyonu',
        'Ayşe Kaya',
        '2026-10-20',
        '2026-10-25',
        true,
        'Form revize edildi, çift onay zorunluluğu eklendi.',
      ),
    ],
    gecmis: [
      h('Yeni Bildirildi', '2026-10-20'),
      h('İncelemede', '2026-10-20'),
      h('Aksiyon Bekliyor', '2026-10-21'),
      h('Aksiyon Alındı', '2026-10-25'),
      h('Kapatıldı', '2026-10-27'),
    ],
  },
  {
    id: 'OL-331',
    tarih: '2026-10-18',
    saat: '07:45',
    firma: 'Akdeniz Metal San. ve Tic. A.Ş.',
    isyeri: 'Merkez Tesis',
    bolum: 'Bakım',
    tur: 'Ramak Kala',
    baslik: 'Buhar hattı flanşında kaçak — yanık riski',
    aciklama:
      'Buhar dağıtım hattı flanş bağlantısında buhar kaçağı tespit edildi. Kaçak noktası geçiş yoluna yakın, temas halinde yanık riski oluşturuyor.',
    bildiren: 'Emre Şahin',
    yaralanma: false,
    maddiHasar: false,
    isKaybi: false,
    risk: 'Yüksek',
    durum: 'Kapatıldı',
    sorumlu: 'Emre Şahin',
    ekler: [{ ad: 'flans-kacak.jpg', tur: 'Fotoğraf', boyut: '2,0 MB' }],
    ilkOnlemler: 'Hat basıncı düşürüldü, bölge bariyerle kapatıldı.',
    duzelticiFaaliyet: 'Flanş conta değişimi ve hat izolasyon onarımı.',
    aksiyonlar: [
      aksiyon(
        'AKS-116',
        'Flanş conta değişimi ve izolasyon onarımı',
        'Emre Şahin',
        '2026-10-18',
        '2026-10-20',
        true,
        'Conta değişti, kaçak testi temiz.',
      ),
    ],
    gecmis: [
      h('Yeni Bildirildi', '2026-10-18'),
      h('İncelemede', '2026-10-18'),
      h('Aksiyon Bekliyor', '2026-10-18'),
      h('Aksiyon Alındı', '2026-10-20'),
      h('Kapatıldı', '2026-10-21'),
    ],
  },
  {
    id: 'OL-330',
    tarih: '2026-10-15',
    saat: '10:30',
    firma: 'Akdeniz Metal San. ve Tic. A.Ş.',
    isyeri: 'Lojistik Merkez',
    bolum: 'Depo',
    tur: 'İş Kazası',
    baslik: 'Depo işçisinde koli bandı bıçağıyla el kesik',
    aciklama:
      'Depo çalışanı koli açarken maket bıçağıyla sol el avuç içinden kesik aldı. İşyeri hemşiresi pansuman yaptı, 3 dikiş atıldı.',
    calisan: 'Selim Erden',
    tc: '4*********9',
    gorev: 'Depo Görevlisi',
    bildiren: 'Zeynep Arslan',
    yaralanma: true,
    maddiHasar: false,
    isKaybi: true,
    yaralanmaTuru: 'Kesik',
    vucutBolgesi: 'El',
    sonuc: 'Ayakta tedavi',
    risk: 'Orta',
    durum: 'Kapatıldı',
    sorumlu: 'Zeynep Arslan',
    ekler: [],
    ilkOnlemler: 'Pansuman yapıldı, sağlık kuruluşuna sevk edildi.',
    duzelticiFaaliyet: 'Emniyetli kutu açacağı (gizli bıçak) dağıtımı.',
    aksiyonlar: [
      aksiyon(
        'AKS-117',
        'Depo personeline emniyetli kutu açacağı temini ve maket bıçağı yasağı',
        'Zeynep Arslan',
        '2026-10-15',
        '2026-10-20',
        true,
        'Açacaklar dağıtıldı, duyuru yapıldı.',
      ),
    ],
    gecmis: [
      h('Yeni Bildirildi', '2026-10-15'),
      h('İncelemede', '2026-10-15'),
      h('Aksiyon Bekliyor', '2026-10-16'),
      h('Aksiyon Alındı', '2026-10-20'),
      h('Kapatıldı', '2026-10-22'),
    ],
  },
  {
    id: 'OL-329',
    tarih: '2026-10-09',
    saat: '14:55',
    firma: 'Akdeniz Metal San. ve Tic. A.Ş.',
    isyeri: 'Lojistik Merkez',
    bolum: 'Depo',
    tur: 'İş Kazası',
    baslik: 'Raf arasından malzeme düşmesi — omuz ezilmesi',
    aciklama:
      'Paletli malzeme rafa yerleştirilirken denge kaybıyla düştü, yakındaki çalışanın omzuna çarptı. Burkulma teşhisiyle 2 gün iş göremezlik verildi.',
    calisan: 'Kemal Ateş',
    tc: '5*********1',
    gorev: 'Depo Görevlisi',
    bildiren: 'Zeynep Arslan',
    yaralanma: true,
    maddiHasar: true,
    isKaybi: true,
    yaralanmaTuru: 'Ezilme',
    vucutBolgesi: 'Omuz',
    sonuc: 'Kayıp iş günü',
    risk: 'Yüksek',
    durum: 'Kapatıldı',
    sorumlu: 'Tunahan Yılmaztürk',
    ekler: [{ ad: 'sgk-bildirim.pdf', tur: 'Belge', boyut: '195 KB' }],
    ilkOnlemler: 'Çalışan revire alındı, raf bölümü kontrol edildi.',
    duzelticiFaaliyet: 'Raf yerleştirme prosedüründe ikinci kişi zorunluluğu.',
    aksiyonlar: [
      aksiyon(
        'AKS-118',
        'Raf yerleştirme işlerinde iki kişi kuralının prosedüre eklenmesi',
        'Zeynep Arslan',
        '2026-10-10',
        '2026-10-15',
        true,
        'Prosedür güncellendi, vardiya toplantısında duyuruldu.',
      ),
    ],
    gecmis: [
      h('Yeni Bildirildi', '2026-10-09'),
      h('İncelemede', '2026-10-10'),
      h('Aksiyon Bekliyor', '2026-10-10'),
      h('Aksiyon Alındı', '2026-10-15'),
      h('Kapatıldı', '2026-10-18', 'SGK bildirimi tamamlandı'),
    ],
  },
  {
    id: 'OL-328',
    tarih: '2026-10-05',
    saat: '09:00',
    firma: 'Akdeniz Metal San. ve Tic. A.Ş.',
    isyeri: 'Merkez Tesis',
    bolum: 'Pres Hattı',
    tur: 'Tehlikeli Durum',
    baslik: 'Pres hattı hidrolik yağ kaçağı — kayma riski',
    aciklama:
      'Pres-2 hidrolik ünitesi altında yağ birikintisi tespit edildi. Geçiş yoluna yakın olduğu için kayma riski oluşturuyor.',
    bildiren: 'Mehmet Demir',
    yaralanma: false,
    maddiHasar: false,
    isKaybi: false,
    risk: 'Düşük',
    durum: 'Kapatıldı',
    sorumlu: 'Emre Şahin',
    ekler: [],
    ilkOnlemler: 'Emici granül döküldü, bölge temizlendi.',
    aksiyonlar: [
      aksiyon(
        'AKS-119',
        'Pres-2 hidrolik hortum ve rakor değişimi',
        'Emre Şahin',
        '2026-10-05',
        '2026-10-08',
        true,
        'Rakor değişimi yapıldı, kaçak yok.',
      ),
    ],
    gecmis: [
      h('Yeni Bildirildi', '2026-10-05'),
      h('İncelemede', '2026-10-05'),
      h('Aksiyon Bekliyor', '2026-10-05'),
      h('Aksiyon Alındı', '2026-10-08'),
      h('Kapatıldı', '2026-10-09'),
    ],
  },
  {
    id: 'OL-327',
    tarih: '2026-09-28',
    saat: '15:50',
    firma: 'Güven Taşımacılık',
    isyeri: 'Lojistik Merkez',
    bolum: 'Sevkiyat',
    tur: 'Maddi Hasar',
    baslik: 'Sevkiyat aracı yük rampasına çarparak hasar verdi',
    aciklama:
      'Geri manevra yapan kamyon yük rampasının kauçuk tamponunu kopardı, beton kenarda çatlak oluştu. Rampa sınırlı kapasiteyle kullanılabilir durumda.',
    calisan: 'Deniz Koç',
    gorev: 'Sürücü',
    bildiren: 'Zeynep Arslan',
    yaralanma: false,
    maddiHasar: true,
    isKaybi: false,
    risk: 'Düşük',
    durum: 'Kapatıldı',
    sorumlu: 'Zeynep Arslan',
    ekler: [{ ad: 'rampa-hasar.jpg', tur: 'Fotoğraf', boyut: '2,3 MB' }],
    ilkOnlemler: 'Rampa yük sınırı işaretlendi.',
    duzelticiFaaliyet: 'Rampa tampon ve beton onarımı, araç kılavuz aynası montajı.',
    aksiyonlar: [
      aksiyon(
        'AKS-120',
        'Rampa tampon değişimi ve beton onarımı',
        'Emre Şahin',
        '2026-09-29',
        '2026-10-06',
        true,
        'Onarım tamamlandı.',
      ),
    ],
    gecmis: [
      h('Yeni Bildirildi', '2026-09-28'),
      h('İncelemede', '2026-09-29'),
      h('Aksiyon Bekliyor', '2026-09-29'),
      h('Aksiyon Alındı', '2026-10-06'),
      h('Kapatıldı', '2026-10-08'),
    ],
  },
  {
    id: 'OL-326',
    tarih: '2026-11-04',
    saat: '08:05',
    firma: 'Pro-Temiz Hizmetleri',
    isyeri: 'Merkez Tesis',
    bolum: 'Genel Alan',
    tur: 'Tehlikeli Durum',
    baslik: 'Islak zeminde uyarı levhası olmadan temizlik',
    aciklama:
      'Kantin önünde temizlik görevlisi ıslak zeminde kayma uyarı levhası kullanmadan çalışıyor. Sabah yoğun geçiş saatinde düşme riski var.',
    bildiren: 'Ayşe Kaya',
    yaralanma: false,
    maddiHasar: false,
    isKaybi: false,
    risk: 'Düşük',
    durum: 'Yeni Bildirildi',
    sorumlu: 'Ayşe Kaya',
    ekler: [],
    aksiyonlar: [],
    gecmis: [h('Yeni Bildirildi', '2026-11-04', 'Saha turunda tespit edildi')],
  },
]
