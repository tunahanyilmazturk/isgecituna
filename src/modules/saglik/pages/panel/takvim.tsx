import { Link } from 'react-router'
import { useMemo, useState } from 'react'
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, WrenchIcon, HeartPulseIcon } from 'lucide-react'
import { Button } from '@saglik/components/ui/button'
import { cn } from '@saglik/lib/utils'
import { useEkipmanStore, useTaramaStore } from '@saglik/stores/saglik-stores'
import { BUGUN, type Ekipman, type Tarama } from '@saglik/data/saglik'
import { formatKisa } from '@saglik/lib/date'
import { saatAraligi } from '@saglik/lib/tarama'

const AYLAR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]
const GUNLER = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

type Olay =
  | { tip: 'tarama'; id: string; baslik: string; detay: string; durum: Tarama['durum'] }
  | { tip: 'kalibrasyon'; id: string; baslik: string; detay: string }

export default function TakvimPage() {
  const taramalar = useTaramaStore((s) => s.kayitlar)
  const ekipmanlar = useEkipmanStore((s) => s.kayitlar)

  const bugun = new Date(`${BUGUN}T00:00:00`)
  const [gorunen, setGorunen] = useState({ y: bugun.getFullYear(), m: bugun.getMonth() })
  const [secili, setSecili] = useState<string>(BUGUN)

  /** Tarih → olaylar (tarama + kalibrasyon bitişi) */
  const olaylar = useMemo(() => {
    const harita = new Map<string, Olay[]>()
    const ekle = (tarih: string, o: Olay) => harita.set(tarih, [...(harita.get(tarih) ?? []), o])
    for (const t of taramalar) {
      ekle(t.tarih, { tip: 'tarama', id: t.id, baslik: `${saatAraligi(t)} · ${t.firma}`, detay: `${t.hizmet} · ${t.lokasyon}`, durum: t.durum })
    }
    for (const e of ekipmanlar as Ekipman[]) {
      ekle(e.kalibrasyonBitis, { tip: 'kalibrasyon', id: e.id, baslik: `Kalibrasyon: ${e.ad}`, detay: e.seriNo })
    }
    return harita
  }, [taramalar, ekipmanlar])

  const hucreler = useMemo(() => {
    const ilk = new Date(gorunen.y, gorunen.m, 1)
    // Pazartesi = 0
    const bosBaslangic = (ilk.getDay() + 6) % 7
    const gunSayisi = new Date(gorunen.y, gorunen.m + 1, 0).getDate()
    const liste: (string | null)[] = Array.from({ length: bosBaslangic }, () => null)
    for (let d = 1; d <= gunSayisi; d++) liste.push(iso(gorunen.y, gorunen.m, d))
    while (liste.length % 7 !== 0) liste.push(null)
    return liste
  }, [gorunen])

  const ay = (delta: number) =>
    setGorunen((g) => {
      const d = new Date(g.y, g.m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })

  const seciliOlaylar = olaylar.get(secili) ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <CalendarDaysIcon className="size-5 text-amber-500" aria-hidden />
            Takvim
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Planlanan taramalar ve ekipman kalibrasyon bitiş tarihleri.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" aria-label="Önceki ay" onClick={() => ay(-1)}>
            <ChevronLeftIcon />
          </Button>
          <span className="min-w-36 text-center text-sm font-medium tabular-nums">
            {AYLAR[gorunen.m]} {gorunen.y}
          </span>
          <Button variant="outline" size="icon-sm" aria-label="Sonraki ay" onClick={() => ay(1)}>
            <ChevronRightIcon />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setGorunen({ y: bugun.getFullYear(), m: bugun.getMonth() }); setSecili(BUGUN) }}>
            Bugün
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs text-muted-foreground">
            {GUNLER.map((g) => (
              <div key={g} className="py-2 font-medium">{g}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {hucreler.map((tarih, i) => {
              if (!tarih) return <div key={`b${i}`} className="min-h-20 border-b border-r bg-muted/20 last:border-r-0" />
              const gunNo = Number(tarih.slice(8))
              const olay = olaylar.get(tarih) ?? []
              const bugunMu = tarih === BUGUN
              const sec = tarih === secili
              return (
                <button
                  key={tarih}
                  type="button"
                  onClick={() => setSecili(tarih)}
                  aria-pressed={sec}
                  className={cn(
                    'flex min-h-20 flex-col items-start gap-1 border-b border-r p-1.5 text-left transition-colors last:border-r-0 hover:bg-muted/50',
                    sec && 'bg-amber-400/10 ring-1 ring-amber-400/60 ring-inset',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full text-xs tabular-nums',
                      bugunMu ? 'bg-amber-400 font-bold text-zinc-950' : 'text-muted-foreground',
                    )}
                  >
                    {gunNo}
                  </span>
                  <div className="flex w-full flex-col gap-0.5">
                    {olay.slice(0, 2).map((o) => (
                      <span
                        key={o.id}
                        className={cn(
                          'truncate rounded px-1 py-px text-[10px] font-medium',
                          o.tip === 'tarama' ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300' : 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
                        )}
                      >
                        {o.baslik}
                      </span>
                    ))}
                    {olay.length > 2 && <span className="text-[10px] text-muted-foreground">+{olay.length - 2} daha</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <aside className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Seçili gün</p>
          <h2 className="mt-0.5 text-base font-semibold">{formatKisa(secili)}</h2>
          <div className="mt-3 space-y-2">
            {seciliOlaylar.length === 0 && (
              <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                Bu gün için kayıt yok.
              </p>
            )}
            {seciliOlaylar.map((o) => (
              <Link key={`${o.tip}-${o.id}`} to={o.tip === 'tarama' ? `/panel/taramalar?q=${encodeURIComponent(o.baslik.split(' · ')[1] ?? '')}` : `/panel/ekipmanlar?q=${encodeURIComponent(o.baslik.replace('Kalibrasyon: ', ''))}`} className="flex gap-2.5 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/50">
                {o.tip === 'tarama' ? (
                  <HeartPulseIcon className="mt-0.5 size-4 shrink-0 text-violet-600 dark:text-violet-400" />
                ) : (
                  <WrenchIcon className="mt-0.5 size-4 shrink-0 text-orange-600 dark:text-orange-400" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{o.baslik}</p>
                  <p className="truncate text-xs text-muted-foreground">{o.detay}</p>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
