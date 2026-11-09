import { TODAY } from '@/data/dashboard'
import { DEMO_SIFRE_OZETI } from '@/data/sifre-seed'
import type { IlerlemeDurum } from '@/data/egitimler'

/*
 * Müşteri firma personelleri — OSGB yönetim personelinden (data/ekip.ts) ayrı.
 * İleride backend'de: company_employees, users, employee_user_links,
 * training_assignments, training_assignment_employees, training_progress,
 * training_content_progress, training_exam_attempts, training_assignment_events.
 */

export type PersonelDurum = 'Aktif' | 'İzinli' | 'Pasif' | 'Ayrıldı'
/** 'Onay Bekliyor': firma tarafından açılmak istenen hesap, İSG onayı gelene kadar giriş yapamaz */
export type HesapDurum = 'Yok' | 'Aktif' | 'Davet Bekliyor' | 'Askıda' | 'Pasif' | 'Onay Bekliyor'
export type AtamaDurum = 'Aktif' | 'İptal' | 'Tamamlandı'
export type KisiDurum =
  | 'Bekliyor'
  | 'Devam Ediyor'
  | 'Tamamlandı'
  | 'Başarısız'
  | 'Onay Bekliyor'
  | 'Gecikti'

export interface FirmaPersonel {
  id: string
  firmaId: string
  ad: string
  soyad: string
  eposta: string
  telefon: string
  tc?: string // saklanır ama arayüzde maskelenir
  departman: string
  gorev: string
  sicilNo: string
  durum: PersonelDurum
  /** Firma değişikliği kontrollü işlemdir — geçmiş kayıtlar korunur */
  firmaGecmisi: { firmaId: string; baslangic: string; bitis?: string }[]
  not?: string
  olusturma: string
  islemGecmisi: { tarih: string; islem: string; detay?: string }[]
}

/** Çalışan portalı hesabı — personel kaydından ayrı varlık; personelId bağlantısı opsiyonel değil, tek */
export interface PortalHesap {
  id: string
  personelId: string // yalnızca uygun personel kaydına bağlanabilir
  kullaniciAdi: string
  eposta: string
  sifreHash?: string
  /** Toplu oluşturulan geçici şifre — ilk girişte değiştirilmeden portala erişim yok */
  sifreDegisimZorunlu?: boolean
  /** Şifrenin en son belirlendiği / değiştirildiği an (ISO) */
  sifreDegisimTarihi?: string
  /** Firma hesap talebi: talebi açan firma ve tarih. Onaylanınca kaldırılır. */
  hesapTalebi?: { firma: string; tarih: string }
  davetToken?: string
  davetBitis?: string
  durum: Exclude<HesapDurum, 'Yok'>
  sonGiris?: string
  oturumlar: { id: string; cihaz: string; ip: string; tarih: string }[]
  olusturma: string
}

/** KVKK aydınlatma metni — sürümlenir; değişiklik eski sürümü ve eski teyitleri etkilemez */
export interface KvkkMetin {
  id: string
  surum: string
  baslik: string
  veriSorumlusu: string
  icerik: string
  yayinTarihi: string
  aktif: boolean
}

/**
 * Aydınlatma teyidi — hukuki not: aydınlatma metninin tebliği 'açık rıza' değildir.
 * Açık rıza gerektiren işlemler ayrı metin + ayrı onay akışıyla yürütülmelidir.
 * Üretimde IP/user-agent backend tarafından kaydedilir.
 */
export interface KvkkTeyit {
  id: string
  hesapId: string
  personelId: string
  metinId: string
  metinSurum: string
  /** O anki metnin değişmez özeti — sonradan değişiklik tespit edilebilir */
  icerikHash: string
  goruntulenme?: string
  teyitZamani: string
  teyitTuru: 'aydinlatma'
  userAgent: string
}

export interface EgitimAtama {
  id: string
  egitimId: string
  /** Atama hangi sürüme yapıldıysa o sürüm korunur */
  surumId: string
  firmaId: string
  personelIds: string[]
  atamaTarihi: string
  sonTarih: string
  zorunlu: boolean
  hatirlatmaGun: number // 0 = hatırlatma yok
  /** OSGB yönetimi açarsa firma yetkilisi bu atamaya kendi çalışanlarını ekleyebilir */
  durum: AtamaDurum
  olusturan: string
  olaylar: { tarih: string; islem: string }[]
}

