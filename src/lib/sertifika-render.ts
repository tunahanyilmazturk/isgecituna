/*
 * Sertifika v2 PDF üretimi — DOM önizlemesi html2canvas ile rasterize edilip
 * jsPDF'e gerçek A4 ölçüsünde gömülür. Önizleme = PDF çıktısı aynı pikseldir.
 */
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { SertifikaOnizleme } from '@/components/sertifika/onizleme'
import type { PdfSurum, Sertifika } from '@/data/sertifikalar'
import { veriGetir, type SertifikaVeri, type TasarimEleman, type Yon } from '@/data/sertifika-tasarim'
import { sertifikaPdfIndir as eskiPdfIndir, sertifikaPdfUrlEski, sertifikaPng } from '@/lib/sertifika-pdf'
import { renkleriDuzelt } from '@/lib/pdf-utils'

const DPI_OLCEK = 2.2 // ~209dpi — baskıda yeterli çözünürlük

/** Eleman listesini gizli kapsayıcıda render edip canvas döndürür */
async function elemanlariCiz(elemanlar: TasarimEleman[], yon: Yon, zemin: string, veri: SertifikaVeri, iptal?: boolean): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas')
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-20000px;top:0;pointer-events:none'
  document.body.appendChild(host)
  const root = createRoot(host)
  await new Promise<void>((res) => {
    flushSync(() =>
      root.render(
        createElement(SertifikaOnizleme, {
          elemanlar, yon, zemin, veri, iptal,
          olcek: DPI_OLCEK,
          onHazir: () => setTimeout(res, 60),
        }),
      ),
    )
  })
  try {
    return await html2canvas(host.firstElementChild as HTMLElement, {
      scale: 1,
      backgroundColor: zemin,
      logging: false,
      useCORS: true,
      onclone: renkleriDuzelt,
    })
  } finally {
    root.unmount()
    host.remove()
  }
}

const pdfOlustur = async (cv: HTMLCanvasElement[], yon: Yon) => {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: yon === 'yatay' ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })
  const [pw, ph] = yon === 'yatay' ? [297, 210] : [210, 297]
  cv.forEach((page, i) => {
    if (i > 0) pdf.addPage('a4', yon === 'yatay' ? 'landscape' : 'portrait')
    pdf.addImage(page.toDataURL('image/png'), 'PNG', 0, 0, pw, ph, undefined, 'FAST')
  })
  return pdf
}

const sertifikaCanvaslar = async (s: Sertifika, tasarim = s.tasarim) => {
  if (!tasarim) return []
  const veri = veriGetir(s)
  const iptal = s.durum === 'İptal Edildi'
  const onYuz = await elemanlariCiz(tasarim.elemanlar, tasarim.yon, tasarim.zemin, veri, iptal)
  if (!tasarim.arkaElemanlar?.length) return [onYuz]
  const arkaYuz = await elemanlariCiz(tasarim.arkaElemanlar, tasarim.yon, tasarim.arkaZemin ?? tasarim.zemin, veri, iptal)
  return [onYuz, arkaYuz]
}

/** v2: tasarım anlık görüntüsünden PDF indir — yoksa eski motora düş */
export const sertifikaPdfIndirV2 = async (s: Sertifika): Promise<void> => {
  if (!s.tasarim) return eskiPdfIndir(s)
  const canvases = await sertifikaCanvaslar(s)
  const pdf = await pdfOlustur(canvases, s.tasarim.yon)
  pdf.save(`${s.sertifikaNo}.pdf`)
}

export const sertifikaPdfAcV2 = async (s: Sertifika): Promise<void> => {
  // Pencereyi ilk await'ten önce aç; gecikmiş window.open çağrısı açılır pencere engeline takılır.
  const pencere = window.open('about:blank', '_blank')
  if (!pencere) return
  try {
    if (!s.tasarim) {
      pencere.location.href = await sertifikaPdfUrlEski(s)
      return
    }
    const canvases = await sertifikaCanvaslar(s)
    const pdf = await pdfOlustur(canvases, s.tasarim.yon)
    pencere.location.href = String(pdf.output('bloburl'))
  } catch (error) {
    pencere.close()
    throw error
  }
}

