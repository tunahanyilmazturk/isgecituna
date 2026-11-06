/* OSGB yönetim paneli ana dashboard'u — modüler widget mimarisi; tüm veri
   src/lib/dashboard-data.ts üzerinden tek seferde türetilir. */
import { useMemo, useState } from 'react'
import { SlidersHorizontalIcon } from 'lucide-react'
import { EgitimAnalizWidget, FirmaAnalizWidget, RiskAnalizWidget, TrendWidget } from '@/components/dashboard/grafikler'
import { DashboardHero } from '@/components/dashboard/hero'
import { KpiSerit } from '@/components/dashboard/kpi'
import { OperasyonMerkezi } from '@/components/dashboard/operasyon'
import { OzellestirDrawer } from '@/components/dashboard/ozellestir'
import { AktivitelerWidget, BildirimlerWidget, HizliErisimWidget } from '@/components/dashboard/sag-panel'
import { aralikCoz, useDashboardVerisi, type AralikKey } from '@/lib/dashboard-data'
import { useDashboardStore, type WidgetId } from '@/stores/dashboard-store'

export default function DashboardPage() {
  const [aralikKey, setAralikKey] = useState<AralikKey>('30g')
  const [ozel, setOzel] = useState<{ bas: string; bit: string }>({ bas: '', bit: '' })
  const [ozellestir, setOzellestir] = useState(false)
  const { gizli, anaSira, yanSira, okundu } = useDashboardStore()

  const aralik = useMemo(
    () => aralikCoz(aralikKey, ozel.bas || undefined, ozel.bit || undefined),
    [aralikKey, ozel],
  )
  const v = useDashboardVerisi(aralik)

  const gorunur = (id: WidgetId) => !gizli.includes(id)
  const okunmamis = v.bildirimler.filter((b) => !okundu.includes(b.id)).length

  const ANA: Record<string, React.ReactNode> = {
    'kpi': (
      <KpiSerit
        kpis={v.kpis}
        aralik={aralik}
        aralikSec={setAralikKey}
        ozelBas={ozel.bas}
        ozelBit={ozel.bit}
        ozelAyarla={(bas, bit) => setOzel({ bas, bit })}
      />
    ),
    'operasyon': <OperasyonMerkezi gorevler={v.gorevler} />,
    'trend': <TrendWidget trend={v.trend} />,
    'risk-analiz': <RiskAnalizWidget riskDagilim={v.riskDagilim} aksiyonDurum={v.aksiyonDurum} firmaAcik={v.firmaAcik} />,
    'egitim-analiz': <EgitimAnalizWidget egitim={v.egitim} />,
    'firma-analiz': <FirmaAnalizWidget ozet={v.firmaOzet} />,
  }
  const YAN: Record<string, React.ReactNode> = {
    'bildirimler': <BildirimlerWidget bildirimler={v.bildirimler} />,
    'aktiviteler': <AktivitelerWidget aktiviteler={v.aktiviteler} />,
    'hizli': <HizliErisimWidget linkler={v.hizliLinkler} />,
  }

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-5">
      <div className="relative">
        <DashboardHero okunmamis={okunmamis} />
        <button
          onClick={() => setOzellestir(true)}
          className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-zinc-950/65 px-3 py-1.5 text-[11px] font-medium text-zinc-200 shadow-lg backdrop-blur-md transition-colors hover:border-amber-300/40 hover:text-amber-200"
        >
          <SlidersHorizontalIcon className="size-3.5" /> Özelleştir
        </button>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          {anaSira.filter((id) => gorunur(id as WidgetId)).map((id) => (
            <div key={id}>{ANA[id]}</div>
          ))}
        </div>
        <aside className="flex min-w-0 flex-col gap-5">
          {yanSira.filter((id) => gorunur(id as WidgetId)).map((id) => (
            <div key={id}>{YAN[id]}</div>
          ))}
        </aside>
      </div>

      <OzellestirDrawer acik={ozellestir} kapat={() => setOzellestir(false)} />
    </div>
  )
}
