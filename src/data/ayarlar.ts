import { TODAY } from '@/data/dashboard'

export const BUGUN = TODAY

/* ------------------------------- Genel ---------------------------------- */

export interface GenelAyarlar {
  dil: string
  saatDilimi: string
  tarihFormati: string
  paraBirimi: string
  sayfaBoyu: string
  tema: string
}

export const genelSeed: GenelAyarlar = {
  dil: 'Türkçe',
  saatDilimi: 'Europe/Istanbul (UTC+3)',
  tarihFormati: 'GG.AA.YYYY',
  paraBirimi: 'Türk Lirası (₺)',
  sayfaBoyu: 'Otomatik',
  tema: 'Sistem',
}

/* ------------------------------ Kurum ----------------------------------- */

export interface KurumBilgileri {
  unvan: string
  /** Menü, belge üstbilgisi ve portallarda görünen kısa ad (ör. 'Vega OSGB') */
  kisaAd: string
  /** Kuruma ait logo — küçük optimize edilmiş data URL olarak saklanır */
  logo?: string
  vergiDairesi: string
  vergiNo: string
  mersis: string
  sgkSicil: string
  adres: string
  telefon: string
  eposta: string
  web: string
  yetkili: string
  yetkiliUnvan: string
  subeler: { ad: string; il: string; telefon: string }[]
}

export const kurumSeed: KurumBilgileri = {
  unvan: 'Vega OSGB Hizmetleri A.Ş.',
  kisaAd: 'Vega OSGB',
  vergiDairesi: 'Gebze',
  vergiNo: '8350042190',
  mersis: '0835004219000017',
  sgkSicil: '3-2210-4488-12-000123',
  adres: 'Köşklü Çeşme Mah. Sanayi Cad. No:12, Gebze / Kocaeli',
  telefon: '0262 502 11 40',
  eposta: 'info@vegaosgb.com.tr',
  web: 'www.vegaosgb.com.tr',
  yetkili: 'Özlem Yıldız',
  yetkiliUnvan: 'Genel Müdür',
  subeler: [
    { ad: 'Gebze Merkez', il: 'Kocaeli', telefon: '0262 502 11 40' },
    { ad: 'Tuzla Şube', il: 'İstanbul', telefon: '0216 581 33 20' },
  ],
}

/* ----------------------------- Bildirim --------------------------------- */

export interface BildirimTercih {
  tur: string
  uygulama: boolean
  eposta: boolean
  sms: boolean
}

export const bildirimSeed: BildirimTercih[] = [
  { tur: 'Sözleşme bitiş uyarıları', uygulama: true, eposta: true, sms: false },
  { tur: 'Eksik görevlendirme', uygulama: true, eposta: true, sms: false },
  { tur: 'Firma bilgi eksikleri', uygulama: true, eposta: false, sms: false },
  { tur: 'Yeni olay bildirimi', uygulama: true, eposta: true, sms: true },
  { tur: 'Görev / aksiyon ataması', uygulama: true, eposta: true, sms: false },
  { tur: 'Görev gecikme uyarısı', uygulama: true, eposta: true, sms: false },
  { tur: 'Belge geçerlilik uyarısı', uygulama: true, eposta: true, sms: false },
  { tur: 'Kullanıcı daveti', uygulama: false, eposta: true, sms: false },
  { tur: 'Güvenlik uyarıları', uygulama: true, eposta: true, sms: true },
]

/* ------------------------------ Güvenlik -------------------------------- */

export interface GuvenlikAyarlari {
  minSifre: number
  karmasikSifre: boolean
  oturumSuresi: string
  basarisizLimit: number
  ikiAdim: boolean
}

export const guvenlikSeed: GuvenlikAyarlari = {
  minSifre: 8,
  karmasikSifre: true,
  oturumSuresi: '8 saat',
  basarisizLimit: 5,
  ikiAdim: false,
}

export interface Oturum {
  id: string
  hesapId: string
  cihaz: string
  tarayici: string
  ip: string
  konum: string
  baslangic: string
  sonAktiflik: string
  aktif: boolean
}

