/*
 * PDF üretim hattı — DOM raporu html2canvas ile rasterize edilip jsPDF'e
 * gerçek A4 (dikey) gömülür. Türkçe karakterler rasterize edildiği için
 * gömülü font gerekmez. Risk ve denetim raporları bu hattı paylaşır.
 */
import type { ReactElement } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'

export const MM = 96 / 25.4
export const PW = 210 * MM // A4 dikey genişlik px

/* Sayfalama sabit blok sayılarıyla yapılır: kart/satır sayfa ortasından bölünmez */
export const TH_PER_SAYFA = 4
export const AK_PER_SAYFA = 15

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

export async function pdfYaz(sayfalar: HTMLCanvasElement[], ad: string) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  sayfalar.forEach((cv, i) => {
    if (i > 0) pdf.addPage()
    pdf.addImage(cv.toDataURL('image/png'), 'PNG', 0, 0, 210, 297, undefined, 'FAST')
  })
  pdf.save(ad)
}
