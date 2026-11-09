import { BUGUN as TODAY } from '@/data/saglik'
import { EKIPMAN_TURLERI, HIZMET_TURLERI, TEST_KATEGORILERI } from '@/data/saglik'

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
  { tur: 'Teklif onaylandı / reddedildi', uygulama: true, eposta: true, sms: false },
  { tur: 'Tarama planlandı (firma bilgilendirme)', uygulama: true, eposta: true, sms: false },
  { tur: 'Tarama yaklaşıyor (1 gün önce)', uygulama: true, eposta: false, sms: true },
  { tur: 'Tarama tamamlandı', uygulama: true, eposta: true, sms: false },
  { tur: 'Kalibrasyon bitiyor', uygulama: true, eposta: true, sms: false },
  { tur: 'Ekipman arıza / bakım', uygulama: true, eposta: true, sms: false },
  { tur: 'Teklif geçerlilik süresi doluyor', uygulama: true, eposta: true, sms: false },
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

/* ------------------------- Rapor ve Belgeler ----------------------------- */

export interface BelgeAyarlari {
  logoNotu: string
  /** Belge (teklif/rapor) numara öneki — 'TKL-2026-000001' gibi */
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
  logoNotu: 'osgbhub-logo.svg',
  sertifikaOnEk: 'TKL',
  imzaGoster: true,
  kaseGoster: true,
  ustbilgi: 'Vega OSGB Hizmetleri A.Ş. — Mobil Sağlık Taramaları',
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
  { key: 'hizmetler', label: 'Hizmet türleri', aciklama: 'Firmalara sunulan tarama hizmetleri (teklif ve taramalarda kullanılır)', degerler: [...HIZMET_TURLERI] },
  { key: 'muayene', label: 'Muayene türleri', aciklama: 'Tarama nedenleri', degerler: ['İşe giriş', 'Periyodik', 'İşe dönüş', 'Aralıklı kontrol'] },
  { key: 'test-kategorileri', label: 'Test kategorileri', aciklama: 'Testler sayfasındaki kategoriler', degerler: [...TEST_KATEGORILERI] },
  { key: 'ekipman-turleri', label: 'Ekipman türleri', aciklama: 'Ekipman kaydında seçilen türler', degerler: [...EKIPMAN_TURLERI] },
  { key: 'kdv', label: 'KDV oranları', aciklama: 'Faturalandırma oranları', degerler: ['%0', '%1', '%10', '%20'] },
]

/* ------------------------------ Otomasyon ------------------------------- */

export interface OtomasyonKural {
  id: string
  ad: string
  aciklama: string
  tetikleyici: string
  islem: string
  aktif: boolean
}

