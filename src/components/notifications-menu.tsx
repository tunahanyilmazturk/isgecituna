import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { BellIcon, CalendarClockIcon, CheckCheckIcon, FileWarningIcon, HeartPulseIcon, WrenchIcon, type LucideIcon } from 'lucide-react'
import { BUGUN } from '@/data/saglik'
import { gunFarki } from '@/lib/date'
import { cn } from '@/lib/utils'
import { saatAraligi, taramaEksikleri } from '@/lib/tarama'
import { useEkipmanStore, useTaramaStore, useTeklifStore } from '@/stores/saglik-stores'

/* ---------------------------------- Model ---------------------------------- */

type Grup = 'bugun' | 'hafta' | 'sorun'
type Ton = 'red' | 'amber' | 'violet' | 'violet'

interface Bildirim {
  /** Kararlı kimlik; okundu durumu bu kimlikle saklanır */
  id: string
  grup: Grup
  ikon: LucideIcon
  baslik: string
  detay: string
  ton: Ton
  to: string
}

const GRUPLAR: { k: Grup; e: string }[] = [
  { k: 'bugun', e: 'Bugün ve yarın' },
  { k: 'hafta', e: 'Bu hafta' },
  { k: 'sorun', e: 'Sorunlar' },
]

const TON: Record<Ton, string> = {
  red: 'bg-red-500/10 text-red-600 dark:text-red-400',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  
  violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
}

/* ------------------------- Okundu durumu (tarayıcıda) ------------------------- */

const OKUNDU_ANAHTAR = 'osgbhub-bildirim-okundu'

/** Okundu kimlikleri; depo erişilemezse bildirimler yine görünür, durum oturumluk kalır */
function okunanlariOku(): Set<string> {
  try {
    const ham = window.localStorage.getItem(OKUNDU_ANAHTAR)
    return new Set(ham ? (JSON.parse(ham) as string[]) : [])
  } catch {
    return new Set()
  }
}

function okunanlariYaz(kimlikler: Set<string>) {
  try {
    window.localStorage.setItem(OKUNDU_ANAHTAR, JSON.stringify([...kimlikler].slice(-500)))
  } catch {
    /* depo kapalıysa durum kaydedilmez */
  }
}

/* --------------------------------- Bileşen --------------------------------- */

/**
 * Üst çubuk bildirimleri. Zil düğmesinin altında açılan panel: gruplar halinde bildirimler,
 * okunmamış filtresi, tek tek ve toplu okundu işaretleme. Kayda tıklayınca ilgili sayfaya gider.
 */