export const oturumSeed: Oturum[] = [
  { id: 'OTR-01', hesapId: 'USR-01', cihaz: 'Windows 11', tarayici: 'Chrome 142', ip: '88.241.12.44', konum: 'Kocaeli', baslangic: '2026-11-04T08:42:00', sonAktiflik: '2026-11-04T09:10:00', aktif: true },
  { id: 'OTR-02', hesapId: 'USR-01', cihaz: 'iPhone 15', tarayici: 'Safari', ip: '88.241.12.44', konum: 'Kocaeli', baslangic: '2026-11-03T19:20:00', sonAktiflik: '2026-11-03T21:05:00', aktif: true },
  { id: 'OTR-03', hesapId: 'USR-02', cihaz: 'Windows 11', tarayici: 'Edge', ip: '88.250.77.91', konum: 'İstanbul', baslangic: '2026-11-03T16:20:00', sonAktiflik: '2026-11-03T17:45:00', aktif: true },
  { id: 'OTR-04', hesapId: 'USR-05', cihaz: 'MacBook Air', tarayici: 'Safari', ip: '85.110.30.7', konum: 'İstanbul', baslangic: '2026-11-04T09:00:00', sonAktiflik: '2026-11-04T09:00:00', aktif: true },
  { id: 'OTR-05', hesapId: 'USR-04', cihaz: 'Android', tarayici: 'Chrome', ip: '78.190.220.15', konum: 'Kocaeli', baslangic: '2026-11-02T07:55:00', sonAktiflik: '2026-11-02T14:12:00', aktif: false },
]

export interface BasarisizGiris {
  id: string
  kullaniciAdi: string
  tarih: string
  ip: string
  neden: string
}

export const basarisizSeed: BasarisizGiris[] = [
  { id: 'BG-01', kullaniciAdi: 'mdemir', tarih: '2026-11-02T23:14:00', ip: '78.190.220.15', neden: 'Hatalı şifre (3 deneme)' },
  { id: 'BG-02', kullaniciAdi: 'admin', tarih: '2026-10-30T02:41:00', ip: '45.155.19.77', neden: 'Bilinmeyen kullanıcı' },
  { id: 'BG-03', kullaniciAdi: 'saydemir', tarih: '2026-10-28T09:12:00', ip: '88.241.12.44', neden: 'Hesap henüz aktif değil' },
]

/* ------------------------------- Belgeler ------------------------------- */

export interface BelgeAyarlari {
  logoNotu: string
  /** Sertifika numarası öneki — 'SRT-2026-000001' gibi */
  sertifikaOnEk: string
  imzaGoster: boolean
  kaseGoster: boolean
  ustbilgi: string
  altbilgi: string
  sayfaBoyutu: string
  font: string
  trKarakter: boolean
}

export const belgeSeed: BelgeAyarlari = {
  logoNotu: 'osgb-logo.svg',
  sertifikaOnEk: 'SRT',
  imzaGoster: true,
  kaseGoster: true,
  ustbilgi: 'Vega OSGB Hizmetleri A.Ş. — İş Sağlığı ve Güvenliği',
  altbilgi: 'Bu belge elektronik ortamda oluşturulmuştur. · www.vegaosgb.com.tr',
  sayfaBoyutu: 'A4',
  font: 'Geist',
  trKarakter: true,
}

/* --------------------------- Tanımlar/Kataloglar ------------------------- */

export interface TanimGrup {
  key: string
  label: string
  aciklama: string
  degerler: string[]
}

