/*
 * Sertifika Tasarım Merkezi — eleman-tabanlı tasarım modeli.
 * Her şablon dikey (210×297mm) ve yatay (297×210mm) A4 için ayrı yerleşim taşır;
 * yön değişimi sayfayı döndürmez, elemanlar yeni orana göre yerleştirilir.
 * Verilmiş sertifikalar kendi tasarım anlık görüntüsünü (eleman listesini) taşır —
 * şablon sonradan değişse de eski belgeler bozulmaz.
 */
import { TODAY } from '@/data/dashboard'
import { osgbAd, osgbLogoHarf } from '@/lib/osgb'

/* ------------------------------ Eleman modeli ----------------------------- */

export type Yon = 'yatay' | 'dikey'
export const YON_MM: Record<Yon, { w: number; h: number }> = {
  yatay: { w: 297, h: 210 },
  dikey: { w: 210, h: 297 },
}

export type AlanAnahtar = keyof typeof ALANLAR
export const ALANLAR = {
  employee_name: 'Personel adı',
  employee_title: 'Görev unvanı',
  employee_id: 'T.C. kimlik numarası',
  company_name: 'Firma adı',
  training_name: 'Eğitim adı',
  training_duration: 'Eğitim süresi',
  training_date: 'Eğitim tarihi',
  training_start: 'Eğitim başlangıç tarihi',
  training_end: 'Eğitim bitiş tarihi',
  training_mode: 'Eğitim şekli',
  training_place: 'Eğitim yeri',
  training_type: 'Eğitim türü',
  training_instructors: 'Eğitici / eğiticiler',
  completion_date: 'Tamamlanma tarihi',
  issue_date: 'Düzenlenme tarihi',
  expiry_date: 'Geçerlilik tarihi',
  certificate_number: 'Sertifika numarası',
  verification_url: 'Doğrulama adresi',
  approver_name: 'Onaylayan adı',
  approver_title: 'Onaylayan unvanı',
  belge_turu: 'Belge türü rozeti',
} as const

export type ElemanTur = 'metin' | 'alan' | 'qr' | 'cizgi' | 'kutu' | 'daire' | 'logo' | 'imza' | 'filigran' | 'rozet' | 'konuTablosu'

export interface SertifikaKonu {
  bolum: string
  baslik: string
  sureDakika: number
}

export interface TasarimEleman {
  id: string
  tur: ElemanTur
  x: number
  y: number
  w: number
  h: number
  /** Statik metin veya alanın önizleme/boş-veri metni */
  metin?: string
  alan?: AlanAnahtar
  font?: string
  /** mm cinsinden yazı yüksekliği */
  boyut?: number
  kalin?: number
  renk?: string
  hiza?: 'sol' | 'orta' | 'sag'
  opaklik?: number
  dondurme?: number
  harfAraligi?: number // mm
  kenar?: { renk: string; kalinlik: number; yaricap?: number }
  doldur?: string
  /** İmza elemanında ünvan+ad alt satırları */
  imzaUnvan?: string
  imzaAlan?: 'approver_name' | 'approver_title'
  /** Veri boşken elemanı gizle (alanlar için) */
  gizleBos?: boolean
}

/* ------------------------------- Şablonlar -------------------------------- */

export interface TasarimSablon {
  id: string
  ad: string
  aciklama: string
  kategori: string
  belgeTuru: 'katilim' | 'resmi'
  font: string
  yon: Yon
  zemin: string
  duzenYatay: TasarimEleman[]
  duzenDikey: TasarimEleman[]
  /** Arka yüz düzenleri bulunmayan eski şablonlar ön yüz olarak çalışmaya devam eder. */
  duzenArkaYatay?: TasarimEleman[]
  duzenArkaDikey?: TasarimEleman[]
  aktif: boolean
  arsiv: boolean
  varsayilan: boolean
  surum: number
  olusturma: string
  guncelleme: string
  kullanimSayisi: number
}

export interface SertifikaVeri {
  employee_name: string
  employee_title?: string
  employee_id?: string
  company_name: string
  training_name: string
  training_duration: string
  training_date?: string
  training_start?: string
  training_end?: string
  training_mode?: string
  training_place?: string
  training_type?: string
  training_instructors?: string
  completion_date: string
  issue_date: string
  expiry_date: string
  certificate_number: string
  verification_url: string
  approver_name: string
  approver_title: string
  belge_turu: string
  training_topics?: SertifikaKonu[]
  training_total_duration?: string
}