export const PERSONEL_DURUMLARI: PersonelDurum[] = ['Aktif', 'İzinli', 'Pasif', 'Ayrıldı']

export const durumRenk: Record<PersonelDurum, string> = {
  Aktif: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  İzinli: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Pasif: 'bg-zinc-500/10 text-zinc-500',
  Ayrıldı: 'bg-red-500/10 text-red-500',
}

export const kisiDurumRenk: Record<KisiDurum, string> = {
  Bekliyor: 'bg-zinc-500/10 text-zinc-500',
  'Devam Ediyor': 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  'Tamamlandı': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'Başarısız': 'bg-red-500/10 text-red-500',
  'Onay Bekliyor': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'Gecikti': 'bg-red-500/10 text-red-600 dark:text-red-400',
}

/** İlerleme durumu → atama kişi durumu */
export const ilerlemedenKisi = (
  durum: IlerlemeDurum | undefined,
  sonTarih: string,
): KisiDurum => {
  if (durum === 'Tamamlandı') return 'Tamamlandı'
  if (durum === 'Onay Bekliyor') return 'Onay Bekliyor'
  if (durum === 'Sınav Başarısız') return 'Başarısız'
  if (durum === 'Sınav Başarılı' || durum === 'Sınav Bekleniyor' || durum === 'İçerikler Tamamlandı')
    return 'Devam Ediyor'
  if (durum === 'Devam Ediyor') return 'Devam Ediyor'
  if (sonTarih < TODAY) return 'Gecikti'
  return 'Bekliyor'
}

export const tcMaske = (tc?: string) =>
  tc ? `${tc.slice(0, 3)}********${tc.slice(-1)}` : '—'

const gecmis = (islem: string, tarih = TODAY) => [{ tarih, islem }]

export const personelSeed: FirmaPersonel[] = [
  { id: 'FP-01', firmaId: 'FR-01', ad: 'Cem', soyad: 'Demir', eposta: 'cem.demir@akdenizmetal.com.tr', telefon: '0532 111 22 33', tc: '12345678901', departman: 'Üretim', gorev: 'Hat Operatörü', sicilNo: 'AG-0142', durum: 'Aktif', firmaGecmisi: [{ firmaId: 'FR-01', baslangic: '2023-03-15' }], olusturma: '2023-03-15', islemGecmisi: gecmis('Kayıt oluşturuldu', '2023-03-15') },
  { id: 'FP-02', firmaId: 'FR-01', ad: 'Elif', soyad: 'Şahin', eposta: 'elif.sahin@akdenizmetal.com.tr', telefon: '0533 444 55 66', departman: 'Kalite', gorev: 'Kalite Kontrol', sicilNo: 'AG-0187', durum: 'Aktif', firmaGecmisi: [{ firmaId: 'FR-01', baslangic: '2024-01-08' }], olusturma: '2024-01-08', islemGecmisi: gecmis('Kayıt oluşturuldu', '2024-01-08') },
  { id: 'FP-03', firmaId: 'FR-01', ad: 'Murat', soyad: 'Yıldız', eposta: 'murat.yildiz@akdenizmetal.com.tr', telefon: '0541 777 88 99', departman: 'Depo', gorev: 'Forklift Operatörü', sicilNo: 'AG-0203', durum: 'İzinli', firmaGecmisi: [{ firmaId: 'FR-01', baslangic: '2024-06-20' }], olusturma: '2024-06-20', islemGecmisi: gecmis('Kayıt oluşturuldu', '2024-06-20') },
  { id: 'FP-04', firmaId: 'FR-02', ad: 'Zeynep', soyad: 'Arslan', eposta: 'z.arslan@nova-lojistik.com', telefon: '0555 123 45 67', departman: 'Lojistik', gorev: 'Sevkiyat Sorumlusu', sicilNo: 'NL-0056', durum: 'Aktif', firmaGecmisi: [{ firmaId: 'FR-02', baslangic: '2022-11-01' }], olusturma: '2022-11-01', islemGecmisi: gecmis('Kayıt oluşturuldu', '2022-11-01') },
  { id: 'FP-05', firmaId: 'FR-02', ad: 'Burak', soyad: 'Koç', eposta: 'b.koc@nova-lojistik.com', telefon: '0534 987 65 43', departman: 'Depo', gorev: 'Depo Elemanı', sicilNo: 'NL-0091', durum: 'Aktif', firmaGecmisi: [{ firmaId: 'FR-02', baslangic: '2025-02-10' }], olusturma: '2025-02-10', islemGecmisi: gecmis('Kayıt oluşturuldu', '2025-02-10') },
  { id: 'FP-06', firmaId: 'FR-02', ad: 'Selin', soyad: 'Öztürk', eposta: 's.ozturk@nova-lojistik.com', telefon: '0538 222 33 44', departman: 'İdari', gorev: 'Ofis Asistanı', sicilNo: 'NL-0104', durum: 'Pasif', firmaGecmisi: [{ firmaId: 'FR-02', baslangic: '2023-07-17' }], olusturma: '2023-07-17', islemGecmisi: [...gecmis('Kayıt oluşturuldu', '2023-07-17'), { tarih: '2026-09-01', islem: 'Personel pasife alındı' }] },
  { id: 'FP-07', firmaId: 'FR-03', ad: 'Emre', soyad: 'Kurt', eposta: 'emre.kurt@polat-insaat.com', telefon: '0542 666 77 88', tc: '98765432109', departman: 'Şantiye', gorev: 'Formen', sicilNo: 'Pİ-0033', durum: 'Aktif', firmaGecmisi: [{ firmaId: 'FR-03', baslangic: '2024-04-22' }], olusturma: '2024-04-22', islemGecmisi: gecmis('Kayıt oluşturuldu', '2024-04-22') },
  { id: 'FP-08', firmaId: 'FR-03', ad: 'Aylin', soyad: 'Doğan', eposta: 'a.dogan@polat-insaat.com', telefon: '0556 111 00 99', departman: 'Şantiye', gorev: 'İşçi', sicilNo: 'Pİ-0047', durum: 'Aktif', firmaGecmisi: [{ firmaId: 'FR-03', baslangic: '2025-08-30' }], olusturma: '2025-08-30', islemGecmisi: gecmis('Kayıt oluşturuldu', '2025-08-30') },
]

