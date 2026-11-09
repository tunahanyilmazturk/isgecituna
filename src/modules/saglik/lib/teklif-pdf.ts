import { jsPDF } from 'jspdf'
import type { Firma } from '@saglik/data/firmalar'
import { teklifKdvDahil, teklifNet, type Teklif } from '@saglik/data/saglik'

/**
 * Teklif belgesi (A4) üretimi — 2 sayfa:
 *  1. sayfa: kurum künyesi, firma ve teklif bilgileri, ön yazı, şartlar ve koşullar
 *  2. sayfa: teklif kalemleri, toplamlar, ödeme/geçerlilik ve imza
 * Türkçe karakterler için gömülü Arial kullanılır (public/fonts/). Tutarlar "TL" olarak yazılır.
 */

export interface KurumBilgi {
  ad: string
  unvan: string
  /** Logo yoksa kutuda gösterilen baş harfler */
  harf: string
  /** PNG/JPEG data URL; diğer biçimlerde baş harf kutusu kullanılır */
  logo?: string
  adres?: string
  telefon?: string
  eposta?: string
  web?: string
  yetkili?: string
  yetkiliUnvan?: string
}

export type RGB = [number, number, number]
export const AMBER: RGB = [245, 158, 11]
export const AMBER_KOYU: RGB = [180, 83, 9]
export const ZINC900: RGB = [24, 24, 27]
export const ZINC700: RGB = [63, 63, 70]
export const ZINC500: RGB = [113, 113, 122]
export const ZINC300: RGB = [212, 212, 216]
export const ZINC200: RGB = [228, 228, 231]
export const ZINC50: RGB = [250, 250, 250]
export const BEYAZ: RGB = [255, 255, 255]

export const W = 210
export const H = 297
export const M = 16
export const CW = W - 2 * M
/** Sayfa altbilgisinin üstünde kalan son güvenli çizgi */
export const ALT_LIMIT = H - 22
/** 1. sayfa üst bandının alt sınırı (amber çizgi dahil) */
export const BAND_H = 34
/** 2. sayfa devam bandı yüksekliği */
export const DEVAM_BAND_H = 11

/** Ön yazının sonunda kendiliğinden gelen veda satırları (imza bloğu zaten gösterilir) */
export const VEDA = /^(Saygılarımızla|İyi çalışmalar dileriz|Bilgilerinize sunarız),?$/

let fontCache: Promise<{ normal: string; bold: string }> | null = null

function base64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf)
  let s = ''
  const parca = 0x8000
  for (let i = 0; i < bytes.length; i += parca) s += String.fromCharCode(...bytes.subarray(i, i + parca))
  return btoa(s)
}

export function fontlariYukle() {
  if (!fontCache) {
    const oku = (yol: string) =>
      fetch(yol).then((r) => {
        if (!r.ok) throw new Error(`Font yüklenemedi: ${yol}`)
        return r.arrayBuffer()
      })
    fontCache = Promise.all([oku('/fonts/Arial.ttf'), oku('/fonts/Arial-Bold.ttf')])
      .then(([n, b]) => ({ normal: base64(n), bold: base64(b) }))
      .catch((e) => {
        fontCache = null
        throw e
      })
  }
  return fontCache
}

export const tutar = (n: number) => `${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`
export const tarih = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('tr-TR')

/** jsPDF'in okuyabildiği görsel biçimi (PNG/JPEG) döndürür */
export function logoBicimi(logo?: string): 'PNG' | 'JPEG' | null {
  if (!logo) return null
  if (logo.startsWith('data:image/png')) return 'PNG'
  if (logo.startsWith('data:image/jpeg') || logo.startsWith('data:image/jpg')) return 'JPEG'
  return null
}

/**
 * Belge üretimi. `kompakt` yazı boyutunu ve satır aralığını küçültür;
 * ön yazı + şartlar 1. sayfaya sığmazsa üst fonksiyon bu modda yeniden üretir.
 */