export const ORNEK_VERI: SertifikaVeri = {
  employee_name: 'Ahmet Yılmaz',
  employee_title: 'Bakım teknisyeni',
  employee_id: '•••••••0146',
  company_name: 'ABC Tekstil',
  training_name: 'Temel İş Sağlığı ve Güvenliği Eğitimi',
  training_duration: '42 dk',
  training_date: '05.11.2026',
  training_mode: 'Yüz yüze',
  training_place: 'Kocaeli',
  training_type: 'İlk defa',
  completion_date: '05.11.2026',
  issue_date: '05.11.2026',
  expiry_date: '05.11.2027',
  certificate_number: 'SRT-2026-000001',
  verification_url: 'isghub.app/dogrula/d8f2k9mq4x',
  approver_name: 'Tunahan Yılmaztürk',
  approver_title: 'OSGB Sorumlu Müdürü',
  belge_turu: 'KATILIM BELGESİ',
  training_topics: [
    { bolum: 'EĞİTİME GİRİŞ', baslik: 'Yüksekte çalışma kavramı ve kapsamı', sureDakika: 8 },
    { bolum: 'EĞİTİME GİRİŞ', baslik: 'Düşme risklerini tanıma', sureDakika: 7 },
    { bolum: 'GÜVENLİ ÇALIŞMA', baslik: 'Çalışma alanı ve toplu koruma', sureDakika: 9 },
    { bolum: 'GÜVENLİ ÇALIŞMA', baslik: 'Kişisel koruyucu donanımlar', sureDakika: 10 },
    { bolum: 'ACİL DURUM', baslik: 'Kurtarma planı ve askıda kalma', sureDakika: 8 },
  ],
  training_total_duration: '42 dk',
}

export const FONTLAR = [
  { key: 'Inter', css: "'Inter', system-ui, sans-serif" },
  { key: 'Manrope', css: "'Manrope', system-ui, sans-serif" },
  { key: 'Lato', css: "'Lato', system-ui, sans-serif" },
  { key: 'Montserrat', css: "'Montserrat', system-ui, sans-serif" },
  { key: 'Playfair Display', css: "'Playfair Display', Georgia, serif" },
  { key: 'Source Sans 3', css: "'Source Sans 3', system-ui, sans-serif" },
] as const
export const fontCss = (k?: string) => FONTLAR.find((f) => f.key === k)?.css ?? FONTLAR[0].css

/* --------------------------- Eleman yardımcıları -------------------------- */

let esq = 0
const e = (tur: ElemanTur, x: number, y: number, w: number, h: number, ek: Partial<TasarimEleman> = {}): TasarimEleman =>
  ({ id: `e${(esq++).toString(36)}`, tur, x, y, w, h, ...ek })
const T = (x: number, y: number, w: number, h: number, metin: string, ek: Partial<TasarimEleman>) =>
  e('metin', x, y, w, h, { metin, hiza: 'orta', ...ek })
const A = (x: number, y: number, w: number, h: number, alan: AlanAnahtar, ek: Partial<TasarimEleman>) =>
  e('alan', x, y, w, h, { alan, hiza: 'orta', gizleBos: true, ...ek })
const Q = (x: number, y: number, s: number, ek: Partial<TasarimEleman> = {}) => e('qr', x, y, s, s, ek)
const L = (x: number, y: number, w: number, kalinlik: number, renk: string, ek: Partial<TasarimEleman> = {}) =>
  e('cizgi', x, y, w, kalinlik, { doldur: renk, ...ek })
const K = (x: number, y: number, w: number, h: number, ek: Partial<TasarimEleman> = {}) => e('kutu', x, y, w, h, ek)
const IMZA = (x: number, y: number, w: number, unvan: string, ek: Partial<TasarimEleman> = {}) =>
  e('imza', x, y, w, 16, { imzaUnvan: unvan, imzaAlan: 'approver_name', renk: '#1E293B', boyut: 3.4, ...ek })
const LOGO = (x: number, y: number, s: number, renk = '#16324F') =>
  e('logo', x, y, s, s, { doldur: renk, metin: '{OSGB_HARF}' })

