/*
 * Risk değerlendirme PDF raporu — üretim akışı.
 * Sayfa bileşenleri risk-pdf-doc.tsx, DOM→canvas→A4 hattı pdf-utils.ts içindedir.
 */
import type { ReactElement } from 'react'
import type { RiskAksiyon, RiskDegerlendirme } from '@/data/risk'
import { useRiskStore } from '@/stores/risk-store'
import { AK_PER_SAYFA, TH_PER_SAYFA, elToCanvas, pdfYaz } from '@/lib/pdf-utils'
import {
  AksiyonRaporSayfasi,
  RiskAksiyonSayfasi,
  RiskImzaSayfasi,
  RiskKapakSayfa,
  RiskTehlikeSayfasi,
} from '@/lib/risk-pdf-doc'

type SayfaYap = (no: number, toplam: number) => ReactElement

export async function riskPdfIndir(d: RiskDegerlendirme): Promise<void> {
  const { tehlikeler, aksiyonlar, yontemler } = useRiskStore.getState()
  const thListe = tehlikeler.filter((t) => t.degerlendirmeId === d.id && !t.silindi)
  const akListe = aksiyonlar.filter((a) => a.degerlendirmeId === d.id)
  const yontem = yontemler.find((y) => y.id === d.yontemId)

  const surumNot = `Sürüm ${d.surum} · ${d.degerlendirmeTarihi} · Yenileme: ${d.yenilemeTarihi}`

  const sayfalar: SayfaYap[] = []

  // Sayfa 1 — işyeri + ekip + özet
  sayfalar.push((no, toplam) => (
    <RiskKapakSayfa
      d={d} surumNot={surumNot} yontemAd={yontem?.ad ?? d.yontemId}
      thListe={thListe} akListe={akListe} no={no} toplam={toplam}
    />
  ))

  // Tehlike sayfaları — sabit kart sayısı (kart bölünmez)
  for (let i = 0; i < thListe.length; i += TH_PER_SAYFA) {
    const dilim = thListe.slice(i, i + TH_PER_SAYFA)
    const bas = i
    sayfalar.push((no, toplam) => (
      <RiskTehlikeSayfasi
        d={d} surumNot={surumNot} dilim={dilim} bas={bas}
        toplamTh={thListe.length} akListe={akListe} no={no} toplam={toplam}
      />
    ))
  }

  // Aksiyon sayfaları
  for (let i = 0; i < akListe.length; i += AK_PER_SAYFA) {
    const dilim = akListe.slice(i, i + AK_PER_SAYFA)
    const bas = i
    sayfalar.push((no, toplam) => (
      <RiskAksiyonSayfasi
        d={d} surumNot={surumNot} dilim={dilim} bas={bas}
        toplamAk={akListe.length} no={no} toplam={toplam}
      />
    ))
  }

  // Son sayfa — imza ve revizyon
  sayfalar.push((no, toplam) => (
    <RiskImzaSayfasi d={d} surumNot={surumNot} no={no} toplam={toplam} />
  ))

  const toplam = sayfalar.length
  const canvaslar = await Promise.all(sayfalar.map((yap, i) => elToCanvas(yap(i + 1, toplam))))
  await pdfYaz(canvaslar, `risk-degerlendirme-${d.id}-v${d.surum}.pdf`)
}

/** Aksiyon takip raporu — merkezi aksiyon listesi için */
export async function aksiyonPdfIndir(aksiyonlar: RiskAksiyon[], baslik: string, firmaAd: string): Promise<void> {
  const sayfalar: SayfaYap[] = []
  const raporTarihi = new Date().toISOString().slice(0, 10)
  const parca = Math.max(1, Math.ceil(aksiyonlar.length / AK_PER_SAYFA))
  for (let p = 0; p < parca; p++) {
    const dilim = aksiyonlar.slice(p * AK_PER_SAYFA, p * AK_PER_SAYFA + AK_PER_SAYFA)
    sayfalar.push((no, toplam) => (
      <AksiyonRaporSayfasi baslik={baslik} firmaAd={firmaAd} aksiyonlar={aksiyonlar} dilim={dilim} raporTarihi={raporTarihi} no={no} toplam={toplam} />
    ))
  }
  const toplam = sayfalar.length
  const canvaslar = await Promise.all(sayfalar.map((yap, i) => elToCanvas(yap(i + 1, toplam))))
  await pdfYaz(canvaslar, `aksiyon-raporu-${raporTarihi}.pdf`)
}