function belgeUret(t: Teklif, firma: Firma | undefined, kurum: KurumBilgi, font: { normal: string; bold: string }, kompakt: boolean): jsPDF {
  const olcu = kompakt
    ? { govde: 8.1, govdeAdim: 4.0, govdeBosluk: 1.4, madde: 7.8, maddeAdim: 3.8, maddeBosluk: 0.9 }
    : { govde: 9, govdeAdim: 4.6, govdeBosluk: 2.2, madde: 8.5, maddeAdim: 4.3, maddeBosluk: 1.4 }

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  doc.addFileToVFS('Arial.ttf', font.normal)
  doc.addFont('Arial.ttf', 'Arial', 'normal')
  doc.addFileToVFS('Arial-Bold.ttf', font.bold)
  doc.addFont('Arial-Bold.ttf', 'Arial', 'bold')
  doc.setProperties({ title: `${t.no} - Teklif`, author: kurum.ad, creator: 'osgbhub' })

  /* Tutarlar: kayıtlı değerler varsa onlar, yoksa kalemlerden hesaplanır */
  const net = teklifNet(t)
  const genel = teklifKdvDahil(t)
  const kdvOran = t.kdvOrani ?? 20
  const kdvTutar = genel - net
  const kalemler = t.kalemler ?? []
  const kalemToplam = kalemler.length ? kalemler.reduce((s, k) => s + k.birim * k.miktar, 0) : net
  const indirim = t.indirimTutar ?? Math.max(0, kalemToplam - net)
  const indirimOran = kalemToplam > 0 ? (indirim / kalemToplam) * 100 : 0
  const kisi = Math.max(1, t.kisiSayisi)
  const taslak = t.durum === 'Taslak'

  /* ---- Çizim yardımcıları ---- */
  const metin = (
    s: string,
    x: number,
    yy: number,
    o: { size?: number; bold?: boolean; color?: RGB; align?: 'left' | 'right' | 'center' } = {},
  ) => {
    const c = o.color ?? ZINC900
    doc.setFont('Arial', o.bold ? 'bold' : 'normal')
    doc.setFontSize(o.size ?? 9)
    doc.setTextColor(c[0], c[1], c[2])
    doc.text(s, x, yy, { align: o.align ?? 'left' })
  }
  const dolgu = (c: RGB) => doc.setFillColor(c[0], c[1], c[2])
  const cizgi = (c: RGB, kalinlik = 0.2) => {
    doc.setDrawColor(c[0], c[1], c[2])
    doc.setLineWidth(kalinlik)
  }
  /** Beyaz kart: ince kenarlık, yumuşak köşe */
  const kart = (x: number, yy: number, w: number, h: number) => {
    dolgu(BEYAZ)
    cizgi(ZINC200, 0.25)
    doc.roundedRect(x, yy, w, h, 2.5, 2.5, 'FD')
  }
  /** Bölüm başlığı: solda amber işaret */
  const bolumBasligi = (metinS: string, x: number, yy: number) => {
    dolgu(AMBER)
    doc.rect(x, yy - 3.4, 1.1, 4.6, 'F')
    metin(metinS, x + 3.6, yy, { size: 10, bold: true })
  }
  /** Numaralı madde işareti: koyu daire içinde beyaz sayı */
  const numara = (n: number, cx: number, cy: number) => {
    dolgu(AMBER)
    doc.circle(cx, cy, 2.3, 'F')
    metin(String(n), cx, cy + 0.9, { size: 6.5, bold: true, color: ZINC900, align: 'center' })
  }

  /* ---- Sayfa 1 üst bandı: kurum kimliği ve belge künyesi ---- */
  let y = 0
  const bandCiz = () => {
    dolgu(AMBER)
    doc.rect(0, BAND_H, W, 1.2, 'F')
  }
  const logoKutu = 14
  const logoTip = logoBicimi(kurum.logo)
  const logoCiz = (x: number, yy: number) => {
    if (logoTip && kurum.logo) {
      try {
        const p = doc.getImageProperties(kurum.logo)
        const olcek = Math.min(logoKutu / p.width, logoKutu / p.height)
        doc.addImage(kurum.logo, logoTip, x, yy, p.width * olcek, p.height * olcek)
        return
      } catch {
        /* baş harf kutusuna düş */
      }
    }
    dolgu(AMBER)
    doc.roundedRect(x, yy, logoKutu, logoKutu, 2.5, 2.5, 'F')
    metin(kurum.harf, x + logoKutu / 2, yy + 9.3, { size: 12, bold: true, align: 'center' })
  }

  bandCiz()
  logoCiz(M, 9)
  metin(kurum.ad, M + 18, 15.5, { size: 14, bold: true })
  metin(kurum.unvan, M + 18, 20.5, { size: 7.5, color: ZINC500 })
  const iletisim = [kurum.telefon, kurum.eposta, kurum.web].filter(Boolean).join('   ·   ')
  if (iletisim) metin(iletisim, M + 18, 25.5, { size: 7, color: ZINC500 })

  metin('TEKLİF', W - M, 15, { size: 20, bold: true, color: AMBER_KOYU, align: 'right' })
  const kunye: [string, string][] = [
    ['Teklif no', t.no],
    ['Teklif tarihi', tarih(t.tarih)],
    ['Geçerlilik', tarih(t.gecerlilik)],
  ]
  kunye.forEach(([k, v], i) => {
    const satir = 21 + i * 4.2
    metin(k, W - M - 32, satir, { size: 7.5, color: ZINC500, align: 'right' })
    metin(v, W - M, satir, { size: 7.5, bold: true, color: ZINC900, align: 'right' })
  })

  /* ---- Devam sayfası bandı (2. sayfa ve sonrası) ---- */
  const devamBandi = () => {
    dolgu(AMBER)
    doc.rect(0, DEVAM_BAND_H, W, 0.8, 'F')
    metin(kurum.ad, M, 7.2, { size: 8.5, bold: true })
    metin(`Teklif ${t.no}`, W - M, 7.2, { size: 8, bold: true, color: AMBER_KOYU, align: 'right' })
  }
  const UST_DEVAM = DEVAM_BAND_H + 9

  const yeniSayfa = () => {
    doc.addPage()
    devamBandi()
    y = UST_DEVAM
  }

  /* ---- 1. sayfa: konu, firma ve teklif kartları ---- */
  y = BAND_H + 1.2 + 8
  metin('TEKLİF KONUSU', M, y, { size: 6.5, bold: true, color: AMBER_KOYU })
  metin(t.baslik ?? t.firma, M, y + 5.2, { size: 12, bold: true })
  y += 12

  const kartW = (CW - 5) / 2
  const kartH = 42
  kart(M, y, kartW, kartH)
  dolgu(AMBER)
  doc.rect(M, y + 3, 1.1, kartH - 6, 'F')
  metin('FİRMA', M + 5, y + 6, { size: 6.5, bold: true, color: ZINC500 })
  metin(firma?.unvan ?? t.firma, M + 5, y + 11.5, { size: 9.5, bold: true })
  const firmaSatirlari: string[] = firma
    ? [
        ...(doc.splitTextToSize(`${firma.adres}, ${firma.il}`, kartW - 10) as string[]),
        `Yetkili: ${firma.yetkili}`,
        `Telefon: ${firma.telefon}`,
        `E-posta: ${firma.eposta}`,
        `Vergi: ${firma.vergiDairesi} · ${firma.vergiNo}`,
      ]
    : []
  let fy = y + 16.5
  firmaSatirlari.forEach((s) => {
    metin(s, M + 5, fy, { size: 7.6, color: ZINC700 })
    fy += 4.1
  })

  const sagX = M + kartW + 5
  kart(sagX, y, kartW, kartH)
  dolgu(AMBER)
  doc.rect(sagX, y + 3, 1.1, kartH - 6, 'F')
  metin('TEKLİF BİLGİLERİ', sagX + 5, y + 6, { size: 6.5, bold: true, color: ZINC500 })
  const satirlar: [string, string][] = [
    ['Hizmet türü', t.hizmet],
    ['Çalışan sayısı', `${kisi} kişi`],
    ['Teklif tarihi', tarih(t.tarih)],
    ['Geçerlilik', tarih(t.gecerlilik)],
    ['Ödeme koşulu', t.odemeKosulu ?? 'Belirtilmedi'],
  ]
  const satirAdim = 6.4
  satirlar.forEach(([k, v], i) => {
    const sy = y + 11.5 + i * satirAdim
    metin(k, sagX + 5, sy, { size: 7.6, color: ZINC500 })
    metin(v, sagX + kartW - 5, sy, { size: 7.6, bold: true, align: 'right' })
    if (i < satirlar.length - 1) {
      cizgi(ZINC200, 0.15)
      doc.line(sagX + 5, sy + 2.2, sagX + kartW - 5, sy + 2.2)
    }
  })
  y += kartH + 9

  /* ---- Ön yazı (veda ve kurum adı satırları imza bloğunda gösterildiği için çıkarılır) ---- */
  bolumBasligi('Ön yazı', M, y)
  y += 6.5
  const paragraflar = (t.onYazi ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !VEDA.test(p) && p !== kurum.ad && p !== kurum.unvan)
  doc.setFont('Arial', 'normal')
  doc.setFontSize(olcu.govde)
  paragraflar.forEach((p) => {
    const satirlarP = doc.splitTextToSize(p, CW) as string[]
    satirlarP.forEach((s) => {
      if (y > ALT_LIMIT) yeniSayfa()
      metin(s, M, y, { size: olcu.govde, color: ZINC700 })
      y += olcu.govdeAdim
    })
    y += olcu.govdeBosluk
  })
  y += 5

  /* ---- Şartlar ve koşullar (1. sayfada kalır) ---- */
  const sartlar = (t.sartlar ?? []).map((s) => s.trim()).filter(Boolean)
  if (sartlar.length) {
    bolumBasligi('Şartlar ve koşullar', M, y)
    y += 6.5
    sartlar.forEach((s, i) => {
      doc.setFont('Arial', 'normal')
      doc.setFontSize(olcu.madde)
      const satirlarS = doc.splitTextToSize(s, CW - 8) as string[]
      satirlarS.forEach((satir, k) => {
        if (y > ALT_LIMIT) yeniSayfa()
        if (k === 0) numara(i + 1, M + 2.3, y - 1.1)
        metin(satir, M + 8, y, { size: olcu.madde, color: ZINC700 })
        y += olcu.maddeAdim
      })
      y += olcu.maddeBosluk
    })
  }

  /* ---- 2. sayfa: kalem tablosu, toplamlar, imza ---- */
  yeniSayfa()
  bolumBasligi('Teklif kalemleri', M, y)
  y += 5

  const kolon = { ad: 92, birim: 30, miktar: 20 }
  const tabloBasligi = () => {
    dolgu(ZINC50)
    doc.rect(M, y, CW, 8, 'F')
    dolgu(AMBER)
    doc.rect(M, y + 7.2, CW, 0.8, 'F')
    metin('Test / muayene', M + 4, y + 5.4, { size: 7.5, bold: true })
    metin('Birim fiyat', M + kolon.ad + kolon.birim - 3, y + 5.4, { size: 7.5, bold: true, align: 'right' })
    metin('Miktar', M + kolon.ad + kolon.birim + kolon.miktar / 2, y + 5.4, { size: 7.5, bold: true, align: 'center' })
    metin('Tutar', M + CW - 4, y + 5.4, { size: 7.5, bold: true, align: 'right' })
    y += 8
  }
  tabloBasligi()

  const kalemSatirlari = kalemler.length
    ? kalemler.map((k) => ({ ad: k.ad, birim: k.birim, miktar: k.miktar }))
    : [{ ad: t.paketAdi ?? t.hizmet, birim: net / kisi, miktar: kisi }]
  const satirYuk = 7.2
  kalemSatirlari.forEach((k, i) => {
    if (y + satirYuk > ALT_LIMIT) {
      yeniSayfa()
      tabloBasligi()
    }
    if (i % 2 === 1) {
      dolgu(ZINC50)
      doc.rect(M, y, CW, satirYuk, 'F')
    }
    cizgi(ZINC200, 0.15)
    doc.line(M, y + satirYuk, M + CW, y + satirYuk)
    const ad = doc.splitTextToSize(k.ad, kolon.ad - 6)[0] as string
    metin(ad, M + 4, y + 4.8, { size: 8.5 })
    metin(tutar(k.birim), M + kolon.ad + kolon.birim - 3, y + 4.8, { size: 8.3, align: 'right', color: ZINC700 })
    metin(String(k.miktar), M + kolon.ad + kolon.birim + kolon.miktar / 2, y + 4.8, { size: 8.5, align: 'center' })
    metin(tutar(k.birim * k.miktar), M + CW - 4, y + 4.8, { size: 8.5, bold: true, align: 'right' })
    y += satirYuk
  })
  y += 7

  /* ---- Ödeme / geçerlilik (sol) ve toplam kartı (sağ) ---- */
  if (y + 60 > ALT_LIMIT) yeniSayfa()
  const toplamW = 84
  const toplamX = M + CW - toplamW
  const solW = CW - toplamW - 5
  const blokY = y

  /* Sol: ödeme koşulu, geçerlilik, kişi başı */
  kart(M, blokY, solW, 52)
  const solBilgi: [string, string][] = [
    ['Ödeme koşulu', t.odemeKosulu ?? 'Belirtilmedi'],
    ['Geçerlilik', `${tarih(t.gecerlilik)} tarihine kadar`],
    ['Kişi başı (KDV dahil)', tutar(genel / kisi)],
  ]
  solBilgi.forEach(([etiket, deger], i) => {
    const sy = blokY + 8 + i * 14
    metin(etiket.toUpperCase(), M + 5, sy, { size: 6.5, bold: true, color: ZINC500 })
    metin(deger, M + 5, sy + 5.6, { size: 9.5, bold: true })
  })

  /* Sağ: koyu toplam kartı */
  kart(toplamX, blokY, toplamW, 52)
  const satirToplam = (etiket: string, deger: string, sy: number) => {
    metin(etiket, toplamX + 5, sy, { size: 7.8, color: ZINC500 })
    metin(deger, toplamX + toplamW - 5, sy, { size: 7.8, bold: true, align: 'right' })
  }
  let ty = blokY + 7
  satirToplam('Kalem toplamı', tutar(kalemToplam), ty)
  ty += 5.4
  if (indirim > 0) {
    satirToplam(`İndirim (%${indirimOran.toFixed(1)})`, `− ${tutar(indirim)}`, ty)
    ty += 5.4
  }
  satirToplam('Net (KDV hariç)', tutar(net), ty)
  ty += 5.4
  satirToplam(`KDV %${kdvOran}`, tutar(kdvTutar), ty)
  /* Genel toplam bloğu */
  dolgu(AMBER)
  doc.roundedRect(toplamX + 3, blokY + 30, toplamW - 6, 19, 2, 2, 'F')
  metin('GENEL TOPLAM · KDV DAHİL', toplamX + 6.5, blokY + 36, { size: 6.5, bold: true, color: ZINC900 })
  metin(tutar(genel), toplamX + toplamW - 6.5, blokY + 44.5, { size: 12, bold: true, color: ZINC900, align: 'right' })

  y = blokY + 52 + 9

  /* ---- İmza alanı ---- */
  if (y + 36 > ALT_LIMIT) yeniSayfa()
  kart(M, y, CW, 34)
  metin('Saygılarımızla,', M + 6, y + 9, { size: 9, color: ZINC700 })
  metin(kurum.yetkili ?? kurum.ad, M + 6, y + 17, { size: 10, bold: true })
  metin(kurum.yetkiliUnvan ?? kurum.unvan, M + 6, y + 22, { size: 8, color: ZINC500 })
  cizgi(ZINC300, 0.25)
  doc.line(W - M - 62, y + 25, W - M - 6, y + 25)
  metin('Yetkili imza / kaşe', W - M - 34, y + 29.5, { size: 7, color: ZINC500, align: 'center' })

  /* ---- Altbilgi ve taslak filigranı (tüm sayfalar) ---- */
  const sayfaSayisi = doc.getNumberOfPages()
  const altIletisim = [kurum.adres, kurum.telefon].filter(Boolean).join('  ·  ')
  for (let p = 1; p <= sayfaSayisi; p++) {
    doc.setPage(p)
    if (taslak) {
      doc.saveGraphicsState()
      const GState = (doc as unknown as { GState: new (o: { opacity: number }) => unknown }).GState
      doc.setGState(new GState({ opacity: 0.07 }) as never)
      metin('TASLAK', W / 2, H / 2, { size: 96, bold: true, color: ZINC500, align: 'center' })
      doc.restoreGraphicsState()
    }
    cizgi(ZINC200, 0.2)
    doc.line(M, H - 14, W - M, H - 14)
    metin(altIletisim || kurum.ad, M, H - 9.3, { size: 7, color: ZINC500 })
    metin(`${t.no}  ·  Sayfa ${p} / ${sayfaSayisi}`, W - M, H - 9.3, { size: 7.5, bold: true, color: ZINC700, align: 'right' })
  }
  return doc
}