const arkaYuzDuzen = (yon: Yon): TasarimEleman[] => yon === 'yatay' ? [
  K(8, 8, 281, 194, { doldur: '#FFFEFB', kenar: { renk: '#D6D3CE', kalinlik: 0.35 } }),
  K(8, 8, 281, 29, { doldur: '#18181B' }),
  K(8, 8, 3, 29, { doldur: '#F59E0B' }),
  LOGO(18, 16, 13, '#F59E0B'),
  T(36, 15, 139, 5, '{OSGB}', { boyut: 3.6, kalin: 700, renk: '#FAFAF9', hiza: 'sol' }),
  T(36, 22, 139, 4, 'İŞ SAĞLIĞI VE GÜVENLİĞİ', { boyut: 2, kalin: 600, renk: '#A1A1AA', hiza: 'sol', harfAraligi: 0.55 }),
  T(204, 18, 72, 5, 'EĞİTİM İÇERİĞİ  ·  ARKA YÜZ', { boyut: 2.25, kalin: 700, renk: '#FBBF24', hiza: 'sag', harfAraligi: 0.25 }),
  T(18, 44, 261, 4, 'EĞİTİM PROGRAMI', { boyut: 2.2, kalin: 700, renk: '#A16207', hiza: 'sol', harfAraligi: 0.65 }),
  A(18, 49, 261, 8, 'training_name', { boyut: 4, kalin: 700, renk: '#18181B', hiza: 'sol' }),
  e('konuTablosu', 18, 61, 261, 126, { renk: '#27272A' }),
  L(18, 191, 261, 0.3, '#E4E4E7'),
  T(18, 194, 183, 4, 'Konu başlıkları, tamamlanan eğitim sürümünden alınmıştır.', { boyut: 2.1, renk: '#71717A', hiza: 'sol' }),
  A(205, 194, 74, 4, 'certificate_number', { boyut: 2.25, kalin: 700, renk: '#52525B', hiza: 'sag' }),
] : [
  K(8, 8, 194, 281, { doldur: '#FFFEFB', kenar: { renk: '#D6D3CE', kalinlik: 0.35 } }),
  K(8, 8, 194, 31, { doldur: '#18181B' }),
  K(8, 8, 3, 31, { doldur: '#F59E0B' }),
  LOGO(18, 17, 13, '#F59E0B'),
  T(36, 16, 145, 5, '{OSGB}', { boyut: 3.5, kalin: 700, renk: '#FAFAF9', hiza: 'sol' }),
  T(36, 23, 145, 4, 'İŞ SAĞLIĞI VE GÜVENLİĞİ', { boyut: 2, kalin: 600, renk: '#A1A1AA', hiza: 'sol' }),
  T(18, 47, 174, 4, 'EĞİTİM PROGRAMI', { boyut: 2.1, kalin: 700, renk: '#A16207', hiza: 'sol', harfAraligi: 0.6 }),
  A(18, 53, 174, 9, 'training_name', { boyut: 3.6, kalin: 700, renk: '#18181B', hiza: 'sol' }),
  e('konuTablosu', 18, 68, 174, 190, { renk: '#27272A' }),
  L(18, 263, 174, 0.3, '#E4E4E7'),
  T(18, 267, 174, 5, 'Konu başlıkları tamamlanan eğitim sürümündendir.', { boyut: 2, renk: '#71717A', hiza: 'sol' }),
  A(18, 278, 174, 4, 'certificate_number', { boyut: 2.2, kalin: 700, renk: '#52525B', hiza: 'sol' }),
]
interface Duzen { zemin: string; yatay: TasarimEleman[]; dikey: TasarimEleman[] }

/* ============================ 4 YENİ TASARIM ============================== */