export const tanimSeed: TanimGrup[] = [
  { key: 'hizmetler', label: 'Hizmetler', aciklama: 'OSGB hizmet türleri', degerler: ['OSGB Tam Kapsam', 'OSGB Kısmi', 'Danışmanlık', 'Eğitim Paketi'] },
  { key: 'tetkikler', label: 'Tetkikler', aciklama: 'Sağlık taraması tetkikleri', degerler: ['Hemogram', 'İşitme (Odyometri)', 'Solunum Fonksiyon', 'Görme', 'Akciğer Grafisi', 'İdrar Tahlili'] },
  { key: 'muayeneler', label: 'Muayene Türleri', aciklama: 'İşyeri hekimi muayene türleri', degerler: ['İşe Giriş', 'Periyodik', 'İşe Dönüş', 'Aralıklı Kontrol'] },
  { key: 'kdv', label: 'KDV Oranları', aciklama: 'Faturalandırma oranları', degerler: ['%0', '%1', '%10', '%20'] },
  { key: 'nace', label: 'NACE Kodları', aciklama: 'Faaliyet kodları', degerler: ['25.11', '28.22', '41.20', '46.69', '55.10', '62.01', '81.21', '85.51'] },
  { key: 'tehlike', label: 'Tehlike Sınıfları', aciklama: 'İşyeri tehlike sınıfları', degerler: ['Az Tehlikeli', 'Tehlikeli', 'Çok Tehlikeli'] },
  { key: 'olay-turleri', label: 'Olay Türleri', aciklama: 'Olay bildirim türleri', degerler: ['İş Kazası', 'Ramak Kala', 'Tehlikeli Durum', 'Tehlikeli Davranış', 'Maddi Hasar'] },
  { key: 'egitim-turleri', label: 'Eğitim Türleri', aciklama: 'Verilen eğitim kategorileri', degerler: ['Temel İSG', 'Yangın', 'Yüksekte Çalışma', 'Elektrik Güvenliği', 'Kimyasal Güvenlik', 'İlk Yardım'] },
  { key: 'ekipman', label: 'Ekipman Türleri', aciklama: 'KKD ve ölçüm ekipmanları', degerler: ['Baret', 'İş Ayakkabısı', 'Eldiven', 'Göz Koruyucu', 'Kulak Koruyucu', 'Emniyet Kemeri'] },
  { key: 'belge-kategorileri', label: 'Belge Kategorileri', aciklama: 'Doküman sınıflandırması', degerler: ['Sözleşme', 'Sertifika', 'Rapor', 'Form', 'Talimat', 'Prosedür'] },
]

/* ------------------------------ İş Akışı -------------------------------- */

export interface OtomasyonKural {
  id: string
  ad: string
  aciklama: string
  tetikleyici: string
  islem: string
  aktif: boolean
}

export const otomasyonSeed: OtomasyonKural[] = [
  { id: 'OTM-01', ad: 'Sözleşme bitiş hatırlatması', aciklama: 'Bitime 30/15/7 gün kala bildirim', tetikleyici: 'Tarih bazlı', islem: 'Bildirim gönder', aktif: true },
  { id: 'OTM-02', ad: 'Görev gecikme uyarısı', aciklama: 'Hedef tarihi geçen aksiyonlarda sorumluya bildirim', tetikleyici: 'Tarih bazlı', islem: 'Bildirim gönder', aktif: true },
  { id: 'OTM-03', ad: 'Yeni olay ataması', aciklama: 'Yeni bildirilen olay firma uzmanına otomatik atanır', tetikleyici: 'Kayıt oluştu', islem: 'Sorumlu ata', aktif: true },
  { id: 'OTM-04', ad: 'İnceleme onay adımı', aciklama: 'İş kazası kapanmadan önce müdür onayı istenir', tetikleyici: 'Durum değişikliği', islem: 'Onay iste', aktif: false },
  { id: 'OTM-05', ad: 'Belge geçerlilik takibi', aciklama: 'Mesleki belge bitimine 30 gün kala bildirim', tetikleyici: 'Tarih bazlı', islem: 'Bildirim gönder', aktif: true },
  { id: 'OTM-06', ad: 'Süresi dolan sözleşme', aciklama: 'Bitiş tarihi geçen sözleşmeler otomatik "Süresi Dolmuş" olur', tetikleyici: 'Tarih bazlı', islem: 'Durum güncelle', aktif: false },
]

/* ---------------------------- Entegrasyonlar ----------------------------- */

export interface Entegrasyon {
  key: string
  ad: string
  aciklama: string
  durum: 'Bağlı Değil' | 'Test Modu' | 'Yapılandırma Bekliyor'
  alanlar: { k: string; v: string }[]
}