/**
 * Belgeyi üretir. Önce normal yazımla denenir; belge ikiden fazla sayfaya taşarsa
 * (ön yazı ve şartlar 1. sayfaya sığmadığında) kompakt yazımla yeniden kurulur.
 */
export async function teklifPdfOlustur(t: Teklif, firma: Firma | undefined, kurum: KurumBilgi): Promise<jsPDF> {
  const font = await fontlariYukle()
  const normal = belgeUret(t, firma, kurum, font, false)
  if (normal.getNumberOfPages() <= 2) return normal
  return belgeUret(t, firma, kurum, font, true)
}

/** Ayarlardaki kurum kaydından PDF'in kullandığı kurum bilgisini üretir */
export function kurumBilgisi(k: {
  kisaAd: string
  unvan: string
  logo?: string
  adres: string
  telefon: string
  eposta: string
  web: string
  yetkili: string
  yetkiliUnvan: string
}): KurumBilgi {
  const ad = k.kisaAd || k.unvan
  const harf = (ad.trim().split(/\s+/).slice(0, 2).map((w) => w[0] ?? '').join('') || 'O').toLocaleUpperCase('tr')
  return { ad, unvan: k.unvan, harf, logo: k.logo, adres: k.adres, telefon: k.telefon, eposta: k.eposta, web: k.web, yetkili: k.yetkili, yetkiliUnvan: k.yetkiliUnvan }
}

/** Dosya adı için güvenli teklif numarası */
export const teklifDosyaAdi = (t: Teklif) => `${t.no.replace(/[^\w-]+/g, '_')}.pdf`