// Tek çizgi, geniş boşluk ve baskıda güçlü kontrast kullanan yeni koleksiyon.
const amberSignature = (): Duzen => ({
  zemin: '#FFFEFB',
  yatay: [
    K(8, 8, 281, 194, { kenar: { renk: '#D6D3CE', kalinlik: 0.35 } }),
    K(8, 8, 3, 194, { doldur: '#F59E0B' }),
    LOGO(22, 18, 15, '#18181B'),
    T(43, 19, 154, 5, '{OSGB}', { boyut: 3.8, kalin: 700, renk: '#27272A', hiza: 'sol' }),
    T(43, 26, 154, 4, 'İŞ SAĞLIĞI VE GÜVENLİĞİ', { boyut: 2.3, kalin: 600, renk: '#71717A', hiza: 'sol', harfAraligi: 0.7 }),
    T(38, 49, 220, 8, 'EĞİTİM TAMAMLAMA BELGESİ', { boyut: 5.5, kalin: 800, renk: '#18181B', harfAraligi: 1.1 }),
    K(137, 62, 23, 1.1, { doldur: '#F59E0B' }),
    T(38, 73, 220, 5, 'Bu belge, aşağıda adı bulunan katılımcıya sunulmuştur.', { boyut: 3.2, renk: '#71717A' }),
    A(30, 84, 236, 14, 'employee_name', { boyut: 9.3, kalin: 700, renk: '#18181B', font: 'Playfair Display' }),
    A(38, 101, 220, 5, 'company_name', { boyut: 3.2, renk: '#52525B' }),
    A(32, 116, 232, 7, 'training_name', { boyut: 4.2, kalin: 700, renk: '#27272A' }),
    A(38, 126, 220, 5, 'training_duration', { boyut: 3, renk: '#71717A' }),
    L(38, 141, 218, 0.3, '#E4E4E7'),
    T(38, 148, 64, 4, 'TAMAMLANMA', { boyut: 2.2, kalin: 700, renk: '#A1A1AA', hiza: 'sol', harfAraligi: 0.7 }),
    A(38, 154, 64, 6, 'completion_date', { boyut: 3.3, kalin: 600, renk: '#27272A', hiza: 'sol' }),
    T(112, 148, 64, 4, 'DÜZENLENME', { boyut: 2.2, kalin: 700, renk: '#A1A1AA', hiza: 'sol', harfAraligi: 0.7 }),
    A(112, 154, 64, 6, 'issue_date', { boyut: 3.3, kalin: 600, renk: '#27272A', hiza: 'sol' }),
    T(186, 148, 64, 4, 'GEÇERLİLİK', { boyut: 2.2, kalin: 700, renk: '#A1A1AA', hiza: 'sol', harfAraligi: 0.7 }),
    A(186, 154, 64, 6, 'expiry_date', { boyut: 3.3, kalin: 600, renk: '#27272A', hiza: 'sol' }),
    IMZA(38, 174, 70, 'OSGB Sorumlu Müdürü', { hiza: 'sol', renk: '#27272A' }),
    Q(248, 160, 26),
    A(231, 189, 58, 4, 'certificate_number', { boyut: 2.5, kalin: 600, renk: '#71717A' }),
  ],
  dikey: [
    K(8, 8, 194, 281, { kenar: { renk: '#D6D3CE', kalinlik: 0.35 } }),
    K(8, 8, 3, 281, { doldur: '#F59E0B' }),
    LOGO(22, 18, 15, '#18181B'),
    T(43, 19, 140, 5, '{OSGB}', { boyut: 3.8, kalin: 700, renk: '#27272A', hiza: 'sol' }),
    T(43, 26, 140, 4, 'İŞ SAĞLIĞI VE GÜVENLİĞİ', { boyut: 2.3, kalin: 600, renk: '#71717A', hiza: 'sol', harfAraligi: 0.7 }),
    T(20, 53, 170, 8, 'EĞİTİM TAMAMLAMA', { boyut: 5, kalin: 800, renk: '#18181B', harfAraligi: 1 }),
    T(20, 62, 170, 8, 'BELGESİ', { boyut: 5, kalin: 800, renk: '#18181B', harfAraligi: 1 }),
    K(93, 76, 24, 1.1, { doldur: '#F59E0B' }),
    T(20, 91, 170, 5, 'Bu belge, aşağıda adı bulunan katılımcıya sunulmuştur.', { boyut: 3, renk: '#71717A' }),
    A(16, 103, 178, 14, 'employee_name', { boyut: 8.5, kalin: 700, renk: '#18181B', font: 'Playfair Display' }),
    A(20, 120, 170, 5, 'company_name', { boyut: 3, renk: '#52525B' }),
    A(16, 137, 178, 8, 'training_name', { boyut: 4, kalin: 700, renk: '#27272A' }),
    A(20, 148, 170, 5, 'training_duration', { boyut: 2.9, renk: '#71717A' }),
    L(20, 165, 170, 0.3, '#E4E4E7'),
    T(20, 175, 78, 4, 'TAMAMLANMA', { boyut: 2.1, kalin: 700, renk: '#A1A1AA', hiza: 'sol', harfAraligi: 0.6 }),
    A(20, 181, 78, 6, 'completion_date', { boyut: 3.1, kalin: 600, renk: '#27272A', hiza: 'sol' }),
    T(108, 175, 78, 4, 'DÜZENLENME', { boyut: 2.1, kalin: 700, renk: '#A1A1AA', hiza: 'sol', harfAraligi: 0.6 }),
    A(108, 181, 78, 6, 'issue_date', { boyut: 3.1, kalin: 600, renk: '#27272A', hiza: 'sol' }),
    T(20, 196, 78, 4, 'GEÇERLİLİK', { boyut: 2.1, kalin: 700, renk: '#A1A1AA', hiza: 'sol', harfAraligi: 0.6 }),
    A(20, 202, 78, 6, 'expiry_date', { boyut: 3.1, kalin: 600, renk: '#27272A', hiza: 'sol' }),
    IMZA(20, 239, 86, 'OSGB Sorumlu Müdürü', { hiza: 'sol', renk: '#27272A' }),
    Q(151, 242, 28),
    A(20, 279, 120, 4, 'certificate_number', { boyut: 2.5, kalin: 600, renk: '#71717A', hiza: 'sol' }),
  ],
})

