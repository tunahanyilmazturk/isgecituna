import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { CalendarIcon, ClockIcon, GraduationCapIcon, PlayIcon, RotateCwIcon, SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CipGrup } from '@/components/list-bits'
import { cn } from '@/lib/utils'
import { kalanGunMetni } from '@/lib/katilimci'
import { egitimSuresiDakika } from '@/data/egitimler'
import type { KisiDurum } from '@/data/personeller'
import { TODAY } from '@/data/dashboard'
import { kdEtiket, oynatYolu, useAtamalarim, useBen, type AtamaSatiri } from '@/pages/portal/portal-ortak'

const SEKME_MAP: Record<string, KisiDurum[]> = {
  Tümü: ['Bekliyor', 'Devam Ediyor', 'Tamamlandı', 'Başarısız', 'Onay Bekliyor', 'Gecikti'],
  Bekleyen: ['Bekliyor', 'Gecikti'],
  'Devam Eden': ['Devam Ediyor', 'Onay Bekliyor'],
  Tamamlanan: ['Tamamlandı'],
  Başarısız: ['Başarısız'],
}

type Siralama = 'son' | 'ad' | 'ilerleme'
const SIRALAMA_ETIKET: Record<Siralama, string> = {
  son: 'Son tarihe göre',
  ad: 'Ada göre',
  ilerleme: 'İlerlemeye göre',
}

const girdi = 'h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30'

function EgitimKarti({ x }: { x: AtamaSatiri }) {
  const navigate = useNavigate()
  const tamam = x.kd === 'Tamamlandı'
  const sinav = x.il?.denemeler.length ? x.il.denemeler[x.il.denemeler.length - 1] : undefined

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border bg-card">
      <div className={cn('relative h-24 bg-gradient-to-br px-5 py-4', x.eg?.kapakTon)}>
        {x.eg?.kapakGorsel && <img src={x.eg.kapakGorsel} alt="" className="absolute inset-0 size-full object-cover" />}
        {x.eg?.kapakGorsel && <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/10" />}
        <p className="relative z-10 line-clamp-2 max-w-[78%] text-base leading-snug font-semibold text-white">{x.eg?.baslik}</p>
        <span
          className={cn(
            'absolute top-3 right-3 rounded-full px-2 py-0.5 text-[11px] font-medium backdrop-blur',
            tamam ? 'bg-emerald-500/85 text-white' : 'bg-black/30 text-white',
          )}
        >
          {kdEtiket(x.kd)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="size-3" /> {x.eg ? egitimSuresiDakika(x.eg) : '—'} dk
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarIcon className="size-3" />
            {tamam ? `Son tarih ${x.a.sonTarih}` : `Son: ${x.a.sonTarih} · ${kalanGunMetni(x.a.sonTarih, TODAY)}`}
          </span>
          {x.a.zorunlu && <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-500">Zorunlu</span>}
        </div>

        {x.siradaki && !tamam && (
          <p className="mt-3 text-xs text-muted-foreground">
            Sıradaki ders: <span className="font-medium text-foreground">{x.siradaki.icerik.baslik}</span>
            <span className="tabular-nums"> · {x.siradaki.sira}/{x.siradaki.toplam}</span>
          </p>
        )}

        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className={cn('h-full rounded-full', tamam ? 'bg-emerald-500' : 'bg-amber-500')} style={{ width: `${x.yuzde}%` }} />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">%{x.yuzde}</span>
        </div>

        {sinav && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Son sınav: {sinav.puan} puan · {sinav.gecti ? 'geçti' : 'geçemedi'} · {x.il?.denemeler.length} deneme
          </p>
        )}

        <Button
          size="sm"
          className="mt-4 w-full"
          variant={tamam ? 'outline' : 'default'}
          onClick={() => navigate(oynatYolu(x.a.egitimId, x.a.id))}
        >
          {tamam ? <RotateCwIcon /> : <PlayIcon />}
          {tamam ? 'Tekrar gözden geçir' : x.yuzde > 0 ? 'Devam et' : 'Eğitime başla'}
        </Button>
      </div>
    </article>
  )
}

/** Katılımcının atanmış eğitimleri: sekme, arama ve sıralama ile */
export default function PortalEgitimler() {
  const { pid } = useBen()
  const liste = useAtamalarim(pid)
  const [sekme, setSekme] = useState<string>('Tümü')
  const [ara, setAra] = useState('')
  const [siralama, setSiralama] = useState<Siralama>('son')

  const filtreli = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase('tr-TR')
    const secili = liste.filter(
      (x) => SEKME_MAP[sekme].includes(x.kd) && (!q || (x.eg?.baslik ?? '').toLocaleLowerCase('tr-TR').includes(q)),
    )
    const sirali = [...secili]
    if (siralama === 'son') sirali.sort((x, y) => x.a.sonTarih.localeCompare(y.a.sonTarih))
    if (siralama === 'ad') sirali.sort((x, y) => (x.eg?.baslik ?? '').localeCompare(y.eg?.baslik ?? '', 'tr'))
    if (siralama === 'ilerleme') sirali.sort((x, y) => y.yuzde - x.yuzde)
    return sirali
  }, [liste, sekme, ara, siralama])

  const toplam = liste.length
  const tamamlanan = liste.filter((x) => x.kd === 'Tamamlandı').length
  const oran = toplam ? Math.round((tamamlanan / toplam) * 100) : 0

  return (
    <div className="mx-auto max-w-6xl p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Eğitimlerim</h1>
          <p className="mt-1 text-sm text-muted-foreground">Size atanan eğitimler, sıradaki dersler ve ilerlemeniz</p>
        </div>
        {toplam > 0 && (
          <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-2.5">
            <span className="text-xs text-muted-foreground">{tamamlanan}/{toplam} tamamlandı</span>
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${oran}%` }} />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">%{oran}</span>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CipGrup secenekler={Object.keys(SEKME_MAP)} value={sekme} onChange={setSekme} />
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1 md:w-64">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={ara}
              onChange={(e) => setAra(e.target.value)}
              placeholder="Eğitim ara"
              aria-label="Eğitim ara"
              className={cn(girdi, 'pl-9')}
            />
          </div>
          <select
            value={siralama}
            onChange={(e) => setSiralama(e.target.value as Siralama)}
            aria-label="Sırala"
            className={cn(girdi, 'w-auto shrink-0 pr-8')}
          >
            {(Object.keys(SIRALAMA_ETIKET) as Siralama[]).map((s) => (
              <option key={s} value={s}>
                {SIRALAMA_ETIKET[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtreli.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed py-16 text-center">
          <GraduationCapIcon className="mx-auto size-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm font-medium">{ara ? 'Aramanızla eşleşen eğitim yok' : 'Bu sekmede eğitim yok'}</p>
          {ara && (
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => setAra('')}>
              Aramayı temizle
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtreli.map((x) => (
            <EgitimKarti key={x.a.id} x={x} />
          ))}
        </div>
      )}
    </div>
  )
}
