/*
 * osgbhub merkezi Excel (.xlsx) dışa aktarma motoru — ExcelJS tabanlı.
 * Tüm modüller sütun/veri tanımlarını verir; görsel tasarım, yazdırma
 * düzeni ve dosya üretimi buradan yönetilir.
 * Üretimde hassas alan kontrolü backend'de de tekrarlanmalıdır.
 */
import type ExcelJS from 'exceljs'
import { osgbAd } from '@saglik/lib/osgb'

/* ---------- tipler ---------- */

export type ExcelTip = 'metin' | 'sayi' | 'tarih' | 'saat' | 'para'

export interface ExcelKolon {
  label: string
  /** Veri tipi — sayı/tarih/para doğru tipte yazılır, metinler '@' formatında */
  tip?: ExcelTip
  /** Elle genişlik; verilmezse içeriğe göre hesaplanır */
  genislik?: number
  /** Otomatik genişlik sınırları */
  minGenislik?: number
  maxGenislik?: number
  /** Uzun metinlerde satır kaydırma */
  wrap?: boolean
}

export type ExcelHucre = string | number | null | undefined

export interface ExcelSayfaDef {
  /** Çalışma sayfası adı — Excel sınırlarına göre normalize edilir */
  ad: string
  /** Rapor başlığı (üst bölüm) */
  baslik: string
  /** Modül / firma / filtre bilgisi */
  altBilgi?: string
  kolonlar: ExcelKolon[]
  satirlar: ExcelHucre[][]
  /** Veri altına küçük özet bloğu (etiket/değer çiftleri) */
  ozet?: [string, string | number][]
}

/* ---------- kurumsal stil presetleri ---------- */

const LACIVERT = 'FF16324F' // kurumsal lacivert
const MAVI_ACIK = 'FFEAF1F8' // zebra bandı
const KENARLIK = 'FFD7DEE7'
const SOLUK = 'FF64748B'

const F_BASLIK: Partial<ExcelJS.Font> = { name: 'Calibri', size: 15, bold: true, color: { argb: LACIVERT } }
const F_META: Partial<ExcelJS.Font> = { name: 'Calibri', size: 9.5, italic: true, color: { argb: SOLUK } }
const F_KOLON: Partial<ExcelJS.Font> = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
const F_VERI: Partial<ExcelJS.Font> = { name: 'Calibri', size: 10, color: { argb: 'FF1F2937' } }
const F_OZET: Partial<ExcelJS.Font> = { name: 'Calibri', size: 10, bold: true, color: { argb: LACIVERT } }

const kenar = (style: ExcelJS.BorderStyle = 'thin'): Partial<ExcelJS.Borders> => ({
  top: { style, color: { argb: KENARLIK } },
  left: { style, color: { argb: KENARLIK } },
  bottom: { style, color: { argb: KENARLIK } },
  right: { style, color: { argb: KENARLIK } },
})

const NUMFMT: Record<ExcelTip, string> = {
  metin: '@',
  sayi: '#,##0',
  tarih: 'DD.MM.YYYY',
  saat: 'HH:mm',
  para: '#,##0.00 "₺"',
}

/* ---------- yardımcılar ---------- */

/** Excel formül enjeksiyonuna karşı kullanıcı metnini güvenli hâle getir */
const guvenliMetin = (v: string): string =>
  /^[=+\-@\t\r]/.test(v) ? `'${v}` : v

/** ISO 'YYYY-MM-DD' / 'DD.MM.YYYY' → Date (değilse null) */
const tarihParse = (s: string): Date | null => {
  const iso = /^(\d{4})-(\d{2})-(\d{2})[T ]?/.exec(s)
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3])
  const tr = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(s)
  if (tr) return new Date(+tr[3], +tr[2] - 1, +tr[1])
  return null
}

/** Sayfa adı Excel sınırlarına uydurulur (31 kar., yasak karakter yok) */
const sayfaAdNorm = (ad: string, i: number) =>
  ad.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31) || `Sayfa ${i + 1}`

/** Sütun genişliğini içerik uzunluğuna göre hesapla (min..max sınırlı) */
const kolonGenisligi = (kol: ExcelKolon, degerler: ExcelHucre[]): number => {
  if (kol.genislik) return kol.genislik
  const uzunluk = (v: ExcelHucre) => {
    if (v == null) return 0
    const s = String(v)
    // Türkçe/geniş karakterler ~1.2 birim yer tutar
    return Math.ceil([...s].reduce((a, c) => a + (c.charCodeAt(0) > 127 ? 1.2 : 1), 0))
  }
  const enUzun = Math.max(uzunluk(kol.label) + 2, ...degerler.map(uzunluk))
  // Not: 9 Excel'in varsayılan sütun genişliğidir; ExcelJS bunu
  // serialize etmeyi atlar — etkin alt sınır 10 tutulur.
  const min = Math.max(kol.minGenislik ?? 10, 10)
  const max = kol.maxGenislik ?? (kol.wrap ? 60 : 44)
  return Math.min(max, Math.max(min, enUzun + 2))
}

/* ---------- sayfa kurucu ---------- */