const corporateBand = (): Duzen => ({
  zemin: '#FFFFFF',
  yatay: [
    K(0, 0, 69, 210, { doldur: '#27272A' }), K(69, 0, 2, 210, { doldur: '#F59E0B' }),
    LOGO(25, 24, 18, '#F59E0B'),
    T(10, 54, 49, 12, '{OSGB}', { boyut: 3.2, kalin: 700, renk: '#FFFFFF', hiza: 'orta' }),
    T(10, 70, 49, 10, 'İŞ SAĞLIĞI VE GÜVENLİĞİ', { boyut: 2, kalin: 600, renk: '#A1A1AA', hiza: 'orta', harfAraligi: 0.3 }),
    T(88, 23, 190, 8, 'SERTİFİKA', { boyut: 6.5, kalin: 800, renk: '#18181B', hiza: 'sol', harfAraligi: 1.6 }),
    K(88, 35, 36, 1.4, { doldur: '#F59E0B' }),
    T(88, 44, 190, 5, 'EĞİTİM KATILIM BELGESİ', { boyut: 2.8, kalin: 700, renk: '#A16207', hiza: 'sol', harfAraligi: 0.7 }),
    A(88, 65, 186, 13, 'employee_name', { boyut: 8.8, kalin: 800, renk: '#18181B', hiza: 'sol', font: 'Montserrat' }),
    A(88, 82, 186, 5, 'company_name', { boyut: 3.1, renk: '#71717A', hiza: 'sol' }),
    K(88, 96, 186, 24, { doldur: '#FAFAF9', kenar: { renk: '#E4E4E7', kalinlik: 0.3, yaricap: 2 } }),
    A(94, 101, 174, 7, 'training_name', { boyut: 4, kalin: 700, renk: '#27272A', hiza: 'sol' }),
    A(94, 110, 174, 5, 'training_duration', { boyut: 2.8, renk: '#71717A', hiza: 'sol' }),
    T(88, 135, 82, 4, 'TAMAMLANMA TARİHİ', { boyut: 2.1, kalin: 700, renk: '#A1A1AA', hiza: 'sol', harfAraligi: 0.4 }),
    A(88, 141, 82, 6, 'completion_date', { boyut: 3.2, kalin: 600, renk: '#27272A', hiza: 'sol' }),
    T(180, 135, 88, 4, 'GEÇERLİLİK TARİHİ', { boyut: 2.1, kalin: 700, renk: '#A1A1AA', hiza: 'sol', harfAraligi: 0.4 }),
    A(180, 141, 88, 6, 'expiry_date', { boyut: 3.2, kalin: 600, renk: '#27272A', hiza: 'sol' }),
    IMZA(88, 171, 72, 'OSGB Sorumlu Müdürü', { hiza: 'sol', renk: '#27272A' }),
    Q(239, 160, 27), A(226, 190, 62, 4, 'certificate_number', { boyut: 2.4, kalin: 600, renk: '#71717A' }),
  ],
  dikey: [
    K(0, 0, 210, 54, { doldur: '#27272A' }), K(0, 54, 210, 2, { doldur: '#F59E0B' }),
    LOGO(18, 15, 18, '#F59E0B'),
    T(44, 16, 145, 7, '{OSGB}', { boyut: 4.2, kalin: 700, renk: '#FFFFFF', hiza: 'sol' }),
    T(44, 26, 145, 6, 'İŞ SAĞLIĞI VE GÜVENLİĞİ', { boyut: 2.3, kalin: 600, renk: '#A1A1AA', hiza: 'sol' }),
    T(20, 76, 170, 8, 'SERTİFİKA', { boyut: 6.2, kalin: 800, renk: '#18181B', hiza: 'sol', harfAraligi: 1.4 }),
    K(20, 88, 36, 1.4, { doldur: '#F59E0B' }),
    A(16, 105, 178, 12, 'employee_name', { boyut: 8.2, kalin: 800, renk: '#18181B', hiza: 'sol', font: 'Montserrat' }),
    A(20, 121, 170, 5, 'company_name', { boyut: 3, renk: '#71717A', hiza: 'sol' }),
    K(20, 138, 170, 27, { doldur: '#FAFAF9', kenar: { renk: '#E4E4E7', kalinlik: 0.3, yaricap: 2 } }),
    A(25, 144, 160, 7, 'training_name', { boyut: 3.8, kalin: 700, renk: '#27272A', hiza: 'sol' }),
    A(25, 154, 160, 5, 'training_duration', { boyut: 2.8, renk: '#71717A', hiza: 'sol' }),
    T(20, 181, 78, 4, 'TAMAMLANMA', { boyut: 2, kalin: 700, renk: '#A1A1AA', hiza: 'sol' }),
    A(20, 187, 78, 6, 'completion_date', { boyut: 3, kalin: 600, renk: '#27272A', hiza: 'sol' }),
    T(108, 181, 78, 4, 'GEÇERLİLİK', { boyut: 2, kalin: 700, renk: '#A1A1AA', hiza: 'sol' }),
    A(108, 187, 78, 6, 'expiry_date', { boyut: 3, kalin: 600, renk: '#27272A', hiza: 'sol' }),
    IMZA(20, 232, 82, 'OSGB Sorumlu Müdürü', { hiza: 'sol', renk: '#27272A' }),
    Q(151, 236, 28), A(20, 279, 120, 4, 'certificate_number', { boyut: 2.4, kalin: 600, renk: '#71717A', hiza: 'sol' }),
  ],
})

