/*
 * DEMO VERİ SETİ — açıkça demo olarak işaretlenmiş örnek kayıtlar.
 * Bu kayıtlar seed'lere GİRMEZ; yalnızca bir demo oturumu başladığında
 * src/lib/demo-session.ts içindeki ensureDemoData() tarafından store'lara
 * enjekte edilir ve demo oturumu kapanınca geri yüklenen anlık görüntüyle
 * birlikte kaybolur. Gerçek (seed) kayıtlarla aynı şemayı kullanır ama
 * hiçbir gerçek müşteri verisi içermez.
 *
 * Tarihler TODAY'e göre göreli tutulur (gun / saat yardımcıları). Böylece
 * demo verisi, TODAY güncellendiğinde kendiliğinden güncel kalır.
 *
 * Demo hesapların sifreHash'i YOK — normal kimlik girişi bu hesaplara
 * kapalıdır (login() sifreHash olmayan hesabı atlar); yalnızca
 * auth-store.demoLogin() oturum açabilir. İstemciye gömülü demo şifresi yok.
 * Üretimde: demo oturumları sunucuda izole bir demo tenant'ında, süreli ve
 * rate-limit'li olarak oluşturulur; demo kayıtları ayrı şemada tutulur.
 */
import { TODAY } from '@/data/dashboard'
import type { KullaniciHesap } from '@/data/ekip'
import type { EgitimAtama, FirmaPersonel, KvkkTeyit, PortalHesap } from '@/data/personeller'
import type { EgitimIlerleme } from '@/data/egitimler'
import type { Firma } from '@/data/firmalar'
import type { FirmaYetkili } from '@/data/firma-portal'
import type { KatipKayit } from '@/data/isgkatip'
import type { Sertifika, SertifikaBasvuru } from '@/data/sertifikalar'