const sayfaOlustur = (wb: ExcelJS.Workbook, def: ExcelSayfaDef, idx: number) => {
  const ws = wb.addWorksheet(sayfaAdNorm(def.ad, idx), {
    views: [{ state: 'frozen', ySplit: 3 }],
  })
  const kolSay = def.kolonlar.length

  // 1. satır: rapor başlığı
  ws.mergeCells(1, 1, 1, kolSay)
  const b1 = ws.getCell(1, 1)
  b1.value = def.baslik
  b1.font = F_BASLIK
  b1.alignment = { vertical: 'middle' }
  ws.getRow(1).height = 24

  // 2. satır: meta bilgi (modül · tarih · kayıt sayısı)
  ws.mergeCells(2, 1, 2, kolSay)
  const meta = [
    def.altBilgi,
    `Oluşturulma: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`,
    `${def.satirlar.length} kayıt`,
  ]
    .filter(Boolean)
    .join('  ·  ')
  const b2 = ws.getCell(2, 1)
  b2.value = meta
  b2.font = F_META
  b2.alignment = { vertical: 'middle' }
  ws.getRow(2).height = 15

  // 3. satır: kolon başlıkları (lacivert bant) — freeze ySplit 3 buraya kadar
  const hr = ws.getRow(3)
  def.kolonlar.forEach((kol, c) => {
    const cell = hr.getCell(c + 1)
    cell.value = kol.label
    cell.font = F_KOLON
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LACIVERT } }
    cell.alignment = { vertical: 'middle', horizontal: kol.tip === 'sayi' || kol.tip === 'para' ? 'right' : 'left', wrapText: true }
    cell.border = kenar()
  })
  hr.height = 20

  // veri satırları
  def.satirlar.forEach((satir, r) => {
    const row = ws.getRow(4 + r)
    row.height = 17
    def.kolonlar.forEach((kol, c) => {
      const cell = row.getCell(c + 1)
      const v = satir[c]
      const tip = kol.tip ?? 'metin'
      if (v == null || v === '') {
        cell.value = null
      } else if (tip === 'sayi' || tip === 'para') {
        cell.value = typeof v === 'number' ? v : Number(String(v).replace(/\s/g, '').replace(',', '.')) || null
        cell.numFmt = NUMFMT[tip]
        cell.alignment = { vertical: 'middle', horizontal: 'right', wrapText: kol.wrap }
      } else if (tip === 'tarih') {
        const d = typeof v === 'string' ? tarihParse(v) : null
        if (d) {
          cell.value = d
          cell.numFmt = NUMFMT.tarih
        } else {
          cell.value = guvenliMetin(String(v))
          cell.numFmt = NUMFMT.metin
        }
        cell.alignment = { vertical: 'middle', wrapText: kol.wrap }
      } else {
        // metin/tckn/sicil — baştaki sıfırlar korunur, formül enjeksiyonu engellenir
        cell.value = guvenliMetin(String(v))
        cell.numFmt = NUMFMT.metin
        cell.alignment = { vertical: 'middle', wrapText: kol.wrap }
      }
      cell.font = F_VERI
      cell.border = kenar('hair')
      if (r % 2 === 1)
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MAVI_ACIK } }
    })
  })

  // otomatik filtre (başlık satırı)
  ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: kolSay } }

  // özet bloğu
  if (def.ozet?.length) {
    const bas = 4 + def.satirlar.length + 1
    const o = ws.getRow(bas)
    o.getCell(1).value = 'Özet'
    o.getCell(1).font = F_OZET
    o.height = 18
    def.ozet.forEach(([et, deger], i) => {
      const r = ws.getRow(bas + 1 + i)
      r.getCell(1).value = et
      r.getCell(1).font = F_VERI
      const dc = r.getCell(2)
      dc.value = typeof deger === 'number' ? deger : guvenliMetin(String(deger))
      dc.font = { ...F_VERI, bold: true }
      if (typeof deger === 'number') dc.numFmt = NUMFMT.sayi
    })
  }

  // sütun genişlikleri
  def.kolonlar.forEach((kol, c) => {
    ws.getColumn(c + 1).width = kolonGenisligi(kol, def.satirlar.map((s) => s[c]))
  })

  // yazdırma düzeni — A4, genişliğe sığdır, başlık satırını tekrarla
  const toplamW = def.kolonlar.reduce((a, _kol, c) => a + (ws.getColumn(c + 1).width ?? 10), 0)
  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: toplamW > 110 ? 'landscape' : 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: '3:3',
    margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
    showGridLines: false,
  }
  ws.headerFooter = {
    oddHeader: `&L&"Calibri,Bold"${def.baslik}&R&"Calibri"${osgbAd()}`,
    oddFooter: `&L&"Calibri"${new Date().toLocaleDateString('tr-TR')}&C&"Calibri"Sayfa &P / &N`,
  }
}

/* ---------- genel API ---------- */

/** Dosya adı standardı: osgbhub_X_YYYY-MM-DD.xlsx (Türkçe karakterler ASCII'ye iner) */
export const xlsxDosyaAdi = (parca: string): string => {
  const ascii = parca
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/[^\w-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  return `osgbhub_${ascii}_${new Date().toISOString().slice(0, 10)}.xlsx`
}

/** Tek/çok sayfalı profesyonel Excel dosyası üretip indirir */
export const xlsxIndir = async (dosyaAdi: string, sayfalar: ExcelSayfaDef[]): Promise<void> => {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = osgbAd()
  wb.company = 'osgbhub Sağlık Taraması Yönetim Paneli'
  wb.created = new Date()
  sayfalar.forEach((def, i) => sayfaOlustur(wb, def, i))
  const buf = await wb.xlsx.writeBuffer()
  const url = URL.createObjectURL(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
  )
  Object.assign(document.createElement('a'), { href: url, download: dosyaAdi }).click()
  URL.revokeObjectURL(url)
}

/** Kısayol: tek sayfa rapor */
export const xlsxTekSayfa = (parcaAd: string, sayfa: ExcelSayfaDef): Promise<void> =>
  xlsxIndir(xlsxDosyaAdi(parcaAd), [sayfa])
