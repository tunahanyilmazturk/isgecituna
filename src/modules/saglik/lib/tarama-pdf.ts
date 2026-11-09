import { jsPDF } from 'jspdf'
import type { Firma } from '@saglik/data/firmalar'
import { ISLISTESI_HAZIRLIK, type Tarama, type TaramaIsListesi } from '@saglik/data/saglik'
import {
  ALT_LIMIT,
  AMBER,
  AMBER_KOYU,
  BAND_H,
  BEYAZ,
  CW,
  DEVAM_BAND_H,
  H,
  M,
  VEDA,
  W,
  ZINC200,
  ZINC300,
  ZINC50,
  ZINC500,
  ZINC700,
  ZINC900,
  fontlariYukle,
  logoBicimi,
  tarih,
  tutar,
  type KurumBilgi,
  type RGB,
} from '@saglik/lib/teklif-pdf'
import { saatAraligi } from '@saglik/lib/tarama'

/**
 * Tarama planı belgesi (A4) — teklif belgesiyle aynı düzen:
 *  1. sayfa: kurum künyesi, firma ve tarama bilgileri, tarama ön yazısı, saha notları
 *  2. sayfa: test planı, toplamlar, saha ekibi ve imza
 * Türkçe karakterler için gömülü Arial kullanılır. Tutarlar "TL" olarak yazılır.
 */

/** Tarih aralığı: tek günse "10.11.2026", çok günse "10.11.2026 – 12.11.2026" */
const tarihAralik = (t: Tarama) => (t.bitisTarih && t.bitisTarih !== t.tarih ? `${tarih(t.tarih)} – ${tarih(t.bitisTarih)}` : tarih(t.tarih))