const academicSeal = (): Duzen => ({
  zemin: '#FFFEFB',
  yatay: [
    K(10, 10, 277, 190, { kenar: { renk: '#A1A1AA', kalinlik: 0.35 } }),
    K(14, 14, 269, 182, { kenar: { renk: '#E4E4E7', kalinlik: 0.25 } }),
    e('daire', 139, 19, 19, 19, { doldur: '#FFF7E6', kenar: { renk: '#F59E0B', kalinlik: 0.7 } }),
    e('metin', 139, 24, 19, 8, { metin: '{OSGB_HARF}', boyut: 4.7, kalin: 800, renk: '#27272A', hiza: 'orta' }),
    T(40, 49, 217, 8, 'KATILIM SERTİFİKASI', { boyut: 5.8, kalin: 700, renk: '#27272A', harfAraligi: 1.4, font: 'Playfair Display' }),
    T(40, 62, 217, 5, 'EĞİTİM PROGRAMINI BAŞARIYLA TAMAMLAMIŞTIR', { boyut: 2.5, kalin: 600, renk: '#A16207', harfAraligi: 0.6 }),
    A(35, 81, 227, 14, 'employee_name', { boyut: 9.6, kalin: 600, renk: '#18181B', font: 'Playfair Display' }),
    L(86, 99, 125, 0.35, '#D4D4D8'),
    A(45, 106, 207, 5, 'company_name', { boyut: 3.2, renk: '#71717A' }),
    A(42, 121, 213, 8, 'training_name', { boyut: 4.2, kalin: 700, renk: '#27272A' }),
    A(45, 132, 207, 5, 'training_duration', { boyut: 2.9, renk: '#71717A' }),
    T(58, 151, 55, 4, 'TAMAMLANMA', { boyut: 2.1, kalin: 700, renk: '#A1A1AA' }),
    A(58, 157, 55, 6, 'completion_date', { boyut: 3.2, kalin: 600, renk: '#27272A' }),
    T(121, 151, 55, 4, 'DÜZENLENME', { boyut: 2.1, kalin: 700, renk: '#A1A1AA' }),
    A(121, 157, 55, 6, 'issue_date', { boyut: 3.2, kalin: 600, renk: '#27272A' }),
    T(184, 151, 55, 4, 'GEÇERLİLİK', { boyut: 2.1, kalin: 700, renk: '#A1A1AA' }),
    A(184, 157, 55, 6, 'expiry_date', { boyut: 3.2, kalin: 600, renk: '#27272A' }),
    IMZA(39, 176, 67, 'OSGB Sorumlu Müdürü', { renk: '#27272A' }),
    Q(249, 159, 24), A(234, 187, 54, 4, 'certificate_number', { boyut: 2.4, renk: '#71717A' }),
  ],
  dikey: [
    K(10, 10, 190, 277, { kenar: { renk: '#A1A1AA', kalinlik: 0.35 } }),
    K(14, 14, 182, 269, { kenar: { renk: '#E4E4E7', kalinlik: 0.25 } }),
    e('daire', 95, 22, 20, 20, { doldur: '#FFF7E6', kenar: { renk: '#F59E0B', kalinlik: 0.7 } }),
    e('metin', 95, 28, 20, 8, { metin: '{OSGB_HARF}', boyut: 4.7, kalin: 800, renk: '#27272A', hiza: 'orta' }),
    T(20, 54, 170, 8, 'KATILIM SERTİFİKASI', { boyut: 5.1, kalin: 700, renk: '#27272A', harfAraligi: 1.1, font: 'Playfair Display' }),
    T(20, 67, 170, 6, 'EĞİTİM TAMAMLAMA BELGESİ', { boyut: 2.5, kalin: 600, renk: '#A16207', harfAraligi: 0.5 }),
    A(16, 92, 178, 14, 'employee_name', { boyut: 8.9, kalin: 600, renk: '#18181B', font: 'Playfair Display' }),
    L(48, 109, 114, 0.35, '#D4D4D8'),
    A(20, 117, 170, 5, 'company_name', { boyut: 3, renk: '#71717A' }),
    A(16, 134, 178, 8, 'training_name', { boyut: 4, kalin: 700, renk: '#27272A' }),
    A(20, 146, 170, 5, 'training_duration', { boyut: 2.8, renk: '#71717A' }),
    T(23, 168, 72, 4, 'TAMAMLANMA', { boyut: 2, kalin: 700, renk: '#A1A1AA', hiza: 'sol' }),
    A(23, 174, 72, 6, 'completion_date', { boyut: 3.1, kalin: 600, renk: '#27272A', hiza: 'sol' }),
    T(115, 168, 72, 4, 'DÜZENLENME', { boyut: 2, kalin: 700, renk: '#A1A1AA', hiza: 'sol' }),
    A(115, 174, 72, 6, 'issue_date', { boyut: 3.1, kalin: 600, renk: '#27272A', hiza: 'sol' }),
    T(23, 190, 72, 4, 'GEÇERLİLİK', { boyut: 2, kalin: 700, renk: '#A1A1AA', hiza: 'sol' }),
    A(23, 196, 72, 6, 'expiry_date', { boyut: 3.1, kalin: 600, renk: '#27272A', hiza: 'sol' }),
    IMZA(25, 239, 78, 'OSGB Sorumlu Müdürü', { renk: '#27272A' }),
    Q(151, 243, 27), A(80, 278, 50, 4, 'certificate_number', { boyut: 2.3, renk: '#71717A' }),
  ],
})