export const portalHesapSeed: PortalHesap[] = [
  {
    id: 'PH-01',
    personelId: 'FP-01',
    kullaniciAdi: 'cdemir',
    eposta: 'cem.demir@akdenizmetal.com.tr',
    sifreHash: DEMO_SIFRE_OZETI,
    durum: 'Aktif',
    sonGiris: '2026-11-02T09:30:00',
    oturumlar: [
      { id: 'OT-1', cihaz: 'Chrome · Windows', ip: '88.240.12.44', tarih: '2026-11-02T09:30:00' },
    ],
    olusturma: '2025-01-12',
  },
  {
    id: 'PH-02',
    personelId: 'FP-02',
    kullaniciAdi: 'elif.sahin',
    eposta: 'elif.sahin@akdenizmetal.com.tr',
    davetToken: 'dvt-elif-demo',
    davetBitis: new Date(Date.now() + 7 * 86400000).toISOString(),
    durum: 'Davet Bekliyor',
    oturumlar: [],
    olusturma: '2026-10-28',
  },
]

export const kvkkMetinSeed: KvkkMetin[] = [
  {
    id: 'KVKK-01',
    surum: '1.0',
    baslik: 'Çalışan Adayı / Çalışan Kişisel Verilerin Korunması Aydınlatma Metni',
    veriSorumlusu: 'İşveren (bağlı olunan müşteri firma)',
    yayinTarihi: '2026-10-01',
    aktif: true,
    icerik: `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz veri sorumlusu sıfatını taşıyan işvereniniz tarafından aşağıda açıklanan kapsamda işlenmektedir. isghub İSG Yönetim Sistemi, işvereniniz adına iş sağlığı ve güvenliği hizmetlerinin yürütülmesinde veri işleyen olarak hizmet vermektedir.

1. VERİ SORUMLUSU
Kişisel verilerinizin işlenmesinden, çalışmakta olduğunuz ve bu platformda kayıtlı bulunan işvereniniz (veri sorumlusu) sorumludur. İşvereninize ait unvan ve iletişim bilgilerine profil sayfanızdan ve insan kaynakları biriminizden ulaşabilirsiniz.

2. İŞLENEN KİŞİSEL VERİLER
Kimlik bilgileriniz (ad, soyad, T.C. kimlik numarası), iletişim bilgileriniz (e-posta, telefon), özlük bilgileriniz (firma, departman, görev, personel numarası), eğitim katılım ve sınav sonuçlarınız ile platform kullanım kayıtlarınız işlenmektedir.

3. İŞLENME AMAÇLARI VE HUKUKİ SEBEPLER
Kişisel verileriniz; iş sağlığı ve güvenliği mevzuatından doğan yükümlülüklerin yerine getirilmesi, zorunlu eğitimlerin planlanması ve tamamlanmasının takibi, yasal bildirimlerin yapılması ve bilgi güvenliği süreçlerinin yürütülmesi amaçlarıyla, KVKK'nın 5. maddesinde belirtilen "kanunlarda açıkça öngörülmesi" ve "veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması" hukuki sebeplerine dayanılarak işlenmektedir.

4. AKTARIM
Verileriniz, mevzuat gereği yetkili kamu kurum ve kuruluşlarına (Çalışma ve Sosyal Güvenlik Bakanlığı, İSG-KATİP sistemi) ve işvereninizin hizmet aldığı iş sağlığı ve güvenliği hizmet sağlayıcısına (ortak sağlık ve güvenlik birimi / OSGB), hukuki yükümlülüklerin yerine getirilmesi amacıyla sınırlı olarak aktarılabilir.

5. SAKLAMA SÜRESİ
Kişisel verileriniz, ilgili mevzuatta öngörülen süreler ve işleme amaçlarının gerektirdiği süre boyunca saklanır; süre sonunda silinir, yok edilir veya anonim hâle getirilir.

6. HAKLARINIZ
KVKK'nın 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini isteme, kanuni şartlar çerçevesinde silinmesini veya yok edilmesini isteme ve verilerinize karşı otomatik sistemlerle yapılan analizlere itiraz etme haklarına sahipsiniz. Taleplerinizi işvereninizin insan kaynakları birimine yazılı olarak iletebilirsiniz.

Bu metin bir aydınlatma/bilgilendirme beyanıdır; işaretlenmesi açık rıza verildiği anlamına gelmez. Metnin güncel sürümü değiştiğinde yeniden bilgilendirileceksiniz.`,
  },
]