/** TODAY'e n gün ekler (negatif = geçmiş). Sonuç YYYY-MM-DD. */
const gun = (n: number): string => {
  const d = new Date(`${TODAY}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** TODAY'e n gün ekler ve verilen saati birleştirir (YYYY-MM-DDTHH:MM:SS). */
const saat = (n: number, hhmm: string): string => `${gun(n)}T${hhmm}:00`

/** Demo firma kurulum tarihi — tüm kurulum kayıtlarının ortak başlangıcı */
const KURULUM = gun(-300)

/** Demo veri sürümü — TODAY veya demo içeriği değişince tarayıcıdaki eski demo kayıtlarını yeniler */
export const DEMO_SURUM = `${TODAY}-v2`

export const DEMO_FIRMA_ID = 'FR-DEMO'
export const DEMO_YONETIM_KULLANICI = 'demo-yonetim'
export const DEMO_FIRMA_KULLANICI = 'demo-firma'
export const DEMO_KATILIMCI_KULLANICI = 'demo-katilimci'

/* ------------------------------ OSGB yönetim ------------------------------ */

/** Demo yönetim hesabı — Sistem Yöneticisi rolü tüm modülleri gösterir */
export const demoHesap: KullaniciHesap = {
  id: 'USR-DEMO',
  kullaniciAdi: DEMO_YONETIM_KULLANICI,
  ad: 'Demo Yönetici',
  eposta: 'demo@isghub.local',
  rol: 'Sistem Yöneticisi',
  durum: 'Aktif',
}

/* --------------------------------- Demo firma ------------------------------- */

export const demoFirma: Firma = {
  id: DEMO_FIRMA_ID,
  kod: 'DEMO-001',
  unvan: 'Demo Lojistik A.Ş.',
  kisaAd: 'Demo Lojistik',
  vergiDairesi: 'Kadıköy',
  vergiNo: '0000000000',
  sgkSicil: '0-00-00-00-0000000',
  tehlikeSinifi: 'Tehlikeli',
  nace: '52.10.01',
  faaliyet: 'Depolama ve lojistik hizmetleri',
  calisanSayisi: 3,
  il: 'İstanbul',
  ilce: 'Kadıköy',
  adres: 'Demo Mahallesi, Örnek Caddesi No:1, Kadıköy / İstanbul',
  telefon: '0500 000 00 00',
  eposta: 'demo@demo-lojistik.local',
  yetkili: 'Elif Demiray',
  kisiler: [
    { id: 'FK-DEMO-1', ad: 'Elif Demiray', gorev: 'İnsan Kaynakları Müdürü', telefon: '0500 000 00 01', eposta: 'demo@demo-lojistik.local', birincil: true },
  ],
  hizmetTuru: 'OSGB Kapsamlı Hizmet',
  uzman: 'Ayşe Kaya',
  uzmanSinifi: 'B',
  hekim: 'Dr. Selin Aydemir',
  dsp: 'Hemşire Kaan Ünal',
  hizmetBaslangic: KURULUM,
  hizmetBitis: gun(65),
  notlar: 'Demo veri seti — gerçek müşteri kaydı değildir.',
  ekler: [],
  durum: 'Aktif',
  islemGecmisi: [{ tarih: KURULUM, islem: 'Demo firma kaydı oluşturuldu' }],
}

export const demoKatip: KatipKayit = {
  id: 'KT-DEMO',
  firmaId: DEMO_FIRMA_ID,
  uzman: 'Ayşe Kaya',
  uzmanSinifi: 'B',
  hekim: 'Dr. Selin Aydemir',
  dsp: 'Hemşire Kaan Ünal',
  gorevBaslangic: KURULUM,
  gorevBitis: gun(65),
  sozlesmeNo: 'KT-2026-DEMO',
  sozlesmeTuru: 'OSGB Hizmet Sözleşmesi',
  sozlesmeBaslangic: KURULUM,
  sozlesmeBitis: gun(65),
  belgeler: [],
  aciklama: 'Demo sözleşme kaydı — gerçek müşteri verisi değildir.',
  durum: 'Aktif',
  zamanCizgisi: [{ tarih: KURULUM, islem: 'Demo sözleşme oluşturuldu' }],
}

/* ------------------------------- Firma portalı ------------------------------ */

export const demoYetkili: FirmaYetkili = {
  id: 'FY-DEMO',
  firmaId: DEMO_FIRMA_ID,
  ad: 'Elif',
  soyad: 'Demiray',
  eposta: 'demo@demo-lojistik.local',
  telefon: '0500 000 00 01',
  gorev: 'İnsan Kaynakları Müdürü',
  kullaniciAdi: DEMO_FIRMA_KULLANICI,
  durum: 'Aktif',
  oturumlar: [],
  izinler: ['*'],
  olusturma: KURULUM,
  islemGecmisi: [{ tarih: KURULUM, islem: 'Demo yetkili hesabı oluşturuldu' }],
}

/* ------------------------------- Çalışanlar --------------------------------- */

const demoPersonel = (id: string, ad: string, soyad: string, gorev: string, sicil: string): FirmaPersonel => ({
  id,
  firmaId: DEMO_FIRMA_ID,
  ad,
  soyad,
  eposta: `${id.toLowerCase()}@demo-lojistik.local`,
  telefon: '0500 000 00 00',
  departman: 'Depo',
  gorev,
  sicilNo: sicil,
  durum: 'Aktif',
  firmaGecmisi: [{ firmaId: DEMO_FIRMA_ID, baslangic: KURULUM }],
  olusturma: KURULUM,
  islemGecmisi: [{ tarih: KURULUM, islem: 'Demo personel kaydı oluşturuldu' }],
})

export const demoPersoneller: FirmaPersonel[] = [
  demoPersonel('FP-DEMO-1', 'Deniz', 'Aksoy', 'Depo Operatörü', 'DL-0001'),
  demoPersonel('FP-DEMO-2', 'Kerem', 'Uslu', 'Forklift Operatörü', 'DL-0002'),
  demoPersonel('FP-DEMO-3', 'Melis', 'Tuna', 'Sevkiyat Sorumlusu', 'DL-0003'),
]

/** Katılımcı portalı demo hesabı — FP-DEMO-1 (Deniz Aksoy) */
export const demoPortalHesap: PortalHesap = {
  id: 'PH-DEMO',
  personelId: 'FP-DEMO-1',
  kullaniciAdi: DEMO_KATILIMCI_KULLANICI,
  eposta: 'fp-demo-1@demo-lojistik.local',
  durum: 'Aktif',
  oturumlar: [],
  olusturma: KURULUM,
}

/** KVKK teyidi — demo katılımcı onboarding'i tamamlanmış sayılır */
export const demoKvkkTeyit: KvkkTeyit = {
  id: 'KVT-DEMO',
  hesapId: 'PH-DEMO',
  personelId: 'FP-DEMO-1',
  metinId: 'KVKK-01',
  metinSurum: '1.0',
  icerikHash: 'demo',
  goruntulenme: saat(-294, '09:00'),
  teyitZamani: saat(-294, '09:00'),
  teyitTuru: 'aydinlatma',
  userAgent: 'demo',
}

/* ------------------------------ Eğitim atamaları ---------------------------- */

export const demoAtamalar: EgitimAtama[] = [
  {
    id: 'ATM-DEMO-1',
    egitimId: 'EGT-01',
    surumId: 'ES-0102',
    firmaId: DEMO_FIRMA_ID,
    personelIds: ['FP-DEMO-1', 'FP-DEMO-2', 'FP-DEMO-3'],
    atamaTarihi: gun(-17),
    sonTarih: gun(19),
    zorunlu: true,
    hatirlatmaGun: 3,
    durum: 'Aktif',
    olusturan: 'Demo Yönetici',
    olaylar: [{ tarih: gun(-17), islem: 'Atama oluşturuldu — 3 personel' }],
  },
  {
    id: 'ATM-DEMO-2',
    egitimId: 'EGT-02',
    surumId: 'ES-0201',
    firmaId: DEMO_FIRMA_ID,
    personelIds: ['FP-DEMO-1'],
    atamaTarihi: gun(-66),
    sonTarih: gun(-37),
    zorunlu: true,
    hatirlatmaGun: 0,
    durum: 'Tamamlandı',
    olusturan: 'Demo Yönetici',
    olaylar: [
      { tarih: gun(-66), islem: 'Atama oluşturuldu — 1 personel' },
      { tarih: gun(-39), islem: 'Tüm katılımcılar tamamladı — atama kapandı' },
    ],
  },
]

/* -------------------------------- İlerlemeler ------------------------------- */

export const demoIlerlemeler: EgitimIlerleme[] = [
  {
    id: 'ILR-DEMO-1',
    hesapId: 'FP-DEMO-1',
    egitimId: 'EGT-01',
    surumId: 'ES-0102',
    atamaId: 'ATM-DEMO-1',
    durum: 'Devam Ediyor',
    icerikler: {
      'IC-0102': { izlenenSn: 300, toplamSn: 600, tamamlandi: false },
      'IC-0103': { tamamlandi: true, tamamlanmaTarihi: gun(-5) },
    },
    denemeler: [],
    sonErisim: saat(-3, '10:15'),
  },
  {
    id: 'ILR-DEMO-2',
    hesapId: 'FP-DEMO-2',
    egitimId: 'EGT-01',
    surumId: 'ES-0102',
    atamaId: 'ATM-DEMO-1',
    durum: 'Başlamadı',
    icerikler: {},
    denemeler: [],
    sonErisim: '',
  },
  {
    id: 'ILR-DEMO-4',
    hesapId: 'FP-DEMO-3',
    egitimId: 'EGT-01',
    surumId: 'ES-0102',
    atamaId: 'ATM-DEMO-1',
    durum: 'Başlamadı',
    icerikler: {},
    denemeler: [],
    sonErisim: '',
  },
  {
    id: 'ILR-DEMO-3',
    hesapId: 'FP-DEMO-1',
    egitimId: 'EGT-02',
    surumId: 'ES-0201',
    atamaId: 'ATM-DEMO-2',
    durum: 'Tamamlandı',
    icerikler: {
      'IC-0201': { gorulenSayfalar: [1, 2, 3], tamamlandi: true, tamamlanmaTarihi: gun(-40) },
      'IC-0202': { gorulenSayfalar: [1, 2], tamamlandi: true, tamamlanmaTarihi: gun(-40) },
    },
    denemeler: [{ no: 1, puan: 88, gecti: true, sureSn: 420, tarih: saat(-39, '11:30'), dogruSayisi: 4 }],
    sonErisim: saat(-39, '11:30'),
  },
]

/* --------------------------------- Sertifika -------------------------------- */

export const demoBasvuru: SertifikaBasvuru = {
  id: 'SBV-DEMO',
  atamaId: 'ATM-DEMO-2',
  personelId: 'FP-DEMO-1',
  egitimId: 'EGT-02',
  surumId: 'ES-0201',
  basvuruTarihi: gun(-39),
  durum: 'Onaylandı',
  tamamlanmaTarihi: gun(-39),
  sinavPuani: 88,
  sinavGecti: true,
  denemeSayisi: 1,
  onaylayan: 'Demo Yönetici',
  onayTarihi: gun(-38),
  sertifikaId: 'CRT-DEMO',
  olaylar: [
    { tarih: gun(-39), kullanici: 'Sistem', islem: 'Başvuru oluşturuldu — eğitim tamamlandı' },
    { tarih: gun(-38), kullanici: 'Demo Yönetici', islem: 'Onaylandı — sertifika SRT-2026-900001 düzenlendi' },
  ],
}

export const demoSertifika: Sertifika = {
  id: 'CRT-DEMO',
  sertifikaNo: 'SRT-2026-900001',
  dogrulamaKodu: 'dem0verify42x',
  basvuruId: 'SBV-DEMO',
  atamaId: 'ATM-DEMO-2',
  personelId: 'FP-DEMO-1',
  firmaId: DEMO_FIRMA_ID,
  egitimId: 'EGT-02',
  surumId: 'ES-0201',
  personelAd: 'Deniz Aksoy',
  firmaAd: 'Demo Lojistik A.Ş.',
  egitimAd: 'Yangın Güvenliği ve Tahliye Eğitimi',
  egitimSurumNo: 1,
  egitimSure: 60,
  egitimKategori: 'Yangın',
  belgeTuru: 'katilim',
  sablonId: 'STB-01',
  sablonSnap: {
    baslik: 'EĞİTİM TAMAMLAMA SERTİFİKASI',
    anaRenk: '#16324F',
    vurguRenk: '#2563EB',
    imzalar: [
      { unvan: 'OSGB Sorumlu Müdürü', adSoyad: 'Demo Yönetici' },
      { unvan: 'Eğitim Koordinatörü', adSoyad: 'Ayşe Kaya' },
    ],
  },
  tamamlanmaTarihi: gun(-39),
  duzenlenmeTarihi: gun(-38),
  gecerlilikTarihi: gun(327),
  onaylayan: 'Demo Yönetici',
  onayTarihi: gun(-38),
  durum: 'Aktif',
  gecmis: [
    { tarih: gun(-39), kullanici: 'Sistem', islem: 'Başvuru oluşturuldu — eğitim tamamlandı' },
    { tarih: gun(-38), kullanici: 'Demo Yönetici', islem: 'Onaylandı — sertifika SRT-2026-900001 düzenlendi' },
  ],
}
