/* Günlük operasyon merkezi — birleşik iş listesi; tamamlama gerçek kaydı günceller */
import { useState } from 'react'
import { ArrowRightIcon, CheckIcon } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import type { Gorev } from '@/lib/dashboard-data'
import { gunFarki } from '@/lib/date'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { useRiskStore } from '@/stores/risk-store'
import { TODAY } from '@/data/dashboard'
import { Bos, Widget } from './ortak'

const ONCELIK_RENK = { kritik: 'bg-red-500', yuksek: 'bg-amber-500', orta: 'bg-zinc-400' } as const

const FILTRELER = [
  { key: 'tumu', label: 'Tümü' },
  { key: 'gecikmis', label: 'Gecikmiş' },
  { key: 'bugun', label: 'Bugün' },
  { key: 'hafta', label: 'Bu hafta' },
] as const
type Filtre = (typeof FILTRELER)[number]['key']

export function OperasyonMerkezi({ gorevler }: { gorevler: Gorev[] }) {
  const [filtre, setFiltre] = useState<Filtre>('tumu')
  const [acikId, setAcikId] = useState<string | null>(null)
  const [not, setNot] = useState('')
  const user = useAuthStore((s) => s.user)
  const aksiyonTamamla = useRiskStore((s) => s.aksiyonTamamla)

  const filtrele = (g: Gorev) => {
    if (filtre === 'tumu') return true
    if (filtre === 'gecikmis') return g.tarih < TODAY || g.durum === 'Gecikmiş' || g.durum === 'Süresi dolmuş' || g.durum === 'Süresi geçti' || g.durum === 'Süresi doldu'
    if (filtre === 'bugun') return g.tarih === TODAY
    return gunFarki(TODAY, g.tarih) <= 7 && g.tarih >= TODAY
  }
  const liste = gorevler.filter(filtrele)
  const gecikmisSayi = gorevler.filter((g) => g.tarih < TODAY).length

  const tamamla = (g: Gorev) => {
    if (!g.aksiyonId) return
    aksiyonTamamla(g.aksiyonId, { kullanici: user?.name ?? '', not: not.trim() || 'Dashboard üzerinden tamamlandı' })
    toast.success(`"${g.baslik}" tamamlandı`)
    setAcikId(null)
    setNot('')
  }

  return (
    <Widget
      baslik="Günlük operasyon merkezi"
      aciklama={`${gorevler.length} açık iş — öncelik ve tarihe göre sıralı`}
      sag={
        <div className="flex items-center gap-1 rounded-full border bg-muted/40 p-0.5">
          {FILTRELER.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltre(f.key)}
              className={cn(
                'rounded-full px-3 py-1 text-[11px] font-medium transition-colors',
                filtre === f.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}{f.key === 'gecikmis' && gecikmisSayi > 0 ? ` · ${gecikmisSayi}` : ''}
            </button>
          ))}
        </div>
      }
    >
      {liste.length === 0 ? (
        <Bos metin="Bu filtrede iş yok" detay="Açık görevler ve yaklaşan terminler burada listelenir." />
      ) : (
        <div className="-mx-2 divide-y divide-border/60">
          {liste.slice(0, 14).map((g) => {
            const gecikmis = g.tarih < TODAY
            const kalan = gunFarki(TODAY, g.tarih)
            return (
              <div key={g.id} className="px-2">
                <div className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/40">
                  <span className={cn('size-2 shrink-0 rounded-full', ONCELIK_RENK[g.oncelik])} title={`Öncelik: ${g.oncelik}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-medium">{g.baslik}</p>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-px text-[10px] font-medium">{g.tur}</span>
                      {g.firma && <span className="truncate">{g.firma}</span>}
                      {g.sorumlu && <span className="truncate">· {g.sorumlu}</span>}
                    </p>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className={cn('text-[11px] font-medium tabular-nums', gecikmis ? 'text-red-500' : 'text-muted-foreground')}>
                      {gecikmis ? `${Math.abs(kalan)} gün gecikti` : kalan === 0 ? 'Bugün' : `${kalan} gün kaldı`}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/70">{g.durum}</p>
                  </div>
                  {g.aksiyonId && (
                    <button
                      onClick={() => { setAcikId(acikId === g.id ? null : g.id); setNot('') }}
                      className={cn(
                        'hidden shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors group-hover:inline-flex',
                        'text-muted-foreground hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-600',
                      )}
                    >
                      <CheckIcon className="size-3" /> Tamamla
                    </button>
                  )}
                  <Link to={g.link} className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    <ArrowRightIcon className="size-3.5" />
                  </Link>
                </div>
                {acikId === g.id && (
                  <div className="mb-2 ml-7 flex items-start gap-2 rounded-lg border bg-muted/30 p-2.5">
                    <textarea
                      autoFocus
                      rows={1}
                      value={not}
                      onChange={(e) => setNot(e.target.value)}
                      placeholder="Tamamlanma notu (opsiyonel)…"
                      className="min-h-8 flex-1 resize-none rounded-md border-0 bg-transparent px-1 py-1 text-xs outline-none placeholder:text-muted-foreground/60"
                    />
                    <button onClick={() => tamamla(g)} className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-500">
                      Kaydet
                    </button>
                    <button onClick={() => setAcikId(null)} className="rounded-md px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground">
                      Vazgeç
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {liste.length > 14 && (
            <p className="px-4 py-2.5 text-[11px] text-muted-foreground">+{liste.length - 14} kayıt daha — ilgili modüllerden takip edin</p>
          )}
        </div>
      )}
    </Widget>
  )
}