export const atamaSeed: EgitimAtama[] = [
  {
    id: 'ATM-01',
    egitimId: 'EGT-01',
    surumId: 'ES-0102',
    firmaId: 'FR-01',
    personelIds: ['FP-01', 'FP-02', 'FP-03'],
    atamaTarihi: '2026-10-20',
    sonTarih: '2026-11-20',
    zorunlu: true,
    hatirlatmaGun: 3,
    durum: 'Aktif',
    olusturan: 'Tunahan Yılmaztürk',
    olaylar: [{ tarih: '2026-10-20', islem: 'Atama oluşturuldu — 3 personel' }],
  },
  {
    id: 'ATM-02',
    egitimId: 'EGT-02',
    surumId: 'ES-0201',
    firmaId: 'FR-02',
    personelIds: ['FP-04', 'FP-05'],
    atamaTarihi: '2026-10-25',
    sonTarih: '2026-11-15',
    zorunlu: true,
    hatirlatmaGun: 5,
    durum: 'Aktif',
    olusturan: 'Tunahan Yılmaztürk',
    olaylar: [{ tarih: '2026-10-25', islem: 'Atama oluşturuldu — 2 personel' }],
  },
  {
    id: 'ATM-03',
    egitimId: 'EGT-01',
    surumId: 'ES-0102',
    firmaId: 'FR-03',
    personelIds: ['FP-07', 'FP-08'],
    atamaTarihi: '2026-11-01',
    sonTarih: '2026-12-01',
    zorunlu: false,
    hatirlatmaGun: 0,
    durum: 'Aktif',
    olusturan: 'Ahmet Kaya',
    olaylar: [{ tarih: '2026-11-01', islem: 'Atama oluşturuldu — 2 personel' }],
  },
]
