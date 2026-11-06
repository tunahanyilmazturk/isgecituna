/* Dashboard ortak parçaları — widget kabuğu, boş durum, iskelet, mikro grafikler */
import { InboxIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Widget({
  baslik, aciklama, sag, children, sinif,
}: {
  baslik?: string
  aciklama?: string
  sag?: React.ReactNode
  children: React.ReactNode
  sinif?: string
}) {
  return (
    <section className={cn('rounded-2xl border bg-card p-5', sinif)}>
      {(baslik || sag) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight">{baslik}</h2>
            {aciklama && <p className="mt-0.5 text-xs text-muted-foreground">{aciklama}</p>}
          </div>
          {sag}
        </div>
      )}
      {children}
    </section>
  )
}

export function Bos({ metin, detay }: { metin: string; detay?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center">
      <InboxIcon className="size-7 text-muted-foreground/40" />
      <p className="text-sm font-medium text-muted-foreground">{metin}</p>
      {detay && <p className="max-w-60 text-xs text-muted-foreground/70">{detay}</p>}
    </div>
  )
}

export function WidgetSkeleton({ satir = 3 }: { satir?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: satir }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-xl bg-muted/60" style={{ animationDelay: `${i * 90}ms` }} />
      ))}
    </div>
  )
}

/* ------------------------------- Mikro grafikler ------------------------------ */

export function Sparkline({ degerler, renk = '#F59E0B', genislik = 72, yukseklik = 24 }: { degerler: number[]; renk?: string; genislik?: number; yukseklik?: number }) {
  if (degerler.length < 2) return null
  const max = Math.max(...degerler, 1)
  const w = genislik, h = yukseklik, p = 2
  const x = (i: number) => p + (i / (degerler.length - 1)) * (w - 2 * p)
  const y = (v: number) => h - p - (v / max) * (h - 2 * p)
  const nokta = degerler.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  return (
    <svg width={w} height={h} className="shrink-0" aria-hidden>
      <polyline points={nokta} fill="none" stroke={renk} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(degerler.length - 1)} cy={y(degerler[degerler.length - 1])} r="2.2" fill={renk} />
    </svg>
  )
}

export function Donut({ dilimler, merkez, boyut = 118 }: { dilimler: { deger: number; renk: string; etiket: string }[]; merkez?: React.ReactNode; boyut?: number }) {
  const toplam = dilimler.reduce((a, d) => a + d.deger, 0)
  const r = 42, c = 2 * Math.PI * r
  const dolu = dilimler.filter((d) => d.deger > 0)
  const ofsetler = dolu.reduce<number[]>((acc, d, i) => [...acc, (acc[i - 1] ?? 0) + (d.deger / toplam) * c], [])
  return (
    <div className="relative" style={{ width: boyut, height: boyut }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="13" className="stroke-muted/40" />
        {toplam > 0 && dolu.map((d, i) => {
          const pay = (d.deger / toplam) * c
          return (
            <circle key={d.etiket} cx="50" cy="50" r={r} fill="none" stroke={d.renk} strokeWidth="13"
              strokeDasharray={`${Math.max(pay - 1.5, 0)} ${c}`} strokeDashoffset={-(ofsetler[i] - pay)} strokeLinecap="butt" />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{merkez}</div>
    </div>
  )
}

export function YatayBar({ ogeler, renk }: { ogeler: { etiket: string; deger: number; renk?: string }[]; renk?: string }) {
  const max = Math.max(...ogeler.map((o) => o.deger), 1)
  return (
    <div className="space-y-2.5">
      {ogeler.map((o) => (
        <div key={o.etiket} className="flex items-center gap-3 text-xs">
          <span className="w-32 truncate text-muted-foreground" title={o.etiket}>{o.etiket}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/50">
            <div className="h-full rounded-full transition-all" style={{ width: `${(o.deger / max) * 100}%`, background: o.renk ?? renk ?? '#F59E0B' }} />
          </div>
          <span className="w-7 text-right font-semibold tabular-nums">{o.deger}</span>
        </div>
      ))}
    </div>
  )
}

/** İki serili minimal alan/çizgi grafiği */
export function CizgiGrafik({
  seriler, etiketler, yukseklik = 150,
}: {
  seriler: { ad: string; renk: string; degerler: number[] }[]
  etiketler: string[]
  yukseklik?: number
}) {
  const w = 560, h = yukseklik, pT = 10, pB = 20, pX = 8
  const max = Math.max(...seriler.flatMap((s) => s.degerler), 1)
  const n = etiketler.length
  const x = (i: number) => pX + (i / Math.max(n - 1, 1)) * (w - 2 * pX)
  const y = (v: number) => pT + (1 - v / max) * (h - pT - pB)
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: yukseklik }}>
        {[0.25, 0.5, 0.75].map((k) => (
          <line key={k} x1={pX} x2={w - pX} y1={pT + k * (h - pT - pB)} y2={pT + k * (h - pT - pB)} className="stroke-border/50" strokeDasharray="3 5" strokeWidth="0.6" />
        ))}
        {seriler.map((s) => {
          const pts = s.degerler.map((v, i) => `${x(i)},${y(v)}`)
          const alan = `${pX},${h - pB} ${pts.join(' ')} ${x(n - 1)},${h - pB}`
          return (
            <g key={s.ad}>
              <polygon points={alan} fill={s.renk} opacity="0.09" />
              <polyline points={pts.join(' ')} fill="none" stroke={s.renk} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
              {s.degerler.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r="8" fill="transparent">
                  <title>{`${s.ad} · ${etiketler[i]}: ${v}`}</title>
                </circle>
              ))}
              {s.degerler.map((v, i) => v > 0 && (
                <circle key={`d${i}`} cx={x(i)} cy={y(v)} r="2.4" fill={s.renk} stroke="var(--card)" strokeWidth="1.4" />
              ))}
            </g>
          )
        })}
        {etiketler.map((e, i) => (
          <text key={e} x={x(i)} y={h - 6} textAnchor="middle" className="fill-muted-foreground" fontSize="9">{e}</text>
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap gap-4">
        {seriler.map((s) => (
          <span key={s.ad} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: s.renk }} />{s.ad}
          </span>
        ))}
      </div>
    </div>
  )
}
