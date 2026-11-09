import { useState } from 'react'
import { CalendarClockIcon, GraduationCapIcon, InfoIcon } from 'lucide-react'
import { CipGrup } from '@/components/list-bits'
import { cn } from '@/lib/utils'
import { TODAY } from '@/data/dashboard'
import type { EgitimAtama } from '@/data/personeller'
import { useEgitimlerStore } from '@/stores/egitimler-store'
import { egitimSuresiDakika } from '@/data/egitimler'
import { useFirmaKapsam, takipSatirlari } from './bits'

type Kapsam = ReturnType<typeof useFirmaKapsam>
const CIPLER = ['Tümü', 'Aktif', 'Süresi Doldu'] as const

/** Atama bazında durum sayıları */
const atamaOzet = (k: Kapsam, a: EgitimAtama) => {
  const satirlar = takipSatirlari(k).filter((s) => s.atamaId === a.id)
  const say = (d: string[]) => satirlar.filter((s) => d.includes(s.durum)).length
  return {
    toplam: satirlar.length,
    tamam: say(['Tamamlandı']),
    onayBekleyen: say(['Onay Bekliyor']),
    devam: say(['Devam Ediyor', 'İçerikler Tamamlandı', 'Sınav Bekleniyor', 'Sınav Başarılı']),
    baslamadi: satirlar.filter((s) => !s.sonErisim).length,
    basarisiz: say(['Sınav Başarısız']),
  }
}

/** Firma yalnızca izler; atama ve katılımcı ekleme İSG uzmanının işidir */
export default function FirmaEgitimlerPage() {
  const k = useFirmaKapsam()
  const egitimler = useEgitimlerStore((s) => s.egitimler)
  const [cip, setCip] = useState<(typeof CIPLER)[number]>('Tümü')

  const liste = k.atamalarim.filter((a) => {
    if (cip === 'Aktif') return a.durum === 'Aktif' && a.sonTarih >= TODAY
    if (cip === 'Süresi Doldu') return a.sonTarih < TODAY
    return true
  })

  return (
    <div className="mx-auto max-w-5xl p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Eğitimlerimiz</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {k.firma?.unvan} · {k.atamalarim.length} eğitim ataması
          </p>
        </div>
        <CipGrup secenekler={CIPLER} value={cip} onChange={setCip} />
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
        Eğitim atamaları ve yeni katılımcı eklemeleri İSG uzmanınız tarafından yapılır. Bu sayfada ilerlemeyi izleyebilirsiniz.
      </p>

      {liste.length === 0 ? (
        <div className="mt-6 flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed">
          <GraduationCapIcon className="size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">Bu filtrede eğitim ataması yok</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {liste.map((a) => {
            const e = egitimler.find((x) => x.id === a.egitimId)
            const sv = e?.surumler.find((s) => s.id === a.surumId)
            const o = atamaOzet(k, a)
            const yuzde = o.toplam ? Math.round((o.tamam / o.toplam) * 100) : 0
            const gecti = a.sonTarih < TODAY
            return (
              <section key={a.id} className="overflow-hidden rounded-2xl border bg-card">
                <div className="flex flex-wrap items-stretch">
                  <div
                    className={cn(
                      'hidden w-1.5 shrink-0 bg-gradient-to-b sm:block',
                      e?.kapakTon ?? 'from-amber-400 to-amber-600',
                    )}
                  />
                  <div className="min-w-0 flex-1 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-[15px] font-semibold">{e?.baslik ?? a.egitimId}</h2>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{e?.aciklama}</p>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                          <span>{e?.kategori}</span>
                          <span>{e ? egitimSuresiDakika(e) : '—'} dk</span>
                          <span>Sürüm {sv?.no ?? '?'}</span>
                          <span className={a.zorunlu ? 'font-medium text-amber-600 dark:text-amber-400' : ''}>
                            {a.zorunlu ? 'Zorunlu' : 'Opsiyonel'}
                          </span>
                        </p>
                      </div>
                      <div className="text-right text-[11px] text-muted-foreground">
                        <p>Atanma {a.atamaTarihi}</p>
                        <p className={cn('mt-0.5 flex items-center justify-end gap-1', gecti && 'text-red-500')}>
                          <CalendarClockIcon className="size-3" /> Son {a.sonTarih}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{o.toplam} çalışan</span>
                        <span className="font-medium text-foreground">%{yuzde} tamamlandı</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500" style={{ width: `${yuzde}%` }} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {[
                          [`${o.tamam} tamamladı`, 'text-emerald-600 dark:text-emerald-400'],
                          [`${o.onayBekleyen} İSG onayı bekliyor`, 'text-amber-600 dark:text-amber-400'],
                          [`${o.devam} devam ediyor`, 'text-amber-600 dark:text-amber-400'],
                          [`${o.baslamadi} başlamadı`, 'text-zinc-500'],
                          [`${o.basarisiz} başarısız`, 'text-red-500'],
                        ].map(([t, c]) => (
                          <span key={t} className={cn('rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-medium', c)}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