export const entegrasyonSeed: Entegrasyon[] = [
  {
    key: 'isg-katip',
    ad: 'İSG-KATİP',
    aciklama: 'Çalışma Bakanlığı İSG-KATİP sistemi. Görevlendirme ve sözleşme bildirimleri için resmî API yetkilendirmesi gerekir.',
    durum: 'Test Modu',
    alanlar: [
      { k: 'Entegrasyon modu', v: 'Test / Sandbox' },
      { k: 'API durumu', v: 'Yetkilendirme bekleniyor' },
      { k: 'Son senkron', v: '—' },
    ],
  },
  {
    key: 'ibys',
    ad: 'İBYS',
    aciklama: 'İşyeri Bildirge Sistemi. İşyeri bildirgeleri ve İSG profesyonel atamaları için resmî entegrasyon.',
    durum: 'Bağlı Değil',
    alanlar: [
      { k: 'Entegrasyon modu', v: 'Kapalı' },
      { k: 'API durumu', v: 'Yapılandırılmadı' },
      { k: 'Son senkron', v: '—' },
    ],
  },
  {
    key: 'eposta',
    ad: 'E-posta Servisi (SMTP)',
    aciklama: 'Davet, şifre sıfırlama ve bildirim e-postaları.',
    durum: 'Yapılandırma Bekliyor',
    alanlar: [
      { k: 'SMTP sunucu', v: '—' },
      { k: 'Gönderen', v: 'noreply@vegaosgb.com.tr' },
      { k: 'Durum', v: 'Kimlik doğrulama gerekli' },
    ],
  },
  {
    key: 'sms',
    ad: 'SMS Servisi',
    aciklama: 'Kritik İSG bildirimleri için SMS kanalı.',
    durum: 'Bağlı Değil',
    alanlar: [
      { k: 'Sağlayıcı', v: '—' },
      { k: 'Durum', v: 'Yapılandırılmadı' },
    ],
  },
]

/* ----------------------------- İşlem Geçmişi ----------------------------- */

export interface AuditLog {
  id: string
  tarih: string
  kullanici: string
  islem: string
  kayit: string
  eski?: string
  yeni?: string
  ip?: string
}

export const auditSeed: AuditLog[] = [
  { id: 'LOG-001', tarih: '2026-11-04T08:42:00', kullanici: 'yilmazturk', islem: 'Oturum açıldı', kayit: 'USR-01', ip: '88.241.12.44' },
  { id: 'LOG-002', tarih: '2026-11-03T17:12:00', kullanici: 'yilmazturk', islem: 'İzin güncellendi', kayit: 'USR-02 (akaya)', eski: '34 izin', yeni: '36 izin', ip: '88.241.12.44' },
  { id: 'LOG-003', tarih: '2026-11-03T16:44:00', kullanici: 'yilmazturk', islem: 'Sözleşme oluşturuldu', kayit: 'KT-2026-112 · Nova Gıda', ip: '88.241.12.44' },
  { id: 'LOG-004', tarih: '2026-11-02T11:30:00', kullanici: 'oyildiz', islem: 'Olay durumu güncellendi', kayit: 'OL-402', eski: 'İncelemede', yeni: 'Aksiyon Bekliyor', ip: '85.110.30.7' },
  { id: 'LOG-005', tarih: '2026-11-02T09:05:00', kullanici: 'yilmazturk', islem: 'Görevlendirme eklendi', kayit: 'PRS-06 → FR-05', ip: '88.241.12.44' },
  { id: 'LOG-006', tarih: '2026-11-01T14:22:00', kullanici: 'yilmazturk', islem: 'Kullanıcı daveti gönderildi', kayit: 'saydemir@vegaosgb.com.tr', ip: '88.241.12.44' },
  { id: 'LOG-007', tarih: '2026-10-30T16:00:00', kullanici: 'yilmazturk', islem: 'Firma pasife alındı', kayit: 'FR-04 · Pro-Temiz Temizlik', ip: '88.241.12.44' },
  { id: 'LOG-008', tarih: '2026-10-30T10:15:00', kullanici: 'akaya', islem: 'Olay bildirildi', kayit: 'OL-399 · Ramak Kala', ip: '88.250.77.91' },
  { id: 'LOG-009', tarih: '2026-10-28T13:40:00', kullanici: 'yilmazturk', islem: 'Hesap devre dışı bırakıldı', kayit: 'USR-06 (mdemir)', ip: '88.241.12.44' },
  { id: 'LOG-010', tarih: '2026-10-27T09:00:00', kullanici: 'oyildiz', islem: 'Dışa aktarım', kayit: 'firma-raporu.csv', ip: '85.110.30.7' },
]