const monochromeEssential = (): Duzen => ({
  zemin: '#FFFFFF',
  yatay: [
    K(18, 18, 261, 174, { kenar: { renk: '#E4E4E7', kalinlik: 0.3 } }),
    LOGO(26, 25, 13, '#27272A'),
    T(45, 27, 150, 5, '{OSGB}', { boyut: 3.5, kalin: 700, renk: '#27272A', hiza: 'sol' }),
    T(45, 34, 150, 4, 'EĞİTİM VE YETKİNLİK', { boyut: 2.2, kalin: 600, renk: '#A1A1AA', hiza: 'sol', harfAraligi: 0.7 }),
    T(26, 61, 170, 7, 'SERTİFİKA', { boyut: 5.4, kalin: 700, renk: '#27272A', hiza: 'sol', harfAraligi: 1.2 }),
    L(26, 72, 25, 1, '#F59E0B'),
    A(26, 88, 220, 13, 'employee_name', { boyut: 9.5, kalin: 600, renk: '#18181B', hiza: 'sol', font: 'Inter' }),
    A(26, 105, 220, 5, 'company_name', { boyut: 3.1, renk: '#71717A', hiza: 'sol' }),
    A(26, 121, 220, 7, 'training_name', { boyut: 4, kalin: 600, renk: '#27272A', hiza: 'sol' }),
    A(26, 132, 220, 5, 'training_duration', { boyut: 2.8, renk: '#71717A', hiza: 'sol' }),
    L(26, 148, 220, 0.3, '#E4E4E7'),
    T(26, 157, 68, 4, 'TAMAMLANMA', { boyut: 2.1, kalin: 700, renk: '#A1A1AA', hiza: 'sol' }),
    A(26, 163, 68, 6, 'completion_date', { boyut: 3.1, kalin: 600, renk: '#27272A', hiza: 'sol' }),
    T(102, 157, 68, 4, 'GEÇERLİLİK', { boyut: 2.1, kalin: 700, renk: '#A1A1AA', hiza: 'sol' }),
    A(102, 163, 68, 6, 'expiry_date', { boyut: 3.1, kalin: 600, renk: '#27272A', hiza: 'sol' }),
    IMZA(26, 177, 74, 'OSGB Sorumlu Müdürü', { hiza: 'sol', renk: '#27272A' }),
    Q(247, 153, 24), A(231, 181, 54, 4, 'certificate_number', { boyut: 2.3, renk: '#71717A' }),
  ],
  dikey: [
    K(14, 14, 182, 269, { kenar: { renk: '#E4E4E7', kalinlik: 0.3 } }),
    LOGO(22, 22, 13, '#27272A'),
    T(41, 24, 140, 5, '{OSGB}', { boyut: 3.4, kalin: 700, renk: '#27272A', hiza: 'sol' }),
    T(41, 31, 140, 4, 'EĞİTİM VE YETKİNLİK', { boyut: 2.1, kalin: 600, renk: '#A1A1AA', hiza: 'sol' }),
    T(22, 61, 160, 7, 'SERTİFİKA', { boyut: 5.1, kalin: 700, renk: '#27272A', hiza: 'sol', harfAraligi: 1.1 }),
    L(22, 72, 25, 1, '#F59E0B'),
    A(22, 95, 166, 13, 'employee_name', { boyut: 8.8, kalin: 600, renk: '#18181B', hiza: 'sol', font: 'Inter' }),
    A(22, 112, 166, 5, 'company_name', { boyut: 3, renk: '#71717A', hiza: 'sol' }),
    A(22, 130, 166, 8, 'training_name', { boyut: 3.9, kalin: 600, renk: '#27272A', hiza: 'sol' }),
    A(22, 142, 166, 5, 'training_duration', { boyut: 2.7, renk: '#71717A', hiza: 'sol' }),
    L(22, 160, 166, 0.3, '#E4E4E7'),
    T(22, 172, 75, 4, 'TAMAMLANMA', { boyut: 2, kalin: 700, renk: '#A1A1AA', hiza: 'sol' }),
    A(22, 178, 75, 6, 'completion_date', { boyut: 3, kalin: 600, renk: '#27272A', hiza: 'sol' }),
    T(107, 172, 75, 4, 'GEÇERLİLİK', { boyut: 2, kalin: 700, renk: '#A1A1AA', hiza: 'sol' }),
    A(107, 178, 75, 6, 'expiry_date', { boyut: 3, kalin: 600, renk: '#27272A', hiza: 'sol' }),
    IMZA(22, 237, 78, 'OSGB Sorumlu Müdürü', { hiza: 'sol', renk: '#27272A' }),
    Q(151, 241, 26), A(22, 278, 120, 4, 'certificate_number', { boyut: 2.3, renk: '#71717A', hiza: 'sol' }),
  ],
})

/* ------------------------------- Seed üretimi ----------------------------- */

let stq = 0
const sablon = (ad: string, aciklama: string, kategori: string, belgeTuru: 'katilim' | 'resmi', font: string, yon: Yon, d: Duzen, varsayilan = false): TasarimSablon => ({
  id: `TSB-${String(++stq).padStart(2, '0')}`,
  ad, aciklama, kategori, belgeTuru, font, yon,
  zemin: d.zemin, duzenYatay: d.yatay, duzenDikey: d.dikey,
  duzenArkaYatay: arkaYuzDuzen('yatay'), duzenArkaDikey: arkaYuzDuzen('dikey'),
  aktif: true, arsiv: false, varsayilan, surum: 1,
  olusturma: TODAY, guncelleme: TODAY, kullanimSayisi: 0,
})

