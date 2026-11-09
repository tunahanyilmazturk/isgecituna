/*
 * Risk Değerlendirme — veri modeli ve seed kayıtlar.
 * Üretimde karşılığı: risk_assessments, risk_assessment_revisions,
 * risk_assessment_members, risk_assessment_approvals, risk_hazards,
 * risk_actions, risk_action_attachments, risk_action_history,
 * risk_assessment_methodologies.
 *
 * Önemli: risk puanı her zaman olasılık × şiddet olarak hesaplanır; istemciden
 * gelen puan/seviye alanları güvenilmez sayılır, store katmanında yeniden
 * hesaplanır. Eşikler yöntem başına yapılandırılabilir ve değerlendirme
 * oluşturulurken donmuş kopyası saklanır — yöntem sonradan değişse bile
 * yayımlanmış değerlendirme etkilenmez.
 */
import { TODAY } from '@/data/dashboard'
import type { TehlikeSinifi } from '@/data/firmalar'

/* ------------------------------ Değerlendirme ----------------------------- */

export type RiskDurum = 'Taslak' | 'İncelemede' | 'Onaylandı' | 'Revize Edilmeli' | 'Süresi Doldu'
export const RISK_DURUMLAR: RiskDurum[] = ['Taslak', 'İncelemede', 'Onaylandı', 'Revize Edilmeli', 'Süresi Doldu']

export type RiskSeviye = 'Düşük' | 'Orta' | 'Yüksek' | 'Çok Yüksek'
export const RISK_SEVIYELERI: RiskSeviye[] = ['Düşük', 'Orta', 'Yüksek', 'Çok Yüksek']