export const otomasyonSeed: OtomasyonKural[] = [
  { id: 'OTM-01', ad: 'Kalibrasyon hatırlatması', aciklama: 'Kalibrasyon bitişine 30 / 15 / 7 gün kala ekip sorumlusuna bildirim', tetikleyici: 'Tarih bazlı', islem: 'Bildirim gönder', aktif: true },
  { id: 'OTM-02', ad: 'Teklif geçerlilik hatırlatması', aciklama: 'Gönderilmiş teklifin süresi dolmadan 7 gün önce teklif sorumlusuna bildirim', tetikleyici: 'Tarih bazlı', islem: 'Bildirim gönder', aktif: true },
  { id: 'OTM-03', ad: 'Onaylanan teklif → tarama planı', aciklama: 'Teklif onaylanınca taramalar sayfasında "Planlandı" kaydı oluşturulur', tetikleyici: 'Teklif onaylandı', islem: 'Tarama oluştur', aktif: true },
  { id: 'OTM-04', ad: 'Tarama tamamlandı bildirimi', aciklama: 'Tüm kişiler tamamlandığında firma yetkilisine bilgilendirme', tetikleyici: 'Tarama tamamlandı', islem: 'Bildirim gönder', aktif: true },
  { id: 'OTM-05', ad: 'Ekipman arızası', aciklama: 'Ekipman "Arızalı" durumuna geçince planlı taramalardan çıkarılır ve sorumluya bildirilir', tetikleyici: 'Durum değişikliği', islem: 'Bildirim gönder', aktif: false },
  { id: 'OTM-06', ad: 'Süresi dolan teklif', aciklama: 'Geçerlilik tarihi geçen teklifler otomatik "Reddedildi" olur', tetikleyici: 'Tarih bazlı', islem: 'Durum güncelle', aktif: false },
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
    key: 'e-nabiz',
    ad: 'e-Nabız',
    aciklama: 'Tarama sonuçlarının Sağlık Bakanlığı e-Nabız kaydına aktarımı için resmî yetkilendirme gerekir.',
    durum: 'Yapılandırma Bekliyor',
    alanlar: [
      { k: 'Entegrasyon modu', v: 'Kapalı' },
      { k: 'API durumu', v: 'Yetkilendirme bekleniyor' },
      { k: 'Son senkron', v: '—' },
    ],
  },
  {
    key: 'eposta',
    ad: 'E-posta Servisi (SMTP)',
    aciklama: 'Davet, şifre sıfırlama, teklif ve tarama bildirim e-postaları.',
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
    aciklama: 'Tarama hatırlatması ve kişisel bilgilendirme mesajları için SMS kanalı.',
    durum: 'Bağlı Değil',
    alanlar: [
      { k: 'Sağlayıcı', v: '—' },
      { k: 'Durum', v: 'Yapılandırılmadı' },
    ],
  },
  {
    key: 'muhasebe',
    ad: 'Muhasebe / e-Fatura',
    aciklama: 'Onaylanan tekliflerin faturaya aktarımı.',
    durum: 'Bağlı Değil',
    alanlar: [
      { k: 'Entegrasyon modu', v: 'Kapalı' },
      { k: 'Son senkron', v: '—' },
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
  { id: 'LOG-003', tarih: '2026-11-03T16:44:00', kullanici: 'yilmazturk', islem: 'Teklif oluşturuldu', kayit: 'TKL-2026-002 · Ege Lojistik', ip: '88.241.12.44' },
  { id: 'LOG-004', tarih: '2026-11-02T11:30:00', kullanici: 'oyildiz', islem: 'Tarama durumu güncellendi', kayit: 'TRM-04 · Marmara Tekstil', eski: 'Planlandı', yeni: 'Devam ediyor', ip: '85.110.30.7' },
  { id: 'LOG-005', tarih: '2026-11-02T09:05:00', kullanici: 'yilmazturk', islem: 'Teklif onaylandı', kayit: 'TKL-2026-001 · Akdeniz Metal', ip: '88.241.12.44' },
  { id: 'LOG-006', tarih: '2026-11-01T14:22:00', kullanici: 'yilmazturk', islem: 'Kullanıcı daveti gönderildi', kayit: 'saydemir@vegaosgb.com.tr', ip: '88.241.12.44' },
  { id: 'LOG-007', tarih: '2026-10-30T16:00:00', kullanici: 'yilmazturk', islem: 'Ekipman kalibrasyonu güncellendi', kayit: 'EKP-03 · Spirometre SP-Pro', ip: '88.241.12.44' },
  { id: 'LOG-008', tarih: '2026-10-30T10:15:00', kullanici: 'akaya', islem: 'Test fiyatı değiştirildi', kayit: 'TST-05 · Saf ton odyometri', eski: '240 ₺', yeni: '260 ₺', ip: '88.250.77.91' },
  { id: 'LOG-009', tarih: '2026-10-28T13:40:00', kullanici: 'yilmazturk', islem: 'Hesap devre dışı bırakıldı', kayit: 'USR-06 (mdemir)', ip: '88.241.12.44' },
  { id: 'LOG-010', tarih: '2026-10-27T09:00:00', kullanici: 'oyildiz', islem: 'Dışa aktarım', kayit: 'firma-raporu.csv', ip: '85.110.30.7' },
]