export const tasarimSeed: TasarimSablon[] = [
  sablon('Amber İmza', 'Açık zemin, kurumsal imza ve doğrulama QR koduyla dengeli yatay belge.', 'Kurumsal', 'katilim', 'Playfair Display', 'yatay', amberSignature(), true),
  sablon('Kurumsal Şerit', 'Antrasit marka alanı ve amber çizgilerle net, modern bir düzen.', 'Kurumsal', 'katilim', 'Montserrat', 'yatay', corporateBand()),
  sablon('Akademik Mühür', 'İnce çerçeve ve zarif tipografiyle resmî eğitim belgesi.', 'Klasik', 'resmi', 'Playfair Display', 'yatay', academicSeal()),
  sablon('Sade Yetkinlik', 'Mürekkep dostu, yalın tipografi ve kolay okunan bilgi hiyerarşisi.', 'Minimal', 'katilim', 'Inter', 'yatay', monochromeEssential()),
]

/* ------------------------------- Yardımcılar ------------------------------ */

/**
 * {OSGB*} token'larını güncel kiracı kimliğiyle çözer — düzenler çağrı anında
 * canlı kalır; ayarlardan kisaAd değişince yeni önizleme/çıktı anında yansır.
 * Düzenlenmiş kayıtlar çözülmüş metin tutar (anlık görüntü korunur).
 */
export const elemanlariCoz = (liste: TasarimEleman[]): TasarimEleman[] =>
  liste.map((el) => {
    if (!el.metin?.includes('{OSGB')) return el
    return {
      ...el,
      metin: el.metin.replace(/\{OSGB(_BUYUK|_DOMAIN|_HARF)?\}/g, (t) =>
        t === '{OSGB_HARF}' ? osgbLogoHarf()
          : t === '{OSGB_BUYUK}' ? osgbAd().toLocaleUpperCase('tr')
            : t === '{OSGB_DOMAIN}' ? `${osgbAd()} · isghub.app`
              : osgbAd()),
    }
  })

export const sablonDuzen = (t: TasarimSablon, yon?: Yon, yuz: 'on' | 'arka' = 'on'): TasarimEleman[] => {
  const y = yon ?? t.yon
  if (yuz === 'arka') {
    const arka = y === 'yatay' ? t.duzenArkaYatay : t.duzenArkaDikey
    return elemanlariCoz(arka?.length ? arka : arkaYuzDuzen(y))
  }
  return elemanlariCoz(y === 'yatay' ? t.duzenYatay : t.duzenDikey)
}

/** Sertifikayı render verisine çevirir — gerçek kayıt alanlarından dolar */
export const veriGetir = (s: {
  personelAd: string; personelGorev?: string; personelTc?: string; firmaAd: string; egitimAd: string; egitimSure: number
  tamamlanmaTarihi: string; duzenlenmeTarihi: string; gecerlilikTarihi?: string
  sertifikaNo: string; dogrulamaKodu: string; onaylayan: string; belgeTuru: 'katilim' | 'resmi'
  egitimKonulari?: SertifikaKonu[]
  katilimDetayi?: { egitimTarihi?: string; baslangic?: string; bitis?: string; egitimSekli?: string; egitimYeri?: string; egitimTuru?: string; egiticiler?: { adSoyad: string; unvan?: string }[] }
}): SertifikaVeri => ({
  employee_name: s.personelAd,
  employee_title: s.personelGorev,
  employee_id: s.personelTc,
  company_name: s.firmaAd,
  training_name: s.egitimAd,
  training_duration: sureEtiketi(s.egitimSure),
  training_date: s.katilimDetayi?.egitimTarihi ? tarihEtiketi(s.katilimDetayi.egitimTarihi) : undefined,
  training_start: s.katilimDetayi?.baslangic ? tarihEtiketi(s.katilimDetayi.baslangic) : undefined,
  training_end: s.katilimDetayi?.bitis ? tarihEtiketi(s.katilimDetayi.bitis) : undefined,
  training_mode: s.katilimDetayi?.egitimSekli,
  training_place: s.katilimDetayi?.egitimYeri,
  training_type: s.katilimDetayi?.egitimTuru,
  training_instructors: s.katilimDetayi?.egiticiler?.map((x) => [x.adSoyad, x.unvan].filter(Boolean).join(' · ')).join(', '),
  completion_date: tarihEtiketi(s.tamamlanmaTarihi),
  issue_date: tarihEtiketi(s.duzenlenmeTarihi),
  expiry_date: s.gecerlilikTarihi ? tarihEtiketi(s.gecerlilikTarihi) : 'Süresiz',
  certificate_number: s.sertifikaNo,
  verification_url: `/dogrula/${s.dogrulamaKodu}`,
  approver_name: s.onaylayan,
  approver_title: 'OSGB Sorumlu Müdürü',
  belge_turu: s.belgeTuru === 'resmi' ? 'RESMÎ BELGE' : 'KATILIM BELGESİ',
  training_topics: s.egitimKonulari,
  training_total_duration: s.egitimSure > 0 ? sureEtiketi(s.egitimSure) : undefined,
})

export const sureEtiketi = (dakika: number): string => {
  const saat = Math.floor(dakika / 60)
  const kalan = dakika % 60
  return [saat ? `${saat} sa` : '', kalan ? `${kalan} dk` : ''].filter(Boolean).join(' ') || '—'
}

export const tarihEtiketi = (tarih?: string): string => {
  if (!tarih) return ''
  const date = new Date(`${tarih.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? tarih : date.toLocaleDateString('tr-TR')
}
