/* KPI şeridi — tarih aralığı seçici, değişim rozeti ve sparkline'lı kartlar */
import { ArrowDownRightIcon, ArrowUpRightIcon, CalendarRangeIcon } from 'lucide-react'
import { Link } from 'react-router'
import { ARALIK_SECENEKLERI, type Aralik, type AralikKey, type Kpi } from '@/lib/dashboard-data'
import { formatKisa } from '@/lib/date'
import { cn } from '@/lib/utils'
import { Sparkline } from './ortak'

export function KpiSerit({
  kpis, aralik, aralikSec, ozelBas, ozelBit, ozelAyarla,
}: {
  kpis: Kpi[]
  aralik: Aralik
  aralikSec: (k: AralikKey) => void
  ozelBas: string
  ozelBit: string
  ozelAyarla: (bas: string, bit: string) => void
}) {
  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-full border bg-muted/40 p-0.5">
          {ARALIK_SECENEKLERI.map((a) => (
            <button
              key={a.key}
              onClick={() => aralikSec(a.key)}
              className={cn(
                'rounded-full px-3 py-1 text-[11px] font-medium transition-colors',
                aralik.key === a.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
        {aralik.key === 'ozel' && (
          <div className="flex items-center gap-1.5 text-xs">
            <input type="date" value={ozelBas} max={ozelBit} onChange={(e) => ozelAyarla(e.target.value, ozelBit)}
              className="rounded-lg border bg-background px-2 py-1 text-xs" />
            <span className="text-muted-foreground">—</span>
            <input type="date" value={ozelBit} min={ozelBas} onChange={(e) => ozelAyarla(ozelBas, e.target.value)}
              className="rounded-lg border bg-background px-2 py-1 text-xs" />
          </div>
        )}
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CalendarRangeIcon className="size-3.5" />
          {formatKisa(aralik.baslangic)} — {formatKisa(aralik.bitis)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <Link
            key={k.id}
            to={k.link}
            className="group flex flex-col gap-2.5 rounded-2xl border bg-card p-4 transition-colors hover:border-foreground/20"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">{k.baslik}</p>
              {k.delta !== undefined && k.delta !== 0 && (
                <span className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                  k.delta > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-500',
                )}>
                  {k.delta > 0 ? <ArrowUpRightIcon className="size-3" /> : <ArrowDownRightIcon className="size-3" />}
                  {Math.abs(k.delta)}
                </span>
              )}
            </div>
            <p className="text-[26px] leading-none font-semibold tracking-tight tabular-nums">{k.deger}</p>
            <div className="mt-auto flex items-end justify-between gap-2">
              <p className="min-w-0 truncate text-[11px] text-muted-foreground/80">{k.alt}</p>
              {k.spark && <Sparkline degerler={k.spark} />}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