export function NotificationsMenu() {
  const [acik, setAcik] = useState(false)
  const [yalnizYeni, setYalnizYeni] = useState(false)
  const [okunan, setOkunan] = useState<Set<string>>(() => okunanlariOku())
  const kapsayici = useRef<HTMLDivElement>(null)

  const ekipmanlar = useEkipmanStore((s) => s.kayitlar)
  const teklifler = useTeklifStore((s) => s.kayitlar)
  const taramalar = useTaramaStore((s) => s.kayitlar)

  const bildirimler = useMemo<Bildirim[]>(() => {
    const liste: Bildirim[] = []

    for (const t of taramalar) {
      if (t.durum !== 'Planlandı' && t.durum !== 'Devam ediyor') continue
      const kalan = gunFarki(BUGUN, t.tarih)
      if (kalan === 0 || kalan === 1) {
        liste.push({
          id: `tar-${t.id}-${t.tarih}`,
          grup: 'bugun',
          ikon: HeartPulseIcon,
          baslik: `${t.firma}: ${kalan === 0 ? 'bugün' : 'yarın'} tarama`,
          detay: `${saatAraligi(t)} · ${t.lokasyon || 'Lokasyon yok'}`,
          ton: 'violet',
          to: `/panel/taramalar/${t.id}`,
        })
        const eksik = taramaEksikleri(t)
        if (eksik.length) {
          liste.push({
            id: `tar-eksik-${t.id}-${t.tarih}`,
            grup: 'bugun',
            ikon: CalendarClockIcon,
            baslik: `${t.firma}: hazırlık eksik`,
            detay: eksik.join(' · '),
            ton: 'amber',
            to: `/panel/taramalar/${t.id}`,
          })
        }
      } else if (kalan > 1 && kalan <= 7) {
        liste.push({
          id: `tar-hafta-${t.id}-${t.tarih}`,
          grup: 'hafta',
          ikon: HeartPulseIcon,
          baslik: `${t.firma}: ${kalan} gün sonra tarama`,
          detay: `${t.hizmet} · ${saatAraligi(t)}`,
          ton: 'violet',
          to: `/panel/taramalar/${t.id}`,
        })
      }
    }

    for (const t of teklifler) {
      const kalan = gunFarki(BUGUN, t.gecerlilik)
      if (t.durum === 'Gönderildi') {
        if (kalan >= 0 && kalan <= 7)
          liste.push({
            id: `tek-${t.id}-${t.gecerlilik}`,
            grup: kalan <= 1 ? 'bugun' : 'hafta',
            ikon: FileWarningIcon,
            baslik: `${t.firma}: teklif ${kalan === 0 ? 'bugün' : `${kalan} gün sonra`} geçersiz`,
            detay: `${t.no} · onay bekleniyor`,
            ton: 'amber',
            to: `/panel/teklifler/${t.id}`,
          })
      }
    }

    for (const e of ekipmanlar) {
      const kalan = gunFarki(BUGUN, e.kalibrasyonBitis)
      if (kalan < 0)
        liste.push({ id: `kal-${e.id}-${e.kalibrasyonBitis}`, grup: 'sorun', ikon: WrenchIcon, baslik: `${e.ad}: kalibrasyon süresi doldu`, detay: e.konum, ton: 'red', to: '/panel/ekipmanlar' })
      else if (kalan <= 30)
        liste.push({ id: `kal-${e.id}-${e.kalibrasyonBitis}`, grup: 'hafta', ikon: WrenchIcon, baslik: `${e.ad}: ${kalan} gün içinde kalibrasyon`, detay: e.konum, ton: 'amber', to: '/panel/ekipmanlar' })
      if (e.durum === 'Arızalı' || e.durum === 'Bakımda')
        liste.push({ id: `dur-${e.id}-${e.durum}`, grup: 'sorun', ikon: WrenchIcon, baslik: `${e.ad}: ${e.durum}`, detay: e.konum, ton: 'red', to: '/panel/ekipmanlar' })
    }

    return liste
  }, [ekipmanlar, teklifler, taramalar])

  const okunmayanSayisi = bildirimler.filter((b) => !okunan.has(b.id)).length

  /* Dışarı tıklama ve Escape ile kapanır */
  useEffect(() => {
    if (!acik) return
    const dis = (e: MouseEvent) => {
      if (kapsayici.current && !kapsayici.current.contains(e.target as Node)) setAcik(false)
    }
    const tus = (e: KeyboardEvent) => e.key === 'Escape' && setAcik(false)
    document.addEventListener('mousedown', dis)
    document.addEventListener('keydown', tus)
    return () => {
      document.removeEventListener('mousedown', dis)
      document.removeEventListener('keydown', tus)
    }
  }, [acik])

  const okunduYap = (id: string, deger: boolean) => {
    setOkunan((onceki) => {
      const yeni = new Set(onceki)
      if (deger) yeni.add(id)
      else yeni.delete(id)
      okunanlariYaz(yeni)
      return yeni
    })
  }

  const tumunuOkundu = () => {
    setOkunan((onceki) => {
      const yeni = new Set(onceki)
      bildirimler.forEach((b) => yeni.add(b.id))
      okunanlariYaz(yeni)
      return yeni
    })
  }

  const gorunen = yalnizYeni ? bildirimler.filter((b) => !okunan.has(b.id)) : bildirimler

  return (
    <div ref={kapsayici} className="relative">
      <button
        type="button"
        aria-label={`Bildirimler${okunmayanSayisi ? `, ${okunmayanSayisi} okunmamış` : ''}`}
        aria-expanded={acik}
        aria-haspopup="true"
        onClick={() => setAcik((v) => !v)}
        className="relative inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <BellIcon className="size-4" />
        {okunmayanSayisi > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-zinc-950 tabular-nums">
            {okunmayanSayisi}
          </span>
        )}
      </button>

      {acik && (
        <div role="dialog" aria-label="Bildirimler" className="absolute top-full right-0 z-50 mt-2 flex max-h-[min(32rem,calc(100dvh-6rem))] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg">
          <header className="flex shrink-0 items-center justify-between gap-2 border-b px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Bildirimler</p>
              <p className="text-[11px] text-muted-foreground tabular-nums">{okunmayanSayisi ? `${okunmayanSayisi} okunmamış` : 'Hepsi okundu'}</p>
            </div>
            <div className="inline-flex rounded-lg bg-muted p-0.5" role="group" aria-label="Filtre">
              {[
                { k: false, e: 'Tümü' },
                { k: true, e: 'Yeni' },
              ].map((f) => (
                <button
                  key={f.e}
                  type="button"
                  aria-pressed={yalnizYeni === f.k}
                  onClick={() => setYalnizYeni(f.k)}
                  className={cn('rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors', yalnizYeni === f.k ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                >
                  {f.e}
                </button>
              ))}
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {gorunen.length === 0 && (
              <div className="flex flex-col items-center gap-1.5 px-5 py-10 text-center">
                <CalendarClockIcon className="size-7 text-muted-foreground/50" />
                <p className="text-sm font-medium">{yalnizYeni ? 'Okunmamış bildirim yok' : 'Şu an bildirim yok'}</p>
                <p className="text-[11px] text-muted-foreground">Yaklaşan tarama, teklif ve ekipman işleri burada görünür.</p>
              </div>
            )}
            {GRUPLAR.map((g) => {
              const liste = gorunen.filter((b) => b.grup === g.k)
              if (!liste.length) return null
              return (
                <section key={g.k} aria-label={g.e}>
                  <p className="sticky top-0 z-10 bg-popover/95 px-3.5 pt-2.5 pb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase backdrop-blur">{g.e}</p>
                  <ul>
                    {liste.map((b) => {
                      const okundu = okunan.has(b.id)
                      return (
                        <li key={b.id} className="group flex items-start gap-2 px-2 py-0.5">
                          <Link
                            to={b.to}
                            onClick={() => {
                              okunduYap(b.id, true)
                              setAcik(false)
                            }}
                            className={cn('flex min-w-0 flex-1 items-start gap-2.5 rounded-lg px-1.5 py-2 transition-colors hover:bg-muted/60', okundu && 'opacity-60')}
                          >
                            <span className={cn('mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md', TON[b.ton])}>
                              <b.ikon className="size-3.5" />
                            </span>
                            <span className="min-w-0">
                              <span className={cn('block truncate text-xs', okundu ? 'font-normal' : 'font-semibold')}>{b.baslik}</span>
                              <span className="block truncate text-[11px] text-muted-foreground">{b.detay}</span>
                            </span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => okunduYap(b.id, !okundu)}
                            aria-label={okundu ? 'Okunmadı olarak işaretle' : 'Okundu olarak işaretle'}
                            title={okundu ? 'Okunmadı işaretle' : 'Okundu işaretle'}
                            className="mt-2.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors hover:border-amber-400"
                          >
                            {okundu ? <CheckCheckIcon className="size-3 text-muted-foreground" /> : <span className="size-2 rounded-full bg-amber-400" aria-hidden />}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </div>

          {okunmayanSayisi > 0 && (
            <footer className="shrink-0 border-t px-3.5 py-2">
              <button type="button" onClick={tumunuOkundu} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                <CheckCheckIcon className="size-3.5" /> Tümünü okundu işaretle
              </button>
            </footer>
          )}
        </div>
      )}
    </div>
  )
}