export async function taramaPdfOlustur(t: Tarama, firma: Firma | undefined, kurum: KurumBilgi, teklifNo?: string): Promise<jsPDF> {
  const font = await fontlariYukle()
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  doc.addFileToVFS('Arial.ttf', font.normal)
  doc.addFont('Arial.ttf', 'Arial', 'normal')
  doc.addFileToVFS('Arial-Bold.ttf', font.bold)
  doc.addFont('Arial-Bold.ttf', 'Arial', 'bold')
  doc.setProperties({ title: `${t.id} - Tarama planı`, author: kurum.ad, creator: 'osgbhub' })

  /* Tutarlar: kayıtlı değerler varsa onlar, yoksa kalemlerden hesaplanır */
  const kalemler = t.kalemler ?? []
  const kalemToplam = kalemler.reduce((s, k) => s + k.birim * k.miktar, 0)
  const indirim = t.indirimTutar ?? 0
  const indirimOran = t.iskontoYuzde ?? (kalemToplam > 0 ? (indirim / kalemToplam) * 100 : 0)
  const net = t.netToplam ?? kalemToplam - indirim
  const kdvOran = t.kdvOrani ?? 20
  const genel = t.genelToplam ?? Math.round(net * (1 + kdvOran / 100))
  const kdvTutar = genel - net
  const kisi = Math.max(1, t.kisiSayisi)
  const ekipListe = t.ekip ? t.ekip.split(', ').filter(Boolean) : []
  const notlar = (t.notlar ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  const firmaAdi = firma?.unvan ?? t.firma
  const baslik = `${firma?.kisaAd ?? t.firma} · ${t.hizmet} taraması`

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
  const kart = (x: number, yy: number, w: number, h: number) => {
    dolgu(BEYAZ)
    cizgi(ZINC200, 0.25)
    doc.roundedRect(x, yy, w, h, 2.5, 2.5, 'FD')
  }
  const bolumBasligi = (s: string, x: number, yy: number) => {
    dolgu(AMBER)
    doc.rect(x, yy - 3.4, 1.1, 4.6, 'F')
    metin(s, x + 3.6, yy, { size: 10, bold: true })
  }
  const numara = (n: number, cx: number, cy: number) => {
    dolgu(AMBER)
    doc.circle(cx, cy, 2.3, 'F')
    metin(String(n), cx, cy + 0.9, { size: 6.5, bold: true, color: ZINC900, align: 'center' })
  }

  /* ---- 1. sayfa üst bandı: kurum kimliği ve belge künyesi ---- */
  let y = 0
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

  dolgu(AMBER)
  doc.rect(0, BAND_H, W, 1.2, 'F')
  logoCiz(M, 9)
  metin(kurum.ad, M + 18, 15.5, { size: 14, bold: true })
  metin(kurum.unvan, M + 18, 20.5, { size: 7.5, color: ZINC500 })
  const iletisim = [kurum.telefon, kurum.eposta, kurum.web].filter(Boolean).join('   ·   ')
  if (iletisim) metin(iletisim, M + 18, 25.5, { size: 7, color: ZINC500 })

  metin('TARAMA PLANI', W - M, 15, { size: 17, bold: true, color: AMBER_KOYU, align: 'right' })
  const kunye: [string, string][] = [
    ['Tarama no', t.id],
    ['Başlangıç', `${tarih(t.tarih)} · ${t.saat}`],
    ['Bitiş', `${tarih(t.bitisTarih ?? t.tarih)} · ${t.bitisSaat ?? t.saat}`],
  ]
  kunye.forEach(([k, v], i) => {
    const satir = 21 + i * 4.2
    metin(k, W - M - 32, satir, { size: 7.5, color: ZINC500, align: 'right' })
    metin(v, W - M, satir, { size: 7.5, bold: true, color: ZINC900, align: 'right' })
  })

  /* ---- Devam sayfası bandı ---- */
  const devamBandi = () => {
    dolgu(AMBER)
    doc.rect(0, DEVAM_BAND_H, W, 0.8, 'F')
    metin(kurum.ad, M, 7.2, { size: 8.5, bold: true })
    metin(`Tarama ${t.id}`, W - M, 7.2, { size: 8, bold: true, color: AMBER_KOYU, align: 'right' })
  }
  const UST_DEVAM = DEVAM_BAND_H + 9
  const yeniSayfa = () => {
    doc.addPage()
    devamBandi()
    y = UST_DEVAM
  }

  /* ---- 1. sayfa: konu ve kartlar ---- */
  y = BAND_H + 1.2 + 8
  metin('TARAMA KONUSU', M, y, { size: 6.5, bold: true, color: AMBER_KOYU })
  metin(baslik, M, y + 5.2, { size: 12, bold: true })
  y += 12

  const kartW = (CW - 5) / 2
  const kartH = 46
  kart(M, y, kartW, kartH)
  dolgu(AMBER)
  doc.rect(M, y + 3, 1.1, kartH - 6, 'F')
  metin('FİRMA', M + 5, y + 6, { size: 6.5, bold: true, color: ZINC500 })
  metin(firmaAdi, M + 5, y + 11.5, { size: 9.5, bold: true })
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
  metin('TARAMA BİLGİLERİ', sagX + 5, y + 6, { size: 6.5, bold: true, color: ZINC500 })
  const satirlar: [string, string][] = [
    ['Hizmet türü', t.hizmet],
    ['Tarih', tarihAralik(t)],
    ['Saat', saatAraligi(t)],
    ['Planlanan kişi', `${kisi} kişi`],
    ['Bağlı teklif', teklifNo ?? 'Bağlı değil'],
    ['Lokasyon', (doc.splitTextToSize(t.lokasyon || '—', kartW - 40) as string[])[0]],
  ]
  const satirAdim = 5.8
  satirlar.forEach(([k, v], i) => {
    const sy = y + 11.5 + i * satirAdim
    metin(k, sagX + 5, sy, { size: 7.6, color: ZINC500 })
    metin(v, sagX + kartW - 5, sy, { size: 7.6, bold: true, align: 'right' })
    if (i < satirlar.length - 1) {
      cizgi(ZINC200, 0.15)
      doc.line(sagX + 5, sy + 2.0, sagX + kartW - 5, sy + 2.0)
    }
  })
  y += kartH + 9

  /* ---- Tarama ön yazısı ---- */
  bolumBasligi('Tarama ön yazısı', M, y)
  y += 6.5
  const paragraflar = (t.onYazi ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !VEDA.test(p) && p !== kurum.ad && p !== kurum.unvan)
  const govde = 9
  const govdeAdim = 4.6
  const govdeBosluk = 2.2
  doc.setFont('Arial', 'normal')
  doc.setFontSize(govde)
  paragraflar.forEach((p) => {
    const satirlarP = doc.splitTextToSize(p, CW) as string[]
    satirlarP.forEach((s) => {
      if (y > ALT_LIMIT) yeniSayfa()
      metin(s, M, y, { size: govde, color: ZINC700 })
      y += govdeAdim
    })
    y += govdeBosluk
  })
  y += 5

  /* ---- Saha notları (numaralı) ---- */
  if (notlar.length) {
    bolumBasligi('Saha notları', M, y)
    y += 6.5
    notlar.forEach((s, i) => {
      doc.setFont('Arial', 'normal')
      doc.setFontSize(8.5)
      const satirlarS = doc.splitTextToSize(s, CW - 8) as string[]
      satirlarS.forEach((satir, k) => {
        if (y > ALT_LIMIT) yeniSayfa()
        if (k === 0) numara(i + 1, M + 2.3, y - 1.1)
        metin(satir, M + 8, y, { size: 8.5, color: ZINC700 })
        y += 4.3
      })
      y += 1.4
    })
  }

  /* ---- 2. sayfa: test planı, toplamlar, ekip ve imza ---- */
  yeniSayfa()
  bolumBasligi('Test planı', M, y)
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

  if (kalemler.length === 0) {
    metin('Bu taramaya test eklenmedi.', M + 4, y + 6, { size: 8.5, color: ZINC500 })
    y += 12
  }
  const satirYuk = 7.2
  kalemler.forEach((k, i) => {
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

  /* ---- Saha ekibi ve lokasyon (sol) · toplam kartı (sağ) ---- */
  if (y + 60 > ALT_LIMIT) yeniSayfa()
  const toplamW = 84
  const toplamX = M + CW - toplamW
  const solW = CW - toplamW - 5
  const blokY = y

  kart(M, blokY, solW, 52)
  metin('SAHA EKİBİ', M + 5, blokY + 7, { size: 6.5, bold: true, color: ZINC500 })
  const ekipSatirlari = ekipListe.length
    ? (doc.splitTextToSize(ekipListe.join(', '), solW - 10) as string[]).slice(0, 3)
    : ['Ekip üyesi seçilmedi']
  ekipSatirlari.forEach((s, i) => metin(s, M + 5, blokY + 12.5 + i * 4.4, { size: 8.2, bold: true }))
  const altBilgi: [string, string][] = [
    ['Lokasyon', t.lokasyon || '—'],
    ['Kişi başı (KDV dahil)', tutar(genel / kisi)],
  ]
  altBilgi.forEach(([etiket, deger], i) => {
    const sy = blokY + 31 + i * 10
    metin(etiket.toUpperCase(), M + 5, sy, { size: 6.5, bold: true, color: ZINC500 })
    metin((doc.splitTextToSize(deger, solW - 10) as string[])[0] ?? '—', M + 5, sy + 4.8, { size: 8.8, bold: true })
  })

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

  /* ---- Altbilgi (tüm sayfalar) ---- */
  const sayfaSayisi = doc.getNumberOfPages()
  const altIletisim = [kurum.adres, kurum.telefon].filter(Boolean).join('  ·  ')
  for (let p = 1; p <= sayfaSayisi; p++) {
    doc.setPage(p)
    cizgi(ZINC200, 0.2)
    doc.line(M, H - 14, W - M, H - 14)
    metin(altIletisim || kurum.ad, M, H - 9.3, { size: 7, color: ZINC500 })
    metin(`${t.id}  ·  Sayfa ${p} / ${sayfaSayisi}`, W - M, H - 9.3, { size: 7.5, bold: true, color: ZINC700, align: 'right' })
  }
  return doc
}

/** Dosya adı için güvenli tarama numarası */
export const taramaDosyaAdi = (t: Tarama) => `${t.id.replace(/[^\w-]+/g, '_')}_tarama.pdf`

/**
 * Saha iş listesi (A4) — tek sayfa. Yükseklikler sıkıştırılmış ızgarayla hesaplanır:
 * üst bant 30 mm, satırlar 6 mm, bölümler arası 4–6 mm. Sayfa taşarsa uyarı için kesilmez,
 * ancak düzen en fazla 12 ekip üyesi ve 12 testle tek sayfada kalır.
 */
export async function taramaIsListesiPdfOlustur(
  t: Tarama,
  firma: Firma | undefined,
  kurum: KurumBilgi,
  katilimcilar: { ad: string; gorev: string; katildi: boolean }[],
): Promise<jsPDF> {
  const font = await fontlariYukle()
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  doc.addFileToVFS('Arial.ttf', font.normal)
  doc.addFont('Arial.ttf', 'Arial', 'normal')
  doc.addFileToVFS('Arial-Bold.ttf', font.bold)
  doc.addFont('Arial-Bold.ttf', 'Arial', 'bold')
  doc.setProperties({ title: `${t.id} - Saha iş listesi`, author: kurum.ad, creator: 'osgbhub' })

  const is: TaramaIsListesi = t.isListesi ?? { hazirlik: {}, katilim: {}, yapilan: {} }
  const kalemler = t.kalemler ?? []
  const SAG = W - M
  const BANT = 30
  const SATIR = 6
  const ACIK: RGB = [251, 248, 240]
  const CIZGI: RGB = [221, 222, 226]
  const KOYU: RGB = [39, 39, 42]

  const yazi = (o: { size?: number; bold?: boolean; color?: RGB }) => {
    const c = o.color ?? ZINC900
    doc.setFont('Arial', o.bold ? 'bold' : 'normal')
    doc.setFontSize(o.size ?? 9)
    doc.setTextColor(c[0], c[1], c[2])
  }
  const metin = (s: string, x: number, yy: number, o: { size?: number; bold?: boolean; color?: RGB; align?: 'left' | 'right' | 'center' } = {}) => {
    yazi(o)
    doc.text(s, x, yy, { align: o.align ?? 'left' })
  }
  /** Genişliğe sığmayan metni "…" ile keser */
  const kes = (s: string, genislik: number, o: { size?: number; bold?: boolean } = {}) => {
    yazi(o)
    if (doc.getTextWidth(s) <= genislik) return s
    let k = s
    while (k.length > 1 && doc.getTextWidth(k + '…') > genislik) k = k.slice(0, -1)
    return k + '…'
  }
  const dolgu = (c: RGB) => doc.setFillColor(c[0], c[1], c[2])
  const cizgi = (c: RGB, kalinlik = 0.2) => {
    doc.setDrawColor(c[0], c[1], c[2])
    doc.setLineWidth(kalinlik)
  }
  const kart = (x: number, yy: number, w: number, h: number, fill: RGB = BEYAZ) => {
    dolgu(fill)
    cizgi(CIZGI, 0.25)
    doc.roundedRect(x, yy, w, h, 2, 2, 'FD')
  }
  /* Bölüm başlığı: numara rozeti, başlık, sağda sayaç, ince çizgi (toplam 6 mm) */
  const bolum = (no: number, baslik: string, sag: string | null, yy: number) => {
    dolgu(KOYU)
    doc.circle(M + 2.5, yy - 1.1, 2.5, 'F')
    metin(String(no), M + 2.5, yy + 0.05, { size: 7.5, bold: true, color: BEYAZ, align: 'center' })
    metin(baslik.toLocaleUpperCase('tr'), M + 7.2, yy, { size: 9, bold: true })
    if (sag) metin(sag, SAG, yy, { size: 8, bold: true, color: AMBER_KOYU, align: 'right' })
    cizgi(CIZGI, 0.2)
    doc.line(M, yy + 2.6, SAG, yy + 2.6)
  }
  const kutu = (x: number, yy: number, isaretli: boolean, boyut = 3.4) => {
    cizgi(ZINC500, 0.3)
    dolgu(BEYAZ)
    doc.roundedRect(x, yy - boyut + 0.6, boyut, boyut, 0.5, 0.5, 'FD')
    if (isaretli) metin('X', x + boyut / 2, yy, { size: 6.8, bold: true, align: 'center' })
  }
  const cizgiSatir = (yy: number, x1 = M, x2 = SAG) => {
    cizgi(CIZGI, 0.15)
    doc.line(x1, yy, x2, yy)
  }

  /* ---- Üst bant ---- */
  dolgu(AMBER)
  doc.rect(0, BANT, W, 1.1, 'F')
  const logoTip = logoBicimi(kurum.logo)
  const logoKutu = 12
  let logoCizildi = false
  if (logoTip && kurum.logo) {
    try {
      const p = doc.getImageProperties(kurum.logo)
      const olcek = Math.min(logoKutu / p.width, logoKutu / p.height)
      doc.addImage(kurum.logo, logoTip, M, 7, p.width * olcek, p.height * olcek)
      logoCizildi = true
    } catch {
      logoCizildi = false
    }
  }
  if (!logoCizildi) {
    dolgu(AMBER)
    doc.roundedRect(M, 7, logoKutu, logoKutu, 2.5, 2.5, 'F')
    metin(kurum.harf, M + logoKutu / 2, 15.6, { size: 11, bold: true, align: 'center' })
  }
  metin(kes(kurum.ad, 95, { size: 13, bold: true }), M + 16, 12.5, { size: 13, bold: true })
  metin(kes(kurum.unvan, 95, { size: 7.5 }), M + 16, 17, { size: 7.5, color: ZINC500 })
  const iletisim = kes([kurum.telefon, kurum.eposta, kurum.web].filter(Boolean).join('   ·   '), 95, { size: 7 })
  if (iletisim) metin(iletisim, M + 16, 21.5, { size: 7, color: ZINC500 })

  metin('SAHA İŞ LİSTESİ', SAG, 12.5, { size: 14, bold: true, color: AMBER_KOYU, align: 'right' })
  const kunye: [string, string][] = [
    ['Tarama no', t.id],
    ['Tarih', tarihAralik(t)],
    ['Saat', saatAraligi(t)],
  ]
  kunye.forEach(([k, v], i) => {
    const satir = 17 + i * 4
    metin(k, SAG - 38, satir, { size: 7.2, color: ZINC500, align: 'right' })
    metin(v, SAG, satir, { size: 7.5, bold: true, align: 'right' })
  })

  let y = BANT + 1.1 + 6

  /* ---- Konu ---- */
  const hazirTamam = ISLISTESI_HAZIRLIK.filter((h) => is.hazirlik[h.k]).length
  const katilan = katilimcilar.filter((k) => k.katildi).length
  const hedefToplam = kalemler.reduce((s, k) => s + k.miktar, 0)
  const yapilanToplam = kalemler.reduce((s, k) => s + Math.min(k.miktar, is.yapilan[k.testId] ?? 0), 0)
  const oran = hedefToplam ? Math.round((yapilanToplam / hedefToplam) * 100) : 0
  metin((firma?.kisaAd ?? t.firma).toLocaleUpperCase('tr'), M, y, { size: 6.4, bold: true, color: AMBER_KOYU })
  metin(kes(firma?.unvan ?? t.firma, CW, { size: 12.5, bold: true }), M, y + 5.6, { size: 12.5, bold: true })
  metin(kes(`${t.hizmet}  ·  ${t.lokasyon || 'Lokasyon belirtilmedi'}`, CW, { size: 8.2 }), M, y + 10.6, { size: 8.2, color: ZINC700 })
  y += 14

  /* ---- Özet kutuları ---- */
  const gap = 3
  const kutuGen = (CW - 3 * gap) / 4
  const ozetler = [
    { etiket: 'Planlanan kişi', deger: `${t.kisiSayisi}`, alt: `${Math.max(0, t.kisiSayisi - t.tamamlanan)} kişi kaldı` },
    { etiket: 'Hazırlık', deger: `${hazirTamam} / ${ISLISTESI_HAZIRLIK.length}`, alt: 'madde tamam' },
    { etiket: 'Ekip katılımı', deger: `${katilan} / ${katilimcilar.length}`, alt: 'üye sahada' },
    { etiket: 'Test tamamlama', deger: `%${oran}`, alt: `${yapilanToplam} / ${hedefToplam} uygulama` },
  ]
  ozetler.forEach((o, i) => {
    const x = M + i * (kutuGen + gap)
    kart(x, y, kutuGen, 15.5, ACIK)
    dolgu(AMBER)
    doc.rect(x, y + 2.6, 0.9, 10.5, 'F')
    metin(o.etiket.toLocaleUpperCase('tr'), x + 4, y + 4.6, { size: 6, bold: true, color: ZINC500 })
    metin(o.deger, x + 4, y + 10.6, { size: 12, bold: true })
    metin(kes(o.alt, kutuGen - 8, { size: 6.3 }), x + 4, y + 13.8, { size: 6.3, color: ZINC500 })
  })
  y += 20

  /* ---- 1. Hazırlık: iki sütun ---- */
  const satirSayisi = Math.ceil(ISLISTESI_HAZIRLIK.length / 2)
  bolum(1, 'Hazırlık kontrolü', `${hazirTamam} / ${ISLISTESI_HAZIRLIK.length} tamam`, y)
  y += 6
  const sutunGen = (CW - 6) / 2
  ISLISTESI_HAZIRLIK.forEach((h, i) => {
    const x = M + (i % 2) * (sutunGen + 6)
    const yy = y + Math.floor(i / 2) * SATIR
    const tamam = !!is.hazirlik[h.k]
    kutu(x + 0.6, yy + 0.4, tamam)
    metin(kes(h.e, sutunGen - 8, { size: 7.8 }), x + 6.5, yy + 0.8, { size: 7.8, color: tamam ? ZINC500 : ZINC900 })
    cizgiSatir(yy + 2.2, x, x + sutunGen)
  })
  y += satirSayisi * SATIR + 4

  /* Sayfa tek kalsın: kalan yüksekliğe göre satır yüksekliği ve gösterilecek kayıt sayısı */
  const sabitYukseklik = 14.4 + 14.4 + 29 + 26 + 4
  const kullanilabilir = ALT_LIMIT - y - sabitYukseklik
  const toplamKayit = katilimcilar.length + kalemler.length
  const enCokSatir = Math.max(2, Math.floor(kullanilabilir / 4.6))
  let ekipGoster = katilimcilar.length
  let testGoster = kalemler.length
  if (toplamKayit > enCokSatir) {
    ekipGoster = Math.min(katilimcilar.length, Math.floor((enCokSatir * katilimcilar.length) / toplamKayit))
    testGoster = Math.min(kalemler.length, enCokSatir - ekipGoster)
  }
  const satirH = Math.min(SATIR, kullanilabilir / Math.max(1, ekipGoster + testGoster))
  /* ---- 2. Ekip katılımı ---- */
  const ek = { ad: 72, gorev: 60 }
  const katildiX = M + ek.ad + ek.gorev + 13
  bolum(2, 'Ekip katılımı', `${katilan} / ${katilimcilar.length} katıldı`, y)
  y += 5
  dolgu(KOYU)
  doc.rect(M, y, CW, 5.4, 'F')
  metin('EKİP ÜYESİ', M + 3, y + 3.7, { size: 6.4, bold: true, color: BEYAZ })
  metin('GÖREV', M + ek.ad + 1, y + 3.7, { size: 6.4, bold: true, color: BEYAZ })
  metin('KATILDI', katildiX, y + 3.7, { size: 6.4, bold: true, color: BEYAZ, align: 'center' })
  metin('NOT', katildiX + 9, y + 3.7, { size: 6.4, bold: true, color: BEYAZ })
  y += 5.4
  if (!katilimcilar.length) {
    metin('Ekip üyesi seçilmedi.', M + 3, y + 4.2, { size: 7.8, color: ZINC500 })
    y += satirH
  }
  katilimcilar.slice(0, ekipGoster).forEach((k, i) => {
    if (i % 2 === 1) {
      dolgu(ZINC50)
      doc.rect(M, y, CW, satirH, 'F')
    }
    metin(kes(k.ad, ek.ad - 5, { size: 8, bold: true }), M + 3, y + 4.1, { size: 8, bold: true })
    metin(kes(k.gorev || '—', ek.gorev - 4, { size: 7.4 }), M + ek.ad + 1, y + 4.1, { size: 7.4, color: ZINC700 })
    kutu(katildiX - 1.7, y + 4.4, k.katildi, 3.6)
    cizgi(CIZGI, 0.15)
    doc.line(katildiX + 9, y + 5, SAG - 3, y + 5)
    cizgiSatir(y + satirH)
    y += satirH
  })
  y += 4

  /* ---- 3. Test uygulama ---- */
  const tk = { ad: 86, hedef: 22, yapilan: 26 }
  const tkKalan = CW - tk.ad - tk.hedef - tk.yapilan
  bolum(3, 'Test uygulama', `${yapilanToplam} / ${hedefToplam} uygulandı`, y)
  y += 5
  dolgu(KOYU)
  doc.rect(M, y, CW, 5.4, 'F')
  metin('TEST / MUAYENE', M + 3, y + 3.7, { size: 6.4, bold: true, color: BEYAZ })
  metin('HEDEF', M + tk.ad + tk.hedef - 4, y + 3.7, { size: 6.4, bold: true, color: BEYAZ, align: 'right' })
  metin('YAPILAN', M + tk.ad + tk.hedef + tk.yapilan - 4, y + 3.7, { size: 6.4, bold: true, color: BEYAZ, align: 'right' })
  metin('KALAN', M + tk.ad + tk.hedef + tk.yapilan + tkKalan / 2, y + 3.7, { size: 6.4, bold: true, color: BEYAZ, align: 'center' })
  metin('TAMAM', SAG - 3, y + 3.7, { size: 6.4, bold: true, color: BEYAZ, align: 'right' })
  y += 5.4
  if (!kalemler.length) {
    metin('Bu taramaya test eklenmedi.', M + 3, y + 4.2, { size: 7.8, color: ZINC500 })
    y += satirH
  }
  kalemler.slice(0, testGoster).forEach((k, i) => {
    const girildi = is.yapilan[k.testId] !== undefined
    const yapilan = Math.min(k.miktar, Math.max(0, is.yapilan[k.testId] ?? 0))
    if (i % 2 === 1) {
      dolgu(ZINC50)
      doc.rect(M, y, CW, satirH, 'F')
    }
    metin(kes(k.ad, tk.ad - 6, { size: 8, bold: true }), M + 3, y + 4.1, { size: 8, bold: true })
    metin(String(k.miktar), M + tk.ad + tk.hedef - 4, y + 4.1, { size: 8, align: 'right' })
    if (girildi) metin(String(yapilan), M + tk.ad + tk.hedef + tk.yapilan - 4, y + 4.1, { size: 8.6, bold: true, align: 'right' })
    else {
      cizgi(ZINC300, 0.2)
      doc.line(M + tk.ad + tk.hedef + 6, y + 5, M + tk.ad + tk.hedef + tk.yapilan - 4, y + 5)
    }
    metin(String(k.miktar - yapilan), M + tk.ad + tk.hedef + tk.yapilan + tkKalan / 2, y + 4.1, { size: 8, align: 'center', color: ZINC700 })
    kutu(SAG - 5, y + 4.4, girildi && yapilan >= k.miktar, 3.6)
    cizgiSatir(y + satirH)
    y += satirH
  })
  y += 4

  /* ---- 4. Saha notları: kutulu, elle yazılabilir ---- */
  const notSatir = 3
  bolum(4, 'Saha notları', null, y)
  y += 5
  const notKutu = notSatir * 6 + 2
  kart(M, y, CW, notKutu)
  for (let i = 1; i < notSatir; i++) cizgiSatir(y + 2 + i * 6, M + 3, SAG - 3)
  y += notKutu + 4

  /* ---- 5. Onay ---- */
  bolum(5, 'Onay', null, y)
  y += 5
  const imzaGen = (CW - 6) / 2
  ;[
    { x: M, etiket: 'Saha sorumlusu' },
    { x: M + imzaGen + 6, etiket: 'Firma yetkilisi' },
  ].forEach((s) => {
    kart(s.x, y, imzaGen, 21)
    metin(s.etiket.toLocaleUpperCase('tr'), s.x + 4, y + 4.5, { size: 6.4, bold: true, color: ZINC500 })
    cizgi(ZINC300, 0.25)
    doc.line(s.x + 4, y + 15.5, s.x + imzaGen - 4, y + 15.5)
    metin('Ad soyad  ·  tarih  ·  imza', s.x + 4, y + 19, { size: 6.4, color: ZINC500 })
  })

  /* ---- Altbilgi ---- */
  const sayfaSayisi = doc.getNumberOfPages()
  const altIletisim = kes([kurum.adres, kurum.telefon].filter(Boolean).join('  ·  '), 120, { size: 7 })
  for (let p = 1; p <= sayfaSayisi; p++) {
    doc.setPage(p)
    cizgi(CIZGI, 0.2)
    doc.line(M, H - 14, SAG, H - 14)
    metin(altIletisim || kurum.ad, M, H - 9.3, { size: 7, color: ZINC500 })
    metin(`Sayfa ${p} / ${sayfaSayisi}`, SAG, H - 9.3, { size: 7.5, bold: true, color: ZINC700, align: 'right' })
  }
  return doc
}
