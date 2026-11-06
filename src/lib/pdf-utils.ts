/*
 * PDF üretim hattı — DOM raporu html2canvas ile rasterize edilip jsPDF'e
 * gerçek A4 olarak gömülür. Türkçe karakterler rasterize edildiği için
 * gömülü font gerekmez. Risk, denetim, aksiyon ve sertifika belgeleri bu
 * hattın belge kurucusunu (pdfOlustur) paylaşır.
 */
import type { ReactElement } from 'react'
import type { jsPDF } from 'jspdf'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { osgbAd } from '@/lib/osgb'

export const MM = 96 / 25.4
export const PW = 210 * MM // A4 dikey genişlik px

/* Sayfalama sabit blok sayılarıyla yapılır: kart/satır sayfa ortasından bölünmez */
export const TH_PER_SAYFA = 4
export const AK_PER_SAYFA = 15

/** Sayfa görüntülerinin JPEG kalitesi — metin keskin kalır, dosya boyutu PNG'ye göre çok küçülür */
const JPEG_KALITE = 0.92

export type PdfYon = 'dikey' | 'yatay'
export type PdfSayfa = { cv: HTMLCanvasElement; yon: PdfYon }
export type PdfMeta = { baslik: string; konu?: string }

const sayfaYonu = (yon: PdfYon) => (yon === 'yatay' ? 'landscape' : 'portrait')
const sayfaBoyu = (yon: PdfYon): [number, number] => (yon === 'yatay' ? [297, 210] : [210, 297])

// html2canvas oklch/color-mix parse edemez — Tailwind v4 base `* { border-border outline-ring/50 }`
// kuralı her elemana tema rengi bırakır; klon üzerinde güvenli renklere çevrilir.
const RENK_PROPLARI = [
  'color', 'backgroundColor', 'outlineColor', 'caretColor', 'textDecorationColor',
  'columnRuleColor', 'accentColor', 'borderTopColor', 'borderRightColor',
  'borderBottomColor', 'borderLeftColor',
] as const

export function renkleriDuzelt(doc: Document) {
  const renkli = (v: string) => /oklch|oklab|color-mix|\blab\(|\blch\(|\bhwb\(/.test(v)
  doc.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const cs = doc.defaultView!.getComputedStyle(el)
    const yaz = (p: string, v: string) => el.style.setProperty(p.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`), v)
    for (const p of RENK_PROPLARI) {
      const v = cs[p as keyof CSSStyleDeclaration] as string
      if (v && renkli(v)) yaz(p, p === 'backgroundColor' ? 'rgba(0,0,0,0)' : '#18181B')
    }
    for (const p of ['boxShadow', 'textShadow'] as const) {
      if (cs[p] && renkli(cs[p])) yaz(p, 'none')
    }
  })
}

export async function elToCanvas(el: ReactElement): Promise<HTMLCanvasElement> {
  const host = document.createElement('div')
  host.style.cssText = `position:fixed;left:-20000px;top:0;width:${PW}px;pointer-events:none`
  document.body.appendChild(host)
  const { default: html2canvas } = await import('html2canvas')
  const root = createRoot(host)
  flushSync(() => root.render(el))
  await new Promise((r) => setTimeout(r, 80))
  try {
    return await html2canvas(host.firstElementChild as HTMLElement, {
      scale: 2,
      backgroundColor: '#FFFFFF',
      logging: false,
      useCORS: true,
      onclone: renkleriDuzelt,
    })
  } finally {
    root.unmount()
    host.remove()
  }
}

/**
 * Sayfa görüntülerini A4 olarak yerleştirip tek bir PDF belgesi kurar.
 * Her sayfanın yönü ayrıdır (sertifikalarda yatay ve dikey karışabilir).
 * Belgenin başlığı ve kurum adı PDF özelliklerine yazılır; kişisel veri eklenmez.
 */
export async function pdfOlustur(sayfalar: PdfSayfa[], meta: PdfMeta): Promise<jsPDF> {
  if (sayfalar.length === 0) throw new Error('PDF için en az bir sayfa gerekli')
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: sayfaYonu(sayfalar[0].yon), unit: 'mm', format: 'a4', compress: true })
  pdf.setProperties({ title: meta.baslik, subject: meta.konu, author: osgbAd(), creator: 'isghub' })
  sayfalar.forEach(({ cv, yon }, i) => {
    if (i > 0) pdf.addPage('a4', sayfaYonu(yon))
    const [w, h] = sayfaBoyu(yon)
    const veri = cv.toDataURL('image/jpeg', JPEG_KALITE)
    pdf.addImage(veri, veri.startsWith('data:image/png') ? 'PNG' : 'JPEG', 0, 0, w, h, undefined, 'FAST')
  })
  return pdf
}

/** Dikey A4 sayfalarından PDF üretip indirir (risk, denetim ve aksiyon raporları). */
export async function pdfYaz(sayfalar: HTMLCanvasElement[], ad: string) {
  const pdf = await pdfOlustur(
    sayfalar.map((cv): PdfSayfa => ({ cv, yon: 'dikey' })),
    { baslik: ad.replace(/\.pdf$/i, '') },
  )
  pdf.save(ad)
}
