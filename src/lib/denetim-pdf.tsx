/*
 * Denetim PDF raporu — üretim akışı.
 * Sayfa bileşenleri denetim-pdf-doc.tsx, DOM→canvas→A4 hattı pdf-utils.ts içindedir.
 */
import type { ReactElement } from 'react'
import { elToCanvas, pdfYaz } from '@/lib/pdf-utils'
import {
  maddeIstat,
  puanHesapla,
  type Denetim,
  type DenetimBulgu,
} from '@/data/denetimler'
import type { RiskAksiyon } from '@/data/risk'
import {
  DenetimBulguListe,
  DenetimKapak,
  DenetimKapanis,
  DenetimMaddeListe,
  DenetimSayfa,
} from '@/lib/denetim-pdf-doc'

export async function denetimPdfIndir(d: Denetim, bulgular: DenetimBulgu[], aksiyonlar: RiskAksiyon[]): Promise<void> {
  const ist = maddeIstat(d.maddeler)
  const puan = puanHesapla(d.maddeler)
  const kategoriler = [...new Set(d.maddeler.map((m) => m.kategoriAd))]
  const sayfalar: HTMLCanvasElement[] = []

  const katMaddeler = kategoriler.flatMap((k) => d.maddeler.filter((m) => m.kategoriAd === k))
  const SAYFA_MADDE = 14
  const maddeSayfa = Math.max(1, Math.ceil(katMaddeler.length / SAYFA_MADDE))
  const bulguSayfa = Math.max(1, Math.ceil(bulgular.length / 4))
  const toplam = 1 + maddeSayfa + bulguSayfa + 1
  let no = 0

  const sayf = (icerik: ReactElement): ReactElement => {
    no += 1
    return <DenetimSayfa d={d} no={no} toplam={toplam}>{icerik}</DenetimSayfa>
  }
  const tum: ReactElement[] = []

  // Sayfa 1 — kapak + özet
  tum.push(sayf(<DenetimKapak d={d} ist={ist} puan={puan} bulguSayi={bulgular.length} />))

  // Kontrol listesi sayfaları
  for (let p = 0; p < maddeSayfa; p++) {
    const dilim = katMaddeler.slice(p * SAYFA_MADDE, (p + 1) * SAYFA_MADDE)
    tum.push(sayf(<DenetimMaddeListe d={d} dilim={dilim} basNo={p * SAYFA_MADDE} p={p} maddeSayfa={maddeSayfa} puan={puan} />))
  }

  // Uygunsuzluk sayfaları
  for (let p = 0; p < bulguSayfa; p++) {
    const dilim = bulgular.slice(p * 4, (p + 1) * 4)
    tum.push(sayf(<DenetimBulguListe d={d} dilim={dilim} aksiyonlar={aksiyonlar} p={p} bulguSayfa={bulguSayfa} />))
  }

  // Son sayfa — aksiyonlar + genel değerlendirme + imza
  tum.push(sayf(<DenetimKapanis d={d} aksiyonlar={aksiyonlar} bulgular={bulgular} ist={ist} puan={puan} />))

  for (const s of tum) sayfalar.push(await elToCanvas(s))
  await pdfYaz(sayfalar, `${d.no}-denetim-raporu.pdf`)
}
