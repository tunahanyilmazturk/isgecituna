import { useState } from 'react'
import { toast } from 'sonner'
import {
  CalendarClockIcon,
  CheckCircle2Icon,
  GraduationCapIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { CipGrup } from '@/components/list-bits'
import { cn } from '@/lib/utils'
import { TODAY } from '@/data/dashboard'
import type { EgitimAtama } from '@/data/personeller'
import { useEgitimlerStore } from '@/stores/egitimler-store'
import { usePersonelStore, personelAd } from '@/stores/personeller-store'
import { useAyarlarStore } from '@/stores/ayarlar-store'
import { useFirmaKapsam, useFIzin, useYetkili, takipSatirlari } from './bits'

type Kapsam = ReturnType<typeof useFirmaKapsam>
const CIPLER = ['Tümü', 'Aktif', 'Süresi Doldu'] as const

/** Atama bazında durum sayıları */
const atamaOzet = (k: Kapsam, a: EgitimAtama) => {
  const satirlar = takipSatirlari(k).filter((s) => s.atamaId === a.id)
  const say = (d: string[]) => satirlar.filter((s) => d.includes(s.durum)).length
  return {
    toplam: satirlar.length,
    tamam: say(['Tamamlandı', 'Onay Bekliyor']),
    devam: say(['Devam Ediyor', 'İçerikler Tamamlandı', 'Sınav Bekleniyor', 'Sınav Başarılı']),
    baslamadi: satirlar.filter((s) => !s.sonErisim).length,
    basarisiz: say(['Sınav Başarısız']),
  }
}

export default function FirmaEgitimlerPage() {
  const k = useFirmaKapsam()
  const egitimler = useEgitimlerStore((s) => s.egitimler)
  const ekleIzni = useFIzin('egitim.ekle')
  const [cip, setCip] = useState<(typeof CIPLER)[number]>('Tümü')
  const [ekleAcik, setEkleAcik] = useState<EgitimAtama | null>(null)

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
                          <span>{e?.sureDakika} dk</span>
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
                          [`${o.devam} devam ediyor`, 'text-amber-600 dark:text-amber-400'],
                          [`${o.baslamadi} başlamadı`, 'text-zinc-500'],
                          [`${o.basarisiz} başarısız`, 'text-red-500'],
                        ].map(([t, c]) => (
                          <span key={t} className={cn('rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-medium', c)}>
                            {t}
                          </span>
                        ))}
                        <div className="ml-auto">
                          {a.firmaEkleyebilir && a.durum === 'Aktif' ? (
                            ekleIzni ? (
                              <Button size="sm" variant="outline" onClick={() => setEkleAcik(a)}>
                                <UserPlusIcon /> Katılımcı ekle
                              </Button>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Katılımcı ekleme yetkiniz yok</span>
                            )
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              {a.durum !== 'Aktif' ? 'Atama pasif' : 'Katılımcı eklemeye kapalı'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      )}

      {ekleAcik && <KatilimciDrawer a={ekleAcik} k={k} onKapat={() => setEkleAcik(null)} />}
    </div>
  )
}

/** Katılımcı ekleme — yalnız firmanın aktif çalışanları; mükerrer atama engeli store'da */
function KatilimciDrawer({ a, k, onKapat }: { a: EgitimAtama; k: Kapsam; onKapat: () => void }) {
  const egitimler = useEgitimlerStore((s) => s.egitimler)
  const { atamaKatilimciEkle } = usePersonelStore()
  const yetkili = useYetkili()
  const logEkle = useAyarlarStore((s) => s.logEkle)
  const [secili, setSecili] = useState<Set<string>>(new Set())
  const [ara, setAra] = useState('')
  const e = egitimler.find((x) => x.id === a.egitimId)

  const adaylar = k.calisanlar.filter(
    (p) =>
      p.durum === 'Aktif' &&
      (!ara.trim() || `${p.ad} ${p.soyad} ${p.departman}`.toLowerCase().includes(ara.trim().toLowerCase())),
  )
  const uygun = adaylar.filter((p) => !a.personelIds.includes(p.id))

  const ekle = () => {
    const kim = `${yetkili?.ad} ${yetkili?.soyad}`
    const eklenen = atamaKatilimciEkle(a.id, [...secili], kim)
    if (eklenen > 0) {
      logEkle({
        tarih: new Date().toISOString(),
        kullanici: kim,
        islem: 'Eğitime katılımcı eklendi (firma portalı)',
        kayit: `${e?.baslik} · ${eklenen} çalışan · ${k.firma?.unvan}`,
      })
      toast.success(`${eklenen} çalışan eğitime eklendi`)
    } else {
      toast.info('Tüm seçilenler zaten bu atamada')
    }
    onKapat()
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onKapat()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetTitle className="sr-only">Katılımcı Ekle</SheetTitle>
        <div className="flex h-full flex-col p-5">
          <h2 className="text-base font-semibold">Katılımcı Ekle</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {e?.baslik} · {k.firma?.kisaAd} · yalnız kendi çalışanlarınız
          </p>
          <input
            value={ara}
            onChange={(ev) => setAra(ev.target.value)}
            placeholder="Çalışan ara…"
            className="mt-4 h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
          />
          <div className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto">
            {uygun.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Eklenebilecek aktif çalışan yok — hepsi bu atamada olabilir.
              </p>
            )}
            {adaylar.map((p) => {
              const zaten = a.personelIds.includes(p.id)
              return (
                <label
                  key={p.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm',
                    zaten ? 'border-transparent bg-muted/40 text-muted-foreground' : 'cursor-pointer hover:bg-muted/40',
                  )}
                >
                  <input
                    type="checkbox"
                    disabled={zaten}
                    checked={zaten || secili.has(p.id)}
                    onChange={(ev) => {
                      const y = new Set(secili)
                      if (ev.target.checked) y.add(p.id)
                      else y.delete(p.id)
                      setSecili(y)
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{personelAd(p)}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {p.departman || '—'} · {zaten ? 'Bu atamada zaten var' : p.gorev || '—'}
                    </span>
                  </span>
                  {zaten && <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />}
                </label>
              )
            })}
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <p className="text-xs text-muted-foreground">{secili.size} çalışan seçildi</p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onKapat}>Vazgeç</Button>
              <Button disabled={!secili.size} onClick={ekle}>
                <UsersIcon /> Ekle
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