export const seviyeRenk: Record<RiskSeviye, { bg: string; text: string; hex: string }> = {
  'Düşük': { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', hex: '#10B981' },
  'Orta': { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', hex: '#F59E0B' },
  'Yüksek': { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', hex: '#F97316' },
  'Çok Yüksek': { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', hex: '#EF4444' },
}

export const riskDurumRenk: Record<RiskDurum, string> = {
  'Taslak': 'bg-zinc-500/10 text-zinc-500',
  'İncelemede': 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  'Onaylandı': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'Revize Edilmeli': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  'Süresi Doldu': 'bg-red-500/10 text-red-500',
}

export interface EkipUye {
  adSoyad: string
  rol: string // 'İSG Uzmanı' | 'İşyeri Hekimi' | 'İşveren Vekili' | 'Çalışan Temsilcisi' | 'Destek Elemanı'
}

export interface OnayKaydi {
  tarih: string
  kullanici: string
  islem: 'İncelemeye Gönderildi' | 'Onaylandı' | 'Revize İstendi' | 'Taslağa Alındı'
  not?: string
}

export interface RiskOlay {
  tarih: string
  kullanici: string
  islem: string
  not?: string
}

/** Onaylanmış sürümün donmuş özeti — eski değerlendirme içeriği korunur */
export interface RevizyonKaydi {
  surum: number
  tarih: string
  kullanici: string
  sebep: string
  tehlikeSayisi: number
  aksiyonSayisi: number
  durum: RiskDurum
}

export interface RiskEsik {
  seviye: RiskSeviye
  min: number
  max: number
}

export interface RiskDegerlendirme {
  id: string // RD-xxxx
  ad: string
  firmaId: string
  // Firma bilgilerinin donmuş görüntüsü — firma kartı değişse de belge korunur
  firmaAd: string
  tehlikeSinifi: TehlikeSinifi | ''
  nace: string
  faaliyet: string
  isyeriAd: string
  adres: string
  calisanSayisi: number
  isveren: string
  isverenVekili?: string
  ekip: EkipUye[]
  yontemId: string
  /** Oluşturulma anındaki eşik kopyası — yöntem değişse de değerlendirme sabit */
  esikler: RiskEsik[]
  degerlendirmeTarihi: string
  yenilemeTarihi: string
  durum: RiskDurum
  surum: number
  revizyonlar: RevizyonKaydi[]
  onaylar: OnayKaydi[]
  olusturan: string
  olusturma: string
  guncelleme: string
  gecmis: RiskOlay[]
}

/* -------------------------------- Tehlike --------------------------------- */

export interface RiskTehlike {
  id: string // TH-xxxx
  degerlendirmeId: string
  bolum: string
  faaliyet: string
  kaynak: string
  aciklama: string
  olasiRisk: string
  etkilenenler: string
  mevcutOnlemler: string
  olasiSonuclar: string
  yontemId: string
  olasilik: number // 1–5
  siddet: number // 1–5
  puan: number // olasilik × siddet — sunucuda yeniden hesaplanır
  seviye: RiskSeviye // eşiklerden türetilir
  /** "Alınması gereken ek önlemler" serbest metni — aksiyonlara dönüştürülebilir */
  ekOnlemler?: string
  silindi?: boolean // soft delete — geçmiş ve PDF bütünlüğü korunur
}

/* -------------------------------- Aksiyon --------------------------------- */

export type AksiyonDurum = 'Bekliyor' | 'Devam Ediyor' | 'Kontrol Bekliyor' | 'Tamamlandı' | 'İptal Edildi'
export const AKSIYON_DURUMLAR: AksiyonDurum[] = ['Bekliyor', 'Devam Ediyor', 'Kontrol Bekliyor', 'Tamamlandı', 'İptal Edildi']

export type AksiyonOncelik = 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'
export const AKSIYON_ONCELIKLER: AksiyonOncelik[] = ['Düşük', 'Orta', 'Yüksek', 'Kritik']

export const aksiyonDurumRenk: Record<AksiyonDurum, string> = {
  'Bekliyor': 'bg-zinc-500/10 text-zinc-500',
  'Devam Ediyor': 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  'Kontrol Bekliyor': 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  'Tamamlandı': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'İptal Edildi': 'bg-zinc-500/10 text-zinc-400',
}

export const oncelikRenk: Record<AksiyonOncelik, string> = {
  'Düşük': 'bg-zinc-500/10 text-zinc-500',
  'Orta': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'Yüksek': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  'Kritik': 'bg-red-500/10 text-red-500',
}

/** Dosya meta verisi — prototip: gerçek binary yerine ad/boyut saklanır */
export interface AksiyonEk {
  id: string
  ad: string
  boyut: number
  tur: 'belge' | 'fotograf'
  tarih: string
  ekleyen: string
}

/** Aksiyonun kaynağı — 'risk' (risk değerlendirme) veya 'denetim' (saha denetimi bulgusu) */
export interface AksiyonKaynak {
  tur: 'risk' | 'denetim'
  denetimId?: string
  denetimNo?: string
  bulguId?: string
}

export interface RiskAksiyon {
  id: string // AK-xxxx
  /** Risk değerlendirme kaynaklıysa dolu; denetim kaynaklı aksiyonlarda boş */
  degerlendirmeId?: string
  tehlikeId?: string
  /** Kaynak izleme — denetim bulgusundan üretilen aksiyonlar için bağlantı */
  kaynak?: AksiyonKaynak
  firmaId: string // tenant filtreleri için denormalize — firmaAd snap'i
  firmaAd: string
  baslik: string
  aciklama?: string
  sorumluId: string // personel/hesap id'si
  sorumluAd: string
  oncelik: AksiyonOncelik
  baslangicTarihi: string
  hedefTarih: string
  durum: AksiyonDurum
  tamamlanmaNotu?: string
  tamamlanmaTarihi?: string
  tamamlayan?: string
  dosyalar: AksiyonEk[]
  olusturan: string
  olusturma: string
  gecmis: RiskOlay[]
}

/* --------------------------------- Yöntem --------------------------------- */

/** Değerlendirme yöntemi — ileride Fine-Kinney vb. eklenebilir mimari */
export interface RiskYontem {
  id: string
  ad: string
  tur: 'matris' // 'fine-kinney' ileride
  olasilikMax: number
  siddetMax: number
  olasilikEtiketler: Record<number, string>
  siddetEtiketler: Record<number, string>
  esikler: RiskEsik[]
  aciklama: string
}

/** Puan = olasılık × şiddet; seviye eşik tablosundan türetilir */
export const puanHesap = (olasilik: number, siddet: number) => olasilik * siddet

export const seviyeHesap = (puan: number, esikler: RiskEsik[]): RiskSeviye =>
  esikler.find((e) => puan >= e.min && puan <= e.max)?.seviye ?? 'Çok Yüksek'

export const yontemSeed: RiskYontem[] = [
  {
    id: 'YM-L5x5',
    ad: '5×5 L Tipi Matris',
    tur: 'matris',
    olasilikMax: 5,
    siddetMax: 5,
    olasilikEtiketler: { 1: 'Çok Düşük', 2: 'Düşük', 3: 'Orta', 4: 'Yüksek', 5: 'Çok Yüksek' },
    siddetEtiketler: { 1: 'Çok Hafif', 2: 'Hafif', 3: 'Orta', 4: 'Ciddi', 5: 'Çok Ciddi' },
    // Varsayılan eşikler — değerlendirme bazında özelleştirilebilir; mevzuat
    // gereklilikleri işyeri koşullarına göre değişir, sabit kabul edilmez.
    esikler: [
      { seviye: 'Düşük', min: 1, max: 6 },
      { seviye: 'Orta', min: 7, max: 12 },
      { seviye: 'Yüksek', min: 13, max: 17 },
      { seviye: 'Çok Yüksek', min: 18, max: 25 },
    ],
    aciklama: 'Olasılık × Şiddet matrisi. Risk puanı 1–25 aralığında hesaplanır; seviye eşikleri değerlendirme bazında yapılandırılabilir.',
  },
]

/* -------------------------------- Seed ------------------------------------ */

const olay = (tarih: string, kullanici: string, islem: string, not?: string): RiskOlay => ({ tarih, kullanici, islem, not })

export const riskSeed: RiskDegerlendirme[] = [
  {
    id: 'RD-01',
    ad: '2026 Üretim Sahası Risk Değerlendirmesi',
    firmaId: 'FR-01',
    firmaAd: 'Akdeniz Metal San. ve Tic. A.Ş.',
    tehlikeSinifi: 'Tehlikeli',
    nace: '25.61',
    faaliyet: 'Metal eşya yüzey işleme ve kaplama',
    isyeriAd: 'Akdeniz Metal — Ana Fabrika',
    adres: 'OSB 4. Cadde No:12, Nilüfer / Bursa',
    calisanSayisi: 42,
    isveren: 'Hakan Ünal',
    isverenVekili: 'Selim Arslan',
    ekip: [
      { adSoyad: 'Tunahan Yılmaztürk', rol: 'İSG Uzmanı' },
      { adSoyad: 'Dr. Leyla Koç', rol: 'İşyeri Hekimi' },
      { adSoyad: 'Selim Arslan', rol: 'İşveren Vekili' },
      { adSoyad: 'Ramazan Tekin', rol: 'Çalışan Temsilcisi' },
    ],
    yontemId: 'YM-L5x5',
    esikler: yontemSeed[0].esikler,
    degerlendirmeTarihi: '2026-09-15',
    yenilemeTarihi: '2028-09-15',
    durum: 'Onaylandı',
    surum: 1,
    revizyonlar: [],
    onaylar: [
      { tarih: '2026-09-20', kullanici: 'Tunahan Yılmaztürk', islem: 'İncelemeye Gönderildi' },
      { tarih: '2026-09-22', kullanici: 'Hakan Ünal', islem: 'Onaylandı' },
    ],
    olusturan: 'Tunahan Yılmaztürk',
    olusturma: '2026-09-15',
    guncelleme: '2026-09-22',
    gecmis: [
      olay('2026-09-15', 'Tunahan Yılmaztürk', 'Değerlendirme oluşturuldu'),
      olay('2026-09-20', 'Tunahan Yılmaztürk', 'İncelemeye gönderildi'),
      olay('2026-09-22', 'Hakan Ünal', 'Onaylandı — sürüm 1 yayımlandı'),
    ],
  },
  {
    id: 'RD-02',
    ad: '2026 Depo ve Lojistik Risk Değerlendirmesi',
    firmaId: 'FR-02',
    firmaAd: 'Nova Lojistik Ltd.',
    tehlikeSinifi: 'Çok Tehlikeli',
    nace: '52.10',
    faaliyet: 'Depolama ve antrepo hizmetleri',
    isyeriAd: 'Nova Lojistik — Merkez Depo',
    adres: 'Ankara Yolu 18. km, Gebze / Kocaeli',
    calisanSayisi: 67,
    isveren: 'Bora Yıldız',
    ekip: [
      { adSoyad: 'Tunahan Yılmaztürk', rol: 'İSG Uzmanı' },
      { adSoyad: 'Pınar Doğan', rol: 'DSP' },
      { adSoyad: 'Murat Ekinci', rol: 'Çalışan Temsilcisi' },
    ],
    yontemId: 'YM-L5x5',
    esikler: yontemSeed[0].esikler,
    degerlendirmeTarihi: '2026-10-28',
    yenilemeTarihi: '2028-10-28',
    durum: 'İncelemede',
    surum: 1,
    revizyonlar: [],
    onaylar: [{ tarih: '2026-10-30', kullanici: 'Tunahan Yılmaztürk', islem: 'İncelemeye Gönderildi' }],
    olusturan: 'Tunahan Yılmaztürk',
    olusturma: '2026-10-28',
    guncelleme: '2026-10-30',
    gecmis: [
      olay('2026-10-28', 'Tunahan Yılmaztürk', 'Değerlendirme oluşturuldu'),
      olay('2026-10-30', 'Tunahan Yılmaztürk', 'İncelemeye gönderildi'),
    ],
  },
  {
    id: 'RD-03',
    ad: '2025 Şantiye Risk Değerlendirmesi',
    firmaId: 'FR-03',
    firmaAd: 'Polat İnşaat A.Ş.',
    tehlikeSinifi: 'Çok Tehlikeli',
    nace: '41.20',
    faaliyet: 'Konut ve konut dışı bina inşaatı',
    isyeriAd: 'Polat İnşaat — Göktürk Şantiyesi',
    adres: 'Göktürk Mah. Cendere Cad., Eyüpsultan / İstanbul',
    calisanSayisi: 118,
    isveren: 'Kerem Polat',
    isverenVekili: 'Osman Tiryaki',
    ekip: [
      { adSoyad: 'Tunahan Yılmaztürk', rol: 'İSG Uzmanı' },
      { adSoyad: 'Dr. Leyla Koç', rol: 'İşyeri Hekimi' },
      { adSoyad: 'Osman Tiryaki', rol: 'İşveren Vekili' },
    ],
    yontemId: 'YM-L5x5',
    esikler: yontemSeed[0].esikler,
    degerlendirmeTarihi: '2025-03-10',
    yenilemeTarihi: '2026-03-10', // süresi geçmiş — yenileme bekliyor
    durum: 'Onaylandı',
    surum: 2,
    revizyonlar: [
      { surum: 1, tarih: '2025-03-10', kullanici: 'Tunahan Yılmaztürk', sebep: 'İlk yayın', tehlikeSayisi: 4, aksiyonSayisi: 3, durum: 'Onaylandı' },
    ],
    onaylar: [
      { tarih: '2025-03-08', kullanici: 'Tunahan Yılmaztürk', islem: 'İncelemeye Gönderildi' },
      { tarih: '2025-03-10', kullanici: 'Kerem Polat', islem: 'Onaylandı' },
    ],
    olusturan: 'Tunahan Yılmaztürk',
    olusturma: '2025-02-28',
    guncelleme: '2026-04-12',
    gecmis: [
      olay('2025-02-28', 'Tunahan Yılmaztürk', 'Değerlendirme oluşturuldu'),
      olay('2025-03-10', 'Kerem Polat', 'Onaylandı — sürüm 1 yayımlandı'),
      olay('2026-04-12', 'Tunahan Yılmaztürk', 'Revizyon — yeni bölüm eklendi, sürüm 2'),
    ],
  },
  {
    id: 'RD-04',
    ad: '2026 Ofis ve İdari Birimler Değerlendirmesi',
    firmaId: 'FR-01',
    firmaAd: 'Akdeniz Metal San. ve Tic. A.Ş.',
    tehlikeSinifi: 'Az Tehlikeli',
    nace: '25.61',
    faaliyet: 'İdari ofis birimleri',
    isyeriAd: 'Akdeniz Metal — Yönetim Binası',
    adres: 'OSB 4. Cadde No:12, Nilüfer / Bursa',
    calisanSayisi: 11,
    isveren: 'Hakan Ünal',
    ekip: [{ adSoyad: 'Pınar Doğan', rol: 'İSG Uzmanı' }],
    yontemId: 'YM-L5x5',
    esikler: yontemSeed[0].esikler,
    degerlendirmeTarihi: '2026-11-01',
    yenilemeTarihi: '2032-11-01',
    durum: 'Taslak',
    surum: 1,
    revizyonlar: [],
    onaylar: [],
    olusturan: 'Pınar Doğan',
    olusturma: '2026-11-01',
    guncelleme: '2026-11-01',
    gecmis: [olay('2026-11-01', 'Pınar Doğan', 'Değerlendirme taslağı oluşturuldu')],
  },
]

const th = (p: Omit<RiskTehlike, 'puan' | 'seviye' | 'yontemId'>): RiskTehlike => {
  const puan = puanHesap(p.olasilik, p.siddet)
  return { ...p, yontemId: 'YM-L5x5', puan, seviye: seviyeHesap(puan, yontemSeed[0].esikler) }
}

export const tehlikeSeed: RiskTehlike[] = [
  th({ id: 'TH-01', degerlendirmeId: 'RD-01', bolum: 'Üretim — Pres Hattı', faaliyet: 'Hidrolik pres ile sac şekillendirme', kaynak: 'Koruyucusuz pres kalıbı', aciklama: 'Kalıp bölgesine el ile müdahale sırasında sıkışma riski', olasiRisk: 'El / parmak ezilmesi ve ampütasyon', etkilenenler: 'Pres operatörleri (3 kişi)', mevcutOnlemler: 'İki el kumanda butonu mevcut; acil stop aktif', olasiSonuclar: 'Kalıcı uzuv kaybı, uzun süreli iş göremezlik', olasilik: 3, siddet: 5, ekOnlemler: 'Işık perdesi (light curtain) montajı ve aylık fonksiyon testi' }),
  th({ id: 'TH-02', degerlendirmeId: 'RD-01', bolum: 'Üretim — Kaynak Bölümü', faaliyet: 'MIG/MAG kaynak işlemleri', kaynak: 'Kaynak dumanı ve UV ışınımı', aciklama: 'Havalandırması yetersiz bölgede kaynak dumanı solunması', olasiRisk: 'Solunum yolu hastalıkları, metal duman ateşi', etkilenenler: 'Kaynakçılar (5 kişi)', mevcutOnlemler: 'Genel havalandırma; FFP2 maske dağıtımı', olasiSonuclar: 'Meslek hastalığı, kronik solunum yetmezliği', olasilik: 4, siddet: 3, ekOnlemler: 'Nokta emişli davlumbaz kurulumu; kaynakçılara periyodik solunum testi' }),
  th({ id: 'TH-03', degerlendirmeId: 'RD-01', bolum: 'Elektrik Odası', faaliyet: 'Elektrik pano bakımı', kaynak: 'Enerjili pano üzerinde bakım', aciklama: 'Yetkisiz personelin pano kapağını açması olasılığı', olasiRisk: 'Elektrik çarpması, ark flaşı yanığı', etkilenenler: 'Bakım ekibi, çevredeki çalışanlar', mevcutOnlemler: 'Pano kapıları kilitli; yetkili elektrikçi tanımlı', olasiSonuclar: 'Ölüm, ağır yanık', olasilik: 2, siddet: 5, ekOnlemler: 'LOTO (kilit-etiket) prosedürü yazılı hâle getirilecek; yetkisiz erişim uyarı levhaları' }),
  th({ id: 'TH-04', degerlendirmeId: 'RD-01', bolum: 'Boyahane', faaliyet: 'Solvent bazlı boya uygulaması', kaynak: 'Yanıcı solvent buharı birikimi', aciklama: 'Yetersiz havalandırmada patlayıcı atmosfer oluşumu', olasiRisk: 'Yangın / patlama, kimyasal zehirlenme', etkilenenler: 'Boyahane çalışanları (4 kişi)', mevcutOnlemler: 'Ex-proof elektrik tesisatı; yangın tüpleri', olasiSonuclar: 'Toplu yaralanma, tesis hasarı', olasilik: 2, siddet: 4 }),
  th({ id: 'TH-05', degerlendirmeId: 'RD-02', bolum: 'Depo — Raf Sistemleri', faaliyet: 'Forklift ile palet istifleme', kaynak: 'Hasarlı raf traversi', aciklama: 'Darbeye bağlı hasar gören raf traverslerinin değiştirilmemesi', olasiRisk: 'Raf çökmesi, yük düşmesi', etkilenenler: 'Depo operatörleri (12 kişi)', mevcutOnlemler: 'Yıllık görsel kontrol', olasiSonuclar: 'Ezilme, ağır yaralanma', olasilik: 3, siddet: 4, ekOnlemler: 'Aylık raf kontrol programı; hasar raporlama prosedürü; travers koruyucu montajı' }),
  th({ id: 'TH-06', degerlendirmeId: 'RD-02', bolum: 'Depo — Saha', faaliyet: 'Yaya ve forklift ortak kullanım alanı', kaynak: 'Yaya-forklift çakışması', aciklama: 'Yaya yollarının forklift güzergâhıyla kesişmesi', olasiRisk: 'Çarpma, sıkışma, ezilme', etkilenenler: 'Tüm depo personeli', mevcutOnlemler: 'Zemin çizgileri kısmen mevcut', olasiSonuclar: 'Ölüm, ağır yaralanma', olasilik: 4, siddet: 5, ekOnlemler: 'Fiziksel yaya bariyerleri; kör nokta aynaları; forklift hız limiti (10 km/s)' }),
  th({ id: 'TH-07', degerlendirmeId: 'RD-03', bolum: 'Şantiye — İskele', faaliyet: 'Dış cephe iskele çalışması', kaynak: 'Korkuluk ve topuk levhası eksikliği', aciklama: '3. kat iskele platformunda korkuluk eksik', olasiRisk: 'Yüksekten düşme', etkilenenler: 'Cephe ustaları (8 kişi)', mevcutOnlemler: 'Emniyet kemeri dağıtıldı; ankraj noktası sınırlı', olasiSonuclar: 'Ölüm, omurga hasarı', olasilik: 3, siddet: 5, ekOnlemler: 'Tüm platformlara ara korkuluk + topuk levhası; iskele haftalık kontrol formu; ek ankraj noktaları' }),
  th({ id: 'TH-08', degerlendirmeId: 'RD-03', bolum: 'Şantiye — Derin Kazı', faaliyet: 'Temel hafriyat çalışması', kaynak: 'İksasız derin kazı', aciklama: '2,8 m derinlikte iksasız kazıda göçme olasılığı', olasiRisk: 'Göçük altında kalma, boğulma', etkilenenler: 'Hafriyat ekibi (6 kişi)', mevcutOnlemler: 'Kazı kenarına şerit çekildi', olasiSonuclar: 'Ölüm', olasilik: 2, siddet: 5 }),
  th({ id: 'TH-09', degerlendirmeId: 'RD-04', bolum: 'Ofis — 2. Kat', faaliyet: 'Ofis çalışma düzeni', kaynak: 'Yangın çıkış kapısının kilitli tutulması', aciklama: 'Gece vardiyasında çıkış kapısı kilitli bulunduğu tespit edildi', olasiRisk: 'Acil tahliyede gecikme, panik', etkilenenler: 'Ofis personeli (11 kişi)', mevcutOnlemler: 'Yangın alarm sistemi aktif', olasiSonuclar: 'Yaralanma, ölüm', olasilik: 2, siddet: 4, ekOnlemler: 'Panik bar kilit sistemi; günlük çıkış kontrolü' }),
]

const ak = (p: Omit<RiskAksiyon, 'gecmis' | 'dosyalar' | 'olusturma'> & Partial<Pick<RiskAksiyon, 'gecmis' | 'dosyalar'>>): RiskAksiyon => ({
  ...p,
  dosyalar: p.dosyalar ?? [],
  olusturma: p.baslangicTarihi,
  gecmis: [olay(p.baslangicTarihi, p.olusturan, 'Aksiyon oluşturuldu'), ...(p.gecmis ?? [])],
})

export const aksiyonSeed: RiskAksiyon[] = [
  ak({ id: 'AK-01', degerlendirmeId: 'RD-01', tehlikeId: 'TH-01', firmaId: 'FR-01', firmaAd: 'Akdeniz Metal San. ve Tic. A.Ş.', baslik: 'Pres hattına ışık perdesi montajı', aciklama: 'Hidrolik preslerin kalıp bölgesine tip-4 ışık perdesi takılması ve PLC entegrasyonu.', sorumluId: 'FP-02', sorumluAd: 'Elif Şahin', oncelik: 'Kritik', baslangicTarihi: '2026-09-25', hedefTarih: '2026-10-25', durum: 'Devam Ediyor', olusturan: 'Tunahan Yılmaztürk', gecmis: [olay('2026-10-05', 'Elif Şahin', 'Çalışma başlatıldı — tedarikçi siparişi verildi')] }),
  ak({ id: 'AK-02', degerlendirmeId: 'RD-01', tehlikeId: 'TH-02', firmaId: 'FR-01', firmaAd: 'Akdeniz Metal San. ve Tic. A.Ş.', baslik: 'Kaynak bölümüne nokta emiş sistemi', aciklama: 'Her kaynak istasyonuna hareketli emiş kolu (davlumbaz) kurulumu.', sorumluId: 'FP-02', sorumluAd: 'Elif Şahin', oncelik: 'Yüksek', baslangicTarihi: '2026-09-25', hedefTarih: '2026-11-30', durum: 'Bekliyor', olusturan: 'Tunahan Yılmaztürk' }),
  ak({ id: 'AK-03', degerlendirmeId: 'RD-01', tehlikeId: 'TH-03', firmaId: 'FR-01', firmaAd: 'Akdeniz Metal San. ve Tic. A.Ş.', baslik: 'LOTO prosedürü dokümanı ve eğitim', aciklama: 'Enerji izolasyonu (kilit-etiket) prosedürünün yazılması ve bakım ekibine eğitim verilmesi.', sorumluId: 'FP-01', sorumluAd: 'Cem Demir', oncelik: 'Yüksek', baslangicTarihi: '2026-09-25', hedefTarih: '2026-10-15', durum: 'Kontrol Bekliyor', tamamlanmaNotu: 'Prosedür yazıldı, 8 bakım personeline uygulamalı eğitim verildi. Eğitim tutanağı eklendi.', tamamlayan: 'Cem Demir', olusturan: 'Tunahan Yılmaztürk', dosyalar: [{ id: 'EK-1', ad: 'loto-egitim-tutanagi.pdf', boyut: 184_320, tur: 'belge', tarih: '2026-10-14', ekleyen: 'Cem Demir' }], gecmis: [olay('2026-10-14', 'Cem Demir', 'Tamamlanma bildirildi — kontrol bekliyor')] }),
  ak({ id: 'AK-04', degerlendirmeId: 'RD-02', tehlikeId: 'TH-05', firmaId: 'FR-02', firmaAd: 'Nova Lojistik Ltd.', baslik: 'Raf travers kontrol programı', aciklama: 'Aylık raf bütünlüğü kontrol formu oluşturulması ve hasarlı traverslerin değişimi.', sorumluId: 'FP-05', sorumluAd: 'Burak Koç', oncelik: 'Yüksek', baslangicTarihi: '2026-10-30', hedefTarih: '2026-11-02', durum: 'Devam Ediyor', olusturan: 'Tunahan Yılmaztürk' }), // gecikmiş
  ak({ id: 'AK-05', degerlendirmeId: 'RD-02', tehlikeId: 'TH-06', firmaId: 'FR-02', firmaAd: 'Nova Lojistik Ltd.', baslik: 'Yaya bariyerleri ve hız limiti', aciklama: 'Ana koridorlara fiziksel yaya bariyeri kurulumu; forklift hız limiti levhaları ve uyarı sistemi.', sorumluId: 'FP-06', sorumluAd: 'Selin Öztürk', oncelik: 'Kritik', baslangicTarihi: '2026-10-30', hedefTarih: '2026-10-30', durum: 'Bekliyor', olusturan: 'Tunahan Yılmaztürk' }), // gecikmiş
  ak({ id: 'AK-06', degerlendirmeId: 'RD-03', tehlikeId: 'TH-07', firmaId: 'FR-03', firmaAd: 'Polat İnşaat A.Ş.', baslik: 'İskele korkuluk eksiklerinin giderilmesi', aciklama: '3. kat platform dahil tüm iskele platformlarına ara korkuluk ve topuk levhası montajı.', sorumluId: 'FP-07', sorumluAd: 'Emre Kurt', oncelik: 'Kritik', baslangicTarihi: '2025-03-12', hedefTarih: '2025-03-20', durum: 'Tamamlandı', tamamlanmaNotu: 'Tüm platformlar kontrol edilerek eksikler giderildi; fotoğraflar eklendi.', tamamlanmaTarihi: '2025-03-18', tamamlayan: 'Emre Kurt', olusturan: 'Tunahan Yılmaztürk', dosyalar: [{ id: 'EK-2', ad: 'iskele-korkuluk-sonrasi.jpg', boyut: 2_140_928, tur: 'fotograf', tarih: '2025-03-18', ekleyen: 'Emre Kurt' }], gecmis: [olay('2025-03-18', 'Emre Kurt', 'Aksiyon tamamlandı', 'Kanıt fotoğrafı eklendi')] }),
  ak({ id: 'AK-07', degerlendirmeId: 'RD-03', tehlikeId: 'TH-08', firmaId: 'FR-03', firmaAd: 'Polat İnşaat A.Ş.', baslik: 'Derin kazıda iksa uygulaması', aciklama: '1,5 m üzeri kazılarda iksa/şev açısı zorunluluğu; saha formenine talimat.', sorumluId: 'FP-07', sorumluAd: 'Emre Kurt', oncelik: 'Kritik', baslangicTarihi: '2025-03-12', hedefTarih: '2025-03-25', durum: 'Tamamlandı', tamamlanmaNotu: 'İksa panelleri temin edilip monte edildi; saha kontrol formu devreye alındı.', tamamlanmaTarihi: '2025-03-24', tamamlayan: 'Emre Kurt', olusturan: 'Tunahan Yılmaztürk', gecmis: [olay('2025-03-24', 'Emre Kurt', 'Aksiyon tamamlandı')] }),
  ak({ id: 'AK-08', degerlendirmeId: 'RD-03', tehlikeId: 'TH-07', firmaId: 'FR-03', firmaAd: 'Polat İnşaat A.Ş.', baslik: 'İskele haftalık kontrol formu devreye alma', aciklama: 'Etiketli iskele kontrol sistemi: haftalık form + yeşil/kırmızı iskele kartı.', sorumluId: 'FP-08', sorumluAd: 'Aylin Doğan', oncelik: 'Orta', baslangicTarihi: '2025-04-01', hedefTarih: '2025-05-01', durum: 'İptal Edildi', olusturan: 'Tunahan Yılmaztürk', gecmis: [olay('2025-04-20', 'Tunahan Yılmaztürk', 'Aksiyon iptal edildi', 'Proje kapsamı değişti — iskele sistemi komple yenilendi')] }),
  // Denetim bulgularından üretilen aksiyonlar — merkezi modelin denetim kaynağı
  ak({ id: 'AK-DEN-01', kaynak: { tur: 'denetim', denetimId: 'DN-002', denetimNo: 'DN-2026-002', bulguId: 'BLG-002' }, tehlikeId: 'TH-03', firmaId: 'FR-02', firmaAd: 'Nova Lojistik Ltd.', baslik: 'DP-3 pano kapağı ve kilit mekanizması onarımı', aciklama: 'Denetimde tespit edildi: Depo A koridor DP-3 panosu açık — kilitli kapağa dönüştürülecek.', sorumluId: 'FP-05', sorumluAd: 'Burak Koç', oncelik: 'Kritik', baslangicTarihi: '2026-11-04', hedefTarih: '2026-11-08', durum: 'Devam Ediyor', olusturan: 'Tunahan Yılmaztürk', gecmis: [olay('2026-11-04', 'Tunahan Yılmaztürk', 'Aksiyon oluşturuldu — denetim bulgusu DN-2026-002')] }),
  ak({ id: 'AK-DEN-02', kaynak: { tur: 'denetim', denetimId: 'DN-003', denetimNo: 'DN-2026-003', bulguId: 'BLG-003' }, tehlikeId: 'TH-01', firmaId: 'FR-01', firmaAd: 'Akdeniz Metal San. ve Tic. A.Ş.', baslik: 'Pres-2 kalıp koruyucusunun montajı', aciklama: 'Denetimde tespit edildi: Pres-2 kalıp koruyucusu sökülmüş — monte edilene dek makine kullanım dışı.', sorumluId: 'FP-01', sorumluAd: 'Cem Demir', oncelik: 'Kritik', baslangicTarihi: '2026-10-28', hedefTarih: '2026-11-01', durum: 'Kontrol Bekliyor', tamamlanmaNotu: 'Koruyucu monte edildi, fonksiyon testi yapıldı.', tamamlayan: 'Cem Demir', olusturan: 'Tunahan Yılmaztürk', gecmis: [olay('2026-11-01', 'Cem Demir', 'Tamamlanma bildirildi — kontrol bekliyor')] }),
]

/* ------------------------------- Yardımcılar ------------------------------ */

/** Saklı durumdan bağımsız görünen durum — yenileme tarihi geçmiş onaylı değerlendirme "Süresi Doldu" gösterir */
export const guncelDurum = (d: RiskDegerlendirme): RiskDurum =>
  d.durum === 'Onaylandı' && d.yenilemeTarihi < TODAY ? 'Süresi Doldu' : d.durum

/** Açık aksiyon durumları — gecikme hesabı bunlar üzerinden yapılır */
export const aksiyonAcik = (a: RiskAksiyon) => a.durum === 'Bekliyor' || a.durum === 'Devam Ediyor' || a.durum === 'Kontrol Bekliyor'

export const aksiyonGecikmis = (a: RiskAksiyon) => aksiyonAcik(a) && a.hedefTarih < TODAY

/** Yenileme 60 gün içinde yaklaşıyor — hatırlatma eşiği yapılandırılabilir tasarlandı */
export const YENILEME_UYARI_GUN = 60
export const yenilemeYaklasan = (d: RiskDegerlendirme, gun = YENILEME_UYARI_GUN): boolean => {
  if (d.durum !== 'Onaylandı') return false
  const fark = (new Date(d.yenilemeTarihi).getTime() - new Date(TODAY).getTime()) / 86400000
  return fark >= 0 && fark <= gun
}