export const sertifikaYazdirV2 = async (s: Sertifika): Promise<void> => {
  // Yazdırma penceresini kullanıcı tıklaması sırasında aç; görseller hazır olunca içeriğini doldur.
  const w = window.open('', '_blank')
  if (!w) return
  try {
    if (!s.tasarim) {
      const url = await sertifikaPng(s)
      w.document.write(`<html><head><title>${s.sertifikaNo}</title><style>@page{size:A4 landscape;margin:0}body{margin:0}img{display:block;width:100%}</style></head><body><img src="${url}" onload="setTimeout(()=>{print();close()},100)"></body></html>`)
      w.document.close()
      return
    }
    const canvases = await sertifikaCanvaslar(s)
    const sayfalar = canvases.map((cv) => cv.toDataURL('image/png'))
    const boyut = s.tasarim.yon === 'yatay' ? 'A4 landscape' : 'A4 portrait'
    const goruntuler = sayfalar.map((url, i) => `<img src="${url}" class="sayfa" ${i === sayfalar.length - 1 ? 'onload="setTimeout(()=>{print();close()},100)"' : ''}>`).join('')
    w.document.write(`<html><head><title>${s.sertifikaNo}</title><style>@page{size:${boyut};margin:0}body{margin:0}.sayfa{display:block;width:100%;page-break-after:always}.sayfa:last-child{page-break-after:auto}</style></head><body>${goruntuler}</body></html>`)
    w.document.close()
  } catch (error) {
    w.close()
    throw error
  }
}

/** Eski bir PDF sürümünü anlık görüntüsünden yeniden üretip indirir */
export const surumPdfIndir = async (p: PdfSurum, veri: SertifikaVeri, ad: string): Promise<void> => {
  const cv = [await elemanlariCiz(p.tasarim.elemanlar, p.tasarim.yon, p.tasarim.zemin, veri)]
  if (p.tasarim.arkaElemanlar?.length) cv.push(await elemanlariCiz(p.tasarim.arkaElemanlar, p.tasarim.yon, p.tasarim.arkaZemin ?? p.tasarim.zemin, veri))
  const pdf = await pdfOlustur(cv, p.tasarim.yon)
  pdf.save(ad)
}

/** Tasarım galerisi/editör için PNG data URL */
export const tasarimPng = async (elemanlar: TasarimEleman[], yon: Yon, zemin: string, veri: SertifikaVeri): Promise<string> =>
  (await elemanlariCiz(elemanlar, yon, zemin, veri)).toDataURL('image/png')

/** Tasarımdan PDF belgesi üretir (tasarımı olmayan sertifikalar için null). */
const tasarimPdfi = async (s: Sertifika) => {
  if (!s.tasarim) return null
  const canvases = await sertifikaCanvaslar(s)
  const { jsPDF } = await import('jspdf')
  const yatay = s.tasarim.yon === 'yatay'
  const pdf = new jsPDF({ orientation: yatay ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })
  canvases.forEach((cv, i) => {
    if (i > 0) pdf.addPage('a4', yatay ? 'landscape' : 'portrait')
    pdf.addImage(cv.toDataURL('image/png'), 'PNG', 0, 0, yatay ? 297 : 210, yatay ? 210 : 297, undefined, 'FAST')
  })
  return pdf
}

/** Önizleme için PDF blob URL'i. Tasarımı olmayan sertifikalarda eski motor kullanılır. */
export const sertifikaPdfUrl = async (s: Sertifika): Promise<string> => {
  const pdf = await tasarimPdfi(s)
  return pdf ? String(pdf.output('bloburl')) : sertifikaPdfUrlEski(s)
}

/** Seçili sertifikaları tek PDF'te birleştirip indirir; her sertifika ayrı sayfadır.
 *  Dönüş: PDF'e eklenen sertifika sayısı. */
export const sertifikalarPdfBirlestir = async (liste: Sertifika[], dosyaAdi: string): Promise<number> => {
  const { jsPDF } = await import('jspdf')
  let ana: InstanceType<typeof jsPDF> | null = null
  let sayi = 0
  for (const s of liste) {
    if (!s.tasarim) continue
    const canvases = await sertifikaCanvaslar(s)
    const yatay = s.tasarim.yon === 'yatay'
    const yon = yatay ? 'landscape' : 'portrait'
    if (!ana) ana = new jsPDF({ orientation: yon, unit: 'mm', format: 'a4' })
    for (const [i, cv] of canvases.entries()) {
      if (sayi > 0 || i > 0) ana.addPage('a4', yon)
      ana.addImage(cv.toDataURL('image/png'), 'PNG', 0, 0, yatay ? 297 : 210, yatay ? 210 : 297, undefined, 'FAST')
    }
    sayi++
  }
  if (ana && sayi > 0) ana.save(dosyaAdi)
  return sayi
}

export { sertifikaPng }
